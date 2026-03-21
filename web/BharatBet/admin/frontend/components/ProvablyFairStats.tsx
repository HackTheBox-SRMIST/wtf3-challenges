import React, { useState } from "react";
import { GameStatus } from "../types";

interface ProvablyFairStatsProps {
  round: any;
  status: GameStatus;
}

const ProvablyFairStats: React.FC<ProvablyFairStatsProps> = ({
  round,
  status,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [ping, setPing] = useState(32);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setPing(Math.floor(Math.random() * 15 + 20));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const roundId = round?.id || "---";

  const seedDisplay =
    status !== GameStatus.WAITING && round
      ? status === GameStatus.CRASHED
        ? round.seed
        : "Hidden (Active Round)"
      : "Generating...";

  // Pulls the 'result' we added to engine.py
  const resultDisplay =
    status === GameStatus.CRASHED && round && round.result
      ? `${round.result.toFixed(2)}x`
      : "Pending";

  const cipherDisplay = round?.hash || "Waiting for round...";

  return (
    <div className="absolute top-12 md:top-14 left-0 w-full z-40 px-4 md:px-6 pointer-events-none flex justify-between items-start">
      <div className="pointer-events-auto relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-black/40 backdrop-blur-md text-[10px] text-gray-300 px-4 py-1.5 rounded-full border border-white/10 hover:text-white hover:border-white/20 transition-all shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
        >
          <span
            className={`w-2 h-2 rounded-full ${status === GameStatus.CRASHED ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"} animate-pulse`}
          ></span>
          <span className="font-bold tracking-widest uppercase">
            Provably Fair
          </span>
          <span
            className={`transform transition-transform text-[8px] ${isOpen ? "rotate-180" : ""}`}
          >
            ▼
          </span>
        </button>

        <div
          className={`
            absolute top-full left-0 mt-2 w-72 md:w-80 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 ease-in-out origin-top-left shadow-[0_8px_32px_rgba(0,0,0,0.8)]
            ${isOpen ? "max-h-96 opacity-100 transform scale-100" : "max-h-0 opacity-0 transform scale-95"}
          `}
        >
          <div className="p-4 space-y-3 font-mono text-[10px]">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-gray-400 uppercase font-black tracking-wider text-[9px]">
                Round ID
              </span>
              <span className="text-white font-bold bg-white/10 px-2 py-0.5 rounded text-[10px] select-all tracking-wider">{roundId}</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-gray-400 uppercase font-black tracking-wider text-[9px]">
                Result Cipher (SHA256)
              </span>
              <div className="bg-black/50 p-2 rounded-lg border border-white/5 break-all text-gray-300 select-all leading-relaxed text-[9px]">
                {cipherDisplay}
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 pt-3">
              <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/5">
                <span className="text-gray-400 uppercase font-black tracking-wider text-[9px]">
                  Multiplier Result
                </span>
                <span
                  className={`text-lg font-black tracking-tighter ${status === GameStatus.CRASHED ? "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" : "text-gray-400"}`}
                >
                  {resultDisplay}
                </span>
              </div>

              <div className="flex flex-col gap-1.5 overflow-hidden">
                <span className="text-gray-400 uppercase font-black tracking-wider text-[9px]">
                  Server Seed (Reveal)
                </span>
                <span
                  className={`${status === GameStatus.CRASHED ? "text-emerald-400 bg-emerald-900/20 border border-emerald-500/20 px-2 py-1.5 rounded-lg font-bold" : "text-gray-600 bg-black/30 px-2 py-1.5 rounded-lg italic"} break-all text-[9px] select-all min-h-[28px] transition-all`}
                  title={seedDisplay}
                >
                  {seedDisplay}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-auto flex items-center gap-2 bg-black/40 backdrop-blur-md text-[10px] text-gray-300 px-3 py-1.5 rounded-full border border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
        <span className="font-bold tracking-widest">{ping}MS</span>
      </div>
    </div>
  );
};

export default ProvablyFairStats;
