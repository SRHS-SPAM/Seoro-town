// src/page/Market.js (전체 코드)

import './Market.css';
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

import MarketWriteModal from './MarketWriteModal';
import { Search } from 'lucide-react';
import getImageUrl from '../utils/imageUrl';

const ProductItem = ({ product, user, token, onDelete }) => {
    const navigate = useNavigate();
    const formatPrice = (price) => price ? price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : '가격 미정';

    const handleClick = () => {
        if (product.status !== 'sold') {
            navigate(`/market/${product._id}`);
        }
    };

    const handleDelete = async (e) => {
        e.stopPropagation(); // 부모 요소의 onClick 이벤트 방지
        if (window.confirm('정말로 이 상품을 삭제하시겠습니까?')) {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/market/${product._id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                if (response.ok && data.success) {
                    alert('상품이 삭제되었습니다.');
                    onDelete(product._id); // 부모 컴포넌트에 삭제 알림
                } else {
                    throw new Error(data.message || '삭제에 실패했습니다.');
                }
            } catch (error) {
                console.error('상품 삭제 오류:', error);
                alert(`오류: ${error.message}`);
            }
        }
    };

    return (
        <div 
            className={`ProductItem ${product.status === 'sold' ? 'sold' : ''}`} 
            onClick={handleClick}
        >
            <div className="ProductImageContainer">
                <img src={getImageUrl(product.imageUrl)} alt={product.title} />
            </div>
            <div className="ProductInfo">
                <h4 className="ProductTitle">{product.title}</h4>
                <p className="ProductPrice">{formatPrice(product.price)}원</p>
            </div>
            {user && user.role === 'admin' && (
                <button onClick={handleDelete} className="AdminDeleteButton">X</button>
            )}
        </div>
    );
};

function Market() {
    const { isLoggedIn, user, token } = useContext(AuthContext);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedTerm, setDebouncedTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('전체');

    const categories = ['전체', '교과서', '문제집', '의류', '쿠폰', '기계부품', '전자기기'];

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedTerm(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/market?search=${debouncedTerm}&category=${selectedCategory}`);
                if (!response.ok) throw new Error('데이터를 불러오는데 실패했습니다.');
                const data = await response.json();
                if (data.success) {
                    setProducts(data.products || []);
                } else {
                    throw new Error(data.message || '알 수 없는 오류');
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [debouncedTerm, selectedCategory]);

    const handleWriteSuccess = () => {
        setIsModalOpen(false);
        // 새 상품 등록 후 목록을 다시 불러오도록 수정
        const fetchProducts = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/api/market?search=${debouncedTerm}&category=${selectedCategory}`);
                if (!response.ok) throw new Error('데이터를 불러오는데 실패했습니다.');
                const data = await response.json();
                if (data.success) {
                    setProducts(data.products || []);
                } else {
                    throw new Error(data.message || '알 수 없는 오류');
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    };

    const handleDeleteProduct = (deletedProductId) => {
        setProducts(prevProducts => prevProducts.filter(p => p._id !== deletedProductId));
    };

    return (
        <div>
            
            <div className="MarketContainer">
                <div className="HeaderActions">
                    <div className="SearchBox">
                         <div className="SearchPrefix">중고거래</div>
                         <div className="SearchDivider"></div>
                         <input 
                            type="text" 
                            className="SearchInput" 
                            placeholder="검색어를 입력하세요!"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                         />
                         <button className="SearchButton"><Search size={22} /></button>
                    </div>
                    {isLoggedIn && <button className="WriteButton" onClick={() => setIsModalOpen(true)}>상품등록</button>}
                </div>

                <div className="CategoryFilter">
                    {categories.map(category => (
                        <button 
                            key={category}
                            className={`CategoryButton ${selectedCategory === category ? 'active' : ''}`}
                            onClick={() => setSelectedCategory(category)}
                        >
                            {category}
                        </button>
                    ))}
                </div>
                
                {loading && <p>로딩 중...</p>}
                {error && <p>오류: {error}</p>}
                {!loading && !error && (
                    <div className="ProductGrid">
                        {products.length > 0 ? products.map(product => (
                            <ProductItem 
                                key={product._id} 
                                product={product} 
                                user={user}
                                token={token}
                                onDelete={handleDeleteProduct}
                            />
                        )) : <p>{debouncedTerm || selectedCategory !== '전체' ? `조건에 맞는 상품이 없습니다.` : "등록된 상품이 없습니다."}</p>}
                    </div>
                )}
            </div>

            <MarketWriteModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSuccess={handleWriteSuccess} 
            />
        </div>
    );
}

export default Market;