import React from 'react';
import Navbar from './Navbar';
import './Boardpage.css'; // 페이지 명에 맞게 수정
function Com() {
        return (
            <div>
                <Navbar />
                <div className="ComContainer">
                    <h2>가정통신문</h2>
                    <p>가정통신문 내용이 여기에 표시됩니다.</p>
                    {/* 가정통신문 내용을 여기에 추가하세요 */}
                </div>
        </div>
    )
}
export default Com;
