import './Boardpage.css'; // 같은 스타일 사용
import { useContext, useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LoginComponent } from '../App.js';
import { ArrowLeft, MessageCircle, Heart, Share2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

function Boardinfo() {
    const { isLoggedIn, user } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [isLiked, setIsLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(0);
    const [viewCount, setViewCount] = useState(0);
    
    // URL에서 전달받은 게시글 데이터
    const post = location.state?.post;
    
    // useEffect를 조건부 리턴 이전에 위치시킨 후 디버깅 로그 추가
    useEffect(() => {
        if (!post) return;
        
        // 게시글 ID를 기반으로 고정된 값 생성 (시드값 사용)
        const postId = post.id || post.title?.length || 1;
        console.log('postId:', postId); // 디버깅용
        
        const fixedViewCount = 15 + (postId % 50);
        const fixedLikeCount = 3 + (postId % 15);
        
        console.log('계산된 조회수:', fixedViewCount); // 디버깅용
        console.log('계산된 좋아요:', fixedLikeCount); // 디버깅용
        
        setViewCount(fixedViewCount);
        setLikeCount(fixedLikeCount);
    }, [post]);
    
    // 게시글 데이터가 없으면 게시판으로 리다이렉트
    if (!post) {
        navigate('/');
        return null;
    }
    
    const handleBackClick = () => {
        navigate('/');
    };

    const handleLikeClick = () => {
        if (!isLoggedIn) {
            alert('로그인 후 이용해주세요!');
            return;
        }
        setIsLiked(!isLiked);
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
    };

    const handleShareClick = () => {
        if (navigator.share) {
            navigator.share({
                title: post.title,
                text: post.content.substring(0, 100) + '...',
                url: window.location.href
            });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('링크가 복사되었습니다!');
        }
    };

    // 안전한 데이터 접근을 위한 헬퍼 함수들
    const getAuthorName = () => {
        return post.authorName || post.author || '익명';
    };

    const getAuthorInitial = () => {
        const authorName = getAuthorName();
        return authorName.charAt(0).toUpperCase();
    };

    const getPostDate = () => {
        if (post.createdAt) {
            return new Date(post.createdAt).toLocaleDateString('ko-KR');
        }
        return post.date || '날짜 없음';
    };
    
    return (
        <div>
            {/* 인라인 스타일 추가 */}
            <style jsx>{`
                .PostActions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    padding: 16px 0;
                    border-top: 1px solid #eee;
                    margin-top: 20px;
                }
                
                .ActionButton {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 16px;
                    background: none;
                    border: none;
                    border-radius: 20px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    color: #666;
                    font-size: 14px;
                }
                
                .ActionButton:hover {
                    background-color: #f5f5f5;
                    color: #333;
                }
                
                .LikeButton.liked {
                    color: #ff4757;
                }
                
                .LikeButton:hover {
                    background-color: #fff5f5;
                    color: #ff4757;
                }
                
                .CommentButton:hover {
                    background-color: #f0f8ff;
                    color: #4a90e2;
                }
                
                .ShareButton:hover {
                    background-color: #f0f8f0;
                    color: #28a745;
                }
                
                .CommentInput {
                    width: 100%;
                    min-width: 600px;
                    padding: 12px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    resize: vertical;
                    font-family: inherit;
                    font-size: 14px;
                    line-height: 1.4;
                }
                
                .CommentInput:focus {
                    outline: none;
                    border-color: #4a90e2;
                    box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.1);
                }
                
                .CommentSubmitContainer {
                    display: flex;
                    justify-content: flex-end;
                    margin-top: 8px;
                }
                
                .CommentSubmitButton {
                    padding: 8px 20px;
                    background-color: #4a90e2;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: background-color 0.2s ease;
                }
                
                .CommentSubmitButton:hover {
                    background-color: #357abd;
                }
                
                .CommentWriteBox {
                    display: flex;
                    gap: 12px;
                    align-items: flex-start;
                }
                
                .CommentAuthorAvatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background-color: #4a90e2;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 16px;
                    flex-shrink: 0;
                }

                .BoardInfoContainer {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                }

                .BoardInfoHeader {
                    margin-bottom: 20px;
                }

                .BackButton {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 16px;
                    background: none;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    cursor: pointer;
                    color: #666;
                    font-size: 14px;
                    transition: all 0.2s ease;
                }

                .BackButton:hover {
                    background-color: #f5f5f5;
                    border-color: #bbb;
                }

                .PostDetailContainer {
                    background: white;
                    border: 1px solid #eee;
                    border-radius: 12px;
                    padding: 24px;
                    margin-bottom: 20px;
                }

                .PostDetailHeader {
                    border-bottom: 1px solid #eee;
                    padding-bottom: 20px;
                    margin-bottom: 24px;
                }

                .PostHeaderTop {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }

                .PostCategory {
                    background-color: #4a90e2;
                    color: white;
                    padding: 4px 12px;
                    border-radius: 16px;
                    font-size: 12px;
                    font-weight: 500;
                }

                .PostStats {
                    color: #666;
                    font-size: 14px;
                }

                .PostDetailTitle {
                    font-size: 24px;
                    font-weight: 600;
                    color: #333;
                    margin: 12px 0;
                    line-height: 1.4;
                }

                .PostDetailInfo {
                    margin-top: 16px;
                }

                .AuthorInfo {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .AuthorAvatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background-color: #4a90e2;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 16px;
                }

                .AuthorDetails {
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                }

                .PostDetailAuthor {
                    font-weight: 500;
                    color: #333;
                    font-size: 14px;
                }

                .PostDetailDate {
                    color: #666;
                    font-size: 12px;
                }

                .PostDetailContent {
                    font-size: 16px;
                    line-height: 1.6;
                    color: #333;
                    white-space: pre-wrap;
                    word-break: break-word;
                }

                .CommentsSection {
                    background: white;
                    border: 1px solid #eee;
                    border-radius: 12px;
                    padding: 24px;
                }

                .CommentsSectionHeader {
                    margin-bottom: 20px;
                    padding-bottom: 12px;
                    border-bottom: 1px solid #eee;
                }

                .CommentsSectionHeader h3 {
                    margin: 0;
                    font-size: 18px;
                    color: #333;
                }

                .CommentWrite {
                    margin-bottom: 24px;
                    padding-bottom: 20px;
                    border-bottom: 1px solid #eee;
                }

                .LoginRequired {
                    text-align: center;
                    padding: 40px 20px;
                    color: #666;
                    background-color: #f8f9fa;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }

                .EmptyComments {
                    text-align: center;
                    padding: 40px 20px;
                    color: #999;
                }

                .EmptyComments svg {
                    margin-bottom: 12px;
                    color: #ccc;
                }
            `}</style>
            
            <div className="NavBar">
                <div className="NavLeft">
                    <img src="RobotLogo.png" alt="로고" className="RobotLogo" />
                    <span className="BrandName">ROBOTOWN</span>
                </div>
        
                <div className="NavCenter">
                    <NavLink to="/" className={({isActive}) => isActive ? "NavItem active" : "NavItem"}>게시판</NavLink>
                    <NavLink to="/Schedule" className={({isActive}) => isActive ? "NavItem active" : "NavItem"}>시간표</NavLink>
                    <NavLink to="/Com"className={({ isActive }) => isActive ? "NavItem active" : "NavItem"}>가정통신문</NavLink>
                    <NavLink to="/Meal" className={({isActive}) => isActive ? "NavItem active" : "NavItem"}>급식</NavLink>
                    <NavLink to="/Club" className={({isActive}) => isActive ? "NavItem active" : "NavItem"}>동아리</NavLink>
                    <NavLink to="/Market" className={({isActive}) => isActive ? "NavItem active" : "NavItem"}>서로당근</NavLink>
                    <NavLink to="/Friends" className={({isActive}) => isActive ? "NavItem active" : "NavItem"}>친구</NavLink>
                </div>
                <LoginComponent />
            </div>
            
            <div className="BoardInfoContainer">
                <div className="BoardInfoHeader">
                    <button className="BackButton" onClick={handleBackClick}>
                        <ArrowLeft size={24} />
                        <span>뒤로가기</span>
                    </button>
                </div>
                
                <div className="PostDetailContainer">
                    <div className="PostDetailHeader">
                        <div className="PostHeaderTop">
                            <div className="PostCategory">{post.category || '일반'}</div>
                            <div className="PostStats">
                                <span className="ViewCount">조회 {viewCount}</span>
                            </div>
                        </div>
                        <h1 className="PostDetailTitle">{post.title || '제목 없음'}</h1>
                        <div className="PostDetailInfo">
                            <div className="AuthorInfo">
                                <div className="AuthorAvatar">
                                    {getAuthorInitial()}
                                </div>
                                <div className="AuthorDetails">
                                    <span className="PostDetailAuthor">{getAuthorName()}</span>
                                    <span className="PostDetailDate">{getPostDate()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="PostDetailContent">
                        <p>{post.content || '내용이 없습니다.'}</p>
                    </div>

                    <div className="PostActions">
                        <button 
                            className={`ActionButton LikeButton ${isLiked ? 'liked' : ''}`}
                            onClick={handleLikeClick}
                        >
                            <Heart size={20} fill={isLiked ? '#ff4757' : 'none'} />
                            <span>{likeCount}</span>
                        </button>
                        <button className="ActionButton CommentButton">
                            <MessageCircle size={20} />
                            <span>댓글</span>
                        </button>
                        <button className="ActionButton ShareButton" onClick={handleShareClick}>
                            <Share2 size={20} />
                            <span>공유</span>
                        </button>
                    </div>
                </div>

                {/* 댓글 섹션 */}
                <div className="CommentsSection">
                    <div className="CommentsSectionHeader">
                        <h3>댓글 0개</h3>
                    </div>
                    
                    {isLoggedIn ? (
                        <div className="CommentWrite">
                            <div className="CommentWriteBox">
                                <div className="CommentAuthorAvatar">
                                    {user?.username?.charAt(0)?.toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <textarea 
                                    className="CommentInput" 
                                    placeholder="댓글을 입력하세요..."
                                    rows="3"
                                />
                            </div>
                            <div className="CommentSubmitContainer">
                                <button className="CommentSubmitButton">등록</button>
                            </div>
                        </div>
                    ) : (
                        <div className="LoginRequired">
                            <p>댓글을 작성하려면 로그인해주세요.</p>
                        </div>
                    )}

                    <div className="CommentsList">
                        <div className="EmptyComments">
                            <MessageCircle size={32} />
                            <p>첫 번째 댓글을 작성해보세요!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Boardinfo;