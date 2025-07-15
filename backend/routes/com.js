// backend/routes/com.js (최종 전체 코드)

import express from 'express';
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

const router = express.Router();

const COM_PAGE_URL = 'https://srobot.sen.hs.kr/67182/subMenu.do';
const LIST_API_URL = 'https://srobot.sen.hs.kr/dggb/module/board/selectBoardListAjax.do';
const DETAIL_API_URL = 'https://srobot.sen.hs.kr/dggb/module/board/selectBoardDetailAjax.do';

// --- (1) 게시물 '목록'을 가져오는 API ---
router.get('/', async (req, res) => {
    let browser = null;
    try {
        const pageNum = req.query.page || 1;
        browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
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
        res.json({ success: true, list: comList });
    } catch (error) {
        console.error('[Puppeteer] 목록 크롤링 오류:', error.message);
        res.status(500).json({ success: false, message: '가정통신문 목록을 가져오는 데 실패했습니다.' });
    } finally {
        if (browser) await browser.close();
    }
});


// --- (2) 게시물 '상세 내용'을 가져오는 API (자바스크립트 코드에서 파일 정보 추출) ---
router.get('/detail/:nttId', async (req, res) => {
    let browser = null;
    try {
        const { nttId } = req.params;
        if (!nttId || !/^\d+$/.test(nttId)) {
            return res.status(400).json({ success: false, message: '유효하지 않은 게시글 ID입니다.' });
        }

        browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
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
        
        // 자바스크립트 코드에서 파일 정보 추출
        const scripts = $('script');
        
        scripts.each((i, script) => {
            const scriptContent = $(script).html();
            if (scriptContent && scriptContent.includes('serverFileObjArray')) {
                // 정규식을 사용해 파일 정보를 담고 있는 객체 문자열을 추출
                const fileObjectsRegex = /serverFileObj\["(.*?)"\]\s*=\s*"(.*?)";/g;
                let match;
                let currentFile = {};
                
                while ((match = fileObjectsRegex.exec(scriptContent)) !== null) {
                    const key = match[1];
                    const value = match[2];
                    currentFile[key] = value;
                    
                    if (key === 'fileSn') {
                        if (currentFile.name && currentFile.atchFileId && currentFile.fileSn) {
                            // 실제 다운로드 링크는 javascript 함수를 직접 호출할 수 없으므로,
                            // 다운로드에 필요한 파라미터를 조합하여 URL을 만듭니다.
                            const downloadUrl = `https://srobot.sen.hs.kr/dggb/board/boardFile/downFile.do?atchFileId=${currentFile.atchFileId}&fileSn=${currentFile.fileSn}`;
                            
                            detailData.files.push({
                                name: currentFile.name,
                                link: downloadUrl
                            });
                        }
                        currentFile = {}; // 다음 파일을 위해 객체 초기화
                    }
                }
            }
        });

        res.json({ success: true, detail: detailData });

    } catch (error) {
        console.error('[Puppeteer] 상세 내용 크롤링 오류:', error.message);
        res.status(500).json({ success: false, message: '상세 내용을 가져오는 데 실패했습니다.' });
    } finally {
        if (browser) await browser.close();
    }
});


export default router;