// backend/routes/market.js (MongoDB 연동 최종 버전)

import express from 'express';
import multer from 'multer';
import path from 'path'; 
import fs from 'fs/promises';
// ✨✨✨ Mongoose 모델 임포트 ✨✨✨
import User from '../models/User.js';         // User 모델 (판매자 정보 조회용)
import Product from '../models/Product.js';   // Product 모델

import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Multer 설정 (기존과 동일)
const storage = multer.diskStorage({
    destination: (req, file, cb) => { cb(null, 'uploads/'); },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}${ext}`);
    },
});
const upload = multer({ storage: storage });


// 모든 상품 목록 가져오기 (GET /api/market)
router.get('/', async (req, res) => {
    try {
        const { search, category } = req.query;
        let query = {}; // MongoDB 쿼리 객체

        // 필터링 및 검색 조건 동적 생성
        if (category && category !== '전체') {
            query.category = category;
        }
        if (search) {
            const searchTerm = new RegExp(search, 'i'); // 대소문자 구분 없는 정규식 검색
            query.$or = [
                { title: searchTerm },
                { content: searchTerm },
                { authorName: searchTerm } 
            ];
        }

        // ✨ MongoDB 쿼리: 상품 조회 및 최신순 정렬
        // deletionTimestamp가 미래이거나 null인 상품만 가져옴 (삭제 예정이 아닌 상품)
        query.$or = [
            { deletionTimestamp: { $exists: false } },
            { deletionTimestamp: null },
            { deletionTimestamp: { $gt: new Date() } } // 현재 시간보다 미래인 경우
        ];
        
        let products = await Product.find(query).sort({ createdAt: -1 });
        
        res.json({ success: true, products: products });
    } catch (error) {
        console.error('상품 목록 조회 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

// 새 상품 등록하기 (POST /api/market)
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const { category, title, price, content } = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
        const authorId = req.user.id;
        const authorName = req.user.username; // 현재 로그인한 사용자 정보에서 가져옴
        const authorProfileImage = req.user.profileImage; // 현재 로그인한 사용자 프로필 이미지 (스냅샷)

        if (!title || !price || !content || !category) {
            return res.status(400).json({ success: false, message: '모든 필수 필드를 입력해주세요.' });
        }
        
        const newProductId = Date.now().toString();

        // ✨ MongoDB: 새 상품 생성 및 저장
        const newProduct = new Product({
            id: newProductId,
            _id: newProductId, // _id도 id와 동일하게 설정
            category,
            title: title.trim(),
            price: parseInt(price, 10),
            content: content.trim(),
            imageUrl,
            authorId,
            authorName,
            authorProfileImage, // 스냅샷 저장
            createdAt: new Date(),
            status: 'selling' // 기본 상태는 '판매중'
        });
        await newProduct.save();

        res.status(201).json({ success: true, message: '상품이 성공적으로 등록되었습니다.', product: newProduct });
    } catch (error) {
        console.error('상품 등록 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

// 특정 상품 상세 정보 가져오기 (GET /api/market/:productId)
router.get('/:productId', async (req, res) => {
    try {
        const productId = req.params.productId;
        // ✨ MongoDB 쿼리: 특정 상품 조회
        let product = await Product.findOne({ id: productId });
        if (!product) {
            return res.status(404).json({ success: false, message: '상품을 찾을 수 없습니다.' });
        }
        
        res.json({ success: true, product: product });
    } catch (error) {
        console.error('특정 상품 조회 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

// 특정 상품 삭제하기 (DELETE /api/market/:productId)
router.delete('/:productId', authenticateToken, async (req, res) => {
    try {
        const productId = req.params.productId;

        // ✨ MongoDB 쿼리: 상품 조회
        const product = await Product.findOne({ id: productId });

        if (!product) {
            return res.status(404).json({ success: false, message: '삭제할 상품을 찾을 수 없습니다.' });
        }
        if (product.authorId !== req.user.id) {
            return res.status(403).json({ success: false, message: '삭제 권한이 없습니다.' });
        }

        // 이미지 파일 삭제
        const imageUrlToDelete = product.imageUrl;
        if (imageUrlToDelete && imageUrlToDelete.startsWith('/uploads/')) {
            const imagePath = path.join(__dirname, '..', imageUrlToDelete);
            try { await fs.unlink(imagePath); } catch (err) { if (err.code !== 'ENOENT') console.error('상품 이미지 삭제 오류:', err); }
        }

        // ✨ MongoDB 쿼리: 상품 삭제
        const result = await Product.deleteOne({ id: productId });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: '상품을 찾을 수 없습니다.' });
        }

        res.json({ success: true, message: '상품이 삭제되었습니다.' });
    } catch (error) {
        console.error("상품 삭제 오류:", error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

// 특정 상품 수정하기 (PUT /api/market/:productId)
router.put('/:productId', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const { category, title, price, content, existingImageUrl } = req.body;
        const productId = req.params.productId;

        // ✨ MongoDB 쿼리: 상품 조회
        let product = await Product.findOne({ id: productId });
        if (!product) {
            return res.status(404).json({ success: false, message: '수정할 상품을 찾을 수 없습니다.' });
        }
        if (product.authorId !== req.user.id) {
            return res.status(403).json({ success: false, message: '수정 권한이 없습니다.' });
        }

        let newImageUrl = existingImageUrl === 'null' ? null : (existingImageUrl || product.imageUrl);
        
        if (req.file) { 
            if (product.imageUrl && product.imageUrl.startsWith('/uploads/')) {
                const oldImagePath = path.join(__dirname, '..', product.imageUrl);
                try { await fs.unlink(oldImagePath); } catch (err) { if (err.code !== 'ENOENT') console.error('기존 이미지 삭제 오류 (수정):', err); }
            }
            newImageUrl = `/uploads/${req.file.filename}`;
        } 

        // ✨ MongoDB 쿼리: 상품 업데이트 (findByIdAndUpdate 대신 findOne하고 수동 업데이트)
        // Mongoose는 product.set() 후 product.save()를 호출하여 업데이트합니다.
        product.set({
            category: category || product.category,
            title: title ? title.trim() : product.title,
            price: price ? parseInt(price, 10) : product.price,
            content: content ? content.trim() : product.content,
            imageUrl: newImageUrl
        });
        await product.save(); // 변경사항 저장

        res.json({ success: true, message: '상품이 수정되었습니다.', product: product }); // 업데이트된 상품 객체 반환

    } catch (error) {
        console.error('상품 수정 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

// 판매 완료 처리 (PATCH /api/market/:productId/sold)
router.patch('/:productId/sold', authenticateToken, async (req, res) => {
    try {
        const productId = req.params.productId;

        // ✨ MongoDB 쿼리: 상품 조회
        let product = await Product.findOne({ id: productId });

        if (!product) {
            return res.status(404).json({ success: false, message: '상품을 찾을 수 없습니다.' });
        }
        if (product.authorId !== req.user.id) {
            return res.status(403).json({ success: false, message: '권한이 없습니다.' });
        }

        // ✨ MongoDB 쿼리: 상품 상태 업데이트
        product.status = 'sold';
        product.deletionTimestamp = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3일 후 삭제 예정
        await product.save();

        res.status(200).json({ success: true, message: '상품이 판매 완료 처리되었습니다.', product: product });
    } catch (error) {
        console.error("판매 완료 처리 오류:", error);
        res.status(500).json({ success: false, message: '처리 중 오류가 발생했습니다.' });
    }
});


export default router;