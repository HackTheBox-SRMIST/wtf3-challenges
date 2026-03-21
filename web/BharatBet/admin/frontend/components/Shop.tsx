import React from 'react';
import { User } from '../types';
import { GAME_SETTINGS } from '../constants';

interface ShopProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onBuyFlag: () => void;
  flagValue?: string | null;
}

const Shop: React.FC<ShopProps> = ({ isOpen, onClose, user, onBuyFlag, flagValue }) => {
  if (!isOpen) return null;

  const canAfford = user.balance >= GAME_SETTINGS.FLAG_PRICE;
  const isPurchased = (user.flags || []).length > 0 || flagValue != null;

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-[#0f0f1a] border border-orange-500/20 w-full max-w-md rounded-2xl shadow-[0_0_50px_rgba(249,115,22,0.15)] overflow-hidden">
        <div className="p-5 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-orange-500/10 to-transparent">
          <h2 className="text-xl font-black text-white italic tracking-tighter uppercase leading-none">
            The <span className="text-orange-500">Bazaar</span>
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">&times;</button>
        </div>

        <div className="p-8">
          <div className="bg-white/[0.03] rounded-2xl p-6 border border-white/5 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

            <div className="relative z-10">
              <h3 className="text-2xl font-black text-white tracking-tight uppercase italic leading-none mb-3">
                Ultimate <br /> <span className="text-orange-500 text-3xl">Gambler Badge</span>
              </h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed italic border-t border-white/5 pt-4 mt-4">
                "You beat odds of 1 in a trillion... or something like that"
              </p>

              <div className="mt-8 flex items-center justify-center gap-2">
                <span className="text-orange-500 text-xl font-black italic">₹</span>
                <span className="text-4xl font-black tabular-nums text-white tracking-tighter">
                  {GAME_SETTINGS.FLAG_PRICE.toLocaleString()}
                </span>
              </div>

              {isPurchased && flagValue && (
                <div className="mt-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/30">
                  <span className="text-[10px] text-orange-400 font-bold uppercase tracking-[0.2em] block mb-1">
                    Your Reward
                  </span>
                  <div className="text-sm font-mono text-white select-all">
                    {flagValue}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-black/40 flex flex-col items-center gap-4 border-t border-white/5">
          <button
            onClick={onBuyFlag}
            disabled={!canAfford || isPurchased}
            className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all shadow-lg transform active:scale-95
              ${isPurchased ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5' :
                canAfford ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white hover:shadow-orange-500/20' : 'bg-white/5 text-gray-600 border border-white/10 cursor-not-allowed'
              }`}
          >
            {isPurchased ? 'ALREADY OWNED' : canAfford ? 'SECURE PURCHASE' : 'INSUFFICIENT BALANCE'}
          </button>

          <div className="text-[10px] text-gray-600 font-black uppercase tracking-[0.2em]">
            Available: <span className="text-emerald-500">₹{user.balance.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;