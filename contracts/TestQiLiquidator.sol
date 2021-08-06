pragma solidity >= 0.6.12;

import { IQiLiquidator } from "./Interfaces.sol";

contract TestQiLiquidator is IQiLiquidator {

  function getPaid() external override{}

  function checkLiquidation (uint256 _vaultId) external view override{}

  function checkCost (uint256 _vaultId) external view override returns(uint256){
      return 1000;
  }

  function liquidateVault(uint256 _vaultId) external override{}

}