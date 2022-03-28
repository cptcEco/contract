var CptcToken = artifacts.require("CptcToken");
module.exports = (deployer) => {
  deployer.deploy(CptcToken);
};
