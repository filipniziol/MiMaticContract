pragma solidity >= 0.6.12;

import "./Ownable.sol";
import { FlashLoanReceiverBase } from "./FlashLoanReceiverBase.sol";
import { IQiLiquidatorV2, IUniswapV2Router02, ILendingPool, ILendingPoolAddressesProvider, ICamToken, IAmToken, IERC20 } from "./Interfaces.sol";
import { SafeMath } from "./Libraries.sol";

import "hardhat/console.sol";

contract MiMaticLiquidateCamToken is FlashLoanReceiverBase, Ownable {

    using SafeMath for uint256;

    ILendingPoolAddressesProvider aaveLendingPoolAddressProvider;
    IUniswapV2Router02 quickSwapRouter;
    IERC20 usdc;
    IERC20 miMatic;

    address aaveLendingPoolAddress;

    uint256 liquidatedVault;
    uint256 liquidationCost; 
    uint256 borrowedUsdc; 
    uint timestamp; 
    address liquidatedToken; 
    address qiLiquidator;
    address amToken;
    address camToken;
    uint256 camTokenShare;
    uint256 amTokenBalance;

    mapping (address => bool) approvedAddresses;

    constructor(
            IUniswapV2Router02 _quickSwapRouter, 
            ILendingPoolAddressesProvider _aaveLendingPoolAddressProvider, 
            IERC20 _usdc, 
            IERC20 _miMatic
        ) 
        FlashLoanReceiverBase(_aaveLendingPoolAddressProvider) public {     
            aaveLendingPoolAddressProvider = _aaveLendingPoolAddressProvider;
            aaveLendingPoolAddress = aaveLendingPoolAddressProvider.getLendingPool();
            quickSwapRouter = _quickSwapRouter;
            usdc = _usdc;
            miMatic = _miMatic;
    }

    modifier onlyApprovedAccounts() {
        require(approvedAddresses[msg.sender] == true, "Must be called by approved addresses");
        _;
    }

    modifier onlyApprovedAccountsOrLendingPool() {
        require(approvedAddresses[msg.sender] == true || msg.sender == aaveLendingPoolAddress , "Must be called by approved addresses or by lending pool");
        _;
    }

    function approveAddresses(address[] memory addressesToApprove) public onlyOwner{
        for(uint index=0; index<addressesToApprove.length; index++){
            approvedAddresses[addressesToApprove[index]] = true;
        }
    }

    function executeFlashLoan(address _asset, uint256 _amount) public onlyApprovedAccounts {
        address receiverAddress = address(this);

        address[] memory assets = new address[](1);
        assets[0] = _asset; 

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = _amount;

        uint256[] memory modes = new uint256[](1);
        modes[0] = 0;

        address onBehalfOf = address(this);
        bytes memory params = "";
        uint16 referralCode = 0;

        _lendingPool.flashLoan(
            receiverAddress,
            assets,
            amounts,
            modes,
            onBehalfOf,
            params,
            referralCode
        );
    }

    function liquidateVault(
        uint256 _vaultId, 
        uint _timestamp, 
        address _liquidatedToken, 
        address _qiLiquidator, 
        address _amToken, 
        address _camToken
        ) public onlyApprovedAccounts{

        require(IQiLiquidatorV2(_qiLiquidator).checkLiquidation(_vaultId),"The vault is not for liquidation");

        //18 decimals
        uint256 _liquidationCost = IQiLiquidatorV2(_qiLiquidator).checkCost(_vaultId);

        //6 decimals
        uint256 _borrowedUsdc = _liquidationCost.mul(1025).div(1000).div(10**12);

        liquidatedVault = _vaultId;
        liquidationCost = _liquidationCost;
        borrowedUsdc = _borrowedUsdc;
        timestamp = _timestamp;
        liquidatedToken = _liquidatedToken;
        qiLiquidator = _qiLiquidator;
        amToken = _amToken;
        camToken = _camToken;

        executeFlashLoan(address(usdc), _borrowedUsdc);
    }

    function approveSwap(address addressToApprove, address asset, uint256 amount) public onlyApprovedAccounts{
        IERC20(asset).approve(addressToApprove,amount);
    }

    function executeOperation (
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata premiums,
        address initiator,
        bytes calldata params
    )
        external
        override
        returns (bool)
    {
        require(msg.sender == aaveLendingPoolAddress, "Must be called by the lending pool");

        // Swapping USDC to miMATIC
        IERC20(address(usdc)).approve(aaveLendingPoolAddress,borrowedUsdc);
        executeSwapTokensForTokens(address(this), address(usdc),borrowedUsdc,address(miMatic),liquidationCost,timestamp);

        // Vault liquidation
        IERC20(address(miMatic)).approve(address(qiLiquidator),liquidationCost);
        
        IQiLiquidatorV2(qiLiquidator).liquidateVault(liquidatedVault);

        //Here we receive tokens
        IQiLiquidatorV2(qiLiquidator).getPaid();

        //calculate cam token share and leave cam token and get am token
        camTokenShare = ICamToken(camToken).balanceOf(address(this));
        ICamToken(camToken).leave(camTokenShare);

        //withdraw Token
        ILendingPool(aaveLendingPoolAddress).withdraw(liquidatedToken, type(uint).max, address(this));            

        uint256 liquidatedTokenBalance = IERC20(liquidatedToken).balanceOf(address(this));

        //We exchange all tokens for USDC
        executeSwapTokensForTokens(address(this),liquidatedToken,liquidatedTokenBalance,address(usdc),borrowedUsdc,timestamp);

        for (uint i = 0; i < assets.length; i++) {
            uint amountOwing = amounts[i].add(premiums[i]);
            IERC20(assets[i]).approve(aaveLendingPoolAddress, amountOwing);
        }

        return true;
    }

    function executeSwapTokensForTokens(address to, address _assetIn, uint256 _amountIn, address _assetOut, uint256 amountOutMin, uint _timestamp) public onlyApprovedAccountsOrLendingPool{
        uint deadline = _timestamp + 30;
        address[] memory path = new address[](2);
        path[0] = _assetIn;
        path[1] = _assetOut;

        IERC20(_assetIn).approve(address(quickSwapRouter),_amountIn);

        quickSwapRouter.swapExactTokensForTokens(_amountIn, amountOutMin, path, to, deadline);
    }


    function executeSwapMaticForTokens(address to, uint256 _amountIn, address _assetOut, uint256 amountOutMin, uint _timestamp) public onlyApprovedAccountsOrLendingPool {
        uint deadline = _timestamp + 30;
        address[] memory path = new address[](2);
        path[0] = quickSwapRouter.WETH();
        path[1] = _assetOut;

        quickSwapRouter.swapExactETHForTokens{value: _amountIn}(amountOutMin, path, to, deadline);
    }


    function rugPull() public payable onlyOwner {
        
        // withdraw all ETH
        msg.sender.call{ value: address(this).balance }("");
        
        // withdraw all x ERC20 tokens
        usdc.transfer(msg.sender, usdc.balanceOf(address(this)));
        miMatic.transfer(msg.sender, miMatic.balanceOf(address(this)));
    }

    function withdrawToken(IERC20 token) public payable onlyOwner {
        
        // withdraw all x ERC20 tokens
        token.transfer(msg.sender, token.balanceOf(address(this)));
    }
}

