pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;


import "./Ownable.sol";
import { FlashLoanReceiverBase } from "./FlashLoanReceiverBase.sol";

import { ILendingPool, ILendingPoolAddressesProvider, IUniswapV2Router02, IERC20} from "./Interfaces.sol";
import { SafeMath, DataTypes } from "./Libraries.sol";

contract AaveLiquidator is FlashLoanReceiverBase, Ownable {
    using SafeMath for uint256;

    ILendingPoolAddressesProvider aaveLendingPoolAddressProvider;
    IUniswapV2Router02 quickSwapRouter;

    address aaveLendingPoolAddress;

    mapping (address => bool) approvedAddresses;

    constructor(
            IUniswapV2Router02 _quickSwapRouter, 
            ILendingPoolAddressesProvider _aaveLendingPoolAddressProvider
        ) 
        FlashLoanReceiverBase(_aaveLendingPoolAddressProvider) public {     
            aaveLendingPoolAddressProvider = _aaveLendingPoolAddressProvider;
            aaveLendingPoolAddress = aaveLendingPoolAddressProvider.getLendingPool();
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


        for (uint i = 0; i < assets.length; i++) {
            uint amountOwing = amounts[i].add(premiums[i]);
            IERC20(assets[i]).approve(aaveLendingPoolAddress, amountOwing);
        }

        return true;
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