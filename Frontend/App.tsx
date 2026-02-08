import React, { useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { auth } from './services/api'; 
import { MediaMode, User, Room } from './types';
import LandingScreen from './screens/Landing';
import LoginScreen from './screens/Login';
import SignupScreen from './screens/Signup';
import CreateJoinScreen from './screens/CreateJoin';
import DashboardScreen from './screens/Dashboard';
import MusicRoom from './screens/MusicRoom';
import MovieRoom from './screens/MovieRoom';
import ChatRoom from './screens/ChatRoom';
import VotingRoom from './screens/VotingRoom';
import LudoRoom from './screens/LudoRoom';
import ChessRoom from './screens/ChessRoom';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const navigate = useNavigate();

  const handleStart = () => navigate('/login');
  
  const handleAuthSuccess = (userData: any, cameraEnabled: boolean = true) => {
    // userData contains { _id, username, email, token }
    // Map to frontend User type
    const newUser: User = {
      id: userData._id || userData.id,
      username: userData.username,
      avatar: `https://picsum.photos/seed/${userData.username}/200`, // Default avatar for now as backend doesn't return one
      isHost: false, // will be set when creating a room
      isOnline: true,
      cameraEnabled
    };
    setUser(newUser);
    // Store token if needed (localStorage)
    if (userData.token) {
        localStorage.setItem('token', userData.token);
        localStorage.setItem('userId', userData._id || userData.id);
        localStorage.setItem('username', userData.username);
    }
    navigate('/join');
  };

  const handleCreateRoom = async (roomName: string, mode: MediaMode) => {
    if (!user) return;
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const roomData = await auth.createRoom(roomName, mode, token);
        // roomData: { _id, code, name, mode, hostId, participants }
        
        const newRoom: Room = {
          id: roomData._id,
          name: roomData.name,
          code: roomData.code,
          mode: roomData.mode as MediaMode,
          hostId: roomData.hostId
        };
        setUser({ ...user, isHost: true });
        setRoom(newRoom);
        
        // Navigate to mode-specific route
        const modeRoutes = {
          [MediaMode.MUSIC]: `/room/music/${roomData._id}`,
          [MediaMode.MOVIE]: `/room/movie/${roomData._id}`,
          [MediaMode.CHAT]: `/room/chat/${roomData._id}`,
          [MediaMode.VOTING]: `/room/voting/${roomData._id}`,
          [MediaMode.LUDO]: `/room/ludo/${roomData._id}`,
          [MediaMode.CHESS]: `/room/chess/${roomData._id}`,
        };
        navigate(modeRoutes[mode] || '/dashboard');
    } catch (err) {
        console.error("Create Room Failed", err);
        // Could handle error via toast notification
    }
  };

  const handleJoinRoom = async (code: string) => {
    if (!user) return;
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const roomData = await auth.joinRoom(code, token);
         const joinedRoom: Room = {
          id: roomData._id,
          name: roomData.name,
          code: roomData.code,
          mode: roomData.mode as MediaMode,
          hostId: roomData.hostId
        };
        setUser({ ...user, isHost: roomData.hostId === user.id });
        setRoom(joinedRoom);
        
        // Navigate to mode-specific route
        const modeRoutes = {
          [MediaMode.MUSIC]: `/room/music/${roomData._id}`,
          [MediaMode.MOVIE]: `/room/movie/${roomData._id}`,
          [MediaMode.CHAT]: `/room/chat/${roomData._id}`,
          [MediaMode.VOTING]: `/room/voting/${roomData._id}`,
          [MediaMode.LUDO]: `/room/ludo/${roomData._id}`,
          [MediaMode.CHESS]: `/room/chess/${roomData._id}`,
        };
        navigate(modeRoutes[joinedRoom.mode] || '/dashboard');
    } catch (err) {
        console.error("Join Room Failed", err);
        throw err; // Re-throw so CreateJoinScreen can display error
    }
  };

  const handleExitRoom = () => {
    setRoom(null);
    navigate('/join');
  };

  return (
    <div className="min-h-screen transition-colors duration-500">
      <Routes>
        <Route path="/" element={<LandingScreen onStart={handleStart} />} />
        <Route path="/login" element={<LoginScreen onLogin={handleAuthSuccess} onNavigateSignup={() => navigate('/signup')} />} />
        <Route path="/signup" element={<SignupScreen onSignup={handleAuthSuccess} onNavigateLogin={() => navigate('/login')} />} />
        <Route 
          path="/join" 
          element={
            user ? (
              <CreateJoinScreen 
                username={user.username} 
                onCreate={handleCreateRoom} 
                onJoin={handleJoinRoom} 
              />
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
        <Route 
          path="/dashboard" 
          element={
            user && room ? (
              <DashboardScreen 
                user={user} 
                room={room} 
                onExit={handleExitRoom} 
              />
            ) : (
              <Navigate to="/join" replace />
            )
          } 
        />
        <Route path="/room/music/:roomId" element={<MusicRoom />} />
        <Route path="/room/movie/:roomId" element={<MovieRoom />} />
        <Route path="/room/chat/:roomId" element={<ChatRoom />} />
        <Route path="/room/voting/:roomId" element={<VotingRoom />} />
        <Route path="/room/ludo/:roomId" element={<LudoRoom />} />
        <Route path="/room/chess/:roomId" element={<ChessRoom />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

export default App;
