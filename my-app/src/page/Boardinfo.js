import './Boardinfo.css'; // 같은 스타일 사용
import { useContext, useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LoginComponent } from '../App.js';
import { ArrowLeft, MessageCircle, Share2, Trash2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

function Boardinfo() {
    const { isLoggedIn, user } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    
    // URL에서 전달받은 게시글 데이터
    const post = location.state?.post;
    
    // 관리자 권한 확인 함수
    const isAdmin = () => {
        return user?.username === '관리자' || user?.email === 'DBADMIN@dba.com';
    };

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

    // 현재 사용자가 게시글 작성자인지 확인하는 함수 수정
    const isAuthor = () => {
        console.log('=== 작성자 확인 ===');
        console.log('현재 사용자:', user);
        console.log('게시글 정보:', {
            id: post.id,
            author: post.author,
            authorName: post.authorName,
            authorId: post.authorId
        });
        
        // 여러 조건으로 작성자 확인
        const isUserAuthor = 
            (user?.id && post.authorId && user.id === post.authorId) ||           // ID로 비교
            (user?.username && post.authorName && user.username === post.authorName) || // username과 authorName 비교
            (user?.name && post.authorName && user.name === post.authorName) ||    // name과 authorName 비교
            (user?.username && post.author && user.username === post.author) ||    // username과 author 비교
            (user?.name && post.author && user.name === post.author);             // name과 author 비교
        
        console.log('작성자 여부:', isUserAuthor);
        console.log('=== 작성자 확인 완료 ===');
        
        return isUserAuthor;
    };

    // 삭제 권한 확인 함수 (작성자 또는 관리자)
    const canDelete = () => {
        return isAuthor() || isAdmin();
    };

    // 게시글 삭제 함수
    const handleDeleteClick = async () => {
        console.log('=== 삭제 버튼 클릭 ===');
        
        if (!isLoggedIn) {
            alert('로그인 후 이용해주세요.');
            return;
        }

        // 삭제 권한 확인 (작성자 또는 관리자)
        if (!canDelete()) {
            alert('본인이 작성한 게시글만 삭제할 수 있습니다.');
            return;
        }

        // 관리자의 경우 다른 사용자 게시글 삭제 시 추가 확인
        if (isAdmin() && !isAuthor()) {
            const isConfirmed = window.confirm(
                `관리자 권한으로 다른 사용자의 게시글을 삭제하시겠습니까?\n\n` +
                `작성자: ${post.authorName || post.author || '익명'}\n` +
                `제목: ${post.title}\n\n` +
                `이 작업은 되돌릴 수 없습니다.`
            );
            
            if (!isConfirmed) {
                return;
            }
        } else {
            // 일반 사용자의 본인 게시글 삭제 확인
            const isConfirmed = window.confirm('정말로 이 게시글을 삭제하시겠습니까?');
            
            if (!isConfirmed) {
                return;
            }
        }

        setIsDeleting(true);

        try {
            const token = localStorage.getItem('token');
            const deleteUrl = `http://localhost:3001/api/posts/${post.id}`;
            
            console.log('삭제 요청 URL:', deleteUrl);
            console.log('삭제 요청 - 게시글 ID:', post.id, '타입:', typeof post.id);
            console.log('사용 중인 토큰:', token ? '토큰 존재' : '토큰 없음');
            console.log('삭제 권한:', isAdmin() ? '관리자' : '작성자');
            
            const response = await fetch(deleteUrl, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('응답 상태:', response.status);
            console.log('응답 상태 텍스트:', response.statusText);

            const responseText = await response.text();
            console.log('응답 텍스트:', responseText);

            let data;
            try {
                data = JSON.parse(responseText);
            } catch (parseError) {
                console.error('JSON 파싱 오류:', parseError);
                console.error('받은 응답:', responseText);
                alert('서버 응답을 처리할 수 없습니다.');
                return;
            }

            console.log('삭제 응답:', data);

            if (response.ok && data.success) {
                alert('게시글이 삭제되었습니다.');
                navigate('/');
            } else {
                alert(data.message || '게시글 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('게시글 삭제 오류:', error);
            console.error('오류 상세:', {
                name: error.name,
                message: error.message,
                stack: error.stack
            });
            alert('게시글 삭제 중 오류가 발생했습니다.');
        } finally {
            setIsDeleting(false);
        }
    };

    // 공유 버튼
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
                    <NavLink to="/Mypage" className={({ isActive }) => isActive ? "NavItem active" : "NavItem"}>마이페이지</NavLink>
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
                            {/* 관리자 표시 추가 */}
                            {isAdmin() && (
                                <div className="AdminBadge" style={{
                                    background: '#ff4444',
                                    color: 'white',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    marginLeft: '8px'
                                }}>
                                    관리자
                                </div>
                            )}
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
                        {/* 로그인된 사용자이고 (게시글 작성자 또는 관리자)인 경우에만 삭제 버튼 표시 */}
                        {isLoggedIn && canDelete() && (
                            <button 
                                className="ActionButton DeleteButton" 
                                onClick={handleDeleteClick}
                                disabled={isDeleting}
                                style={{
                                    backgroundColor: isAdmin() && !isAuthor() ? '#ff6b6b' : undefined
                                }}
                            >
                                <Trash2 size={20} />
                                <span>
                                    {isDeleting ? '삭제 중...' : 
                                     (isAdmin() && !isAuthor() ? '관리자 삭제' : '삭제')}
                                </span>
                            </button>
                        )}
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
                                    placeholder="댓글은 신중히 작성해주세요.. 삭제기능은 존재하지않습니다."
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