import React from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

//네비게이션바 컴포넌트
function Navbar() {
    const { isLoggedIn, logout, user } = React.useContext(AuthContext);

    return (
        <div className="NavBar">
            <NavLink to="/" className={() => "NavLeft"} style={{ textDecoration: 'none', color: 'black' }}>
                <img src="/RobotLogo.png" alt="로고" className="RobotLogo" />
                <span className="BrandName">SEOROTOWN</span>
            </NavLink>
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
            <div className="NavRight">
                {isLoggedIn ? (
                    <>
                        <NavLink to="/Mypage" className="NavItem">{user?.username || '사용자'} 님</NavLink>
                        <button className="NavItem" onClick={logout}>로그아웃</button>
                    </>
                ) : (
                    <>
                        <NavLink to="/Login" className="NavItem">로그인</NavLink>
                        <NavLink to="/Signup" className="NavItem">회원가입</NavLink>
                    </>
                )}
            </div>
        </div>
    );
}

export default Navbar;