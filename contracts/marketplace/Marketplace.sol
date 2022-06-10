//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract Marketplace is Ownable {
    using Counters for Counters.Counter;
    using EnumerableSet for EnumerableSet.AddressSet;

    struct Order {
        address seller;
        address buyer;
        uint256 tokenId;
        address paymentToken;
        uint256 price;
    }

    IERC721 public immutable nftContract;
    Counters.Counter private _oderIdCount;
    mapping(uint256 => Order) orders;
    uint128 public feeRate;
    uint128 public feeDecimal;
    address public feeRecipient;
    EnumerableSet.AddressSet private _supportedPaymentTokens;

    event OrderAdded(
        uint256 indexed oderId,
        address indexed seller,
        uint256 indexed tokenId,
        address paymentToken,
        uint256 price
    );
    event OrderMatched(
        uint256 indexed oderId,
        address indexed seller,
        address indexed buyer,
        uint256 tokenId,
        address paymentToken,
        uint256 price
    );
    event OrderCanceled(uint256 indexed oderId);
    event FeeUpdated(uint128 feeRate, uint128 feeDecimal);

    constructor(address _nftContract, uint128 _feeRate, uint128 _feeDecimal, address _feeRecipient){
        nftContract = IERC721(_nftContract);
        _updateFeeRecipient(_feeRecipient);
        _updateFee(_feeRate, _feeDecimal);
    }

    function _updateFeeRecipient(address _feeRecipient) internal {
        feeRecipient = _feeRecipient;
    }

    function updateFeeRecipient(address _feeRecipient) public onlyOwner {
        _updateFeeRecipient(_feeRecipient);
    }

    //ex: _feeRate=10, _feeDecimal=0 => fee = 10/10^2 = 0.1 = 10%
    function _updateFee(uint128 _feeRate, uint128 _feeDecimal) internal {
        require(_feeRate < 10 ** (_feeDecimal + 2), "NFTMarketplace: bad fee rate");
        feeRate = _feeRate;
        feeDecimal = _feeDecimal;
        emit FeeUpdated(_feeRate, _feeDecimal);
    }

    function updateFee(uint128 _feeRate, uint128 _feeDecimal) public onlyOwner {
        _updateFee(_feeRate, _feeDecimal);
    }

    function _calculateFee(uint256 _orderId) internal view returns (uint256) {
        Order storage order = orders[_orderId];
        if (feeRate == 0) {
            return 0;
        }
        return (order.price * feeRate) / 10 ** (feeDecimal + 2);
    }

    function isSeller(uint256 _orderId, address _seller) public view returns (bool) {
        return orders[_orderId].seller == _seller;
    }

    function isPaymentTokenSupported(address _paymentToken) public view returns (bool) {
        return _supportedPaymentTokens.contains(_paymentToken);
    }

    function addPaymentToken(address _paymentToken) external onlyOwner {
        require(_paymentToken != address(0), "NFTMarketplace: _paymentToken is zero address");
        require(_supportedPaymentTokens.add(_paymentToken), "NFTMarketplace: already supported");
    }

    modifier onlySupportedPaymentToken(address _paymentToken){
        require(isPaymentTokenSupported(_paymentToken), "NFTMarketplace: payment token is not supported");
        _;
    }

    function addOrder(uint256 _tokenId, address _paymentToken, uint256 _price) public
    onlySupportedPaymentToken(_paymentToken) {
        require(_price > 0, "NFTMarketplace: Price must be greater than 0");
        require(nftContract.ownerOf(_tokenId) == _msgSender(), "NFTMarketplace: Sender are not owner of the token");
        require(nftContract.getApproved(_tokenId) == address(this)
            || nftContract.isApprovedForAll(_msgSender(), address(this)),
            "NFTMarketplace: The contract is unauthorized to manage this token");
        nftContract.transferFrom(_msgSender(), address(this), _tokenId);
        uint256 orderId = _oderIdCount.current();
        orders[orderId] = Order(_msgSender(), address(0), _tokenId, _paymentToken, _price);
        _oderIdCount.increment();
        emit OrderAdded(orderId, _msgSender(), _tokenId, _paymentToken, _price);
    }

    function cancelOrder(uint256 _orderId) public {
        require(orders[_orderId].seller == _msgSender(), "NFTMarket: Must be owner");
        uint256 tokenId = orders[_orderId].tokenId;
        delete orders[_orderId];
        nftContract.transferFrom(address(this), _msgSender(), tokenId);
        emit OrderCanceled(_orderId);
    }

    function executeOrder(uint256 _orderId) public {
        Order storage order = orders[_orderId];
        require(order.price > 0, "NFTMarketplace: This order was canceled");
        require(order.seller != _msgSender(), "NFTMarketplace: Sender must not buyer");
        require(order.buyer == address(0), "NFTMarketplace: This order was closed");
        IERC20 paymentToken = IERC20(order.paymentToken);
        require(paymentToken.balanceOf(_msgSender()) >= order.price, "NFTMarketplace: Not enough tokens");
        require(paymentToken.allowance(_msgSender(), address(this)) >= order.price, "NFTMarketplace: Not approve enough tokens");
        uint256 fee = _calculateFee(_orderId);
        if (fee > 0) {
            paymentToken.transferFrom(_msgSender(), feeRecipient, fee);
        }
        paymentToken.transferFrom(_msgSender(), order.seller, order.price - fee);
        nftContract.transferFrom(address(this), _msgSender(), order.tokenId);
        order.buyer = _msgSender();
        emit OrderMatched(
            _orderId,
            order.seller,
            order.buyer,
            order.tokenId,
            order.paymentToken,
            order.price
        );
    }
}
