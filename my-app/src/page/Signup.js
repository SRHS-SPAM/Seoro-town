import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import './Signup.css';

function Signup() {
    // --- State Management ---
    const [step, setStep] = useState('EMAIL_INPUT'); // EMAIL_INPUT, CODE_INPUT, DETAILS_INPUT
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [registrationToken, setRegistrationToken] = useState('');
    
    const [timer, setTimer] = useState(180); // 3 minutes in seconds
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    // --- Timer Logic ---
    useEffect(() => {
        let interval;
        if (isTimerRunning && timer > 0) {
            interval = setInterval(() => {
                setTimer((prevTimer) => prevTimer - 1);
            }, 1000);
        } else if (timer === 0) {
            setIsTimerRunning(false);
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning, timer]);

    const formatTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    // --- API Handlers ---
    const handleRequestCode = async (isResend = false) => {
        if (!email) {
            toast.error('이메일을 입력해주세요.');
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/request-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);
            
            toast.success(data.message);
            setStep('CODE_INPUT');
            setTimer(180);
            setIsTimerRunning(true);
        } catch (error) {
            toast.error(`오류: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (!code) {
            toast.error('인증 코드를 입력해주세요.');
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/verify-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            toast.success(data.message);
            setRegistrationToken(data.registrationToken);
            setStep('DETAILS_INPUT');
            setIsTimerRunning(false);
        } catch (error) {
            toast.error(`인증 실패: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            toast.error('비밀번호가 일치하지 않습니다.');
            return;
        }
        if (password.length < 6) {
            toast.error('비밀번호는 6자 이상이어야 합니다.');
            return;
        }
        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ registrationToken, username, password }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message);

            toast.success(data.message);
            navigate('/login');
        } catch (error) {
            toast.error(`가입 실패: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Render Logic ---
    return (
        <div className="SignupContainer">
            <h2>회원가입</h2>
            
            {/* --- Step 1: Email Input --- */}
            {step === 'EMAIL_INPUT' && (
                <div className="FormGroup">
                    <label>이메일</label>
                    <div className="InputWithButton">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="이메일을 입력하세요"
                            required
                            disabled={isLoading}
                        />
                        <button onClick={() => handleRequestCode()} disabled={isLoading} className="ActionButton">
                            {isLoading ? '전송 중...' : '인증 요청'}
                        </button>
                    </div>
                </div>
            )}

            {/* --- Step 2: Code Input --- */}
            {step === 'CODE_INPUT' && (
                <>
                    <div className="FormGroup">
                        <label>이메일</label>
                        <input type="email" value={email} disabled />
                    </div>
                    <div className="FormGroup">
                        <label>인증 코드</label>
                        <div className="InputWithButton">
                            <input
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                placeholder="코드를 입력하세요"
                                required
                                disabled={isLoading || !isTimerRunning}
                            />
                            {isTimerRunning && <span className="Timer">{formatTime(timer)}</span>}
                            <button onClick={handleVerifyCode} disabled={isLoading || !isTimerRunning} className="ActionButton">
                                {isLoading ? '확인 중...' : '코드 확인'}
                            </button>
                        </div>
                    </div>
                    {timer === 0 && (
                        <button onClick={() => handleRequestCode(true)} disabled={isLoading} className="ResendButton">
                            {isLoading ? '전송 중...' : '인증코드 재발송'}
                        </button>
                    )}
                </>
            )}

            {/* --- Step 3: Details Input --- */}
            {step === 'DETAILS_INPUT' && (
                <form onSubmit={handleSignup}>
                     <div className="FormGroup">
                        <label>이메일</label>
                        <input type="email" value={email} disabled />
                    </div>
                    <div className="FormGroup">
                        <label>사용자명</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="사용자명을 입력하세요"
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div className="FormGroup">
                        <label>비밀번호</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="비밀번호를 입력하세요 (6자 이상)"
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <div className="FormGroup">
                        <label>비밀번호 확인</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="비밀번호를 다시 입력하세요"
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <button type="submit" className="SignupButton" disabled={isLoading}>
                        {isLoading ? '가입 중...' : '회원가입'}
                    </button>
                </form>
            )}

            <div className="LoginLink">
                이미 계정이 있으신가요? 
                <span onClick={() => navigate('/login')}>로그인</span>
            </div>
        </div>
    );
}

export default Signup;
