
import React, { useState } from 'react';
import { MediaMode } from '../types';
import { MusicIcon, MovieIcon, ChessIcon, GameIcon, ChatIcon, VotingIcon } from '../components/Icons';

interface CreateJoinProps {
  username: string;
  onCreate: (name: string, mode: MediaMode) => void;
  onJoin: (code: string) => void;
}

const CreateJoinScreen: React.FC<CreateJoinProps> = ({ username, onCreate, onJoin }) => {
  const [roomName, setRoomName] = useState('');
  const [mode, setMode] = useState<MediaMode>(MediaMode.MOVIE);
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!roomName.trim()) return;
    setIsCreating(true);
    try {
        await onCreate(roomName, mode);
    } catch (err) {
        setError('Failed to create room');
        setIsCreating(false);
    }
  };

  const handleJoin = async () => {
    if (joinCode.length < 6) return;
    try {
        await onJoin(joinCode);
    } catch (err) {
        setError('Invalid room code');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-5xl">
        <header className="mb-12 text-center">
          <h2 className="text-5xl font-black mb-3 tracking-tighter text-white">Welcome to HangoutX</h2>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">{username}, pick your vibe below</p>
          {error && <p className="text-red-500 font-bold mt-4">{error}</p>}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Create Section */}
          <div className="bg-slate-900/40 border border-white/5 p-10 rounded-[3rem] flex flex-col h-full hover:border-indigo-500/30 transition-all duration-500 group shadow-xl">
            <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-white">
              <span className="bg-indigo-600/10 text-indigo-500 p-2.5 rounded-2xl text-xl shadow-inner">⚡</span>
              Start New Vibe
            </h3>
            
            <div className="space-y-8 flex-grow">
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Room Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Late Night Squad"
                  className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-slate-800 text-white"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Choose Mode</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {[
                    { id: MediaMode.MOVIE, icon: MovieIcon, label: 'Movie' },
                    { id: MediaMode.MUSIC, icon: MusicIcon, label: 'Music' },
                    { id: MediaMode.CHAT, icon: ChatIcon, label: 'Chat' },
                    { id: MediaMode.VOTING, icon: VotingIcon, label: 'Voting' },
                    { id: MediaMode.LUDO, icon: GameIcon, label: 'Ludo' },
                    { id: MediaMode.CHESS, icon: ChessIcon, label: 'Chess' },
                  ].map((item) => (
                    <button 
                      key={item.id}
                      onClick={() => setMode(item.id)}
                      className={`flex flex-col items-center gap-3 p-4 rounded-3xl border-2 transition-all duration-300 ${mode === item.id ? 'border-indigo-500 bg-indigo-500/10 shadow-lg' : 'border-white/5 bg-black/20 hover:border-white/20'}`}
                    >
                      <item.icon className={`w-6 h-6 ${mode === item.id ? 'text-indigo-400' : 'text-slate-600'}`} />
                      <span className={`text-[10px] font-black uppercase tracking-widest ${mode === item.id ? 'text-white' : 'text-slate-600'}`}>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button 
              disabled={!roomName.trim() || isCreating}
              onClick={handleCreate}
              className="mt-10 w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-indigo-600/20 transition-all active:scale-95 border border-white/5"
            >
              {isCreating ? 'Creating Room...' : 'Launch Room'}
            </button>
          </div>

          {/* Join Section */}
          <div className="bg-slate-900/40 border border-white/5 p-10 rounded-[3rem] flex flex-col h-full hover:border-emerald-500/30 transition-all duration-500 group shadow-xl">
            <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-white">
              <span className="bg-emerald-600/10 text-emerald-500 p-2.5 rounded-2xl text-xl shadow-inner">🔗</span>
              Join Friends
            </h3>
            
            <div className="space-y-8 flex-grow flex flex-col justify-center">
              <div className="space-y-4">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest text-center block">Enter Invite Code</label>
                <input 
                  type="text" 
                  placeholder="X-X-X-X"
                  className="w-full bg-black/40 border border-white/10 rounded-[2rem] px-6 py-10 text-center text-5xl font-black tracking-[0.4em] uppercase focus:ring-4 focus:ring-emerald-500/20 focus:outline-none transition-all placeholder:text-slate-900 text-white"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                />
              </div>
              <p className="text-center text-slate-600 text-[10px] font-black uppercase tracking-widest leading-relaxed">
                Connect with your people. <br/> Just sync and hang out.
              </p>
            </div>

            <button 
              disabled={joinCode.length < 6}
              onClick={handleJoin}
              className="mt-10 w-full py-5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-emerald-600/20 transition-all active:scale-95 border border-white/5"
            >
              Enter Hangout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateJoinScreen;
