const { ether, expectRevert, expectEvent, time } = require('@openzeppelin/test-helpers');
const { web3, contract, defaultSender } = require('@openzeppelin/test-environment');
const { assert } = require('chai');
const { hex } = require('../utils').helpers;
const { calculatePurchasedTokensWithFullIntegral, calculatePurchasedTokens } = require('../utils').tokenPrice;
const { BN } = web3.utils;
const Decimal = require('decimal.js');
const { accounts } = require('../utils');
const { setupContractState, keysToString } = require('./utils');

const { Role, ParamType } = require('../utils').constants;

const {
  nonMembers: [fundSource],
  members: [member1, member2],
} = accounts;

const MasterMock = contract.fromArtifact('MasterMock');
const PoolData = contract.fromArtifact('Pool1MockPoolData');
const TokenData = contract.fromArtifact('TokenData');
const TokenController = contract.fromArtifact('TokenControllerMock');
const TokenMock = contract.fromArtifact('NXMTokenMock');
const Pool1 = contract.fromArtifact('Pool1');
const MCR = contract.fromArtifact('MCR');
const DAI = contract.fromArtifact('Pool1MockDAI');
const TokenFunctions = contract.fromArtifact('TokenFunctions');
const Pool1MockOldMCR = contract.fromArtifact('Pool1MockOldMCR');
const Pool1MockOldPool1 = contract.fromArtifact('Pool1MockOldPool1');

const maxRelativeError = Decimal(0.001);

async function assertBuyValues({
  totalAssetValue, mcrPercentage, maxPercentage, poolBalanceStep, buyValue, old, current
}) {

  let highestRelativeError = 0;
  while (mcrPercentage < maxPercentage * 100) {
    console.log({ totalAssetValue: totalAssetValue.toString(), mcrPercentage: mcrPercentage.toString() });


    const preBuyBalanceMember1 = await current.token.balanceOf(member1);
    const tx = await current.pool1.buyTokens('0', {
      from: member1,
      value: buyValue
    });
    const postBuyBalanceMember1 = await current.token.balanceOf(member1);
    const tokensReceivedMember1 = postBuyBalanceMember1.sub(preBuyBalanceMember1);

    const preBuyBalanceMember2 = await old.token.balanceOf(member2);
    await old.pool1.buyToken({
      from: member2,
      value: buyValue
    });
    const postBuyBalanceMember2 = await old.token.balanceOf(member2);
    const tokensReceivedMember2 = postBuyBalanceMember2.sub(preBuyBalanceMember2);

    const tokensReceivedMember1Decimal = Decimal(tokensReceivedMember1.toString());
    const tokensReceivedMember2Decimal = Decimal(tokensReceivedMember2.toString());

    const relativeError = tokensReceivedMember2Decimal
      .sub(tokensReceivedMember1Decimal)
      .abs().div(tokensReceivedMember2Decimal);
    highestRelativeError = Math.max(relativeError.toNumber(), highestRelativeError);
    console.log({ relativeError: relativeError.toString() });
    assert(
      relativeError.lt(maxRelativeError),
      `Resulting token value ${tokensReceivedMember1Decimal.toFixed()} is not close enough to expected ${tokensReceivedMember2Decimal.toFixed()}
       Relative error: ${relativeError}`
    );

    if (buyValue.lt(poolBalanceStep)) {
      const extraStepValue = poolBalanceStep.sub(buyValue);
      await current.pool1.sendTransaction({
        from: fundSource,
        value: extraStepValue
      });

      await old.pool1.sendTransaction({
        from: fundSource,
        value: extraStepValue
      });
    }

    ({ totalAssetValue, mcrPercentage } = await current.mcr.calVtpAndMCRtp());
  }
}

async function setup ({ MCR, Pool1 }) {

  const master = await MasterMock.new();

  const daiFeedAddress = '0x0000000000000000000000000000000000000001';
  const mockP2Address = '0x0000000000000000000000000000000000000012';
  const dai = await DAI.new();
  const poolData = await PoolData.new(accounts.notariseAddress, daiFeedAddress, dai.address);
  const tokenData = await TokenData.new(accounts.notariseAddress);
  const pool1 = await Pool1.new();
  const token = await TokenMock.new();
  const mcr = await MCR.new();
  const tokenController = await TokenController.new();
  const tokenFunctions = await TokenFunctions.new();
  await token.mint(defaultSender, ether('10000'));

  // set contract addresses
  await master.setTokenAddress(token.address);
  await master.setLatestAddress(hex('P1'), pool1.address);
  await master.setLatestAddress(hex('PD'), poolData.address);
  await master.setLatestAddress(hex('TD'), tokenData.address);
  await master.setLatestAddress(hex('MC'), mcr.address);
  await master.setLatestAddress(hex('TC'), tokenController.address);
  await master.setLatestAddress(hex('P2'), mockP2Address);
  await master.setLatestAddress(hex('TF'), tokenFunctions.address);

  const contractsToUpdate = [pool1, tokenController, tokenFunctions, mcr];
  for (const contract of contractsToUpdate) {
    await contract.changeMasterAddress(master.address);
    await contract.changeDependentContractAddress();
  }

  // required to be able to mint
  await master.enrollInternal(pool1.address);

  for (const member of accounts.members) {
    await master.enrollMember(member, Role.Member);
  }

  for (const advisoryBoardMember of accounts.advisoryBoardMembers) {
    await master.enrollMember(advisoryBoardMember, Role.AdvisoryBoard);
  }

  for (const internalContract of accounts.internalContracts) {
    await master.enrollInternal(internalContract);
  }

  // there is only one in reality, but it doesn't matter
  for (const governanceContract of accounts.governanceContracts) {
    await master.enrollGovernance(governanceContract);
  }

  // initialize token
  await token.setOperator(tokenController.address);

  return {
    master,
    token,
    pool1,
    mcr,
    poolData,
    tokenData,
    tokenController
  };
}

async function setupBothImplementations() {
  this.current = await setup({ MCR, Pool1 });
  this.old = await setup({ MCR: Pool1MockOldMCR, Pool1: Pool1MockOldPool1 });
}

describe('compareTokenCurveImplementations', function () {

  const daiRate = new BN('39459');
  const ethRate = new BN('100');
  const maxPercentage = 400;

  before(setupBothImplementations);

  it('mints similar number of tokens with current sellTokens call as the old sellNXMTokens', async function () {
    const { old, current } = this;

    const mcrEth = ether('160000');
    const initialAssetValue = mcrEth;
    const buyValue = ether('100');

    const poolBalanceStep = ether('30000');
    console.log(`Setup system with old implementation.`);
    const oldState = await setupContractState(
      { fundSource, initialAssetValue, mcrEth, daiRate, ethRate, buyValue, ...old }
    );
    console.log(keysToString(oldState));

    console.log(`Setup system with current implementation.`);
    const { totalAssetValue, mcrPercentage, a, c, tokenExponent } = await setupContractState(
      { fundSource, initialAssetValue, mcrEth, daiRate, ethRate, buyValue, ...current }
    );

    await assertBuyValues(
      { totalAssetValue, mcrPercentage, maxPercentage, poolBalanceStep, buyValue, old, current }
    );
  });
});
