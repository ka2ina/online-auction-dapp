const hre = require("hardhat");
const { parseEther, formatEther } = require("viem");


const CONTRACT_ADDRESS = "0x5fbdb2315678afecb367f032d93f642f64180aa3"; //indirizzo del contratto

function sep(title) {
  console.log("\n" + "=".repeat(50));
  if (title) console.log("  " + title);
  console.log("=".repeat(50));
}

async function printStatus(auction, publicClient) {
  const isOpen        = await auction.read.isOpen();
  const itemName      = await auction.read.itemName();
  const startingPrice = await auction.read.startingPrice();
  const highestBid    = await auction.read.highestBid();
  const highestBidder = await auction.read.highestBidder();
  const balance       = await publicClient.getBalance({ address: auction.address });

  console.log("  Stato asta: " + (isOpen ? "[APERTA]" : "[CHIUSA]"));
  console.log("  Oggetto: " + (itemName || "(nessuno)"));
  console.log("  Prezzo base: " + formatEther(startingPrice) + " ETH");
  console.log("  Offerta più alta: " + formatEther(highestBid) + " ETH");
  console.log("  Offerente migliore: " + (highestBidder === "0x0000000000000000000000000000000000000000" ? "(nessuno)" : highestBidder));
  console.log("  Saldo contratto: " + formatEther(balance) + " ETH");
}

async function main() {
  const [manager, seller, bidder1, bidder2] = await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();
  const auction = await hre.viem.getContractAt("OnlineAuction", CONTRACT_ADDRESS);

  sep("AUCTION INTERACTION SCRIPT");
  console.log("  Manager: " + manager.account.address);
  console.log("  Seller: " + seller.account.address);
  console.log("  Bidder 1: " + bidder1.account.address);
  console.log("  Bidder 2: " + bidder2.account.address);

  sep("1. Stato iniziale");
  await printStatus(auction, publicClient);

  sep("2. Apertura asta");
  console.log("  Il manager apre un'asta per 'Orologio Vintage' a 0.05 ETH...");
  let hash = await auction.write.openAuction(
    [seller.account.address, "Orologio Vintage", parseEther("0.05")],
    { account: manager.account }
  );
  await publicClient.waitForTransactionReceipt({ hash });
  console.log("  [OK] Asta aperta");
  await printStatus(auction, publicClient);

  sep("3. Cambio prezzo base (deve fallire con asta aperta)");
  console.log("  Test: tentativo di cambio prezzo con asta aperta (atteso errore)...");
  try {
    await auction.write.setStartingPrice([parseEther("0.10")], { account: manager.account });
  } catch (e) {
    console.log("  [OK] Revert corretto: " + e.message.split("\n")[0]);
  }

  sep("4. Offerte");
  console.log("  Bidder1 offre 0.06 ETH...");
  hash = await auction.write.placeBid([], {
    account: bidder1.account,
    value: parseEther("0.06"),
  });
  await publicClient.waitForTransactionReceipt({ hash });
  console.log("  [OK] Tx: " + hash);

  console.log("  Bidder2 offre 0.10 ETH (supera Bidder1)...");
  hash = await auction.write.placeBid([], {
    account: bidder2.account,
    value: parseEther("0.10"),
  });
  await publicClient.waitForTransactionReceipt({ hash });
  console.log("  [OK] Tx: " + hash);

  // Verifica che bidder1 abbia il rimborso in pending
  const pendingBidder1 = await auction.read.pendingWithdrawals([bidder1.account.address]);
  console.log("  Rimborso in attesa per Bidder1: " + formatEther(pendingBidder1) + " ETH");

  await printStatus(auction, publicClient);

  sep("5. Assegnazione vincitore");
  console.log("  Il manager chiude l'asta...");
  hash = await auction.write.closeAuction([], { account: manager.account });
  await publicClient.waitForTransactionReceipt({ hash });
  console.log("  [OK] Asta chiusa");

  console.log("  Il manager assegna il vincitore...");
  hash = await auction.write.pickWinner([], { account: manager.account });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  const winnerLogs = await publicClient.getContractEvents({
    address: auction.address,
    abi: auction.abi,
    eventName: "WinnerSelected",
    fromBlock: receipt.blockNumber,
    toBlock: receipt.blockNumber,
  });

  const { winner, amount } = winnerLogs[0].args;
  console.log("  [VINCITORE] : " + winner);
  console.log("  [IMPORTO]   : " + formatEther(amount) + " ETH");

  sep("6. Ritiro fondi");

  
  console.log("  Bidder1 ritira il rimborso (0.06 ETH)...");
  const balBefore1 = await publicClient.getBalance({ address: bidder1.account.address });
  hash = await auction.write.withdraw([], { account: bidder1.account });
  await publicClient.waitForTransactionReceipt({ hash });
  const balAfter1 = await publicClient.getBalance({ address: bidder1.account.address });
  console.log("  Balance prima : " + formatEther(balBefore1) + " ETH");
  console.log("  Balance dopo  : " + formatEther(balAfter1) + " ETH");
  console.log("  [OK] Rimborso completato per Bidder1!");


  console.log("  Seller ritira i proventi (0.10 ETH)...");
  const balBeforeSeller = await publicClient.getBalance({ address: seller.account.address });
  hash = await auction.write.withdraw([], { account: seller.account });
  await publicClient.waitForTransactionReceipt({ hash });
  const balAfterSeller = await publicClient.getBalance({ address: seller.account.address });
  console.log("  Balance prima : " + formatEther(balBeforeSeller) + " ETH");
  console.log("  Balance dopo  : " + formatEther(balAfterSeller) + " ETH");
  console.log("  [OK] Proventi incassati dal venditore!");

  sep("7. nuova asta");
  console.log("  Il manager apre una nuova asta per 'Bicicletta da Corsa' a 0.20 ETH...");
  hash = await auction.write.openAuction(
    [seller.account.address, "Bicicletta da Corsa", parseEther("0.20")],
    { account: manager.account }
  );
  await publicClient.waitForTransactionReceipt({ hash });
  console.log("  [OK] Nuova asta aperta");
  await printStatus(auction, publicClient);

  sep("script completato con successo!");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
