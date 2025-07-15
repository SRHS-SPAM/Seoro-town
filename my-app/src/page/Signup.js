import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Signup.css';

function Signup() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const navigate = useNavigate();

    const { login } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        if (password.length < 6) {
            alert('비밀번호는 6자 이상이어야 합니다.');
            return;
        }

        try {
            const response = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username,
                    email,
                    password
                })
            });

            const data = await response.json();

            if (data.success) {
                alert('회원가입이 완료되었습니다!');
                
                login(data.user, data.token);
                navigate('/');
            } else {
                alert(data.message || '회원가입에 실패했습니다.');
            }
        } catch (error) {
            console.error('회원가입 요청 중 오류 발생:', error);
            alert('서버 연결에 실패했습니다. 다시 시도해주세요.');
        }
    };

    return (
        <div className="SignupContainer">
            <h2>회원가입</h2>
            <form onSubmit={handleSubmit}>
                <div className="FormGroup">
                    <label>사용자명</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="사용자명을 입력하세요"
                        required
                    />
                </div>
                <div className="FormGroup">
                    <label>이메일</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="이메일을 입력하세요"
                        required
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
                    />
                </div>
                <button type="submit" className="SignupButton">회원가입</button>
                <div className="LoginLink">
                    이미 계정이 있으신가요? 
                    <span onClick={() => navigate('/login')}>로그인</span>
                </div>
            </form>
        </div>
    );
}

export default Signup;