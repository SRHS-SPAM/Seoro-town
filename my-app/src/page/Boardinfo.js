import './Boardinfo.css'; // 같은 스타일 사용
import { useContext, useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LoginComponent } from '../App.js';
import { ArrowLeft, MessageCircle, Share2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

function Boardinfo() {
    const { isLoggedIn, user } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // URL에서 전달받은 게시글 데이터
    const post = location.state?.post;
    
    // 댓글 불러오기
    useEffect(() => {
        if (post?.id) {
            loadComments();
        }
    }, [post?.id]);
    
    if (!post) {
        navigate('/');
        return null;
    }
    
    const handleBackClick = () => {
        navigate('/');
    };

    // 댓글 불러오기 함수
    const loadComments = async () => {
        try {
            const response = await fetch(`http://localhost:3001/api/posts/${post.id}/comments`);
            const data = await response.json();
            
            if (data.success) {
                setComments(data.comments);
            } else {
                console.error('댓글 불러오기 실패:', data.message);
            }
        } catch (error) {
            console.error('댓글 불러오기 오류:', error);
        }
    };

    // 댓글 등록 함수
    const handleCommentSubmit = async () => {
        if (!newComment.trim()) {
            alert('댓글 내용을 입력해주세요.');
            return;
        }

        if (!isLoggedIn) {
            alert('로그인 후 이용해주세요.');
            return;
        }

        setIsSubmitting(true);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:3001/api/posts/${post.id}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    content: newComment.trim()
                })
            });

            const data = await response.json();

            if (data.success) {
                setNewComment('');
                await loadComments(); // 댓글 목록 새로고침
                alert('댓글이 등록되었습니다.');
            } else {
                alert(data.message || '댓글 등록에 실패했습니다.');
            }
        } catch (error) {
            console.error('댓글 등록 오류:', error);
            alert('댓글 등록 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
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
                        <button className="ActionButton ShareButton" onClick={handleShareClick}>
                            <Share2 size={20} />
                            <span>공유</span>
                        </button>
                    </div>
                </div>

                <div className="CommentsSection">
                    <div className="CommentsSectionHeader">
                        <h3>댓글 {comments.length}개</h3>
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
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                />
                            </div>
                            <div className="CommentSubmitContainer">
                                <button 
                                    className="CommentSubmitButton"
                                    onClick={handleCommentSubmit}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? '등록 중...' : '등록'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="LoginRequired">
                            <p>댓글을 작성하려면 로그인해주세요.</p>
                        </div>
                    )}

                    <div className="CommentsList">
                        {comments.length > 0 ? (
                            comments.map((comment) => (
                                <div key={comment.id} className="CommentItem">
                                    <div className="CommentHeader">
                                        <div className="CommentAuthorAvatar">
                                            {comment.authorName?.charAt(0)?.toUpperCase() || 'A'}
                                        </div>
                                        <div className="CommentInfo">
                                            <span className="CommentAuthor">{comment.authorName}</span>
                                            <span className="CommentDate">
                                                {new Date(comment.createdAt).toLocaleDateString('ko-KR', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="CommentContent">
                                        {comment.content}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="EmptyComments">
                                <MessageCircle size={32} />
                                <p>첫 번째 댓글을 작성해보세요!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>  
        </div>
    );
}

export default Boardinfo;