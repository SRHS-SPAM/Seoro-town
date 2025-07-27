// src/App.js (최종 수정 완료 버전)

import './App.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';

// 페이지 컴포넌트 임포트
import Boardpage from './page/Boardpage';
import Schedule from './page/Schedule';
import Com from './page/Com';
import Grade from './page/Grade';
import Club from './page/Club';
import Market from './page/Market';
import Login from './page/Login';
import Signup from './page/Signup';
import Boardinfo from './page/Boardinfo';
import Boardarr from './page/Boardarr';
import Meal from './page/Meal';
import Guide from './page/Guide';
import Mypage from './page/Mypage';
import ComDetail from './page/ComDetail'; 
import FGuide from './page/FGuide';
import MBGuide from './page/MBGuide';
import PBGuide from './page/PBGuide';
function LoginComponent() {
  const { isLoggedIn, logout, user } = React.useContext(AuthContext);
  
  return (
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
  );
}

export { LoginComponent };

function App() {
  return (
    <AuthProvider>
      <Router>
        <div>
          <Routes>

            <Route path="/" element={<Boardpage />} />
            <Route path="/Schedule" element={<Schedule />} />
            <Route path="/Com" element={<Com />} />
            <Route path="/Grade" element={<Grade />} />
            <Route path="/Club" element={<Club />} />
            <Route path="/Market" element={<Market />} />
            <Route path="/Meal" element={<Meal />} />
            <Route path="/Mypage" element={<Mypage />} />
            <Route path="/Login" element={<Login />} />
            <Route path="/Signup" element={<Signup />} />
            <Route path="/infoboard/:id" element={<Boardinfo />} /> 
            <Route path="/Boardarr" element={<Boardarr/>}/>
            <Route path="/Guide" element={<Guide />} />
            <Route path="/com-detail/:nttId" element={<ComDetail />} />
            <Route path="/guide/facility" element={<FGuide />} />
            <Route path="/guide/main-building" element={<MBGuide />} />
            <Route path="/guide/practice-building" element={<PBGuide />} />

          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;