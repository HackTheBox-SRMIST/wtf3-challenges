import React from 'react';
import { User } from '../types';

interface TopBarProps {
  user: User | null;
  onLogout: () => void;
  onOpenShop: () => void;
  onOpenDeposit: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ user, onLogout, onOpenShop, onOpenDeposit }) => {
  return (
    <div className="h-16 md:h-20 bg-black/60 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-3 md:px-8 z-50 relative shadow-2xl shrink-0">
      <div className="flex items-center gap-2 md:gap-8">
        <div className="text-xl md:text-3xl font-black tracking-tighter text-white drop-shadow-md cursor-default shrink-0">
          BHARAT<span className="text-orange-500">BET</span>
        </div>
        <div className="hidden md:flex gap-6 text-sm font-bold text-gray-400 tracking-wide uppercase">
          <button
            onClick={onOpenShop}
            className="hover:text-orange-400 hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.8)] transition-all"
          >
            BAZAAR
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        {user ? (
          <>
            <div className="flex items-center bg-white/5 rounded-xl border border-white/10 overflow-hidden shadow-inner backdrop-blur-sm">
              <button
                onClick={onOpenDeposit}
                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-2 py-1.5 md:px-5 md:py-2 font-bold hover:from-orange-400 hover:to-orange-500 transition-all flex items-center gap-1 md:gap-2"
              >
                <span className="text-[11px] md:text-sm drop-shadow-sm">₹{user.balance.toFixed(2)}</span>
                <span className="hidden md:inline-block bg-black/20 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">DEPOSIT</span>
              </button>
            </div>

            <div className="flex items-center gap-1 md:gap-3 border-l border-white/10 pl-2 md:pl-6 ml-1 md:ml-2">
              <img
                src={`/api/avatar?file=${user.avatar || '1.png'}&token=${user.token}`}
                alt="Avatar"
                className="w-6 h-6 md:w-8 md:h-8 rounded-full ring-2 ring-indigo-400/50 shadow-[0_0_10px_rgba(79,70,229,0.5)] object-cover bg-black/50"
              />
              <span className="hidden md:inline text-white text-sm font-bold tracking-wide">{user.username}</span>
              <button
                onClick={onLogout}
                className="text-[10px] md:text-xs text-red-500 hover:text-red-400 uppercase font-black ml-1 md:ml-2 px-1 md:px-2 py-1 rounded hover:bg-red-500/10 transition-colors"
              >
                EXIT
              </button>
            </div>
          </>
        ) : (
          <span className="text-gray-500 text-sm">NOT LOGGED IN</span>
        )}
      </div>
    </div>
  );
};

export default TopBar;