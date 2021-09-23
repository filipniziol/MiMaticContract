pragma solidity >= 0.6.12;

import "./Ownable.sol";
import { FlashLoanReceiverBase } from "./FlashLoanReceiverBase.sol";
import { ILendingPool, ILendingPoolAddressesProvider, IERC20, IIronSwap, ICurve } from "./Interfaces.sol";
import { SafeMath } from "./Libraries.sol";

contract IronFinanceProcessor is FlashLoanReceiverBase, Ownable {
    using SafeMath for uint256;

    ILendingPoolAddressesProvider lendingPoolAddressProvider;
    address usdc = 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174;
    address usdt = 0xc2132D05D31c914a87C6611C10748AEb04B58e8F;
    address dai = 0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063;

    uint256 usdcAmount;
    uint256 usdtAmount;

    address lendingPoolAddress;

    address curveExchange = 0x1d8b86e3D88cDb2d34688e87E72F388Cb541B7C8;

    address ironFinanceCoins = 0x837503e8A8753ae17fB8C8151B8e6f586defCb57;
    address ironFinanceIron = 0xCaEb732167aF742032D13A9e76881026f91Cd087;

    address ironIS3USD = 0xb4d09ff3dA7f9e9A2BA029cb0A81A989fd7B8f17;
    address ironIS3USDLP = 0x985D40feDAA3208DAbaCDFDCA00CbeAAc9543949;

    uint256 usdcCurrentAmount;
    uint256 usdtCurrentAmount;

    uint256 usdcExpectedAmount;
    uint256 usdtExpectedAmount;

    uint256 neededUsdcAmount;
    uint256 neededUsdtAmount;

    uint256 daiCurrentAmount;

    uint256 IS3USDBalance;
    uint256 ironIS3USDLPBalance;
    uint256 ironIS3USDBalance;

    constructor(
            ILendingPoolAddressesProvider _lendingPoolAddressProvider
        ) 
        FlashLoanReceiverBase(_lendingPoolAddressProvider) public {        
            lendingPoolAddressProvider = _lendingPoolAddressProvider;
            lendingPoolAddress = lendingPoolAddressProvider.getLendingPool();
    }

    function process(
        uint256 _usdcAmount,
        uint256 _usdtAmount
    ) public {
        address receiverAddress = address(this);

        usdcAmount = _usdcAmount;
        usdtAmount = _usdtAmount;

        address[] memory assets = new address[](3);
        assets[0] = usdc; 
        assets[1] = usdt; 
        assets[2] = dai;

        uint256[] memory amounts = new uint256[](3);
        amounts[0] = usdcAmount;
        amounts[1] = usdtAmount;
        amounts[2] = 0;

        uint256[] memory modes = new uint256[](3);
        modes[0] = 0;
        modes[1] = 0;
        modes[2] = 0;

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
        require(msg.sender == lendingPoolAddress, "Lending pool only");

        for (uint i = 0; i < assets.length; i++) {
            IERC20(assets[i]).approve(ironFinanceCoins, type(uint256).max);
        }
        IIronSwap(ironFinanceCoins).addLiquidity(amounts, 0, now + 300);

        IERC20(ironIS3USD).approve(ironFinanceIron, type(uint256).max);
        IS3USDBalance = IERC20(ironIS3USD).balanceOf(address(this));
        uint256[] memory addedAmounts = new uint256[](2);
        addedAmounts[0] = IS3USDBalance;
        addedAmounts[1] = 0;
        IIronSwap(ironFinanceIron).addLiquidity(addedAmounts, 0, now + 300);

        ironIS3USDLPBalance = IERC20(ironIS3USDLP).balanceOf(address(this));
        IERC20(ironIS3USDLP).approve(ironFinanceIron, type(uint256).max);
        IIronSwap(ironFinanceIron).removeLiquidityOneToken(ironIS3USDLPBalance, 0, 0, now + 300);

        ironIS3USDBalance = IERC20(ironIS3USD).balanceOf(address(this));
        uint256[] memory minAmounts = new uint256[](3);
        minAmounts[0] = 0;
        minAmounts[1] = 0;
        minAmounts[2] = 0;
        IERC20(ironIS3USD).approve(ironFinanceCoins, type(uint256).max);
        IIronSwap(ironFinanceCoins).removeLiquidity(ironIS3USDBalance, minAmounts, now + 300);

        usdcCurrentAmount = IERC20(usdc).balanceOf(address(this));
        usdtCurrentAmount = IERC20(usdt).balanceOf(address(this));

        usdcExpectedAmount = amounts[0].add(premiums[0]);
        usdtExpectedAmount = amounts[1].add(premiums[1]);

        IERC20(dai).approve(curveExchange,type(uint256).max);
        if(usdcExpectedAmount > usdcCurrentAmount){
            neededUsdcAmount = usdcExpectedAmount.sub(usdcCurrentAmount);
            ICurve(curveExchange).exchange_underlying(0,1,neededUsdcAmount.mul(10**12).mul(10005).div(10000),neededUsdcAmount);
        }

        daiCurrentAmount = IERC20(dai).balanceOf(address(this));
        if(usdtExpectedAmount > usdtCurrentAmount){
            neededUsdtAmount = usdtExpectedAmount.sub(usdtCurrentAmount);
            ICurve(curveExchange).exchange_underlying(0,2,daiCurrentAmount,neededUsdtAmount);
        }

        for (uint i = 0; i < assets.length; i++) {
            uint amountOwing = amounts[i].add(premiums[i]);
            IERC20(assets[i]).approve(lendingPoolAddress, amountOwing);
        }

        return true;
    }

    function withdrawToken(IERC20 token) public payable onlyOwner {
        
        // withdraw all x ERC20 tokens
        token.transfer(msg.sender, token.balanceOf(address(this)));
    }
}
