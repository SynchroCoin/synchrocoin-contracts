let SynchroCoin = artifacts.require("SynchroCoin");
const BigNumber = require("bignumber.js");
const assertFail = require("./helpers/assertFail");

let synchroCoin;

contract("SynchroCoin", function(accounts) {
  beforeEach(async () => {
    synchroCoin = await SynchroCoin.new(
      100000000000000000,
      0,
      100,
      accounts[0],
      { from: accounts[0] }
    );
  });

  // CREATION
  it("creation: should have imported an initial balance of 100000000000000000 from the old Token", async () => {
    assert.equal(
      (await synchroCoin.balanceOf.call(accounts[0])).toNumber(),
      100000000000000000
    );
  });

  // TRANSERS
  it("transfers: should transfer 100000000000000000 to accounts[1] with accounts[0] having 100000000000000000", async () => {
    watcher = synchroCoin.Transfer();
    await synchroCoin.transfer(accounts[1], 100000000000000000, {
      from: accounts[0]
    });
    let logs = watcher.get();
    assert.equal(logs[0].event, "Transfer");
    assert.equal(logs[0].args.from, accounts[0]);
    assert.equal(logs[0].args.to, accounts[1]);
    assert.equal(logs[0].args.value.toNumber(), 100000000000000000);
    assert.equal(await synchroCoin.balanceOf.call(accounts[0]), 0);
    assert.equal(
      (await synchroCoin.balanceOf.call(accounts[1])).toNumber(),
      100000000000000000
    );
  });

  it("transfers: should fail when trying to transfer 100000000000000001 to accounts[1] with accounts[0] having 100000000000000000", async () => {
    assertFail(async () => {
      await synchroCoin.transfer(accounts[1], 100000000000000010, {
        from: accounts[0]
      });
    });
    assert.equal(
      (await synchroCoin.balanceOf.call(accounts[0])).toNumber(),
      100000000000000000
    );
  });

  // APPROVALS
  it("approvals: msg.sender should approve 100 to accounts[1]", async () => {
    watcher = synchroCoin.Approval();
    await synchroCoin.approve(accounts[1], 100, { from: accounts[0] });
    let logs = watcher.get();
    assert.equal(logs[0].event, "Approval");
    assert.equal(logs[0].args.owner, accounts[0]);
    assert.equal(logs[0].args.spender, accounts[1]);
    assert.strictEqual(logs[0].args.value.toNumber(), 100);

    assert.strictEqual(
      (await synchroCoin.allowance.call(accounts[0], accounts[1])).toNumber(),
      100
    );
  });

  it("approvals: msg.sender approves accounts[1] of 100 & withdraws 20 once.", async () => {
    watcher = synchroCoin.Transfer();
    await synchroCoin.approve(accounts[1], 100, { from: accounts[0] });

    assert.strictEqual(
      (await synchroCoin.balanceOf.call(accounts[2])).toNumber(),
      0
    );
    await synchroCoin.transferFrom(accounts[0], accounts[2], 20, {
      from: accounts[1]
    });

    var logs = watcher.get();
    assert.equal(logs[0].event, "Transfer");
    assert.equal(logs[0].args.from, accounts[0]);
    assert.equal(logs[0].args.to, accounts[2]);
    assert.strictEqual(logs[0].args.value.toNumber(), 20);

    assert.strictEqual(
      (await synchroCoin.allowance.call(accounts[0], accounts[1])).toNumber(),
      80
    );

    assert.strictEqual(
      (await synchroCoin.balanceOf.call(accounts[2])).toNumber(),
      20
    );
    await synchroCoin.balanceOf.call(accounts[0]);
    assert.equal(
      (await synchroCoin.balanceOf.call(accounts[0])).toNumber(),
      99999999999999980
    );
  });

  it("approvals: msg.sender approves accounts[1] of 100 & withdraws 20 twice.", async () => {
    await synchroCoin.approve(accounts[1], 100, { from: accounts[0] });
    await synchroCoin.transferFrom(accounts[0], accounts[2], 20, {
      from: accounts[1]
    });
    await synchroCoin.transferFrom(accounts[0], accounts[2], 20, {
      from: accounts[1]
    });
    await synchroCoin.allowance.call(accounts[0], accounts[1]);

    assert.strictEqual(
      (await synchroCoin.allowance.call(accounts[0], accounts[1])).toNumber(),
      60
    );

    assert.strictEqual(
      (await synchroCoin.balanceOf.call(accounts[2])).toNumber(),
      40
    );

    assert.equal(
      (await synchroCoin.balanceOf.call(accounts[0])).toNumber(),
      99999999999999960
    );
  });

  //should approve 100 of msg.sender & withdraw 50 & 60 (should fail).
  it("approvals: msg.sender approves accounts[1] of 100 & withdraws 50 & 60 (2nd tx should fail)", async () => {
    await synchroCoin.approve(accounts[1], 100, { from: accounts[0] });
    await synchroCoin.transferFrom(accounts[0], accounts[2], 50, {
      from: accounts[1]
    });
    assert.strictEqual(
      (await synchroCoin.allowance.call(accounts[0], accounts[1])).toNumber(),
      50
    );

    assert.strictEqual(
      (await synchroCoin.balanceOf.call(accounts[2])).toNumber(),
      50
    );

    assert.equal(
      (await synchroCoin.balanceOf.call(accounts[0])).toNumber(),
      99999999999999950
    );
    assertFail(async () => {
      await synchroCoin.transferFrom.call(accounts[0], accounts[2], 60, {
        from: accounts[1]
      });
    });

    assert.strictEqual(
      (await synchroCoin.balanceOf.call(accounts[2])).toNumber(),
      50
    );
    assert.equal(
      (await synchroCoin.balanceOf.call(accounts[0])).toNumber(),
      99999999999999950
    );
  });

  it("approvals: attempt withdrawal from account with no allowance (should fail)", async () => {
    assertFail(async () => {
      await synchroCoin.transferFrom.call(accounts[0], accounts[2], 60, {
        from: accounts[1]
      });
    });
    assert.equal(
      (await synchroCoin.balanceOf.call(accounts[0])).toNumber(),
      100000000000000000
    );
  });

  it("approvals: allow accounts[1] 100 to withdraw from accounts[0]. Withdraw 60 and then approve 0 & attempt transfer.", async () => {
    await synchroCoin.approve(accounts[1], 100, { from: accounts[0] });
    await synchroCoin.transferFrom(accounts[0], accounts[2], 60, {
      from: accounts[1]
    });
    await synchroCoin.approve(accounts[1], 0, { from: accounts[0] });
    assertFail(async () => {
      await synchroCoin.transferFrom.call(accounts[0], accounts[2], 10, {
        from: accounts[1]
      });
    });
    assert.equal(
      (await synchroCoin.balanceOf.call(accounts[0])).toNumber(),
      99999999999999940
    );
  });
});
