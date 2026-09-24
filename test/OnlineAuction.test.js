const { expect } = require("chai");
const hre = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-toolbox-viem/network-helpers");
const { parseEther } = require("viem");

// fixutures

async function deployAuctionFixture() {
  const [manager, seller, bidder1, bidder2] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();
  const auction = await hre.viem.deployContract("OnlineAuction");
  return { auction, manager, seller, bidder1, bidder2, publicClient };
}

async function auctionOpenFixture() {
  const base = await deployAuctionFixture();
  const { auction, manager, seller } = base;
  await auction.write.openAuction(
    [seller.account.address, "Quadro", parseEther("0.05")],
    { account: manager.account }
  );
  return base;
}

async function auctionWithOneBidFixture() {
  const base = await auctionOpenFixture();
  const { auction, bidder1 } = base;
  await auction.write.placeBid([], { account: bidder1.account, value: parseEther("0.06") });
  return base;
}

async function auctionWithTwoBidsFixture() {
  const base = await auctionWithOneBidFixture();
  const { auction, bidder2 } = base;
  await auction.write.placeBid([], { account: bidder2.account, value: parseEther("0.10") });
  return base;
}

async function auctionClosedWithBidsFixture() {
  const base = await auctionWithTwoBidsFixture();
  const { auction, manager } = base;
  await auction.write.closeAuction([], { account: manager.account });
  return base;
}

async function auctionAfterPickFixture() {
  const base = await auctionWithOneBidFixture();
  const { auction, manager } = base;
  await auction.write.closeAuction([], { account: manager.account });
  await auction.write.pickWinner([], { account: manager.account });
  return base;
}

//suite di test

describe("OnlineAuction", function () {

  describe("Deploy", function () {
    it("Imposta il manager correttamente", async function () {
      const { auction, manager } = await loadFixture(deployAuctionFixture);
      const contractManager = await auction.read.manager();
      expect(contractManager.toLowerCase()).to.equal(manager.account.address.toLowerCase());
    });

    it("asta chiusa di default", async function () {
      const { auction } = await loadFixture(deployAuctionFixture);
      const open = await auction.read.isOpen();
      expect(open).to.be.false;
    });

    it("offerta iniziale più alta = 0", async function () {
      const { auction } = await loadFixture(deployAuctionFixture);
      const bid = await auction.read.highestBid();
      expect(bid).to.equal(0n);
    });

    it("offerente iniziale più alto è address(0)", async function () {
      const { auction } = await loadFixture(deployAuctionFixture);
      const bidder = await auction.read.highestBidder();
      expect(bidder).to.equal("0x0000000000000000000000000000000000000000");
    });
  });

  describe("openAuction", function () {
    it("Il manager puo' aprire l'asta", async function () {
      const { auction, manager, seller } = await loadFixture(deployAuctionFixture);
      await auction.write.openAuction(
        [seller.account.address, "Quadro", parseEther("0.05")],
        { account: manager.account }
      );
      expect(await auction.read.isOpen()).to.be.true;
      expect(await auction.read.itemName()).to.equal("Quadro");
    });

    it("Solo il manager puo' aprire l'asta", async function () {
      const { auction, seller, bidder1 } = await loadFixture(deployAuctionFixture);
      await expect(
        auction.write.openAuction(
          [seller.account.address, "Quadro", parseEther("0.05")],
          { account: bidder1.account }
        )
      ).to.be.rejectedWith("Solo il manager puo' chiamare questa funzione");
    });

    it("Revert se l'asta e' gia' aperta", async function () {
      const { auction, manager, seller } = await loadFixture(auctionOpenFixture);
      await expect(
        auction.write.openAuction(
          [seller.account.address, "altro oggetto", parseEther("0.05")],
          { account: manager.account }
        )
      ).to.be.rejectedWith("Chiudi l'asta prima di assegnare il vincitore");
    });

    it("Revert se il prezzo base e' zero", async function () {
      const { auction, manager, seller } = await loadFixture(deployAuctionFixture);
      await expect(
        auction.write.openAuction(
          [seller.account.address, "Oggetto", 0n],
          { account: manager.account }
        )
      ).to.be.rejectedWith("Il prezzo base deve essere maggiore di zero");
    });

    it("Revert se il nome e' vuoto", async function () {
      const { auction, manager, seller } = await loadFixture(deployAuctionFixture);
      await expect(
        auction.write.openAuction(
          [seller.account.address, "", parseEther("0.05")],
          { account: manager.account }
        )
      ).to.be.rejectedWith("Il nome dell'oggetto non puo' essere vuoto");
    });

    it("Emette l'evento AuctionOpened", async function () {
      const { auction, manager, seller, publicClient } = await loadFixture(deployAuctionFixture);
      const hash = await auction.write.openAuction(
        [seller.account.address, "Quadro", parseEther("0.05")],
        { account: manager.account }
      );
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const logs = await publicClient.getContractEvents({
        address: auction.address, abi: auction.abi, eventName: "AuctionOpened",
        fromBlock: receipt.blockNumber, toBlock: receipt.blockNumber,
      });
      expect(logs.length).to.equal(1);
      expect(logs[0].args.itemName).to.equal("Quadro");
      expect(logs[0].args.startingPrice).to.equal(parseEther("0.05"));
    });
  });

  describe("closeAuction", function () {
    it("Il manager puo' chiudere l'asta", async function () {
      const { auction, manager } = await loadFixture(auctionOpenFixture);
      await auction.write.closeAuction([], { account: manager.account });
      expect(await auction.read.isOpen()).to.be.false;
    });

    it("Solo il manager puo' chiudere l'asta", async function () {
      const { auction, bidder1 } = await loadFixture(auctionOpenFixture);
      await expect(
        auction.write.closeAuction([], { account: bidder1.account })
      ).to.be.rejectedWith("Solo il manager puo' chiamare questa funzione");
    });

    it("Revert se l'asta e' gia' chiusa", async function () {
      const { auction, manager } = await loadFixture(auctionClosedWithBidsFixture);
      await expect(
        auction.write.closeAuction([], { account: manager.account })
      ).to.be.rejectedWith("L'asta e' chiusa");
    });

    it("Emette l'evento AuctionClosed", async function () {
      const { auction, manager, publicClient } = await loadFixture(auctionOpenFixture);
      const hash = await auction.write.closeAuction([], { account: manager.account });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const logs = await publicClient.getContractEvents({
        address: auction.address, abi: auction.abi, eventName: "AuctionClosed",
        fromBlock: receipt.blockNumber, toBlock: receipt.blockNumber,
      });
      expect(logs.length).to.equal(1);
    });
  });

  describe("setStartingPrice", function () {
    it("Il manager puo' cambiare il prezzo base se l'asta e' chiusa e senza offerte", async function () {
      const { auction, manager } = await loadFixture(deployAuctionFixture);
      await auction.write.setStartingPrice([parseEther("0.10")], { account: manager.account });
      expect(await auction.read.startingPrice()).to.equal(parseEther("0.10"));
    });

    it("Solo il manager puo' cambiare il prezzo", async function () {
      const { auction, bidder1 } = await loadFixture(deployAuctionFixture);
      await expect(
        auction.write.setStartingPrice([parseEther("0.10")], { account: bidder1.account })
      ).to.be.rejectedWith("Solo il manager puo' chiamare questa funzione");
    });

    it("Revert se il prezzo e' zero", async function () {
      const { auction, manager } = await loadFixture(deployAuctionFixture);
      await expect(
        auction.write.setStartingPrice([0n], { account: manager.account })
      ).to.be.rejectedWith("Il prezzo deve essere maggiore di zero");
    });

    it("Revert se l'asta e' aperta", async function () {
      const { auction, manager } = await loadFixture(auctionOpenFixture);
      await expect(
        auction.write.setStartingPrice([parseEther("0.10")], { account: manager.account })
      ).to.be.rejectedWith("Non puoi cambiare il prezzo con l'asta aperta");
    });

    it("Revert se ci sono offerte presenti", async function () {
      const { auction, manager } = await loadFixture(auctionClosedWithBidsFixture);
      await expect(
        auction.write.setStartingPrice([parseEther("0.10")], { account: manager.account })
      ).to.be.rejectedWith("Non puoi cambiare il prezzo con offerte gia' presenti");
    });

    it("Emette l'evento StartingPriceChanged", async function () {
      const { auction, manager, publicClient } = await loadFixture(deployAuctionFixture);
      const hash = await auction.write.setStartingPrice([parseEther("0.10")], { account: manager.account });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const logs = await publicClient.getContractEvents({
        address: auction.address, abi: auction.abi, eventName: "StartingPriceChanged",
        fromBlock: receipt.blockNumber, toBlock: receipt.blockNumber,
      });
      expect(logs.length).to.equal(1);
      expect(logs[0].args.newPrice).to.equal(parseEther("0.10"));
    });

    it("Il prezzo puo' essere cambiato dopo pickWinner (offerte azzerate)", async function () {
      const { auction, manager } = await loadFixture(auctionAfterPickFixture);
      await auction.write.setStartingPrice([parseEther("0.20")], { account: manager.account });
      expect(await auction.read.startingPrice()).to.equal(parseEther("0.20"));
    });
  });

  describe("placeBid", function () {
    it("Permette di piazzare un'offerta valida", async function () {
      const { auction, bidder1 } = await loadFixture(auctionOpenFixture);
      await auction.write.placeBid([], { account: bidder1.account, value: parseEther("0.06") });
      expect(await auction.read.highestBid()).to.equal(parseEther("0.06"));
      expect((await auction.read.highestBidder()).toLowerCase()).to.equal(bidder1.account.address.toLowerCase());
    });

    it("Revert se l'asta e' chiusa", async function () {
      const { auction, bidder1 } = await loadFixture(deployAuctionFixture);
      await expect(
        auction.write.placeBid([], { account: bidder1.account, value: parseEther("0.06") })
      ).to.be.rejectedWith("L'asta e' chiusa");
    });

    it("revert se l'offerta e' sotto il prezzo base", async function () {
      const { auction, bidder1 } = await loadFixture(auctionOpenFixture);
      await expect(
        auction.write.placeBid([], { account: bidder1.account, value: parseEther("0.01") })
      ).to.be.rejectedWith("Offerta inferiore al prezzo base");
    });

    it("Revert se l'offerta non supera quella corrente", async function () {
      const { auction, bidder2 } = await loadFixture(auctionWithOneBidFixture);
      await expect(
        auction.write.placeBid([], { account: bidder2.account, value: parseEther("0.06") })
      ).to.be.rejectedWith("Offerta inferiore all'offerta corrente");
    });

    it("Il venditore non puo' fare offerte", async function () {
      const { auction, seller } = await loadFixture(auctionOpenFixture);
      await expect(
        auction.write.placeBid([], { account: seller.account, value: parseEther("0.06") })
      ).to.be.rejectedWith("Il venditore non puo' fare offerte sul proprio oggetto");
    });

    it("l'offerta superata viene messa in pendingWithdrawals", async function () {
      const { auction, bidder1, bidder2 } = await loadFixture(auctionWithOneBidFixture);
      await auction.write.placeBid([], { account: bidder2.account, value: parseEther("0.10") });
      const pending = await auction.read.pendingWithdrawals([bidder1.account.address]);
      expect(pending).to.equal(parseEther("0.06"));
    });

    it("emette l'evento BidPlaced", async function () {
      const { auction, bidder1, publicClient } = await loadFixture(auctionOpenFixture);
      const hash = await auction.write.placeBid([], { account: bidder1.account, value: parseEther("0.06") });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const logs = await publicClient.getContractEvents({
        address: auction.address, abi: auction.abi, eventName: "BidPlaced",
        fromBlock: receipt.blockNumber, toBlock: receipt.blockNumber,
      });
      expect(logs.length).to.equal(1);
      expect(logs[0].args.amount).to.equal(parseEther("0.06"));
    });
  });

  describe("pickWinner", function () {
    it("solo il manager puo' assegnare il vincitore", async function () {
      const { auction, bidder1 } = await loadFixture(auctionClosedWithBidsFixture);
      await expect(
        auction.write.pickWinner([], { account: bidder1.account })
      ).to.be.rejectedWith("Solo il manager puo' chiamare questa funzione");
    });

    it("revert se l'asta e' ancora aperta", async function () {
      const { auction, manager } = await loadFixture(auctionWithTwoBidsFixture);
      await expect(
        auction.write.pickWinner([], { account: manager.account })
      ).to.be.rejectedWith("chiudi l'asta prima di assegnare il vincitore");
    });

    it("revert se non ci sono offerte", async function () {
      const base = await deployAuctionFixture();
      await base.auction.write.openAuction(
        [base.seller.account.address, "Oggetto", parseEther("0.05")],
        { account: base.manager.account }
      );
      await base.auction.write.closeAuction([], { account: base.manager.account });
      await expect(
        base.auction.write.pickWinner([], { account: base.manager.account })
      ).to.be.rejectedWith("non ci sono offerte valide");
    });

    it("assegna i fondi al venditore in pendingWithdrawals", async function () {
      const { auction, manager, seller, publicClient } = await loadFixture(auctionClosedWithBidsFixture);
      const highestBid = await auction.read.highestBid();
      const hash = await auction.write.pickWinner([], { account: manager.account });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      const logs = await publicClient.getContractEvents({
        address: auction.address, abi: auction.abi, eventName: "WinnerSelected",
        fromBlock: receipt.blockNumber, toBlock: receipt.blockNumber,
      });
      expect(logs.length).to.equal(1);
      expect(logs[0].args.amount).to.equal(highestBid);

      const pendingSeller = await auction.read.pendingWithdrawals([seller.account.address]);
      expect(pendingSeller).to.equal(highestBid);
    });

    it("Resetta highestBid e highestBidder dopo l'assegnazione", async function () {
      const { auction, manager } = await loadFixture(auctionClosedWithBidsFixture);
      await auction.write.pickWinner([], { account: manager.account });
      expect(await auction.read.highestBid()).to.equal(0n);
      expect(await auction.read.highestBidder()).to.equal("0x0000000000000000000000000000000000000000");
    });

    it("Emette l'evento WinnerSelected", async function () {
      const { auction, manager, publicClient } = await loadFixture(auctionClosedWithBidsFixture);
      const hash = await auction.write.pickWinner([], { account: manager.account });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const logs = await publicClient.getContractEvents({
        address: auction.address, abi: auction.abi, eventName: "WinnerSelected",
        fromBlock: receipt.blockNumber, toBlock: receipt.blockNumber,
      });
      expect(logs.length).to.equal(1);
    });
  });

  describe("withdraw", function () {
    it("Il venditore puo' ritirare i proventi", async function () {
      const { auction, seller, publicClient } = await loadFixture(auctionAfterPickFixture);
      const balBefore = await publicClient.getBalance({ address: seller.account.address });
      await auction.write.withdraw([], { account: seller.account });
      const balAfter = await publicClient.getBalance({ address: seller.account.address });
      expect(balAfter > balBefore).to.be.true;
      const pending = await auction.read.pendingWithdrawals([seller.account.address]);
      expect(pending).to.equal(0n);
    });

    it("Un offerente superato puo' ritirare il rimborso", async function () {
      const { auction, bidder1, publicClient } = await loadFixture(auctionClosedWithBidsFixture);
      const balBefore = await publicClient.getBalance({ address: bidder1.account.address });
      await auction.write.withdraw([], { account: bidder1.account });
      const balAfter = await publicClient.getBalance({ address: bidder1.account.address });
      expect(balAfter > balBefore).to.be.true;
    });

    it("Revert se non ci sono fondi da prelevare", async function () {
      const { auction, bidder1 } = await loadFixture(deployAuctionFixture);
      await expect(
        auction.write.withdraw([], { account: bidder1.account })
      ).to.be.rejectedWith("Nessun fondo da prelevare");
    });

    it("Non permette di ritirare due volte", async function () {
      const { auction, seller } = await loadFixture(auctionAfterPickFixture);
      await auction.write.withdraw([], { account: seller.account });
      await expect(
        auction.write.withdraw([], { account: seller.account })
      ).to.be.rejectedWith("Nessun fondo da prelevare");
    });

    it("Emette l'evento Withdrawal", async function () {
      const { auction, seller, publicClient } = await loadFixture(auctionAfterPickFixture);
      const hash = await auction.write.withdraw([], { account: seller.account });
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const logs = await publicClient.getContractEvents({
        address: auction.address, abi: auction.abi, eventName: "Withdrawal",
        fromBlock: receipt.blockNumber, toBlock: receipt.blockNumber,
      });
      expect(logs.length).to.equal(1);
    });
  });

  
  describe("getAuctionInfo", function () {
    it("dati dell'asta in una singola tupla", async function () {
      const { auction, seller, bidder1 } = await loadFixture(auctionWithOneBidFixture);
      const info = await auction.read.getAuctionInfo();
      
      
      expect(info[0]).to.equal("Quadro");
      expect(info[1]).to.equal(parseEther("0.05"));
      expect(info[2].toLowerCase()).to.equal(seller.account.address.toLowerCase());
      expect(info[3].toLowerCase()).to.equal(bidder1.account.address.toLowerCase());
      expect(info[4]).to.equal(parseEther("0.06"));
      expect(info[5]).to.be.true; // isOpen
    });
  });

  
  describe("sicurezza (receive / fallback)", function () {
    it("revert se si usa receive() direttamente", async function () {
      const { auction, bidder1 } = await loadFixture(auctionOpenFixture);
      await expect(
        
        bidder1.sendTransaction({ 
          to: auction.address, 
          value: parseEther("0.06"),
          account: bidder1.account
        })
      ).to.be.rejectedWith("usa placeBid per mandare ETH");
    });

    it("revert se si chiama una funzione inesistente (fallback)", async function () {
      const { auction, bidder1 } = await loadFixture(deployAuctionFixture);
      await expect(
        bidder1.sendTransaction({ 
          to: auction.address, 
          data: "0xdeadbeef", //funzione inesistente che innesca fall-back
          value: 0n,
          account: bidder1.account
        })
      ).to.be.rejected;
    });
  });

});
