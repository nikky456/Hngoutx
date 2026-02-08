
import React from 'react';

interface LandingProps {
  onStart: () => void;
}

const LogoIcon = () => (
  <div className="relative w-20 h-20 md:w-28 md:h-28 logo-glow flex items-center justify-center mb-6">
    <div className="absolute inset-0 bg-indigo-600 rounded-3xl rotate-12 opacity-20 blur-xl"></div>
    <div className="absolute inset-0 bg-indigo-500 rounded-3xl -rotate-6 transition-transform hover:rotate-0 duration-700"></div>
    <div className="relative text-white font-black text-4xl md:text-5xl tracking-tighter italic">
      HX
    </div>
  </div>
);

const LandingScreen: React.FC<LandingProps> = ({ onStart }) => {
  return (
    <div className="relative min-h-screen bg-slate-950 isolate selection:bg-indigo-500/30">
      {/* Background Container - Absolute & Clipped */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-pulse animation-delay-2000"></div>
      </div>
      
      {/* Content Container - Scrollable & Interaction Ready */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-12">
        <LogoIcon />
        
        <h1 className="text-7xl md:text-9xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-500 text-center">
          HangoutX
        </h1>
        
        <div className="mb-10 inline-flex items-center px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-sm font-bold backdrop-blur-md">
          <span className="flex h-2 w-2 rounded-full bg-indigo-500 mr-2 animate-ping"></span>
          REAL-TIME MULTIMEDIA SYNC
        </div>
        
        <p className="text-2xl md:text-4xl text-slate-100 mb-6 font-medium italic tracking-tight text-center">
          “Your vibe. Your room. Your people.”
        </p>
        
        <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto font-light leading-relaxed text-center">
          Movies, Music, and Gaming. perfectly synced for you and your circle. Experience the future of hanging out, anywhere.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center w-full max-w-lg">
          <button 
            onClick={onStart}
            className="flex-1 px-8 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black text-xl shadow-2xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 border border-white/10 cursor-pointer"
          >
            Get Started
          </button>
          <button 
            onClick={onStart}
            className="flex-1 px-8 py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-3xl font-black text-xl backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            Browse Rooms
          </button>
        </div>

        <div className="mt-24 flex items-center gap-12 text-slate-600 font-black tracking-widest text-[10px] uppercase flex-wrap justify-center">
            <span className="flex items-center gap-2">🎬 MOVIE NIGHT</span>
            <span className="flex items-center gap-2">🎵 LISTEN ALONG</span>
            <span className="flex items-center gap-2">🎮 LIVE PLAY</span>
        </div>
      </div>
    </div>
  );
};

export default LandingScreen;
