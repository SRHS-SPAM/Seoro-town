// src/page/Meal.js (데이터 처리 로직 강화 최종 버전)

import "./Meal.css";
import { useEffect, useState, useCallback } from "react";
import Navbar from './Navbar';

function Meal() {
    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    
    const [mealData, setMealData] = useState({
        breakfast: [],
        lunch: [],
        dinner: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [lastUpdated, setLastUpdated] = useState("");

    const fetchMeal = useCallback(async () => {
        setLoading(true);
        setError("");
        
        try {
            const url = `${API_BASE_URL}/api/meal`;
            const response = await fetch(url);
            
            if (!response.ok) throw new Error(`서버 응답 오류: ${response.status}`);
            
            const data = await response.json();

            if (data.success && data.meal) {
                const backendMeal = data.meal;
                const correctedData = {
                    breakfast: Array.isArray(backendMeal.breakfast) ? [...backendMeal.breakfast] : [],
                    lunch: Array.isArray(backendMeal.lunch) ? [...backendMeal.lunch] : [],
                    dinner: Array.isArray(backendMeal.dinner) ? [...backendMeal.dinner] : []
                };

                if (correctedData.lunch.length > 0) {
                    correctedData.breakfast.push(correctedData.lunch.shift());
                }

                if (correctedData.dinner.length > 0) {
                    correctedData.lunch.push(correctedData.dinner.shift());
                }
                
                setMealData(correctedData);
                setLastUpdated(new Date().toLocaleString('ko-KR'));
                
            } else {
                throw new Error(data.message || "급식 정보를 불러올 수 없습니다.");
            }
        } catch (err) {
            setError(err.message || "데이터를 처리하는 중 오류가 발생했습니다.");
            setMealData({ breakfast: [], lunch: [], dinner: [] });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMeal();
        const interval = setInterval(fetchMeal, 30 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchMeal]);

    const formatDate = (date = new Date()) => { /* 이전과 동일 */ };

    const MealSection = ({ title, items, emoji }) => (
        <div className="MealSection">
            <h3>{emoji} {title}</h3>
            <div className="MealItems">
                {/* items가 유효한 배열인지 다시 한번 확인 */}
                {Array.isArray(items) && items.length > 0 ? (
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
                            {loading ? '로딩중...' : '새로고침'}
                        </button>
                    </div>
                </div>
                <div className="MealDate">{formatDate()}</div>
                {loading ? (
                    <div className="LoadingContainer"><p>급식 정보를 받아오는 중...</p></div>
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