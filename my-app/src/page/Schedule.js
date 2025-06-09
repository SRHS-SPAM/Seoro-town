import './Boardpage.css';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { LoginComponent } from '../App';

function Schedule() {
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
        <div className="PageContent">
            <h1>시간표</h1>
        </div>
        
        </div>
    )
}

export default Schedule;