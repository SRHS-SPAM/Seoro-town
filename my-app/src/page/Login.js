import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Login.css';

function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
<<<<<<< HEAD
    const [isLoading, setIsLoading] = useState(false);
=======
    const [loading, setLoading] = useState(false);
>>>>>>> b30f922dcacf40c818a525b7880470ca07b11de2
    const navigate = useNavigate();
    const { login } = useContext(AuthContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
<<<<<<< HEAD

        if (!username || !password) {
            alert('아이디와 비밀번호를 입력해주세요.');
            return;
        }

        setIsLoading(true);

        try {
            // 서버에 로그인 요청
            const response = await fetch('http://localhost:3001/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (data.success) {
                // Context의 login 함수에 사용자 데이터와 토큰 전달
                login(data.user, data.token);
                alert('로그인 성공!');
                navigate('/');
            } else {
                alert(data.message || '로그인에 실패했습니다.');
            }
        } catch (error) {
            console.error('로그인 오류:', error);
            alert('서버 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
            setIsLoading(false);
=======
        
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
>>>>>>> b30f922dcacf40c818a525b7880470ca07b11de2
        }
    };

    return (
        <div className="LoginContainer">
<<<<<<< HEAD
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
=======
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
>>>>>>> b30f922dcacf40c818a525b7880470ca07b11de2
        </div>
    );
}

<<<<<<< HEAD
export default Login;
=======
    export default Login;
>>>>>>> b30f922dcacf40c818a525b7880470ca07b11de2
