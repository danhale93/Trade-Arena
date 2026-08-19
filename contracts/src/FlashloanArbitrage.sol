// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IFlashLoanSimpleReceiver} from "@aave/core-v3/contracts/flashloan/interfaces/IFlashLoanSimpleReceiver.sol";
import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import {IPool} from "@aave/core-v3/contracts/interfaces/IPool.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract FlashloanArbitrage is IFlashLoanSimpleReceiver, Ownable {
    using SafeERC20 for IERC20;

    IPoolAddressesProvider public immutable ADDRESSES_PROVIDER;
    IPool public immutable POOL;

    struct Action {
        address target;
        bytes callData;
    }

    constructor(address _addressProvider) Ownable(msg.sender) {
        ADDRESSES_PROVIDER = IPoolAddressesProvider(_addressProvider);
        POOL = IPool(ADDRESSES_PROVIDER.getPool());
    }

    function requestFlashLoan(address _token, uint256 _amount, bytes calldata _params) external onlyOwner {
        POOL.flashLoanSimple(address(this), _token, _amount, _params, 0);
    }

    struct FlashParams {
        uint256 minProfit;
        Action[] actions;
    }

    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        require(msg.sender == address(POOL), "Only Pool");
        require(initiator == address(this), "Invalid initiator");

        uint256 balanceBefore = IERC20(asset).balanceOf(address(this));

        FlashParams memory decoded = abi.decode(params, (FlashParams));

        for (uint256 i = 0; i < decoded.actions.length; i++) {
            (bool success, ) = decoded.actions[i].target.call(decoded.actions[i].callData);
            require(success, "Action failed");
        }

        uint256 amountToRepay = amount + premium;
        IERC20(asset).approve(address(POOL), amountToRepay);

        uint256 balanceAfter = IERC20(asset).balanceOf(address(this));

        // Protect contract capital: ensure transaction only succeeds if it made a net profit
        if (balanceAfter >= amountToRepay) {
            uint256 netProfit = balanceAfter - amountToRepay;
            require(netProfit >= decoded.minProfit, "Arbitrage unprofitable");
        } else {
            revert("Insufficient funds to repay loan");
        }

        return true;
    }

    receive() external payable {}
}
