import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    seller: {
        type: String,
        required: true
    },
    userId: {
        type: String, // User 모델의 커스텀 'id' 필드와 연결
        required: true,
        ref: 'User'
    },
    image: {
        type: String,
        default: null
    },
    isSold: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const Product = mongoose.model('Product', ProductSchema);
export default Product;
