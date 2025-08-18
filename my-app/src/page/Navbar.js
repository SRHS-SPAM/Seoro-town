import { NavLink } from 'react-router-dom';
import { LoginComponent } from '../App.js';
//네비게이션바 컴포넌트
function Navbar() {
    return (
        <div className="NavBar">
            <div className="NavLeft">
                <img src="/RobotLogo.png" alt="로고" className="RobotLogo" />
                <span className="BrandName">ROBOTOWN</span>
            </div>
            <div className="NavCenter">
                <NavLink to="/" className={({isActive}) => isActive ? "NavItem active" : "NavItem"}>게시판</NavLink>
                <NavLink to="/Schedule" className={({isActive}) => isActive ? "NavItem active" : "NavItem"}>시간표</NavLink>
                <NavLink to="/Com"className={({ isActive }) => isActive ? "NavItem active" : "NavItem"}>가정통신문</NavLink>
                <NavLink to="/Meal" className={({isActive}) => isActive ? "NavItem active" : "NavItem"}>급식</NavLink>
                <NavLink to="/Club" className={({isActive}) => isActive ? "NavItem active" : "NavItem"}>동아리</NavLink>
                <NavLink to="/Market" className={({isActive}) => isActive ? "NavItem active" : "NavItem"}>서로당근</NavLink>
                <NavLink to="/Guide" className={({isActive}) => isActive ? "NavItem active" : "NavItem"}>로봇가이드</NavLink>
                <NavLink to="/chats" className={({isActive}) => isActive ? "NavItem active" : "NavItem"}>채팅</NavLink>
            </div>
            <LoginComponent />
        </div>
    );
}

export default Navbar;