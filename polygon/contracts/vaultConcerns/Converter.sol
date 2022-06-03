// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import '../libraries/UniswapV2Library.sol';
import '../interfaces/IUniswapV2Router02.sol';
import '../interfaces/IUniswapV2Pair.sol';

contract Converter {
    address immutable public paymentToken;
    address immutable public sushiRouter;

    event TokenConverted(uint256[] amounts);
    event NativeCurrencyConverted(uint256[] amounts);

    constructor(address _sushiRouter, address _paymentToken) {
        sushiRouter = _sushiRouter;
        paymentToken = _paymentToken;
    }

    function _convertERC20(address _cptc) internal {
        uint amountIn = IERC20(paymentToken).balanceOf(address(this));
        require(amountIn > 0, "No token balance to convert");

        IERC20(paymentToken).approve(sushiRouter, amountIn);

        address wrappedNativeCoin = IUniswapV2Router02(sushiRouter).WETH();
        // address cptc = hub.getContractAddress(TOKEN_HUB_IDENTIFIER);
        address[] memory path;

        if (paymentToken == wrappedNativeCoin) {
            path = new address[](2);
            path[0] = paymentToken;
            path[1] = _cptc;
        } else {
            path = new address[](3);
            path[0] = paymentToken;
            path[1] = wrappedNativeCoin;
            path[2] = _cptc;
        }

        uint amountOutMin = _getAmountOutMin(path, amountIn);

        uint256[] memory amounts = IUniswapV2Router02(sushiRouter).swapExactTokensForTokens(
            amountIn,
            amountOutMin,
            path,
            address(this),
            block.timestamp
        );
        emit TokenConverted(amounts);
    }

    function _convertNativeCurrency(address _cptc) internal {
        uint amountIn = address(this).balance;
        require(amountIn > 0, "No native currency balance to convert");

        address[] memory path = new address[](2);
        path[0] = IUniswapV2Router02(sushiRouter).WETH();
        path[1] = _cptc;

        uint256 amountOutMin = _getAmountOutMin(path, amountIn);

        uint256[] memory amounts = IUniswapV2Router02(sushiRouter).swapExactETHForTokens{value: amountIn}(
            amountOutMin,
            path,
            address(this),
            block.timestamp
        );
        emit NativeCurrencyConverted(amounts);
    }
    
     function _getAmountOutMin(address[] memory _path, uint256 _amountIn) private view returns (uint256) {        
        uint256[] memory amountOutMins = IUniswapV2Router02(sushiRouter).getAmountsOut(_amountIn, _path);
        return amountOutMins[_path.length - 1];
    }  

    receive() external payable {}
    fallback() external payable {}
}