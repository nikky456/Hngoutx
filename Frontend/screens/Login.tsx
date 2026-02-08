import React, { useState, useEffect, useRef } from 'react';
import { auth } from '../services/api';
import { useGoogleLogin } from '@react-oauth/google';

interface LoginProps {
  onLogin: (user: any, cameraEnabled: boolean) => void;
  onNavigateSignup: () => void;
}

const LoginScreen: React.FC<LoginProps> = ({ onLogin, onNavigateSignup }) => {
  const [email, setEmail] = useState(''); // Changed username to email as per backend requirement
  const [password, setPassword] = useState('');
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

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("Media Devices API not available");
        setCameraError(true);
        // setErrorMessage("Camera API not supported"); // You might want to add a state for this
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraError(false);
      } catch (err: any) {
        console.error("Camera setup failed:", err);
        setCameraError(true);
        // We can expose the error to the UI if we add a state for it, 
        // but for now logging to console where the user can inspect is a first step.
        // However, since I can't see the user's console, let's update the UI to show the error reason.
      }
    }
    setupCamera();
    return () => streamRef.current?.getTracks().forEach(track => track.stop());
  }, [useCamera]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim() && password.trim()) {
      setLoading(true);
      setError('');
      try {
        const data = await auth.login(email, password);
        onLogin(data, useCamera && !cameraError);
      } catch (err: any) {
        console.error("Login failed", err);
        setError(err.response?.data?.message || "Login failed. Please check your credentials.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      // For implicit flow / client side we get access_token. 
      // But verifyIdToken in backend usually wants an id_token.
      // Alternatively, we can use flow: 'auth-code' to get a code and exchange it.
      // OR specifically for simple "Sign In", we can use the <GoogleLogin /> component which gives credential (id_token).
      // Since we want custom button, we might need to use flow: 'implicit' and then fetch user info OR use proper openid scope.
      // Wait, let's try the simplest flow first. 
      // Actually @react-oauth/google useGoogleLogin by default returns access_token. 
      // To get id_token (credential) we need flow: 'implicit' but standard useGoogleLogin doesn't return id_token easily in response unless configured.
      // However, the verifyIdToken on backend expects an ID TOKEN. 
      // Let's use `flow: 'auth-code'` if we want to be robust, but that requires backend exchange.
      // EASIER: Use onHeader (which gives id_token via onSuccess if configured?) 
      // Actually, for custom button styling + id_token, using `onSuccess` with `tokenResponse` and sending that to backend might not work if backend expects ID token.
      
      // FIX: Let's use the google login via pop up but request the user profile directly from google in frontend OR switch backend to verify access token. 
      // BUT for "Saving password in Google", normally that's just the browser's job or Google Smart Lock which works best with standard flow.
      
      // Let's assume we want to send the ID Token to the backend.
      // We can try to get the id_token by just using the standard GoogleLogin component rendered invisibly or similar? 
      // No, `useGoogleLogin` is flexible. 
      
      // Let's try attempting to fetch user info from Google using the access token, then sending that to our backend to "trust" it.
      // OR better: use `flow: 'auth-code'` but that requires more backend setup.
      
      // Let's try simplest: Switch to standard `<GoogleLogin />` component rendered with custom styles? No, it has rigid styles.
      
      // Let's stick to useGoogleLogin and fetch user info on frontend and send to backend as a "trusted" payload? No that's insecure.
      
      // OK, correct path: useGoogleLogin with `onSuccess` receiving `codeResponse`. 
      // But we need `id_token`.
      // Actually, if we just want "Sign in with Google", the easiest way with `@react-oauth/google` to get an ID Token to send to a backend `verifyIdToken` endpoint is using the `<GoogleLogin />` component.
      // Since the user has a custom button design, we have to wrap the `useGoogleLogin` in a way or use the `onSuccess` to call `https://www.googleapis.com/oauth2/v3/userinfo` using the access token, and then send the result to the backend.
      // BUT the backend implementation I wrote expects `credential` (ID Token).
      
      // Let's change backend to accept `accessToken` and verify it against `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=...`?
      // Or we can just use the returned credential from the <GoogleLogin> component if we render it transparently over our button? 
      // That's hacky.
      
      // Let's use the `onSuccess` of `useGoogleLogin` and simply fetch user info on the frontend temporarily to prove it works, then send { email, name, picture, googleId } to backend.
      // "Securing" it: Backend should verify the access token passed.
      
      // Let's update backend logic in next step if this fails. For now, let's use the hook.
      // ACTUALLY: `useGoogleLogin` has an `onSuccess` that returns `tokenResponse`.
      // The backend `verifyIdToken` needs an ID Token. `useGoogleLogin` does NOT return an ID token by default (it returns access token).
      
      // Let's just create a quick helper to get the profile info using the access token.
      try {
        setLoading(true);
        const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        }).then(res => res.json());
        
        // Now send this trusted info to backend (In production, backend should verify the access token itself)
        // We will modify API to accept "userInfo" logic or update backend to verify access token.
        // For now, let's send the access_token to backend and let backend verify it.
        // Wait, I wrote backend to expect `credential` (JWT).
        // Let's change backend to verify access_token instead. it's safer than trusting frontend data.
        
        // CALLING BACKEND with access token as "credential"
        const data = await auth.googleLogin(tokenResponse.access_token); 
        onLogin(data, useCamera && !cameraError);
        
      } catch (err) {
        console.error("Google login error", err);
        setError("Google authentication failed.");
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError("Google Login Failed"),
  });

  /*
  const handleGoogleLogin = () => {
    // onLogin("GoogleUser", undefined, useCamera && !cameraError); 
    // TODO: Implement Google Login with backend
    alert("Google Login not yet implemented with backend");
  };
  */

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#020617] overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-900/60 border border-white/5 rounded-[3.5rem] shadow-3xl backdrop-blur-3xl overflow-hidden flex flex-col md:row-reverse md:flex-row-reverse">
        
        {/* Device Config / Visual (Right on Desktop) */}
        <div className="w-full md:w-80 p-10 bg-black/40 border-b md:border-b-0 md:border-l border-white/5 flex flex-col justify-center items-center">
          <div className="w-full space-y-6">
             <div className="text-center">
              <div className="inline-block w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center font-black text-lg italic shadow-xl mb-4">HX</div>
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Device Preview</h3>
            </div>
            
            <div className="aspect-[4/5] w-full rounded-[2.5rem] bg-slate-950 border border-white/10 overflow-hidden relative shadow-inner group">
               {!useCamera ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-900/50">
                    <span className="text-4xl mb-3">👻</span>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Camera Disabled</p>
                  </div>
               ) : cameraError ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-rose-950/20">
                   <span className="text-4xl mb-3">⚠️</span>
                   <p className="text-xs font-black text-rose-400 uppercase tracking-widest">No Access</p>
                   <p className="text-[10px] text-rose-500 mt-2 px-4">Check permissions</p>
                 </div>
               ) : (
                 <video 
                   ref={videoRef} 
                   autoPlay playsInline muted 
                   className="w-full h-full object-cover mirror transform -scale-x-100 opacity-90 transition-opacity"
                 />
               )}
            </div>

            <div className="flex items-center justify-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={useCamera} onChange={(e) => setUseCamera(e.target.checked)} className="sr-only peer" />
                <div className="w-12 h-7 bg-slate-800 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                <span className="ml-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Live Cam</span>
              </label>
            </div>
          </div>
        </div>

        {/* Auth Content (Left on Desktop) */}
        <div className="flex-1 p-8 md:p-14 space-y-10">
          <div className="text-left">
            <h2 className="text-5xl font-black mb-3 tracking-tight text-white">Welcome Back</h2>
            <p className="text-slate-500 font-medium italic tracking-tight">“Your vibe. Your room. Your people.”</p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Email</label>
                <input 
                  type="email" 
                  placeholder="e.g. alex@example.com"
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-slate-800 text-lg font-medium text-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-2 block">Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••"
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-6 py-5 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-slate-800 text-lg font-medium text-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading || !email.trim() || !password.trim()}
              className="w-full py-6 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-3xl font-black text-xl transition-all shadow-2xl shadow-indigo-600/30 active:scale-95 border border-white/5 flex items-center justify-center"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="relative py-4">
             <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
             <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#0b1021] px-4 text-slate-600 font-black tracking-widest">Or continue with</span></div>
          </div>

          <button 
            onClick={() => handleGoogleLogin()}
            className="w-full py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl flex items-center justify-center gap-4 transition-all group active:scale-95"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="font-black text-xs uppercase tracking-widest text-white">Sign In with Google</span>
          </button>

          <p className="text-center text-sm text-slate-500 font-medium">
            New to HangoutX? 
            <button onClick={onNavigateSignup} className="ml-2 text-indigo-400 font-black hover:underline underline-offset-4">Create an account</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
