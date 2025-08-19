// src/page/MarketWriteModal.js (전체 코드 - 카테고리 이미지 포함)

import './MarketWriteModal.css';
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { X } from 'lucide-react';

function MarketWriteModal({ isOpen, onClose, onSuccess, productToEdit }) {
    const { token } = useContext(AuthContext);
    
    const isEditMode = !!productToEdit;

    const [step, setStep] = useState(1);
    const [category, setCategory] = useState('');
    const [title, setTitle] = useState('');
    const [price, setPrice] = useState('');
    const [content, setContent] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const categories = [
        { name: '교과서',   image: '/icons/textbook.png' },
        { name: '문제집',   image: '/icons/workbook.png' },
        { name: '의류',     image: '/icons/clothes.png' },
        { name: '쿠폰',     image: '/icons/coupon.png' },
        { name: '기계부품', image: '/icons/parts.png' },
        { name: '전자기기', image: '/icons/device.png' }
    ];

    useEffect(() => {
        if (isEditMode) {
            setStep(2);
            setTitle(productToEdit.title);
            setPrice(productToEdit.price);
            setContent(productToEdit.content);
            setCategory(productToEdit.category);
        } else {
            resetState();
        }
    }, [isOpen, productToEdit, isEditMode]);

    const resetState = () => {
        setStep(1);
        setCategory('');
        setTitle('');
        setPrice('');
        setContent('');
        setImageFile(null);
        setIsSubmitting(false);
    };

    const handleClose = () => {
        resetState();
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('category', category);
        formData.append('title', title);
        formData.append('price', price);
        formData.append('content', content);
        if (imageFile) {
            formData.append('image', imageFile);
        }

        const url = isEditMode 
            ? `http://localhost:3001/api/market/${productToEdit.id}` 
            : 'http://localhost:3001/api/market';
        const method = isEditMode ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });
            const data = await response.json();
            if (data.success) {
                alert(isEditMode ? '게시글이 수정되었습니다.' : '게시글이 등록되었습니다.');
                resetState();
                onSuccess();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            alert(`오류: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="PopupOverlay">
            <div className="WritePopup">
                <div className="PopupHeader">
                    <h2>{isEditMode ? '게시글 수정' : ' '}</h2>
                    <button className="CloseButton" onClick={handleClose}><X size={24} /></button>
                </div>

                {step === 1 && !isEditMode ? (
                    <div className="PopupContent">
                        <p>어떠한 글의 내용을 작성하실건가요?</p>
                        <div className="CategoryGrid">
                            {categories.map(cat => (
                                <div 
                                    key={cat.name} 
                                    className={`CategoryBox ${category === cat.name ? 'selected' : ''}`} 
                                    onClick={() => setCategory(cat.name)}
                                >
                                    <img src={cat.image} alt={cat.name} className="CategoryIcon" />
                                    <span className="CategoryText">{cat.name}</span>
                                </div>
                            ))}
                        </div>
                        <button className="SubmitButton" disabled={!category} onClick={() => setStep(2)}>다음</button>
                    </div>
                ) : (
                    <div className="PopupContent">
                        <form onSubmit={handleSubmit} className="WriteForm">
                            <input type="text" placeholder="제목" className="FormInput" value={title} onChange={(e) => setTitle(e.target.value)} required />
                             <input type="number" placeholder="가격 (숫자만 입력)" className="FormInput" value={price} onChange={(e) => setPrice(e.target.value)} required />
                            <textarea placeholder="글쓰기" className="FormTextarea" value={content} onChange={(e) => setContent(e.target.value)} required />
                            <div>
                                <label>{isEditMode ? "새 이미지로 변경 (선택): " : "이미지 첨부: "}</label>
                                <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
                            </div>
                            <button type="submit" className="SubmitButton" disabled={isSubmitting}>{isSubmitting ? '처리 중...' : (isEditMode ? '수정 완료' : '등록')}</button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}

export default MarketWriteModal;