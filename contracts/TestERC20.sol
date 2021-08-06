pragma solidity ^0.6.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestERC20 is ERC20{
    constructor (string memory name, string memory symbol, uint8 decimals) public ERC20(name,symbol){

        if(decimals != 18){
            _setupDecimals(decimals);
        }

        _mint(msg.sender, uint256(1000000) * (uint256(10)** uint256(decimals)));
    }
}