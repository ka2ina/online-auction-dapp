"use client";
import { useState, useEffect, useCallback } from "react";
import { publicClient } from "./client";
import { auctionAbi } from "./abi";
import WalletButtons from "./walletButtons";
import AuctionInfo from "./auctionInfo";
import PlaceBid from "./placeBid";
import ManagerPanel from "./managerPanel";
import Withdraw from "./withdraw";


const CONTRACT_ADDRESS = "0x76d1ad971c2eb04d495faaa933cbeada950ce1f3"; //indirizzo del contratto dopo il deploy su rete sepolia

export default function Home() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [walletClient, setWalletClient] = useState(null);
  const [auctionInfo, setAuctionInfo] = useState(null);
  const [managerAddress, setManagerAddress] = useState(null);
  const [loadError, setLoadError] = useState(null);

  //carica i dati dal contratto
  const loadData = useCallback(async () => {
    try {
      setLoadError(null);

      const [info, manager] = await Promise.all([
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: auctionAbi,
          functionName: "getAuctionInfo",
        }),
        publicClient.readContract({
          address: CONTRACT_ADDRESS,
          abi: auctionAbi,
          functionName: "manager",
        }),
      ]);

      //getAuctionInfo ritorna un array, lo mappiamo in oggetto
      setAuctionInfo({
        _itemName:      info[0],
        _startingPrice: info[1],
        _seller:        info[2],
        _highestBidder: info[3],
        _highestBid:    info[4],
        _isOpen:        info[5],
      });

      setManagerAddress(manager.toLowerCase());
    } catch (err) {
      console.error("errore lettura contratto:", err);
      setLoadError("impossibile leggere i dati dal contratto.");
    }
  }, []);

  //carica all'avvio e poi ogni 15 secondi
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  function handleWalletConnected(address, client) {
    setWalletAddress(address);
    setWalletClient(client);
  }

  const isManager =
    walletAddress && managerAddress && walletAddress.toLowerCase() === managerAddress;

  const isSeller =
    walletAddress &&
    auctionInfo?._seller &&
    walletAddress.toLowerCase() === auctionInfo._seller.toLowerCase();

  const canBid = walletAddress && auctionInfo?._isOpen && !isSeller;

  return (
    <main className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-amber-400">Online-Auction</h1>
          <p className="text-xs text-gray-400">Sepolia Testnet</p>
        </div>
        <WalletButtons onWalletConnected={handleWalletConnected} />
      </header>

      {/* body */}
      <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">

        {/*errore di connessione al contratto */}
        {loadError && (
          <div className="bg-red-900 border border-red-600 rounded-2xl p-4 text-red-300 text-sm text-center">
            {loadError}
          </div>
        )}

        {/*badge ruolo utente */}
        {walletAddress && (
          <div className="flex gap-2 flex-wrap">
            {isManager && (
              <span className="bg-amber-700 text-amber-100 text-xs font-bold px-3 py-1 rounded-full">
                Manager
              </span>
            )}
            {isSeller && (
              <span className="bg-blue-700 text-blue-100 text-xs font-bold px-3 py-1 rounded-full">
                Venditore
              </span>
            )}
            {!isManager && !isSeller && (
              <span className="bg-gray-700 text-gray-300 text-xs font-bold px-3 py-1 rounded-full">
                Offerente
              </span>
            )}
          </div>
        )}

        {/*stato asta */}
        <AuctionInfo info={auctionInfo} onRefresh={loadData} />

        {/*pannello manager */}
        {isManager && (
          <ManagerPanel
            walletAddress={walletAddress}
            walletClient={walletClient}
            contractAddress={CONTRACT_ADDRESS}
            isOpen={auctionInfo?._isOpen ?? false}
            onSuccess={loadData}
          />
        )}

        {/* fai offerta */}
        {canBid && (
          <PlaceBid
            walletAddress={walletAddress}
            walletClient={walletClient}
            contractAddress={CONTRACT_ADDRESS}
            highestBid={auctionInfo._highestBid}
            startingPrice={auctionInfo._startingPrice}
            onSuccess={loadData}
          />
        )}

        {/*Messaggio venditore che non può offrire*/}
        {isSeller && auctionInfo?._isOpen && (
          <div className="bg-gray-800 rounded-2xl p-5 text-center text-gray-400 text-sm">
            Il venditore non può fare offerte sul proprio oggetto.
          </div>
        )}

        {/* Preleva fondi */}
        {walletAddress && (
          <Withdraw
            walletAddress={walletAddress}
            walletClient={walletClient}
            contractAddress={CONTRACT_ADDRESS}
            publicClient={publicClient}
            onSuccess={loadData}
          />
        )}

        
      </div>
    </main>
  );
}
