// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./CptcHub.sol";
import './libraries/UniswapV2Library.sol';
import './interfaces/IUniswapV2Router02.sol';
import './interfaces/IUniswapV2Pair.sol';

contract Vault is Ownable {
    CptcHub public hub;

    string constant private TOKEN_HUB_IDENTIFIER = "TokenContract";
    
    //address of WMATIC token.  This is needed because some times it is better to trade through WMATIC.  
    //you might get a better price using WMATIC.  
    //example trading from token A to WMATIC then WMATIC to token B might result in a better price
    address immutable WMATIC;
     
    address immutable sushiRouter;
    address immutable sushiFactory;

    constructor(address _hubContract, address _sushiRouter, address _sushiFactory, address _wmatic) {
        hub = CptcHub(_hubContract);
        sushiRouter = _sushiRouter;
        sushiFactory = _sushiFactory;
        WMATIC = _wmatic;
    }

    //this swap function is used to trade from one token to another
    //the inputs are self explainatory
    //token in = the token address you want to trade out of
    //amount in = the amount of tokens you are sending in
    
    function convertToCptc(address _tokenIn, uint256 _amountIn) external {
        address cptc = hub.getContractAddress(TOKEN_HUB_IDENTIFIER);
        //first we need to transfer the amount in tokens from the msg.sender to this contract
        //this contract will have the amount of in tokens
        IERC20(_tokenIn).transferFrom(msg.sender, address(this), _amountIn);

        //next we need to allow the uniswapv2 router to spend the token we just sent to this contract
        //by calling IERC20 approve you allow the uniswap contract to spend the tokens in this contract 
        IERC20(_tokenIn).approve(sushiRouter, _amountIn);

        //path is an array of addresses.
        //this path array will have 3 addresses [tokenIn, WETH, tokenOut]
        //the if statement below takes into account if token in or token out is WETH.  then the path is only 2 addresses
        address[] memory path;
        if (_tokenIn == WMATIC) {
            path = new address[](2);
            path[0] = _tokenIn;
            path[1] = cptc;
        } else {
            path = new address[](3);
            path[0] = _tokenIn;
            path[1] = WMATIC;
            path[2] = cptc;
        }

        uint amountOutMin = _getAmountOutMin(path, _amountIn);

        //then we will call swapExactTokensForTokens
        //for the deadline we will pass in block.timestamp
        //the deadline is the latest time the trade is valid for
        IUniswapV2Router02(sushiRouter).swapExactTokensForTokens(_amountIn, amountOutMin, path, address(this), block.timestamp);
    }
    
       //this function will return the minimum amount from a swap
       //input the 3 parameters below and it will return the minimum amount out
       //this is needed for the swap function above
     function _getAmountOutMin(address[] memory _path, uint256 _amountIn) internal view returns (uint256) {        
        uint256[] memory amountOutMins = IUniswapV2Router02(sushiRouter).getAmountsOut(_amountIn, _path);
        return amountOutMins[_path.length - 1];
    }  

    function setHubAddress(address newHubAddress) external onlyOwner {
        hub = CptcHub(newHubAddress);
    }
}