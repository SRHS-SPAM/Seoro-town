// src/page/MarketDetail.js (전체 코드 - 채팅 시작 기능 최종)

import './MarketDetail.css';
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import { AuthContext } from '../context/AuthContext';
import MarketWriteModal from './MarketWriteModal';
import { User } from 'lucide-react';

function MarketDetail() {
    const { productId } = useParams();
    const navigate = useNavigate();
    const { user, token } = useContext(AuthContext);
    
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const isMyProduct = product && user && product.authorId === user.id;

    const fetchProduct = async () => {
        try {
            const response = await fetch(`http://localhost:3001/api/market/${productId}`);
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

    const handleChatStart = async () => {
        if (!token) {
            alert('로그인이 필요합니다.');
            navigate('/login');
            return;
        }
        try {
            const response = await fetch('http://localhost:3001/api/chat/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ productId: product.id })
            });
            const data = await response.json();
            if (data.success) {
                navigate(`/chat/${data.roomId}`);
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            alert(`채팅 시작 실패: ${err.message}`);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('정말로 이 상품을 삭제하시겠습니까?')) {
            return;
        }
        try {
            const response = await fetch(`http://localhost:3001/api/market/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                alert('상품이 삭제되었습니다.');
                navigate('/market');
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            alert(`삭제 실패: ${err.message}`);
        }
    };
    
    const handleEdit = () => {
        setIsEditModalOpen(true);
    };

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
            <Navbar />
            <div className="DetailContainer">
                <div className="ProductImageLarge">
                    <img src={`http://localhost:3001${product.imageUrl}`} alt={product.title} />
                </div>
                <div className="ProductDetails">
                    {isMyProduct && (
                        <div className="ActionButtons">
                            <button onClick={handleEdit} className="ActionButton">수정</button>
                            <button onClick={handleDelete} className="ActionButton delete">삭제</button>
                        </div>
                    )}
                    <h1 className="ProductTitleLarge">{product.title}</h1>
                    <p className="ProductPriceLarge">{formatPrice(product.price)}원</p>
                    <p className="ProductDescription">{product.content}</p>
                    
                    {!isMyProduct && (
                        <button className="ChatButton" onClick={handleChatStart}>채팅하기</button>
                    )}
                    
                    <div className="SellerInfo">
                        <div className="SellerAvatar">
                            {product.authorProfileImage ? (
                                <img src={`http://localhost:3001${product.authorProfileImage}`} alt={product.authorName} />
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