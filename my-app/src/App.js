import './App.css';
import React, { useState, useEffect } from 'react';
import { AuthContext } from './context/AuthContext';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import Boardpage from './page/Boardpage';
import Schedule from './page/Schedule';
import Notice from './page/Notice';
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
  // 로그인 로그아웃 상태를 관리
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  // 로그인 정보 확인
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsLoggedIn(true);
    }
  }, []);

  const login = (userData) => {
    // 사용자 정보 로컬 스토리지에 저장하는 코드
    localStorage.setItem('user', JSON.stringify(userData));
    setIsLoggedIn(true);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
  };

//로그인 컴포넌트 ^

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
      <Router>
        <Routes>
          <Route path="/" element={<Boardpage />} />
          <Route path="/Schedule" element={<Schedule />} />
          <Route path="/Notice" element={<Notice />} />
          <Route path="/Grade" element={<Grade />} />
          <Route path="/Club" element={<Club />} />
          <Route path="/Market" element={<Market />} />
          <Route path="/Meal" element={<Market />} />
          <Route path="/Friends" element={<Market />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/Signup" element={<Signup />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;