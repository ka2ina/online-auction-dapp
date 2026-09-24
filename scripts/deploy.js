const hre = require("hardhat");
const { formatEther } = require("viem");

async function main() {
  console.log("Deploying OnlineAuction...\n");

  const auction = await hre.viem.deployContract("OnlineAuction");

  console.log("[OK] OnlineAuction deployato all'indirizzo: " + auction.address);

  const manager = await auction.read.manager();
  console.log("[OK] Manager: " + manager);

  return auction.address;
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
