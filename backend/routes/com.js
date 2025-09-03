import express from 'express';
import axios from 'axios';
import * as cheerio from 'cheerio';

const router = express.Router();

// API 및 기본 URL 정의
const LIST_API_URL = 'https://srobot.sen.hs.kr/dggb/module/board/selectBoardListAjax.do';
const DETAIL_API_URL = 'https://srobot.sen.hs.kr/dggb/module/board/selectBoardDetailAjax.do';
const COM_PAGE_URL = 'https://srobot.sen.hs.kr/67182/subMenu.do'; // Referer 헤더용
const BASE_URL = 'https://srobot.sen.hs.kr'; // 첨부파일 링크 구성용

// --- 캐싱 설정 ---
const CACHE_DURATION = 10 * 60 * 1000; // 10분
let listCache = new Map();
let detailCache = new Map();

// --- 공통 axios 요청 헤더 ---
const commonHeaders = {
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest',
    'Referer': COM_PAGE_URL
};

// --- 라우터 ---

// 목록 가져오기 (axios 최종 버전)
router.get('/', async (req, res) => {
    const pageNum = req.query.page || 1;
    const now = Date.now();

    if (listCache.has(pageNum)) {
        const cached = listCache.get(pageNum);
        if (now - cached.timestamp < CACHE_DURATION) {
            return res.json({ success: true, list: cached.data });
        }
    }

    try {
        const params = new URLSearchParams();
        params.append('bbsId', 'BBSMSTR_000000007872');
        params.append('bbsTyCode', 'dliv');
        params.append('customRecordCountPerPage', '10');
        params.append('pageIndex', pageNum);
        params.append('searchCondition', 'searchKeyword');
        params.append('checkNttId', 'mvmnReturnUrl');

        const response = await axios.post(LIST_API_URL, params, { headers: commonHeaders });

        const $ = cheerio.load(response.data);
        const comList = [];

        $('tbody tr').each((i, elem) => {
            const tds = $(elem).find('td');
            const num = tds.eq(0).text().trim();
            if (num === '공지' || tds.length === 0) return;

            const onclickAttr = tds.eq(1).find('a').attr('onclick');
            const match = onclickAttr ? onclickAttr.match(/fnView\('([^']+)',\s*'([^']+)'\)/) : null;

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
        console.error('[Axios] 목록 요청 오류:', error.message);
        res.status(500).json({ success: false, message: '가정통신문 목록을 가져오는 데 실패했습니다.' });
    }
});

// 상세 내용 가져오기 (axios 최종 버전)
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
    
    try {
        const params = new URLSearchParams();
        params.append('bbsId', bbsId);
        params.append('nttId', nttId);
        params.append('bbsTyCode', 'dliv');
        params.append('customRecordCountPerPage', '10');
        params.append('pageIndex', '1');
        params.append('searchCondition', 'searchKeyword');
        params.append('checkNttId', 'mvmnReturnUrl');
        params.append('cmntSe', 'N');

        const response = await axios.post(DETAIL_API_URL, params, { headers: commonHeaders });

        const $ = cheerio.load(response.data);
        
        const detail = {
            title: $('th:contains("제목")').next('td').find('div').text().trim(),
            author: $('th:contains("이름")').next('td').find('div').text().trim(),
            date: $('th:contains("등록일")').next('td').find('div').text().trim(),
            contentHtml: $('div.content').html(),
            files: [],
        };

        const scriptContent = $('script:contains("serverFileObjArray")').html();
        if (scriptContent) {
            const fileInfoRegex = /serverFileObj\["name"\] = \"(.*?)\";[\s\S]*?serverFileObj\["atchFileId"\] = \"(.*?)\";[\s\S]*?serverFileObj\["fileSn"\] = \"(.*?)\";/g;
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
        console.error('[Axios] 상세 내용 요청 오류:', error.message);
        res.status(500).json({ success: false, message: '상세 내용을 가져오는 데 실패했습니다.' });
    }
});

export default router;
