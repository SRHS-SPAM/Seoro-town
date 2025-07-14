// utils/fileHandlers.js

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM에서 __dirname을 사용하기 위한 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_FILE = path.join(__dirname, '..', 'users.json');
const POSTS_FILE = path.join(__dirname, '..', 'boardlist.json');
const FOLLOWS_FILE = path.join(__dirname, '..', 'follows.json');

// module.exports 대신 export 키워드를 각 함수 앞에 붙여줍니다.
export const readUsers = async () => {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') return [];
        throw error;
    }
};

export const writeUsers = (users) => fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));

export const readPosts = async () => {
    try {
        const data = await fs.readFile(POSTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') return [];
        throw error;
    }
};

export const writePosts = (posts) => fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2));

export const readFollows = async () => {
    try {
        const data = await fs.readFile(FOLLOWS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') return [];
        throw error;
    }
};

export const writeFollows = (follows) => fs.writeFile(FOLLOWS_FILE, JSON.stringify(follows, null, 2));