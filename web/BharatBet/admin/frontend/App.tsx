import React, { useState, useEffect } from "react";
import Auth from "./components/Auth";
import TopBar from "./components/TopBar";
import Game from "./components/Game";
import Shop from "./components/Shop";
import Deposit from "./components/Deposit";
import { User } from "./types";
import { API_BASE } from "./api";

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [flagValue, setFlagValue] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("bharatbet_current_session");
    if (saved) {
      try {
        const parsedUser = JSON.parse(saved);
        setUser(parsedUser); // Optimistic UI load
        // Verify token and fetch true balance
        fetch(`${API_BASE}/api/me`, {
          headers: {
            "Authorization": `Bearer ${parsedUser.token}`
          }
        })
          .then(res => {
            if (!res.ok) throw new Error("Invalid session");
            return res.json();
          })
          .then(data => {
            const verifiedUser = { ...parsedUser, balance: data.user.balance, avatar: data.user.avatar };
            setUser(verifiedUser);
            localStorage.setItem("bharatbet_current_session", JSON.stringify(verifiedUser));
          })
          .catch(err => {
            console.error("Session verification failed:", err);
            localStorage.removeItem("bharatbet_current_session");
            setUser(null);
          });
      } catch (e) {
        localStorage.removeItem("bharatbet_current_session");
      }
    }
  }, []);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem("bharatbet_current_session", JSON.stringify(loggedInUser));
  };

  const handleLogout = () => {
    setUser(null);
    setFlagValue(null);
    localStorage.removeItem("bharatbet_current_session");
  };

  const updateBalance = (newBalance: number) => {
    if (!user) return;
    const updatedUser = { ...user, balance: newBalance };
    setUser(updatedUser);
    localStorage.setItem("bharatbet_current_session", JSON.stringify(updatedUser));
  };

  const handleBuyFlag = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/api/buy-flag`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Purchase failed");
      setFlagValue(data.flag);
      updateBalance(data.new_balance);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen w-full flex flex-col bg-black text-white font-sans overflow-hidden">
      <TopBar
        user={user}
        onLogout={handleLogout}
        onOpenShop={() => setShopOpen(true)}
        onOpenDeposit={() => setDepositOpen(true)}
      />
      <main className="flex-1 overflow-hidden">
        <Game user={user} onUpdateBalance={updateBalance} />
      </main>

      <Shop
        isOpen={shopOpen}
        onClose={() => setShopOpen(false)}
        user={user}
        onBuyFlag={handleBuyFlag}
        flagValue={flagValue}
      />

      <Deposit
        isOpen={depositOpen}
        onClose={() => setDepositOpen(false)}
      />
    </div>
  );
};

export default App;
