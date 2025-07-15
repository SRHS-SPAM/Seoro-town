import './Boardpage.css';
import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PenLine, AlertCircle, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import Navbar from './Navbar';

const WritePopup = ({ isOpen, onClose, onSubmit }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState('재학생');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            alert('제목과 내용을 모두 입력해주세요.');
            return;
        }
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            await onSubmit({ category, title: title.trim(), content: content.trim() });
        } catch (error) {
            console.error('게시글 작성 중 오류:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (isSubmitting) return;
        setTitle('');
        setContent('');
        setCategory('재학생');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="PopupOverlay">
            <div className="WritePopup">
                <div className="PopupHeader">
                    <h2>게시글 작성</h2>
                    <button className="CloseButton" onClick={handleClose} disabled={isSubmitting}><X size={24} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="FormGroup">
                        <label>카테고리</label>
                        <select value={category} onChange={(e) => setCategory(e.target.value)} className="CategorySelect" disabled={isSubmitting}>
                            <option value="재학생">재학생</option>
                            <option value="졸업생">졸업생</option>
                        </select>
                    </div>
                    <div className="FormGroup">
                        <label>제목</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목을 입력하세요" className="TitleInput" required disabled={isSubmitting} />
                    </div>
                    <div className="FormGroup">
                        <label>내용</label>
                        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="내용을 입력하세요" className="ContentTextarea" required disabled={isSubmitting} />
                    </div>
                    <div className="FormActions">
                        <button type="button" className="CancelButton" onClick={handleClose} disabled={isSubmitting}>취소</button>
                        <button type="submit" className="SubmitButton" disabled={isSubmitting}>{isSubmitting ? '등록 중...' : '등록'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

function Boardpage() {
    const { isLoggedIn, user, token, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [isWritePopupOpen, setIsWritePopupOpen] = useState(false);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:3001/api/posts');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            if (data.success) {
                setPosts(data.posts || []);
            } else {
                setError(data.message || '게시글을 불러올 수 없습니다.');
            }
        } catch (error) {
            setError('서버와의 연결에 문제가 있습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddPost = async (postData) => {
        if (!isLoggedIn || !token) {
            alert('로그인이 필요합니다. 다시 로그인해주세요.');
            logout();
            return;
        }
        try {
            const response = await fetch('http://localhost:3001/api/posts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(postData)
            });
            const data = await response.json();
            if (data.success) {
                alert('게시글이 성공적으로 작성되었습니다!');
                setIsWritePopupOpen(false);
                await fetchPosts();
            } else {
                alert(data.message || '게시글 작성에 실패했습니다.');
            }
        } catch (error) {
            alert('서버 오류가 발생했습니다. 다시 시도해주세요.');
            throw error;
        }
    };

    const handleWriteButtonClick = () => {
        if (!isLoggedIn) {
            alert('로그인 후 이용해주세요!');
            return;
        }
        setIsWritePopupOpen(true);
    };

    const handlePostClick = (post) => {
        navigate(`/infoboard/${post.id}`);
    };
    
    const handleViewMoreClick = (category) => {
        navigate('/Boardarr', { state: { category } });
    };

    const renderPosts = (category) => {
        const isNew = (createdAt) => {
            const now = new Date();
            const postDate = new Date(createdAt);
            const diffMinutes = (now.getTime() - postDate.getTime()) / (1000 * 60);
            return diffMinutes < 5;//5분
        };

        if (loading) {
            return <div className="EmptyBoard"><p>로딩 중...</p></div>;
        }
        if (error) {
            return (
                <div className="EmptyBoard">
                    <AlertCircle size={32} /><p>{error}</p>
                    <button onClick={fetchPosts} style={{marginTop: '10px'}}>다시 시도</button>
                </div>
            );
        }
        
        const categoryPosts = posts.filter(post => (post.category || '재학생') === category);
        const recentPosts = categoryPosts.slice(0, 3);
        
        if (recentPosts.length === 0) {
            return <div className="EmptyBoard"><AlertCircle size={32} /><p>게시글이 없습니다</p></div>;
        }
        
        return (
            <div className="PostList">
                {recentPosts.map(post => (
                    <div key={post.id} className="PostItem" onClick={() => handlePostClick(post)}>
                        <div className="PostTitle">
                            <span>{post.title}</span>
                            {isNew(post.createdAt) && <span className="NewBadge">N</span>}
                        </div>
                        <div className="PostInfo">
                            <span className="PostAuthor">{post.authorName}</span>
                            <span className="PostDate">{new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
                        </div>
                    </div>
                ))}
            </div>
        );
    };
    
    return (
        <div>
            <Navbar />
            <div className="Title">
                <img src="/pngwing.com.png" alt="어서오고" className="ping" />
                서로타운에 오신 여러분들 환영합니다!
            </div>
            
            <div className="BoardContainer">
                <div className='NoticeBoard1'>
                    <div className="BoardTitleBox">
                        <h3 className="BoardTitle">재학생 게시글</h3>
                        <h5 className="ViewMore" onClick={() => handleViewMoreClick('재학생')}>더보기</h5>
                    </div>
                    {renderPosts('재학생')}
                </div>
                <div className='NoticeBoard2'>
                    <div className="BoardTitleBox">
                        <h3 className="BoardTitle">졸업생 게시글</h3>
                        <h5 className="ViewMore" onClick={() => handleViewMoreClick('졸업생')}>더보기</h5>
                    </div>
                    {renderPosts('졸업생')}
                </div>
            </div>
            
            <button 
                className={`FloatingWriteButton ${!isLoggedIn && 'disabled'}`}
                onClick={handleWriteButtonClick}
                title={!isLoggedIn ? "로그인 후 이용해주세요" : "게시글 작성"}
            >
                <PenLine size={24} />
            </button>
            
            <WritePopup 
                isOpen={isWritePopupOpen} 
                onClose={() => setIsWritePopupOpen(false)}
                onSubmit={handleAddPost}
            />
        </div>
    );
}

export default Boardpage;