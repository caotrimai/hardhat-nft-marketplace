//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Petty is ERC721, Ownable {
    using Counters for Counters.Counter; 
    Counters.Counter public _tokenId;
    string private _baseTokenURI;
    
    constructor() ERC721("Petty", "PET") {}
    
    function mint(address _to) public onlyOwner returns(uint256){
        _tokenId.increment();
        uint256 tokenId = _tokenId.current();
        _mint(_to, tokenId);
        return tokenId;
    }
    function updateBaseTokenURI(string memory __baseTokenURI) public onlyOwner {
        _baseTokenURI = __baseTokenURI;
    }
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }
}
