import './App.css';

function App() {
  return (
    <div>
      {/* 상단 네비게이션 바 */}
      <div className="NavBar">
        <div className="NavLeft">
          <img src="RobotLogo.png" alt="로고" className="RobotLogo" />
          RobotTown
        </div>

        <div className="NavCenter">
          <span>게시판</span>
          <span>시간표</span>
          <span>가정통신문</span>
          <span>학점계산기</span>
          <span>동아리</span>
        </div>

        <div className="NavRight">
          <span>로그인</span>
          <span>회원가입</span>
        </div>
      </div>


      <div className="Title">
        <img src="pngwing.com.png" alt="서로타운" className="Logo" />
        서로타운에 오신 여러분들 환영합니다
      </div>
    </div>
  );
}

export default App;
