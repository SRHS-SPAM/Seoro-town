import "./Meal.css";
import { NavLink } from 'react-router-dom';
import { useEffect, useState } from "react";
import { LoginComponent } from '../App.js';
import Navbar from './Navbar';
function Meal() {
    // 백엔드 서버 URL (실제 백엔드 포트에 맞게 수정하세요)
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    
    const [mealData, setMealData] = useState({
        breakfast: [],
        lunch: [],
        dinner: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [lastUpdated, setLastUpdated] = useState("");

    useEffect(() => {
        fetchMeal();
        
        // 30분마다 데이터 새로고침
        const interval = setInterval(fetchMeal, 30 * 60 * 1000);
        
        return () => clearInterval(interval);
    }, []);

    const fetchMeal = async () => {
        setLoading(true);
        setError("");
        
        try {
            // 캐시 방지를 위한 타임스탬프 추가
            const timestamp = new Date().getTime();
            
            // 전체 URL 사용
            const url = `${API_BASE_URL}/api/meal?t=${timestamp}`;
            console.log('API 요청 URL:', url);
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('응답 상태:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('받은 데이터:', data);

            if (data.success) {
                setMealData(data.meal);
                setLastUpdated(new Date().toLocaleString('ko-KR'));
                setError(""); // 성공 시 에러 초기화
            } else {
                setError(data.message || "급식 정보를 불러올 수 없습니다.");
                setMealData({
                    breakfast: [],
                    lunch: [],
                    dinner: []
                });
            }
        } catch (err) {
            console.error('Fetch error:', err);
            
            // 네트워크 오류 타입별 메시지
            let errorMessage = "서버 연결 오류가 발생했습니다.";
            
            if (err.name === 'TypeError' && err.message.includes('fetch')) {
                errorMessage = `백엔드 서버(${API_BASE_URL})에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.`;
            } else if (err.message.includes('CORS')) {
                errorMessage = "CORS 오류가 발생했습니다. 백엔드 서버 설정을 확인하세요.";
            } else if (err.message.includes('HTTP')) {
                errorMessage = `서버 오류: ${err.message}`;
            }
            
            setError(errorMessage);
            setMealData({
                breakfast: [],
                lunch: [],
                dinner: []
            });
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date = new Date()) => {
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });
    };

    const MealSection = ({ title, items, emoji }) => (
        <div className="MealSection">
            <h3>{emoji} {title}</h3>
            <div className="MealItems">
                {items && items.length > 0 ? (
                    items.map((item, index) => (
                        <div key={index} className="MealItem">
                            {item}
                        </div>
                    ))
                ) : (
                    <div className="NoMeal">급식 정보가 없습니다</div>
                )}
            </div>
        </div>
    );

    return (
        <div>
            <Navbar />
            <div className="MealContainer">
                <div className="MealHeader">
                    <h2>🍱 오늘의 급식</h2>
                    <div className="UpdateInfo">
                        {lastUpdated && (
                            <span className="LastUpdated">
                                마지막 업데이트: {lastUpdated}
                            </span>
                        )}
                        <button onClick={fetchMeal} className="RefreshButton" disabled={loading}>
                            🔄 새로고침
                        </button>
                    </div>
                </div>

                <div className="MealDate">
                    {formatDate()}
                </div>

                {/* 개발 환경에서 디버깅 정보 표시 */}
                {process.env.NODE_ENV === 'development' && (
                    <div style={{ 
                        background: '#f0f0f0', 
                        padding: '10px', 
                        margin: '10px 0', 
                        fontSize: '12px',
                        borderRadius: '4px'
                    }}>
                        <strong>개발 모드 정보:</strong><br/>
                        API URL: {API_BASE_URL}<br/>
                        로딩 상태: {loading ? '로딩 중' : '완료'}<br/>
                        에러: {error || '없음'}
                    </div>
                )}

                {loading ? (
                    <div className="LoadingContainer">
                        <p>불러오는 중...</p>
                    </div>
                ) : error ? (
                    <div className="ErrorContainer">
                        <p>{error}</p>
                        <button onClick={fetchMeal} className="RetryButton">
                            다시 시도
                        </button>
                    </div>
                ) : (
                    <div className="MealContent">
                        <MealSection 
                            title="조식" 
                            items={mealData.breakfast} 
                            emoji="🌅"
                        />
                        <MealSection 
                            title="중식" 
                            items={mealData.lunch} 
                            emoji="☀️"
                        />
                        <MealSection 
                            title="석식" 
                            items={mealData.dinner} 
                            emoji="🌙"
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default Meal;