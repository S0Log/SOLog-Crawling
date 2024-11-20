import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

const filename = './competitorData/competitorData.json';
const competitorFilename = './competitorData/competitorCompany.json';
const companys = [
    'A000660', 'A005930', 'A373220', 'A207940', 'A005380',
    'A005935', 'A000270', 'A068270', 'A105560', 'A035420',
    'A055550', 'A012330', 'A005490', 'A028260', 'A032830',
    'A010130', 'A051910', 'A329180', 'A138040', 'A006400',
    'A012450', 'A000810', 'A086790', 'A011200', 'A035720',
    'A015760', 'A033780', 'A066570', 'A259960', 'A034020',
    'A009540', 'A003670', 'A267260', 'A316140', 'A017670',
    'A042660', 'A003550', 'A018260', 'A024110', 'A402340',
    'A030200', 'A010140', 'A034730', 'A323410', 'A096770',
    'A000100', 'A003490', 'A086280', 'A352820', 'A047050'
]

main();

async function main() {
    for(let i = 0; i < companys.length; i++) {
        const url = `https://comp.fnguide.com/SVO2/ASP/SVD_Comparison.asp?pGB=1&gicode=${companys[i]}&cID=&MenuYn=Y&ReportGB=&NewMenuID=106&stkGb=701&cpGb=undefined`;
        await fetchData(url);
    }
}

async function fetchData(url) {

    const response = await axios.get(url);
    const data = await response.data;

    const $ = cheerio.load(data);
    
    const companyNameArray = $('div#grid_D_Y.um_table table.us_table_ty1 thead tr th.txt_ell').map((idx, elem) => {
        const companyName = $(elem).text();
        return [
            companyName
        ]
    }).get();

    const contentArray = $('div#grid_D_Y.um_table table.us_table_ty1 tbody tr td.r').map((idx, elem) => {
        const content = $(elem).text();
        return [
            content
        ]
    }).get();
    
    const linesToExtract = [2, 3, 4, 5, 7, 10, 11, 12, 13, 14];
    // 각 줄의 요소는 4개씩이므로, 인덱스 계산 후 추출
    const extractedContent = linesToExtract.map(line => contentArray.slice((line - 1) * 4, line * 4));

    let competitorDataResult = [];
    for(let i = 0; i < 4; i++) {
        competitorDataResult.push({
            CompanyName: companyNameArray[i],
            CapitalAmount: extractedContent[0][i],
            TotalAsset: extractedContent[1][i],
            TotalLiabilities: extractedContent[2][i],
            TotalEquity: extractedContent[3][i],
            OperIncome: extractedContent[4][i],
            PER: extractedContent[5][i],
            PBR: extractedContent[6][i],
            ROE: extractedContent[7][i],
            OperatingMargin: extractedContent[8][i],
            RevenueGrowthRate: extractedContent[9][i]
        })
    }

    const competitorCompanyResult = [
        { [companyNameArray[0]]: companyNameArray[1] },
        { [companyNameArray[0]]: companyNameArray[2] },
        { [companyNameArray[0]]: companyNameArray[3] }
    ];

    saveToFile(competitorFilename, competitorCompanyResult);
    saveToFile(filename, competitorDataResult);
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