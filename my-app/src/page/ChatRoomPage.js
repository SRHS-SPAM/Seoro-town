// src/page/ChatRoomPage.js (최종 전체 코드)

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
    const [productStatus, setProductStatus] = useState('selling');
    const socketRef = useRef(null);
    const messageBoxRef = useRef(null);

    useEffect(() => {
        const fetchMessages = async () => {
            if (!token) return;
            try {
                const response = await fetch(`/api/chat/${roomId}/messages`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (data.success) {
                    setMessages(data.messages);
                    setRoomInfo(data.roomInfo);
                    setProductStatus(data.productStatus);
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
            socket.emit('joinRoom', roomId);
        });

        socket.on('receiveMessage', (receivedMessage) => {
            setMessages(prevMessages => [...prevMessages, receivedMessage]);
        });

        return () => {
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
            message: newMessage.trim(),
            senderId: currentUser.id,
            senderName: currentUser.username,
            timestamp: new Date().toISOString()
        };
        
        socketRef.current.emit('sendMessage', messageData);
        setNewMessage('');
    };
    
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
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
                        <div key={index} className={`Message ${msg.senderId == currentUser.id ? 'sent' : 'received'}`}>
                            {msg.senderId != currentUser.id && <span className="SenderName">{msg.senderName}</span>}
                            <p>{msg.message}</p>
                            <span className="Timestamp">{new Date(msg.timestamp).toLocaleString('ko-KR')}</span>
                        </div>
                    ))}
                </div>
                
                {productStatus === 'sold' || productStatus === 'deleted' ? (
                    <div className="InputBox disabled">
                        <p>{productStatus === 'sold' ? '판매가 완료된 상품입니다.' : '삭제된 상품입니다.'}</p>
                    </div>
                ) : (
                    <form className="InputBox" onSubmit={handleSendMessage}>
                        <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="ChatInput"
                            placeholder="메시지를 입력하세요"
                            rows="1"
                        ></textarea>
                        <button 
                            type="submit" 
                            className="SendTextButton"
                            disabled={newMessage.trim() === ''}
                        >
                            보내기
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default ChatRoomPage;