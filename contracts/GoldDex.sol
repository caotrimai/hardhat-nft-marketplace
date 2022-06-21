//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// create contract to buy token by BNB
contract GoldDex{
    address owner;
    ERC20 immutable public token;
    uint256 public BUY_RATIO = 10**4; // 1BNB = 10.000 GOLD
    uint256 public SELL_FEE = 10; // 10% fee for sell
    
    event Bought(uint256 _amount);
    event Sold(uint256 _amount);
    
    constructor(address _token) public {
        owner = msg.sender;
        token = ERC20(_token);
    }
    
    // buy token by BNB
    function buy() public payable {
        uint256 amountToBuy = msg.value*BUY_RATIO;
        uint256 dexTokenBalance = token.balanceOf(address(this));
        require(amountToBuy > 0, "Amount must be greater than 0");
        require(dexTokenBalance >= amountToBuy, "Gold balance of GoldTransfer is not enough");
        token.transfer(msg.sender, amountToBuy);
        emit Bought(amountToBuy);
    }
    
    // sell token
    function sell(uint256 _amount) public {
        require(_amount > 0, "Amount must be greater than 0");
        uint256 allowance = token.allowance(msg.sender, address(this));
        require(allowance >= _amount, "Check the allowance of the token");
        uint256 bnbToGet = (_amount*(100-SELL_FEE))/(BUY_RATIO*100);
        require(address(this).balance >= bnbToGet, "BNB balance of GoldTransfer is not enough");
        token.transferFrom(msg.sender, address(this), _amount);
        payable(msg.sender).transfer(bnbToGet);
        emit Sold(_amount);
    }
    
    // withdraw token
    function withdrawToken() public {
        require(owner == msg.sender, "Only owner can withdraw");
        uint256 tokenBalance = token.balanceOf(address(this));
        require(tokenBalance > 0, "Gold balance of GoldTransfer is not enough");
        token.transfer(owner, tokenBalance);
    }
    
    //withdraw bnb
    function withdrawBNB() public {
        require(owner == msg.sender, "Only owner can withdraw");
        uint256 bnbBalance = address(this).balance;
        require(bnbBalance > 0, "BNB balance of GoldTransfer is not enough");
        payable(owner).transfer(bnbBalance);
    }
}
