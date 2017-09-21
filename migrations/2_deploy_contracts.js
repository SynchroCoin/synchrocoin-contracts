var SynchroCoin = artifacts.require("./SynchroCoin.sol");

module.exports = function (deployer) {
  deployer.deploy(SynchroCoin);
};
