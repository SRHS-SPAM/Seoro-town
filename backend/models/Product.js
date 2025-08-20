// backend/models/Product.js

import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true }, // 상품 ID
    title: { type: String, required: true },
    content: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    authorId: { type: String, required: true, ref: 'User' }, // 판매자 User ID 참조
    authorName: { type: String }, // 판매자 이름 (스냅샷)
    imageUrl: { type: String, default: null }, // 이미지 URL
    createdAt: { type: Date, default: Date.now }
}, { _id: false });

const Product = mongoose.model('Product', ProductSchema);
export default Product;