import './Boardpage.css'; // 페이지 명에 맞게 수정
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
<<<<<<< HEAD
import { LoginComponent } from '../App.js';
=======
import Login from './Login';
import { LoginComponent } from '../App';

>>>>>>> b30f922dcacf40c818a525b7880470ca07b11de2
    function Boardpage() {
        return (
    <div>
        <div className="NavBar">
            <div className="NavLeft">
                <img src="RobotLogo.png" alt="로고" className="RobotLogo" />
                <span className="BrandName">ROBOTOWN</span>
            </div>
                    <centerbar className="NavCenter">
                        <NavLink to="/" className={({isActive}) => isActive ? "NavItem active" : "NavItem"}>게시판</NavLink>
                        <NavLink to="/Schedule" className={({isActive}) => isActive ? "NavItem active" : "NavItem"}>시간표</NavLink>
                        <NavLink to="/Com"className={({ isActive }) => isActive ? "NavItem active" : "NavItem"}>가정통신문</NavLink>
                        <NavLink to="/Meal" className={({isActive}) => isActive ? "NavItem active" : "NavItem"}>급식</NavLink>
                        <NavLink to="/Club" className={({isActive}) => isActive ? "NavItem active" : "NavItem"}>동아리</NavLink>
                        <NavLink to="/Market" className={({isActive}) => isActive ? "NavItem active" : "NavItem"}>서로당근</NavLink>
                        <NavLink to="/Friends" className={({isActive}) => isActive ? "NavItem active" : "NavItem"}>친구</NavLink>
                </centerbar>
<<<<<<< HEAD
                <LoginComponent />
=======
            <LoginComponent/>
>>>>>>> b30f922dcacf40c818a525b7880470ca07b11de2
        </div>
    </div>
        )
    }

    export default Boardpage; // 페이지명에 맞게 수정