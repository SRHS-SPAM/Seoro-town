// backend/routes/chat.js (MongoDB 연동 최종 버전)

import express from 'express';
import User from '../models/User.js';         // ✨ User 모델 임포트
import Product from '../models/Product.js';   // ✨ Product 모델 임포트 (상품 정보 조회용)
import ChatRoom from '../models/ChatRoom.js'; // ✨ ChatRoom 모델 임포트
import ChatMessage from '../models/ChatMessage.js'; // ✨ ChatMessage 모델 임포트

import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// --- 채팅방 시작 (POST /api/chat/start) ---
router.post('/start', authenticateToken, async (req, res) => {
    try {
        const { productId } = req.body;
        const buyerId = req.user.id;

        // ✨ MongoDB 쿼리: 상품 조회
        const product = await Product.findOne({ id: productId });
        if (!product) {
            return res.status(404).json({ success: false, message: '상품을 찾을 수 없습니다.' });
        }
        const sellerId = product.authorId;
        
        if (buyerId === sellerId) {
            return res.status(400).json({ success: false, message: '자신과의 채팅은 시작할 수 없습니다.' });
        }

        // ✨ MongoDB 쿼리: 기존 채팅방 조회 (참여자가 buyerId와 sellerId 모두 포함하는 방)
        // $all 연산자는 배열 필드에 특정 요소들을 모두 포함하는 문서를 찾습니다.
        let existingRoom = await ChatRoom.findOne({ 
            productId: product.id, // 특정 상품에 대한 채팅방
            participants: { $all: [buyerId, sellerId] } // 두 참여자 모두 포함
        });

        if (existingRoom) {
            res.status(200).json({ success: true, roomId: existingRoom.id });
        } else {
            // ✨ MongoDB 쿼리: 구매자 및 판매자 정보 조회
            const buyer = await User.findOne({ id: buyerId });
            const seller = await User.findOne({ id: sellerId });

            if (!buyer || !seller) {
                return res.status(404).json({ success: false, message: '채팅 상대를 찾을 수 없습니다.' });
            }

            const newRoomId = `${productId}-${buyerId}-${sellerId}`; // 고유 ID 생성

            // ✨ MongoDB: 새 채팅방 생성 및 저장
            const newRoom = new ChatRoom({
                id: newRoomId,
                _id: newRoomId, // _id도 id와 동일하게 설정
                productId: product.id,
                participants: [buyer.id, seller.id], // ID만 저장
                createdAt: new Date()
            });
            await newRoom.save();

            res.status(201).json({ success: true, roomId: newRoom.id });
        }
    } catch (error) {
        console.error("채팅방 시작 오류:", error);
        res.status(500).json({ success: false, message: '채팅방을 시작하는 중 오류가 발생했습니다.' });
    }
});

// --- 특정 채팅방 메시지 조회 (GET /api/chat/:roomId/messages) ---
router.get('/:roomId/messages', authenticateToken, async (req, res) => {
    const { roomId } = req.params;
    const userId = req.user.id;
    try {
        // ✨ MongoDB 쿼리: 채팅방 조회
        const room = await ChatRoom.findOne({ id: roomId });
        if (!room) {
             return res.status(404).json({ success: false, message: '채팅방을 찾을 수 없습니다.' });
        }
        // 사용자가 참여자인지 확인 (participants는 배열이므로 includes 사용)
        if (!room.participants.includes(userId)) {
            return res.status(403).json({ success: false, message: '채팅방에 접근할 권한이 없습니다.' });
        }

        // ✨ MongoDB 쿼리: 해당 방의 메시지 조회
        const roomMessages = await ChatMessage.find({ roomId: roomId }).sort({ timestamp: 1 }); // 오래된 메시지부터

        // roomInfo에 필요한 추가 정보 (productTitle, imageUrl 등)를 포함시키기 위해 product 조회
        let productInfo = null;
        if (room.productId) {
            productInfo = await Product.findOne({ id: room.productId }).select('title imageUrl');
        }

        // 참여자 정보도 상세화 (ID만 저장되어 있으므로 User 컬렉션에서 가져옴)
        const participantUsers = await User.find({ id: { $in: room.participants } }).select('id username profileImage');
        const roomInfoParticipants = participantUsers.map(p => ({ id: p.id, username: p.username, profileImage: p.profileImage }));

        const roomInfo = {
            id: room.id,
            productId: room.productId,
            productTitle: productInfo?.title,
            productImageUrl: productInfo?.imageUrl,
            participants: roomInfoParticipants,
            createdAt: room.createdAt
        };
        
        res.status(200).json({ success: true, messages: roomMessages, roomInfo: roomInfo });
    } catch (error) {
        console.error("메시지 불러오기 오류:", error);
        res.status(500).json({ success: false, message: '메시지를 불러오는 중 오류 발생' });
    }
});

// --- 내 채팅방 목록 조회 (GET /api/chat) ---
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    try {
        // ✨ MongoDB 쿼리: 사용자가 참여한 모든 채팅방 조회
        const myRooms = await ChatRoom.find({ participants: userId });
        
        const roomsWithLastMessage = [];
        for (const room of myRooms) {
            // ✨ MongoDB 쿼리: 각 방의 마지막 메시지 조회
            const lastMessage = await ChatMessage.findOne({ roomId: room.id }).sort({ timestamp: -1 }); // 최신 메시지 하나
            
            // Product 정보도 가져와서 roomInfo에 추가 (클라이언트 ChatListPage에서 사용)
            let productInfo = null;
            if (room.productId) {
                productInfo = await Product.findOne({ id: room.productId }).select('title imageUrl');
            }

            // 참여자 정보도 상세화
            const participantUsers = await User.find({ id: { $in: room.participants } }).select('id username profileImage');
            const roomInfoParticipants = participantUsers.map(p => ({ id: p.id, username: p.username, profileImage: p.profileImage }));

            roomsWithLastMessage.push({ 
                ...room.toObject(), // Mongoose 문서에서 일반 객체로 변환
                productTitle: productInfo?.title,
                productImageUrl: productInfo?.imageUrl,
                participants: roomInfoParticipants,
                lastMessage: lastMessage || null 
            });
        }
        // 최신 메시지 순으로 정렬
        roomsWithLastMessage.sort((a, b) => {
            const timeA = a.lastMessage ? a.lastMessage.timestamp.getTime() : a.createdAt.getTime();
            const timeB = b.lastMessage ? b.lastMessage.timestamp.getTime() : b.createdAt.getTime();
            return timeB - timeA;
        });

        res.status(200).json({ success: true, chatRooms: roomsWithLastMessage });
    } catch (error) {
        console.error("채팅 목록 불러오기 오류:", error);
        res.status(500).json({ success: false, message: '채팅 목록을 불러오는 중 오류 발생' });
    }
});

export default router;