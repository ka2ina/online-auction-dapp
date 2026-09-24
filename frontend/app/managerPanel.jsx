"use client";
import { useState } from "react";
import { parseEther } from "viem";
import { auctionAbi } from "./abi";

export default function ManagerPanel({ walletAddress, walletClient, contractAddress, isOpen, onSuccess }) {
  //form apri asata
  const [sellerAddr, setSellerAddr] = useState("");
  const [itemName, setItemName] = useState("");
  const [startingPrice, setStartingPrice] = useState("");

  const [status, setStatus] = useState(null);

  async function sendTx(functionName, args = [], value) {
    try {
      setStatus({ type: "loading", msg: "In attesa di conferma su MetaMask..." });

      const options = {
        address: contractAddress,
        abi: auctionAbi,
        functionName,
        args,
        account: walletAddress,
      };
      if (value !== undefined) options.value = value;

      const hash = await walletClient.writeContract(options);
      setStatus({ type: "ok", msg: `transazione avvenuta con successo!` });
      setTimeout(onSuccess, 3000);
    } catch (err) {
      const msg = err?.shortMessage || err?.message || "Errore sconosciuto";
      setStatus({ type: "err", msg });
    }
  }

  async function handleOpen() {
    if (!sellerAddr || !itemName || !startingPrice) {
      setStatus({ type: "err", msg: "compila tutti i campi prima di aprire l'asta" });
      return;
    }
    if (!/^0x[0-9a-fA-F]{40}$/.test(sellerAddr)) {
      setStatus({ type: "err", msg: "indirizzo venditore non valido" });
      return;
    }
    let priceWei;
    try {
      priceWei = parseEther(startingPrice);
    } catch {
      setStatus({ type: "err", msg: "prezzo non valido" });
      return;
    }
    await sendTx("openAuction", [sellerAddr, itemName, priceWei]);
  }

  async function handleClose() {
    await sendTx("closeAuction");
  }

  async function handlePickWinner() {
    await sendTx("pickWinner");
  }

  return (
    <div className="bg-gray-800 border border-amber-700 rounded-2xl p-6 w-full max-w-lg">
      <h2 className="text-xl font-semibold text-amber-400 mb-1">Pannello manager</h2>
      

      {/* Apri asta */}
      {!isOpen && (
        <div className="space-y-3 mb-5">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
            Apri una nuova asta
          </h3>
          <label className="block text-sm text-gray-300" htmlFor="seller-address">
            Indirizzo del venditore
          </label>
          <input
            id="seller-address"
            value={sellerAddr}
            onChange={(e) => setSellerAddr(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 font-mono text-sm focus:outline-none focus:border-amber-500"
          />
          <label className="block text-sm text-gray-300" htmlFor="item-name">
            Nome dell'oggetto
          </label>
          <input
            id="item-name"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
          />
          <label className="block text-sm text-gray-300" htmlFor="starting-price">
            Prezzo base in ETH
          </label>
          <div className="flex gap-3">
            <input
              id="starting-price"
              type="number"
              min="0"
              step="0.001"
              value={startingPrice}
              onChange={(e) => setStartingPrice(e.target.value)}
              className="flex-1 bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
            />
            <span className="flex items-center text-gray-400 font-medium">ETH</span>
          </div>
          <button
            onClick={handleOpen}
            disabled={status?.type === "loading"}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
          >
            {status?.type === "loading" ? "Attendere" : "Apri asta"}
          </button>
        </div>
      )}

      {/* Chiudi asta */}
      {isOpen && (
        <div className="mb-4">
          <button
            onClick={handleClose}
            disabled={status?.type === "loading"}
            className="w-full bg-red-700 hover:bg-red-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
          >
            {status?.type === "loading" ? "Attendere" : "Chiudi asta"}
          </button>
        </div>
      )}

      {/* assegna vincitore */}
      {!isOpen && (
        <div>
          <button
            onClick={handlePickWinner}
            disabled={status?.type === "loading"}
            className="w-full bg-purple-700 hover:bg-purple-800 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
          >
            {status?.type === "loading" ? "Attendere" : "Assegna vincitore"}
          </button>
        </div>
      )}

      {/*status message */}
      {status && status.type !== "loading" && (
        <p
          className={`mt-4 text-sm text-center rounded-lg py-2 px-3 ${
            status.type === "ok"
              ? "bg-green-900 text-green-300"
              : "bg-red-900 text-red-300"
          }`}
        >
          {status.msg}
        </p>
      )}
    </div>
  );
}
