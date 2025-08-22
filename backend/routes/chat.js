// backend/routes/chat.js (최종 전체 코드)

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import ChatMessage from '../models/ChatMessage.js';
import ChatRoom from '../models/ChatRoom.js';
import Product from '../models/Product.js';
import User from '../models/User.js';


const router = express.Router();

router.post('/start', authenticateToken, async (req, res) => {
    try {
        const { productId } = req.body;
        const buyerId = req.user.id;

        const products = await Product.find();
        if (!product) {
            return res.status(404).json({ success: false, message: '상품을 찾을 수 없습니다.' });
        }

        if (product.status === 'sold') {
            return res.status(400).json({ success: false, message: '이미 판매가 완료된 상품입니다.' });
        }

        const sellerId = product.authorId;
        
        if (buyerId == sellerId) {
            return res.status(400).json({ success: false, message: '자신과의 채팅은 시작할 수 없습니다.' });
        }

        const chatRooms = await ChatRoom.find();
        
        let existingRoom = chatRooms.find(room => 
            room.productId == productId &&
            room.participants.some(p => p.id == buyerId) &&
            room.participants.some(p => p.id == sellerId)
        );

        if (existingRoom) {
            res.status(200).json({ success: true, roomId: existingRoom.roomId });
        } else {
            const allUsers = await User.find();
            const buyer = allUsers.find(u => u.id == buyerId);
            const seller = allUsers.find(u => u.id == sellerId);

            if (!buyer || !seller) {
                return res.status(404).json({ success: false, message: '채팅 상대를 찾을 수 없습니다.' });
            }

            const newRoom = {
                roomId: `${productId}-${buyerId}-${sellerId}`,
                productId: parseInt(productId),
                productTitle: product.title,
                productImageUrl: product.imageUrl,
                participants: [
                    { id: buyer.id, username: buyer.username, profileImage: buyer.profileImage },
                    { id: seller.id, username: seller.username, profileImage: seller.profileImage }
                ],
                createdAt: new Date().toISOString()
            };
            await ChatRoom.create(newRoom);

            res.status(201).json({ success: true, roomId: newRoom.roomId });
        }
    } catch (error) {
        console.error("채팅방 시작 오류:", error);
        res.status(500).json({ success: false, message: '채팅방을 시작하는 중 오류 발생' });
    }
});

router.get('/:roomId/messages', authenticateToken, async (req, res) => {
    const { roomId } = req.params;
    const userId = req.user.id;
    
    try {
        const room = await ChatRoom.findOne({ roomId });
        
        if (!room || !room.participants.some(p => p.id == userId)) {
            return res.status(403).json({ success: false, message: '채팅방에 접근할 권한이 없습니다.' });
        }
        
        const product = await Product.findById(room.productId);
        
        const roomMessages = await ChatMessage.find({ roomId }).sort({ createdAt: 1 });

        res.status(200).json({ 
            success: true, 
            messages: roomMessages, 
            roomInfo: room,
            productStatus: product ? product.status : 'deleted'
        });
    } catch (error) {
        console.error("메시지 로딩 오류:", error);
        res.status(500).json({ success: false, message: '메시지를 불러오는 중 오류 발생' });
    }
});

router.get('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        const allRooms = await ChatRoom.find();
        const myRooms = allRooms.filter(room => room.participants.some(p => p.id == userId));

        const roomsWithLastMessage = await Promise.all(myRooms.map(async (room) => {
            const lastMessage = await ChatMessage.findOne({ roomId: room.roomId }).sort({ createdAt: -1 });
            return { ...room.toObject(), lastMessage: lastMessage ? lastMessage.toObject() : null };
        }));
        
        res.status(200).json({ success: true, chatRooms: roomsWithLastMessage.reverse() });

    } catch (error) {
        console.error("채팅 목록 로딩 오류:", error);
        res.status(500).json({ success: false, message: '채팅 목록을 불러오는 중 오류 발생' });
    }
});

export default router;