import './App.css';
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
  return (
    <div className="NavRight">
      <NavLink to="/Login" className="NavItem">로그인</NavLink>
      <NavLink to="/Signup" className="NavItem">회원가입</NavLink>
    </div>
  );
}

// LoginComponent를 다른 페이지에서도 사용할수 있게하기
export { LoginComponent };

function App() {
  return (
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
  );
}

export default App;