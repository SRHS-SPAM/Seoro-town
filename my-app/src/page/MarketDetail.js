// src/page/MarketDetail.js (전체 코드)

import './MarketDetail.css';
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { AuthContext } from '../context/AuthContext';
import MarketWriteModal from './MarketWriteModal';
import getImageUrl from '../utils/imageUrl';
import { User, ArrowLeft } from 'lucide-react';

function MarketDetail() {
    const { productId } = useParams();
    const navigate = useNavigate();
    const { user, token } = useContext(AuthContext);
    
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const isMyProduct = product && user && product.authorId === user._id;

    const fetchProduct = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/market/${productId}`);
            if (!response.ok) throw new Error('상품 정보를 불러오지 못했습니다.');
            const data = await response.json();
            if (data.success) {
                setProduct(data.product);
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            setError(err.message);
        }
    };
    
    useEffect(() => {
        setLoading(true);
        setError(null);
        fetchProduct().finally(() => setLoading(false));
    }, [productId]);

    const handleMarkAsSold = async () => {
        if (!window.confirm('이 상품을 판매 완료 처리하시겠습니까? 3일 후에 자동으로 삭제됩니다.')) return;
        const toastId = toast.loading('처리 중...');
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/market/${productId}/sold`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                toast.success('판매 완료 처리되었습니다.', { id: toastId });
                setProduct(data.product);
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            toast.error(`처리 실패: ${err.message}`, { id: toastId });
        }
    };

    const handleSellerClick = () => {
        if (!product || !product.authorId) return;
        if (isMyProduct) {
            navigate('/Mypage');
        } else {
            navigate('/Mypage', { state: { userId: product.authorId } });
        }
    };

    const handleChatStart = async () => {
        if (!token) {
            toast.error('로그인이 필요합니다.');
            navigate('/login');
            return;
        }
        const toastId = toast.loading('채팅방 생성 중...');
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/chat/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ productId: product.id })
            });
            const data = await response.json();
            if (data.success) {
                if (data.roomId) {
                    toast.success('채팅방으로 이동합니다.', { id: toastId });
                    navigate(`/chat/${data.roomId}`);
                } else {
                    throw new Error('채팅방 ID를 받지 못했습니다.');
                }
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            toast.error(`채팅 시작 실패: ${err.message}`, { id: toastId });
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('정말로 이 상품을 삭제하시겠습니까?')) return;
        const toastId = toast.loading('삭제 중...');
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/market/${productId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                toast.success('상품이 삭제되었습니다.', { id: toastId });
                navigate('/market');
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            toast.error(`삭제 실패: ${err.message}`, { id: toastId });
        }
    };
    
    const handleEdit = () => setIsEditModalOpen(true);

    const handleEditSuccess = () => {
        setIsEditModalOpen(false);
        setLoading(true);
        setError(null);
        fetchProduct().finally(() => setLoading(false));
    };

    if (loading) return <div>로딩 중...</div>;
    if (error) return <div>오류: {error}</div>;
    if (!product) return <div>상품을 찾을 수 없습니다.</div>;

    const formatPrice = (price) => price ? price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : '가격 미정';

    return (
        <div>
            
            <div className="DetailNav">
                <button className="BackButton" onClick={() => navigate('/market')}>
                    <ArrowLeft size={20} />
                    <span>목록으로 돌아가기</span>
                </button>
            </div>
            <div className="DetailContainer">
                <div className="ProductImageLarge">
                    <img src={getImageUrl(product.imageUrl)} alt={product.title} />
                    {product.status === 'sold' && <div className="ProductStatus">판매 완료</div>}
                </div>
                <div className="ProductDetails">
                    {isMyProduct && (
                        <div className="ActionButtons">
                            {product.status !== 'sold' && (
                                <>
                                    <button onClick={handleEdit} className="ActionButton">수정</button>
                                    <button onClick={handleMarkAsSold} className="ActionButton sold">판매 완료</button>
                                </>
                            )}
                            <button onClick={handleDelete} className="ActionButton delete">삭제</button>
                        </div>
                    )}
                    <h1 className="ProductTitleLarge">{product.title}</h1>
                    <p className="ProductPriceLarge">{formatPrice(product.price)}원</p>
                    <p className="ProductDescription">{product.content}</p>
                    
                    {!isMyProduct && product.status !== 'sold' && (
                        <button className="ChatButton" onClick={handleChatStart}>채팅하기</button>
                    )}
                    
                    <div className="SellerInfo" onClick={handleSellerClick} style={{ cursor: 'pointer' }}>
                        <div className="SellerAvatar">
                            {product.authorProfileImage ? (
                                <img src={getImageUrl(product.authorProfileImage)} alt={product.authorName} />
                            ) : (
                                <User size={32} />
                            )}
                        </div>
                        <div>
                            <span className="SellerName">{product.authorName}</span>
                        </div>
                    </div>
                </div>
            </div>
            <MarketWriteModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSuccess={handleEditSuccess}
                productToEdit={product}
            />
        </div>
    );
}

export default MarketDetail;