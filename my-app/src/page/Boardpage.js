import './Boardpage.css';
import { useState, useContext, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LoginComponent } from '../App.js';
import { Search, PenLine, AlertCircle, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const WritePopup = ({ isOpen, onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('재학생');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title.trim() && content.trim()) {
      onSubmit({ category, title: title.trim(), content: content.trim() });
      setTitle('');
      setContent('');
      setCategory('재학생');
      onClose();
    }
  };

  const handleClose = () => {
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
          <button className="CloseButton" onClick={handleClose}>
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="FormGroup">
            <label>카테고리</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className="CategorySelect"
            >
              <option value="재학생">재학생</option>
              <option value="졸업생">졸업생</option>
            </select>
          </div>
          
          <div className="FormGroup">
            <label>제목</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="제목을 입력하세요"
              className="TitleInput"
              required
            />
          </div>
          
          <div className="FormGroup">
            <label>내용</label>
            <textarea 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              placeholder="내용을 입력하세요"
              className="ContentTextarea"
              required
            />
          </div>
          
          <div className="FormActions">
            <button type="button" className="CancelButton" onClick={handleClose}>취소</button>
            <button type="submit" className="SubmitButton">등록</button>
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
    const [loading, setLoading] = useState(false);

    // 게시글 목록 불러오기
    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:3001/api/posts');
            const data = await response.json();
            
            if (data.success) {
                setPosts(data.posts);
                console.log('게시글 목록:', data.posts);
            } else {
                console.error('게시글 불러오기 실패:', data.message);
            }
        } catch (error) {
            console.error('게시글 불러오기 오류:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddPost = async (postData) => {
        try {
            console.log('전송할 데이터:', postData);
            console.log('현재 토큰:', token);
            console.log('로그인 상태:', isLoggedIn);
            console.log('사용자 정보:', user);
            
            // 토큰 검증
            if (!token) {
                alert('인증 토큰이 없습니다. 다시 로그인해주세요.');
                logout(); // 로그아웃 처리
                return;
            }

            // 로그인 상태 재확인
            if (!isLoggedIn) {
                alert('로그인이 필요합니다.');
                return;
            }

            const response = await fetch('http://localhost:3001/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: postData.title,
                    content: postData.content,
                    category: postData.category
                })
            });

            const data = await response.json();
            console.log('서버 응답:', data);
            
            if (response.status === 401 || response.status === 403) {
                // 토큰이 만료되었거나 유효하지 않음
                alert('인증이 만료되었습니다. 다시 로그인해주세요.');
                logout();
                return;
            }
            
            if (data.success) {
                await fetchPosts(); // 게시글 목록 새로고침
                alert('게시글이 작성되었습니다!');
            } else {
                alert(data.message || '게시글 작성에 실패했습니다.');
                console.error('게시글 작성 실패:', data);
            }
        } catch (error) {
            console.error('게시글 작성 오류:', error);
            alert('서버 오류가 발생했습니다.');
        }
    };

    const handleWriteButtonClick = () => {
        console.log('글쓰기 버튼 클릭 - 상태 확인:');
        console.log('isLoggedIn:', isLoggedIn);
        console.log('token:', token);
        console.log('user:', user);

        if (!isLoggedIn) {
            alert('로그인 후 이용해주세요!');
            return;
        }
        
        if (!token) {
            alert('인증 토큰이 없습니다. 다시 로그인해주세요.');
            logout(); // 상태 초기화
            return;
        }
        
        setIsWritePopupOpen(true);
    };

    const handlePostClick = (post) => {
        navigate('/infoboard', { state: { post } });
    };

    const renderPosts = (category) => {
        const categoryPosts = posts.filter(post => {
            const postCategory = post.category || '재학생';
            return postCategory === category;
        });
        
        console.log(`${category} 카테고리 게시글:`, categoryPosts);
        
        if (loading) {
            return (
                <div className="EmptyBoard">
                    <p>로딩 중...</p>
                </div>
            );
        }
        
        if (categoryPosts.length === 0) {
            return (
                <div className="EmptyBoard">
                    <AlertCircle size={32} />
                    <p>게시글이 없습니다</p>
                </div>
            );
        }
        
        return (
            <div className="PostList">
                {categoryPosts.slice(-3).reverse().map(post => (
                    <div 
                        key={post.id} 
                        className="PostItem"
                        onClick={() => handlePostClick(post)}
                    >
                        <div className="PostTitle">{post.title}</div>
                        <div className="PostInfo">
                            <span className="PostAuthor">{post.authorName}</span>
                            <span className="PostDate">{new Date(post.createdAt).toLocaleDateString('ko-KR')}</span>
                            <span className="PostStats">조회 {post.views || 0} · 좋아요 {post.likes || 0}</span>
                        </div>
                    </div>
                ))}
            </div>
        );
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
        
            <div className="Title">
                <img src="pngwing.com.png" alt="어서오고" className="ping" />
                서로타운에 오신 여러분들 환영합니다!
            </div>

            <div className="SearchContainer">
                <div className="SearchBox">
                    <div className="SearchPrefix">게시판</div>
                    <div className="SearchDivider"></div>
                    <input type="text" className="SearchInput" placeholder="검색어를 입력하세요!" />
                    <button className="SearchButton">
                        <Search size={22} />
                    </button>
                </div>
            </div>
            
            <div className="BoardContainer">
                <div className='NoticeBoard1'>
                    <div className="BoardTitleBox">
                        <h3 className="BoardTitle">재학생 게시글</h3>
                        <h5 className="ViewMore">더보기</h5>
                    </div>
                    {renderPosts('재학생')}
                </div>
                <div className='NoticeBoard2'>
                    <div className="BoardTitleBox">
                        <h3 className="BoardTitle">졸업생 게시글</h3>
                        <h5 className="ViewMore">더보기</h5>
                    </div>
                    {renderPosts('졸업생')}
                </div>
            </div>
            
            {isLoggedIn && token ? (
                <button 
                    className="FloatingWriteButton" 
                    onClick={handleWriteButtonClick}
                >
                    <PenLine size={24} />
                </button>
            ) : (
                <button 
                    className="FloatingWriteButton disabled" 
                    onClick={handleWriteButtonClick}
                    title="로그인 후 이용해주세요"
                >
                    <PenLine size={24} />
                </button>
            )}
            
            <WritePopup 
                isOpen={isWritePopupOpen} 
                onClose={() => setIsWritePopupOpen(false)}
                onSubmit={handleAddPost}
            />
        </div>
    );
}

export default Boardpage;