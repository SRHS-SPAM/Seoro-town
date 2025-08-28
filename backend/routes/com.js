import express from 'express';
import puppeteer from 'puppeteer';
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
            headless: true,
            executablePath: '/usr/bin/chromium-browser',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
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
        await page.goto(COM_PAGE_URL, { waitUntil: 'networkidle2' });

        const listResponsePromise = page.waitForResponse(response => response.url().startsWith(LIST_API_URL));
        await page.evaluate((pn) => { fnPage(pn); }, pageNum);
        await listResponsePromise;

        const content = await page.content();
        const $ = cheerio.load(content);
        const comList = [];

        $('table.board_type01_tb_list tbody tr').each((index, element) => {
            const cells = $(element).find('td');
            if (cells.length >= 5) {
                const link = $(cells[1]).find('a');
                const onclickAttr = link.attr('onclick') || '';
                const nttIdMatch = onclickAttr.match(/fnView\([^,]+,\s*'(\d+)'/);
                const nttId = nttIdMatch ? nttIdMatch[1] : null;
                let num = $(cells[0]).text().trim();
                if ($(cells[0]).find('img[alt="공지"]').length > 0) num = '공지';

                comList.push({ 
                    num, 
                    title: link.text().trim(), 
                    author: $(cells[2]).text().trim(), 
                    date: $(cells[3]).text().trim(), 
                    views: $(cells[4]).text().trim(), 
                    nttId 
                });
            }
        });

        // 3. 크롤링 성공 시 캐시 저장
        listCache.set(pageNum, { data: comList, timestamp: Date.now() });
        res.json({ success: true, list: comList });

    } catch (error) {
        console.error('[Puppeteer] 목록 크롤링 오류:', error.message);
        res.status(500).json({ success: false, message: '가정통신문 목록을 가져오는 데 실패했습니다.' });
    } finally {
        if (page) await page.close(); // 브라우저는 닫지 않고 페이지만 닫음
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
        const browser = await initializeBrowser();
        page = await browser.newPage();
        await page.goto(COM_PAGE_URL, { waitUntil: 'networkidle0' });

        const detailResponsePromise = page.waitForResponse(
            response => response.url().startsWith(DETAIL_API_URL) && response.status() === 200,
            { timeout: 15000 }
        );

        await page.evaluate((id) => {
            fnView('BBSMSTR_000000010049', id);
        }, nttId);
        
        const detailResponse = await detailResponsePromise;
        const htmlResult = await detailResponse.text();
        const $ = cheerio.load(htmlResult);
        
        const detailData = {
            title: $('th:contains("제목")').next().text().trim(),
            author: $('th:contains("이름")').next().text().trim(),
            date: $('th:contains("등록일")').next().text().trim(),
            contentHtml: $('div.content').html() || '',
            files: []
        };
        
        const scripts = $('script');
        scripts.each((i, script) => {
            const scriptContent = $(script).html();
            if (scriptContent && scriptContent.includes('serverFileObjArray')) {
                const fileObjectsRegex = /serverFileObj\["(.*?)"\]\s*=\s*"(.*?)";/g;
                let match;
                let currentFile = {};
                
                while ((match = fileObjectsRegex.exec(scriptContent)) !== null) {
                    const key = match[1];
                    const value = match[2];
                    currentFile[key] = value;
                    
                    if (key === 'fileSn') {
                        if (currentFile.name && currentFile.atchFileId && currentFile.fileSn) {
                            const downloadUrl = `https://srobot.sen.hs.kr/dggb/board/boardFile/downFile.do?atchFileId=${currentFile.atchFileId}&fileSn=${currentFile.fileSn}`;
                            detailData.files.push({ name: currentFile.name, link: downloadUrl });
                        }
                        currentFile = {};
                    }
                }
            }
        });

        // 3. 크롤링 성공 시 캐시 저장
        detailCache.set(nttId, { data: detailData, timestamp: Date.now() });
        res.json({ success: true, detail: detailData });

    } catch (error) {
        console.error('[Puppeteer] 상세 내용 크롤링 오류:', error.message);
        res.status(500).json({ success: false, message: '상세 내용을 가져오는 데 실패했습니다.' });
    } finally {
        if (page) await page.close(); // 브라우저는 닫지 않고 페이지만 닫음
    }
});

export default router;t router;ge.close(); // 브라우저는 닫지 않고 페이지만 닫음
    }
});

export default router;t router;