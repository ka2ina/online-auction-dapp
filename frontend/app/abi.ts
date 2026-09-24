// Generato da artifacts/contracts/OnlineAuction.sol/OnlineAuction.json
export const auctionAbi = [
  // ── Variabili pubbliche (getter automatici) ───────────────────
  {
    inputs: [],
    name: "manager",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "seller",
    outputs: [{ internalType: "address payable", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "itemName",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "startingPrice",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "highestBidder",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "highestBid",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "isOpen",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "pendingWithdrawals",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // ── Funzioni di lettura ───────────────────────────────────────
  {
    inputs: [],
    name: "getAuctionInfo",
    outputs: [
      { internalType: "string",  name: "_itemName",      type: "string"  },
      { internalType: "uint256", name: "_startingPrice", type: "uint256" },
      { internalType: "address", name: "_seller",        type: "address" },
      { internalType: "address", name: "_highestBidder", type: "address" },
      { internalType: "uint256", name: "_highestBid",    type: "uint256" },
      { internalType: "bool",    name: "_isOpen",        type: "bool"    },
    ],
    stateMutability: "view",
    type: "function",
  },

  // ── Funzioni di scrittura ─────────────────────────────────────
  {
    inputs: [
      { internalType: "address payable", name: "_seller",       type: "address" },
      { internalType: "string",          name: "_itemName",     type: "string"  },
      { internalType: "uint256",         name: "_startingPrice",type: "uint256" },
    ],
    name: "openAuction",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "closeAuction",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "newPrice", type: "uint256" }],
    name: "setStartingPrice",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "placeBid",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "pickWinner",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // ── Eventi ────────────────────────────────────────────────────
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "string",  name: "itemName",     type: "string"  },
      { indexed: false, internalType: "uint256", name: "startingPrice",type: "uint256" },
    ],
    name: "AuctionOpened",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [],
    name: "AuctionClosed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "bidder", type: "address" },
      { indexed: false,internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "BidPlaced",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "winner", type: "address" },
      { indexed: false,internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "WinnerSelected",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "user",   type: "address" },
      { indexed: false,internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "Withdrawal",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, internalType: "uint256", name: "oldPrice", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "newPrice", type: "uint256" },
    ],
    name: "StartingPriceChanged",
    type: "event",
  },
] as const;
