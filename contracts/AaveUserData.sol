pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import { ILendingPool, IERC20, IReserve } from "./Interfaces.sol";
import { DataTypes } from "./Libraries.sol";

contract AaveUserData {
    address lendingPool;
    uint256 internal constant BORROWING_MASK = 0x5555555555555555555555555555555555555555555555555555555555555555;
    uint256 constant LIQUIDATION_THRESHOLD_MASK = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF0000FFFF; // prettier-ignore
    uint256 constant LIQUIDATION_THRESHOLD_START_BIT_POSITION = 16;
    struct UserReserve {
        string symbol;
        address reserveAddress;
        bool isBorrowed;
        //uint256 debtETH;
        uint256 debtBalance;
        bool isCollateral;
        //uint256 collateralETH;
        uint256 collateralBalance; 
        uint256 liquidationThreshold;
    }
    
    constructor(address _lendingPool) public {        
        lendingPool = _lendingPool;
    }

    function getUserData(address user) public view returns(
      uint256 totalCollateralETH,
      uint256 totalDebtETH,
      uint256 availableBorrowsETH,
      uint256 currentLiquidationThreshold,
      //uint256 ltv,
      uint256 healthFactor,
      uint256 blockNumber,
      UserReserve[] memory
    ){
        (
            totalCollateralETH,
            totalDebtETH,
            availableBorrowsETH,
            currentLiquidationThreshold,
            ,
            healthFactor
        ) = ILendingPool(lendingPool).getUserAccountData(user);

        address[] memory reserves = ILendingPool(lendingPool).getReservesList();
        UserReserve[] memory userReserves = new UserReserve[](reserves.length);

        DataTypes.UserConfigurationMap memory userConfiguration = ILendingPool(lendingPool).getUserConfiguration(user);   

        if(isBorrowingAny(userConfiguration)){
            for(uint256 i = 0; i < reserves.length; i++){
                if(isUsingAsCollateralOrBorrowing(userConfiguration, i)){

                    UserReserve memory userReserve = UserReserve({
                        symbol: IReserve(reserves[i]).symbol(),
                        reserveAddress: reserves[i],
                        isBorrowed: isBorrowing(userConfiguration, i),
                        isCollateral: isUsingAsCollateral(userConfiguration, i),
                        debtBalance: getDebtBalance(user, reserves[i]),
                        collateralBalance: getCollateralalance(user,reserves[i]),
                        liquidationThreshold: getLiquidationThreshold(ILendingPool(lendingPool).getConfiguration(reserves[i]))
                    });

                    userReserves[i] = userReserve; 
                }        
            }
        }   

        return (
            totalCollateralETH,
            totalDebtETH,
            availableBorrowsETH,
            currentLiquidationThreshold,
            //ltv,
            healthFactor,
            block.number,
            userReserves
        );
    }

    function getDebtBalance(address user, address reserve) public view returns (uint256){
        DataTypes.ReserveData memory reserveData = ILendingPool(lendingPool).getReserveData(reserve);

        return IERC20(reserveData.variableDebtTokenAddress).balanceOf(user);
    }

    function getCollateralalance(address user, address reserve) public view returns (uint256){
        DataTypes.ReserveData memory reserveData = ILendingPool(lendingPool).getReserveData(reserve);

        return IERC20(reserveData.aTokenAddress).balanceOf(user);
    }

    function isUsingAsCollateralOrBorrowing(DataTypes.UserConfigurationMap memory self, uint256 reserveIndex)
        internal
        pure
    returns (bool)
    {
        return (self.data >> (reserveIndex * 2)) & 3 != 0;
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

    function isBorrowingAny(DataTypes.UserConfigurationMap memory self) internal pure returns (bool) {
        return self.data & BORROWING_MASK != 0;
    }

    function getLiquidationThreshold(DataTypes.ReserveConfigurationMap memory self)
        internal
        view
    returns (uint256)
    {
        return (self.data & ~LIQUIDATION_THRESHOLD_MASK) >> LIQUIDATION_THRESHOLD_START_BIT_POSITION;
    }
}