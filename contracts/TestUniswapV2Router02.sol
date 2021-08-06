pragma solidity 0.6.12;

import { IERC20 } from "./Interfaces.sol";

contract TestUniswapV2Router02 {
    function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)
        external
        payable
        returns (uint[] memory amounts){

        //IERC20(path[1]).transfer(to, amountOutMin);

        return new uint256[](1);
    }

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) public returns (uint[] memory amounts){

        //IERC20(path[0]).transferFrom(msg.sender, address(this), amountIn);
        //IERC20(path[1]).transfer(to, amountOutMin);

        return new uint256[](1);
    }

    function WETH() external pure returns (address){
        return address(0);
    }
}