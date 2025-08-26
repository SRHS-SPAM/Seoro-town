import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Login.css';

function Login() {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!identifier || !password) {
            toast.error('이메일 또는 사용자이름과 비밀번호를 입력해주세요.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ identifier, password }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success('로그인 성공!');
                login(data.user, data.token);
                navigate('/');
            } else {
                throw new Error(data.message || '로그인에 실패했습니다.');
            }
        } catch (error) {
            console.error('로그인 오류:', error);
            toast.error(`로그인 실패: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="LoginContainer">
            <h2>로그인</h2>
            <form onSubmit={handleSubmit}>
                <div className="FormGroup">
                    <label>이메일 또는 사용자이름</label>
                    <input
                        type="text"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder="이메일 또는 사용자이름을 입력하세요"
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
                        placeholder="비밀번호를 입력하세요"
                        required
                        disabled={isLoading}
                    />
                </div>
                <button 
                    type="submit" 
                    className="LoginButton"
                    disabled={isLoading}
                >
                    {isLoading ? '로그인 중...' : '로그인'}
                </button>
            </form>
        </div>
    );
}

export default Login;