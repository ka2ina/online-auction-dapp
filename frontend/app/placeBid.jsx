"use client";
import { useState } from "react";
import { parseEther, formatEther } from "viem";
import { auctionAbi } from "./abi";

export default function PlaceBid({ walletAddress, walletClient, contractAddress, highestBid, startingPrice, onSuccess }) {
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState(null); 

  async function handleBid() {
    if (!walletAddress || !walletClient) {
      setStatus({ type: "err", msg: "connettere il wallet" });
      return;
    }

    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setStatus({ type: "err", msg: "inserisci importo valido" });
      return;
    }

    let wei;
    try {
      wei = parseEther(amount);
    } catch {
      setStatus({ type: "err", msg: "formato non valido" });
      return;
    }

    if (wei <= highestBid) {
      setStatus({
        type: "err",
        msg: `l'offerta deve superare quella attuale (${formatEther(highestBid)} ETH).`,
      });
      return;
    }
    if (wei < startingPrice) {
      setStatus({
        type: "err",
        msg: `l'offerta deve essere almeno ${formatEther(startingPrice)} ETH.`,
      });
      return;
    }

    try {
      setStatus({ type: "loading", msg: "In attesa di conferma su Metamask" });

      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: auctionAbi,
        functionName: "placeBid",
        value: wei,
        account: walletAddress,
      });

      setStatus({ type: "ok", msg: `Offerta inviata!` });
      setAmount("");
      setTimeout(onSuccess, 3000); //ricarica i dati dopo 3 secondi
    } catch (err) {
      const msg = err?.shortMessage || err?.message || "Errore sconosciuto";
      setStatus({ type: "err", msg });
    }
  }

  return (
    <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-lg">
      <h2 className="text-xl font-semibold text-white mb-4">Fai un&apos;offerta</h2>

      <label className="block text-sm text-gray-300 mb-2" htmlFor="bid-amount">
        Importo in ETH (minimo {formatEther(startingPrice ?? 0n)} ETH)
      </label>
      <div className="flex gap-3 mb-4">
        <input
          id="bid-amount"
          type="number"
          min="0"
          step="0.001"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="flex-1 bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
        />
        <span className="flex items-center text-gray-400 font-medium pr-1">ETH</span>
      </div>

      <button
        onClick={handleBid}
        disabled={status?.type === "loading"}
        className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
      >
        {status?.type === "loading" ? "Attendere..." : "Invia offerta"}
      </button>

      {status && (
        <p
          className={`mt-3 text-sm text-center rounded-lg py-2 px-3 ${
            status.type === "ok"
              ? "bg-green-900 text-green-300"
              : status.type === "err"
              ? "bg-red-900 text-red-300"
              : "bg-gray-700 text-gray-300"
          }`}
        >
          {status.msg}
        </p>
      )}
    </div>
  );
}
