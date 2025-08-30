import mongoose from 'mongoose';

const VerificationSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
    },
    code: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '3m', // This document will be automatically deleted after 3 minutes
    },
});

// Create a compound index for faster lookups and to allow one pending verification per email
VerificationSchema.index({ email: 1 }, { unique: true });

const Verification = mongoose.model('Verification', VerificationSchema);

export default Verification;
