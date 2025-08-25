import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Schedule.css'; 
import { Save, AlertCircle, Settings, User } from 'lucide-react';

const defaultSchedule = [
    ["", "월", "화", "수", "목", "금"], // 요일 (토요일 제거)
    ["1", "", "", "", "", ""], // 1교시
    ["2", "", "", "", "", ""],
    ["3", "", "", "", "", ""],
    ["4", "", "", "", "", ""],
    ["5", "", "", "", "", ""],
    ["6", "", "", "", "", ""],
    ["7", "", "", "", "", ""]  // 7교시 (토요일 컬럼 제거)
];

function Schedule() {
    const { isLoggedIn, token, user } = useContext(AuthContext);
    const navigate = useNavigate();

    const [schedule, setSchedule] = useState(defaultSchedule);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const fetchSchedule = useCallback(async () => {
        if (!isLoggedIn || !token) {
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/users/me/schedule', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error(`시간표 불러오기 실패: ${response.status}`);
            const data = await response.json();
            if (data.success && Array.isArray(data.schedule)) {
                setSchedule(data.schedule);
            } else {
                setSchedule(defaultSchedule);
            }
        } catch (err) {
            console.error("시간표 불러오기 오류:", err);
            setError("시간표를 불러오는 데 실패했습니다.");
            setSchedule(defaultSchedule); // 오류 시에도 기본값으로 설정
        } finally {
            setLoading(false);
        }
    }, [isLoggedIn, token]);

    useEffect(() => {
        fetchSchedule();
    }, [fetchSchedule]);

    // --- 시간표 내용 변경 핸들러 ---
    const handleCellChange = (rowIndex, colIndex, value) => {
        setSchedule(prevSchedule => {
            const newSchedule = prevSchedule.map(row => [...row]); // 깊은 복사
            newSchedule[rowIndex][colIndex] = value;
            return newSchedule;
        });
    };

    // --- 시간표 저장 ---
    const handleSaveSchedule = async () => {
        if (!isLoggedIn || !token) {
            alert('로그인 후 시간표를 저장할 수 있습니다.');
            return;
        }
        setIsSaving(true);
        setError(null);
        try {
            const response = await fetch('/api/users/me/schedule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ schedule })
            });
            if (!response.ok) throw new Error(`시간표 저장 실패: ${response.status}`);
            const data = await response.json();
            if (data.success) {
                alert('시간표가 성공적으로 저장되었습니다!');
            } else {
                alert(data.message || '시간표 저장에 실패했습니다.');
            }
        } catch (err) {
            console.error("시간표 저장 오류:", err);
            alert('시간표 저장 중 오류가 발생했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    // --- 로그인 필요 UI ---
    if (!isLoggedIn) {
        return (
            <div>
                
                <div className="ScheduleContainer">
                    <div className="LoginRequired">
                        <User size={64} />
                        <h2>로그인이 필요합니다</h2>
                        <p>나만의 시간표를 만들고 관리하려면 로그인해주세요.</p>
                        <button onClick={() => navigate('/login')}>로그인 페이지로</button>
                    </div>
                </div>
            </div>
        );
    }

    // --- 로딩 UI ---
    if (loading) {
        return (
            <div>
                
                <div className="ScheduleContainer">
                    <div className="LoadingContainer">
                        <Settings size={48} className="LoadingSpinner" /><span>시간표를 불러오는 중...</span>
                    </div>
                </div>
            </div>
        );
    }

    // --- 메인 렌더링 ---
    return (
        <div>
            
            <div className="ScheduleContainer">
                <div className="ScheduleHeader">
                    <h1>나만의 학교 시간표</h1>
                    <button onClick={handleSaveSchedule} className="SaveButton" disabled={isSaving}>
                        <Save size={20} /> {isSaving ? '저장 중...' : '저장하기'}
                    </button>
                </div>
                
                {error && <div className="ErrorMessage"><AlertCircle size={20} /> {error}</div>}

                <div className="ScheduleGrid">
                    {schedule.map((row, rowIndex) => (
                        <React.Fragment key={rowIndex}>
                            {row.map((cellData, colIndex) => (
                                <div 
                                    key={`${rowIndex}-${colIndex}`} 
                                    className={`ScheduleCell 
                                        ${rowIndex === 0 ? 'header-row' : ''} 
                                        ${colIndex === 0 ? 'header-col' : ''} 
                                        ${rowIndex === 0 && colIndex === 0 ? 'corner-cell' : ''}
                                    `}
                                >
                                    {/* 첫 번째 행, 첫 번째 열은 편집 불가능한 헤더 */}
                                    {rowIndex === 0 || colIndex === 0 ? (
                                        cellData
                                    ) : (
                                        <textarea
                                            value={cellData}
                                            onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                            placeholder="과목/계획"
                                            rows="1" // 내용에 따라 자동 높이 조절되도록 CSS에서 설정
                                        />
                                    )}
                                </div>
                            ))}
                        </React.Fragment>
                    ))}
                </div>
                <div className="ScheduleFooter">
                    <p>각 칸을 클릭하여 과목 또는 계획을 자유롭게 입력하세요.</p>
                </div>
            </div>
        </div>
    );
}

export default Schedule;