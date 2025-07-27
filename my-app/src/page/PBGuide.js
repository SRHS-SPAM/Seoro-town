import Navbar from './Navbar';
import './Guide.css';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

function PBGuide() {
    const navigate = useNavigate();
    return (
        <div>
            <Navbar />
            <div className="GuideContainer">
                <div className="GuideHeader">
                    <h1>실습동 안내</h1>
                    <button className="BackButton" onClick={() => navigate('/guide')}>
                        <ArrowLeft size={20} /> 로봇가이드
                    </button>
                </div>
                <div className="GuideSection">
                    <h2>최첨단 실습 시설 소개</h2>
                    <p>우리 학교의 실습동은 학생들이 직접 로봇을 제작하고 프로그래밍하는 최첨단 공간입니다. 각 실습실의 용도를 확인하세요.</p>
                    
                    {/* 실습동 시설 이미지 그리드 시작 */}
                    <div className="FacilityGrid">
                        <div className="FacilityItem">
                            {/* 로봇 제어 실습실 이미지를 여기에 넣으세요 */}
                            <img src="path/to/robot_control_lab.jpg" alt="로봇 제어 실습실" className="FacilityImage" />
                            <h4>로봇 제어 실습실</h4>
                        </div>
                        <div className="FacilityItem">
                            {/* 컴퓨터 프로그래밍 실습실 이미지를 여기에 넣으세요 */}
                            <img src="path/to/programming_lab.jpg" alt="컴퓨터 프로그래밍 실습실" className="FacilityImage" />
                            <h4>컴퓨터 프로그래밍 실습실</h4>
                        </div>
                        <div className="FacilityItem">
                            {/* AI 로봇 개발실 이미지를 여기에 넣으세요 */}
                            <img src="path/to/ai_robot_lab.jpg" alt="AI 로봇 개발실" className="FacilityImage" />
                            <h4>AI 로봇 개발실</h4>
                        </div>
                        {/* 추가 실습실이 있다면 여기에 더 넣으세요 */}
                    </div>
                    {/* 실습동 시설 이미지 그리드 끝 */}
                    
                    <h3>주요 실습실 상세 정보</h3>
                    <ul>
                        <li>로봇 제어 실습실: 로봇 하드웨어 제어 및 센서 실습</li>
                        <li>컴퓨터 프로그래밍 실습실: 소프트웨어 개발 및 코딩 실습</li>
                        <li>AI 로봇 개발실: 인공지능 로봇 연구 및 개발</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default PBGuide;