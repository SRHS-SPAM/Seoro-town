import './Market.css'; // 페이지 명에 맞게 수정
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Search, PenLine, FileText, Clock, MessageSquare, ThumbsUp, AlertCircle } from 'lucide-react'; // Lucide 아이콘 추가
import { LoginComponent } from '../App.js'; // 로그인 컴포넌트 임포트 
import React from 'react';
import {useNavigate } from 'react-router-dom';


    function Market() {

            const navigate = useNavigate();  // useNavigate 훅 사용
            const handleWriteClick = () => {
                navigate('/MarketWrite'); // 글쓰기 페이지로 이동
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
            <button className="WriteButton" onClick={handleWriteClick}>글쓰기</button>
            </div>
            <div className="Searchbar">{/* 검색창 */}
                <div className="SearchBox">
                    <div className="SearchPrefix">중고거래</div>
                    <div className="SearchDivider"></div>
                    <input type="text" className="SearchInput" placeholder="검색어를 입력하세요!" />
                    <button className="SearchButton">
                        <Search size={22} />
                    </button>
                </div>
            </div>
        </div>
        )
    }

    export default Market; // 페이지명에 맞게 수정