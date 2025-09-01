import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import './ComDetail.css'; // 상세 페이지용 CSS (아래 제공)
import { Settings, AlertCircle, ArrowLeft, Paperclip } from 'lucide-react';

function ComDetail() {
    const { bbsId, nttId } = useParams();
    const navigate = useNavigate();
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchDetail = useCallback(async () => {
        if (!bbsId || !nttId) {
            setError('게시글 ID가 없어 내용을 불러올 수 없습니다.');
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/com/detail/${bbsId}/${nttId}`);
            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `서버 응답 오류: ${response.status}`);
            }
            const data = await response.json();
            if (data.success) {
                setDetail(data.detail);
            } else {
                throw new Error(data.message || '상세 내용을 가져오지 못했습니다.');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [bbsId, nttId]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    return (
        <div>
            
            <div className="ComDetailContainer">
                <div className="DetailHeaderNav">
                    <button className="BackButton" onClick={() => navigate(-1)}>
                        <ArrowLeft size={20} /> 목록으로
                    </button>
                </div>
                
                {loading && (
                    <div className="StatusContainer"><Settings size={32} className="loading-spinner" /><span>상세 내용을 불러오는 중입니다...</span></div>
                )}

                {error && (
                     <div className="StatusContainer error"><AlertCircle size={32} /><span>오류가 발생했습니다: {error}</span></div>
                )}
                
                {!loading && !error && detail && (
                    <div className="DetailContentBox">
                        <div className="DetailHeader">
                            <h1>{detail.title}</h1>
                            <div className="DetailInfo">
                                <span><strong>작성자:</strong> {detail.author}</span>
                                <span><strong>등록일:</strong> {detail.date}</span>
                            </div>
                        </div>
                        
                        {/* 첨부파일이 있을 때만 섹션을 렌더링 */}
                        {detail.files && detail.files.length > 0 && (
                            <div className="FileAttachmentSection">
                                <h4><Paperclip size={16} /> 첨부파일</h4>
                                <ul>
                                    {detail.files.map((file, index) => (
                                        <li key={index}>
                                            <a href={file.link} target="_blank" rel="noopener noreferrer">{file.name}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div 
                            className="DetailBody"
                            dangerouslySetInnerHTML={{ __html: detail.contentHtml }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default ComDetail;