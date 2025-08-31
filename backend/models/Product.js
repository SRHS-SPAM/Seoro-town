import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
    // id 필드 삭제
    title: { type: String, required: true },
    content: { type: String, required: true },
    price: { type: Number, required: true },
    authorName: { type: String, required: true },
    // authorId 타입을 ObjectId로 변경
    authorId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    imageUrl: { type: String, default: null },
    category: { type: String },
    status: { type: String, default: 'selling' }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

ProductSchema.index({ title: 'text', content: 'text' });

ProductSchema.virtual('id').get(function() {
    return this._id.toHexString();
});

const Product = mongoose.model('Product', ProductSchema);
export default Product;