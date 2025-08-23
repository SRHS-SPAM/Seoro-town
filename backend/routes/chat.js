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

        const product = await Product.findOne({ id: productId }); // 수정된 라인
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
            res.status(200).json({ success: true, roomId: existingRoom.id });
            console.log(`[CHAT] Existing room ID sent: ${existingRoom.id}`);
        } else {
            const allUsers = await User.find();
            const buyer = allUsers.find(u => u.id == buyerId);
            const seller = allUsers.find(u => u.id == sellerId);

            if (!buyer || !seller) {
                return res.status(404).json({ success: false, message: '채팅 상대를 찾을 수 없습니다.' });
            }

            const newRoom = {
                id: `${productId}-${buyerId}-${sellerId}`,
                roomId: `${productId}-${buyerId}-${sellerId}`,
                productId: productId,
                productTitle: product.title,
                productImageUrl: product.imageUrl,
                participants: [
                    { id: buyer.id, username: buyer.username, profileImage: buyer.profileImage },
                    { id: seller.id, username: seller.username, profileImage: seller.profileImage }
                ],
                createdAt: new Date().toISOString()
            };
            await ChatRoom.create(newRoom);

            res.status(201).json({ success: true, roomId: newRoom.id });
            console.log(`[CHAT] New room ID sent: ${newRoom.id}`);
        }
    } catch (error) {
        console.error("채팅방 시작 오류:", error);
        res.status(500).json({ success: false, message: '채팅방을 시작하는 중 오류 발생' });
    }
});

router.get('/:roomId/messages', authenticateToken, async (req, res) => {
    const { roomId } = req.params;
    const userId = req.user.id;

    console.log(`[CHAT-GET] Received roomId: ${roomId}, userId: ${userId}`);

    try {
        const room = await ChatRoom.findOne({ id: roomId }); // 'id' 필드를 사용하도록 수정

        console.log(`[CHAT-GET] Found room: ${room ? room.id : 'null'}`);
        console.log(`[CHAT-GET] Room participants: ${room ? JSON.stringify(room.participants) : 'null'}`);
        console.log(`[CHAT-GET] User in participants: ${room ? room.participants.some(p => p.id == userId) : 'null'}`);

        if (!room || !room.participants.some(p => p.id == userId)) {
            return res.status(403).json({ success: false, message: '채팅방에 접근할 권한이 없습니다.' });
        }
        
        const product = await Product.findOne({ id: room.productId }); // findById 대신 findOne 사용
        
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
            const lastMessage = await ChatMessage.findOne({ roomId: room.id }).sort({ createdAt: -1 }); // room.roomId 대신 room.id 사용
            return { ...room.toObject(), lastMessage: lastMessage ? lastMessage.toObject() : null };
        }));
        
        res.status(200).json({ success: true, chatRooms: roomsWithLastMessage.reverse() });

    } catch (error) {
        console.error("채팅 목록 로딩 오류:", error);
        res.status(500).json({ success: false, message: '채팅 목록을 불러오는 중 오류 발생' });
    }
});

export default router;