// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

contract PayoutManager is EIP712, ERC2771Context, Ownable {
    using ECDSA for bytes32;

    IERC20 public immutable rewardToken;
    address public oracleAddress;

    bytes32 private constant PAYOUT_TYPEHASH = keccak256(
        "Payout(address user,string taskId,uint256 amount,uint256 nonce)"
    );

    mapping(uint256 => bool) public usedNonces;

    event RewardClaimed(address indexed user, string taskId, uint256 amount);

    constructor(address _rewardToken, address _oracleAddress, address _trustedForwarder)
        EIP712("PayoutManager", "1")
        ERC2771Context(_trustedForwarder)
        Ownable(msg.sender)
    {
        rewardToken = IERC20(_rewardToken);
        oracleAddress = _oracleAddress;
    }

    function claimReward(
        address user,
        string calldata taskId,
        uint256 amount,
        uint256 nonce,
        bytes calldata signature
    ) external {
        require(!usedNonces[nonce], "Nonce already used");

        bytes32 structHash = keccak256(
            abi.encode(
                PAYOUT_TYPEHASH,
                user,
                keccak256(bytes(taskId)),
                amount,
                nonce
            )
        );

        bytes32 hash = _hashTypedDataV4(structHash);
        address signer = hash.recover(signature);

        require(signer == oracleAddress, "Invalid signature");

        usedNonces[nonce] = true;
        require(rewardToken.transfer(user, amount), "Transfer failed");

        emit RewardClaimed(user, taskId, amount);
    }

    function _msgSender() internal view override(Context, ERC2771Context) returns (address) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal view override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }

    function _contextSuffixLength() internal view override(Context, ERC2771Context) returns (uint256) {
        return ERC2771Context._contextSuffixLength();
    }
}
