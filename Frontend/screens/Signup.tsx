import React, { useState, useEffect, useRef } from 'react';
import { auth } from '../services/api';

interface SignupProps {
  onSignup: (user: any, cameraEnabled: boolean) => void;
  onNavigateLogin: () => void;
}

const SignupScreen: React.FC<SignupProps> = ({ onSignup, onNavigateLogin }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const [useCamera, setUseCamera] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function setupCamera() {
      if (!useCamera) {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraError(false);
      } catch (err) {
        setCameraError(true);
      }
    }
    setupCamera();
    return () => streamRef.current?.getTracks().forEach(track => track.stop());
  }, [useCamera]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim() && email.trim() && password.trim()) {
      setLoading(true);
      setError('');
      try {
        const data = await auth.signup(username, email, password);
        // data contains { _id, username, email, token }
        // Pass the whole user object or necessary parts
        onSignup(data, useCamera && !cameraError);
      } catch (err: any) {
        console.error("Signup failed", err);
        setError(err.response?.data?.message || "Signup failed. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#020617] overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900/60 border border-white/5 rounded-[3.5rem] shadow-3xl backdrop-blur-3xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Sign Up Fields (Left) */}
        <div className="flex-1 p-8 md:p-14 space-y-10 border-b md:border-b-0 md:border-r border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-sm italic shadow-lg">HX</div>
            <span className="font-black text-xl tracking-tighter text-white">HangoutX</span>
          </div>

          <div className="text-left">
            <h2 className="text-4xl font-black mb-3 tracking-tight text-white">Join the Vibe</h2>
            <p className="text-slate-500 font-medium italic">“Your vibe. Your room. Your people.”</p>
          </div>
          
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block">Full Name</label>
                <input 
                  type="text" placeholder="John Doe"
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-slate-800 text-white"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block">Email</label>
                <input 
                  type="email" placeholder="john@hangout.com"
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-slate-800 text-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block">Password</label>
              <input 
                type="password" placeholder="Create a secure password"
                className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-slate-800 text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/5 rounded-2xl">
              <div className="relative group shrink-0">
                <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white/10 bg-slate-800 flex items-center justify-center transition-all group-hover:border-indigo-500 shadow-lg">
                  {avatar ? <img src={avatar} className="w-full h-full object-cover" /> : <span className="text-xl">📸</span>}
                </div>
                <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleAvatarChange} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Profile Image</span>
                <span className="text-[9px] text-slate-500 font-bold uppercase mt-1">Tap to change</span>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading || !username.trim() || !email.trim() || !password.trim()}
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-3xl font-black text-lg transition-all shadow-2xl shadow-indigo-600/30 active:scale-95 border border-white/5 flex items-center justify-center"
            >
              {loading ? 'Creating Account...' : 'Start Hanging Out'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 font-medium pt-4">
            Already have an account? 
            <button onClick={onNavigateLogin} className="ml-2 text-indigo-400 font-black hover:underline underline-offset-4">Log in here</button>
          </p>
        </div>

        {/* Device Preview (Right) */}
        <div className="w-full md:w-80 p-10 bg-black/40 flex flex-col justify-center items-center">
          <div className="w-full space-y-6">
            <div className="text-center">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">HangoutX Camera</h3>
            </div>
            
            <div className="aspect-[4/5] w-full rounded-[2.5rem] bg-slate-950 border border-white/10 overflow-hidden relative shadow-inner group">
               {!useCamera ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-900/50">
                    <span className="text-4xl mb-3">🤐</span>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Ghost Mode</p>
                  </div>
               ) : cameraError ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-rose-950/20">
                   <span className="text-4xl mb-3">🚫</span>
                   <p className="text-xs font-black text-rose-400 uppercase tracking-widest">No Cam Access</p>
                 </div>
               ) : (
                 <video 
                   ref={videoRef} autoPlay playsInline muted 
                   className="w-full h-full object-cover mirror transform -scale-x-100 opacity-90 transition-opacity"
                 />
               )}
            </div>

            <div className="flex items-center justify-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={useCamera} onChange={(e) => setUseCamera(e.target.checked)} className="sr-only peer" />
                <div className="w-12 h-7 bg-slate-800 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                <span className="ml-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Join Live</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupScreen;
