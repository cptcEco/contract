var CptcToken = artifacts.require("CptcToken");
var Arg = "Hello world";
module.exports = (deployer) => {
  deployer.deploy(CptcToken, Arg);
};
