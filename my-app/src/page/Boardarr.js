// src/page/Boardarr.js (최신순 정렬 최종 전체 코드)

import './Boardarr.css';
import { useState, useContext, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';

import { Search, PenLine, AlertCircle, ArrowLeft } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

function Boardarr() {
    const { isLoggedIn, user, token } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    
    const category = location.state?.category || '재학생';
    
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // 텍스트 길이 제한 헬퍼 함수
    const truncateText = (text, maxLength) => {
        if (!text) return '';
        if (text.length > maxLength) {
            return text.substring(0, maxLength) + '...';
        }
        return text;
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/posts`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success) {
                // 백엔드에서 이미 최신순으로 정렬되어 오므로 그대로 사용
                setPosts(data.posts || []);
                console.log('게시글 목록 불러오기 성공:', data.posts?.length || 0, '개');
            } else {
                console.error('게시글 불러오기 실패:', data.message);
                setError(data.message || '게시글을 불러올 수 없습니다.');
            }
        } catch (error) {
            console.error('게시글 불러오기 오류:', error);
            setError('서버와의 연결에 문제가 있습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handlePostClick = (post) => {
        navigate(`/infoboard/${post.id}`);
    };
    const handleBackClick = () => {
        navigate('/');
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredPosts = posts.filter(post => {
        const postCategory = post.category || '재학생';
        const matchesCategory = postCategory === category;
        const matchesSearch = searchTerm === '' || 
            (post.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (post.content || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (post.author || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesCategory && matchesSearch;
    });

    const renderAllPosts = () => {
        const isNew = (createdAt) => {
            const now = new Date();
            const postDate = new Date(createdAt);
            const diffMinutes = (now.getTime() - postDate.getTime()) / (1000 * 60);
            return diffMinutes < 5; // 5분
        };

        if (loading) {
            return (
                <div className="EmptyBoard">
                    <p>로딩 중...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="EmptyBoard">
                    <AlertCircle size={32} />
                    <p>{error}</p>
                    <button onClick={fetchPosts} style={{marginTop: '10px'}}>
                        다시 시도
                    </button>
                </div>
            );
        }
        
        if (filteredPosts.length === 0) {
            return (
                <div className="EmptyBoard">
                    <AlertCircle size={32} />
                    <p>{searchTerm ? '검색 결과가 없습니다' : '게시글이 없습니다'}</p>
                </div>
            );
        }
        
        return (
            <div className="AllPostsList">
                {/* ✨✨✨ reverse() 메서드 제거하여 최신순 유지 ✨✨✨ */}
                {filteredPosts.map(post => ( 
                    <div key={post.id} className="AllPostItem" onClick={() => handlePostClick(post)}>
                        <div className="PostContentWrapper">
                            <div className="PostTitle">
                                <span>{truncateText(post.title, 25)}</span> 
                            </div>
                            {isNew(post.createdAt) && <span className="NewBadge">N</span>}
                        </div>
                        <div className="PostInfo">
                            <span className="PostAuthor">작성자: {post.userId.username}</span>
                            <span className="PostDate">{new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };
    
    return (
        <div>
            
            <div className="BoardArrHeader">
                <button className="BackButton" onClick={handleBackClick}>
                    <ArrowLeft size={24} />
                    <span>돌아가기</span>
                </button>
                <h2 className="BoardArrTitle">{category} 게시글 </h2>
            </div>

            <div className="SearchContainer">
                <div className="SearchBox">
                    <div className="SearchPrefix">{category} 게시글</div>
                    <div className="SearchDivider"></div>
                    <input 
                        type="text" 
                        className="SearchInput" 
                        placeholder="검색어를 입력하세요!" 
                        value={searchTerm}
                        onChange={handleSearch}
                    />
                    <button className="SearchButton">
                        <Search size={22} />
                    </button>
                </div>
            </div>
            
            <div className="BoardArrContainer">
                <div className="BoardArrContent">
                    <div className="PostCount">
                        총 {filteredPosts.length}개의 게시글
                    </div>
                    {renderAllPosts()}
                </div>
            </div>
        </div>
    );
}

export default Boardarr;