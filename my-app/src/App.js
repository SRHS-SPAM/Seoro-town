import './App.css';
import React, { useState, useEffect } from 'react';
import { AuthContext } from './context/AuthContext';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';

// 페이지 컴포넌트들 import
import Boardpage from './page/Boardpage';
import Schedule from './page/Schedule';
import Com from './page/Com';
import Grade from './page/Grade';
import Club from './page/Club';
import Market from './page/Market';
import Login from './page/Login';
import Signup from './page/Signup';
import MarketWrite from './page/MarketWrite.js';  // 글쓰기 페이지 컴포넌트 임포트

function LoginComponent() {
  const { isLoggedIn, logout, user } = React.useContext(AuthContext);

  return (
    <div className="NavRight">
      {isLoggedIn ? (
        <>
          <span className="NavItem">{user?.name || '사용자'} 님</span>
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
  }, []);

  const login = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
      <Router>
        <div>
          <Routes>
            <Route path="/" element={<Boardpage />} />
            <Route path="/Schedule" element={<Schedule />} />
            <Route path="/Com" element={<Com />} />
            <Route path="/Grade" element={<Grade />} />
            <Route path="/Club" element={<Club />} />
            <Route path="/Market" element={<Market />} />
            <Route path="/Meal" element={<Market />} />
            <Route path="/Friends" element={<Market />} />
            <Route path="/Login" element={<Login />} />
            <Route path="/Signup" element={<Signup />} />
            <Route path="/write" element={<MarketWrite />} />
          </Routes>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;