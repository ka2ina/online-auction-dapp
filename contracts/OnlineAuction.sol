pragma solidity ^0.8.0;

contract OnlineAuction {
    
    address public manager;
    address payable public seller;       
    string  public  itemName;            
    uint256 public  startingPrice;       

    address public  highestBidder;       
    uint256 public  highestBid;          

    mapping(address => uint256) public pendingWithdrawals;

    bool public isOpen = false;

    event AuctionOpened(string itemName, uint256 startingPrice);
    event AuctionClosed();
    event BidPlaced(address indexed bidder, uint256 amount);
    event WinnerSelected(address indexed winner, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);
    event StartingPriceChanged(uint256 oldPrice, uint256 newPrice);

    constructor() {
        manager = msg.sender;
    }

    modifier restricted() {
        require(msg.sender == manager, "Solo il manager puo' chiamare questa funzione");
        _;
    }

    modifier onlyWhenOpen() {
        require(isOpen, "L'asta e' chiusa");
        _;
    }

    modifier onlyWhenClosed() {
        require(!isOpen, "chiudi l'asta prima di assegnare il vincitore");
        _;
    }

    function openAuction(
        address payable _seller,
        string memory _itemName,
        uint256 _startingPrice
    ) public restricted {
        require(!isOpen, "Chiudi l'asta prima di assegnare il vincitore");
        require(_seller != address(0), "indirizzo venditore non valido");
        require(bytes(_itemName).length > 0, "Il nome dell'oggetto non puo' essere vuoto");
        require(_startingPrice > 0, "Il prezzo base deve essere maggiore di zero");

        seller       = _seller;
        itemName     = _itemName;
        startingPrice = _startingPrice;
        highestBidder = address(0);
        highestBid    = 0;
        isOpen        = true;

        emit AuctionOpened(_itemName, _startingPrice);
    }

    function closeAuction() public restricted onlyWhenOpen {
        isOpen = false;
        emit AuctionClosed();
    }

    function setStartingPrice(uint256 newPrice) public restricted {
        require(newPrice > 0, "Il prezzo deve essere maggiore di zero");
        require(!isOpen, "Non puoi cambiare il prezzo con l'asta aperta");
        require(highestBid == 0, "Non puoi cambiare il prezzo con offerte gia' presenti");
        uint256 oldPrice = startingPrice;
        startingPrice = newPrice;
        emit StartingPriceChanged(oldPrice, newPrice);
    }

    function placeBid() public payable onlyWhenOpen {
        require(msg.sender != seller, "Il venditore non puo' fare offerte sul proprio oggetto");
        require(msg.value >= startingPrice, "Offerta inferiore al prezzo base");
        require(msg.value > highestBid, "Offerta inferiore all'offerta corrente");

        if (highestBidder != address(0)) {
            pendingWithdrawals[highestBidder] += highestBid;
        }

        highestBid    = msg.value;
        highestBidder = msg.sender;

        emit BidPlaced(msg.sender, msg.value);
    }

    function pickWinner() public restricted onlyWhenClosed {
        require(highestBidder != address(0), "non ci sono offerte valide");

        address winner = highestBidder;
        uint256 prize  = highestBid;

    
        highestBidder = address(0);
        highestBid    = 0;

     
        pendingWithdrawals[seller] += prize;

        emit WinnerSelected(winner, prize);
    }

    function withdraw() public {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "Nessun fondo da prelevare");     
        pendingWithdrawals[msg.sender] = 0;                   

        (bool success, ) = msg.sender.call{value: amount}(""); 
        require(success, "Ritiro fallito");

        emit Withdrawal(msg.sender, amount);
    }

    function getAuctionInfo() public view returns (
        string  memory _itemName,
        uint256        _startingPrice,
        address        _seller,
        address        _highestBidder,
        uint256        _highestBid,
        bool           _isOpen
    ) {
        return (itemName, startingPrice, seller, highestBidder, highestBid, isOpen);
    }


    receive() external payable {
        revert("usa placeBid per mandare ETH");
    }

    fallback() external payable {
        revert();
    }
}
