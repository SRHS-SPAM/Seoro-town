import './App.css';
import React, { useState, useEffect } from 'react';
import { AuthContext } from './context/AuthContext';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';

// 페이지 컴포넌트들 import
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

  // 로그인 정보 확인 (localStorage 대신 메모리 사용)
  useEffect(() => {
    // 실제 환경에서는 localStorage를 사용하시면 됩니다
    // 여기서는 예시로 빈 상태로 시작
  }, []);

  const login = (userData) => {
    // 실제 환경에서는 localStorage.setItem('user', JSON.stringify(userData)); 사용
    setIsLoggedIn(true);
    setUser(userData);
  };

  const logout = () => {
    // 실제 환경에서는 localStorage.removeItem('user'); 사용
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
      <Router>
        <div>
          {/* App.js에서는 LoginComponent를 렌더링하지 않음 - 각 페이지에서 필요할 때 사용 */}
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
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;