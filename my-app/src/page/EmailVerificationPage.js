import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import './EmailVerificationPage.css'; // We will create this CSS file next

function EmailVerificationPage() {
    const [searchParams] = useSearchParams();
    const [verificationStatus, setVerificationStatus] = useState('verifying'); // verifying, success, failure

    useEffect(() => {
        const success = searchParams.get('success');
        if (success === 'true') {
            setVerificationStatus('success');
        } else if (success === 'false') {
            setVerificationStatus('failure');
        } else {
            setVerificationStatus('invalid');
        }
    }, [searchParams]);

    const renderContent = () => {
        switch (verificationStatus) {
            case 'success':
                return (
                    <>
                        <h2>✅ 이메일 인증 성공</h2>
                        <p>회원가입이 완료되었습니다. 이제 모든 서비스를 이용할 수 있습니다.</p>
                        <Link to="/login" className="verification-link">로그인 페이지로 이동</Link>
                    </>
                );
            case 'failure':
                return (
                    <>
                        <h2>❌ 이메일 인증 실패</h2>
                        <p>인증 링크가 만료되었거나 올바르지 않습니다.</p>
                        <p>회원가입을 다시 시도하시거나, 로그인을 시도하여 인증 이메일을 재전송 받아주세요.</p>
                        <Link to="/signup" className="verification-link">회원가입 페이지로 이동</Link>
                    </>
                );
            default:
                return (
                    <>
                        <h2>알 수 없는 접근</h2>
                        <p>잘못된 접근입니다. 홈페이지로 돌아가주세요.</p>
                        <Link to="/" className="verification-link">홈으로 이동</Link>
                    </>
                );
        }
    };

    return (
        <div className="verification-container">
            <div className="verification-box">
                {renderContent()}
            </div>
        </div>
    );
}

export default EmailVerificationPage;
