
import React, { useState, useEffect, useRef } from 'react';
import { User, Room, MediaMode, Message, FloatingReaction } from '../types';
import { 
  PlayIcon, PauseIcon, UploadIcon, UsersIcon, 
  StarIcon, CopyIcon, MovieIcon, MusicIcon, ChessIcon, GameIcon, ChatIcon, VotingIcon, ScreenShareIcon
} from '../components/Icons';
import { getAIAssistance } from '../GeminiService';
import { auth } from '../services/api';

interface DashboardProps {
  user: User;
  room: Room;
  onExit: () => void;
}

const DashboardScreen: React.FC<DashboardProps> = ({ user, room, onExit }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(!user.cameraEnabled);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Voting State
  const [poll, setPoll] = useState({
    question: "What should we do next weekend?",
    options: [
      { id: 1, text: "Go to the beach", votes: 4 },
      { id: 2, text: "Movie Marathon", votes: 2 },
      { id: 3, text: "Gaming Night", votes: 7 },
    ],
    voted: null as number | null
  });

  // Media State
  const [currentMedia, setCurrentMedia] = useState({
    title: room.mode === MediaMode.MOVIE ? 'Interstellar' : 
           room.mode === MediaMode.MUSIC ? 'Starboy' : 
           room.mode === MediaMode.LUDO ? 'Ludo World' : 
           room.mode === MediaMode.CHESS ? 'Chess Pro' :
           room.mode === MediaMode.CHAT ? 'Group Hangout' : 'Decision Time',
    artist: room.mode === MediaMode.MOVIE ? 'Christopher Nolan' : 
            room.mode === MediaMode.MUSIC ? 'The Weeknd' : 
            'HangoutX',
    duration: room.mode === MediaMode.MOVIE ? 10140 : 252,
    thumbnail: room.mode === MediaMode.MOVIE 
      ? 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2094&auto=format&fit=crop'
      : room.mode === MediaMode.MUSIC 
      ? 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=2070&auto=format&fit=crop'
      : room.mode === MediaMode.LUDO
      ? 'https://images.unsplash.com/photo-1611996575749-79a3a250f948?q=80&w=2070&auto=format&fit=crop'
      : room.mode === MediaMode.CHAT
      ? 'https://images.unsplash.com/photo-1543269664-76bc3997d9ea?q=80&w=2070&auto=format&fit=crop'
      : 'https://images.unsplash.com/photo-1541872703-74c5e443d1fe?q=80&w=2070&auto=format&fit=crop'
  });

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', userId: 'bot', username: 'HX Bot', text: `Welcome to the HangoutX ${room.mode} session! Syncing everyone now.`, timestamp: new Date() },
  ]);

  const [participants, setParticipants] = useState<User[]>([
    { id: user.id, username: user.username, isHost: user.isHost, isOnline: true, avatar: user.avatar, cameraEnabled: user.cameraEnabled }
  ]);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(true);
  
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Setup Local Video
  useEffect(() => {
    async function setupLocalVideo() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: !!user.cameraEnabled, 
          audio: true 
        });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Camera access failed or user declined", err);
      }
    }
    setupLocalVideo();
    return () => {
      const stream = localVideoRef.current?.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
    };
  }, [user.cameraEnabled]);

  // Fetch Room Participants
  useEffect(() => {
    async function fetchParticipants() {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const roomData = await auth.getRoomDetails(room.id, token);
        
        // Map backend participants to frontend User type
        const fetchedParticipants: User[] = roomData.participants.map((p: any) => ({
          id: p._id,
          username: p.username,
          avatar: `https://picsum.photos/seed/${p.username}/200`,
          isHost: p._id === room.hostId,
          isOnline: true,
          cameraEnabled: p._id === user.id ? user.cameraEnabled : false
        }));

        setParticipants(fetchedParticipants);
        setIsLoadingParticipants(false);
      } catch (err) {
        console.error("Failed to fetch participants", err);
        setIsLoadingParticipants(false);
      }
    }
    fetchParticipants();
  }, [room.id, room.hostId, user.id, user.cameraEnabled]);


  // Sync Video Track State
  useEffect(() => {
    const stream = localVideoRef.current?.srcObject as MediaStream;
    if (stream) {
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks.forEach(track => track.enabled = !isCameraOff);
      }
      stream.getAudioTracks().forEach(track => track.enabled = !isMuted);
    }
  }, [isCameraOff, isMuted]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiTyping]);

  useEffect(() => {
    let interval: number | undefined;
    if (isPlaying && (room.mode === MediaMode.MOVIE || room.mode === MediaMode.MUSIC)) {
      interval = window.setInterval(() => {
        setProgress(p => (p + 1) % currentMedia.duration);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentMedia.duration, room.mode]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      userId: user.id,
      username: user.username,
      text: chatInput,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    const currentInput = chatInput;
    setChatInput('');

    if (currentInput.toLowerCase().startsWith('/ai')) {
      setIsAiTyping(true);
      const aiMessageId = 'ai-' + Date.now();
      const mediaContext = `${currentMedia.title} (${room.mode}) by ${currentMedia.artist}`;
      const aiPrompt = currentInput.slice(3).trim() || "Tell me something about this!";
      
      let aiResponseText = "";
      const stream = getAIAssistance(aiPrompt, mediaContext);
      
      setMessages(prev => [...prev, {
        id: aiMessageId,
        userId: 'bot',
        username: 'HX Bot ✨',
        text: "",
        timestamp: new Date()
      }]);

      for await (const chunk of stream) {
        aiResponseText += chunk;
        setMessages(prev => prev.map(m => m.id === aiMessageId ? { ...m, text: aiResponseText } : m));
      }
      setIsAiTyping(false);
    }
  };

  const spawnReaction = (emoji: string) => {
    const id = Date.now();
    const left = Math.random() * 80 + 10;
    setReactions(prev => [...prev, { id, emoji, left }]);
    setTimeout(() => setReactions(prev => prev.filter(r => r.id !== id)), 1500);
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
    }
    setIsScreenSharing(false);
    // Optionally notify others via socket if we had one
  };

  const handleScreenShare = async () => {
    if (isScreenSharing) {
        stopScreenShare();
        return;
    }
    
    try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ 
            video: true,
            audio: true 
        });
        
        screenStreamRef.current = stream;
        setIsScreenSharing(true);

        if (screenVideoRef.current) {
            screenVideoRef.current.srcObject = stream;
        }

        // Handle stream end (user clicks "Stop sharing" in browser UI)
        stream.getVideoTracks()[0].onended = () => {
            stopScreenShare();
        };

    } catch (err) {
        console.error("Error sharing screen:", err);
    }
  };

  // Effect to attach stream when video element appears
  useEffect(() => {
    if (isScreenSharing && screenVideoRef.current && screenStreamRef.current) {
        screenVideoRef.current.srcObject = screenStreamRef.current;
    }
  }, [isScreenSharing]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0 
      ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleVote = (optionId: number) => {
    if (poll.voted) return;
    setPoll(prev => ({
      ...prev,
      voted: optionId,
      options: prev.options.map(o => o.id === optionId ? { ...o, votes: o.votes + 1 } : o)
    }));
  };

  const isGameMode = room.mode === MediaMode.LUDO || room.mode === MediaMode.CHESS;
  const isChatMode = room.mode === MediaMode.CHAT;
  const isVotingMode = room.mode === MediaMode.VOTING;

  return (
    <div className="h-screen flex flex-col bg-[#0b0f19] text-slate-100 overflow-hidden font-sans">
      {/* Navbar with HangoutX branding */}
      <nav className="h-16 border-b border-white/5 px-6 flex items-center justify-between bg-slate-950/40 backdrop-blur-3xl z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-xs italic shadow-lg shadow-indigo-600/20">HX</div>
            <div className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-400 to-rose-400">
              HangoutX
            </div>
          </div>
          <div className="h-6 w-[1px] bg-white/10 hidden md:block"></div>
          <div className="flex items-center gap-3">
             <div className="flex -space-x-2">
                {participants.slice(0, 3).map(p => (
                  <img key={p.id} src={p.avatar} className="w-7 h-7 rounded-full border-2 border-[#0b0f19]" />
                ))}
             </div>
             <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{participants.length} Active</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 bg-slate-900/80 border border-white/5 rounded-full px-4 py-1.5 shadow-xl">
             <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                {isGameMode ? 'Gaming Session' : isChatMode ? 'Immersive Chat' : isVotingMode ? 'Group Vote' : 'Synced Feed'}
             </span>
             <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
          </div>
          <div className="h-6 w-[1px] bg-white/10 hidden lg:block"></div>
          <button 
            onClick={onExit}
            className="group flex items-center gap-2 px-5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-full transition-all border border-rose-500/10"
          >
            <span className="text-xs font-black uppercase tracking-widest">Leave Session</span>
          </button>
        </div>
      </nav>

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Side Panel: Chat & Info (Left) */}
        <aside className={`flex flex-col border-r border-white/5 bg-slate-950/20 z-10 transition-all duration-500 ${isChatMode ? 'w-full lg:w-1/3 xl:w-1/4' : 'hidden lg:flex lg:w-80'}`}>
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Party Chat</h3>
            <div className="flex gap-1">
                <div className="w-1 h-1 bg-indigo-500 rounded-full"></div>
                <div className="w-1 h-1 bg-purple-500 rounded-full"></div>
                <div className="w-1 h-1 bg-rose-500 rounded-full"></div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.userId === user.id ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1.5 px-1">
                  <span className={`text-[10px] font-black uppercase tracking-widest ${msg.userId === 'bot' ? 'text-purple-400' : 'text-slate-500'}`}>
                    {msg.username}
                  </span>
                </div>
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed max-w-[95%] shadow-xl border transition-all ${
                  msg.userId === user.id 
                    ? 'bg-indigo-600 border-indigo-400/30 text-white rounded-tr-none' 
                    : msg.userId === 'bot'
                    ? 'bg-slate-900 border-purple-500/30 text-purple-100 rounded-tl-none italic backdrop-blur-md'
                    : 'bg-slate-800/40 border-white/5 text-slate-300 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isAiTyping && (
              <div className="flex flex-col items-start opacity-70">
                 <div className="px-4 py-2 bg-purple-900/20 border border-purple-500/20 rounded-2xl rounded-tl-none">
                    <div className="flex gap-1">
                        <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-1 h-1 bg-purple-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                 </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 bg-slate-950/60 border-t border-white/5">
            <div className="flex justify-between mb-4 px-2">
                {['❤️', '🔥', '😂', '👏', '😮', '💀'].map(emoji => (
                    <button 
                        key={emoji}
                        onClick={() => spawnReaction(emoji)}
                        className="text-xl hover:scale-150 transition-all active:scale-95 grayscale hover:grayscale-0"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
            <form onSubmit={handleSendMessage} className="relative">
              <input 
                type="text" 
                placeholder="Chat or /ai ask..."
                className="w-full bg-black/40 border border-white/10 rounded-2xl pl-4 pr-12 py-3.5 focus:ring-2 focus:ring-indigo-500/50 focus:outline-none text-sm placeholder:text-slate-700 transition-all font-medium text-white"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-xl shadow-lg shadow-indigo-600/20">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path></svg>
              </button>
            </form>
          </div>
        </aside>

        {/* Center Canvas */}
        <main className={`flex-1 flex flex-col relative overflow-hidden bg-[radial-gradient(circle_at_center,_#1e1b4b_0%,_#0b0f19_70%)] ${isChatMode ? 'hidden lg:flex' : ''}`}>
          <div className="absolute inset-0 pointer-events-none z-20">
            {reactions.map(r => (
              <div 
                key={r.id} 
                className="absolute bottom-40 text-6xl reaction-animate filter drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                style={{ left: `${r.left}%` }}
              >
                {r.emoji}
              </div>
            ))}
          </div>

          <div className="flex-1 flex flex-col items-center justify-start p-6 lg:p-10 overflow-y-auto custom-scrollbar">
            
            {/* Media Canvas */}
            <div className="w-full max-w-6xl mb-10 flex flex-col items-center">
              {room.mode === MediaMode.MOVIE ? (
                <div className="w-full aspect-video relative group rounded-[2.5rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/5 bg-black">
                  {isScreenSharing ? (
                     <video 
                        ref={screenVideoRef} 
                        autoPlay 
                        playsInline 
                        className="w-full h-full object-contain bg-black"
                     />
                  ) : (
                    <>
                    <img src={currentMedia.thumbnail} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-all duration-700" />
                    {!isPlaying && (
                        <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20 animate-pulse">
                            <PlayIcon className="w-12 h-12 text-white translate-x-1" />
                        </div>
                        </div>
                    )}
                    <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                        <h2 className="text-3xl font-black mb-1 text-white">{currentMedia.title}</h2>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{currentMedia.artist}</p>
                    </div>
                    </>
                  )}
                </div>
              ) : isGameMode ? (
                <div className="w-full max-w-4xl aspect-square relative rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/5 bg-slate-900">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20"></div>
                    <div className="relative w-full h-full p-8 flex flex-col items-center justify-center">
                       {room.mode === MediaMode.LUDO ? (
                         <div className="w-full h-full grid grid-cols-11 grid-rows-11 gap-1">
                            {[...Array(121)].map((_, i) => (
                              <div key={i} className={`rounded-sm ${
                                i < 15 || i > 105 ? 'bg-indigo-600/20' : 
                                i % 11 < 2 || i % 11 > 8 ? 'bg-rose-600/20' : 
                                'bg-white/5 border border-white/5'
                              }`}></div>
                            ))}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                               <div className="bg-slate-950/80 backdrop-blur-md px-10 py-6 rounded-3xl border border-white/10 text-center">
                                  <h3 className="text-4xl font-black mb-2 tracking-tighter text-indigo-400">LUDO PARTY</h3>
                                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Waiting for players...</p>
                               </div>
                            </div>
                         </div>
                       ) : (
                         <div className="w-full h-full flex items-center justify-center">
                            <div className="w-full max-w-2xl aspect-square grid grid-cols-8 grid-rows-8 border-4 border-indigo-900/50">
                               {[...Array(64)].map((_, i) => {
                                 const isBlack = (Math.floor(i / 8) + (i % 8)) % 2 === 1;
                                 return <div key={i} className={`${isBlack ? 'bg-indigo-950/30' : 'bg-white/5'}`}></div>
                               })}
                               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <div className="bg-slate-950/80 backdrop-blur-md px-10 py-6 rounded-3xl border border-white/10 text-center">
                                     <h3 className="text-4xl font-black mb-2 tracking-tighter text-rose-400">CHESS MATCH</h3>
                                     <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Host to make first move</p>
                                  </div>
                               </div>
                            </div>
                         </div>
                       )}
                    </div>
                </div>
              ) : isChatMode ? (
                <div className="flex flex-col items-center w-full max-w-3xl text-center py-20">
                    <div className="w-32 h-32 bg-indigo-600/20 rounded-full flex items-center justify-center mb-8 border-2 border-indigo-500/20 shadow-[0_0_50px_rgba(79,70,229,0.2)]">
                        <ChatIcon className="w-16 h-16 text-indigo-400" />
                    </div>
                    <h2 className="text-5xl font-black mb-4 tracking-tighter text-white">Conversation Mode</h2>
                    <p className="text-slate-400 text-lg max-w-lg mx-auto font-medium">Just hanging out and talking. Use reactions to express yourself!</p>
                </div>
              ) : isVotingMode ? (
                <div className="w-full max-w-2xl bg-slate-900/80 backdrop-blur-xl border border-white/10 p-10 rounded-[3rem] shadow-2xl">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-rose-600/20 rounded-2xl flex items-center justify-center border border-rose-500/20">
                            <VotingIcon className="w-6 h-6 text-rose-400" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black tracking-tight text-white">{poll.question}</h3>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Community Vote</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {poll.options.map(option => {
                            const totalVotes = poll.options.reduce((acc, curr) => acc + curr.votes, 0);
                            const percentage = totalVotes === 0 ? 0 : Math.round((option.votes / totalVotes) * 100);
                            return (
                                <button 
                                    key={option.id}
                                    disabled={!!poll.voted}
                                    onClick={() => handleVote(option.id)}
                                    className={`w-full group relative overflow-hidden rounded-2xl p-6 text-left border transition-all ${poll.voted === option.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/5 bg-black/20 hover:border-white/20'}`}
                                >
                                    <div 
                                        className="absolute inset-0 bg-white/5 transition-all duration-1000 origin-left"
                                        style={{ transform: `scaleX(${percentage / 100})` }}
                                    ></div>
                                    <div className="relative flex items-center justify-between">
                                        <span className="font-black text-lg text-white">{option.text}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{option.votes} Votes</span>
                                            <span className="text-2xl font-black text-indigo-400 tabular-nums">{percentage}%</span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-8 text-center">
                        <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">
                            {poll.voted ? "Thank you for voting!" : "Select an option to cast your vote"}
                        </p>
                    </div>
                </div>
              ) : (
                <div className="flex flex-col items-center w-full max-w-lg text-center pt-8">
                   <div className="relative mb-8">
                     <div className={`absolute -inset-20 bg-indigo-500/20 rounded-full blur-[80px] transition-all duration-1000 ${isPlaying ? 'opacity-100' : 'opacity-0'}`}></div>
                     <div className={`w-64 h-64 rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white/10 relative z-10 ${isPlaying ? 'scale-110' : 'scale-100'}`}>
                        <img src={currentMedia.thumbnail} className={`w-full h-full object-cover ${isPlaying ? 'animate-[spin_30s_linear_infinite]' : ''}`} />
                     </div>
                   </div>
                   {isScreenSharing ? (
                        <div className="w-full max-w-4xl aspect-video bg-black rounded-3xl overflow-hidden border border-white/10 shadow-2xl mb-8">
                            <video 
                                ref={screenVideoRef} 
                                autoPlay 
                                playsInline 
                                className="w-full h-full object-contain"
                            />
                        </div>
                   ) : (
                        <>
                            <h2 className="text-4xl font-black mb-1 tracking-tight text-white">{currentMedia.title}</h2>
                            <p className="text-indigo-400 font-black uppercase tracking-[0.3em] text-[11px] mb-8">{currentMedia.artist}</p>
                        </>
                   )}
                </div>
              )}
            </div>

            {/* Video Feed Grid */}
            <div className={`w-full max-w-6xl grid gap-4 pb-20 ${isChatMode ? 'grid-cols-2 md:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'}`}>
               {participants.map((p, idx) => (
                 <div key={p.id} className="aspect-video bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden relative group hover:border-indigo-500/30 transition-all shadow-lg">
                    {p.id === user.id && user.cameraEnabled ? (
                      <video 
                        ref={localVideoRef} 
                        autoPlay 
                        playsInline 
                        muted 
                        className={`w-full h-full object-cover mirror -scale-x-100 transition-opacity duration-500 ${isCameraOff ? 'opacity-0' : 'opacity-100'}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-800/40 relative">
                         <img src={p.avatar} className={`w-16 h-16 rounded-3xl border-2 border-white/5 object-cover transition-all ${p.id === user.id ? 'opacity-100 scale-110' : 'opacity-50 grayscale group-hover:grayscale-0 group-hover:scale-110'}`} />
                         {p.id === user.id && !user.cameraEnabled && (
                            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-slate-950/80 border border-white/10 text-[8px] font-black uppercase tracking-widest text-slate-500">Camera Off</div>
                         )}
                      </div>
                    )}
                    
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
                       <span className="text-[10px] font-black uppercase tracking-widest text-white/90 truncate mr-2">
                         {p.username} {p.id === user.id && "(You)"}
                       </span>
                       <div className="flex gap-1.5 items-center">
                          {p.id === user.id && isMuted && <span className="w-2 h-2 rounded-full bg-rose-500"></span>}
                          {p.isHost && <StarIcon className="w-3 h-3 text-indigo-400" />}
                       </div>
                    </div>

                    {p.id === user.id && user.cameraEnabled && isCameraOff && (
                      <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80">
                         <div className="text-center">
                            <span className="text-3xl mb-2 block">📸</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Hidden</span>
                         </div>
                      </div>
                    )}
                 </div>
               ))}
            </div>
          </div>

          {/* Master Control Bar */}
          <div className="h-28 bg-slate-950/90 backdrop-blur-3xl border-t border-white/10 flex flex-col z-50">
             {!isGameMode && !isChatMode && !isVotingMode ? (
               <div className="h-1.5 w-full bg-slate-900 cursor-pointer relative group">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-rose-500 transition-all duration-1000"
                  style={{ width: `${(progress / currentMedia.duration) * 100}%` }}
                >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_15px_rgba(255,255,255,1)] scale-0 group-hover:scale-100 transition-all"></div>
                </div>
               </div>
             ) : (
               <div className="h-1.5 w-full bg-indigo-600/20"></div>
             )}

             <div className="flex-1 flex items-center justify-between px-10">
                <div className="hidden xl:flex items-center gap-4 min-w-[240px]">
                   <img src={currentMedia.thumbnail} className="w-14 h-14 rounded-xl object-cover border border-white/10 shadow-lg" />
                   <div className="flex flex-col">
                      <span className="text-sm font-black truncate w-40 tracking-tight text-white">{currentMedia.title}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 tracking-tighter">HangoutX Live</span>
                   </div>
                </div>

                <div className="flex items-center gap-6 md:gap-10">
                    <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/5">
                        <button 
                          onClick={() => setIsMuted(!isMuted)}
                          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isMuted ? 'bg-rose-500 text-white' : 'hover:bg-white/10 text-slate-400'}`}
                        >
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                        </button>
                        <button 
                          onClick={() => setIsCameraOff(!isCameraOff)}
                          disabled={!user.cameraEnabled}
                          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${!user.cameraEnabled ? 'opacity-20 cursor-not-allowed text-slate-700' : isCameraOff ? 'bg-rose-500 text-white' : 'hover:bg-white/10 text-slate-400'}`}
                        >
                           <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                        </button>
                        
                        {(room.mode === MediaMode.MOVIE || room.mode === MediaMode.MUSIC) && (
                            <button 
                                onClick={handleScreenShare}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${isScreenSharing ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'hover:bg-white/10 text-slate-400'}`}
                                title="Share Screen"
                            >
                                <ScreenShareIcon className="w-5 h-5" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-6">
                        {!isGameMode && !isChatMode && !isVotingMode ? (
                          <button 
                            onClick={() => user.isHost && setIsPlaying(!isPlaying)}
                            className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${user.isHost ? 'bg-white text-black hover:scale-110 shadow-2xl shadow-white/10' : 'bg-slate-900 text-slate-700 cursor-not-allowed border border-white/10'}`}
                          >
                            {isPlaying ? <PauseIcon className="w-8 h-8"/> : <PlayIcon className="w-8 h-8 translate-x-1"/>}
                          </button>
                        ) : isVotingMode ? (
                           <button 
                            className="px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white font-black uppercase tracking-widest text-[11px] rounded-2xl shadow-xl shadow-rose-600/20 active:scale-95 transition-all"
                          >
                            New Poll
                          </button>
                        ) : (
                          <button 
                            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-[11px] rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
                          >
                            {isGameMode ? "Your Move" : "Broadcast"}
                          </button>
                        )}
                    </div>

                    {!isGameMode && !isChatMode && !isVotingMode && (
                      <div className="hidden md:flex flex-col items-center">
                         <span className="text-xl font-mono font-black tabular-nums text-white">{formatTime(progress)}</span>
                         <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Syncing</span>
                      </div>
                    )}
                </div>



                <div className="flex items-center gap-4 min-w-[240px] justify-end">
                    {user.isHost && !isGameMode && !isChatMode && !isVotingMode && (
                      <button 
                        onClick={() => setShowUploadModal(true)}
                        className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 text-slate-400 transition-all"
                      >
                         <UploadIcon className="w-5 h-5" />
                      </button>
                    )}
                    
                    {/* Sharing Section */}
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 hidden xl:block">Invite:</span>
                        
                        <a 
                            href={`https://wa.me/?text=Join%20my%20HangoutX%20room!%20Code:%20${room.code}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-4 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] rounded-2xl border border-[#25D366]/10 transition-all"
                            title="Share on WhatsApp"
                        >
                             <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                        </a>
                        
                        <a 
                            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://hangoutx.app')}&quote=Join%20my%20HangoutX%20room!%20Code:%20${room.code}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-4 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 text-[#1877F2] rounded-2xl border border-[#1877F2]/10 transition-all"
                            title="Share on Facebook"
                        >
                             <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        </a>

                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(room.code);
                                // Optional: Show toast
                            }}
                            className="flex items-center gap-3 bg-indigo-600/10 border border-indigo-500/30 px-6 py-4 rounded-2xl text-indigo-400 transition-all hover:bg-indigo-600/20 active:scale-95 group"
                            title="Copy Room Code"
                        >
                            <CopyIcon className="w-4 h-4" />
                            <span className="text-xs font-black uppercase tracking-widest tracking-tighter group-hover:text-white transition-colors">{room.code}</span>
                        </button>
                    </div>
                </div>
             </div>
          </div>
        </main>
      </div>

      {/* Upload Modal with branding */}
      {showUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setShowUploadModal(false)}></div>
            <div className="relative w-full max-w-xl bg-[#0b0f19] border border-white/10 rounded-[3rem] p-12 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,1)]">
                <div className="text-center mb-10">
                    <h2 className="text-4xl font-black mb-2 tracking-tighter text-white">Queue Media</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Refresh the Vibe</p>
                </div>
                <div className="space-y-6">
                    <div className="border-4 border-dashed border-white/5 rounded-[2rem] p-12 flex flex-col items-center gap-6 group hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all cursor-pointer">
                        <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-600/40">
                            <UploadIcon className="w-10 h-10 text-white" />
                        </div>
                        <span className="font-black text-xl text-white">Upload Sync File</span>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setShowUploadModal(false)} className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-slate-400 font-black uppercase tracking-widest text-xs rounded-2xl transition-all">Cancel</button>
                        <button onClick={() => {
                            setCurrentMedia({
                                title: "HangoutX Original",
                                artist: "HX Creative",
                                duration: 3600,
                                thumbnail: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop"
                            });
                            setShowUploadModal(false);
                        }} className="flex-1 py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-indigo-600/20">Sync Now</button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default DashboardScreen;
