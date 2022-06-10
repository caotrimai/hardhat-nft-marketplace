//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract GoldToken is ERC20, Pausable, AccessControl {
    bytes32 public constant PAUSE_ROLE = keccak256("PAUSE_ROLE");
    mapping(address => bool) private _blackList;
    event BlackListAdded(address account);
    event BlackListRemoved(address account);
    
    constructor(uint totalSupply) ERC20("GOLD TOKEN", "GOLD") {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(PAUSE_ROLE, msg.sender);
        _mint(msg.sender, totalSupply * 10**decimals());
    }
    modifier noBlackList(address account) {
        require(!_blackList[account], "BlackList: account is blacklisted");
        _;
    }
    function pause() public onlyRole(PAUSE_ROLE){
        _pause();
    }
    function unpause() public onlyRole(PAUSE_ROLE){
        _unpause();
    }
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused noBlackList(from) noBlackList(to) {
        super._beforeTokenTransfer(from, to, amount);
    }
    function addToBlackList(address _account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_account != msg.sender, "Cannot add yourself to the blacklist");
        require(!_blackList[_account], "Account is already in the black list");
        _blackList[_account] = true;
        emit BlackListAdded(_account);
    }
    function removeFromBlackList(address _account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_account != msg.sender, "Cannot remove yourself from the blacklist");
        require(_blackList[_account], "Account is not in the black list");
        _blackList[_account] = false;
        emit BlackListRemoved(_account);
    }
}
