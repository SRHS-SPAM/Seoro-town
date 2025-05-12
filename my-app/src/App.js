import './App.css';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';

import Board from './page/Boardpage';
import Schedule from './page/Schedule';
import Notice from './page/Notice';
import Grade from './page/Grade';
import Club from './page/Club';
import Market from './page/Market';


function App() {
  return (
    <Router>
      <div>
        <div className="NavBar">
          <div className="NavLeft">
            <img src="RobotLogo.png" alt="로고" className="RobotLogo" />
            <span className="BrandName">ROBOTOWN</span>
          </div>
          
          <div className="NavCenter">
            <NavLink to="/Board" className={({isActive}) => isActive ? "NavItem active" : "NavItem"}>게시판</NavLink>
            <NavLink to="/Schedule" className={({isActive}) => isActive ? "NavItem active" : "NavItem"}>시간표</NavLink>
            <NavLink to="/Notice"className={({ isActive }) => isActive ? "NavItem active" : "NavItem"}>가정통신문</NavLink>
            <NavLink to="/Grade" className={({isActive}) => isActive ? "NavItem active" : "NavItem"}>학점계산기</NavLink>
            <NavLink to="/Club" className={({isActive}) => isActive ? "NavItem active" : "NavItem"}>동아리</NavLink>
            <NavLink to="/Market" className={({isActive}) => isActive ? "NavItem active" : "NavItem"}>서로당근</NavLink>
          </div>
          <div className="NavRight">
            <span>로그인</span>
            <span>회원가입</span>
          </div>
        </div>
        <Routes>
          <Route path="/Board" element={<Board />} />
          <Route path="/Schedule" element={<Schedule />} />
          <Route path="/Notice" element={<Notice />} />
          <Route path="/Grade" element={<Grade />} />
          <Route path="/Club" element={<Club />} />
          <Route path="/arket" element={<Market />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;