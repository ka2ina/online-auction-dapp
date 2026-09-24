"use client";
import { formatEther } from "viem";

export default function AuctionInfo({ info, onRefresh }) {
  if (!info) {
    return (
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-lg">
        <p className="text-gray-400 text-center">Caricamento dati asta...</p>
      </div>
    );
  }

  const {
    _itemName,
    _startingPrice,
    _seller,
    _highestBidder,
    _highestBid,
    _isOpen,
  } = info;

  const noOffers = _highestBidder === "0x0000000000000000000000000000000000000000";

  return (
    <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-semibold text-white">Stato dell'asta</h2>
        <span
          className={`text-xs font-bold px-3 py-1 rounded-full ${
            _isOpen
              ? "bg-green-600 text-green-100"
              : "bg-red-700 text-red-100"
          }`}
        >
          {_isOpen ? "APERTA" : "CHIUSA"}
        </span>
      </div>

      {/* Dati */}
      <div className="space-y-3 text-sm">
        <Row label="Oggetto:" value={_itemName || "—"} highlight />
        <Row
          label="Prezzo base:"
          value={`${formatEther(_startingPrice)} ETH`}
        />
        <Row
          label="Venditore:"
          value={`${_seller.slice(0, 8)}...${_seller.slice(-6)}`}
          mono
        />
        <div className="border-t border-gray-700 pt-3">
          {noOffers ? (
            <p className="text-gray-400 italic text-center">
              Non ci sono ancora offerte
            </p>
          ) : (
            <>
              <Row
                label="Offerta più alta:"
                value={`${formatEther(_highestBid)} ETH`}
                highlight
              />
              <Row
                label="Miglior offerente:"
                value={`${_highestBidder.slice(0, 8)}...${_highestBidder.slice(-6)}`}
                mono
              />
            </>
          )}
        </div>
      </div>

      {/*aggiorna */}
      <button
        onClick={onRefresh}
        className="mt-5 w-full text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg py-2 transition-colors"
      >
        Aggiorna
      </button>
    </div>
  );
}

function Row({ label, value, highlight = false, mono = false }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-400">{label}</span>
      <span
        className={`font-medium ${
          highlight ? "text-amber-400 text-base" : "text-white"
        } ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
