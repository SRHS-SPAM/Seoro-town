import express from 'express';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import * as cheerio from 'cheerio';

const router = express.Router();

const COM_PAGE_URL = 'https://srobot.sen.hs.kr/67182/subMenu.do';
const LIST_API_URL = 'https://srobot.sen.hs.kr/dggb/module/board/selectBoardListAjax.do';
const DETAIL_API_URL = 'https://srobot.sen.hs.kr/dggb/module/board/selectBoardDetailAjax.do';
const BASE_URL = 'https://srobot.sen.hs.kr';

// --- 캐싱 및 브라우저 최적화 ---
const CACHE_DURATION = 10 * 60 * 1000; // 10분
let listCache = new Map();
let detailCache = new Map();

let browserInstance = null;

async function initializeBrowser() {
    if (!browserInstance || !browserInstance.isConnected()) {
        console.log('[Puppeteer] Initializing new browser instance...');
        try {
            browserInstance = await puppeteer.launch({
                args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
                defaultViewport: chromium.defaultViewport,
                executablePath: await chromium.executablePath(),
                headless: chromium.headless,
            });
            browserInstance.on('disconnected', () => {
                console.log('[Puppeteer] Browser instance disconnected.');
                browserInstance = null;
            });
        } catch (error) {
            console.error('[Puppeteer] Failed to launch browser:', error);
            browserInstance = null; // 실패 시 null로 설정
        }
    }
    return browserInstance;
}

process.on('exit', async () => {
    if (browserInstance) {
        await browserInstance.close();
    }
});

initializeBrowser();

// --- 라우터 ---

router.get('/', async (req, res) => {
    const pageNum = req.query.page || 1;
    const now = Date.now();

    if (listCache.has(pageNum)) {
        const cached = listCache.get(pageNum);
        if (now - cached.timestamp < CACHE_DURATION) {
            return res.json({ success: true, list: cached.data });
        }
    }

    let page = null;
    try {
        const browser = await initializeBrowser();
        if (!browser) throw new Error('Puppeteer browser is not available.');
        page = await browser.newPage();
        await page.goto(COM_PAGE_URL, { waitUntil: 'networkidle2' });

        const listResponsePromise = page.waitForResponse(response => response.url().startsWith(LIST_API_URL));
        await page.evaluate((pn) => { fnPage(pn); }, pageNum);
        await listResponsePromise;

        const content = await page.content();
        const $ = cheerio.load(content);
        const comList = [];

        $('tbody tr').each((i, elem) => {
            const tds = $(elem).find('td');
            const num = tds.eq(0).text().trim();
            if (num === '공지' || tds.length === 0) return;

            const onclickAttr = tds.eq(1).find('a').attr('onclick');
            const match = onclickAttr ? onclickAttr.match(/fnView\('([^"]+)',\s*'([^"]+)'\)/) : null;

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

        listCache.set(pageNum, { timestamp: now, data: comList });
        res.json({ success: true, list: comList });

    } catch (error) {
        console.error('[Puppeteer] 목록 크롤링 오류:', error.message);
        res.status(500).json({ success: false, message: '가정통신문 목록을 가져오는 데 실패했습니다.' });
    } finally {
        if (page) await page.close();
    }
});

router.get('/detail/:bbsId/:nttId', async (req, res) => {
    const { bbsId, nttId } = req.params;
    const now = Date.now();
    const cacheKey = `${bbsId}-${nttId}`;

    if (detailCache.has(cacheKey)) {
        const cached = detailCache.get(cacheKey);
        if (now - cached.timestamp < CACHE_DURATION) {
            return res.json({ success: true, detail: cached.data });
        }
    }
    
    let page = null;
    try {
        const browser = await initializeBrowser();
        if (!browser) throw new Error('Puppeteer browser is not available.');
        page = await browser.newPage();
        await page.goto(COM_PAGE_URL, { waitUntil: 'networkidle2' });

        const detailResponsePromise = page.waitForResponse(response => response.url().startsWith(DETAIL_API_URL));
        await page.evaluate((bbsId, nttId) => { fnView(bbsId, nttId); }, bbsId, nttId);
        
        const detailResponse = await detailResponsePromise;
        const htmlResult = await detailResponse.text();
        const $ = cheerio.load(htmlResult);
        
        const detail = {
            title: $('th:contains("제목")').next('td').find('div').text().trim(),
            author: $('th:contains("이름")').next('td').find('div').text().trim(),
            date: $('th:contains("등록일")').next('td').find('div').text().trim(),
            contentHtml: $('div.content').html(),
            files: [],
        };

        const scriptContent = $('script:contains("serverFileObjArray")').html();
        if (scriptContent) {
            const fileInfoRegex = /serverFileObj\["name"\] = "(.*?)";[\s\S]*?serverFileObj\["atchFileId"\] = "(.*?)";[\s\S]*?serverFileObj\["fileSn"\] = "(.*?)";/g;
            let match;
            while ((match = fileInfoRegex.exec(scriptContent)) !== null) {
                detail.files.push({
                    name: match[1],
                    link: `${BASE_URL}/dggb/board/boardFile/downFile.do?atchFileId=${match[2]}&fileSn=${match[3]}`
                });
            }
        }

        detailCache.set(cacheKey, { timestamp: now, data: detail });
        res.json({ success: true, detail: detail });

    } catch (error) {
        console.error('[Puppeteer] 상세 내용 크롤링 오류:', error.message);
        res.status(500).json({ success: false, message: '상세 내용을 가져오는 데 실패했습니다.' });
    } finally {
        if (page) await page.close();
    }
});

export default router;