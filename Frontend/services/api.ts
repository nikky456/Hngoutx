import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const auth = {
    signup: async (username: string, email: string, password: string) => {
        const response = await api.post('/auth/signup', { username, email, password });
        return response.data;
    },
    login: async (email: string, password: string) => {
        const response = await api.post('/auth/login', { email, password });
        return response.data;
    },
    googleLogin: async (credential: string) => {
        const response = await api.post('/auth/google', { credential });
        return response.data;
    },
    createRoom: async (name: string, mode: string, token: string) => {
        const response = await api.post('/rooms/create', { name, mode }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },
    joinRoom: async (code: string, token: string) => {
        const response = await api.post('/rooms/join', { code }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },
    getRoomDetails: async (roomId: string, token: string) => {
        const response = await api.get(`/rooms/${roomId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
};

