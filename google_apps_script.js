/**
 * ============================================================================
 * [2027 구성원 교육니즈 설문조사 - 구글 스프레드시트 1:1 완벽 정렬 연동 스크립트]
 * ============================================================================
 * 
 * ★ A1~AT1 46개 전체 문항 제목과 작성자 응답 데이터를 100% 1:1로 정확하게 일치시킵니다.
 * ★ 흥국생명 / 흥국화재 스타벅스 이벤트 당첨자 시트 자동 분리 기록 지원
 * 
 * 📌 [적용 방법 (1분 소요)]:
 * 1. 구글 스프레드시트 메뉴에서 [확장 프로그램] ➡️ [Apps Script] 클릭
 * 2. 기존 코드를 전체 선택(Ctrl + A)하여 삭제하고, 이 코드 전체를 붙여넣기(Ctrl + V) 후 [저장 (Ctrl + S)]
 * 3. 상단 함수 목록에서 [setupHeaders] 선택 후 [실행] 클릭!
 *    👉 1행(A1~AT1)에 46개 공식 문항 제목이 깔끔한 네이비 블루 서식으로 정돈됩니다!
 * 4. 우측 상단 [배포] ➡️ [배포 관리] ➡️ 연필(수정) 아이콘 ➡️ 버전: [새 버전] 선택 ➡️ [배포] 클릭 완료!
 * ============================================================================
 */

// 1. A1부터 AT1까지 46개 전체 문항 공식 헤더 목록 (캡처 규격 100% 일치)
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

// 2. A열부터 AT열까지 46개 컬럼에 1:1로 매핑되는 폼 필드 데이터 키 목록
var COLUMN_KEYS = [
  "id",             // Col A (01)
  "submitted_at",   // Col B (02)
  "q1_company",     // Col C (03) -> 1. 소속 회사
  "q1_division",    // Col D (04) -> 1. 실/본부
  "q1_department",  // Col E (05) -> 1. 소속 부서
  "q2",             // Col F (06) -> 2. 직군
  "q3",             // Col G (07) -> 3. 직급/직책
  "q4",             // Col H (08) -> 4번 문항 (객관식)
  "q4_1",           // Col I (09) -> 4-1번 사유 (주관식)
  "q5",             // Col J (10) -> 5번 문항 (객관식)
  "q5_1",           // Col K (11) -> 5-1번 사유 (주관식)
  "q6",             // Col L (12) -> 6번 문항 (객관식)
  "q6_1",           // Col M (13) -> 6-1번 사유 (주관식)
  "q7",             // Col N (14) -> 7번 문항 (객관식)
  "q7_1",           // Col O (15) -> 7-1번 사유 (주관식)
  "q8",             // Col P (16) -> 8번 문항 (복수선택)
  "q8_1",           // Col Q (17) -> 8-1번 기타의견 (주관식)
  "q9",             // Col R (18) -> 9번 문항 (객관식)
  "q9_1",           // Col S (19) -> 9-1번 사유 (주관식)
  "q10",            // Col T (20) -> 10번 교육방법 선호
  "q11",            // Col U (21) -> 11번 태광러닝센터 만족도
  "q11_1",          // Col V (22) -> 11-1번 개선사항 (주관식)
  "q12",            // Col W (23) -> 12번 용인연수원 식당 만족도
  "q12_1",          // Col X (24) -> 12-1번 개선사항 (주관식)
  "q13",            // Col Y (25) -> 13번 용인연수원 숙소 만족도
  "q13_1",          // Col Z (26) -> 13-1번 개선사항 (주관식)
  "q14",            // Col AA (27) -> 14번 일하는 방식 혁신
  "q15",            // Col AB (28) -> 15번 필요 교육 (복수선택)
  "q16",            // Col AC (29) -> 16번 리더 역할 (복수선택)
  "q17",            // Col AD (30) -> 17번 리더 교육주제 (복수선택)
  "q17_1",          // Col AE (31) -> 17-1번 기타의견 (주관식)
  "q18",            // Col AF (32) -> 18번 직원 교육주제 (복수선택)
  "q18_1",          // Col AG (33) -> 18-1번 기타의견 (주관식)
  "q19",            // Col AH (34) -> 19번 직무교육 만족도
  "q19_1",          // Col AI (35) -> 19-1번 사유 (주관식)
  "q20",            // Col AJ (36) -> 20번 직무교육 기회
  "q21",            // Col AK (37) -> 21번 업무 도움도
  "q22",            // Col AL (38) -> 22번 (주관식) 직무맞춤 교육
  "q23",            // Col AM (39) -> 23번 (주관식) 전문자격증
  "q24",            // Col AN (40) -> 24번 AI·디지털 역량수준
  "q25",            // Col AO (41) -> 25번 26년 워크스마트 적용도
  "q26",            // Col AP (42) -> 26번 적용어려움 사유
  "q26_1",          // Col AQ (43) -> 26-1번 기타의견 (주관식)
  "q27",            // Col AR (44) -> 27번 수강희망 과정 (복수선택)
  "q28",            // Col AS (45) -> 28번 (주관식) 기타 희망주제
  "q29"             // Col AT (46) -> 29번 (주관식) HRD 제언
];

/**
 * 1. [헤더 자동 생성 및 서식 적용]
 */
function setupHeaders() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = getSurveyTargetSheet(ss);
  
  // 1행에 46개 문항 헤더 일괄 입력
  sheet.getRange(1, 1, 1, COLUMN_HEADERS.length).setValues([COLUMN_HEADERS]);
  
  // 헤더 서식 지정 (다크 네이비 블루, 화이트 볼드, 수직/수평 중앙 정렬)
  var headerRange = sheet.getRange(1, 1, 1, COLUMN_HEADERS.length);
  headerRange.setBackground('#1e3a8a')
             .setFontColor('#ffffff')
             .setFontWeight('bold')
             .setFontSize(10)
             .setHorizontalAlignment('center')
             .setVerticalAlignment('middle')
             .setWrap(false);
  
  sheet.setRowHeight(1, 38);
  sheet.setFrozenRows(1);
  
  // 인적사항 주요 열 폭 자동 최적화
  sheet.setColumnWidth(1, 150); // 응답 ID
  sheet.setColumnWidth(2, 160); // 제출 일시
  sheet.setColumnWidth(3, 130); // 소속 회사
  sheet.setColumnWidth(4, 150); // 실/본부
  sheet.setColumnWidth(5, 160); // 소속 부서
  sheet.setColumnWidth(6, 120); // 직군
  sheet.setColumnWidth(7, 110); // 직급
}

/**
 * 설문 응답을 저장할 기본 시트 찾기
 */
function getSurveyTargetSheet(ss) {
  var sheet = ss.getSheetByName('설문응답_로우데이터') || ss.getSheetByName('설문응답');
  if (sheet) return sheet;
  
  var allSheets = ss.getSheets();
  for (var i = 0; i < allSheets.length; i++) {
    var name = allSheets[i].getName();
    if (name.indexOf('스타벅스') === -1) {
      return allSheets[i];
    }
  }
  return allSheets[0];
}

/**
 * 2. [실시간 데이터 수신 및 A1~AT1 1:1 기록]
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    var rawData = "{}";
    if (e && e.postData && e.postData.contents) {
      rawData = e.postData.contents;
    } else if (e && e.parameter && e.parameter.data) {
      rawData = e.parameter.data;
    }
    
    var data = {};
    try {
      data = JSON.parse(rawData);
    } catch(err) {
      data = (e && e.parameter) ? e.parameter : {};
    }
    
    var action = data.action || 'survey_submit';
    
    // ------------------------------------------------------------------------
    // [Action 1] 29개 설문 응답 본문 1:1 완벽 정렬 저장
    // ------------------------------------------------------------------------
    if (action === 'survey_submit') {
      var sheet = getSurveyTargetSheet(ss);
      
      var firstCell = String(sheet.getRange(1, 1).getValue() || '');
      if (sheet.getLastRow() === 0 || firstCell !== '응답 ID') {
        setupHeaders();
      }
      
      var submissionId = data.id || ('resp_' + new Date().getTime());
      var nowStr = data.submitted_at || Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
      var answers = data.answers || {};
      
      // 46개 컬럼(A열~AT열)에 1:1로 정확하게 들어갈 데이터 행 구성
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
          // 객관식, 복수선택, 서브이유, 주관식 문항
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
      
      // 1행 헤더 아래에 1:1로 완벽하게 1행 추가
      sheet.appendRow(newRow);
      
      var lastRow = sheet.getLastRow();
      sheet.setRowHeight(lastRow, 26);
      sheet.getRange(lastRow, 1, 1, newRow.length).setVerticalAlignment('middle');
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        id: submissionId,
        row: lastRow,
        message: 'A1~AT1 헤더에 1:1로 완벽히 정렬되어 기록되었습니다.'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // ------------------------------------------------------------------------
    // [Action 2] 스타벅스 이벤트 응모 저장 (흥국생명 / 흥국화재 시트 자동 분리)
    // ------------------------------------------------------------------------
    else if (action === 'event_submit') {
      var rawCompany = String(data.company || '흥국생명').trim();
      var isFire = rawCompany.indexOf('화재') !== -1;
      var targetCompany = isFire ? '흥국화재' : '흥국생명';
      var targetSheetName = isFire ? '스타벅스_흥국화재' : '스타벅스_흥국생명';
      
      var targetSheet = ss.getSheetByName(targetSheetName);
      var evtHeaders = ['순위', '접수번호', '골인시각', '소속회사', '당첨여부', '전화번호', '설문ID', '소속부서', '직군', '직급', '게임모드'];

      if (!targetSheet) {
        targetSheet = ss.insertSheet(targetSheetName);
        targetSheet.appendRow(evtHeaders);
        targetSheet.getRange(1, 1, 1, evtHeaders.length)
                   .setBackground(isFire ? '#1d4ed8' : '#be185d') // 화재: 블루 / 생명: 마젠타
                   .setFontColor('#ffffff')
                   .setFontWeight('bold')
                   .setHorizontalAlignment('center')
                   .setVerticalAlignment('middle');
        targetSheet.setRowHeight(1, 34);
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
        sheet: targetSheetName,
        rank: rank,
        winner_status: winnerStatus,
        message: '이벤트 응모 데이터가 [' + targetSheetName + '] 시트에 실시간 기록되었습니다.'
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

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'online',
    service: '2027 HRD Needs Survey Apps Script Web App',
    time: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
