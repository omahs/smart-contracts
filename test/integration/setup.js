const { accounts, artifacts, web3 } = require('hardhat');
const { ether } = require('@openzeppelin/test-helpers');

const { setupUniswap } = require('../utils');
const { ContractTypes } = require('../utils').constants;
const { hex } = require('../utils').helpers;
const { proposalCategories } = require('../utils');

const { BN } = web3.utils;

async function setup () {

  // external
  const ERC20BlacklistableMock = artifacts.require('ERC20BlacklistableMock');
  const OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy');
  const ChainlinkAggregatorMock = artifacts.require('ChainlinkAggregatorMock');
  const Lido = artifacts.require('P1MockLido');

  // nexusmutual
  const NXMToken = artifacts.require('NXMToken');
  const Claims = artifacts.require('Claims');
  const ClaimsData = artifacts.require('ClaimsData');
  const ClaimsReward = artifacts.require('ClaimsReward');
  const MCR = artifacts.require('DisposableMCR');
  const TokenData = artifacts.require('TokenData');
  const TokenFunctions = artifacts.require('TokenFunctions');
  const Pool = artifacts.require('Pool');
  const Quotation = artifacts.require('Quotation');
  const QuotationData = artifacts.require('QuotationData');
  const ClaimProofs = artifacts.require('ClaimProofs');
  const PriceFeedOracle = artifacts.require('PriceFeedOracle');
  const TwapOracle = artifacts.require('TwapOracle');
  const SwapOperator = artifacts.require('SwapOperator');

  // temporary contracts used for initialization
  const DisposableNXMaster = artifacts.require('DisposableNXMaster');
  const DisposableMemberRoles = artifacts.require('DisposableMemberRoles');
  const DisposableTokenController = artifacts.require('DisposableTokenController');
  const DisposableProposalCategory = artifacts.require('DisposableProposalCategory');
  const DisposableGovernance = artifacts.require('DisposableGovernance');
  const DisposablePooledStaking = artifacts.require('DisposablePooledStaking');
  const DisposableGateway = artifacts.require('DisposableGateway');

  // target contracts
  const NXMaster = artifacts.require('NXMaster');
  const MemberRoles = artifacts.require('MemberRoles');
  const TokenController = artifacts.require('TokenController');
  const ProposalCategory = artifacts.require('ProposalCategory');
  const Governance = artifacts.require('Governance');
  const PooledStaking = artifacts.require('PooledStaking');
  const Gateway = artifacts.require('Gateway');
  const Incidents = artifacts.require('Incidents');

  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
  const QE = '0x51042c4d8936a7764d18370a6a0762b860bb8e07';
  const INITIAL_SUPPLY = ether('15000000000');

  const deployProxy = async contract => {
    const implementation = await contract.new();
    const proxy = await OwnedUpgradeabilityProxy.new(implementation.address);
    return contract.at(proxy.address);
  };

  const upgradeProxy = async (proxyAddress, contract) => {
    const implementation = await contract.new();
    const proxy = await OwnedUpgradeabilityProxy.at(proxyAddress);
    await proxy.upgradeTo(implementation.address);
  };

  const transferProxyOwnership = async (proxyAddress, newOwner) => {
    const proxy = await OwnedUpgradeabilityProxy.at(proxyAddress);
    await proxy.transferProxyOwnership(newOwner);
  };

  const [owner, emergencyAdmin] = accounts;

  // deploy external contracts
  const { router, factory, weth } = await setupUniswap();

  const dai = await ERC20BlacklistableMock.new();
  await dai.mint(owner, ether('10000000'));

  const stETH = await ERC20BlacklistableMock.new();
  await stETH.mint(owner, ether('10000000'));

  const chainlinkDAI = await ChainlinkAggregatorMock.new();
  const chainlinkStETH = await ChainlinkAggregatorMock.new();
  await chainlinkStETH.setLatestAnswer(ether('1'));

  const priceFeedOracle = await PriceFeedOracle.new(
    [dai.address, stETH.address],
    [chainlinkDAI.address, chainlinkStETH.address],
    [18, 18],
    dai.address
  );

  const lido = await Lido.new();

  // proxy contracts
  const master = await deployProxy(DisposableNXMaster);
  const mr = await deployProxy(DisposableMemberRoles);
  const tc = await deployProxy(DisposableTokenController);
  const ps = await deployProxy(DisposablePooledStaking);
  const pc = await deployProxy(DisposableProposalCategory);
  const gv = await deployProxy(DisposableGovernance);
  const gateway = await deployProxy(DisposableGateway);
  const incidents = await deployProxy(Incidents);

  // non-proxy contracts and libraries
  const cp = await ClaimProofs.new(master.address);
  const twapOracle = await TwapOracle.new(factory.address);

  // regular contracts
  const cl = await Claims.new();
  const cd = await ClaimsData.new();
  const cr = await ClaimsReward.new(master.address, dai.address);

  const mc = await MCR.new(ZERO_ADDRESS);

  const p1 = await Pool.new(
    [dai.address], // assets
    [0], // min amounts
    [ether('100')], // max amounts
    [ether('0.01')], // max slippage 1%
    master.address,
    priceFeedOracle.address,
    ZERO_ADDRESS,
  );
  const swapOperator = await SwapOperator.new(
    master.address, twapOracle.address, owner, lido.address, ZERO_ADDRESS, ZERO_ADDRESS, weth.address
  );

  const tk = await NXMToken.new(owner, INITIAL_SUPPLY);
  const td = await TokenData.new(owner);
  const tf = await TokenFunctions.new();
  const qt = await Quotation.new();
  const qd = await QuotationData.new(QE, owner);

  const contractType = code => {

    const upgradable = ['CL', 'CR', 'MC', 'P1', 'QT', 'TF'];
    const proxies = ['GV', 'MR', 'PC', 'PS', 'TC', 'GW', 'IC'];

    if (upgradable.includes(code)) {
      return ContractTypes.Replaceable;
    }

    if (proxies.includes(code)) {
      return ContractTypes.Proxy;
    }

    return 0;
  };

  const codes = ['QD', 'TD', 'CD', 'QT', 'TF', 'TC', 'CL', 'CR', 'P1', 'MC', 'GV', 'PC', 'MR', 'PS', 'GW', 'IC'];
  const addresses = [qd, td, cd, qt, tf, tc, cl, cr, p1, mc, { address: owner }, pc, mr, ps, gateway, incidents].map(c => c.address);

  await master.initialize(
    owner,
    tk.address,
    emergencyAdmin,
    codes.map(hex), // codes
    codes.map(contractType), // types
    addresses, // addresses
  );

  await tc.initialize(
    master.address,
    tk.address,
    ps.address,
    30 * 24 * 3600, // minCALockTime
    120 * 24 * 3600, // claimSubmissionGracePeriod
  );

  await tc.addToWhitelist(cr.address);

  await mr.initialize(
    owner,
    master.address,
    tc.address,
    [owner], // initial members
    [ether('10000')], // initial tokens
    [owner], // advisory board members
  );

  await pc.initialize(mr.address);

  for (const category of proposalCategories) {
    await pc.addInitialCategory(...category, { gas: 10e6 });
  }

  await gv.initialize(
    3 * 24 * 3600, // tokenHoldingTime
    14 * 24 * 3600, // maxDraftTime
    5, // maxVoteWeigthPer
    40, // maxFollowers
    75, // specialResolutionMajPerc
    24 * 3600, // actionWaitingTime
  );

  await ps.initialize(
    tc.address,
    ether('20'), // min stake
    ether('20'), // min unstake
    10, // max exposure
    90 * 24 * 3600, // unstake lock time
  );

  await incidents.initialize();

  await cd.changeMasterAddress(master.address);
  await cd.updateUintParameters(hex('CAMINVT'), 36); // min voting time 36h
  await cd.updateUintParameters(hex('CAMAXVT'), 72); // max voting time 72h
  await cd.updateUintParameters(hex('CADEPT'), 7); // claim deposit time 7 days
  await cd.updateUintParameters(hex('CAPAUSET'), 3); // claim assessment pause time 3 days

  await td.changeMasterAddress(master.address);
  await td.updateUintParameters(hex('RACOMM'), 50); // staker commission percentage 50%
  await td.updateUintParameters(hex('CABOOKT'), 6); // "book time" 6h
  await td.updateUintParameters(hex('CALOCKT'), 7); // ca lock 7 days
  await td.updateUintParameters(hex('MVLOCKT'), 2); // ca lock mv 2 days

  await p1.updateAddressParameters(hex('SWP_OP'), swapOperator.address);

  await gv.changeMasterAddress(master.address);
  await master.switchGovernanceAddress(gv.address);

  await gateway.initialize(master.address, dai.address);

  await upgradeProxy(mr.address, MemberRoles);
  await upgradeProxy(tc.address, TokenController);
  await upgradeProxy(ps.address, PooledStaking);
  await upgradeProxy(pc.address, ProposalCategory);
  await upgradeProxy(master.address, NXMaster);
  await upgradeProxy(gv.address, Governance);
  await upgradeProxy(gateway.address, Gateway);
  await gateway.changeDependentContractAddress();

  await transferProxyOwnership(mr.address, master.address);
  await transferProxyOwnership(tc.address, master.address);
  await transferProxyOwnership(ps.address, master.address);
  await transferProxyOwnership(pc.address, master.address);
  await transferProxyOwnership(gv.address, master.address);
  await transferProxyOwnership(gateway.address, master.address);
  await transferProxyOwnership(incidents.address, master.address);
  await transferProxyOwnership(master.address, gv.address);

  const POOL_ETHER = ether('90000');
  const POOL_DAI = ether('2000000');

  // fund pools
  await p1.sendEther({ from: owner, value: POOL_ETHER });
  await dai.transfer(p1.address, POOL_DAI);

  const ethEthRate = 100;
  const ethToDaiRate = 20000;

  const daiToEthRate = new BN(10).pow(new BN(36)).div(ether((ethToDaiRate / 100).toString()));
  await chainlinkDAI.setLatestAnswer(daiToEthRate);

  const mcrEth = ether('50000');
  const mcrFloor = mcrEth.sub(ether('10000'));

  const latestBlock = await web3.eth.getBlock('latest');
  const lastUpdateTime = latestBlock.timestamp;
  const mcrFloorIncrementThreshold = 13000;
  const maxMCRFloorIncrement = 100;
  const maxMCRIncrement = 500;
  const gearingFactor = 48000;
  const minUpdateTime = 3600;
  const desiredMCR = mcrEth;

  await mc.initialize(
    mcrEth,
    mcrFloor,
    desiredMCR,
    lastUpdateTime,
    mcrFloorIncrementThreshold,
    maxMCRFloorIncrement,
    maxMCRIncrement,
    gearingFactor,
    minUpdateTime,
  );

  const external = { chainlinkDAI, dai, factory, router, weth };
  const nonUpgradable = { cp, qd, td, cd };
  const instances = { tk, qt, tf, cl, cr, p1, mcr: mc };

  // we upgraded them, get non-disposable instances because
  const proxies = {
    master: await NXMaster.at(master.address),
    tc: await TokenController.at(tc.address),
    gv: await Governance.at(gv.address),
    pc: await ProposalCategory.at(pc.address),
    mr: await MemberRoles.at(mr.address),
    ps: await PooledStaking.at(ps.address),
    gateway,
    incidents,
  };

  const nonInternal = { priceFeedOracle, swapOperator };

  this.contracts = {
    ...external,
    ...nonUpgradable,
    ...instances,
    ...proxies,
    ...nonInternal,
  };

  this.rates = {
    daiToEthRate,
    ethEthRate,
    ethToDaiRate,
  };

  this.contractType = contractType;
}

module.exports = setup;
