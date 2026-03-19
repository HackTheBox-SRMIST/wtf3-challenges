import React, { useState } from "react";
import { User } from "../types";
import { API_BASE } from "../api"; // Import dynamic base

interface WithdrawProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onWithdraw: (amount: number) => void;
}

const Withdraw: React.FC<WithdrawProps> = ({
  isOpen,
  onClose,
  user,
  onWithdraw,
}) => {
  // 1. ALL HOOKS MUST BE AT THE TOP!
  const [amount, setAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 2. EARLY RETURN MUST BE BELOW THE HOOKS!
  if (!isOpen) return null;

  const handleSubmit = async () => {
    setError(null);
    const val = parseFloat(amount);

    if (!upiId.includes("@")) {
      setError("Please enter a valid UPI ID");
      return;
    }
    if (isNaN(val) || val <= 0) {
      setError("Please enter a valid amount");
      return;
    }
    if (val > user.balance) {
      setError("Insufficient balance");
      return;
    }

    setLoading(true);

    try {
      // --- REAL API CALL TO BACKEND ---
      const response = await fetch(`${API_BASE}/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: user.username,
          amount: val,
          upi_id: upiId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onWithdraw(val); // Deducts it from the UI
        setSuccess(true);
      } else {
        setError(data.detail || "Withdrawal failed on server.");
      }
    } catch (err) {
      setError("Network error. Is the server running?");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setAmount("");
    setUpiId("");
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-3 sm:p-4">
      <div className="bg-black/60 border border-white/10 w-full max-w-[90vw] sm:max-w-sm rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[85vh] backdrop-blur-3xl transform transition-all">
        <div className="p-4 sm:p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h2 className="text-lg sm:text-xl font-black text-white tracking-wider uppercase">Withdraw Funds</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white rounded-full bg-white/5 w-8 h-8 flex items-center justify-center font-bold transition-all hover:bg-white/10"
          >
            &times;
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto">
          {!success ? (
            <div className="space-y-6">
              <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 flex justify-between items-center shadow-inner">
                <span className="text-emerald-400 text-xs font-black uppercase tracking-widest">Available Balance</span>
                <span className="text-emerald-400 font-black text-xl drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                  ₹{user.balance.toFixed(2)}
                </span>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 mb-2 uppercase font-black tracking-widest pl-1">
                  Withdraw to UPI ID
                </label>
                <input
                  type="text"
                  placeholder="username@bank"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 sm:p-4 text-white focus:border-emerald-500 outline-none transition-all focus:bg-white/5 font-mono shadow-inner text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 mb-2 uppercase font-black tracking-widest pl-1">
                  Amount
                </label>
                <div className="relative">
                  <span className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-emerald-500 font-black">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 sm:p-4 pl-8 sm:pl-10 text-white focus:border-emerald-500 outline-none font-bold transition-all focus:bg-white/5 shadow-inner text-sm sm:text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-400 text-[10px] uppercase font-bold tracking-widest bg-red-900/20 p-3 border border-red-500/30 rounded-lg shadow-inner">
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={loading}
                className={`w-full py-3 sm:py-4 mt-2 rounded-xl font-black uppercase tracking-widest transition-all ${loading ? "bg-white/5 cursor-wait text-gray-500" : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] transform hover:scale-[1.02] active:scale-95"}`}
              >
                {loading ? "PROCESSING..." : "INITIATE WITHDRAWAL"}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center py-6">
              <div className="w-20 h-20 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.4)] relative">
                <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20"></div>
                <svg
                  className="w-10 h-10 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
              <h3 className="text-2xl font-black text-white mb-2 tracking-tight">
                Withdrawal Requested
              </h3>
              <p className="text-emerald-500 text-[10px] mb-8 uppercase font-black tracking-widest drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                Pending Verification
              </p>

              <div className="w-full bg-white/5 rounded-2xl p-6 mb-8 border border-white/10 space-y-4 shadow-inner">
                <div className="flex justify-between text-xs border-b border-white/10 pb-3">
                  <span className="text-gray-400 font-bold uppercase tracking-widest">Amount Deducted</span>
                  <span className="text-white font-black text-sm">
                    ₹{parseFloat(amount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs border-b border-white/10 pb-3">
                  <span className="text-gray-400 font-bold uppercase tracking-widest">Destination</span>
                  <span className="text-indigo-400 font-mono text-xs truncate max-w-[150px] bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    {upiId}
                  </span>
                </div>
                <div className="flex justify-between text-xs pt-1">
                  <span className="text-gray-400 font-bold uppercase tracking-widest">Remaining Balance</span>
                  <span className="text-emerald-400 font-black text-sm drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                    ₹{user.balance.toFixed(2)}
                  </span>
                </div>
              </div>

              <p className="text-gray-400 font-medium text-center text-xs mb-8 px-2 leading-relaxed">
                Funds have been deducted from your BharatBet wallet. It will take up to 24 hours to process the transfer to your UPI ID.
              </p>

              <button
                onClick={handleClose}
                className="w-full bg-white/10 hover:bg-white/20 text-white py-3 sm:py-4 rounded-xl font-black uppercase tracking-widest transition-all transform hover:scale-[1.02] active:scale-95 text-xs sm:text-sm"
              >
                CLOSE WINDOW
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Withdraw;
