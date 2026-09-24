"use client";
import { useState } from "react";
import { formatEther } from "viem";
import { auctionAbi } from "./abi";

export default function Withdraw({ walletAddress, walletClient, contractAddress, publicClient, onSuccess }) {
  const [pending, setPending] = useState(null);
  const [status, setStatus] = useState(null);
  const [checked, setChecked] = useState(false);

  async function checkPending() {
    if (!walletAddress) {
      setStatus({ type: "err", msg: "connetti prima il wallet!" });
      return;
    }
    try {
      const amount = await publicClient.readContract({
        address: contractAddress,
        abi: auctionAbi,
        functionName: "pendingWithdrawals",
        args: [walletAddress],
      });
      setPending(amount);
      setChecked(true);
      setStatus(null);
    } catch (err) {
      setStatus({ type: "err", msg: err?.shortMessage || err?.message });
    }
  }

  async function handleWithdraw() {
    if (!walletAddress || !walletClient) {
      setStatus({ type: "err", msg: "connetti prima il wallet!" });
      return;
    }
    try {
      setStatus({ type: "loading", msg: "In attesa di conferma su Metamask" });

      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: auctionAbi,
        functionName: "withdraw",
        account: walletAddress,
      });

      setStatus({ type: "ok", msg: `Prelievo completato!` });
      setPending(0n);
      setChecked(false);
      setTimeout(onSuccess, 3000);
    } catch (err) {
      const msg = err?.shortMessage || err?.message || "";
      setStatus({ type: "err", msg });
    }
  }

  return (
    <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-lg">
      <h2 className="text-xl font-semibold text-white mb-2">Preleva fondi</h2>
      <p className="text-xs text-gray-400 mb-5">
        Disponibile per il venditore dopo pickWinner, e per gli offerenti superati.
      </p>

      {/* Verifica saldo */}
      <button
        onClick={checkPending}
        className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-xl transition-colors mb-3"
      >
        Verifica fondi disponibili
      </button>

      {checked && pending !== null && (
        <div className="text-center mb-4">
          {pending === 0n ? (
            <p className="text-gray-400 italic">Nessun fondo da prelevare per questo account.</p>
          ) : (
            <>
              <p className="text-gray-400 text-sm mb-1">Disponibile:</p>
              <p className="text-3xl font-bold text-green-400">{formatEther(pending)} ETH</p>
            </>
          )}
        </div>
      )}

      {/* Preleva */}
      {checked && pending > 0n && (
        <button
          onClick={handleWithdraw}
          disabled={status?.type === "loading"}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
        >
          {status?.type === "loading" ? "Attendere..." : "Preleva"}
        </button>
      )}

      {/* Status */}
      {status && status.type !== "loading" && (
        <p
          className={`mt-3 text-sm text-center rounded-lg py-2 px-3 ${
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
