import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

const router = express.Router();

// debug.html 파일의 출처 URL
const MEAL_URL = 'https://school.koreacharts.com/school/meals/B000011354/contents.html';

// HTML 엔티티 디코딩 함수
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

        // 오늘 날짜를 '일(day)' 숫자만 문자열로 가져옵니다. (예: 15일 -> "15")
        const today = new Date().getDate().toString();
        let foundToday = false;

        // ✨ debug.html의 구조: .box-body 안의 table > tbody > tr
        $('.box-body table tbody > tr').each((index, element) => {
            const row = $(element);
            const cells = row.find('td');
            
            // 행에 최소 3개의 셀(일자, 요일, 메뉴)이 있는지 확인
            if (cells.length < 3) return;

            // ✨ 첫 번째 td가 날짜입니다.
            const dayNumber = $(cells[0]).text().trim();

            // 오늘 날짜와 일치하는지 확인합니다.
            if (dayNumber === today) {
                foundToday = true;
                
                // ✨ 세 번째 td가 급식 메뉴입니다.
                const mealCell = $(cells[2]);
                
                // td 안의 HTML을 <br> 태그로 모든 라인을 나눕니다.
                // HTML 엔티티를 디코딩하여 처리합니다.
                const allLines = mealCell.html().split('<br>').map(line => {
                    // HTML 태그를 제거하고 HTML 엔티티를 디코딩합니다.
                    const cleanLine = line.replace(/<[^>]*>/g, '').trim();
                    return decodeHtmlEntities(cleanLine);
                }).filter(Boolean); // 빈 줄은 제거합니다.

                let currentMealType = '';
                allLines.forEach(line => {
                    // 먼저 해당 줄이 메뉴 타입 키워드인지 확인
                    if (line.includes('[조식]')) {
                        currentMealType = 'breakfast';
                        // 키워드가 있는 줄에 메뉴도 함께 있는지 확인
                        const menuAfterKeyword = line.replace(/\[조식\]/g, '')
                                                    .replace(/\s*\([\d\.]+\)\s*$/, '')
                                                    .trim();
                        if (menuAfterKeyword) {
                            mealData[currentMealType].push(menuAfterKeyword);
                        }
                    } else if (line.includes('[중식]')) {
                        currentMealType = 'lunch';
                        // 키워드가 있는 줄에 메뉴도 함께 있는지 확인
                        const menuAfterKeyword = line.replace(/\[중식\]/g, '')
                                                    .replace(/\s*\([\d\.]+\)\s*$/, '')
                                                    .trim();
                        if (menuAfterKeyword) {
                            mealData[currentMealType].push(menuAfterKeyword);
                        }
                    } else if (line.includes('[석식]')) {
                        currentMealType = 'dinner';
                        // 키워드가 있는 줄에 메뉴도 함께 있는지 확인
                        const menuAfterKeyword = line.replace(/\[석식\]/g, '')
                                                    .replace(/\s*\([\d\.]+\)\s*$/, '')
                                                    .trim();
                        if (menuAfterKeyword) {
                            mealData[currentMealType].push(menuAfterKeyword);
                        }
                    } else {
                        // 키워드가 없는 일반 메뉴 줄 처리
                        const cleanMenu = line.replace(/\s*\([\d\.]+\)\s*$/, '')
                                              .trim();
                        
                        if (currentMealType && cleanMenu) {
                            mealData[currentMealType].push(cleanMenu);
                        }
                    }
                });

                return false; // 오늘 날짜를 찾았으므로 순회 중단
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