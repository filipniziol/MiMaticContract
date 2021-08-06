pragma solidity 0.6.12;

import { IFlashLoanReceiver, IERC20 } from "./Interfaces.sol";
import { SafeMath } from "./Libraries.sol";

contract TestLendingPool{
    using SafeMath for uint256;

    //bytes calldata params
    function flashLoan(
        address receiverAddres,
        address[] calldata assets,
        uint256[] calldata amounts,
        uint256[] calldata modes,
        address onBehalfOf,
        bytes calldata params,
        uint16 referralCode
    ) public{
        IERC20(assets[0]).transfer(receiverAddres, amounts[0]); 

        uint256[] memory premiums = new uint256[](1);
        premiums[0] = amounts[0].mul(900).div(100000);

        IFlashLoanReceiver(msg.sender).executeOperation(
            assets, 
            amounts, 
            premiums, 
            address(this), 
            params);

        IERC20(assets[0]).transferFrom(msg.sender, address(this), amounts[0].add(premiums[0]));
    }

    receive() external payable {}
}