const CptcToken = artifacts.require("CptcToken");
contract("CptcToken", (accounts) => {
  it("testing ResponseMessage of CptcToken", async () => {
    const CptcTokenInstance = await CptcToken.deployed();
    var returnValue1;
    returnValue1 = await CptcTokenInstance.ResponseMessage.call();

    // Write an assertion below to check the return value of ResponseMessage.
    assert.equal(
      "something",
      "something",
      "A correctness property about ResponseMessage of CptcToken"
    );
  });

  it("testing Responder of CptcToken", async () => {
    const CptcTokenInstance = await CptcToken.deployed();
    var returnValue1;
    returnValue1 = await CptcTokenInstance.Responder.call();

    // Write an assertion below to check the return value of Responder.
    assert.equal(
      "something",
      "something",
      "A correctness property about Responder of CptcToken"
    );
  });

  it("testing RequestMessage of CptcToken", async () => {
    const CptcTokenInstance = await CptcToken.deployed();
    var returnValue1;
    returnValue1 = await CptcTokenInstance.RequestMessage.call();

    // Write an assertion below to check the return value of RequestMessage.
    assert.equal(
      "something",
      "something",
      "A correctness property about RequestMessage of CptcToken"
    );
  });

  it("testing State of CptcToken", async () => {
    const CptcTokenInstance = await CptcToken.deployed();
    var returnValue1;
    returnValue1 = await CptcTokenInstance.State.call();

    // Write an assertion below to check the return value of State.
    assert.equal(
      "something",
      "something",
      "A correctness property about State of CptcToken"
    );
  });

  it("testing Requestor of CptcToken", async () => {
    const CptcTokenInstance = await CptcToken.deployed();
    var returnValue1;
    returnValue1 = await CptcTokenInstance.Requestor.call();

    // Write an assertion below to check the return value of Requestor.
    assert.equal(
      "something",
      "something",
      "A correctness property about Requestor of CptcToken"
    );
  });

  it("testing SendRequest of CptcToken", async () => {
    const CptcTokenInstance = await CptcToken.deployed();
    var callerAccount = accounts[0];
    var requestMessage1 = "StringValue1";
    await CptcTokenInstance.SendRequest(requestMessage1, {
      from: callerAccount,
    });

    // Because the function call can change the state of contract CptcToken, please write assertions
    // below to check the contract state.
    assert.equal(
      "something",
      "something",
      "A correctness property about SendRequest of CptcToken"
    );
  });

  it("testing SendResponse of CptcToken", async () => {
    const CptcTokenInstance = await CptcToken.deployed();
    var callerAccount = accounts[0];
    var responseMessage1 = "StringValue1";
    await CptcTokenInstance.SendResponse(responseMessage1, {
      from: callerAccount,
    });

    // Because the function call can change the state of contract CptcToken, please write assertions
    // below to check the contract state.
    assert.equal(
      "something",
      "something",
      "A correctness property about SendResponse of CptcToken"
    );
  });
});
