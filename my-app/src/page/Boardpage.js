import './Boardpage.css'; // 페이지 명에 맞게 수정
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { LoginComponent } from '../App'; // App.js에서 LoginComponent 가져오기
import { Search } from 'lucide-react'; // Lucide 아이콘 추가

function Boardpage() {
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
            
            <div className="Title">{/* 대가리 */}
                <img src="pngwing.com.png" alt="어서오고" className="ping" />
                서로타운에 오신 여러분들 환영합니다!
            </div>
            
            <div className="SearchContainer">{/* 검색창 */}
                <div className="SearchBox">
                    <div className="SearchPrefix">게시판</div>
                    <div className="SearchDivider"></div>
                    <input type="text" className="SearchInput" placeholder="검색어를 입력하세요!" />
                    <button className="SearchButton">
                        <Search size={22} />
                    </button>
                </div>
            </div>

            <div className="BoardContainer">{/* 게시판 내용 */}
                <div className='NoticeBoard1'>{/* 오른쪽 게시판 */}

                </div>
                <div className='NoticeBoard2'> {/* 왼쪽 게시판 */}

                </div>
            </div>
        </div>
    )
}

export default Boardpage;