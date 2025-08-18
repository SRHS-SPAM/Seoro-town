// backend/utils/fileHandlers.js (전체 코드)

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_FILE = path.join(__dirname, '..', 'users.json');
const POSTS_FILE = path.join(__dirname, '..', 'boardlist.json');
const FOLLOWS_FILE = path.join(__dirname, '..', 'follows.json');
const MARKET_FILE = path.join(__dirname, '..', 'market.json');
const CHAT_ROOMS_FILE = path.join(__dirname, '..', 'chatRooms.json');
const CHAT_MESSAGES_FILE = path.join(__dirname, '..', 'chatMessages.json');

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

export const readMarket = async () => {
    try {
        const data = await fs.readFile(MARKET_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') return [];
        throw error;
    }
};
export const writeMarket = (products) => fs.writeFile(MARKET_FILE, JSON.stringify(products, null, 2));

export const readChatRooms = async () => {
    try {
        const data = await fs.readFile(CHAT_ROOMS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') return [];
        throw error;
    }
};
export const writeChatRooms = (rooms) => fs.writeFile(CHAT_ROOMS_FILE, JSON.stringify(rooms, null, 2));

export const readChatMessages = async () => {
    try {
        const data = await fs.readFile(CHAT_MESSAGES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') return {};
        throw error;
    }
};
export const writeChatMessages = (messages) => fs.writeFile(CHAT_MESSAGES_FILE, JSON.stringify(messages, null, 2));