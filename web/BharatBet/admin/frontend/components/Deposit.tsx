import React, { useState } from "react";

interface DepositProps {
    isOpen: boolean;
    onClose: () => void;
}

const Deposit: React.FC<DepositProps> = ({ isOpen, onClose }) => {
    const [amount, setAmount] = useState("500");
    const [step, setStep] = useState<"amount" | "payment">("amount");

    const upiId = "bharat.b3t@ptyes";

    const handleNext = () => {
        const val = parseInt(amount);
        if (!isNaN(val) && val > 0) {
            setStep("payment");
        }
    };

    const handleClose = () => {
        setStep("amount");
        if (onClose) onClose();
    };

    if (!isOpen) return null;

    const qrData = `upi://pay?pa=${upiId}&pn=BharatBet&am=${amount}&cu=INR`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}&margin=10`;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[100] flex items-center justify-center p-3 sm:p-4">
            <div className="bg-black/60 border border-white/10 w-full max-w-[90vw] sm:max-w-sm rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[85vh] backdrop-blur-3xl transform transition-all">
                <div className="p-4 sm:p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
                    <h2 className="text-lg sm:text-xl font-black text-white tracking-wider uppercase">
                        Deposit Funds
                    </h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-white rounded-full bg-white/5 w-8 h-8 flex items-center justify-center font-bold transition-all hover:bg-white/10"
                    >
                        &times;
                    </button>
                </div>

                <div className="p-4 sm:p-6 overflow-y-auto overflow-x-hidden">
                    {step === "amount" ? (
                        <>
                            <div className="mb-6">
                                <label className="block text-[10px] text-gray-400 mb-2 uppercase font-black tracking-widest pl-1">
                                    Enter Amount (INR)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 text-emerald-500 font-black text-lg sm:text-xl">
                                        ₹
                                    </span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-3 sm:p-4 pl-8 sm:pl-10 text-xl sm:text-2xl text-white font-black focus:border-emerald-500 outline-none transition-all focus:bg-white/5 shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-3 mb-8">
                                {[100, 500, 1000, 5000].map((v) => (
                                    <button
                                        key={v}
                                        onClick={() => setAmount(v.toString())}
                                        className="bg-white/5 hover:bg-white/10 py-3 rounded-xl text-sm font-black text-gray-300 border border-white/5 hover:border-white/20 transition-all shadow-sm"
                                    >
                                        +{v}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleNext}
                                className="w-full py-3 sm:py-4 mt-2 rounded-xl font-black text-sm uppercase tracking-widest transition-all bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] transform hover:scale-[1.02] active:scale-95"
                            >
                                GENERATE QR CODE
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="text-center mb-4 sm:mb-6">
                                <p className="text-emerald-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mb-1 sm:mb-2 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                                    Scan with any UPI App
                                </p>
                                <div className="text-3xl sm:text-4xl font-black text-white mt-1 tracking-tighter">
                                    ₹{amount}
                                </div>
                            </div>

                            <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl mb-6 shadow-[0_0_30px_rgba(255,255,255,0.1)] relative border-4 border-white/10">
                                <img
                                    src={qrUrl}
                                    alt="UPI QR"
                                    className="w-40 h-40 sm:w-48 sm:h-48 mix-blend-multiply transition-opacity duration-1000"
                                />
                            </div>

                            <div className="bg-white/5 rounded-xl p-4 mb-8 w-full text-center border border-white/10 shadow-inner">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">
                                    Pay to UPI ID
                                </p>
                                <div className="text-white font-mono font-bold flex items-center justify-center gap-2 text-sm md:text-base bg-black/40 py-2 rounded-lg border border-white/5">
                                    {upiId}
                                    <button
                                        className="text-indigo-400 text-[10px] uppercase font-black ml-3 bg-indigo-500/10 px-2 py-1 rounded hover:bg-indigo-500/20 transition-all border border-indigo-500/20"
                                        onClick={() => {
                                            navigator.clipboard.writeText(upiId);
                                        }}
                                    >
                                        COPY
                                    </button>
                                </div>
                            </div>

                            <div className="w-full border-t border-white/10 pt-6">
                                <button
                                    onClick={handleClose}
                                    className="w-full h-12 sm:h-14 bg-indigo-600 hover:bg-indigo-500 text-white px-4 sm:px-6 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all shadow-lg hover:shadow-indigo-500/20"
                                >
                                    DONE
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Deposit;
