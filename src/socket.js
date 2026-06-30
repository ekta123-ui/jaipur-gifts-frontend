import { io } from 'socket.io-client';

const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || apiBaseUrl.replace(/\/api\/?$/i, '') || 'http://localhost:5000';

class SocketService {
    constructor() {
        this.socket = null;
    }

    connect(userId) {
        if (this.socket?.connected) return;
        this.socket = io(SOCKET_URL, {
            auth: { token: localStorage.getItem('token') },
            query: { userId }
        });

        this.socket.on('connect_error', (err) => {
            console.error("Socket Connection Error:", err.message);
        });
    }

    joinAdminRoom() {
        if (!this.socket?.connected) {
            console.warn("Socket is not connected. Admin room join skipped.");
            return;
        }

        this.socket.emit('join_admin', { token: localStorage.getItem('token') });
    }

    sendMessage(messageData) {
        if (!this.socket?.connected) {
            console.warn("Socket is not connected. Message not sent.");
            return;
        }

        this.socket.emit('send_message', messageData);
    }

    onMessageReceived(callback) {
        if (!this.socket) {
            console.warn("Socket is not initialized. Message listener not registered.");
            return;
        }

        this.socket.on('receive_message', callback);
    }
}

export default new SocketService();
