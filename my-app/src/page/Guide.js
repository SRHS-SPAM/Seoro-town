import Navbar from './Navbar';
import './Guide.css';
import { useNavigate } from 'react-router-dom';

function Guide() {
    const navigate = useNavigate();

    const handleGuideClick = (path) => {
        navigate(path);
    };

    return (
        <div>
            <Navbar />
            <div className="GuideContainer">
                <div className="GuideHeader">
                    <h1>로봇가이드</h1>
                </div>

                <div className="GuideMap">
                    <img src="/RobotMap.png" alt="학교 로봇 지도" className="RobotMapImage" />
                    <p className="MapDescription">
                        ▲ 학교 전체 지도를 통해 주요 시설을 한눈에 확인하세요.
                    </p>
                </div>

                <div className="GuideButtons">
                    <button onClick={() => handleGuideClick('/guide/facility')} className="GuideButton">
                        시설 안내
                    </button>
                    <button onClick={() => handleGuideClick('/guide/main-building')} className="GuideButton">
                        본관동 안내
                    </button>
                    <button onClick={() => handleGuideClick('/guide/practice-building')} className="GuideButton">
                        실습동 안내
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Guide;