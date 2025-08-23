import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    authorName: {
        type: String,
        required: true
    },
    authorId: {
        type: String,
        required: true,
        ref: 'User'
    },
    imageUrl: {
        type: String,
        default: null
    },
    category: {
        type: String
    },
    status: {
        type: String,
        default: 'selling'
    }
}, {
    timestamps: true
});

const Product = mongoose.model('Product', ProductSchema);
export default Product;
