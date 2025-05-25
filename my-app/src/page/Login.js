    import React, { useState, useContext } from 'react';
    import { useNavigate } from 'react-router-dom';
    import { AuthContext } from '../context/AuthContext';
    import './Login.css';

    function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const { login } = useContext(AuthContext);

    const handleSubmit = (e) => {
        e.preventDefault();


        if (username && password) {
        const userData = {
            name: username,
        };

        login(userData);
        navigate('/');
        } else {
        alert('아이디와 비밀번호를 입력해주세요.');
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
                />
                </div>
                <button type="submit" className="LoginButton">로그인</button>
            </form>
        </div>
    );
    }

    export default Login;
