import React from 'react';
import Navbar from './Navbar';
import './Guide.css';
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
                    
                    {/* 본관동 시설 이미지 그리드 시작 */}
                    <div className="FacilityGrid">
                        <div className="FacilityItem">
                            {/* 행정실 이미지를 여기에 넣으세요 */}
                            <img src="path/to/administration.jpg" alt="행정실" className="FacilityImage" />
                            <h4>행정실</h4>
                        </div>
                        <div className="FacilityItem">
                            {/* 보건실 이미지를 여기에 넣으세요 */}
                            <img src="path/to/health_room.jpg" alt="보건실" className="FacilityImage" />
                            <h4>보건실</h4>
                        </div>
                        <div className="FacilityItem">
                            {/* 교장실 이미지를 여기에 넣으세요 */}
                            <img src="path/to/principal_office.jpg" alt="교장실" className="FacilityImage" />
                            <h4>교장실</h4>
                        </div>
                        <div className="FacilityItem">
                            {/* 교무실 이미지를 여기에 넣으세요 */}
                            <img src="path/to/teachers_office.jpg" alt="교무실" className="FacilityImage" />
                            <h4>교무실</h4>
                        </div>
                        <div className="FacilityItem">
                            {/* 일반교실 이미지를 여기에 넣으세요 */}
                            <img src="path/to/classroom.jpg" alt="일반교실" className="FacilityImage" />
                            <h4>일반교실</h4>
                        </div>
                        <div className="FacilityItem">
                            {/* 특별실 이미지를 여기에 넣으세요 */}
                            <img src="path/to/special_room.jpg" alt="특별실" className="FacilityImage" />
                            <h4>특별실</h4>
                        </div>
                    </div>
                    {/* 본관동 시설 이미지 그리드 끝 */}
                    
                    <h3>층별 상세 정보</h3>
                    <ul>
                        <li>1층: 행정실, 보건실</li>
                        <li>2층: 교장실, 교무실</li>
                        <li>3~5층: 일반 교실, 특별실</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default MBGuide;
