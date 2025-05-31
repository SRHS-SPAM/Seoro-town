import './Boardpage.css'; // 페이지 명에 맞게 수정
import { useState, useContext } from 'react';
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
    const { isLoggedIn, user } = useContext(AuthContext);
    
    const [isWritePopupOpen, setIsWritePopupOpen] = useState(false);
    const [posts, setPosts] = useState({
      재학생: [],
      졸업생: []
    });
    const handleAddPost = (postData) => {
        const newPost = {
            id: Date.now(),
            title: postData.title,
            content: postData.content,
            author: user?.name || '익명',
            date: new Date().toLocaleDateString('ko-KR')
        };
        
        setPosts(prevPosts => ({
            ...prevPosts,
            [postData.category]: [...prevPosts[postData.category], newPost]
        }));
    };

    const handleWriteButtonClick = () => {
        if (!isLoggedIn) {
            alert('로그인 후 이용해주세요!');
            return;
        }
        setIsWritePopupOpen(true);
    };

    const renderPosts = (category) => {
        const categoryPosts = posts[category];
        
        if (categoryPosts.length === 0) {
            return (
                <div className="EmptyBoard">
                    <AlertCircle size={32} />
                    <p>게시판을 찾을 수 없네요</p>
                </div>
            );
        }
        
        return (
            <div className="PostList">
                {categoryPosts.slice(-3).reverse().map(post => (
                    <div key={post.id} className="PostItem">
                        <div className="PostTitle">{post.title}</div>
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
                    <NavLink to="/Notice"className={({ isActive }) => isActive ? "NavItem active" : "NavItem"}>가정통신문</NavLink>
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
            
            {isLoggedIn ? (
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