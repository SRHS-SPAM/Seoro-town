import './Boardpage.css'; // 페이지 명에 맞게 수정
import { useState, useContext } from 'react'; // useContext 추가
import { NavLink, useNavigate } from 'react-router-dom';
import { LoginComponent } from '../App.js';
import { Search, PenLine, AlertCircle, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

// 팝업 모달 컴포넌트
const WritePopup = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('재학생');

  const handleSubmit = (e) => {
    e.preventDefault();
    // 여기에 폼 제출 로직 구현
    console.log({ category, title, content });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="PopupOverlay">
      <div className="WritePopup">
        <div className="PopupHeader">
          <h2>게시글 작성</h2>
          <button className="CloseButton" onClick={onClose}>
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
            <button type="button" className="CancelButton" onClick={onClose}>취소</button>
            <button type="submit" className="SubmitButton">등록</button>
          </div>
        </form>
      </div>
    </div>
  );
};

function Boardpage() {
    // 팝업 상태 관리
    const [isWritePopupOpen, setIsWritePopupOpen] = useState(false);

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
        
                    <div className="EmptyBoard">
                        <AlertCircle size={32} />
                        <p>게시판을 찾을 수 없네요</p>
                    </div>
                </div>
                <div className='NoticeBoard2'>
                    <div className="BoardTitleBox">
                        <h3 className="BoardTitle">졸업생 게시글</h3>
                        <h5 className="ViewMore">더보기</h5>
                    </div>
                    
                    <div className="EmptyBoard">
                        <AlertCircle size={32} />
                        <p>게시판을 찾을 수 없네요</p>
                    </div>
                </div>
            </div>
            
            {/* 글쓰기 버튼 */}
            <button 
                className="FloatingWriteButton" 
                onClick={() => setIsWritePopupOpen(true)}
            >
                <PenLine size={24} />
            </button>
            
            {/* 글쓰기 팝업 모달 */}
            <WritePopup 
                isOpen={isWritePopupOpen} 
                onClose={() => setIsWritePopupOpen(false)} 
            />
        </div>
    );
}

export default Boardpage;