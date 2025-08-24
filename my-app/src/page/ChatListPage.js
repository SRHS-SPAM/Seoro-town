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
        console.log("채팅 목록 페이지: 현재 유저 정보", currentUser);
        console.log("채팅 목록 페이지: 현재 토큰", token);

        const fetchChatRooms = async () => {
            // 로딩 상태를 함수 안에서 관리하도록 변경
            setLoading(true);

            if (!token) {
                console.error("토큰이 없어서 API 요청을 중단합니다.");
                setLoading(false); // 토큰이 없어도 로딩 상태는 끝내줌
                return;
            }

            try {
                console.log("API 요청 시작: /api/chat");
                const response = await fetch('/api/chat', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                console.log("API 응답 받음:", response.status);
                if (!response.ok) {
                    throw new Error(`서버 응답 오류: ${response.status}`);
                }

                const data = await response.json();
                console.log("받은 데이터:", data);

                if (data.success) {
                    setChatRooms(data.chatRooms || []);
                }
            } catch (error) {
                console.error("채팅 목록 로딩 실패:", error);
            } finally {
                console.log("API 요청 종료, 로딩 상태 false로 변경");
                setLoading(false);
            }
        };

        fetchChatRooms();
    }, [token]);

    if (!currentUser) {
        // 로그인이 안된 상태의 UI
        return (
            <div>
                <div className="ChatListContainer">
                    <h1>로그인 필요</h1>
                    <p>채팅 목록을 보려면 로그인을 해주세요.</p>
                    <button onClick={() => navigate('/login')}>로그인 페이지로</button>
                </div>
            </div>
        );
    }
    
    if (loading) {
        return <div><p>채팅 목록을 불러오는 중...</p></div>;
    }

    return (
        <div>
            
            <div className="ChatListContainer">
                <div className="ChatListHeader">
                    <h1><MessageSquare size={32} /> 내 채팅 목록</h1>
                </div>
                <div className="ChatRoomList">
                    {chatRooms.length > 0 ? chatRooms.map(room => {
                        const opponent = room.participants.find(p => p.id !== currentUser.id);
                        
                        return (
                            <div key={room.id} className="ChatRoomItem" onClick={() => navigate(`/chat/${room.id}`)}>
                                <div className="OpponentAvatar">
                                    {opponent?.profileImage ? (
                                        <img src={`http://localhost:3001${opponent.profileImage}`} alt={opponent.username} />
                                    ) : <User size={24} />}
                                </div>
                                <div className="ChatRoomInfo">
                                    <div className="ChatRoomHeader">
                                        <span className="OpponentName">{opponent?.username || '(알 수 없음)'}</span>
                                        <span className="ChatRoomDate">{new Date(room.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <p className="LastMessage">
                                        {room.lastMessage ? room.lastMessage.message : '대화를 시작해보세요.'}
                                    </p>
                                </div>
                            </div>
                        );
                    }) : (
                        <p>진행 중인 대화가 없습니다.</p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ChatListPage;