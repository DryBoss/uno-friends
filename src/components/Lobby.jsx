// src/components/Lobby.jsx
import React, { useState, useEffect } from "react";
import {
  Edit2,
  Play,
  Users,
  Check,
  Copy,
  ArrowLeft,
  Loader2,
  Wifi,
  Gamepad2,
  X,
  Dna,
  Settings,
  Layers,
  RotateCw,
  Zap,
  Flame,
  Repeat,
  ShieldAlert,
} from "lucide-react";
import networkManager from "../network/NetworkManager";
import useGameStore from "../store/gameStore";

// --- ASSETS ---
const ANIMAL_AVATARS = [
  { id: "bear", emoji: "🐻", color: "bg-amber-200" },
  { id: "panda", emoji: "🐼", color: "bg-slate-200" },
  { id: "fox", emoji: "🦊", color: "bg-orange-300" },
  { id: "koala", emoji: "🐨", color: "bg-gray-300" },
  { id: "lion", emoji: "🦁", color: "bg-yellow-300" },
  { id: "tiger", emoji: "🐯", color: "bg-orange-400" },
  { id: "cat", emoji: "🐱", color: "bg-pink-200" },
  { id: "dog", emoji: "🐶", color: "bg-stone-300" },
  { id: "rabbit", emoji: "🐰", color: "bg-rose-200" },
  { id: "frog", emoji: "🐸", color: "bg-green-300" },
  { id: "pig", emoji: "🐷", color: "bg-red-200" },
  { id: "cow", emoji: "🐮", color: "bg-slate-100" },
  { id: "monkey", emoji: "🐵", color: "bg-amber-300" },
  { id: "penguin", emoji: "🐧", color: "bg-sky-200" },
  { id: "owl", emoji: "🦉", color: "bg-stone-400" },
  { id: "dragon", emoji: "🐲", color: "bg-emerald-300" },
];

const Lobby = () => {
  // --- STATE ---
  const [mode, setMode] = useState("MENU");
  const [activeTab, setActiveTab] = useState("players"); // 'players' | 'rules'

  // Profile
  const [myName, setMyName] = useState("");
  const [myAvatarId, setMyAvatarId] = useState("bear");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSelectingAvatar, setIsSelectingAvatar] = useState(false);

  // Network
  const [hostId, setHostId] = useState("");
  const [joinId, setJoinId] = useState("");
  const [status, setStatus] = useState("");
  const [playerList, setPlayerList] = useState([]);

  // GAME RULES STATE
  const [rules, setRules] = useState({
    variant: "CLASSIC", // CLASSIC, NO_MERCY, FLIP
    stacking: true, // +2 on +2
    sevenZero: false, // 7 swaps, 0 rotates
    jumpIn: false, // Play out of turn if identical
    forcePlay: false, // Must play if you draw a playable card
  });

  const startGame = useGameStore((state) => state.startGame);

  // --- LOAD & SAVE ---
  useEffect(() => {
    const savedName = localStorage.getItem("uno_player_name");
    if (savedName) setMyName(savedName);
    else {
      const rName = "Player" + Math.floor(Math.random() * 100);
      setMyName(rName);
    }

    const savedAvatar = localStorage.getItem("uno_player_avatar_id");
    if (savedAvatar) setMyAvatarId(savedAvatar);
  }, []);

  const saveProfile = (name, avatarId) => {
    if (name) localStorage.setItem("uno_player_name", name);
    if (avatarId) localStorage.setItem("uno_player_avatar_id", avatarId);
  };

  // --- NETWORK HANDLERS ---
  const handleHost = async () => {
    setStatus("Setting up table...");
    try {
      const id = await networkManager.host();
      setHostId(id);
      setMode("HOST");
      setStatus("Waiting for friends...");
      setPlayerList([
        { id: "p1", name: myName, avatarId: myAvatarId, isHost: true },
      ]);

      networkManager.setCallback((msgString) => {
        const msg = JSON.parse(msgString);
        if (msg.type === "HELLO_I_AM") {
          setPlayerList((prev) => {
            const newPlayer = {
              id: "p" + (prev.length + 1 + Math.random()),
              name: msg.payload.name,
              avatarId: msg.payload.avatarId,
              isHost: false,
            };
            const newList = [...prev, newPlayer];
            networkManager.send("UPDATE_PLAYER_LIST", { list: newList });
            return newList;
          });
        }
      });
    } catch (e) {
      setStatus("Error: " + e.message);
      setMode("MENU");
    }
  };

  const handleJoin = async () => {
    if (!joinId) return;
    setStatus("Joining table...");
    try {
      await networkManager.join(joinId);
      setMode("LOBBY");
      setStatus("Connected!");
      networkManager.send("HELLO_I_AM", { name: myName, avatarId: myAvatarId });

      networkManager.setCallback((msgString) => {
        const msg = JSON.parse(msgString);
        if (msg.type === "UPDATE_PLAYER_LIST") setPlayerList(msg.payload.list);
        if (msg.type === "GAME_START")
          startGame(
            msg.payload.rules.variant,
            msg.payload.players,
            msg.payload.rules,
          );
      });
    } catch (e) {
      setStatus("Could not find room.");
    }
  };

  const handleStartGame = () => {
    // Send Rules + Players to everyone
    networkManager.send("GAME_START", { rules, players: playerList });
    startGame(rules.variant, playerList, rules);
  };

  // --- HELPER COMPONENTS ---
  const AnimalToken = ({ id, size = "md", className = "" }) => {
    const animal = ANIMAL_AVATARS.find((a) => a.id === id) || ANIMAL_AVATARS[0];
    const sizeClasses = {
      sm: "w-10 h-10 text-xl",
      md: "w-16 h-16 text-4xl",
      lg: "w-28 h-28 text-6xl",
    };
    return (
      <div
        className={`${sizeClasses[size]} ${animal.color} rounded-full flex items-center justify-center shadow-inner border-2 border-white/50 select-none ${className}`}
      >
        {animal.emoji}
      </div>
    );
  };

  const Toggle = ({ label, value, onChange, icon: Icon }) => (
    <div
      onClick={() => onChange(!value)}
      className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${value ? "bg-orange-100 border-orange-400" : "bg-white border-orange-100"}`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-2 rounded-full ${value ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-500"}`}
        >
          <Icon size={18} />
        </div>
        <span
          className={`font-bold ${value ? "text-orange-900" : "text-gray-400"}`}
        >
          {label}
        </span>
      </div>
      <div
        className={`w-12 h-6 rounded-full p-1 transition-colors ${value ? "bg-orange-500" : "bg-gray-300"}`}
      >
        <div
          className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${value ? "translate-x-6" : "translate-x-0"}`}
        />
      </div>
    </div>
  );

  const ModeCard = ({ id, label, desc, icon: Icon, color }) => (
    <button
      onClick={() => setRules({ ...rules, variant: id })}
      className={`relative flex flex-col items-center p-3 rounded-xl border-4 transition-all w-full ${rules.variant === id ? "bg-white border-green-500 shadow-md scale-105 z-10" : "bg-orange-50 border-transparent opacity-70 hover:opacity-100"}`}
    >
      <div className={`p-2 rounded-full mb-2 ${color} text-white`}>
        <Icon size={24} />
      </div>
      <span className="font-black text-sm text-[#3E2723] uppercase">
        {label}
      </span>
      <span className="text-[10px] font-bold text-gray-500 leading-tight">
        {desc}
      </span>
      {rules.variant === id && (
        <div className="absolute top-2 right-2 text-green-500">
          <Check size={16} strokeWidth={4} />
        </div>
      )}
    </button>
  );

  const Background = ({ children }) => (
    <div className="fixed inset-0 w-full h-full bg-[#3E2723] flex flex-col items-center justify-center font-sans overflow-hidden">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(#D7CCC8 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      ></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#5D4037] rounded-full blur-[100px] opacity-50 pointer-events-none"></div>
      <div className="relative w-full h-full max-w-md flex flex-col items-center p-6 z-10">
        {children}
      </div>
    </div>
  );

  const CardPanel = ({ children, className = "" }) => (
    <div
      className={`bg-[#FFF8E1] text-[#3E2723] rounded-3xl shadow-[0_8px_0_rgba(0,0,0,0.2)] border-4 border-[#FFECB3] relative flex flex-col ${className}`}
    >
      {children}
    </div>
  );

  const CozyButton = ({
    onClick,
    color = "orange",
    icon: Icon,
    children,
    disabled,
  }) => {
    const colors = {
      orange: "bg-orange-500 border-orange-700",
      blue: "bg-sky-500 border-sky-700",
      green: "bg-emerald-500 border-emerald-700",
    };
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full py-4 rounded-2xl font-black text-xl border-b-4 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-3 text-white ${disabled ? "bg-gray-400 border-gray-500 opacity-50" : colors[color]} hover:brightness-110`}
      >
        {Icon && <Icon size={24} strokeWidth={3} />} {children}
      </button>
    );
  };

  // --- MENU SCREEN ---
  if (mode === "MENU") {
    return (
      <Background>
        <div className="flex-1 flex flex-col justify-center items-center w-full">
          <div className="transform rotate-[-3deg] mb-8 relative">
            <h1
              className="text-8xl font-black text-yellow-400 drop-shadow-[0_6px_0_rgba(180,83,9,1)] tracking-tighter"
              style={{ WebkitTextStroke: "3px #3E2723" }}
            >
              UNO
            </h1>
            <span className="bg-white text-[#3E2723] px-3 py-1 rounded-full text-sm font-bold shadow-md absolute -bottom-4 right-0 rotate-[6deg]">
              Friends
            </span>
          </div>

          <CardPanel className="w-full mb-8 p-6 items-center">
            <div
              className="relative group cursor-pointer mb-4"
              onClick={() => setIsSelectingAvatar(true)}
            >
              <AnimalToken
                id={myAvatarId}
                size="lg"
                className="border-4 border-white shadow-lg"
              />
              <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full border-2 border-white shadow-sm hover:scale-110 transition">
                <Edit2 size={16} />
              </div>
            </div>
            {isEditingName ? (
              <div className="flex gap-2 w-full">
                <input
                  autoFocus
                  className="bg-white border-2 border-orange-200 rounded-xl px-3 py-2 text-center w-full outline-none font-bold text-lg text-[#5D4037]"
                  value={myName}
                  onChange={(e) => setMyName(e.target.value)}
                  onBlur={() => setIsEditingName(false)}
                />
                <button
                  onClick={() => setIsEditingName(false)}
                  className="bg-green-500 p-2 rounded-xl text-white shadow-md"
                >
                  <Check size={20} strokeWidth={3} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => setIsEditingName(true)}
                className="flex items-center gap-2 cursor-pointer hover:bg-black/5 px-4 py-1 rounded-lg transition"
              >
                <h2 className="text-3xl font-black text-[#5D4037]">{myName}</h2>
                <Edit2 size={18} className="text-gray-400 opacity-50" />
              </div>
            )}
          </CardPanel>

          <div className="flex flex-col gap-4 w-full">
            <CozyButton onClick={handleHost} color="orange" icon={Wifi}>
              HOST GAME
            </CozyButton>
            <CozyButton
              onClick={() => setMode("JOIN")}
              color="blue"
              icon={Gamepad2}
            >
              JOIN GAME
            </CozyButton>
          </div>
        </div>
        {/* AVATAR MODAL */}
        {isSelectingAvatar && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-[#FFF8E1] rounded-3xl max-w-sm w-full border-4 border-[#FFECB3] shadow-2xl flex flex-col h-[500px]">
              <div className="flex justify-between items-center p-5 border-b-2 border-orange-100">
                <h3 className="text-xl font-black text-[#3E2723]">
                  Choose Character
                </h3>
                <button
                  onClick={() => setIsSelectingAvatar(false)}
                  className="bg-red-100 p-2 rounded-full text-red-600"
                >
                  <X size={20} strokeWidth={3} />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4 p-5 overflow-y-auto custom-scrollbar">
                {ANIMAL_AVATARS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      setMyAvatarId(a.id);
                      saveProfile(null, a.id);
                      setIsSelectingAvatar(false);
                    }}
                    className={`flex items-center justify-center p-2 rounded-2xl ${myAvatarId === a.id ? "bg-orange-100 ring-4 ring-green-400" : "hover:bg-orange-50"}`}
                  >
                    <div
                      className={`w-14 h-14 ${a.color} rounded-full flex items-center justify-center text-3xl shadow-sm`}
                    >
                      {a.emoji}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Background>
    );
  }

  // --- HOST / LOBBY SCREEN ---
  if (mode === "HOST" || mode === "LOBBY") {
    return (
      <Background>
        {/* Header & Tabs */}
        <div className="w-full mb-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setMode("MENU")}
              className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition"
            >
              <ArrowLeft size={24} strokeWidth={3} />
            </button>

            {/* TABS (Host Only) */}
            {mode === "HOST" ? (
              <div className="flex bg-black/20 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab("players")}
                  className={`px-4 py-1 rounded-lg text-sm font-bold transition-all ${activeTab === "players" ? "bg-[#FFECB3] text-[#3E2723] shadow-sm" : "text-[#FFECB3]/60"}`}
                >
                  Players
                </button>
                <button
                  onClick={() => setActiveTab("rules")}
                  className={`px-4 py-1 rounded-lg text-sm font-bold transition-all ${activeTab === "rules" ? "bg-[#FFECB3] text-[#3E2723] shadow-sm" : "text-[#FFECB3]/60"}`}
                >
                  Rules
                </button>
              </div>
            ) : (
              <span className="font-bold text-[#FFECB3] tracking-widest uppercase text-sm">
                Guest Table
              </span>
            )}
            <div className="w-10"></div>
          </div>

          {/* Room Code Banner (Only on Players Tab) */}
          {mode === "HOST" && activeTab === "players" && (
            <div className="w-full bg-yellow-400 text-yellow-900 p-3 rounded-xl mb-4 shadow-lg border-2 border-yellow-500 flex flex-col items-center relative transform rotate-1 transition-all">
              <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#3E2723] rounded-full"></div>
              <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#3E2723] rounded-full"></div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                Room Code
              </p>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl font-mono font-black tracking-widest">
                  {hostId}
                </h1>
                <button
                  onClick={() => navigator.clipboard.writeText(hostId)}
                  className="opacity-50 hover:opacity-100 p-1"
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CONTENT AREA */}
        <CardPanel className="w-full flex-1 mb-4 p-4 min-h-0 overflow-hidden">
          {/* 1. PLAYERS TAB */}
          {(activeTab === "players" || mode === "LOBBY") && (
            <>
              <div className="flex justify-between items-center mb-2 pb-2 border-b-2 border-[#FFE0B2]">
                <h3 className="text-sm font-black text-[#8D6E63] uppercase tracking-wider">
                  Players ({playerList.length}/8)
                </h3>
              </div>
              <div className="overflow-y-auto flex-1 pr-1 space-y-2 custom-scrollbar">
                {playerList.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center bg-white border-2 border-orange-100 p-2 rounded-xl animate-fade-in"
                  >
                    <div className="relative mr-3 shrink-0">
                      <AnimalToken
                        id={p.avatarId}
                        size="sm"
                        className="border border-orange-200"
                      />
                      {p.isHost && (
                        <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-yellow-900 p-[2px] rounded-full border border-white z-10">
                          <Users size={10} fill="currentColor" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[#3E2723] truncate text-lg">
                        {p.name}
                      </p>
                      <p className="text-xs text-gray-500 font-bold">
                        {p.name === myName
                          ? "You"
                          : p.isHost
                            ? "Host"
                            : "Friend"}
                      </p>
                    </div>
                  </div>
                ))}
                {Array.from({
                  length: Math.max(
                    0,
                    (mode === "HOST" ? 2 : 1) - playerList.length,
                  ),
                }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="border-2 border-dashed border-[#D7CCC8] rounded-xl p-3 flex items-center justify-center text-[#A1887F] text-xs font-bold opacity-60"
                  >
                    Waiting...
                  </div>
                ))}
              </div>
            </>
          )}

          {/* 2. RULES TAB (Host Only) */}
          {activeTab === "rules" && mode === "HOST" && (
            <div className="flex flex-col h-full overflow-y-auto custom-scrollbar pr-1">
              <h3 className="text-sm font-black text-[#8D6E63] uppercase tracking-wider mb-3">
                Game Mode
              </h3>
              <div className="flex gap-2 mb-6">
                <ModeCard
                  id="CLASSIC"
                  label="Classic"
                  desc="Standard Uno"
                  icon={RotateCw}
                  color="bg-green-500"
                />
                <ModeCard
                  id="NO_MERCY"
                  label="No Mercy"
                  desc="+10, Skip All"
                  icon={Flame}
                  color="bg-red-500"
                />
                <ModeCard
                  id="FLIP"
                  label="Flip"
                  desc="Double Sided"
                  icon={Repeat}
                  color="bg-purple-500"
                />
              </div>

              <h3 className="text-sm font-black text-[#8D6E63] uppercase tracking-wider mb-3">
                House Rules
              </h3>
              <div className="space-y-3">
                <Toggle
                  label="Stacking (+2 on +2)"
                  value={rules.stacking}
                  onChange={(v) => setRules({ ...rules, stacking: v })}
                  icon={Layers}
                />
                <Toggle
                  label="7-0 Rule (Swap Hands)"
                  value={rules.sevenZero}
                  onChange={(v) => setRules({ ...rules, sevenZero: v })}
                  icon={RotateCw}
                />
                <Toggle
                  label="Jump-In (Play out of turn)"
                  value={rules.jumpIn}
                  onChange={(v) => setRules({ ...rules, jumpIn: v })}
                  icon={Zap}
                />
              </div>
            </div>
          )}
        </CardPanel>

        {/* Footer */}
        <div className="w-full shrink-0">
          {status && (
            <div className="flex items-center justify-center gap-2 text-[#FFECB3] text-xs font-bold mb-3 animate-pulse bg-[#3E2723]/50 py-1.5 px-4 rounded-full mx-auto w-fit">
              {status.includes("Waiting") && (
                <Loader2 size={12} className="animate-spin" />
              )}
              {status}
            </div>
          )}
          {mode === "HOST" ? (
            <CozyButton
              onClick={handleStartGame}
              color="green"
              icon={Play}
              disabled={playerList.length < 2}
            >
              START GAME
            </CozyButton>
          ) : (
            <div className="text-center text-white/40 text-sm font-bold p-3 animate-pulse">
              Waiting for Host...
            </div>
          )}
        </div>
      </Background>
    );
  }

  // --- JOIN INPUT ---
  if (mode === "JOIN") {
    return (
      <Background>
        <div className="w-full flex justify-start mb-8">
          <button
            onClick={() => setMode("MENU")}
            className="p-2 bg-white/10 rounded-full hover:bg-white/20 text-white transition"
          >
            <ArrowLeft size={24} strokeWidth={3} />
          </button>
        </div>
        <CardPanel className="w-full py-10 items-center">
          <h2 className="text-2xl font-black text-[#3E2723] mb-2">
            Join Table
          </h2>
          <p className="text-[#8D6E63] text-sm mb-6 font-bold">
            Enter the 4-digit code
          </p>
          <input
            autoFocus
            type="text"
            maxLength={4}
            value={joinId}
            onChange={(e) => setJoinId(e.target.value.toUpperCase())}
            placeholder="ABCD"
            className="w-full bg-[#FFF3E0] border-4 border-[#FFE0B2] focus:border-orange-400 text-center text-5xl font-black text-[#3E2723] p-4 rounded-2xl outline-none tracking-[0.2em] placeholder-orange-200 mb-8 uppercase"
          />
          <CozyButton
            onClick={handleJoin}
            disabled={joinId.length < 4}
            color="blue"
          >
            JOIN ROOM
          </CozyButton>
          {status && (
            <p className="mt-4 text-red-500 font-bold text-sm bg-red-100 px-3 py-1 rounded-lg animate-bounce">
              {status}
            </p>
          )}
        </CardPanel>
      </Background>
    );
  }
  return null;
};
export default Lobby;
