// backend/routes/chat.js (Fixed and Optimized)

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import ChatMessage from '../models/ChatMessage.js';
import ChatRoom from '../models/ChatRoom.js';
import Product from '../models/Product.js';

const router = express.Router();

// --- 채팅방 시작 또는 기존 채팅방 찾기 ---
router.post('/start', authenticateToken, async (req, res) => {
    try {
        const { productId } = req.body;
        const buyerId = req.user._id; // Use the actual ObjectId

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: '상품을 찾을 수 없습니다.' });
        }

        if (product.status === 'sold') {
            return res.status(400).json({ success: false, message: '이미 판매가 완료된 상품입니다.' });
        }

        const sellerId = product.authorId; // This is an ObjectId
        
        if (buyerId.equals(sellerId)) {
            return res.status(400).json({ success: false, message: '자신과의 채팅은 시작할 수 없습니다.' });
        }

        // Find existing room with an efficient query
        let room = await ChatRoom.findOne({
            productId: productId,
            buyerId: buyerId,
            sellerId: sellerId
        });

        if (room) {
            // Room already exists
            return res.status(200).json({ success: true, roomId: room.id });
        } else {
            // Create a new room
            const newRoom = new ChatRoom({
                productId: productId,
                buyerId: buyerId,
                sellerId: sellerId,
                participants: [buyerId, sellerId]
            });
            await newRoom.save();
            return res.status(201).json({ success: true, roomId: newRoom.id });
        }
    } catch (error) {
        console.error("채팅방 시작 오류:", error);
        res.status(500).json({ success: false, message: '채팅방을 시작하는 중 오류가 발생했습니다.' });
    }
});

// --- 특정 채팅방의 메시지 목록 조회 ---
router.get('/:roomId/messages', authenticateToken, async (req, res) => {
    try {
        const { roomId } = req.params;
        const userId = req.user._id;

        const room = await ChatRoom.findById(roomId).populate('participants', 'username profileImage');

        if (!room || !room.participants.some(p => p._id.equals(userId))) {
            return res.status(403).json({ success: false, message: '채팅방에 접근할 권한이 없습니다.' });
        }
        
        const messages = await ChatMessage.find({ roomId: room._id }).sort({ createdAt: 1 });
        const product = await Product.findById(room.productId);

        res.status(200).json({ 
            success: true, 
            messages: messages, 
            roomInfo: room,
            productStatus: product ? product.status : 'deleted'
        });
    } catch (error) {
        console.error("메시지 로딩 오류:", error);
        res.status(500).json({ success: false, message: '메시지를 불러오는 중 오류가 발생했습니다.' });
    }
});

// --- 나의 채팅방 목록 조회 ---
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user._id;

        // Find all rooms where the user is a participant
        const rooms = await ChatRoom.find({ participants: userId })
            .populate('participants', 'username profileImage')
            .populate('productId', 'title imageUrl')
            .sort({ updatedAt: -1 });

        const roomsWithLastMessage = await Promise.all(rooms.map(async (room) => {
            const lastMessage = await ChatMessage.findOne({ roomId: room._id }).sort({ createdAt: -1 });
            return { ...room.toObject(), lastMessage: lastMessage ? lastMessage.toObject() : null };
        }));
        
        res.status(200).json({ success: true, chatRooms: roomsWithLastMessage });

    } catch (error) {
        console.error("채팅 목록 로딩 오류:", error);
        res.status(500).json({ success: false, message: '채팅 목록을 불러오는 중 오류가 발생했습니다.' });
    }
});

export default router;