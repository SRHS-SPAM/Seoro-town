// backend/migrate_posts.js
// 기존 Post 데이터의 userId를 String에서 ObjectId로 변환하는 스크립트

import mongoose from 'mongoose';
import 'dotenv/config';

import User from './models/User.js';
import Post from './models/Post.js';
import connectDB from './config/db.js';

const migrateData = async () => {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Database connected.');

    try {
        console.log('Fetching all users to create an ID map...');
        const users = await User.find({});
        const userIdMap = users.reduce((map, user) => {
            // user.id는 custom string id, user._id는 ObjectId
            map[user.id] = user._id;
            return map;
        }, {});
        console.log(`Created map for ${Object.keys(userIdMap).length} users.`);

        console.log('Fetching all posts to migrate...');
        const posts = await Post.find({});
        console.log(`Found ${posts.length} posts to check.`);

        let migratedCount = 0;
        for (const post of posts) {
            // userId 필드가 ObjectId가 아닌 경우 (즉, 문자열인 경우) 마이그레이션 대상
            if (post.userId && typeof post.userId === 'string') {
                const newUserId = userIdMap[post.userId];
                if (newUserId) {
                    post.userId = newUserId; // ObjectId로 교체
                    await post.save();
                    migratedCount++;
                    console.log(`Migrated post with ID: ${post.id}`);
                } else {
                    console.warn(`Could not find user for post ID: ${post.id} with old userId: ${post.userId}`);
                }
            }
        }

        if (migratedCount > 0) {
            console.log(`
Migration complete! Successfully migrated ${migratedCount} posts.
`);
        } else {
            console.log('\nNo posts needed migration. Everything looks up to date!');
        }

    } catch (error) {
        console.error('\nAn error occurred during migration:', error);
    } finally {
        console.log('Closing database connection.');
        await mongoose.disconnect();
    }
};

migrateData();
