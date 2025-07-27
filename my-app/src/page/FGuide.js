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
                            <img src="path/to/playground.jpg" alt="운동장" className="FacilityImage" />
                            <h4>운동장</h4>
                        </div>
                        <div className="FacilityItem">
                            {/* 강당 이미지를 여기에 넣으세요 */}
                            <img src="path/to/auditorium.jpg" alt="강당" className="FacilityImage" />
                            <h4>강당</h4>
                        </div>
                        <div className="FacilityItem">
                            {/* 급식실 이미지를 여기에 넣으세요 */}
                            <img src="path/to/cafeteria.jpg" alt="급식실" className="FacilityImage" />
                            <h4>급식실</h4>
                        </div>
                        <div className="FacilityItem">
                            {/* 도서관 이미지를 여기에 넣으세요 */}
                            <img src="path/to/library.jpg" alt="도서관" className="FacilityImage" />
                            <h4>도서관</h4>
                        </div>
                        {/* 추가 시설이 있다면 여기에 더 넣으세요 */}
                    </div>
                    {/* 시설 이미지 그리드 끝 */}
                    
                    <h3>주요 시설 상세 정보</h3>
                    <ul>
                        <li>운동장: 축구, 농구 등 야외 활동 공간</li>
                        <li>강당: 입학식, 졸업식 등 각종 행사 진행</li>
                        <li>급식실: 위생적이고 맛있는 점심 제공</li>
                        <li>도서관: 다양한 서적 및 학습 공간</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default FGuide;