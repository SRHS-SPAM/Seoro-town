import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

const router = express.Router();

const MEAL_URL = 'https://school.koreacharts.com/school/meals/B000011354/contents.html';

const decodeHtmlEntities = (text) => {
    const entities = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#39;': "'",
        '&nbsp;': ' ',
        '&apos;': "'",
        '&copy;': '©',
        '&reg;': '®',
        '&trade;': '™'
    };
    
    return text.replace(/&[#\w]+;/g, (entity) => {
        return entities[entity] || entity;
    });
};

// KST (UTC+9) 기준 현재 날짜를 가져오는 함수
const getKSTDate = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    return new Date(utc + (9 * 3600000));
};

router.get('/', async (req, res) => {
    try {
        const response = await axios.get(MEAL_URL);
        const html = response.data;
        const $ = cheerio.load(html);

        const mealData = {
            breakfast: [],
            lunch: [],
            dinner: []
        };

        const kstNow = getKSTDate();
        const today = kstNow.getDate().toString();
        let foundToday = false;

        $('.box-body table tbody > tr').each((index, element) => {
            const row = $(element);
            const cells = row.find('td');
            
            if (cells.length < 3) return;

            const dayNumber = $(cells[0]).text().trim();

            if (dayNumber === today) {
                foundToday = true;

                const mealCell = $(cells[2]);

                const allLines = mealCell.html().split('<br>').map(line => {
                    const cleanLine = line.replace(/<[^>]*>/g, '').trim();
                    return decodeHtmlEntities(cleanLine);
                }).filter(Boolean);

                let currentMealType = '';
                allLines.forEach(line => {
                    if (line.includes('[조식]')) {
                        currentMealType = 'breakfast';
                        const menuAfterKeyword = line.replace(/\[조식\]/g, '')
                                                    .replace(/\s*\([\d\.]+\)\s*$/, '')
                                                    .trim();
                        if (menuAfterKeyword) {
                            mealData[currentMealType].push(menuAfterKeyword);
                        }
                    } else if (line.includes('[중식]')) {
                        currentMealType = 'lunch';
                        const menuAfterKeyword = line.replace(/\[중식\]/g, '')
                                                    .replace(/\s*\([\d\.]+\)\s*$/, '')
                                                    .trim();
                        if (menuAfterKeyword) {
                            mealData[currentMealType].push(menuAfterKeyword);
                        }
                    } else if (line.includes('[석식]')) {
                        currentMealType = 'dinner';
                        const menuAfterKeyword = line.replace(/\[석식\]/g, '')
                                                    .replace(/\s*\([\d\.]+\)\s*$/, '')
                                                    .trim();
                        if (menuAfterKeyword) {
                            mealData[currentMealType].push(menuAfterKeyword);
                        }
                    } else {
                        const cleanMenu = line.replace(/\s*\([\d\.]+\)\s*$/, '')
                                            .trim();
                        
                        if (currentMealType && cleanMenu) {
                            mealData[currentMealType].push(cleanMenu);
                        }
                    }
                });

                return false;
            }
        });

        if (!foundToday) {
            console.log(`koreacharts.com에서 오늘 날짜(${today})의 식단을 찾지 못했습니다.`);
        }
        
        res.json({ success: true, meal: mealData });

    } catch (error) {
        console.error('식단 정보 크롤링 오류:', error.message);
        res.status(500).json({ success: false, message: '식단 정보를 가져오는 데 실패했습니다.' });
    }
});

export default router;