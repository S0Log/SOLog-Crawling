import axios from 'axios';
import * as cheerio from 'cheerio';
import iconv from 'iconv-lite';
import fs from 'fs';

const filename = './opinionTable/opinionData.json';
let url = 'https://securities.miraeasset.com/bbs/board/message/list.do?categoryId=1800&selectedId=1533&searchType=2&searchStartYear=2023&searchStartMonth=11&searchStartDay=19&searchEndYear=2024&searchEndMonth=11&searchEndDay=18&listType=1&startId=zzzzz~&startPage=1&curPage=1&direction=1';
let pages = 82;

(async () => {
    let idx = 0;
    let temp = 0;

    // for문으로 돌리면서 해당하는 링크만 가져오기
    while(1) {
        // 종료 조건
        if(temp === pages) break;

        console.log(url)
        url = await fetchData(url, idx%10)
        idx += 1;
        temp += 1;
    }
})()

async function fetchData(url, idx) {

    const response = await axios.get(url, {
        responseType: 'arraybuffer'
    });
    
    // 받은 데이터를 Buffer로 변환 후 `euc-kr`로 디코딩
    const decodedData = iconv.decode(Buffer.from(response.data), 'euc-kr');
    const $ = cheerio.load(decodedData);

    const opinionInfo = $('table.bbs_linetype2 tbody tr').map((index, elem) => {
        const date = $(elem).find('td').eq(0).text().trim(); // 작성일
        const title = $(elem).find('td.left .subject b').text().trim(); // 제목

        const result = extractStockInfo(title);

        if(result) {
            const companyNum = result.companyNum;
            const option = result.option;

            return {
                date,
                companyNum,
                option
            }
        } else {
            return null;
        }

        
    }).get()

    saveToFile(filename, opinionInfo);

    const nextUrl = findNextUrl($, idx);
    return nextUrl;
    
}

function findNextUrl($, idx) {
    let nextUrl = '';

    if(idx !== 0 && idx % 9 === 0) {
        nextUrl = $('div.bbs_pagingWrap span').find('a.next').attr('href');
    } else {
        nextUrl = $($('div.bbs_pagingWrap span.bar')[idx]).find('a').attr('href');
    }

    return `https://securities.miraeasset.com/bbs/board/message/${nextUrl}`
}

// 정규 표현식을 사용하여 종목 코드와 평가를 추출
function extractStockInfo(text) {
    const regex = /(\d{6})\/([가-힣\s]+)/;
    const match = text.match(regex);

    if (match) {
        const companyNum = match[1].trim();  // 종목 코드 (6자리 숫자)
        const option = match[2].trim();     // 평가 (한글로 된 단어)

        return { companyNum, option };
    } else {
        return null;
    }
}

// 파일에 이어서 쓰는 함수
function saveToFile(filename, data) {
    // 파일이 존재하지 않으면, 새로 생성하고 JSON 배열로 저장
    if (!fs.existsSync(filename)) {
        fs.writeFileSync(filename, JSON.stringify(data, null, 2), 'utf8');
    } else {
        // 기존 파일이 있을 경우, 데이터 읽어온 후 추가
        const existingData = JSON.parse(fs.readFileSync(filename, 'utf8'));
        const updatedData = [...existingData, ...data];
        fs.writeFileSync(filename, JSON.stringify(updatedData, null, 2), 'utf8');
    }
    console.log(`Data saved to ${filename}`);
}