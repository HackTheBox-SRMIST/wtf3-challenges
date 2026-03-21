import React, { useState } from "react";
import { User } from "../types";
import { API_BASE } from "../api";

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatar, setAvatar] = useState("1.png");
  const [availableAvatars, setAvailableAvatars] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    fetch(`${API_BASE}/api/avatars-list`)
      .then(res => res.json())
      .then(data => {
        if (data.avatars && data.avatars.length > 0) {
          setAvailableAvatars(data.avatars);
          // If 1.png isn't there (unlikely but safe), pick the first one
          if (!data.avatars.includes(avatar)) {
            setAvatar(data.avatars[0]);
          }
        }
      })
      .catch(err => console.error("Failed to fetch avatars", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setIsLoading(true);

    const endpoint = isLogin ? `${API_BASE}/login` : `${API_BASE}/register`;

    try {
      const payload = isLogin ? { username, password } : { username, password, avatar: avatar };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        onLogin(data.user);
      } else {
        alert(data.detail || "Authentication failed");
      }
    } catch (error) {
      console.error("Auth error:", error);
      alert("Could not connect to the server. Is FastAPI running?");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen relative overflow-hidden bg-[#050510]">
      <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-orange-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
      <div className="absolute bottom-[10%] right-[20%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
      <div className="relative z-10 bg-black/40 backdrop-blur-2xl p-10 rounded-3xl shadow-2xl w-full max-w-sm border border-white/10">
        <h1 className="text-4xl font-black text-white text-center tracking-tighter drop-shadow-md mb-2">
          BHARAT<span className="text-orange-500">BET</span>
        </h1>
        <p className="text-center text-xs text-gray-400 mb-8 font-medium uppercase tracking-widest">A Premium Experience</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-xs mb-1 uppercase">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/5 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:border-orange-500 focus:bg-white/10 transition-all font-medium"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-gray-400 text-xs mb-1 uppercase">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 p-3.5 rounded-xl text-white outline-none focus:border-orange-500 focus:bg-white/10 transition-all font-medium"
              disabled={isLoading}
            />
          </div>

          {!isLogin && availableAvatars.length > 0 && (
            <div className="flex flex-col items-center mb-2">
              <label className="block text-gray-400 text-xs mb-3 uppercase tracking-widest">
                Select Character
              </label>
              <div className="flex items-center justify-between w-full bg-black/40 border border-white/10 rounded-3xl p-4">
                <button
                  type="button"
                  onClick={() => {
                    const idx = availableAvatars.indexOf(avatar);
                    const newIdx = (idx - 1 + availableAvatars.length) % availableAvatars.length;
                    setAvatar(availableAvatars[newIdx]);
                  }}
                  className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-orange-500 hover:text-white text-gray-400 rounded-full transition-colors font-bold text-xl"
                >
                  &#8249;
                </button>

                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-[3px] border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.5)] mb-3 bg-black/50">
                    <img
                      src={`${API_BASE}/api/avatar-preview?file=${avatar}`}
                      alt={avatar.replace('.png', '')}
                      className="w-full h-full object-cover scale-[1.15]"
                    />
                  </div>
                  <span className="text-white font-black uppercase tracking-widest text-sm drop-shadow-md">
                    {avatar.replace(/\.[^/.]+$/, "")}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const idx = availableAvatars.indexOf(avatar);
                    const newIdx = (idx + 1) % availableAvatars.length;
                    setAvatar(availableAvatars[newIdx]);
                  }}
                  className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-orange-500 hover:text-white text-gray-400 rounded-full transition-colors font-bold text-xl"
                >
                  &#8250;
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 disabled:from-gray-700 disabled:to-gray-800 text-white font-bold py-3.5 rounded-xl shadow-[0_0_20px_rgba(249,115,22,0.3)] transform active:scale-95 transition-all mt-6"
          >
            {isLoading ? "AUTHENTICATING..." : isLogin ? "SECURE LOGIN" : "CREATE ACCOUNT"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-white font-semibold hover:text-orange-400 transition-colors"
            disabled={isLoading}
          >
            {isLogin ? "Register" : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
