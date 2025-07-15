// src/page/Meal.js (최종 완성 버전)

import "./Meal.css";
import { useEffect, useState, useCallback } from "react";
import Navbar from './Navbar';

function Meal() {
    // API 주소는 환경 변수 또는 기본값으로 설정할 수 있습니다.
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    
    // 식단 데이터를 저장할 상태
    const [mealData, setMealData] = useState({
        breakfast: [],
        lunch: [],
        dinner: []
    });
    // 로딩, 에러, 마지막 업데이트 시간을 관리할 상태
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [lastUpdated, setLastUpdated] = useState("");

    // API를 호출하는 함수 (useCallback으로 불필요한 재성성 방지)
    const fetchMeal = useCallback(async () => {
        setLoading(true);
        setError("");
        
        try {
            const url = `${API_BASE_URL}/api/meal`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`서버 응답 오류: ${response.status}`);
            }
            
            const data = await response.json();

            if (data.success) {
                setMealData(data.meal || { breakfast: [], lunch: [], dinner: [] });
                setLastUpdated(new Date().toLocaleString('ko-KR'));
                setError(""); // 성공 시 에러 메시지 초기화
            } else {
                throw new Error(data.message || "급식 정보를 불러올 수 없습니다.");
            }
        } catch (err) {
            let errorMessage = "서버 연결에 문제가 발생했습니다.";
            if (err.message.includes('fetch')) {
                errorMessage = `백엔드 서버(${API_BASE_URL})에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요.`;
            } else {
                errorMessage = err.message;
            }
            setError(errorMessage);
            setMealData({ breakfast: [], lunch: [], dinner: [] }); // 에러 시 데이터 초기화
        } finally {
            setLoading(false);
        }
    }, []); // 이 함수는 의존성이 없으므로 처음 한 번만 생성됩니다.

    // 컴포넌트가 처음 마운트될 때, 그리고 30분마다 데이터를 가져옵니다.
    useEffect(() => {
        fetchMeal();
        const interval = setInterval(fetchMeal, 30 * 60 * 1000);
        return () => clearInterval(interval); // 컴포넌트가 사라질 때 인터벌 정리
    }, [fetchMeal]);

    // 오늘 날짜를 "YYYY년 MM월 DD일 요일" 형식으로 포맷하는 함수
    const formatDate = (date = new Date()) => {
        return date.toLocaleDateString('ko-KR', {
            year: 'numeric', month: 'long', day: 'numeric', weekday: 'long'
        });
    };

    // 식단 섹션을 렌더링하는 하위 컴포넌트
    const MealSection = ({ title, items, emoji }) => (
        <div className="MealSection">
            <h3>{emoji} {title}</h3>
            <div className="MealItems">
                {items && items.length > 0 ? (
                    items.map((item, index) => (
                        <div key={index} className="MealItem">{item}</div>
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
                        {lastUpdated && <span className="LastUpdated">마지막 업데이트: {lastUpdated}</span>}
                        <button onClick={fetchMeal} className="RefreshButton" disabled={loading}>
                            {loading ? '로딩중...' : '🔄 새로고침'}
                        </button>
                    </div>
                </div>

                <div className="MealDate">{formatDate()}</div>

                {/* 로딩 및 에러 상태에 따라 다른 UI를 표시 */}
                {loading ? (
                    <div className="LoadingContainer"><p>급식 정보를 맛있게 받아오는 중...</p></div>
                ) : error ? (
                    <div className="ErrorContainer">
                        <p>{error}</p>
                        <button onClick={fetchMeal} className="RetryButton">다시 시도</button>
                    </div>
                ) : (
                    <div className="MealContent">
                        <MealSection title="조식" items={mealData.breakfast} emoji="🌅" />
                        <MealSection title="중식" items={mealData.lunch} emoji="☀️" />
                        <MealSection title="석식" items={mealData.dinner} emoji="🌙" />
                    </div>
                )}
            </div>
        </div>
    );
}

export default Meal;