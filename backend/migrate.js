import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/Users.js';
import Post from './models/Post.js';
import Product from './models/Product.js';
import ChatRoom from './models/ChatRoom.js';
import ChatMessage from './models/ChatMessage.js';
import Follow from './models/Follow.js';

import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '.env') });

// Helper function to query SQLite with promises
const query = (db, sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('SQLite query error:', err.message);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

const migrate = async () => {
  let sqliteDb;
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('MongoDB connected for migration.');

    // Connect to SQLite
    const sqliteDbPath = path.join(__dirname, 'seorotown.db');
    sqliteDb = new sqlite3.Database(sqliteDbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        throw new Error(`Error opening SQLite database: ${err.message}`);
      }
    });
    console.log('Connected to the SQLite database.');

    // --- 0. Clean previous data in MongoDB ---
    console.log('Cleaning old data from MongoDB...');
    await User.deleteMany({});
    await Post.deleteMany({});
    await Product.deleteMany({});
    await ChatRoom.deleteMany({});
    await ChatMessage.deleteMany({});
    await Follow.deleteMany({});
    console.log('Old data cleaned.');

    // ID mapping storage
    const userMap = new Map();
    const productMap = new Map();
    const chatRoomMap = new Map();

    // --- 1. Migrate Users ---
    console.log('Migrating users...');
    const users = await query(sqliteDb, 'SELECT * FROM users');
    const mongoUsers = users.map(u => {
      const mongoUser = {
        id: u.id.toString(), // Use SQLite ID as string for custom ID
        username: u.username,
        email: u.email,
        password: u.password,
        profileImage: u.profileImage,
        createdAt: u.createdAt,
        schedule: u.schedule ? JSON.parse(u.schedule) : undefined,
      };
      userMap.set(u.id, mongoUser.id); // Map: sqlite_id -> mongo_id_string
      return mongoUser;
    });
    if (mongoUsers.length > 0) {
      await User.insertMany(mongoUsers);
      console.log(`${mongoUsers.length} users migrated.`);
    } else {
      console.log('No users found to migrate.');
    }

    // --- 2. Migrate Products ---
    console.log('Migrating products...');
    const products = await query(sqliteDb, 'SELECT * FROM products');
    const mongoProducts = products.map(p => {
      const newMongoId = new mongoose.Types.ObjectId();
      productMap.set(p.id, newMongoId); // Map: sqlite_id -> mongo_objectId
      return {
        _id: newMongoId,
        name: p.name,
        description: p.description,
        price: p.price,
        seller: p.seller,
        userId: userMap.get(p.userId), // Map userId
        image: p.image,
        isSold: p.isSold === 1,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });
    if (mongoProducts.length > 0) {
      await Product.insertMany(mongoProducts);
      console.log(`${mongoProducts.length} products migrated.`);
    } else {
      console.log('No products found to migrate.');
    }

    // --- 3. Migrate Posts ---
    console.log('Migrating posts...');
    const posts = await query(sqliteDb, 'SELECT * FROM posts');
    const mongoPosts = posts.map(p => ({
      title: p.title,
      content: p.content,
      author: p.author,
      userId: userMap.get(p.userId), // Map userId
      image: p.image,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));
    if (mongoPosts.length > 0) {
      await Post.insertMany(mongoPosts);
      console.log(`${mongoPosts.length} posts migrated.`);
    } else {
      console.log('No posts found to migrate.');
    }

    // --- 4. Migrate Follows ---
    console.log('Migrating follows...');
    const follows = await query(sqliteDb, 'SELECT * FROM follows');
    const mongoFollows = follows
      .map(f => {
        const followerId = userMap.get(f.followerId);
        const followingId = userMap.get(f.followingId);

        if (!followerId || !followingId) {
          console.warn(`Skipping invalid follow record (user not found): ${JSON.stringify(f)}`);
          return null;
        }

        return {
          id: f.id.toString(),
          followerId: followerId,
          followingId: followingId,
        };
      })
      .filter(f => f !== null); // Remove null entries from skipped records

    if (mongoFollows.length > 0) {
      await Follow.insertMany(mongoFollows);
      console.log(`${mongoFollows.length} follows migrated.`);
    } else {
      console.log('No follows found to migrate or all were invalid.');
    }

    // --- 5. Migrate ChatRooms ---
    console.log('Migrating chat rooms...');
    const chatRooms = await query(sqliteDb, 'SELECT * FROM chat_rooms');
    const mongoChatRooms = chatRooms.map(cr => {
      const mongoRoom = {
        id: cr.id.toString(),
        productId: productMap.get(cr.productId)?.toString(), // Map productId
        participants: JSON.parse(cr.participants).map(pId => userMap.get(pId)), // Map participants
        createdAt: cr.createdAt,
      };
      chatRoomMap.set(cr.id, mongoRoom.id); // Map: sqlite_id -> mongo_id_string
      return mongoRoom;
    });
    if (mongoChatRooms.length > 0) {
      await ChatRoom.insertMany(mongoChatRooms);
      console.log(`${mongoChatRooms.length} chat rooms migrated.`);
    } else {
      console.log('No chat rooms found to migrate.');
    }

    // --- 6. Migrate ChatMessages ---
    console.log('Migrating chat messages...');
    const chatMessages = await query(sqliteDb, 'SELECT * FROM chat_messages');
    const mongoChatMessages = chatMessages.map(cm => ({
      roomId: chatRoomMap.get(cm.roomId), // Map roomId
      senderId: userMap.get(cm.senderId), // Map senderId
      senderName: cm.senderName,
      message: cm.message,
      timestamp: cm.timestamp,
    }));
    if (mongoChatMessages.length > 0) {
      await ChatMessage.insertMany(mongoChatMessages);
      console.log(`${mongoChatMessages.length} chat messages migrated.`);
    } else {
      console.log('No chat messages found to migrate.');
    }

    console.log('Data migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    if (sqliteDb) {
      sqliteDb.close();
      console.log('SQLite connection closed.');
    }
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
};

migrate();