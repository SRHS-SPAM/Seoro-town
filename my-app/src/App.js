import './App.css';
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Navbar from './page/Navbar';
import Boardpage from './page/Boardpage';
import Schedule from './page/Schedule';
import Com from './page/Com';
import Grade from './page/Grade';
import Club from './page/Club';
import Market from './page/Market';
import MarketDetail from './page/MarketDetail'; 
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
import ChatListPage from './page/ChatListPage';
import ChatRoomPage from './page/ChatRoomPage';

// AppContent component to use the AuthContext
function AppContent() {
  const { isLoading } = React.useContext(AuthContext);

  if (isLoading) {
    return <div className="loading-container">Loading...</div>;
  }

  return (
    <Router>
      <Navbar />
      <main className="main-content">
        <Routes>
            <Route path="/" element={<Boardpage />} />
            <Route path="/Schedule" element={<Schedule />} />
            <Route path="/Com" element={<Com />} />
            <Route path="/Grade" element={<Grade />} />
            <Route path="/Club" element={<Club />} />
            <Route path="/Market" element={<Market />} />
            <Route path="/market/:productId" element={<MarketDetail />} />
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
            <Route path="/chats" element={<ChatListPage />} />
            <Route path="/chat/:roomId" element={<ChatRoomPage />} /> 
        </Routes>
      </main>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;