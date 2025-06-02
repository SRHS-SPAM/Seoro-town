import './Boardpage.css';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
<<<<<<< HEAD
import { LoginComponent } from '../App.js';
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
                <NavLink to="/Com"className={({ isActive }) => isActive ? "NavItem active" : "NavItem"}>가정통신문</NavLink>
                <NavLink to="/Meal" className={({isActive}) => isActive ? "NavItem active" : "NavItem"}>급식</NavLink>
                <NavLink to="/Club" className={({isActive}) => isActive ? "NavItem active" : "NavItem"}>동아리</NavLink>
                <NavLink to="/Market" className={({isActive}) => isActive ? "NavItem active" : "NavItem"}>서로당근</NavLink>
                <NavLink to="/Friends" className={({isActive}) => isActive ? "NavItem active" : "NavItem"}>친구</NavLink>
            </div>
                <LoginComponent />
            </div>
=======
import { LoginComponent } from '../App';

function Schedule() {
    return (
        <div>
        <div className="NavBar">
        <div className="NavLeft">
            <img src="RobotLogo.png" alt="로고" className="RobotLogo" />
            <span className="BrandName">ROBOTOWN</span>
>>>>>>> b30f922dcacf40c818a525b7880470ca07b11de2
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
        
        {/* 게시판 페이지 내용 추가 */}
        <div className="PageContent">
            <h1>게시판</h1>
            {/* 여기에 게시판 내용 추가 */}
        </div>
        
        </div>
    )
}

export default Schedule;