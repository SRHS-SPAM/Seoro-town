import './App.css';
import React, { useState, useEffect } from 'react';
import { AuthContext } from './context/AuthContext';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';

// 페이지 컴포넌트 임포트
import Boardpage from './page/Boardpage';
import Schedule from './page/Schedule';
import Com from './page/Com';
import Grade from './page/Grade';
import Club from './page/Club';
import Market from './page/Market';
import Login from './page/Login';
import Signup from './page/Signup';

function LoginComponent() {
  const { isLoggedIn, logout, user } = React.useContext(AuthContext);

  return (
    <div className="NavRight">
      {isLoggedIn ? (
        <>
          <span className="NavItem">{user?.username || '사용자'} 님</span>
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
    const token = localStorage.getItem('token');
    if (token) {
      fetch('http://localhost:3001/api/user', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setIsLoggedIn(true);
          setUser(data.user);
        } else {
          localStorage.removeItem('token');
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
      });
    }
  }, []);

  const login = (userData, token) => {
    if (token) {
      localStorage.setItem('token', token);
    }
    setIsLoggedIn(true);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
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
          </Routes>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;