const { takeSnapshot, revertToSnapshot } = require('../utils').evm;
const { setup } = require('./setup');

describe.only('Assessment', function () {
  before(setup);

  beforeEach(async function () {
    this.snapshotId = await takeSnapshot();
  });

  afterEach(async function () {
    await revertToSnapshot(this.snapshotId);
  });

  require('./getPollStatus');
  // require('./getPayoutImpactOfClaim');
  // require('./getPayoutImpactOfIncident');
  require('./getPollEndDate');
  // require('./getCooldownEndDate');
  // require('./getPollStatus');
  // require('./getClaimToDisplay');
  // require('./getClaimsToDisplay');
  // require('./submitClaim');
  // require('./submitIncident');
  // require('./releaseIncidentAssessmentDeposit');
  require('./depositStake');
  // require('./withdrawReward');
  // require('./withdrawStake');
  // require('./redeemClaimPayout');
  // require('./redeemIncidentPayout');
  // require('./castVote');
  // require('./submitFraud');
  // require('./burnFraud');
  // require('./updateUintParameters');
});
