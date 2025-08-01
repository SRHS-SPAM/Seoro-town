import React from 'react';
import Navbar from './Navbar';
import './Guide.css';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

function FGuide() {
    const navigate = useNavigate();
    return (
        <div>
            <Navbar />
            <div className="GuideContainer">
                <div className="GuideHeader">
                    <h1>시설 안내</h1>
                    <button className="BackButton" onClick={() => navigate('/guide')}>
                        <ArrowLeft size={20} /> 로봇가이드
                    </button>
                </div>
                <div className="GuideSection">
                    <h2>학교 시설물 소개</h2>
                    <p>운동장, 급식실, 강당, 도서관 등 학교의 주요 시설물에 대한 상세 정보와 위치를 안내합니다.</p>
                    
                    {/* 시설 이미지 그리드 시작 */}
                    <div className="FacilityGrid">
                        <div className="FacilityItem">
                            {/* 운동장 이미지를 여기에 넣으세요 */}
                            <img src="/field.png" alt="운동장" className="FacilityImage" />
                            <h4>운동장</h4>
                        </div>
                        <div className="FacilityItem">
                            {/* 강당 이미지를 여기에 넣으세요 */}
                            <img src="/gym.png" alt="체육관" className="FacilityImage" />
                            <h4>체육관</h4>
                        </div>
                        <div className="FacilityItem">
                            {/* 급식실 이미지를 여기에 넣으세요 */}
                            <img src="/dyningroom.png" alt="급식실" className="FacilityImage" />
                            <h4>급식실</h4>
                        </div>
                        <div className="FacilityItem">
                            {/* 도서관 이미지를 여기에 넣으세요 */}
                            <img src="/dormitory.png" alt="예성관" className="FacilityImage" />
                            <h4>예성관</h4>
                        </div>
                    </div>
                    
                    <h3>주요 시설 상세 정보</h3>
                    <ul>
                        <li>운동장: 축구, 농구 등 야외 활동 공간</li>
                        <li>체육관: 입학식, 졸업식 등 각종 행사 진행</li>
                        <li>급식실: 수요일마다 맛있는 급식 제공</li>
                        <li>예성관: 기숙사</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default FGuide;