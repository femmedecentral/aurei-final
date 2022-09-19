const { expect } = require("chai");
const { BigNumber } = require("ethers");
const { ethers } = require("hardhat");

describe("MutantAureliusAurei", function () {

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // global contract variables used frequently throughout

  let contractFactory;
  let deployedContract;

  let signerOwner;
  let signerUser1;
  let signerUser2;
  let shittyUser;

  let contractAsOwner;
  let contractAsUser1;
  let contractAsUser2;
  let contractAsShittyUser;
  let contractReadOnly;

  const revertStringMustBeOwner = "Impostors to the throne embarrass only themselves.";
  const revertStringContractIsPaused = "SOON";
  const revertStringMustPayMinimum = "Yo, you gotta pay at least the minimum";
  const revertStringCannotMintThatManyAtOnce = "One can pledge one\'s loyalty only so many times.";
  const revertStringCannotMintMoreThanMax = "Many have come before you. Too many, in fact.";
  const revertStringOwnerQueryNonexistentToken = "ERC721: owner query for nonexistent token";
  const revertStringURIQueryNonexistentToken = "ERC721Metadata: URI query for nonexistent token";
  const revertStringDontWithdrawZeroBalance = "Yo, don't waste your gas trying to withdraw a zero balance";
  const revertStringCantTransferWhilePaused = "Yo, can't transfer a token when the contract is paused";
  const revertStringShitList = "NONE FOR YOU";
  const revertStringforAttemptedOwnerManageTransfer = "Only Mutant Aurelius can bestow owner his favor upon the masses.";
  const revertStringMintFavoriteOutsideSet = "You're trying to mint an Aureus outside the set";
  const revertStringAureusAlreadyMinted = "You have great taste; someone else has already minted your favorite.";
  const revertStringAllowlistClosed = "Allowlisting isn't enabled. Picking favorites is a thing of the past.";
  const revertStringNotAllowlisted = "You're not on the list.";

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // before all tests run
  before(async function () {

    contractFactory = await ethers.getContractFactory("MutantAureliusAurei");

    // get test accounts
    [signerOwner, signerUser1, signerUser2, shittyUser] = await ethers.getSigners();

  });

  // reset before each test
  beforeEach(async function () {

    // redeploy fresh contract
    deployedContract = await contractFactory.deploy();
    await deployedContract.deployed();

    // reconnect contracts to user accounts
    contractAsOwner = await deployedContract.connect(signerOwner);
    contractAsUser1 = await deployedContract.connect(signerUser1);
    contractAsUser2 = await deployedContract.connect(signerUser2);
    contractAsShittyUser = await deployedContract.connect(shittyUser);
    contractReadOnly = await deployedContract.connect(ethers.provider);

  });

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  describe("Deployment", function() {

    it("contract owner() function returns the address used to deploy", async function () {

      expect(
        await contractReadOnly.owner()
      ).to.equal(signerOwner.address);

    });

    it("contract deploys with correct name and symbol", async function () {

      expect(
        await contractReadOnly.name()
      ).to.equal("Mutant Aurelius Aurei");

      expect(
        await contractReadOnly.symbol()
      ).to.equal("MAA");

    });

    it("contract deploys with 7 indexed tokens minted", async function () {

      expect(
        await contractReadOnly.getIndexedAureiCount()
      ).to.equal(BigNumber.from(7));

    });

    it("contract deploys as paused and immediate mint reverts", async function() {

      expect(
        await contractReadOnly.getContractIsPaused()
      ).to.equal(true);

      await expect(
        contractAsUser1.mint()
      ).to.be.revertedWith(revertStringContractIsPaused);

    });

    it("contract deploys with correct tokenURIs", async function() {

      expect(
        await contractReadOnly.tokenURI(1)
      ).to.equal("ipfs://loremipsum/1");

    });

  });

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  describe("Owner ACLs", function() {

    it("user1 cannot call ownerSetBaseTokenURI()", async function () {

      await expect(
        contractAsUser1.ownerSetBaseTokenURI("https://somethinginteresting.news/testcase/")
      ).to.be.revertedWith(revertStringMustBeOwner);

    });

    it("user1 cannot call setPausedState()", async function () {

      await expect(
        contractAsUser1.ownerSetPausedState(false)
      ).to.be.revertedWith(revertStringMustBeOwner);

      await expect(
        contractAsUser1.ownerSetPausedState(true)
      ).to.be.revertedWith(revertStringMustBeOwner);

    });

    it("user1 cannot call ownerWithdrawContractBalance()", async function () {

      await expect(
        contractAsUser1.ownerWithdrawContractBalance()
      ).to.be.revertedWith(revertStringMustBeOwner);

    });

    it("owner can call ownerSetBaseTokenURI()", async function () {

      await contractAsOwner.ownerSetBaseTokenURI("https://somethinginteresting.news/testcase/");
      
      expect(
        await contractReadOnly.tokenURI(1)
      ).to.equal("https://somethinginteresting.news/testcase/1");

    });

    it("owner can call getShitlist", async function () {

      expect(
        await contractReadOnly.isOnShitlist(shittyUser.address)
      ).to.equal(true); // quick spotcheck

    });

    it("owner can call setPausedState()", async function () {

      await contractAsOwner.ownerSetPausedState(false);
      // todo: add test effect

      await contractAsOwner.ownerSetPausedState(true);
      // todo: add test effect

    });

    it("owner can update wallet mint max", async function () {

      await contractAsOwner.ownerSetPausedState(false);
      await contractAsOwner.ownerSetAllowlistActive(false);
      await contractAsUser1.mint();

      await expect(
        contractAsUser1.mint()
      ).to.be.revertedWith(revertStringCannotMintThatManyAtOnce);

      await contractAsOwner.ownerUpdateWalletLimit(5);

      await contractAsUser1.mint();
      await contractAsUser1.mint();
      await contractAsUser1.mint();
      await contractAsUser1.mint();

      await expect(
        contractAsUser1.mint()
      ).to.be.revertedWith(revertStringCannotMintThatManyAtOnce);

    });

    it("owner can call ownerWithdrawContractBalance()", async function () {

      // note: intentionally not testing a simple call on ownerWithDrawContractBalance() due to the complexity in
      // setting up the balance and the checks in that function; see the withdraw section later for a full suite of
      // tests. but leaving the shell test here for completeness in this section's coverage

    });

  });

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  describe("Allowlisting", function() {

    beforeEach(async function () {
  
      await contractAsOwner.ownerSetPausedState(false);
  
    });

    it("user1 can mint only after added to allowlist", async function () {

      await contractAsOwner.ownerSetPausedState(false);
      await contractAsOwner.ownerSetAllowlistActive(true);

      await expect(
        contractAsUser1.mint()
      ).to.be.revertedWith(revertStringNotAllowlisted);

      await contractAsOwner.ownerAddToAllowlist(signerUser1.address);

      await contractAsUser1.mint();

      expect(
        await contractReadOnly.ownerOf(8)
      ).to.equal(signerUser1.address); // check owner is #8

    });

    it("user1 can mint favorite after added to allowlist", async function () {

      await contractAsOwner.ownerSetPausedState(false);
      await contractAsOwner.ownerSetAllowlistActive(true);

      await expect(
        contractAsUser1.mint()
      ).to.be.revertedWith(revertStringNotAllowlisted);

      await contractAsOwner.ownerAddToAllowlist(signerUser1.address);

      await contractAsUser1.mintFavorite(22);

      expect(
        await contractReadOnly.ownerOf(22)
      ).to.equal(signerUser1.address); // check user1 is owner is #22

    });

    //TODO: Can owner transfer while in allowlist phase?

    it("user1 cannot mint favorite when allowlist is closed", async function () {

      await contractAsOwner.ownerSetPausedState(false);
      await contractAsOwner.ownerSetAllowlistActive(false);

      await expect(
        contractAsUser1.mintFavorite(22)
      ).to.be.revertedWith(revertStringAllowlistClosed);

      expect(
        await contractReadOnly.balanceOf(signerUser1.address)
      ).to.equal(BigNumber.from(0));

    });

    it("user1 can mint regularly when allowlist is closed", async function () {

      await contractAsOwner.ownerSetPausedState(false);
      await contractAsOwner.ownerSetAllowlistActive(false);

      await contractAsUser1.mint();

      expect(
        await contractReadOnly.ownerOf(8)
      ).to.equal(signerUser1.address); // check user1 is owner is #8

    });

  });

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  describe("Minting", function() {

    beforeEach(async function () {
  
      await contractAsOwner.ownerSetPausedState(false);
      await contractAsOwner.ownerSetAllowlistActive(false);
  
    });

    it("owner managed tokens are issued at initialization", async function() {

      expect(
        await contractReadOnly.getIndexedAureiCount()
      ).to.equal(BigNumber.from(7)); // ensure 7 have been minted

      expect(
        await contractReadOnly.balanceOf(signerOwner.address)
      ).to.equal(BigNumber.from(8)); // ensure contract owner owns all 8

      expect(
        await contractReadOnly.ownerOf(6)
      ).to.equal(signerOwner.address); // quick spotcheck

      expect(
        await contractReadOnly.ownerOf(888)
      ).to.equal(signerOwner.address); // check owner managed for femmedecenral@ token

    });
  
    it("user1 cannot mint on paused contract", async function() {
  
      await contractAsOwner.ownerSetPausedState(true); // the only time we override this in this suite
  
      await expect(
        contractAsUser1.mint()
      ).to.be.revertedWith(revertStringContractIsPaused);
  
      expect(
        await contractReadOnly.balanceOf(signerUser1.address)
      ).to.equal(BigNumber.from(0));
  
      expect(
        await contractReadOnly.getIndexedAureiCount()
      ).to.equal(BigNumber.from(7));
  
    });

    it("user1 can mint 1 (max)", async function() {
  
      await contractAsUser1.mint();

      expect(
        await contractReadOnly.balanceOf(signerUser1.address)
      ).to.equal(BigNumber.from(1));
  
      expect(
        await contractReadOnly.getIndexedAureiCount()
      ).to.equal(BigNumber.from(8));
  
    });
  
    it("user1 cannot mint 2 (more than max)", async function() {
  
      await contractAsUser1.mint();

      await expect(
        contractAsUser1.mint()
      ).to.be.revertedWith(revertStringCannotMintThatManyAtOnce);
  
      expect(
        await contractReadOnly.balanceOf(signerUser1.address)
      ).to.equal(BigNumber.from(1));
  
      expect(
        await contractReadOnly.getIndexedAureiCount()
      ).to.equal(BigNumber.from(8));
  
    });

    it("ensure shitty user can't mint", async function() {

      await expect(
        contractAsShittyUser.mint()
      ).to.be.revertedWith(revertStringShitList);
  
      expect(
        await contractReadOnly.balanceOf(signerUser1.address)
      ).to.equal(BigNumber.from(0));
  
      expect(
        await contractReadOnly.getIndexedAureiCount()
      ).to.equal(BigNumber.from(7));
  
    });

    it("user1 can mint their favorite token: #333", async function() {
  
      await contractAsOwner.ownerSetAllowlistActive(true); 
      await contractAsOwner.ownerAddToAllowlist(signerUser1.address);

      await contractAsUser1.mintFavorite(333);

      expect(
        await contractReadOnly.balanceOf(signerUser1.address)
      ).to.equal(BigNumber.from(1));

      expect(
        await contractReadOnly.ownerOf(333)
      ).to.equal(signerUser1.address);
  
    });

    it("user1 can mint their favorite token: #333, and user 2 can still mint the next available token, #8", async function() {
  
      await contractAsOwner.ownerSetAllowlistActive(true); 
      await contractAsOwner.ownerAddToAllowlist(signerUser1.address);
      await contractAsOwner.ownerAddToAllowlist(signerUser2.address);

      await contractAsUser1.mintFavorite(333);
      await contractAsUser2.mint();

      expect(
        await contractReadOnly.balanceOf(signerUser1.address)
      ).to.equal(BigNumber.from(1));
  
      expect(
        await contractReadOnly.getIndexedAureiCount()
      ).to.equal(BigNumber.from(8));

      expect(
        await contractReadOnly.ownerOf(333)
      ).to.equal(signerUser1.address);

      expect(
        await contractReadOnly.ownerOf(8)
      ).to.equal(signerUser2.address);
  
    });

    it("user1 can mint their favorite token: #8, and user 2 can still mint the next available token, #9", async function() {
  
      await contractAsOwner.ownerSetAllowlistActive(true); 
      await contractAsOwner.ownerAddToAllowlist(signerUser1.address);
      await contractAsOwner.ownerAddToAllowlist(signerUser2.address);

      await contractAsUser1.mintFavorite(8);
      await contractAsUser2.mint();

      expect(
        await contractReadOnly.balanceOf(signerUser1.address)
      ).to.equal(BigNumber.from(1));
  
      expect(
        await contractReadOnly.getIndexedAureiCount()
      ).to.equal(BigNumber.from(9));

      expect(
        await contractReadOnly.ownerOf(8)
      ).to.equal(signerUser1.address);

      expect(
        await contractReadOnly.ownerOf(9)
      ).to.equal(signerUser2.address);
  
    });

    it("user1 cannot mint their favorite token: #6", async function() {
  
      await contractAsOwner.ownerSetAllowlistActive(true); 
      await contractAsOwner.ownerAddToAllowlist(signerUser1.address);

      await expect(
        contractAsUser1.mintFavorite(6)
      ).to.be.revertedWith(revertStringAureusAlreadyMinted);
  
      expect(
        await contractReadOnly.balanceOf(signerUser1.address)
      ).to.equal(BigNumber.from(0));

    });

    it("user1 cannot mint their favorite token: #888", async function() {

      await contractAsOwner.ownerSetAllowlistActive(true); 
      await contractAsOwner.ownerAddToAllowlist(signerUser1.address);
  
      await expect(
        contractAsUser1.mintFavorite(888)
      ).to.be.revertedWith(revertStringMintFavoriteOutsideSet);
  
      expect(
        await contractReadOnly.balanceOf(signerUser1.address)
      ).to.equal(BigNumber.from(0));

    });

    it("users can mint a combo of favorite and next and numbers increment correctly", async function() {

      await contractAsOwner.ownerSetAllowlistActive(true); 
      await contractAsOwner.ownerAddToAllowlist(signerUser1.address);
      await contractAsOwner.ownerAddToAllowlist(signerUser2.address);

      expect(
        await contractReadOnly.getTotalAureiMinted()
      ).to.equal(BigNumber.from(8)); // 1-7 and 888 are owner managed 

      await contractAsUser1.mintFavorite(8);
      await contractAsUser2.mint(); // should get 9

      expect(
        await contractReadOnly.ownerOf(9)
      ).to.equal(signerUser2.address);

      await contractAsOwner.ownerUpdateWalletLimit(6);

      await contractAsUser1.mint(); // 10
      await contractAsUser1.mint(); // 11 
      await contractAsUser1.mint(); // 12

      await contractAsUser1.mintFavorite(13); // 13
      await contractAsUser1.mintFavorite(14); // 14

      await contractAsUser2.mint(); // 15

      expect(
        await contractReadOnly.ownerOf(15)
      ).to.equal(signerUser2.address);

      expect(
        await contractReadOnly.getTotalAureiMinted()
      ).to.equal(BigNumber.from(16)); // check that we have the right amount of auerii (first 15, and 888)

    });

    // TODO: check that owner can withdraw funds

  
  });

  describe("Transferring", function() {

    beforeEach(async function () {
  
      await contractAsOwner.ownerSetPausedState(false);
      await contractAsOwner.ownerSetAllowlistActive(false);
  
    });

// TODO: can owner use transferFrom for managed only tokens? Probably doens't leave behind a memento... but do we want to make possible?
// TODO: just test simple owner token transfer

    it("owner can transfer owner-managed token to user 1", async function() {
  
      expect(
        await contractReadOnly.ownerOf(6)
      ).to.equal(signerOwner.address); // check that #6 is in owner's wallet first
      
      await contractAsOwner.ownerSetNewTokenOwner(6, signerUser1.address) // owner sends #6 to user1

      expect(
        await contractReadOnly.balanceOf(signerUser1.address)
      ).to.equal(BigNumber.from(1)); // check that a token is in user1's wallet

      expect(
        await contractReadOnly.ownerOf(6)
      ).to.equal(signerUser1.address); // check that #6 is in user1's wallet
  
    });

    it("owner managed tokens cannot be transferred by user1", async function() {

      expect(
        await contractReadOnly.ownerOf(6)
      ).to.equal(signerOwner.address); // check that #6 is in owner's wallet first
      
      await contractAsOwner.ownerSetNewTokenOwner(6, signerUser1.address) // owner sends #6 to user1

      expect(
        await contractReadOnly.balanceOf(signerUser1.address)
      ).to.equal(BigNumber.from(1)); // check that a token is in user1's wallet

      expect(
        await contractReadOnly.ownerOf(6)
      ).to.equal(signerUser1.address); // check that #6 is in user1's wallet

      await expect(
        contractAsUser1.transferFrom(signerUser1.address, signerUser2.address, 6)
      ).to.be.revertedWith(revertStringforAttemptedOwnerManageTransfer); // provided that user1 has #6, user1's attempt to transfer should be blocked

    });
  
    it("user1 can transfer a standard coin to user2", async function() {

      await contractAsUser1.mint(); // first, user1 mints a standard coin

      await contractReadOnly.ownerOf(8);

      expect(
        await contractReadOnly.ownerOf(8)
      ).to.equal(signerUser1.address); // check that #8 is in user1's wallet

      await contractAsUser1.transferFrom(signerUser1.address, signerUser2.address, 8); // user1 transfers #8 from their wallet to user2

      expect(
        await contractReadOnly.ownerOf(8)
      ).to.equal(signerUser2.address); // check that #8 is now in user2's wallet
  
    });

    it("user1 can *not* transfer a standard coin to a shitty user", async function() {
  
      await contractAsUser1.mint(); // first, user1 mints a standard coin

      expect(
        await contractReadOnly.ownerOf(8)
      ).to.equal(signerUser1.address); // check that #8 is in user1's wallet

      await expect(
        contractAsUser1.transferFrom(signerUser1.address, shittyUser.address, 8) // attempt to transfer to shittyUser shouldn't succeed
      ).to.be.revertedWith(revertStringShitList);

      expect(
        await contractReadOnly.ownerOf(8)
      ).to.equal(signerUser1.address); // check that #8 is still in user1's wallet after failed transfer
  
    });
  
    it("owner can transfer owner-managed to user1 and then user2; leaves memento", async function() {
  
      expect(
        await contractReadOnly.ownerOf(6)
      ).to.equal(signerOwner.address); // check that #6 is in owner's wallet first
      
      await contractAsOwner.ownerSetNewTokenOwner(6, signerUser1.address) // owner sends #6 to user1
      await contractAsOwner.ownerSetNewTokenOwner(6, signerUser2.address) // owner sends #6 to user2

      expect(
        await contractReadOnly.ownerOf(889)
      ).to.equal(signerUser1.address); // check that user1's wallet contains a memento
      

      expect(
        await contractReadOnly.ownerOf(6)
      ).to.equal(signerUser2.address); // check that #6 is in user2's wallet

      expect(
        await contractReadOnly.tokenURI(889)
      ).to.equal("ipfs://loremipsum/memento"); // check that 1st memento has memento metadata
  
    });

    it("owner can transfer owner-managed to user1 and then user2; leaves memento... 2x", async function() {

      expect(
        await contractReadOnly.ownerOf(6)
      ).to.equal(signerOwner.address); // check that #6 is in owner's wallet first
      
      await contractAsOwner.ownerSetNewTokenOwner(6, signerUser1.address) // owner sends #6 to user1
      await contractAsOwner.ownerSetNewTokenOwner(6, signerUser2.address) // owner sends #6 to user2
      await contractAsOwner.ownerSetNewTokenOwner(6, signerUser1.address) // owner sends #6 to user1
      await contractAsOwner.ownerSetNewTokenOwner(6, signerUser2.address) // owner sends #6 to user2

      expect(
        await contractReadOnly.ownerOf(889)
      ).to.equal(signerUser1.address); // check that user1's wallet contains a memento

      expect(
        await contractReadOnly.balanceOf(signerUser1.address)
      ).to.equal(BigNumber.from(2)); // there should also be 2 mementos

      expect(
        await contractReadOnly.ownerOf(6)
      ).to.equal(signerUser2.address); // check that #6 is in user2's wallet

      expect(
        await contractReadOnly.tokenURI(889)
      ).to.equal("ipfs://loremipsum/memento"); // check that 1st memento has memento metadata

      expect(
        await contractReadOnly.tokenURI(890)
      ).to.equal("ipfs://loremipsum/memento"); // check that 2nd memento has the same memento metadata
  
    });

    it("user1 can transfer a memento to user 2", async function() {

      // setup: owner transfers a owner-maanged coin to user 1, then owner transfers to user 2; user 1 gets a memento in the process

      expect(
        await contractReadOnly.ownerOf(6)
      ).to.equal(signerOwner.address); // check that #6 is in owner's wallet first
      
      await contractAsOwner.ownerSetNewTokenOwner(6, signerUser1.address) // owner sends #6 to user1
      await contractAsOwner.ownerSetNewTokenOwner(6, signerUser2.address) // owner sends #6 to user2

      // check that memento is in user 1's wallet

      expect(
        await contractReadOnly.ownerOf(889)
      ).to.equal(signerUser1.address); // check that user1's wallet contains a memento      
      
      // then user 1 sends their memento to user 2

      await contractAsUser1.transferFrom(signerUser1.address, signerUser2.address, 889);

      // check that user 1 has an empty wallet

      expect(
        await contractReadOnly.balanceOf(signerUser1.address)
      ).to.equal(BigNumber.from(0));

      // user 2 has the memento

      expect(
        await contractReadOnly.ownerOf(889)
      ).to.equal(signerUser2.address); // check that user2's wallet contains a memento
  
    });

    it("user1 can *not* transfer a memento to shitty user", async function() {

      // setup: owner transfers a owner-maanged coin to user 1, then owner transfers to user 2; user 1 gets a memento in the process

      expect(
        await contractReadOnly.ownerOf(6)
      ).to.equal(signerOwner.address); // check that #6 is in owner's wallet first
      
      await contractAsOwner.ownerSetNewTokenOwner(6, signerUser1.address) // owner sends #6 to user1
      await contractAsOwner.ownerSetNewTokenOwner(6, signerUser2.address) // owner sends #6 to user2

      // check that memento is in user 1's wallet

      expect(
        await contractReadOnly.ownerOf(889)
      ).to.equal(signerUser1.address); // check that user1's wallet contains a memento      
      
      // then user 1 attempts to send their memento to shittyUser

      await expect(
        contractAsUser1.transferFrom(signerUser1.address, shittyUser.address, 889)
      ).to.be.revertedWith(revertStringShitList);

      // check that shittyUser's wallet is empty

      expect(
        await contractReadOnly.balanceOf(shittyUser.address)
      ).to.equal(BigNumber.from(0));

      // user 1 has the memento

      expect(
        await contractReadOnly.ownerOf(889)
      ).to.equal(signerUser1.address); // check that user1's wallet contains a memento

    });


  
  });

  //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  describe("Longrunning Tests (>10s)", function() {

    it("user2 cannot mint past the maximum", async function() {

      await contractAsOwner.ownerSetPausedState(false);
      await contractAsOwner.ownerSetAllowlistActive(true); 
      await contractAsOwner.ownerAddToAllowlist(signerUser1.address);

      expect(
        await contractReadOnly.getTotalAureiMinted()
      ).to.equal(BigNumber.from(8)); // 1-7 and 888 are owner managed 

      await contractAsOwner.ownerUpdateWalletLimit(900);

      await contractAsUser1.mintFavorite(8);
      await contractAsUser1.mint(); // should get 9

      await expect(
        contractAsUser2.mint()
      ).to.be.revertedWith(revertStringNotAllowlisted); // user2 hasn't been allowlisted, so should fail on mint()

      await expect(
        contractAsUser2.mintFavorite(22)
      ).to.be.revertedWith(revertStringNotAllowlisted); // user2 hasn't been allowlisted, so should fail on mintFavorite(), too

      expect(
        await contractReadOnly.ownerOf(9)
      ).to.equal(signerUser1.address);

      for (i = 10; i <= 100; i++) {
        await contractAsUser1.mint();
      }

      expect(
        await contractReadOnly.getTotalAureiMinted()
      ).to.equal(BigNumber.from(101)); // check that we have the right amount of auerii (first 100, and 888)


      await contractAsUser1.mintFavorite(240); // 240
      await contractAsUser1.mintFavorite(734); // 734

      await expect(
        contractAsUser1.mintFavorite(734)
      ).to.be.revertedWith(revertStringAureusAlreadyMinted);

      await contractAsOwner.ownerSetAllowlistActive(false); 

      await contractAsUser2.mint(); // 101; mint() now available for user2 since allowlisting phase is over

      await expect(
        contractAsUser2.mintFavorite(22)
      ).to.be.revertedWith(revertStringAllowlistClosed); // now that gating factor is that allowlist is closed, so mintFavorite is no longer available

      expect(
        await contractReadOnly.ownerOf(101)
      ).to.equal(signerUser2.address);

      expect(
        await contractReadOnly.getTotalAureiMinted()
      ).to.equal(BigNumber.from(104)); // check that we have the right amount of auerii (first 100, and 888, +3 more)

      for (i = 102; i < 885; i++) { // only want it to run from 102 to 885, since two additional (240 and 734) have already been minted
        await contractAsUser1.mint();
      }

      await contractAsUser2.mint(); // 887

      expect(
        await contractReadOnly.getTotalAureiMinted()
      ).to.equal(BigNumber.from(888));

      expect(
        await contractReadOnly.ownerOf(887)
      ).to.equal(signerUser2.address);

      await expect(
        contractAsUser2.mint()
      ).to.be.revertedWith(revertStringCannotMintMoreThanMax); // expect it to fail now that 888 have been minted

      expect(
        await contractReadOnly.tokenURI(888)
      ).to.equal("ipfs://loremipsum/888"); // check that tokenURIs are working well

      // TODO: Not sure why this check isn't working; all calls to non-existant tokens aren't reverting correctly
      //expect(
      //  await contractReadOnly.tokenURI(889)
      //).to.revertedWith(revertStringURIQueryNonexistentToken); // 1st memento hasn't been minted yet, so URI lookup for that one shouldn't work yet

      // get a memento in user1's address
      await contractAsOwner.ownerSetNewTokenOwner(6, signerUser1.address) // owner sends #6 to user1
      await contractAsOwner.ownerSetNewTokenOwner(6, signerUser2.address) // owner sends #6 to user2
      await contractAsOwner.ownerSetNewTokenOwner(6, signerUser1.address) // owner sends #6 to user1

      expect(
        await contractReadOnly.tokenURI(889)
      ).to.equal("ipfs://loremipsum/memento"); // check that 1st memento has memento metadata

      expect(
        await contractReadOnly.tokenURI(890)
      ).to.equal("ipfs://loremipsum/memento"); // check that 2nd memento has the same memento metadata

    });

  });


});

  


