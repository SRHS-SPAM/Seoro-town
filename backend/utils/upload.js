// backend/utils/upload.js

import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js'; // 방금 만든 Cloudinary 설정 가져오기

// Cloudinary 저장소 설정
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'seorotown', // Cloudinary에 저장될 폴더 이름
    format: async (req, file) => 'png', // 파일 포맷 (예: png, jpg)
    public_id: (req, file) => {
        // 파일명 중복을 피하기 위해 현재 시간과 랜덤 숫자를 조합
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        return 'image-' + uniqueSuffix;
    },
  },
});

// 파일 필터 설정 (이미지 파일만 허용)
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true); // 이미지 파일이면 허용
    } else {
        cb(new Error('이미지 파일만 업로드 가능합니다!'), false); // 아니면 거부
    }
};

// 설정들을 multer에 적용
export const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 파일 크기 5MB 제한
});