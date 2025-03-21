const fetch = require('node-fetch');
const { artifacts, web3, accounts, network } = require('hardhat');
const { expectRevert, constants: { ZERO_ADDRESS }, ether, time } = require('@openzeppelin/test-helpers');
const Decimal = require('decimal.js');

const { submitGovernanceProposal, submitMemberVoteGovernanceProposal } = require('./utils');
const { hex } = require('../utils').helpers;
const { ProposalCategory, Role } = require('../utils').constants;
const { setNextBlockTime } = require('../utils').evm;
const { bnEqual } = require('../utils').helpers;

const {
  calculateRelativeError,
} = require('../utils').tokenPrice;
const { quoteAuthAddress } = require('../utils').getQuote;
const { buyCover, buyCoverWithDai } = require('../utils').buyCover;

const { toBN } = web3.utils;

const MemberRoles = artifacts.require('MemberRoles');
const Pool = artifacts.require('Pool');
const OldPool = artifacts.require('P1MockOldPool');
const NXMaster = artifacts.require('NXMaster');
const NXMToken = artifacts.require('NXMToken');
const Governance = artifacts.require('Governance');
const ClaimsReward = artifacts.require('ClaimsReward');
const Quotation = artifacts.require('Quotation');
const QuotationData = artifacts.require('QuotationData');
const Claims = artifacts.require('Claims');
const MCR = artifacts.require('MCR');
const LegacyMCR = artifacts.require('LegacyMCR');
const PriceFeedOracle = artifacts.require('PriceFeedOracle');
const ERC20 = artifacts.require('@openzeppelin/contracts-v4/token/ERC20/ERC20.sol:ERC20');
const SwapOperator = artifacts.require('SwapOperator');
const LegacyPoolData = artifacts.require('LegacyPoolData');
const TwapOracle = artifacts.require('TwapOracle');
const Incidents = artifacts.require('Incidents');
const Gateway = artifacts.require('Gateway');
const OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy');
const ERC20MintableDetailed = artifacts.require('ERC20MintableDetailed');
const ProposalCategoryContract = artifacts.require('ProposalCategory');
const IPolicyManager = artifacts.require('IPolicyManager');
const IEnzymeV4Comptroller = artifacts.require('IEnzymeV4Comptroller');
const IEnzymeV4Vault = artifacts.require('IEnzymeV4Vault');
const IAddressListRegistry = artifacts.require('IAddressListRegistry');
const IEnzymeV4DepositWrapper = artifacts.require('IEnzymeV4DepositWrapper');
const IWETH = artifacts.require('contracts/external/enzyme/IWETH.sol:IWETH');
const IEnzymeFundValueCalculatorRouter = artifacts.require('contracts/external/enzyme/IEnzymeFundValueCalculatorRouter.sol');

const Address = {
  ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  SAI: '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359',
  WNXM: '0x0d438F3b5175Bebc262bF23753C1E53d03432bDE',
  DAIFEED: '0x773616E4d11A78F511299002da57A0a94577F1f4',
  UNIFACTORY: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
  NXMHOLDER: '0xd7cba5b9a0240770cfd9671961dae064136fa240',
  stETH: '0xae7ab96520de3a18e5e111b5eaab095312d7fe84',
  WETH: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  stETHFEED: '0x86392dC19c0b719886221c78AB11eb8Cf5c52812',
  ENZYMESHARES: '0x27F23c710dD3d878FE9393d93465FeD1302f2EbD',
  ENZYMESHARESFEED: '0xCc72039A141c6e34a779eF93AEF5eB4C82A893c7',
};

const UserAddress = {
  NXM_WHALE_1: '0x25783b67b5e29c48449163db19842b8531fdde43',
  NXM_WHALE_2: '0x598dbe6738e0aca4eabc22fed2ac737dbd13fb8f',
  NXM_AB_MEMBER: '0x87B2a7559d85f4653f13E6546A14189cd5455d45',
  ETH_WHALE: '0x73bceb1cd57c711feac4224d062b0f6ff338501e',
};

const DAI_HOLDER = '0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503';

const ybDAIProductId = '0x000000000000000000000000000000000000000d';
const ybETHProductId = '0x000000000000000000000000000000000000000e';

const UpdatePoolAddressParametersCategory = 40;
const SetAssetDetailsProposalCategory = 41;

// enzyme constants
const enzymeV4VaultProxyAddress = '0x27F23c710dD3d878FE9393d93465FeD1302f2EbD';
const enzymeComptrollerProxyAddress = '0xa5bf4350da6193b356ac15a3dbd777a687bc216e';
const enzymeAddressListRegistry = '0x4eb4c7babfb5d54ab4857265b482fb6512d22dff';
const enzymeFundValueCalulatorRouter = '0x7c728cd0cfa92401e01a4849a01b57ee53f5b2b9';

const ListIdForDepositors = 217;
const ListIdForReceivers = 218;
const AddressListRegistry = '0x4eb4c7babfb5d54ab4857265b482fb6512d22dff';

const AddToListSelector = 'addToList(uint256,address[])';

const ratioScale = toBN('10000');

let isHardhat;
const hardhatRequest = async (...params) => {

  if (isHardhat === undefined) {
    const nodeInfo = await web3.eth.getNodeInfo();
    isHardhat = !!nodeInfo.match(/Hardhat/);
  }

  if (isHardhat) {
    return network.provider.request(...params);
  }
};

async function addToDepositor (depositor) {
  const comptroller = await IEnzymeV4Comptroller.at(enzymeComptrollerProxyAddress);

  const vault = await IEnzymeV4Vault.at(enzymeV4VaultProxyAddress);

  const owner = await vault.getOwner();

  console.log({
    vaultOwner: owner,
  });

  await unlock(owner);
  await fund(owner);

  const selector = web3.eth.abi.encodeFunctionSignature('addToList(uint256,address[])');
  const args = web3.eth.abi.encodeParameters(
    ['uint256', 'address[]'],
    [ListIdForDepositors, [depositor]],
  );

  await comptroller.vaultCallOnContract(
    AddressListRegistry,
    selector,
    args, {
      from: owner,
    },
  );
}

const getAddressByCodeFactory = abis => code => abis.find(abi => abi.code === code).address;
const fund = async to => web3.eth.sendTransaction({ from: accounts[0], to, value: ether('1000') });
const unlock = async member => hardhatRequest({ method: 'hardhat_impersonateAccount', params: [member] });
const bnToNumber = bn => parseInt(bn.toString(), 10);

describe('do enzyme investment', function () {

  this.timeout(0);

  it('initializes contracts', async function () {

    const versionDataURL = 'https://api.nexusmutual.io/version-data/data.json';
    const { mainnet: { abis } } = await fetch(versionDataURL).then(r => r.json());
    const getAddressByCode = getAddressByCodeFactory(abis);

    const masterAddress = getAddressByCode('NXMASTER');
    const token = await NXMToken.at(getAddressByCode('NXMTOKEN'));
    const memberRoles = await MemberRoles.at(getAddressByCode('MR'));
    const governance = await Governance.at(getAddressByCode('GV'));
    const pool1 = await Pool.at(getAddressByCode('P1'));
    const oldMCR = await LegacyMCR.at(getAddressByCode('MC'));
    const oldSwapOperator = await SwapOperator.at('0xb00b58b77ECF669D6Cc5a8fc34783Bc244E3e045');
    const proposalCategory = await ProposalCategoryContract.at(getAddressByCode('PC'));

    this.masterAddress = masterAddress;
    this.token = token;
    this.memberRoles = memberRoles;
    this.governance = governance;
    this.pool = pool1;
    this.oldMCR = oldMCR;
    this.master = await NXMaster.at(masterAddress);
    this.oldSwapOperator = oldSwapOperator;
    this.proposalCategory = proposalCategory;
  });

  it('fetches board members and funds accounts', async function () {

    const { memberArray: boardMembers } = await this.memberRoles.members('1');
    const voters = boardMembers.slice(0, 3);

    const whales = [UserAddress.NXM_WHALE_1, UserAddress.NXM_WHALE_2];

    await unlock(UserAddress.ETH_WHALE);

    for (const member of [...voters, Address.NXMHOLDER, ...whales]) {
      await fund(member);
      await unlock(member);
    }

    this.voters = voters;
    this.whales = whales;
  });

  it.skip('reads enzyme values', async function () {
    const fundValueCalculatorRouter = await IEnzymeFundValueCalculatorRouter.at(enzymeFundValueCalulatorRouter);

    const { netShareValue_ } = await fundValueCalculatorRouter.callStatic.calcNetShareValue(enzymeV4VaultProxyAddress);

    console.log({
      netShareValue_: netShareValue_.toString(),
    });

    this.fundValueCalculatorRouter = fundValueCalculatorRouter;
  });

  it.skip('adds enzyme depositor and makes deposit', async function () {

    await addToDepositor(UserAddress.NXM_WHALE_1);

    const amountIn = ether('10');

    const enzymeV4Comptroller = await IEnzymeV4Comptroller.at(enzymeComptrollerProxyAddress);

    const weth = await IWETH.at(Address.WETH);

    const wethBalanceBefore = await weth.balanceOf(UserAddress.NXM_WHALE_1);

    console.log({
      wethBalanceBefore: wethBalanceBefore.toString(),
    });

    await weth.deposit({
      value: amountIn,
      from: UserAddress.NXM_WHALE_1,
    });

    const wethBalance = await weth.balanceOf(UserAddress.NXM_WHALE_1);

    console.log({
      wethBalance: wethBalance.toString(),
    });

    await weth.approve(enzymeV4Comptroller.address, amountIn, {
      from: UserAddress.NXM_WHALE_1,
    });

    await enzymeV4Comptroller.buyShares(
      amountIn, '1', {
        from: UserAddress.NXM_WHALE_1,
      },
    );
  });

  it('upgrade PriceFeedOracle', async function () {

    const { voters, governance } = this;

    const priceFeedOracle = await PriceFeedOracle.new(
      [Address.DAI, Address.stETH, Address.ENZYMESHARES],
      [Address.DAIFEED, Address.stETHFEED, Address.ENZYMESHARESFEED],
      [18, 18, 18],
      Address.DAI,
    );

    const parameters = [
      ['bytes8', hex('PRC_FEED')],
      ['address', priceFeedOracle.address],
    ];

    const addSwapOperator = web3.eth.abi.encodeParameters(
      parameters.map(p => p[0]),
      parameters.map(p => p[1]),
    );

    // add new category for sendClaimPayout call
    await submitGovernanceProposal(UpdatePoolAddressParametersCategory, addSwapOperator, voters, governance);

    this.priceFeedOracle = priceFeedOracle;
  });

  it('add Pool addAsset category', async function () {
    const { governance, voters, proposalCategory, pool } = this;

    const parameters = [
      ['string', 'Add Asset to Pool'], // name
      ['uint256', Role.AdvisoryBoard], // member role that votes
      ['uint256', 60], // majority vote percentage
      ['uint256', 15], // quorum percentage
      ['uint256[]', [Role.AdvisoryBoard]], // allowed to create proposal
      ['uint256', 3 * 24 * 3600], // closing time 3 days
      ['string', ''], // action hash - probably ipfs hash
      ['address', '0x0000000000000000000000000000000000000000'], // contract address: used only if next is "EX"
      ['bytes2', hex('P1')], // contract name
      // "incentives" is [min stake, incentive, ab voting req, special resolution]
      ['uint256[]', [0, 0, 1, 0]],
      ['string', 'addAsset(address,uint112,uint112,uint256)'], // function signature
    ];

    const addCategory = web3.eth.abi.encodeParameters(
      parameters.map(p => p[0]),
      parameters.map(p => p[1]),
    );

    const totalCategories = await proposalCategory.totalCategories();
    this.addAssetCategory = totalCategories;

    await submitGovernanceProposal(ProposalCategory.addCategory, addCategory, voters, governance);
  });

  it('add new enzyme shares asset', async function () {

    const { pool, voters, governance, addAssetCategory } = this;

    const asset = enzymeV4VaultProxyAddress;
    const min = ether('15000');
    const max = ether('16000');
    const maxSlippageRatio = ether('0.025'); // 2.5%
    const parameters = [
      ['address', asset],
      ['uint112', min],
      ['uint112', max],
      ['uint256', maxSlippageRatio],
    ];

    const addAsset = web3.eth.abi.encodeParameters(
      parameters.map(p => p[0]),
      parameters.map(p => p[1]),
    );

    await submitGovernanceProposal(addAssetCategory, addAsset, voters, governance);

    console.log('Query pool value');
    const poolValueInEth = await pool.getPoolValueInEth();

    console.log({
      poolValueInEth: poolValueInEth.toString(),
    });
  });

  it('upgrade contracts', async function () {
    const { master, oldSwapOperator, pool, voters, governance } = this;

    console.log('Deploying contracts');

    const twapOracle = await TwapOracle.at(await oldSwapOperator.twapOracle());
    const swapController = await oldSwapOperator.swapController();

    await fund(swapController);
    await unlock(swapController);
    await (swapController);

    const enzymeSharesToken = await ERC20.at(enzymeV4VaultProxyAddress);
    const swapOperator = await SwapOperator.new(
      master.address,
      twapOracle.address,
      swapController,
      Address.stETH,
      enzymeV4VaultProxyAddress,
      enzymeFundValueCalulatorRouter,
      Address.WETH
    );

    const parameters = [
      ['bytes8', hex('SWP_OP')],
      ['address', swapOperator.address],
    ];

    const addSwapOperator = web3.eth.abi.encodeParameters(
      parameters.map(p => p[0]),
      parameters.map(p => p[1]),
    );
    const poolValueInEthBefore = await pool.getPoolValueInEth();

    await submitGovernanceProposal(UpdatePoolAddressParametersCategory, addSwapOperator, voters, governance);

    const storedSwapOperatorAddress = await pool.swapOperator();
    assert.equal(storedSwapOperatorAddress, swapOperator.address);

    const poolValueInEthAfter = await pool.getPoolValueInEth();

    assert.equal(poolValueInEthAfter.toString(), poolValueInEthBefore.toString());

    this.swapOperator = swapOperator;
    this.swapController = swapController;
    this.enzymeSharesToken = enzymeSharesToken;
  });

  it('Enables SwapOperator as depositor', async function () {

    const { swapOperator, pool } = this;

    const comptroller = await IEnzymeV4Comptroller.at(enzymeComptrollerProxyAddress);

    const vault = await IEnzymeV4Vault.at(enzymeV4VaultProxyAddress);

    const owner = await vault.getOwner();

    console.log({
      vaultOwner: owner,
    });

    await unlock(owner);
    await fund(owner);

    const selector = web3.eth.abi.encodeFunctionSignature('addToList(uint256,address[])');
    const args = web3.eth.abi.encodeParameters(
      ['uint256', 'address[]'],
      [ListIdForDepositors, [swapOperator.address]],
    );

    await comptroller.vaultCallOnContract(
      AddressListRegistry,
      selector,
      args, {
        from: owner,
      },
    );

    const receiverArgs = web3.eth.abi.encodeParameters(
      ['uint256', 'address[]'],
      [ListIdForReceivers, [swapOperator.address]],
    );

    await comptroller.vaultCallOnContract(
      AddressListRegistry,
      selector,
      receiverArgs, {
        from: owner,
      },
    );

    const registry = await IAddressListRegistry.at(enzymeAddressListRegistry);

    const inList = await registry.isInList(ListIdForDepositors, swapOperator.address);

    assert.equal(inList, true);

    const inReceiverList = await registry.isInList(ListIdForReceivers, swapOperator.address);
    assert.equal(inReceiverList, true);
  });

  it('triggers small enzyme investment', async function () {
    const { swapOperator, swapController, enzymeSharesToken, pool } = this;

    const poolValueInEthBefore = await pool.getPoolValueInEth();

    const balanceBefore = await enzymeSharesToken.balanceOf(pool.address);

    const amountIn = ether('200');
    const amountOutMin = amountIn;
    await swapOperator.swapETHForEnzymeVaultShare(amountIn, amountOutMin, {
      from: swapController,
    });

    const balanceAfter = await enzymeSharesToken.balanceOf(pool.address);
    const poolValueInEthAfter = await pool.getPoolValueInEth();

    const poolValueDelta = poolValueInEthBefore.sub(poolValueInEthAfter);

    console.log({
      balanceBefore: balanceBefore.toString(),
      balanceAfter: balanceAfter.toString(),
      poolValueInEthAfter: poolValueInEthAfter.toString(),
      poolValueInEthBefore: poolValueInEthBefore.toString(),
      poolValueDelta: poolValueDelta.toString(),
    });
  });

  it('triggers large enzyme investment', async function () {
    const { swapOperator, swapController, enzymeSharesToken, pool } = this;

    const poolValueInEthBefore = await pool.getPoolValueInEth();

    const balanceBefore = await enzymeSharesToken.balanceOf(pool.address);

    await time.increase(11 * 60 * 60); // increase by 11 minutes

    const amountIn = ether('15000');
    const amountOutMin = amountIn.add(ether('0.00000001'));
    await swapOperator.swapETHForEnzymeVaultShare(amountIn, amountOutMin, {
      from: swapController,
    });

    const balanceAfter = await enzymeSharesToken.balanceOf(pool.address);
    const poolValueInEthAfter = await pool.getPoolValueInEth();

    const poolValueDelta = poolValueInEthBefore.sub(poolValueInEthAfter);

    console.log({
      balanceBefore: balanceBefore.toString(),
      balanceAfter: balanceAfter.toString(),
      poolValueInEthAfter: poolValueInEthAfter.toString(),
      poolValueInEthBefore: poolValueInEthBefore.toString(),
      poolValueDelta: poolValueDelta.toString(),
    });
  });

  it('sets new enzyme shares asset bounds', async function () {

    const { pool, voters, governance } = this;

    const asset = enzymeV4VaultProxyAddress;
    const min = ether('14000');
    const max = ether('15000');
    const maxSlippageRatio = ether('0.025'); // 2.5%
    const parameters = [
      ['address', asset],
      ['uint112', min],
      ['uint112', max],
      ['uint256', maxSlippageRatio],
    ];

    const setAsset = web3.eth.abi.encodeParameters(
      parameters.map(p => p[0]),
      parameters.map(p => p[1]),
    );

    await submitGovernanceProposal(SetAssetDetailsProposalCategory, setAsset, voters, governance);

    console.log('Query pool value');
    const poolValueInEth = await pool.getPoolValueInEth();

    console.log({
      poolValueInEth: poolValueInEth.toString(),
    });
  });

  it('triggers enzyme withdrawal', async function () {

    const { swapOperator, swapController, enzymeSharesToken, pool } = this;

    const poolValueInEthBefore = await pool.getPoolValueInEth();

    const balanceBefore = await enzymeSharesToken.balanceOf(pool.address);

    await time.increase(11 * 60 * 60); // increase by 11 minutes

    const amountIn = ether('1000');
    const amountOutMin = amountIn.sub(ether('1'));
    await swapOperator.swapEnzymeVaultShareForETH(amountIn, amountOutMin, {
      from: swapController,
    });

    const balanceAfter = await enzymeSharesToken.balanceOf(pool.address);
    const poolValueInEthAfter = await pool.getPoolValueInEth();

    const poolValueDelta = poolValueInEthBefore.sub(poolValueInEthAfter);

    console.log({
      balanceBefore: balanceBefore.toString(),
      balanceAfter: balanceAfter.toString(),
      poolValueInEthAfter: poolValueInEthAfter.toString(),
      poolValueInEthBefore: poolValueInEthBefore.toString(),
      poolValueDelta: poolValueDelta.toString(),
    });

  });
});
