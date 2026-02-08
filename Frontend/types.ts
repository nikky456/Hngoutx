
export enum AppView {
  LANDING = 'LANDING',
  LOGIN = 'LOGIN',
  SIGNUP = 'SIGNUP',
  CREATE_JOIN = 'CREATE_JOIN',
  DASHBOARD = 'DASHBOARD'
}

export enum MediaMode {
  MUSIC = 'MUSIC',
  MOVIE = 'MOVIE',
  LUDO = 'LUDO',
  CHESS = 'CHESS',
  CHAT = 'CHAT',
  VOTING = 'VOTING'
}

export interface User {
  id: string;
  username: string;
  avatar?: string;
  isHost: boolean;
  isOnline: boolean;
  cameraEnabled?: boolean;
}

export interface Message {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: Date;
}

export interface Room {
  id: string;
  name: string;
  code: string;
  mode: MediaMode;
  hostId: string;
}

export interface FloatingReaction {
  id: number;
  emoji: string;
  left: number;
}
