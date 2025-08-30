import React, { useState } from 'react';
import './Navbar.css'; // Import the new CSS file
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Menu, X } from 'lucide-react'; // Import icons for hamburger menu

//네비게이션바 컴포넌트
function Navbar() {
    const { isLoggedIn, logout, user } = React.useContext(AuthContext);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <div className="NavBar">
            <NavLink to="/" className={() => "NavLeft"} style={{ textDecoration: 'none', color: 'black' }}>
                <img src="/RobotLogo.png" alt="로고" className="RobotLogo" />
                <span className="BrandName">SEOROTOWN</span>
            </NavLink>

            {/* Hamburger Menu Toggle Button */}
            <button className="MobileMenuToggle" onClick={toggleMobileMenu}>
                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>

            {/* Mobile/Desktop Menu Container */}
            <div className={`NavMenuContainer ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                <div className="NavCenter">
                    <NavLink to="/" className={({isActive}) => isActive ? "NavItem active" : "NavItem"} onClick={() => setIsMobileMenuOpen(false)}>게시판</NavLink>
                    <NavLink to="/Schedule" className={({isActive}) => isActive ? "NavItem active" : "NavItem"} onClick={() => setIsMobileMenuOpen(false)}>시간표</NavLink>
                    <NavLink to="/Com"className={({ isActive }) => isActive ? "NavItem active" : "NavItem"} onClick={() => setIsMobileMenuOpen(false)}>가정통신문</NavLink>
                    <NavLink to="/Meal" className={({isActive}) => isActive ? "NavItem active" : "NavItem"} onClick={() => setIsMobileMenuOpen(false)}>급식</NavLink>
                    <NavLink to="/Club" className={({isActive}) => isActive ? "NavItem active" : "NavItem"} onClick={() => setIsMobileMenuOpen(false)}>동아리</NavLink>
                    <NavLink to="/Market" className={({isActive}) => isActive ? "NavItem active" : "NavItem"} onClick={() => setIsMobileMenuOpen(false)}>서로당근</NavLink>
                    <NavLink to="/Guide" className={({isActive}) => isActive ? "NavItem active" : "NavItem"} onClick={() => setIsMobileMenuOpen(false)}>로봇가이드</NavLink>
                    <NavLink to="/chats" className={({isActive}) => isActive ? "NavItem active" : "NavItem"} onClick={() => setIsMobileMenuOpen(false)}>채팅</NavLink>
                </div>
                <div className="NavRight">
                    {isLoggedIn ? (
                        <>
                            <NavLink to="/Mypage" className="NavItem" onClick={() => setIsMobileMenuOpen(false)}>{user?.username || '사용자'} 님</NavLink>
                            <button className="NavItem" onClick={() => { logout(); setIsMobileMenuOpen(false); }}>로그아웃</button>
                        </>
                    ) : (
                        <>
                            <NavLink to="/Login" className="NavItem" onClick={() => setIsMobileMenuOpen(false)}>로그인</NavLink>
                            <NavLink to="/Signup" className="NavItem" onClick={() => setIsMobileMenuOpen(false)}>회원가입</NavLink>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Navbar;