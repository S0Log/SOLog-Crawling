import axios from 'axios';
import * as cheerio from 'cheerio';
import fs from 'fs';

const filename = './marketShare/marketShareData.json';
const companys = [
    'A005930', 'A000660', 'A373220', 'A207940', 'A005380',
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

const code2name = {
    'A005930': "삼성전자",
    'A000660': "SK하이닉스",
    'A373220': "LG에너지솔루션",
    'A207940': "삼성바이오로직스",
    'A005380': "현대차",
    'A005935': "삼성전자우",
    'A000270': "기아",
    'A068270': "셀트리온",
    'A105560': "KB금융",
    'A035420': "NAVER",
    'A055550': "신한지주",
    'A012330': "현대모비스",
    'A005490': "POSCO홀딩스",
    'A028260': "삼성물산",
    'A032830': "삼성생명",
    'A010130': "고려아연",
    'A051910': "LG화학",
    'A329180': "HD현대중공업",
    'A138040': "메리츠금융지주",
    'A006400': "삼성SDI",
    'A012450': "한화에어로스페이스",
    'A000810': "삼성화재",
    'A086790': "하나금융지주",
    'A011200': "HMM",
    'A035720': "카카오",
    'A015760': "한국전력",
    'A033780': "KT&G",
    'A066570': "LG전자",
    'A259960': "크래프톤",
    'A034020': "두산에너빌리티",
    'A009540': "HD한국조선해양",
    'A003670': "포스코퓨처엠",
    'A267260': "HD현대일렉트릭",
    'A316140': "우리금융지주",
    'A017670': "SK텔레콤",
    'A042660': "한화오션",
    'A003550': "LG",
    'A018260': "삼성에스디에스",
    'A024110': "기업은행",
    'A402340': "SK스퀘어",
    'A030200': "KT",
    'A010140': "삼성중공업",
    'A034730': "SK",
    'A323410': "카카오뱅크",
    'A096770': "SK이노베이션",
    'A000100': "유한양행",
    'A003490': "대한항공",
    'A086280': "현대글로비스",
    'A352820': "하이브",
    'A047050': "포스코인터내셔널"
}

main();

async function main() {
    for(let i = 0; i < companys.length; i++) {
        const url = `https://comp.fnguide.com/SVO2/ASP/SVD_Corp.asp?pGB=1&gicode=${companys[i]}&cID=&MenuYn=Y&ReportGB=&NewMenuID=102&stkGb=701`;
        await fetchData(url, companys[i]);

        console.log(i, " [DONE]")
    }
}

async function fetchData(url, companyCode) {

    const response = await axios.get(url);
    const data = await response.data;

    const $ = cheerio.load(data);

    const marketShare = $('div.ul_col2_r div.um_table.pd_t1 table tbody tr').map((idx, elem) => {
        const companyName = code2name[companyCode];
        const mainProduct = $(elem).find('th div').text().trim();
        const sharePercent = $(elem).find('td').text().trim();

        if(sharePercent)
            return {
                companyName,
                mainProduct,
                sharePercent
            }
    }).get();
    
    // console.log(marketShare)
    saveToFile(filename, marketShare)

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