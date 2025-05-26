    import React, { useState, useContext } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { AuthContext } from '../context/AuthContext';
    import './Login.css';

    function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!username || !password) {
        alert('아이디와 비밀번호를 입력해주세요.');
        return;
        }

        setLoading(true);

        try {
        const response = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify({
            username: username,
            password: password
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert('로그인 성공!');
            
            if (data.token) {
            localStorage.setItem('token', data.token);
            }

            const userData = {
            name: data.user.username,
            email: data.user.email,
            id: data.user.id
            };

            login(userData);
            navigate('/');
        } else {
            alert(data.message || '로그인에 실패했습니다.');
        }
        } catch (error) {
        console.error('로그인 요청 중 오류 발생:', error);
        alert('서버 연결에 실패했습니다. 다시 시도해주세요.');
        } finally {
        setLoading(false);
        }
    };

    return (
        <div className="LoginContainer">
        <h2>로그인</h2>
        <form onSubmit={handleSubmit}>
            <div className="FormGroup">
            <label>아이디</label>
            <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="아이디를 입력하세요"
                required
                disabled={loading}
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
                disabled={loading}
            />
            </div>
            <button 
            type="submit" 
            className="LoginButton" 
            disabled={loading}
            >
            {loading ? '로그인 중...' : '로그인'}
            </button>
        </form>
        </div>
    );
    }

    export default Login;