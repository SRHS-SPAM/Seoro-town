// backend/utils/upload.js

import multer from 'multer';
import path from 'path';

// 파일 저장 위치와 파일명 설정
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // 파일이 저장될 폴더
    },
    filename: (req, file, cb) => {
        // 파일명 중복을 피하기 위해 현재 시간과 원본 파일명을 조합
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
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