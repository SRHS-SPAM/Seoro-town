import express from 'express';
// import puppeteer from 'puppeteer-core';
// import chromium from '@sparticuz/chromium';
import * as cheerio from 'cheerio';

const router = express.Router();

const COM_PAGE_URL = 'https://srobot.sen.hs.kr/67182/subMenu.do';
const LIST_API_URL = 'https://srobot.sen.hs.kr/dggb/module/board/selectBoardListAjax.do';
const DETAIL_API_URL = 'https://srobot.sen.hs.kr/dggb/module/board/selectBoardDetailAjax.do';

// --- 캐싱 및 브라우저 최적화 ---

const CACHE_DURATION = 10 * 60 * 1000; // 10분
let listCache = new Map(); // 페이지 번호별 목록 캐시
let detailCache = new Map(); // 게시글 ID별 상세 내용 캐시

let browserInstance = null;

// 서버 시작 시 한번만 브라우저 실행
// async function initializeBrowser() {
//     if (!browserInstance) {
//         console.log('[Puppeteer] Initializing new browser instance...');
//         browserInstance = await puppeteer.launch({
//             args: chromium.args,
//             defaultViewport: chromium.defaultViewport,
//             executablePath: await chromium.executablePath(),
//             headless: chromium.headless,
//         });
//         browserInstance.on('disconnected', () => {
//             console.log('[Puppeteer] Browser instance disconnected.');
//             browserInstance = null; // 연결이 끊기면 인스턴스 초기화
//         });
//     }
//     return browserInstance;
// }

// 앱 종료 시 브라우저 종료
// process.on('exit', async () => {
//     if (browserInstance) {
//         console.log('[Puppeteer] Closing browser instance on app exit.');
//         await browserInstance.close();
//     }
// });

// initializeBrowser(); // 서버 시작과 함께 브라우저 초기화

// --- 라우터 ---

router.get('/', async (req, res) => {
    const pageNum = req.query.page || 1;
    const now = Date.now();

    // 1. 캐시 확인
    if (listCache.has(pageNum)) {
        const cached = listCache.get(pageNum);
        if (now - cached.timestamp < CACHE_DURATION) {
            console.log(`[Cache] HIT: Serving list for page ${pageNum} from cache.`);
            return res.json({ success: true, list: cached.data });
        }
    }

    // 2. 캐시 없으면 크롤링
    console.log(`[Cache] MISS: Crawling list for page ${pageNum}.`);
    let page = null;
    try {
        // const browser = await initializeBrowser(); // Commented out
        // page = await browser.newPage(); // Commented out
        // await page.goto(COM_PAGE_URL, { waitUntil: 'networkidle2' }); // Commented out

        // const listResponsePromise = page.waitForResponse(response => response.url().startsWith(LIST_API_URL)); // Commented out
        // await page.evaluate((pn) => { fnPage(pn); }, pageNum); // Commented out
        // await listResponsePromise; // Commented out

        // const content = await page.content(); // Commented out
        // const $ = cheerio.load(content); // Commented out
        // const comList = []; // Commented out

        // ... (rest of the cheerio parsing logic, which will now fail as 'content' is not defined)
        return res.status(500).json({ success: false, message: 'Puppeteer is temporarily disabled.' });

    } catch (error) {
        console.error('[Puppeteer] 목록 크롤링 오류:', error.message);
        res.status(500).json({ success: false, message: '가정통신문 목록을 가져오는 데 실패했습니다.' });
    } finally {
        if (page) { /* await page.close(); */ } // Commented out
    }
});

router.get('/detail/:nttId', async (req, res) => {
    const { nttId } = req.params;
    const now = Date.now();

    if (!nttId || !/^\d+$/.test(nttId)) {
        return res.status(400).json({ success: false, message: '유효하지 않은 게시글 ID입니다.' });
    }

    // 1. 캐시 확인
    if (detailCache.has(nttId)) {
        const cached = detailCache.get(nttId);
        if (now - cached.timestamp < CACHE_DURATION) {
            console.log(`[Cache] HIT: Serving detail for nttId ${nttId} from cache.`);
            return res.json({ success: true, detail: cached.data });
        }
    }
    
    console.log(`[Cache] MISS: Crawling detail for nttId ${nttId}.`);
    let page = null;
    try {
        // const browser = await initializeBrowser(); // Commented out
        // page = await browser.newPage(); // Commented out
        // await page.goto(COM_PAGE_URL, { waitUntil: 'networkidle0' }); // Commented out

        // const detailResponsePromise = page.waitForResponse(
        //     response => response.url().startsWith(DETAIL_API_URL) && response.status() === 200,
        //     { timeout: 15000 }
        // );

        // await page.evaluate((id) => {
        //     fnView('BBSMSTR_000000010049', id);
        // }, nttId);
        
        // const detailResponse = await detailResponsePromise; // Commented out
        // const htmlResult = await detailResponse.text(); // Commented out
        // const $ = cheerio.load(htmlResult); // Commented out
        
        // ... (rest of the cheerio parsing logic, which will now fail)
        return res.status(500).json({ success: false, message: 'Puppeteer is temporarily disabled.' });

    } catch (error) {
        console.error('[Puppeteer] 상세 내용 크롤링 오류:', error.message);
        res.status(500).json({ success: false, message: '상세 내용을 가져오는 데 실패했습니다.' });
    } finally {
        if (page) { /* await page.close(); */ } // Commented out
    }
});

export default router;