import './Market.css'; // 페이지 명에 맞게 수정
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Search, PenLine, FileText, Clock, MessageSquare, ThumbsUp, AlertCircle } from 'lucide-react'; // Lucide 아이콘 추가
import { LoginComponent } from '../App.js'; // 로그인 컴포넌트 임포트   
import Navbar from './Navbar.js';
    function Market() {
        return (
            <div>
            <Navbar />
            <div className="Title">
                <img src="pngwing.com.png" alt="어서오고" className="ping" />
                학생들이 물건을 나누는 공간이에요!
            </div>
            <div className="SearchContainer">{/* 검색창 */}
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