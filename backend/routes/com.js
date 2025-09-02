import express from 'express';
import axios from 'axios';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
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
async function initializeBrowser() {
    if (!browserInstance) {
        console.log('[Puppeteer] Initializing new browser instance...');
        browserInstance = await puppeteer.launch({
            args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: chromium.headless,
        });
        browserInstance.on('disconnected', () => {
            console.log('[Puppeteer] Browser instance disconnected.');
            browserInstance = null; // 연결이 끊기면 인스턴스 초기화
        });
    }
    return browserInstance;
}

// 앱 종료 시 브라우저 종료
process.on('exit', async () => {
    if (browserInstance) {
        console.log('[Puppeteer] Closing browser instance on app exit.');
        await browserInstance.close();
    }
});

initializeBrowser(); // 서버 시작과 함께 브라우저 초기화

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
        const browser = await initializeBrowser();
        page = await browser.newPage();
        await page.setExtraHTTPHeaders({'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'});
        await page.goto(COM_PAGE_URL, { waitUntil: 'networkidle2' });
        console.log(`[Puppeteer] Navigated to ${COM_PAGE_URL}`);

        const listResponsePromise = page.waitForResponse(response => response.url().startsWith(LIST_API_URL));
        await page.evaluate((pn) => { fnPage(pn); }, pageNum);
        await listResponsePromise;
        console.log(`[Puppeteer] List API response received from ${LIST_API_URL}`);

        const content = await page.content();
        console.log(`[Puppeteer] Page content length: ${content.length}`);
        // console.log(`[Puppeteer] Page content snippet: ${content.substring(0, 500)}...`); // Log a snippet for debugging
        const $ = cheerio.load(content);
        const comList = [];

        const tableRows = $('tbody tr');
        console.log(`[Puppeteer] Found ${tableRows.length} table rows.`);

        tableRows.each((i, elem) => {
            const tds = $(elem).find('td');
            const num = tds.eq(0).text().trim();
            if (num === '공지') return;

            // console.log(`[Puppeteer] Processing row ${i}: Num=${num}, Title=${tds.eq(1).find('a').text().trim()}`); // Log each row being processed

            const onclickAttr = tds.eq(1).find('a').attr('onclick');
            const match = onclickAttr ? onclickAttr.match(/fnView\('([^\']+)',\s*'([^\']+)'\)/) : null;

            comList.push({
                num: num,
                title: tds.eq(1).find('a').text().trim(),
                bbsId: match ? match[1] : null,
                nttId: match ? match[2] : null,
                author: tds.eq(2).text().trim(),
                date: tds.eq(3).text().trim(),
                views: tds.eq(4).text().trim(),
            });
        });
        console.log(`[Puppeteer] Extracted ${comList.length} items.`);

        listCache.set(pageNum, { timestamp: now, data: comList });
        res.json({ success: true, list: comList });

    } catch (error) {
        console.error('[Puppeteer] 목록 크롤링 오류:', error.message);
        res.status(500).json({ success: false, message: '가정통신문 목록을 가져오는 데 실패했습니다.' });
    } finally {
        if (page) { await page.close(); } 
    }
});

router.get('/detail/:bbsId/:nttId', async (req, res) => {
    const { bbsId, nttId } = req.params;
    const now = Date.now();
    const cacheKey = `${bbsId}-${nttId}`;

    if (!nttId || !/^\d+$/.test(nttId) || !bbsId) {
        return res.status(400).json({ success: false, message: '유효하지 않은 게시글 또는 게시판 ID입니다.' });
    }

    // 1. 캐시 확인
    if (detailCache.has(cacheKey)) {
        const cached = detailCache.get(cacheKey);
        if (now - cached.timestamp < CACHE_DURATION) {
            console.log(`[Cache] HIT: Serving detail for ${cacheKey} from cache.`);
            return res.json({ success: true, detail: cached.data });
        }
    }
    
    console.log(`[Cache] MISS: Crawling detail for ${cacheKey}.`);
    let page = null;
    try {
        const browser = await initializeBrowser();
        page = await browser.newPage();
        await page.setExtraHTTPHeaders({'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'});
        await page.goto(COM_PAGE_URL, { waitUntil: 'networkidle2' });

        const detailResponsePromise = page.waitForResponse(
            response => response.url().startsWith(DETAIL_API_URL) && response.status() === 200,
            { timeout: 15000 }
        );

        await page.evaluate((bbsId, nttId) => {
            fnView(bbsId, nttId);
        }, bbsId, nttId);
        
        const detailResponse = await detailResponsePromise;
        const htmlResult = await detailResponse.text();
        const $ = cheerio.load(htmlResult);
        
        const detail = {
            title: $('div[class*="view-info"] h4').text().trim(),
            author: $('div[class*="view-info"] .info dd').eq(0).text().trim(),
            date: $('div[class*="view-info"] .info dd').eq(1).text().trim(),
            contentHtml: $('div[class*="view-con"]').html(),
            files: [],
        };

        $('div[class*="view-file"] ul li a').each((i, elem) => {
            detail.files.push({
                name: $(elem).text().trim(),
                link: COM_PAGE_URL + $(elem).attr('href'),
            });
        });

        console.log("--- DEBUG: Scraped Detail Object ---", detail);

        detailCache.set(cacheKey, { timestamp: now, data: detail });
        res.json({ success: true, detail: detail });

    } catch (error) {
        console.error('[Puppeteer] 상세 내용 크롤링 오류:', error.message);
        res.status(500).json({ success: false, message: '상세 내용을 가져오는 데 실패했습니다.' });
    } finally {
        if (page) { await page.close(); }
    }
});

router.get('/com_detail_debug', async (req, res) => {
    try {
        const url = req.query.url;
        if (!url) {
            return res.status(400).send('URL parameter is required.');
        }

        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        // Extract title
        const title = $('meta[property="og:title"]').attr('content') || $('title').text();

        // Extract description
        const description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content');

        // Extract image
        const image = $('meta[property="og:image"]').attr('content');

        // Extract URL
        const finalUrl = $('meta[property="og:url"]').attr('content') || url;

        res.json({ title, description, image, url: finalUrl });
    } catch (error) {
        console.error('Error during crawling:', error);
        res.status(500).send('Error during crawling: ' + error.message);
    }
});

export default router;