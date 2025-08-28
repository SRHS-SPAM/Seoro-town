import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

import './ChatListPage.css';
import { MessageSquare, User } from 'lucide-react';

function ChatListPage() {
    const [chatRooms, setChatRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token, user: currentUser } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchChatRooms = async () => {
            setLoading(true);
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const response = await fetch('/api/chat', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) {
                    throw new Error(`서버 응답 오류: ${response.status}`);
                }
                const data = await response.json();
                if (data.success) {
                    setChatRooms(data.chatRooms || []);
                }
            } catch (error) {
                console.error("채팅 목록 로딩 실패:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchChatRooms();
    }, [token]);

    if (!currentUser) {
        return (
            <div>
                <div className="ChatListContainer" style={{ textAlign: 'center', paddingTop: '50px' }}>
                    <div className="LoginRequired" style={{ maxWidth: '400px', margin: '0 auto' }}>
                        <MessageSquare size={64} strokeWidth={1.5} />
                        <h2 style={{ marginTop: '20px', fontWeight: '600' }}>로그인이 필요합니다</h2>
                        <p style={{ color: '#666', lineHeight: '1.6' }}>
                            다른 사용자와의 대화 목록을 확인하고<br/>실시간으로 메시지를 주고받으려면 로그인해주세요.
                        </p>
                        <button 
                            onClick={() => navigate('/login')} 
                            style={{ 
                                marginTop: '20px', 
                                padding: '12px 24px', 
                                border: 'none', 
                                borderRadius: '8px', 
                                backgroundColor: '#FF0000', 
                                color: 'white', 
                                cursor: 'pointer',
                                fontSize: '16px',
                                fontWeight: '500'
                            }}
                        >
                            로그인 페이지로
                        </button>
                    </div>
                </div>
            </div>
        );
    }
    
    if (loading) {
        return (
            <div className="ChatListContainer">
                 <div className="ChatListHeader">
                    <h1><MessageSquare size={32} /> 내 채팅 목록</h1>
                </div>
                <p>채팅 목록을 불러오는 중...</p>
            </div>
        );
    }

    return (
        <div>
            <div className="ChatListContainer">
                <div className="ChatListHeader">
                    <h1><MessageSquare size={32} /> 내 채팅 목록</h1>
                </div>
                <div className="ChatRoomList">
                    {chatRooms.length > 0 ? chatRooms.map(room => {
                        const opponent = room.participants.find(p => p._id !== currentUser._id);
                        
                        return (
                            <div key={room.id} className="ChatRoomItem" onClick={() => navigate(`/chat/${room.id}`)}>
                                <div className="OpponentAvatar">
                                    {opponent?.profileImage ? (
                                        <img src={`${process.env.REACT_APP_API_URL}${opponent.profileImage}`} alt={opponent.username} />
                                    ) : <User size={32} />}
                                </div>
                                <div className="ChatRoomInfo">
                                    <div className="ChatRoomTop">
                                        <span className="OpponentName">{opponent?.username || '(알 수 없음)'}</span>
                                        <div> </div>
                                        <span className="ChatRoomDate">{new Date(room.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="LastMessage">
                                        {room.lastMessage ? room.lastMessage.message : '대화를 시작해보세요.'}
                                    </p>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="EmptyChatList">
                            <p>진행 중인 대화가 없습니다.</p>
                            <span>상품 상세 페이지에서 판매자에게 대화를 시작해보세요!</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ChatListPage;