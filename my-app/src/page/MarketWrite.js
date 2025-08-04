import './MarketWrite.css';
import { useState } from 'react';
import { FaImage, FaVideo, FaTimes } from 'react-icons/fa';

function MarketWrite() {
    const [step, setStep] = useState(1);
    const [category, setCategory] = useState('');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    const categories = ['교과서', '문제집', '의류', '쿠폰', '기계부품', '전자기기'];

    if (step === 1) {
        return (
            <div className="write-container">
                <button className="close-btn"><FaTimes /></button>
                <h2 className="write-title">어떠한 글의 내용을 작성하실건가요?</h2>
                <div className="category-grid">
                    {categories.map((cat, idx) => (
                        <div
                            key={idx}
                            className={`category-item ${category === cat ? 'selected' : ''}`}
                            onClick={() => setCategory(cat)}
                        >
                            <img src={`/icons/${cat}.png`} alt={cat} />
                            <span>{cat}</span>
                        </div>
                    ))}
                </div>
                <button className="next-btn" onClick={() => setStep(2)} disabled={!category}>
                    다음
                </button>
            </div>
        );
    }

    return (
        <div className="write-container">
            <button className="close-btn"><FaTimes /></button>
            <div className="step2-input">
                <div className="title-bar">
                    <label className="title-label">제목</label>
                    <div className="upload-icons">
                        <FaImage className="upload-icon" />
                        <FaVideo className="upload-icon" />
                    </div>
                </div>
                <input
                    type="text"
                    className="title-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="제목을 입력하세요"
                />
                <textarea
                    className="content-input"
                    placeholder="글쓰기"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
            </div>
            <button className="submit-btn">등록</button>
        </div>
    );
}

export default MarketWrite;
