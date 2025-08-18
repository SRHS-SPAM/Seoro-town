// src/page/ChatRoomPage.js (전체 코드 - 레이아웃 최종 수정)

import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Navbar from './Navbar';
import './ChatRoomPage.css';
import { Send, ArrowLeft } from 'lucide-react';
import { io } from 'socket.io-client';

function ChatRoomPage() {
    const { roomId } = useParams();
    const { user: currentUser, token } = useContext(AuthContext);
    const navigate = useNavigate();

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [roomInfo, setRoomInfo] = useState(null);
    const socketRef = useRef(null);
    const messageBoxRef = useRef(null);

    useEffect(() => {
        const fetchMessages = async () => {
            if (!token) return;
            try {
                const response = await fetch(`http://localhost:3001/api/chat/${roomId}/messages`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success) {
                    setMessages(data.messages);
                    setRoomInfo(data.roomInfo);
                } else {
                    alert(data.message);
                    navigate('/chats');
                }
            } catch (error) {
                console.error("메시지 로딩 실패:", error);
            }
        };
        fetchMessages();

        socketRef.current = io('http://localhost:3001');
        const socket = socketRef.current;

        socket.on('connect', () => {
            console.log('소켓 연결 성공:', socket.id);
            socket.emit('joinRoom', roomId);
        });

        socket.on('receiveMessage', (receivedMessage) => {
            setMessages(prevMessages => [...prevMessages, receivedMessage]);
        });

        return () => {
            console.log('소켓 연결 해제');
            socket.disconnect();
        };
    }, [roomId, token, navigate]);

    useEffect(() => {
        if (messageBoxRef.current) {
            messageBoxRef.current.scrollTop = messageBoxRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !socketRef.current || !currentUser) return;

        const messageData = {
            roomId: roomId,
            message: newMessage,
            senderId: currentUser.id,
            senderName: currentUser.username
        };
        
        socketRef.current.emit('sendMessage', messageData);
        setNewMessage('');
    };

    const opponent = roomInfo?.participants.find(p => p.id !== currentUser?.id);

return (
    <div>
        <Navbar />
        <div className="ChatRoomContainer">
            <div className="ChatRoomHeader">
                <button onClick={() => navigate('/chats')} className="BackButton"><ArrowLeft /></button>
                <div className="HeaderInfo">
                    <h3>{opponent?.username || '상대방'}</h3>
                    <p>{roomInfo?.productTitle}</p>
                </div>
            </div>
            <div className="MessageBox" ref={messageBoxRef}>
                {messages.map((msg, index) => (
                    <div key={index} className={`Message ${msg.senderId === currentUser?.id ? 'sent' : 'received'}`}>
                        {msg.senderId !== currentUser?.id && <span className="SenderName">{msg.senderName}</span>}
                        <p>{msg.message}</p>
                        <span className="Timestamp">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                ))}
            </div>
            {/* ✨ 이 form 구조가 정확한지 다시 한번 확인합니다. */}
            <form className="InputBox" onSubmit={handleSendMessage}>
                <input 
                    type="text" 
                    value={newMessage} 
                    style={{ flex: 1, minWidth: 0 }}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="메시지를 입력하세요"
                />
                <button type="submit"><Send /></button>
            </form>
        </div>
    </div>
);
}
export default ChatRoomPage;