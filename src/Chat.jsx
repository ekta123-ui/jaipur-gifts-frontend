import { useState, useEffect, useRef } from 'react';
import socketService from './socket';
import api from './api';

const Chat = ({ user }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (user && user.id) {
            // Establish real-time connection
            socketService.connect(user.id);

            // Fetch message history from the API
            api.get('/chat')
                .then(res => setMessages(res.data))
                .catch(err => console.error("Could not load history", err));

            // Listen for incoming messages in real-time
            socketService.onMessageReceived((newMessage) => {
                setMessages((prev) => [...prev, newMessage]);
            });
        }
    }, [user]);

    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const messageData = {
            sender: user.id,
            senderName: user.name,
            content: input,
            isAdmin: false
        };

        // Send via Socket for real-time delivery
        socketService.sendMessage(messageData);
        setInput('');
    };

    return (
        <div className="chat-window flex flex-col h-[500px] w-full max-w-md shadow-2xl">
            <div className="p-4 bg-maroon text-white font-display flex items-center justify-between">
                <div className="flex items-center">
                    <span className="status-indicator status-online"></span>
                    <span className="tracking-wide">Royal Jaipur Concierge</span>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col mandala-bg space-y-2 bg-ivory">
                {messages.map((msg, index) => (
                    <div key={index} className={`message-bubble ${msg.sender === user.id ? 'message-sent' : 'message-received'}`}>
                        <p className="text-[10px] opacity-70 font-bold uppercase tracking-tighter">{msg.senderName}</p>
                        <p className="leading-relaxed">{msg.content}</p>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gold/10 flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Inquire about a gift..."
                    className="flex-1 p-3 rounded-full border border-gold/20 focus:outline-none focus:border-saffron text-sm"
                />
                <button type="submit" className="bg-maroon text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-saffron transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                </button>
            </form>
        </div>
    );
};

export default Chat;
