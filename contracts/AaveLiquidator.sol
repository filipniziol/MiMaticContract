pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;


import "./Ownable.sol";
import { FlashLoanReceiverBase } from "./FlashLoanReceiverBase.sol";

import { ILendingPool, ILendingPoolAddressesProvider, IUniswapV2Router02, IERC20, IPriceOracleGetter} from "./Interfaces.sol";
import { SafeMath, DataTypes, ReserveConfiguration } from "./Libraries.sol";

contract AaveLiquidator is FlashLoanReceiverBase, Ownable {
    using SafeMath for uint256;

    ILendingPoolAddressesProvider aaveLendingPoolAddressProvider;
    IUniswapV2Router02 quickSwapRouter;

    address aaveLendingPoolAddress;
    address aavePriceOracleAddress;

    address liquidatedUser;
    address liquidatedAsset;
    uint256 liquidatedAmount;
    address receivedAsset;

    mapping (address => bool) approvedAddresses;

    constructor(
            IUniswapV2Router02 _quickSwapRouter, 
            ILendingPoolAddressesProvider _aaveLendingPoolAddressProvider
        ) 
        FlashLoanReceiverBase(_aaveLendingPoolAddressProvider) public {     
            aaveLendingPoolAddressProvider = _aaveLendingPoolAddressProvider;
            aaveLendingPoolAddress = aaveLendingPoolAddressProvider.getLendingPool();
            aavePriceOracleAddress = aaveLendingPoolAddressProvider.getPriceOracle();
            quickSwapRouter = _quickSwapRouter;
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

    function liquidateUser(address _liquidatedUser) public onlyApprovedAccounts{
        (,,,,,uint256 healthFactor) = ILendingPool(aaveLendingPoolAddress).getUserAccountData(_liquidatedUser);
        
        require(healthFactor < 10**18,"Health factor must be lower than 1");

        (liquidatedAsset,liquidatedAmount,receivedAsset) = this.getLiquidatedUserDetails(_liquidatedUser);

        liquidatedUser = _liquidatedUser;

        executeFlashLoan(liquidatedAsset, liquidatedAmount);
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

        //liquidate loan
        IERC20(liquidatedAsset).approve(address(aaveLendingPoolAddress), liquidatedAmount);
        ILendingPool(aaveLendingPoolAddress).liquidationCall(receivedAsset,liquidatedAsset,liquidatedUser,liquidatedAmount, false);

        //swap received asset to borrowed asset to pay back the flash loan
        if(receivedAsset != liquidatedAsset){
            executeSwapTokensForTokens(address(this),receivedAsset,IERC20(receivedAsset).balanceOf(address(this)),liquidatedAsset,liquidatedAmount);
        }


        for (uint i = 0; i < assets.length; i++) {
            uint amountOwing = amounts[i].add(premiums[i]);
            IERC20(assets[i]).approve(aaveLendingPoolAddress, amountOwing);
        }

        return true;
    }

    function executeSwapTokensForTokens(address to, address _assetIn, uint256 _amountIn, address _assetOut, uint256 amountOutMin) public onlyApprovedAccountsOrLendingPool{
        uint deadline = block.timestamp + 300; // 5 minutes
        address[] memory path = new address[](2);
        path[0] = _assetIn;
        path[1] = _assetOut;

        IERC20(_assetIn).approve(address(quickSwapRouter),_amountIn);

        quickSwapRouter.swapExactTokensForTokens(_amountIn, amountOutMin, path, to, deadline);
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

        ILendingPool(aaveLendingPoolAddress).flashLoan(
            receiverAddress,
            assets,
            amounts,
            modes,
            onBehalfOf,
            params,
            referralCode
        );
    }

    struct GetLiquidatedUserDetailsVars {
        address _liquidatedAsset;
        uint256 _liquidatedAmount;
        address _receivedAsset;

        address tempDebtAsset;
        uint256 tempDebtAssetAmount;
        uint256 tempDebtAssetAmountETH;
        address tempCollateralAsset;
        uint256 tempCollateralAssetAmountETH;

        uint256 decimals;
        uint256 tokenUnit;
        uint256 reserveUnitPrice;

        address currentDebtAsset;
        uint256 currentDebtAssetAmount;
        uint256 currentDebtAssetAmountETH;

        address currentCollateralAsset;
        uint256 currentCollateralAmount;
        uint256 currentCollateralAmountETH;
    }

    function getLiquidatedUserDetails(address _liquidatedUser) public view returns(
        address,
        uint256,
        address
    ){
        GetLiquidatedUserDetailsVars memory vars;

        address[] memory reserves = ILendingPool(aaveLendingPoolAddress).getReservesList();
    
        DataTypes.UserConfigurationMap memory userConfiguration = ILendingPool(aaveLendingPoolAddress).getUserConfiguration(_liquidatedUser); 

        for(uint256 i = 0; i < reserves.length; i++){
            DataTypes.ReserveData memory reserveData = ILendingPool(aaveLendingPoolAddress).getReserveData(reserves[i]);
            (,,,vars.decimals,) = ReserveConfiguration.getParamsMemory(reserveData.configuration);

            vars.tokenUnit = 10**vars.decimals;
            vars.reserveUnitPrice = IPriceOracleGetter(aavePriceOracleAddress).getAssetPrice(reserves[i]);
            if(isBorrowing(userConfiguration, i)){
                vars.currentDebtAsset = reserves[i];
                vars.currentDebtAssetAmount = IERC20(reserveData.variableDebtTokenAddress).balanceOf(_liquidatedUser);
                vars.currentDebtAssetAmountETH = vars.reserveUnitPrice.mul(vars.currentDebtAssetAmount).div(vars.tokenUnit);

                if(vars.currentDebtAssetAmountETH > vars.tempDebtAssetAmountETH){
                   vars.tempDebtAsset = vars.currentDebtAsset;
                   vars.tempDebtAssetAmount = vars.currentDebtAssetAmount;
                   vars.tempDebtAssetAmountETH = vars.currentDebtAssetAmountETH; 
                }

            }
            if(isUsingAsCollateral(userConfiguration, i)){
                vars.currentCollateralAsset = reserves[i];
                vars.currentCollateralAmount = IERC20(reserveData.aTokenAddress).balanceOf(_liquidatedUser);
                vars.currentCollateralAmountETH = vars.reserveUnitPrice.mul(vars.currentCollateralAmount).div(vars.tokenUnit);

                if(vars.currentCollateralAmountETH > vars.tempCollateralAssetAmountETH){
                    vars.tempCollateralAsset = vars.currentCollateralAsset;
                    vars.tempCollateralAssetAmountETH = vars.currentCollateralAmountETH;
                }
            }
        }

        vars._liquidatedAsset = vars.tempDebtAsset;
        vars._liquidatedAmount = vars.tempDebtAssetAmount / 2;
        vars._receivedAsset = vars.tempCollateralAsset;

        return (
            vars._liquidatedAsset,
            vars._liquidatedAmount,
            vars._receivedAsset
        );
    }

    function isBorrowing(DataTypes.UserConfigurationMap memory self, uint256 reserveIndex)
        internal
        pure
    returns (bool)
    {
        return (self.data >> (reserveIndex * 2)) & 1 != 0;
    }

    function isUsingAsCollateral(DataTypes.UserConfigurationMap memory self, uint256 reserveIndex)
        internal
        pure
    returns (bool)
    {
        return (self.data >> (reserveIndex * 2 + 1)) & 1 != 0;
    }

    function withdrawMatic() public payable onlyOwner {
        
        // withdraw all MATIC
        msg.sender.call{ value: address(this).balance }("");
    }



    function withdrawToken(IERC20 token) public payable onlyOwner {
        
        // withdraw all x ERC20 tokens
        token.transfer(msg.sender, token.balanceOf(address(this)));
    }

}