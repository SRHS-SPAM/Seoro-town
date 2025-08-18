import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import './Com.css';
import { Settings, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

function Com() {
    const [comList, setComList] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isLastPage, setIsLastPage] = useState(false);
    const navigate = useNavigate();

    const fetchComData = useCallback(async (pageNum) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/com?page=${pageNum}`);
            if (!response.ok) throw new Error(`서버 응답 오류: ${response.status}`);
            const data = await response.json();
            if (data.success && Array.isArray(data.list)) {
                setComList(data.list);
                if (data.list.length < 10) setIsLastPage(true);
                else setIsLastPage(false);
            } else {
                throw new Error(data.message || '데이터를 받아오지 못했습니다.');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchComData(page);
    }, [page, fetchComData]);

    const handlePrevPage = () => setPage(p => Math.max(1, p - 1));
    const handleNextPage = () => { if (!isLastPage) setPage(p => p + 1); };

    // ✨ 상세 페이지로 이동하는 핸들러
    const handleTitleClick = (nttId) => {
        if (nttId) {
            navigate(`/com-detail/${nttId}`);
        } else {
            alert('상세보기를 지원하지 않는 게시글입니다.');
        }
    };

    return (
        <div>
            <Navbar />
            <div className="ComContainer">
                <div className="ComHeader"><h2>가정통신문</h2></div>
                <div className="ComContent">
                    {loading ? (
                        <div className="StatusContainer"><Settings size={32} className="loading-spinner" /><span>로딩 중...</span></div>
                    ) : error ? (
                        <div className="StatusContainer error"><AlertCircle size={32} /><span>오류: {error}</span></div>
                    ) : (
                        <>
                            <table className="ComTable">
                                <thead>
                                    <tr>
                                        <th className="num">번호</th>
                                        <th className="title">제목</th>
                                        <th className="author">작성자</th>
                                        <th className="date">등록일</th>
                                        <th className="views">조회수</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {comList.length > 0 ? comList.map((item, index) => (
                                        <tr key={item.nttId || index}>
                                            <td className="num">{item.num}</td>
                                            <td className="title" onClick={() => handleTitleClick(item.nttId)} style={{ cursor: item.nttId ? 'pointer' : 'default' }}>
                                                {item.title}
                                            </td>
                                            <td className="author">{item.author}</td>
                                            <td className="date">{item.date}</td>
                                            <td className="views">{item.views}</td>
                                        </tr>
                                    )) : (
                                        <tr><td colSpan="5">게시글이 없습니다.</td></tr>
                                    )}
                                </tbody>
                            </table>
                            <div className="Pagination">
                                <button onClick={handlePrevPage} disabled={page === 1}><ChevronLeft size={20} /> 이전</button>
                                <span>{page}</span>
                                <button onClick={handleNextPage} disabled={isLastPage}>다음 <ChevronRight size={20} /></button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
export default Com;