// src/page/MBGuide.js (변경 없음)

import React from 'react';
import Navbar from './Navbar';
import './Guide.css'; // 공통 CSS 재사용
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

function MBGuide() {
    const navigate = useNavigate();
    return (
        <div>
            <Navbar />
            <div className="GuideContainer">
                <div className="GuideHeader">
                    <h1>본관동 안내</h1>
                    <button className="BackButton" onClick={() => navigate('/guide')}>
                        <ArrowLeft size={20} /> 로봇가이드
                    </button>
                </div>
                <div className="GuideSection">
                    <h2>본관동 층별 안내</h2>
                    <p>본관동에는 교무실, 행정실, 교장실, 그리고 다양한 교실들이 위치해 있습니다. 각 층별 상세 안내도를 통해 원하는 장소를 쉽게 찾으세요.</p>
                    
                    <div className="FacilityGrid">
                        <div className="FacilityItem">
                            <img src="/wee.png" alt="Wee_Class" className="FacilityImage" />
                            <h4>wee class</h4>
                        </div>
                        <div className="FacilityItem">
                            <img src="/haksaeng.png" alt="학생회실" className="FacilityImage" />
                            <h4>학생회실</h4>
                        </div>
                        <div className="FacilityItem">
                            <img src="/art.png" alt="로봇아트실" className="FacilityImage" />
                            <h4>로봇아트실</h4>
                        </div>
                        <div className="FacilityItem">
                            <img src="/restroom.png" alt="예성관 휴게실" className="FacilityImage" />
                            <h4>예성관 휴게실</h4>
                        </div>
                        <div className="FacilityItem">
                            <img src="/bookhub.png" alt="도서관" className="FacilityImage" />
                            <h4>북허브</h4>
                        </div>
                    </div>
                    
                    <h3>층별 상세 정보</h3>
                    <ul>
                        <li>1층: 북허브</li>
                        <li>2층: wee class</li>
                        <li>4층: 로봇아트실, 학생회실</li>
                        <li>기숙사: 예성관 휴게실</li>
                        
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default MBGuide;