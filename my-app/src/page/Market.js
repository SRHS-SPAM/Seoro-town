// src/page/Market.js (전체 코드)

import './Market.css';
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

import MarketWriteModal from './MarketWriteModal';
import { Search } from 'lucide-react';

const ProductItem = ({ product }) => {
    const navigate = useNavigate();
    const formatPrice = (price) => price ? price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") : '가격 미정';

    const handleClick = () => {
        if (product.status !== 'sold') {
            navigate(`/market/${product.id}`);
        }
    };

    return (
        <div 
            className={`ProductItem ${product.status === 'sold' ? 'sold' : ''}`} 
            onClick={handleClick}
        >
            <div className="ProductImageContainer">
                <img src={product.imageUrl ? `http://localhost:3001${product.imageUrl}` : '/placeholder.png'} alt={product.title} />
            </div>
            <div className="ProductInfo">
                <h4 className="ProductTitle">{product.title}</h4>
                <p className="ProductPrice">{formatPrice(product.price)}원</p>
            </div>
        </div>
    );
};

function Market() {
    const { isLoggedIn } = useContext(AuthContext);
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
                const response = await fetch(`/api/market?search=${debouncedTerm}&category=${selectedCategory}`);
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
        setSearchTerm('');
        setSelectedCategory('전체');
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
                    {isLoggedIn && <button className="WriteButton" onClick={() => setIsModalOpen(true)}>글쓰기</button>}
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
                            <ProductItem key={product.id} product={product} />
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