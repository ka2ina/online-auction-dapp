"use client";
import { useState, useEffect } from "react";
import { createWalletClient, custom } from "viem";
import { sepolia } from "viem/chains";

export default function WalletButtons({ onWalletConnected }) {
  const [address, setAddress] = useState(null);
  const [network, setNetwork] = useState(null);

  useEffect(() => {
    //se MetaMask è già connesso al caricamento della pagina, recupera l'account
    if (typeof window !== "undefined" && window.ethereum?.selectedAddress) {
      const addr = window.ethereum.selectedAddress;
      setAddress(addr);
      const wc = createWalletClient({ chain: sepolia, transport: custom(window.ethereum) });
      onWalletConnected(addr, wc);
    }

    //ascolta i cambi di account
    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        setAddress(null);
        onWalletConnected(null, null);
      } else {
        setAddress(accounts[0]);
        const wc = createWalletClient({ chain: sepolia, transport: custom(window.ethereum) });
        onWalletConnected(accounts[0], wc);
      }
    };

    //ascolta i cambi di rete
    const handleChainChanged = (chainId) => {
      setNetwork(parseInt(chainId, 16));
    };

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, []);

  async function connectWallet() {
    if (typeof window === "undefined" || !window.ethereum) {
      alert("MetaMask non trovato! Installalo da https://metamask.io");
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      const chainIdNum = parseInt(chainId, 16);
      setNetwork(chainIdNum);

      //avvisa se non si è su Sepolia (chainId 11155111)
      if (chainIdNum !== 11155111) {
        alert("Rete errata, passa a Sepolia");
        return;
      }

      const userAddress = accounts[0];
      setAddress(userAddress);

      const walletClient = createWalletClient({
        chain: sepolia,
        transport: custom(window.ethereum),
      });

      onWalletConnected(userAddress, walletClient);
    } catch (err) {
      console.error("Errore connessione wallet:", err);
    }
  }

  const isWrongNetwork = network !== null && network !== 11155111;

  return (
    <div className="flex flex-col items-center gap-2">
      {isWrongNetwork && (
        <p className="text-red-400 text-sm font-medium">
          Rete errata. Seleziona Sepolia in MetaMask.
        </p>
      )}
      <button
        onClick={connectWallet}
        className={`font-bold py-2 px-6 rounded-xl transition-colors ${
          address
            ? "bg-green-700 text-green-100 cursor-default"
            : "bg-amber-500 hover:bg-amber-600 text-white"
        }`}
      >
        {address
          ? `${address.slice(0, 6)}...${address.slice(-4)}`
          : "connetti MetaMask"}
      </button>
    </div>
  );
}
