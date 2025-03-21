// SPDX-License-Identifier: GPL-3.0-only

pragma solidity ^0.5.17;

import "./P1MockEnzymeV4Vault.sol";
import "../../external/enzyme/IEnzymeV4DepositWrapper.sol";

import "hardhat/console.sol";

contract P1MockEnzymeV4DepositWrapper is IEnzymeV4DepositWrapper {

  uint public ethToSharesRate = 10000;

  P1MockEnzymeV4Vault private vault;

  constructor(P1MockEnzymeV4Vault _vault) public {
    vault = _vault;
  }

  function exchangeEthAndBuyShares(
    address  comptrollerProxy,
    address denominationAsset,
    uint256 minSharesQuantity,
    address exchange,
    address exchangeApproveTarget,
    bytes calldata exchangeData,
    uint256 minInvestmentAmount) external payable returns (uint256) {

    // require(msg.data.length == 0, "NON_EMPTY_DATA");
    uint shares = msg.value * ethToSharesRate / 10000;
    vault.mint(msg.sender, shares);
    return shares;
  }

  function setETHToVaultSharesRate(uint _ethToSharesRate) public {
    ethToSharesRate = _ethToSharesRate;
  }
}
