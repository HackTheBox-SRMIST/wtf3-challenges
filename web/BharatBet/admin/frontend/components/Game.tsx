import React, { useEffect, useState, useRef } from "react";
import GameCanvas from "./GameCanvas";
import ProvablyFairStats from "./ProvablyFairStats";
import { GameStatus, User } from "../types";
import { GAME_SETTINGS } from "../constants";
import Sidebar from "./Sidebar";
import { API_BASE, WS_BASE } from "../api";

interface GameProps {
  user: User;
  onUpdateBalance: (newBalance: number) => void;
}

const Game: React.FC<GameProps> = ({ user, onUpdateBalance }) => {
  const [gameState, setGameState] = useState<any>({
    status: GameStatus.WAITING,
    currentMultiplier: 1.0,
    round: null,
    bets: [],
    history: [],
  });

  const [betAmount, setBetAmount] = useState<string>('10');
  const [activeBet, setActiveBet] = useState<boolean>(false);
  const [cashedOut, setCashedOut] = useState<boolean>(false);
  const [containerSize, setContainerSize] = useState({
    width: 800,
    height: 500,
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedBets, setCompletedBets] = useState<any[]>([]);
  const [topBets, setTopBets] = useState<any[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const multiplierRef = useRef<HTMLDivElement>(null);
  const loadingBarRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const userRef = useRef(user);
  const statusRef = useRef(GameStatus.WAITING);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE}/ws/game`);

    ws.onmessage = (event) => {
      const liveState = JSON.parse(event.data);

      if (liveState.type === "balance_update" && liveState.username === userRef.current.username) {
        onUpdateBalance(liveState.balance);
        return;
      }

      if (!liveState || !liveState.status) return;

      if (
        liveState.status === GameStatus.WAITING &&
        statusRef.current !== GameStatus.WAITING
      ) {
        setActiveBet(false);
        setCashedOut(false);
      }

      if (
        liveState.status === GameStatus.CRASHED &&
        statusRef.current !== GameStatus.CRASHED
      ) {
        const finalBets = liveState.bets || [];
        const myRoundBets = finalBets.filter((b: any) => b.userId === userRef.current.username);
        if (myRoundBets.length > 0) {
          setCompletedBets(prev => [...myRoundBets, ...prev].slice(0, 50));
        }
        const winningBets = finalBets.filter((b: any) => b.cashOutMultiplier);
        if (winningBets.length > 0) {
          setTopBets(prev => {
            const combined = [...prev, ...winningBets];
            combined.sort((a, b) => b.winAmount - a.winAmount);
            return combined.slice(0, 50);
          });
        }
      }

      statusRef.current = liveState.status;
      setGameState(liveState);

      const myBet = liveState.bets.find(
        (b: any) => b.userId === userRef.current.username,
      );
      if (myBet && myBet.cashOutMultiplier && !cashedOut) {
        setCashedOut(true);
      }
    };

    ws.onopen = () => {
      setErrorMsg(null);
      console.log("Connected to Backend");
    };
    ws.onerror = () => setErrorMsg("Server connection lost");
    wsRef.current = ws;

    return () => ws.close();
  }, [user.username]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let animationFrameId: number;
    const updateVisuals = () => {
      const now = Date.now();
      if (multiplierRef.current) {
        if (
          gameState.status === GameStatus.FLYING &&
          gameState.flightStartTime
        ) {
          const elapsed = (now - gameState.flightStartTime) / 1000;
          const val = Math.exp(0.04 * elapsed);
          multiplierRef.current.innerText = `${val.toFixed(2)}x`;
        } else if (gameState.status === GameStatus.CRASHED) {
          multiplierRef.current.innerText = `${gameState.currentMultiplier.toFixed(2)}x`;
        } else {
          multiplierRef.current.innerText = "";
        }
      }

      if (
        loadingBarRef.current &&
        gameState.status === GameStatus.WAITING &&
        gameState.round
      ) {
        const timeLeft = gameState.round.startTime - now;
        let percentage =
          100 - (timeLeft / GAME_SETTINGS.PREPARATION_TIME_MS) * 100;
        loadingBarRef.current.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
      }
      animationFrameId = requestAnimationFrame(updateVisuals);
    };
    updateVisuals();
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState]);

  const handleBetAction = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    setErrorMsg(null);

    const numAmount = parseFloat(betAmount);
    if (isNaN(numAmount) || numAmount < 10 || numAmount > 8000) {
      setErrorMsg("Bet must be between ₹10 and ₹8000");
      return;
    }

    try {
      if (gameState.status === GameStatus.WAITING && !activeBet) {
        if (userRef.current.balance < numAmount)
          throw new Error("Insufficient funds");
        wsRef.current.send(
          JSON.stringify({
            action: "place_bet",
            userId: userRef.current.username,
            amount: numAmount,
            token: userRef.current.token,
          }),
        );
        setActiveBet(true);
        setCashedOut(false);
      } else if (gameState.status === GameStatus.WAITING && activeBet) {
        wsRef.current.send(
          JSON.stringify({
            action: "cancel_bet",
            userId: userRef.current.username,
            token: userRef.current.token,
          }),
        );
        setActiveBet(false);
      } else if (
        gameState.status === GameStatus.FLYING &&
        activeBet &&
        !cashedOut
      ) {
        wsRef.current.send(
          JSON.stringify({
            action: "cashout",
            userId: userRef.current.username,
            token: userRef.current.token,
          }),
        );
      }
    } catch (e: any) {
      setErrorMsg(e.message || "Action failed");
    }
  };

  return (
    <div className="flex flex-1 overflow-x-hidden overflow-y-auto md:overflow-hidden h-full flex-col md:flex-row bg-gradient-to-br from-black to-[#050510]">
      <Sidebar
        bets={gameState.bets}
        myBets={[
          ...(gameState.bets || []).filter((b: any) => b.userId === user.username),
          ...completedBets
        ]}
        topBets={topBets}
        currentUser={user}
      />
      <div className="flex-1 flex flex-col relative z-10 w-full min-w-0 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] min-h-[500px]">
        <div className="h-10 md:h-12 bg-black/60 backdrop-blur-md flex items-center px-4 md:px-6 gap-2 md:gap-3 border-b border-white/10 z-50 relative shrink-0 shadow-sm">
          <div className="text-[9px] md:text-[10px] text-gray-500 font-black tracking-widest mr-1 md:mr-3 shrink-0">
            RECENT
          </div>

          <div className="flex gap-1.5 md:gap-2 overflow-x-auto overflow-y-hidden whitespace-nowrap scroll-smooth flex-1 mr-4 pb-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {gameState.history.map((h: any, i: number) => (
              <div
                key={i}
                className={`flex-shrink-0 flex items-center justify-center px-2 py-0.5 md:px-3 md:py-1 rounded-md cursor-help shadow-sm transition-all hover:scale-105 ${h.multiplier < 2 ? "text-indigo-400 bg-indigo-500/10 border border-indigo-500/20" : h.multiplier < 10 ? "text-purple-400 bg-purple-500/10 border border-purple-500/20" : "text-pink-500 bg-pink-500/10 border border-pink-500/20 drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]"}`}
                title={`Round ID: ${h.roundId}\nCrash: ${h.multiplier.toFixed(2)}x`}
              >
                <span className="text-[10px] md:text-[11px] font-black">{h.multiplier.toFixed(2)}x</span>
              </div>
            ))}
          </div>
        </div>

        <ProvablyFairStats round={gameState.round} status={gameState.status} />

        <div className="flex-1 relative overflow-hidden" ref={containerRef}>
          <GameCanvas
            status={gameState.status}
            currentMultiplier={gameState.currentMultiplier}
            width={containerSize.width}
            height={containerSize.height}
            flightStartTime={gameState.flightStartTime}
          />

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 flex-col">
            {gameState.status === GameStatus.WAITING ? (
              <div className="flex flex-col items-center animate-fade-in bg-black/30 w-full h-full justify-center backdrop-blur-[2px]">
                <div className="text-6xl font-black text-white/90 animate-pulse tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                  PREPARING FLIGHT
                </div>
                <div className="w-64 h-2.5 bg-white/10 rounded-full mt-6 overflow-hidden border border-white/5 backdrop-blur-sm shadow-inner">
                  <div
                    ref={loadingBarRef}
                    className="h-full bg-gradient-to-r from-orange-500 to-yellow-400 shadow-[0_0_15px_rgba(249,115,22,0.8)]"
                    style={{ width: "0%", transition: "width 0.1s linear" }}
                  ></div>
                </div>
              </div>
            ) : (
              <>
                <div
                  ref={multiplierRef}
                  className={`text-7xl md:text-9xl font-black tabular-nums tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] ${gameState.status === GameStatus.CRASHED ? "text-red-600 drop-shadow-[0_0_30px_rgba(239,68,68,0.6)]" : "text-white"}`}
                />
                {gameState.status === GameStatus.CRASHED && (
                  <div className="text-red-500 font-black tracking-widest text-4xl animate-bounce bg-black/60 px-8 py-3 rounded-2xl backdrop-blur-md mt-4 border border-red-500/40 shadow-[0_10px_40px_rgba(239,68,68,0.4)]">
                    CRASHED
                  </div>
                )}
              </>
            )}
            {errorMsg && (
              <div className="absolute top-20 bg-red-900/80 text-white px-4 py-2 rounded text-sm border border-red-500 backdrop-blur-md">
                {errorMsg}
              </div>
            )}
          </div>
        </div>

        <div className="p-3 md:p-5 bg-black/80 backdrop-blur-xl border-t border-white/10 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-8 z-30 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] relative">
          <div className="absolute inset-0 bg-gradient-to-t from-orange-500/5 to-transparent pointer-events-none"></div>
          <div className="flex flex-col gap-1.5 w-full md:w-60 relative z-10 max-w-sm">
            <div className="flex justify-between text-[10px] text-gray-400 font-black tracking-wider uppercase">
              <span>Bet Amount</span>
              <span
                className={
                  parseFloat(betAmount) > user.balance ? "text-red-500" : "text-emerald-400"
                }
              >
                {parseFloat(betAmount) > user.balance ? "INSUFFICIENT FUNDS" : "READY"}
              </span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-1 flex items-center relative h-10 md:h-12 shadow-inner group focus-within:border-white/30 focus-within:bg-white/10 transition-all">
              <button
                onClick={() => setBetAmount(v => String(Math.max(10, parseFloat(v || '0') - 10)))}
                className="w-10 md:w-12 h-full bg-black/40 hover:bg-black/60 rounded-lg text-gray-400 hover:text-white font-bold text-xl flex items-center justify-center transition-colors"
                disabled={activeBet}
              >
                −
              </button>
              <input
                type="number"
                step="0.01"
                value={betAmount}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.includes('.') && val.split('.')[1].length > 2) return;
                  setBetAmount(val);
                }}
                className="flex-1 bg-transparent text-center text-white font-bold outline-none px-2 w-full [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                disabled={activeBet}
              />
              <button
                onClick={() => setBetAmount(v => String(Math.min(8000, parseFloat(v || '0') + 10)))}
                className="w-10 md:w-12 h-full bg-black/40 hover:bg-black/60 rounded-lg text-gray-400 hover:text-white font-bold text-xl flex items-center justify-center transition-colors"
                disabled={activeBet}
              >
                +
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-1">
              {[10, 50, 100, 500].map((amt) => (
                <button
                  key={amt}
                  onClick={() => setBetAmount(String(amt))}
                  disabled={activeBet}
                  className="bg-white/5 border border-white/5 text-[9px] md:text-[10px] py-1 md:py-1.5 rounded-md font-bold text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                >
                  {amt}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleBetAction}
            disabled={
              gameState.status === GameStatus.CRASHED ||
              (gameState.status === GameStatus.FLYING && !activeBet) ||
              (activeBet && cashedOut) ||
              (gameState.status === GameStatus.WAITING &&
                !activeBet &&
                (user.balance < parseFloat(betAmount) || parseFloat(betAmount) < 10 || parseFloat(betAmount) > 8000))
            }
            className={`w-full max-w-sm md:max-w-none md:w-96 h-14 md:h-20 rounded-2xl text-xl md:text-2xl font-black shadow-[0_10px_30px_rgba(0,0,0,0.5)] transform transition-all active:scale-95 flex flex-col items-center justify-center leading-none border-t border-white/20 relative overflow-hidden group z-10
              ${gameState.status === GameStatus.WAITING && !activeBet ? (user.balance < parseFloat(betAmount) || parseFloat(betAmount) < 10 || parseFloat(betAmount) > 8000 ? "bg-white/5 text-gray-500 cursor-not-allowed opacity-50" : "bg-gradient-to-b from-emerald-400 to-emerald-600 hover:from-emerald-300 hover:to-emerald-500 text-white drop-shadow-[0_0_15px_rgba(52,211,153,0.4)]") : ""}
              ${gameState.status === GameStatus.WAITING && activeBet ? "bg-gradient-to-b from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 text-white drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]" : ""}
              ${gameState.status === GameStatus.FLYING && activeBet && !cashedOut ? "bg-gradient-to-b from-orange-400 to-orange-600 hover:from-orange-300 hover:to-orange-500 text-white drop-shadow-[0_0_15px_rgba(249,115,22,0.4)]" : ""}
              ${(gameState.status === GameStatus.FLYING && (!activeBet || cashedOut)) || gameState.status === GameStatus.CRASHED ? "bg-white/5 text-gray-600 cursor-not-allowed" : ""}
            `}
          >
            <div className="relative z-10 flex flex-col items-center">
              {gameState.status === GameStatus.WAITING && !activeBet && (
                <>
                  <span className="text-3xl tracking-wide">BET</span>
                  <span className="text-xs font-medium opacity-80 mt-1">
                    {parseFloat(betAmount) < 10 || parseFloat(betAmount) > 8000
                      ? "BET BETW. ₹10-₹8000"
                      : user.balance < parseFloat(betAmount)
                        ? "INSUFFICIENT FUNDS"
                        : "PLACE YOUR BET"}
                  </span>
                </>
              )}
              {gameState.status === GameStatus.WAITING && activeBet && (
                <>
                  <span className="text-3xl">CANCEL</span>
                  <span className="text-xs mt-1">WAITING FOR ROUND...</span>
                </>
              )}
              {gameState.status === GameStatus.FLYING &&
                activeBet &&
                !cashedOut && (
                  <>
                    <span className="text-3xl">CASHOUT</span>
                    <span className="text-xl font-mono mt-1 bg-black/20 px-3 rounded">
                      ₹{(parseFloat(betAmount) * gameState.currentMultiplier).toFixed(0)}
                    </span>
                  </>
                )}
              {gameState.status === GameStatus.FLYING &&
                (!activeBet || cashedOut) && (
                  <span className="text-xl font-bold">
                    WAITING FOR NEXT ROUND
                  </span>
                )}
              {gameState.status === GameStatus.CRASHED && (
                <span className="text-xl font-bold">ROUND OVER</span>
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Game;
