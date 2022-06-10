//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Reserve is Ownable{
    IERC20 public immutable token;
    uint256 public unlockTime;
    
    constructor(address _token){
        token = IERC20(_token);
        unlockTime = block.timestamp + 1 weeks;
    }
    
    modifier checkTimestamp(){
        require(block.timestamp >= unlockTime, "Reserve: Do not enough time");
        _;
    }
    
    function withdrawTo(address _to, uint256 _value) public onlyOwner checkTimestamp {
        require(_to != address(0), "Reserve: Receiver must be not address0");
        require(token.balanceOf(address(this)) >= _value, "Reserve: Do not enough balance");
        token.transfer(_to, _value);
    }
}