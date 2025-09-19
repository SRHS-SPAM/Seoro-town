// backend/routes/market.js (Fixed)

import express from 'express';
import fs from 'fs/promises';
import User from '../models/User.js';         
import Product from '../models/Product.js';   

import { authenticateToken, isAdmin } from '../middleware/auth.js';
import { upload } from '../utils/upload.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const searchTerm = req.query.search || '';
        const category = req.query.category || '전체';
        
        const query = {
            $or: [
                { deletionTimestamp: { $exists: false } },
                { deletionTimestamp: { $gt: Date.now() } }
            ]
        };

        if (category && category !== '전체') {
            query.category = category;
        }

        if (searchTerm) {
            query.$text = { $search: searchTerm };
        }

        const products = await Product.find(query).sort({ createdAt: -1 });

        res.status(200).json({ success: true, products });
    } catch (error) {
        console.error('상품 목록 조회 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const { category, title, price, content } = req.body;
        const imageUrl = req.file ? req.file.path : null;
        
        if (!title || !price || !content || !category) {
            return res.status(400).json({ success: false, message: '모든 필수 필드를 입력해주세요.' });
        }
        
        const newProduct = new Product({
            category,
            title: title.trim(),
            price: parseInt(price, 10),
            content: content.trim(),
            imageUrl,
            authorId: req.user._id, // Use the actual ObjectId
            authorName: req.user.username,
            status: 'selling'
        });

        await newProduct.save();

        res.status(201).json({ success: true, message: '상품이 성공적으로 등록되었습니다.', product: newProduct });
    } catch (error) {
        console.error('상품 등록 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

router.get('/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        // .populate()를 사용해 'authorId'로 참조된 User 모델에서 사용자 정보를 가져옵니다.
        const product = await Product.findById(productId).populate('authorId');
        
        if (!product) {
            return res.status(404).json({ success: false, message: '상품을 찾을 수 없습니다.' });
        }

        // 프론트엔드에서 필요한 authorName과 authorProfileImage를 포함한 응답 객체를 생성합니다.
        const productResponse = {
            ...product.toObject(),
            authorName: product.authorId.username,
            authorProfileImage: product.authorId.profileImage
        };

        res.json({ success: true, product: productResponse });
    } catch (error) {
        console.error('특정 상품 조회 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

router.delete('/:productId', authenticateToken, async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ success: false, message: '삭제할 상품을 찾을 수 없습니다.' });
        }
        
        const userIsAdmin = isAdmin(req.user);
        const isAuthor = product.authorId.equals(req.user._id);

        if (!userIsAdmin && !isAuthor) {
            return res.status(403).json({ success: false, message: '삭제 권한이 없습니다.' });
        }

        await Product.findByIdAndDelete(productId);
        
        res.status(200).json({ success: true, message: '상품이 삭제되었습니다.' });
    } catch (error) {
        console.error("상품 삭제 오류:", error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

router.put('/:productId', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const { productId } = req.params;
        const { category, title, price, content } = req.body;

        let product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: '수정할 상품을 찾을 수 없습니다.' });
        }
        
        if (!product.authorId.equals(req.user._id)) {
            return res.status(403).json({ success: false, message: '수정 권한이 없습니다.' });
        }

        product.category = category || product.category;
        product.title = title ? title.trim() : product.title;
        product.price = price ? parseInt(price, 10) : product.price;
        product.content = content ? content.trim() : product.content;

        if (req.file) {
            product.imageUrl = req.file.path;
        }

        await product.save();

        res.status(200).json({ success: true, message: '상품이 수정되었습니다.', product });
    } catch (error) {
        console.error('상품 수정 오류:', error);
        res.status(500).json({ success: false, message: '서버 오류' });
    }
});

router.patch('/:productId/sold', authenticateToken, async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ success: false, message: '상품을 찾을 수 없습니다.' });
        }
        if (!product.authorId.equals(req.user._id)) {
            return res.status(403).json({ success: false, message: '권한이 없습니다.' });
        }

        product.status = 'sold';
        product.deletionTimestamp = Date.now() + 3 * 24 * 60 * 60 * 1000; 

        await product.save();

        res.status(200).json({ success: true, message: '상품이 판매 완료 처리되었습니다.', product });
    } catch (error) {
        console.error("판매 완료 처리 오류:", error);
        res.status(500).json({ success: false, message: '처리 중 오류가 발생했습니다.' });
    }
});

export default router;