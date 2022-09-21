//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract MutantAureliusAurei is ERC721 {

    // counters is a safe way of counting that can only be +/- by one
    // https://docs.openzeppelin.com/contracts/4.x/api/utils#Counters
    using Counters for Counters.Counter;
    Counters.Counter private _aureindexCounter;
    Counters.Counter private _mementosIssuedCounter;
    Counters.Counter private _totalAureiMinted; 

    // traditionally we'd include SafeMath here, but safemath is no longer necessary in solidity 0.8.0+
    // https://docs.openzeppelin.com/contracts/4.x/api/utils
    // using SafeMath for uint256;

    uint256 private MAX_MINTABLE_AT_ONCE = 1; 

    // The fixed amount of Aurei tokens stored in an unsigned integer type variable.
    uint256 public totalAureiSupply = 888;
    uint256 public initialOwnerManagedTokens = 7;

    // these are private because we write getters for them, no need to make them readable as-is
    string private _baseTokenURI;

    // bool to pause contract; set to pause immediately after initial owner controlled tokens are minted to prevent premature public minting
    bool private _contractIsPaused;
    bool private _allowListActive;
    address private _ownerAddress;
    mapping (address => bool) private _shitlist;
    mapping (address => bool) private _allowlist;
    mapping (address => bool) private _extendedownerlist;	

    constructor() ERC721("Mutant Aurelius Aurei", "MAA") {
        
        //TODO: update with real IPFS link
        _baseTokenURI = "ipfs://loremipsum/";
        _ownerAddress = msg.sender; // deployer is permanent owner

        // shitlist addresses at time of contract deploy
        _shitlist[0x7d4c4d5380Ca2F9C7A091bb622B80613da7Eae8C] = true; // soby.eth
        _shitlist[0x385375FD99D6019c630b1315D3815BB162Aa039e] = true; // soby.eth
        _shitlist[0x90F79bf6EB2c4f870365E785982E1f101E93b906] = true; // for testing purposes

        // list of folks who can manage owner-managed tokens	
        _extendedownerlist[_ownerAddress] = true;	
        _extendedownerlist[0x5A97d44De4fE69E194541a4d78db37218872D859] = true;

        _contractIsPaused = false;
        _allowListActive = true;

        // Tokens ID #1-7 & #888 are to be initially owned by contract owner
        _mintOwnerManaged();

        // after initial mint, ensure we deploy as paused
        _contractIsPaused = true;

    }

    // public function to mint aurei; mints the next available Aureus
    function mint() public {
        
        // require that contract isn't paused when minting
        require(!_contractIsPaused, "SOON");

        // require that user is on allowlist if allowlist is enabled
        if (_allowListActive) {
            require(_allowlist[msg.sender] == true, "You're not on the list.");
        }

        // using tokenId = 0 to specify that we just want the next one, since solidity doens't offer optional params
        _mintAureiWithChecks(msg.sender, 0);
    }

    // public function to mint a favorite Aureus, provided it hasn't been claimed yet; only available in allowlist phase
    function mintFavorite(uint256 tokenId) public {
        // require that contract isn't paused when minting
        require(!_contractIsPaused, "SOON");

        // require that allowlist phase is on
        require(_allowListActive, "Allowlisting isn't enabled. Picking favorites is a thing of the past.");

        // require that user is on allowlist
        require(_allowlist[msg.sender] == true, "You're not on the list.");

        // require that favorite token is within range
        require(tokenId <= 888, "You're trying to mint an Aureus outside the set");

        // require that tokenID isn't already minted()
        require(!_exists(tokenId), "You have great taste; someone else has already minted your favorite.");

        _mintAureiWithChecks(msg.sender, tokenId);
    }

    // for minting aurei w/ contract specific checks
    function _mintAureiWithChecks(address _mintAddress, uint256 tokenId) internal {

        // ensure we aren't minting beyond the limit
        require(getTotalAureiMinted() < totalAureiSupply, "Many have come before you. Too many, in fact.");

        // ensure only one per wallet; current balance is zero aurei in the wallet, only enabling as courtesy
        require(balanceOf(msg.sender) < MAX_MINTABLE_AT_ONCE, "Always leave 'em wanting more.");

        // check to make sure they're not on our shitlist
        require(_shitlist[_mintAddress] != true, "NONE FOR YOU");

        // increment before minting
        // must ensure that the counter is aligned to next available slot, since we're allowing folks to mint out of order
        while (_exists(getIndexedAureiCount()) == true) { 
            _aureindexCounter.increment();
        }

        // provided all basic checks are cleared, mint it!
        _totalAureiMinted.increment(); // increment total minted
        if (tokenId == 0) {
            _mint(_mintAddress, getIndexedAureiCount()); // if tokenId is unspecified
        } else {
            _mint(_mintAddress, tokenId); // mint a specific token
        }

    }

    // for minting the initial Owner Managed tokens
    function _mintOwnerManaged() internal {
        // require that contract isn't paused when minting
        require(!_contractIsPaused, "SOON");

        // Tokens ID 1 - 7 and #888 are to be initially owned by contract owner
        for (uint256 mt = 1; mt <= initialOwnerManagedTokens; mt++) {
            _aureindexCounter.increment();
            _totalAureiMinted.increment();
            _mint(_ownerAddress, mt);
        }
        // minting femmedecentral@ token; don't incremental tokens because it'll cause numbers to start @ 8 instead of 7 issued tokens
        _totalAureiMinted.increment();
        _mint(_ownerAddress, 888);
    }

    ////// Transfer modifications

    // override the _beforeTokenTransfer hook to check our local paused variable, check the shitlist, and if owner managed
    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal override {

        // check that contract isn't paused
        require(!_contractIsPaused, "SOON");

        /// check to make sure they're not on our shitlist 
        require(_shitlist[to] != true, "NONE FOR YOU");

        // check to make sure only extendedownerlist can transfer owner managed coins	
        if(_isOwnerManaged(tokenId)) {	
            require(_extendedownerlist[msg.sender] == true, "Only Mutant Aurelius can bestow owner his favor upon the masses.");	
        } 

        super._beforeTokenTransfer(from, to, tokenId);

    }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // simple getters

    // this overrides the inherited _baseURI(), which is used to construct the token uri. honestly, this seems like a
    // weird way to do this but seems to be a good solution without making the entire contract inherit ERC721URIStorage
    function _baseURI() internal override view returns (string memory) {
        return _baseTokenURI;
    }

    // override on tokenURI function because we need to have the same metadata for all momentos, regardless of tokenID
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721: invalid token ID");

        if (tokenId <= 888) {
            return super.tokenURI(tokenId);
        } else if (_exists(tokenId)) {
            return bytes(_baseURI()).length > 0 ? string(abi.encodePacked(_baseURI(), "memento")) : "";
        } else {
            require(_exists(tokenId), "ERC721: invalid token ID");
        }
    }

    function getIndexedAureiCount() public view returns (uint256) {
        return _aureindexCounter.current(); 
    }

    function getContractIsPaused() public view returns (bool) {
        return _contractIsPaused;
    }

    function getIssuedMementoCount() public view returns (uint256) {
        return _mementosIssuedCounter.current();
    }

    // returns if address is on the shitlist
    function isOnShitlist(address questionedAddress) public view returns (bool) {
        return _shitlist[questionedAddress]; 
    }

    // returns if address is on the _extendedownerlist	
    function isOnExtendedOwnerList(address questionedAddress) public view returns (bool) {	
        return _extendedownerlist[questionedAddress]; 	
    }

    // returns total minted aurei
    function getTotalAureiMinted() public view returns (uint256) {
        return _totalAureiMinted.current();
    }

    // this is necessary to be able to edit the collection on opensea; it's a simple way to enable this functionality
    // without making the entire contract inherit ERC721Ownable, which has a bunch of functions we don't need
    function owner() public view returns (address) {
        return _ownerAddress;
    }

    // returns 888 as total number of Aurei, but the contract technically mints more via Mementos	
    function totalSupply() public view returns (uint256) {	
        return 888;	
    }

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    ///// Owner general management funtions

    modifier ownerOnlyACL() {
        require(msg.sender == _ownerAddress, "Impostors to the throne embarrass only themselves.");
        _;
    }

    // extending OwnerOnlyACL in some cases to include a slightly broader set of folks	
    modifier extendedOwnerOnlyACL() {	
        // only MA affiliated addresses can call this function	
        require(_extendedownerlist[msg.sender] == true, "Impostors to the throne embarrass only themselves.");	
        _;	
    }	

    // Update the extended Owner list 	
    function updateExtendedOwnerList(address _extendedOwnerAddress, bool isExtendedOwner) public ownerOnlyACL {	
        _extendedownerlist[_extendedOwnerAddress] = isExtendedOwner; 	
    } 	

    // change who the owner is
    function updateOwner(address _newOwnerAddress) public ownerOnlyACL {
        _ownerAddress = _newOwnerAddress; 
    }

    // set paused state
    function ownerSetPausedState(bool contractIsPaused) public ownerOnlyACL {
        _contractIsPaused = contractIsPaused;
    }

    // set allowlist state
    function ownerSetAllowlistActive(bool allowlistActivityLevel) public ownerOnlyACL {
        _allowListActive = allowlistActivityLevel;
    }

    // set a new base token URI, in case metadata/image provider changes
    function ownerSetBaseTokenURI(string memory newBaseTokenURI) public ownerOnlyACL {
        _baseTokenURI = newBaseTokenURI;
    }

    // Adds a new address to the shitlist
    function ownerAddToShitlist(address _shittyAddress) public ownerOnlyACL {
        _shitlist[_shittyAddress] = true; 
    }

    // Sets a prior shitty address to false, so it can mint again #allIsForgiven... or at least enough is forgiven
    function ownerRemoveFromShitlist(address _shittyAddress) public ownerOnlyACL {
        _shitlist[_shittyAddress] = false; 
    }

    // Adds a new address to the allowlist
    function ownerAddToAllowlist(address _allowAddress) public ownerOnlyACL {
        _allowlist[_allowAddress] = true; 
    }

    // Sets a prior allowed address to false, so they can't mint as part of allowlist
    function ownerRemoveFromAllowlist(address _allowAddress) public ownerOnlyACL {
        _allowlist[_allowAddress] = false; 
    }

    // simplified withdraw function callable by only the owner that withdraws to the owner address. there are no
    // internal state changes here, and it can only be called by owner, so this should(?) be safe from reentrancy
    function ownerWithdrawContractBalance() public ownerOnlyACL {

        uint256 balance = address(this).balance;
        require(balance > 0, "zpm@ says: don't waste your gas trying to withdraw a zero balance");

        // withdraw
        (bool withdrawSuccess, ) = msg.sender.call{value: balance}("");

        // this should never happen? but including in case so all state is reverted
        require(withdrawSuccess, "zpm@ says: withdraw failed, reverting");

    }

    // Allows owner to change the per-wallet mint limit
    function ownerUpdateWalletLimit(uint256 new_limit) public ownerOnlyACL {
        MAX_MINTABLE_AT_ONCE = new_limit; 
    }

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    ///// Small Council token management functions 

    // setting this to public but requiring it to be on the ownerManageList, so only MA-affiliated addresses can manage these functions	
    function ownerSetNewTokenOwner(uint256 tokenId, address newOwner) public extendedOwnerOnlyACL {
        
        // only tokens designated as owner managed can be managed by owner
        require(_isOwnerManaged(tokenId), "@MutantAurelius - check your token ID again. Something isn't right.");

        // lookup current owner
        address currentOwner = ownerOf(tokenId);

        // only leave a memento in non-owner wallets
        if (currentOwner != _ownerAddress) {
            // do a leave-behind for current owner, so they 'member 
            _mementosIssuedCounter.increment();
            _mint(currentOwner, totalAureiSupply + getIssuedMementoCount());

        }

        // transfer ownership to new address; using _transfer because owner should be able to do this directly
        _transfer(currentOwner, newOwner, tokenId);

    }

    function _isOwnerManaged(uint256 tokenId) internal view returns (bool) {
        // check to see if token ID is # 1-7 or #888
        if (tokenId > 0 && tokenId <= initialOwnerManagedTokens || tokenId == 888) {
            return true;
        } else return false; 
    }
}
