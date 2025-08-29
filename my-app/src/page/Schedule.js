import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast'; // 1. toast 임포트
import './Schedule.css'; 
import { Save, AlertCircle, Settings, User } from 'lucide-react';

const defaultSchedule = [
    ["", "월", "화", "수", "목", "금"],
    ["1", "", "", "", "", ""],
    ["2", "", "", "", "", ""],
    ["3", "", "", "", "", ""],
    ["4", "", "", "", "", ""],
    ["5", "", "", "", "", ""],
    ["6", "", "", "", "", ""],
    ["7", "", "", "", "", ""]
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
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/me/schedule`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error(`시간표 불러오기 실패: ${response.status}`);
            const data = await response.json();
            if (data.success && Array.isArray(data.schedule) && data.schedule.length > 0) {
                setSchedule(data.schedule);
            } else {
                setSchedule(defaultSchedule);
            }
        } catch (err) {
            console.error("시간표 불러오기 오류:", err);
            setError("시간표를 불러오는 데 실패했습니다.");
            setSchedule(defaultSchedule);
        } finally {
            setLoading(false);
        }
    }, [isLoggedIn, token]);

    useEffect(() => {
        fetchSchedule();
    }, [fetchSchedule]);

    const handleCellChange = (rowIndex, colIndex, value) => {
        setSchedule(prevSchedule => {
            const newSchedule = prevSchedule.map(row => [...row]);
            newSchedule[rowIndex][colIndex] = value;
            return newSchedule;
        });
    };

    const handleSaveSchedule = async () => {
        if (!isLoggedIn || !token) {
            toast.error('로그인 후 시간표를 저장할 수 있습니다.');
            return;
        }
        setIsSaving(true);
        setError(null);
        const toastId = toast.loading('저장 중...'); // 로딩 토스트

        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/users/me/schedule`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ schedule })
            });
            const data = await response.json();
            if (response.ok && data.success) {
                toast.success('시간표가 성공적으로 저장되었습니다!', { id: toastId });
            } else {
                throw new Error(data.message || '시간표 저장에 실패했습니다.');
            }
        } catch (err) {
            console.error("시간표 저장 오류:", err);
            toast.error(`저장 실패: ${err.message}`, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

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
                                    {rowIndex === 0 || colIndex === 0 ? (
                                        cellData
                                    ) : (
                                        <textarea
                                            value={cellData}
                                            onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                            placeholder="과목/계획"
                                            rows="1"
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