import './Boardpage.css'; // 페이지 명에 맞게 수정

import Navbar from './Navbar';
    function Boardpage() {
        return (
    <div>
            <Navbar />
            <div className="BoardContainer">
                <h2>게시판</h2>
                <p>게시판 내용이 여기에 표시됩니다.</p>
                {/* 게시판 내용을 여기에 추가하세요 */}
            </div>
    </div>
    )
}

    export default Boardpage; // 페이지명에 맞게 수정