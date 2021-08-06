// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.6.12;

import {Ownable} from './Ownable.sol';

import {ILendingPoolAddressesProvider} from './Interfaces.sol';

/**
 * @title LendingPoolAddressesProvider contract
 * @dev Main registry of addresses part of or connected to the protocol, including permissioned roles
 * - Acting also as factory of proxies and admin of those, so with right to change its implementations
 * - Owned by the Aave Governance
 * @author Aave
 **/
contract TestLendingPoolAddressesProvider is Ownable, ILendingPoolAddressesProvider {
  string private _marketId;
  mapping(bytes32 => address) private _addresses;

  address lendingPool;

  constructor(address _lendingPool) public {            
    lendingPool = _lendingPool;
  }

  function getMarketId() external view returns (string memory) {
    return _marketId;
  }

  function setMarketId(string memory marketId) external onlyOwner {}

  function setAddressAsProxy(bytes32 id, address implementationAddress)
    external
    override
    onlyOwner
  {}

  function setAddress(bytes32 id, address newAddress) external override onlyOwner {}

  function getAddress(bytes32 id) public view override returns (address) {}

  function getLendingPool() external view override returns (address) {
    return lendingPool;
  }

  function setLendingPoolImpl(address pool) external override onlyOwner {
  }

  /**
   * @dev Returns the address of the LendingPoolConfigurator proxy
   * @return The LendingPoolConfigurator proxy address
   **/
  function getLendingPoolConfigurator() external view override returns (address) {
    return lendingPool;
  }

  function setLendingPoolConfiguratorImpl(address configurator) external override onlyOwner {
  }

  function getLendingPoolCollateralManager() external view override returns (address) {
    return lendingPool;
  }

  function setLendingPoolCollateralManager(address manager) external override onlyOwner {
  }

  function getPoolAdmin() external view override returns (address) {
    return lendingPool;
  }

  function setPoolAdmin(address admin) external override onlyOwner {
  }

  function getEmergencyAdmin() external view override returns (address) {
    return lendingPool;
  }

  function setEmergencyAdmin(address emergencyAdmin) external override onlyOwner {
  }

  function getPriceOracle() external view override returns (address) {
    return lendingPool;
  }

  function setPriceOracle(address priceOracle) external override onlyOwner {
  }

  function getLendingRateOracle() external view override returns (address) {
    return lendingPool;
  }

  function setLendingRateOracle(address lendingRateOracle) external override onlyOwner {
  }

  function _setMarketId(string memory marketId) internal {
  }
}