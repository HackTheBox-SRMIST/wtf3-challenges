import React, { useState } from 'react';
import { Bet, User } from '../types';

interface SidebarProps {
  bets: Bet[];
  myBets: Bet[];
  topBets: Bet[];
  currentUser: User;
}

const Sidebar: React.FC<SidebarProps> = ({ bets, myBets, topBets, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'ALL' | 'MY' | 'TOP'>('ALL');

  const getFilteredBets = () => {
    if (activeTab === 'MY') {
      return myBets;
    } else if (activeTab === 'TOP') {
      return topBets;
    }
    return bets;
  };

  const filteredBets = getFilteredBets();

  return (
    <div className="w-full md:w-80 bg-black/40 backdrop-blur-xl border-t md:border-t-0 md:border-r border-white/10 flex flex-col h-[400px] md:h-full shadow-[4px_0_24px_rgba(0,0,0,0.5)] z-40 relative order-2 md:order-first shrink-0">
      <div className="flex border-b border-white/10 p-2 gap-1 bg-black/20">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`flex-1 py-2 text-[10px] rounded-lg font-black tracking-widest transition-all ${activeTab === 'ALL' ? 'text-white bg-white/10 shadow-inner' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
        >
          ALL BETS
        </button>
        <button
          onClick={() => setActiveTab('MY')}
          className={`flex-1 py-2 text-[10px] rounded-lg font-black tracking-widest transition-all ${activeTab === 'MY' ? 'text-white bg-white/10 shadow-inner' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
        >
          MY BETS
        </button>
        <button
          onClick={() => setActiveTab('TOP')}
          className={`flex-1 py-2 text-[10px] rounded-lg font-black tracking-widest transition-all ${activeTab === 'TOP' ? 'text-white bg-white/10 shadow-inner' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}
        >
          TOP
        </button>
      </div>

      <div className="flex justify-between px-5 py-3 text-[10px] text-gray-400 uppercase font-bold tracking-widest border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
        <span>{filteredBets.length} Bets</span>
        <span className="text-orange-500">INR</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredBets.length === 0 ? (
          <div className="text-center text-gray-600 text-xs py-12 font-medium tracking-wide">
            No active bets
          </div>
        ) : (
          filteredBets.map((bet, i) => (
            <div
              key={i}
              className={`flex items-center justify-between px-5 py-3 text-sm border-b border-white/5 transition-colors ${bet.cashOutMultiplier || bet.winAmount > 0 ? 'bg-emerald-900/10 hover:bg-emerald-900/20' : (activeTab !== 'ALL' && !("cashOutMultiplier" in bet) ? 'bg-red-900/5 hover:bg-white/5' : 'hover:bg-white/5')}`}
            >
              <div className="flex items-center gap-3">
                <img
                  src={`/api/avatar?file=${bet.avatar || '1.png'}&token=${currentUser.token}`}
                  alt="Avatar"
                  className={`w-7 h-7 rounded-full object-cover ${bet.username === currentUser.username ? 'ring-1 ring-orange-500' : 'ring-1 ring-indigo-500/50'}`}
                />
                <div className="flex flex-col">
                  <span className={`text-[11px] font-bold tracking-wide ${bet.username === currentUser.username ? 'text-orange-400' : 'text-gray-300'}`}>
                    {bet.username}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-0.5">
                <div className={`font-bold tracking-tight ${bet.cashOutMultiplier ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]' : 'text-white'}`}>
                  ₹{bet.cashOutMultiplier ? Number(bet.winAmount).toFixed(2) : Number(bet.amount).toFixed(2)}
                </div>
                {bet.cashOutMultiplier && (
                  <div className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-md font-black tracking-wider">
                    {bet.cashOutMultiplier.toFixed(2)}x
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div >
  );
};

export default Sidebar;