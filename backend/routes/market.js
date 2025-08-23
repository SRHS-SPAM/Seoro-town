// backend/routes/market.js (전체 코드)

import express from 'express';
import multer from 'multer';
import path from 'path'; 
import fs from 'fs/promises';
import User from '../models/User.js';         
import Product from '../models/Product.js';   

import { authenticateToken } from '../middleware/auth.js';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // This path should be relative to the project root or an absolute path
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const searchTerm = req.query.search || '';
        const category = req.query.category || '전체';
        
        // Fetch only active products
        const allProducts = await Product.find({
            $or: [
                { deletionTimestamp: { $exists: false } },
                { deletionTimestamp: { $gt: Date.now() } }
            ]
        });

        const searchedProducts = searchTerm
            ? allProducts.filter(product =>
                product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.content.toLowerCase().includes(searchTerm.toLowerCase())
              )
            : allProducts;

        const categorizedProducts = (category && category !== '전체')
            ? searchedProducts.filter(product => product.category === category)
            : searchedProducts;

        res.status(200).json({ success: true, products: categorizedProducts.reverse() });
    } catch (error) {
        console.error('상품 목록 조회 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

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
            category,
            title: title.trim(),
            price: parseInt(price, 10),
            content: content.trim(),
            imageUrl,
            authorId,
            authorName,
            createdAt: new Date().toISOString(),
            status: 'selling' // 기본 상태는 '판매중'
        });

        await newProduct.save(); // <-- 이 라인이 누락되어 있었습니다!

        res.status(201).json({ success: true, message: '상품이 성공적으로 등록되었습니다.', product: newProduct });
    } catch (error) {
        console.error('상품 등록 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

router.get('/:productId', async (req, res) => {
    try {
        const productId = req.params.productId;
        // ✨ MongoDB 쿼리: 특정 상품 조회
        let product = await Product.findOne({ id: productId });
        if (!product) {
            return res.status(404).json({ success: false, message: '상품을 찾을 수 없습니다.' });
        }

        // 판매자 정보 (이름, 프로필 이미지) 주입 (Product 스키마에 스냅샷으로 저장되어 있음)
        // product 객체는 이미 Mongoose 문서이므로 toObject() 불필요.
        
        res.json({ success: true, product: product });
    } catch (error) {
        console.error('특정 상품 조회 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

router.delete('/:productId', authenticateToken, async (req, res) => {
    try {
        const productId = req.params.productId;

        // ✨ MongoDB 쿼리: 상품 조회 (권한 확인용)
        const product = await Product.findOne({ id: productId });

        if (!product) {
            return res.status(404).json({ success: false, message: '삭제할 상품을 찾을 수 없습니다.' });
        }
        
        const userIsAdmin = isAdmin(req.user); // Assuming isAdmin is defined and works
        const isAuthor = product.authorId === req.user.id;

        if (!userIsAdmin && !isAuthor) {
            return res.status(403).json({ success: false, message: '삭제 권한이 없습니다.' });
        }

        // ✨ MongoDB 쿼리: 상품 삭제
        const result = await Product.deleteOne({ id: productId });

        if (result.deletedCount === 0) { // 삭제된 문서가 없으면
            return res.status(404).json({ success: false, message: '상품을 찾을 수 없습니다.' });
        }
        
        res.status(200).json({ success: true, message: '상품이 삭제되었습니다.' });
    } catch (error) {
        console.error("상품 삭제 오류:", error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

router.put('/:productId', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const { category, title, price, content, existingImageUrl } = req.body;
        const productId = req.params.productId;

        // ✨ MongoDB 쿼리: 상품 조회
        let product = await Product.findOne({ id: productId });
        if (!product) {
            return res.status(404).json({ success: false, message: '수정할 상품을 찾을 수 없습니다.' });
        }
        
        if (product.authorId !== req.user.id) { // Use product directly
            return res.status(403).json({ success: false, message: '수정 권한이 없습니다.' });
        }

        // Determine new image URL
        let newImageUrl = existingImageUrl;
        if (req.file) {
            newImageUrl = `/uploads/${req.file.filename}`;
        } else if (existingImageUrl === 'null') { // If frontend explicitly sends 'null' for existing image
            newImageUrl = null;
        }

        // ✨ MongoDB 쿼리: 상품 업데이트 (findByIdAndUpdate 대신 findOne하고 수동 업데이트)
        product.set({
            category: category || product.category,
            title: title ? title.trim() : product.title,
            price: price ? parseInt(price, 10) : product.price,
            content: content ? content.trim() : product.content,
            imageUrl: newImageUrl
        });
        await product.save(); // 변경사항 저장

        res.status(200).json({ success: true, message: '상품이 수정되었습니다.', product: product }); // Return updated product
    } catch (error) {
        console.error('상품 수정 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

router.patch('/:productId/sold', authenticateToken, async (req, res) => {
    try {
        const productId = req.params.productId; // productId is already a string

        // ✨ MongoDB 쿼리: 상품 조회
        const product = await Product.findOne({ id: productId });

        if (!product) {
            return res.status(404).json({ success: false, message: '상품을 찾을 수 없습니다.' });
        }
        if (product.authorId !== req.user.id) {
            return res.status(403).json({ success: false, message: '권한이 없습니다.' });
        }

        product.status = 'sold';
        product.deletionTimestamp = Date.now() + 3 * 24 * 60 * 60 * 1000; 

        await product.save(); // Save the updated product

        res.status(200).json({ success: true, message: '상품이 판매 완료 처리되었습니다.', product: product });
    } catch (error) {
        console.error("판매 완료 처리 오류:", error);
        res.status(500).json({ success: false, message: '처리 중 오류가 발생했습니다.' });
    }
});

export default router;