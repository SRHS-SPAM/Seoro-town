import './Boardinfo.css';
import { useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Share2, Trash2, User } from 'lucide-react'; 
import { AuthContext } from '../context/AuthContext';


function Boardinfo() {
    const { isLoggedIn, user, token } = useContext(AuthContext);
    const navigate = useNavigate();
    const { id } = useParams();

    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const loadPostDetails = useCallback(async () => {
        if (!id) {
            console.error("게시글 ID가 URL에 없습니다.");
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/posts/${id}`);
            const data = await response.json();

            if (data.success && data.post) {
                setPost(data.post);
                setComments(data.post.comments || []);
            } else {
                console.error('게시글 정보 불러오기 실패:', data.message);
                setPost(null);
            }
        } catch (error) {
            console.error('게시글 로드 중 심각한 오류:', error);
            setPost(null);
        } finally {
            setIsLoading(false);
        }
    }, [id]);
    
    useEffect(() => {
        setIsLoading(true);
        loadPostDetails();
    }, [loadPostDetails]);

    if (isLoading) {
        return (
            <div>
                
                <div className="BoardInfoContainer" style={{ textAlign: 'center', paddingTop: '5rem' }}>로딩 중...</div>
            </div>
        );
    }
    
    if (!post) {
        return (
            <div>
                
                <div className="BoardInfoContainer" style={{ textAlign: 'center', paddingTop: '5rem' }}>
                    <h2>게시글을 찾을 수 없습니다.</h2>
                    <p>삭제되었거나 잘못된 경로입니다.</p>
                </div>
            </div>
        );
    }

    const isAdmin = () => user?.username === '관리자' || user?.email === 'DBADMIN@dba.com';
    const isAuthor = () => post && user?.id === post.userId._id;
    const canDelete = () => isAuthor() || isAdmin();
    const handleBackClick = () => navigate(-1);

    const goToUserProfile = (userId) => {
        if (!userId) return;
        
        if (!isLoggedIn) {
            alert('로그인 후 이용 가능한 서비스입니다.');
            return;
        }
        
        if (userId === user?.id) {
            navigate('/Mypage');
        } else {
            navigate('/Mypage', { state: { userId } });
        }
    };

    const handleCommentSubmit = async () => {
        if (!newComment.trim()) return alert('댓글 내용을 입력해주세요.');
        if (!isLoggedIn) return alert('로그인 후 이용해주세요.');
        setIsSubmitting(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/posts/${id}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ content: newComment.trim() })
            });
            const data = await response.json();
            if (data.success) {
                setNewComment('');
                await loadPostDetails();
            } else {
                alert(data.message || '댓글 등록에 실패했습니다.');
            }
        } catch (error) {
            alert('댓글 등록 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = async () => {
        if (!canDelete()) return alert("삭제 권한이 없습니다.");
        const confirmMessage = isAdmin() && !isAuthor() 
            ? `관리자 권한으로 다른 사용자의 게시글을 삭제하시겠습니까?`
            : '정말로 이 게시글을 삭제하시겠습니까?';
        if (!window.confirm(confirmMessage)) return;

        setIsDeleting(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/posts/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                alert('게시글이 삭제되었습니다.');
                navigate('/');
            } else {
                alert(data.message || '삭제에 실패했습니다.');
            }
        } catch (error) {
            alert('삭제 중 오류가 발생했습니다.');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleShareClick = () => {
        if (navigator.share) {
            navigator.share({ title: post.title, text: post.content.substring(0, 100) + '...', url: window.location.href });
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('링크가 복사되었습니다!');
        }
    };
    
    const getPostDate = () => new Date(post.createdAt).toLocaleDateString('ko-KR');
    const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?');
    return (
        <div>
            
            <div className="BoardInfoContainer">
                <div className="BoardInfoHeader">
                    <button className="BackButton" onClick={handleBackClick}><ArrowLeft size={24} /><span>뒤로가기</span></button>
                </div>
                
                <div className="PostDetailContainer">
                    <div className="PostDetailHeader">
                        <div className="PostHeaderTop"><div className="PostCategory">{post.category}</div></div>
                        <h1 className="PostDetailTitle">{post.title}</h1>
                        <div className="PostDetailInfo">
                            <div className="AuthorInfo" onClick={() => goToUserProfile(post.userId?.id)} style={{cursor: 'pointer'}}>
                                <div className="AuthorAvatar">
                                    {post.userId?.profileImage ? (
                                        <img src={`${process.env.REACT_APP_API_URL}${post.userId.profileImage}`} alt={post.userId.username} />
                                    ) : (
                                        <User size={24} />
                                    )}
                                </div>
                                <div className="AuthorDetails">
                                    <span className="PostDetailAuthor">{post.userId?.username || post.author}</span>
                                    <span className="PostDetailDate">{getPostDate()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="PostDetailContent"><p>{post.content}</p></div>

                    <div className="PostActions">
                        <button className="ActionButton ShareButton" onClick={handleShareClick}><Share2 size={20} /><span>공유</span></button>
                        {isLoggedIn && canDelete() && (
                            <button className="ActionButton DeleteButton" onClick={handleDeleteClick} disabled={isDeleting}>
                                <Trash2 size={20} />
                                <span>{isDeleting ? '삭제 중...' : '삭제'}</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="CommentsSection">
                    <div className="CommentsSectionHeader">
                        <h3>댓글 {comments.length}개</h3>
                    </div>
                    {isLoggedIn && (
                        <div className="CommentWrite">
                            <div className="CommentWriteBox">
                                <div className="CommentAuthorAvatar">
                                    {user?.profileImage ? (
                                        <img src={`${process.env.REACT_APP_API_URL}${user.profileImage}`} alt={user.username} />
                                    ) : (
                                        <User size={24} />
                                    )}
                                </div>
                                <textarea className="CommentInput" placeholder="댓글을 입력해주세요..." rows="3"
                                    value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                            </div>
                            <div className="CommentSubmitContainer">
                                <button className="CommentSubmitButton" onClick={handleCommentSubmit} disabled={isSubmitting}>
                                    {isSubmitting ? '등록 중...' : '등록'}
                                </button>
                            </div>
                        </div>
                    )}
                    <div className="CommentsList">
                        {comments.length > 0 ? comments.map((comment) => (
                            <div key={comment.id} className="CommentItem">
                                <div className="CommentHeader" onClick={() => goToUserProfile(comment.authorId)} style={{cursor: 'pointer'}}>
                                    <div className="CommentAuthorAvatar">
                                        {comment.authorProfileImage ? (
                                            <img src={`${process.env.REACT_APP_API_URL}${comment.authorProfileImage}`} alt={comment.authorName} />
                                        ) : (
                                            <User size={24} />
                                        )}
                                    </div>
                                    <div className="CommentInfo">
                                        <span className="CommentAuthor">{comment.authorName}</span>
                                        <span className="CommentDate">{new Date(comment.createdAt).toLocaleString('ko-KR')}</span>
                                    </div>
                                </div>
                                <div className="CommentContent">{comment.content}</div>
                            </div>
                        )) : (
                            <div className="EmptyComments"><MessageCircle size={32} /><p>첫 댓글을 작성해보세요!</p></div>
                        )}
                    </div>
                </div>
            </div>  
        </div>
    );
}

export default Boardinfo;