// backend/routes/market.js (전체 코드 - 카테고리 필터링 포함)

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../utils/upload.js';
import { readMarket, writeMarket } from '../utils/fileHandlers.js';

const router = express.Router();

// (GET) /api/market - 모든 상품 목록 가져오기 (검색 및 카테고리 필터링 기능 추가)
router.get('/', async (req, res) => {
    try {
        const searchTerm = req.query.search || '';
        const category = req.query.category || '전체';
        const allProducts = await readMarket();
        
        // 1차: 검색어 필터링
        const searchedProducts = searchTerm
            ? allProducts.filter(product => 
                product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.content.toLowerCase().includes(searchTerm.toLowerCase())
              )
            : allProducts;

        // 2차: 카테고리 필터링
        const categorizedProducts = (category && category !== '전체')
            ? searchedProducts.filter(product => product.category === category)
            : searchedProducts;

        res.status(200).json({ success: true, products: categorizedProducts.reverse() });

    } catch (error) {
        console.error("상품 목록 조회 오류:", error);
        res.status(500).json({ success: false, message: '상품 목록을 불러오는 중 오류가 발생했습니다.' });
    }
});

// (POST) /api/market - 새 상품 등록하기
router.post('/', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const { category, title, price, content } = req.body;
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
        const authorId = req.user.id;
        const authorName = req.user.username;

        if (!title || !price || !content || !imageUrl) {
            return res.status(400).json({ success: false, message: '모든 필드를 입력해주세요.' });
        }

        const products = await readMarket();
        
        const newProduct = {
            id: Date.now(),
            category,
            title,
            price: parseInt(price),
            content,
            imageUrl,
            authorId,
            authorName,
            createdAt: new Date().toISOString()
        };

        products.push(newProduct);
        await writeMarket(products);

        res.status(201).json({ success: true, message: '상품이 성공적으로 등록되었습니다.', product: newProduct });

    } catch (error) {
        console.error("상품 등록 오류:", error);
        res.status(500).json({ success: false, message: '상품 등록 중 오류가 발생했습니다.' });
    }
});

// (GET) /api/market/:productId - 특정 상품 상세 정보 가져오기
router.get('/:productId', async (req, res) => {
    try {
        const products = await readMarket();
        const productId = parseInt(req.params.productId);
        const product = products.find(p => p.id === productId);

        if (product) {
            res.status(200).json({ success: true, product: product });
        } else {
            res.status(404).json({ success: false, message: '상품을 찾을 수 없습니다.' });
        }
    } catch (error) {
        console.error("상품 상세 조회 오류:", error);
        res.status(500).json({ success: false, message: '상품 정보를 불러오는 중 오류가 발생했습니다.' });
    }
});

// (DELETE) /api/market/:productId - 특정 상품 삭제하기
router.delete('/:productId', authenticateToken, async (req, res) => {
    try {
        const products = await readMarket();
        const productId = parseInt(req.params.productId);
        const productIndex = products.findIndex(p => p.id === productId);

        // 상품이 존재하지 않으면
        if (productIndex === -1) {
            return res.status(404).json({ success: false, message: '삭제할 상품을 찾을 수 없습니다.' });
        }

        // 본인이 쓴 글이 맞는지 확인 (중요!)
        if (products[productIndex].authorId !== req.user.id) {
            return res.status(403).json({ success: false, message: '삭제 권한이 없습니다.' });
        }

        // 배열에서 해당 상품 제거
        products.splice(productIndex, 1);
        await writeMarket(products);

        res.status(200).json({ success: true, message: '상품이 삭제되었습니다.' });

    } catch (error) {
        console.error("상품 삭제 오류:", error);
        res.status(500).json({ success: false, message: '상품 삭제 중 오류가 발생했습니다.' });
    }
});


// (PUT) /api/market/:productId - 특정 상품 수정하기
// 참고: PUT은 전체를 교체, PATCH는 일부만 변경. 여기서는 간단히 PUT 사용
router.put('/:productId', authenticateToken, upload.single('image'), async (req, res) => {
    try {
        const { category, title, price, content } = req.body;
        const products = await readMarket();
        const productId = parseInt(req.params.productId);
        const productIndex = products.findIndex(p => p.id === productId);

        if (productIndex === -1) {
            return res.status(404).json({ success: false, message: '수정할 상품을 찾을 수 없습니다.' });
        }

        if (products[productIndex].authorId !== req.user.id) {
            return res.status(403).json({ success: false, message: '수정 권한이 없습니다.' });
        }

        // 기존 정보에 새로운 정보 덮어쓰기
        const updatedProduct = {
            ...products[productIndex], // id, authorId, createdAt 등은 그대로 유지
            category: category || products[productIndex].category,
            title: title || products[productIndex].title,
            price: price ? parseInt(price) : products[productIndex].price,
            content: content || products[productIndex].content,
            // 새 이미지가 업로드되었으면 URL을 바꾸고, 아니면 기존 URL 유지
            imageUrl: req.file ? `/uploads/${req.file.filename}` : products[productIndex].imageUrl
        };

        products[productIndex] = updatedProduct;
        await writeMarket(products);

        res.status(200).json({ success: true, message: '상품이 수정되었습니다.', product: updatedProduct });

    } catch (error) {
        console.error("상품 수정 오류:", error);
        res.status(500).json({ success: false, message: '상품 수정 중 오류가 발생했습니다.' });
    }
});

export default router;