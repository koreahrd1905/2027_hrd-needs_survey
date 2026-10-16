/**
 * ============================================================================
 * [2027 구성원 교육니즈 설문조사 - 구글 스프레드시트 실시간 연동 완성본 스크립트]
 * ============================================================================
 * 
 * ★ [초간단 적용 방법]
 * 1. 구글 스프레드시트 메뉴에서 [확장 프로그램] ➡️ [Apps Script] 클릭
 * 2. 기존 코드를 모두 지우고 이 코드 전체를 복사하여 붙여넣기 후 [저장 (Ctrl + S)]
 * 3. 상단 함수 선택창에서 [setupHeaders] 선택 후 [실행] 클릭!
 *    👉 1행에 문항 번호와 질문 내용(네이비 블루 헤더)이 즉시 예쁘게 생성됩니다!
 *    👉 기존에 1행에 들어가 있던 응답 데이터는 자동으로 2행으로 안전하게 밀려 내려갑니다!
 * 4. 우측 상단 [배포] ➡️ [새 배포] ➡️ 유형: 웹 앱(Web app)
 *    - 다음 사용자 권한으로 실행: [나 (내 계정)]
 *    - 액세스 권한: [모든 사용자 (Anyone)]
 *    - [배포] 클릭 완료!
 * ============================================================================
 */

// 46개 전체 문항 공식 헤더 목록 (캡처 2 규격 100% 일치)
var COLUMN_HEADERS = [
  "응답 ID",
  "제출 일시",
  "1. 귀하의 소속(회사/실(본부)/부서) [소속 회사]",
  "1. 귀하의 소속(회사/실(본부)/부서) [실/본부]",
  "1. 귀하의 소속(회사/실(본부)/부서) [소속 부서]",
  "2. 귀하의 직군을 선택해 주십시오. (각 사 기준)",
  "3. 귀하의 직급/직책은 무엇입니까?",
  "4. 우리 회사는 직원 경력개발을 위한 교육 체계를 갖추고 있다.",
  "4-1. ‘그렇지 않다’ 또는 ‘매우 그렇지 않다’를 선택하신 경우, 그 이유를 자유롭게 작성하여 주세요",
  "5. 우리 회사는 직원들에게 충분한 교육 기회를 제공한다.",
  "5-1. ‘그렇지 않다’ 또는 ‘매우 그렇지 않다’를 선택하신 경우, 그 이유를 자유롭게 작성하여 주세요",
  "6. 우리 회사에서 운영하는 교육과정에 전반적으로 만족하고 있다.",
  "6-1. ‘그렇지 않다’ 또는 ‘매우 그렇지 않다’를 선택하신 경우, 그 이유를 자유롭게 작성하여 주세요",
  "7. 회사에서 제공하는 교육 내용은 업무 수행과 회사 생활에 도움이 된다.",
  "7-1. ‘그렇지 않다’ 또는 ‘매우 그렇지 않다’를 선택하신 경우, 그 이유를 자유롭게 작성하여 주세요",
  "8. 교육 참여에 가장 큰 어려움은 무엇입니까? (최대 2개까지 선택 가능)",
  "8-1. [기타 의견] 있으시면 자유롭게 작성하여 주세요",
  "9. 나의 관리자는 교육의 필요성을 인식하고, 직원의 교육 참여를 적극 지원한다.",
  "9-1. ‘그렇지 않다’ 또는 ‘매우 그렇지 않다’를 선택하신 경우, 그 이유를 자유롭게 작성하여 주세요",
  "10. 선호하는 교육 방법은 무엇입니까?",
  "11. 태광러닝센터 온라인 교육센터 운영 만족도는?",
  "11-1. 개선되었으면 하는 사항이 있다면 자유롭게 작성하여 주세요",
  "12. [흥국생명 용인연수원] 연수원 식당(식사, 서비스)에 대한 만족도는?",
  "12-1. 개선되었으면 하는 사항이 있다면 자유롭게 작성하여 주세요",
  "13. [흥국생명 용인연수원] 연수원 숙소(청결, 편의시설 등)에 대한 만족도는?",
  "13-1. 개선되었으면 하는 사항이 있다면 자유롭게 작성하여 주세요",
  "14. 우리 회사(또는 부서)는 일하는 방식의 혁신을 지속적으로 시도하고 있다.",
  "15. 일하는 방식의 혁신을 위해 우리 회사 직원에게 필요한 교육은 무엇이라고 생각하십니까? (최대 2개까지 선택 가능)",
  "16. 다음은 빠르게 변화하는 AI 시대에 리더에게 요구되는 역할입니다. 아래 문항 중 우리 회사 리더에게 우선적으로 필요한 역할은 무엇이라고 생각하십니까? (최대 2개까지 선택 가능)",
  "17. 건강한 조직문화를 위하여 우리 회사 리더 대상 교육에 우선적으로 다루어야 할 주제는 무엇이라고 생각하십니까? (복수 응답 가능)",
  "17-1. [기타 의견] 있으시면 자유롭게 작성하여 주세요",
  "18. 건강한 조직문화를 만들기 위해 ‘리더 이외의’ 직원 교육에 우선적으로 다루어야 할 주제는 무엇이라고 생각하십니까? (복수 응답 가능)",
  "18-1. 이외 희망하는 교육(활동)이 있다면, 대상과 주제를 작성하여 주시기 바랍니다.",
  "19. 나는 회사에서 제공하는 직무 교육*에 대해 전반적으로 만족하고 있다. (* 직무 교육: 워크스마트과정, 직무맞춤교육, 사외교육 등)",
  "19-1. ‘그렇지 않다’ 또는 ‘매우 그렇지 않다’를 선택하신 경우, 그 이유는 무엇이라 생각하십니까?",
  "20. 우리 회사는 나에게 충분한 직무 교육 기회를 제공하고 있다.",
  "21. 우리 회사에서 제공하는 직무 교육의 내용은 내 업무 수행에 도움이 된다.",
  "22. (주관식) 현재 본인이 수행하고 있는 직무와 관련하여, 필요하다고 생각되는 직무맞춤 교육*이 있다면 자유롭게 기술해 주시기 바랍니다. (* 직무맞춤 교육: 부서·직무별 특화된 맞춤형 전문교육)",
  "23. (주관식) 직무역량 강화를 위해 현재 준비 중이거나 취득을 계획하고 있는 전문자격증이 있다면 기재해 주세요.",
  "24. 본인이 생각하는 AI 및 디지털 역량 수준은?",
  "25. (26년 교육 수료자만 답변하세요) 워크스마트과정(생성형 AI를 활용한 직무 업스킬링 과정)의 현업 적용 수준은?",
  "26. (26년 교육 수료자만 답변하세요) 현업 적용이 어려웠다면 그 이유는? (복수 응답 가능)",
  "26-1. [기타 의견] 있으시면 자유롭게 작성하여 주세요",
  "27. 수강을 희망하는 교육 과정을 선택해 주시기 바랍니다. (최대 3개까지 선택 가능)",
  "28. (주관식) 상기 27번 보기 외에, 본인의 직무역량 향상을 위해 수강을 희망하는 주제나 교육 내용이 있다면 자유롭게 작성해 주십시오.",
  "29. (주관식) 2027년 연간 교육계획 수립과 사내교육운영 전반(일정, 방식, 지원제도 등)에 대해 회사나 교육부서에 바라는 점을 작성해 주십시오."
];

// 각 컬럼에 매핑되는 데이터 키 목록
var COLUMN_KEYS = [
  "id",
  "submitted_at",
  "q1_company",
  "q1_division",
  "q1_department",
  "q2",
  "q3",
  "q4",
  "q4_1",
  "q5",
  "q5_1",
  "q6",
  "q6_1",
  "q7",
  "q7_1",
  "q8",
  "q8_1",
  "q9",
  "q9_1",
  "q10",
  "q11",
  "q11_1",
  "q12",
  "q12_1",
  "q13",
  "q13_1",
  "q14",
  "q15",
  "q16",
  "q17",
  "q17_1",
  "q18",
  "q18_1",
  "q19",
  "q19_1",
  "q20",
  "q21",
  "q22",
  "q23",
  "q24",
  "q25",
  "q26",
  "q26_1",
  "q27",
  "q28",
  "q29"
];

/**
 * ★ [1행 헤더 자동 생성 및 서식 적용 함수]
 * 상단에서 setupHeaders 선택 후 [실행] 버튼을 누르면 1행에 헤더가 즉시 자동 생성됩니다.
 */
function setupHeaders() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();
  
  // 만약 1행에 이미 응답 데이터(예: resp_...)가 들어가 있다면 1행 위에 빈 행을 하나 삽입하여 밀어냄
  var firstCellVal = String(sheet.getRange(1, 1).getValue() || '');
  if (firstCellVal.indexOf('resp_') !== -1 || (firstCellVal && firstCellVal !== '응답 ID')) {
    sheet.insertRowBefore(1);
  }
  
  // 1행에 46개 문항 제목 헤더 일괄 입력
  sheet.getRange(1, 1, 1, COLUMN_HEADERS.length).setValues([COLUMN_HEADERS]);
  
  // 헤더 스타일 서식 적용 (캡처 2와 100% 동일한 고급 네이비 블루 디자인)
  var headerRange = sheet.getRange(1, 1, 1, COLUMN_HEADERS.length);
  headerRange.setBackground('#1e3a8a')       // 깊고 신뢰감 있는 다크 네이비 블루
             .setFontColor('#ffffff')       // 선명한 화이트 텍스트
             .setFontWeight('bold')         // 볼드체 강조
             .setFontSize(10)               // 가독성 높은 폰트 크기
             .setHorizontalAlignment('center') // 가운데 정렬
             .setVerticalAlignment('middle')   // 수직 중앙 정렬
             .setWrap(false);               // 줄바꿈 방지
  
  sheet.setRowHeight(1, 36);                // 헤더 행 높이 36px 확보
  sheet.setFrozenRows(1);                   // 1행 틀 고정 (스크롤해도 헤더 상단 고정)
  
  // 주요 인적사항 컬럼 폭 적정 너비 설정
  sheet.setColumnWidth(1, 150); // 응답 ID
  sheet.setColumnWidth(2, 170); // 제출 일시
  sheet.setColumnWidth(3, 140); // 소속 회사
  sheet.setColumnWidth(4, 150); // 실/본부
  sheet.setColumnWidth(5, 160); // 소속 부서
  sheet.setColumnWidth(6, 120); // 직군
  sheet.setColumnWidth(7, 100); // 직급
  
  Logger.log('★ [성공] 1행에 문항 번호와 질문 내용(총 ' + COLUMN_HEADERS.length + '개 컬럼)이 정상 배치되었습니다!');
}

/**
 * ★ [설문 응답 실시간 수신 및 자동 기록 함수]
 * 임직원이 웹에서 설문 제출 시 호출되어 1행 헤더 아래에 데이터를 정확히 한 줄씩 기록합니다.
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(15000);
  
  try {
    var rawData = "";
    if (e && e.postData && e.postData.contents) {
      rawData = e.postData.contents;
    } else if (e && e.parameter && e.parameter.data) {
      rawData = e.parameter.data;
    }
    
    var data = {};
    try {
      data = JSON.parse(rawData);
    } catch(err) {
      data = e.parameter || {};
    }
    
    var action = data.action || 'survey_submit';
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // ------------------------------------------------------------------------
    // 1. 설문 응답 로우데이터 저장
    // ------------------------------------------------------------------------
    if (action === 'survey_submit') {
      var sheet = ss.getActiveSheet();
      
      // 만약 1행에 헤더가 없는 상태라면 자동으로 헤더 먼저 생성
      var firstCell = String(sheet.getRange(1, 1).getValue() || '');
      if (sheet.getLastRow() === 0 || firstCell !== '응답 ID') {
        setupHeaders();
      }
      
      var submissionId = data.id || ('resp_' + new Date().getTime());
      var nowStr = data.submitted_at || Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
      var answers = data.answers || {};
      
      // 46개 컬럼 순서에 1:1로 정확하게 매핑되는 데이터 행 생성
      var newRow = [];
      for (var i = 0; i < COLUMN_KEYS.length; i++) {
        var key = COLUMN_KEYS[i];
        var val = "";
        
        if (key === 'id') {
          val = submissionId;
        } else if (key === 'submitted_at') {
          val = nowStr;
        } else if (key === 'q1_company') {
          val = answers['q1_company'] || data.company || '';
        } else if (key === 'q1_division') {
          val = answers['q1_division'] || data.division || '';
        } else if (key === 'q1_department') {
          val = answers['q1_department'] || data.department || '';
        } else if (key === 'q2') {
          val = answers['q2'] || data.job_group || '';
        } else if (key === 'q3') {
          val = answers['q3'] || data.position || '';
        } else {
          // 일반 문항 및 주관식 문항
          val = answers[key];
          if (val === undefined || val === null) {
            val = data[key] || '';
          }
          if (Array.isArray(val)) {
            val = val.join(', ');
          }
        }
        
        newRow.push(val);
      }
      
      // 시트에 실시간 1행 추가
      sheet.appendRow(newRow);
      
      // 추가된 행 서식: 높이 26px, 텍스트 수직 중앙 정렬
      var lastRow = sheet.getLastRow();
      sheet.setRowHeight(lastRow, 26);
      sheet.getRange(lastRow, 1, 1, newRow.length).setVerticalAlignment('middle');
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        id: submissionId,
        row: lastRow,
        message: '설문 응답이 구글 스프레드시트에 성공적으로 기록되었습니다.'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // ------------------------------------------------------------------------
    // 2. 스타벅스 이벤트 응모 저장 (소속회사별 시트 분리: 스타벅스_흥국생명 / 스타벅스_흥국화재)
    // ------------------------------------------------------------------------
    else if (action === 'event_submit') {
      var rawCompany = String(data.company || '흥국생명').trim();
      var isFire = rawCompany.indexOf('화재') !== -1;
      var targetCompany = isFire ? '흥국화재' : '흥국생명';
      var sheetName = isFire ? '스타벅스_흥국화재' : '스타벅스_흥국생명';
      
      var targetSheet = ss.getSheetByName(sheetName);
      var evtHeaders = ['순위', '접수번호', '골인시각', '소속회사', '당첨여부', '전화번호', '설문ID', '소속부서', '직군', '직급', '게임모드'];

      if (!targetSheet) {
        targetSheet = ss.insertSheet(sheetName);
        targetSheet.appendRow(evtHeaders);
        targetSheet.getRange(1, 1, 1, evtHeaders.length)
                   .setBackground(isFire ? '#1d4ed8' : '#be185d') // 화재: 블루 / 생명: 마젠타
                   .setFontColor('#ffffff')
                   .setFontWeight('bold')
                   .setHorizontalAlignment('center');
        targetSheet.setFrozenRows(1);
      }
      
      var phone = String(data.phone || '').replace(/[^0-9]/g, '');
      var formattedPhone = phone.length === 11 ? 
        phone.slice(0,3) + '-' + phone.slice(3,7) + '-' + phone.slice(7) : 
        (phone.length === 10 ? phone.slice(0,3) + '-' + phone.slice(3,6) + '-' + phone.slice(6) : phone);
      
      var nowStr = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
      var rowCount = targetSheet.getLastRow();
      var rank = data.rank || rowCount;
      var entryId = 'EVT-' + Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyyMMdd-') + rowCount;
      
      var winnerStatus = data.winner_status;
      if (!winnerStatus) {
        if (data.game_version === 2) {
          winnerStatus = data.is_winner ? '당첨' : '미당첨(선착순마감)';
        } else {
          winnerStatus = '추첨대기';
        }
      }

      var gameModeStr = (data.game_version === 2) ? '게임 2 (실시간 선착순)' : '게임 1 (기존 추첨)';

      var eventRow = [
        rank,
        entryId,
        nowStr,
        targetCompany,
        winnerStatus,
        formattedPhone,
        data.survey_id || '',
        data.department || '',
        data.job_group || '',
        data.position || '',
        gameModeStr
      ];
      targetSheet.appendRow(eventRow);
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        entry_id: entryId,
        sheet: sheetName,
        rank: rank,
        winner_status: winnerStatus,
        message: '이벤트 응모 데이터가 [' + sheetName + '] 시트에 실시간 기록되었습니다.'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

/**
 * 상태 확인용 GET 엔드포인트
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    total_columns: COLUMN_HEADERS.length,
    message: '2027 HRD 설문조사 Apps Script API 정상 가동 중'
  })).setMimeType(ContentService.MimeType.JSON);
}
