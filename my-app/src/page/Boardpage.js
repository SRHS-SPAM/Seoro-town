import './Boardpage.css'; // 페이지 명에 맞게 수정
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { LoginComponent } from '../App'; // App.js에서 LoginComponent 가져오기

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
            
            <div className="Title"> {/* Navbar아래에 코드 작성하묜 됨ㅇㅇ */}
                <img src="pngwing.com.png" alt="어서오고" className="ping" />
                서로타운에 오신 여러분들 환영합니다!
            </div>
        </div>
    )
}

export default Boardpage; // 페이지명에 맞게 수정