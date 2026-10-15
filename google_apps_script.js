/**
 * ============================================================================
 * [구글 스프레드시트용 Google Apps Script 코드]
 * ============================================================================
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    var rawData = e.postData.contents;
    var data = JSON.parse(rawData);
    var action = data.action || 'survey_submit';
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. 설문 응답 로우데이터 저장
    if (action === 'survey_submit') {
      var sheet = ss.getSheetByName('설문응답_로우데이터');
      if (!sheet) {
        sheet = ss.insertSheet('설문응답_로우데이터');
        var headers = [
          '고유ID', '제출일시', '소속회사', '소속부문', '직군', '직급', 
          '선호교육방식', '주관식_교육Needs(Q28)', '주관식_피드백(Q29)'
        ];
        for (var i = 1; i <= 29; i++) {
          headers.push('Q' + i + '_답변');
        }
        sheet.appendRow(headers);
        sheet.getRange(1, 1, 1, headers.length).setBackground('#1e3a8a').setFontColor('#ffffff').setFontWeight('bold');
        sheet.setFrozenRows(1);
      }
      
      var submissionId = 'resp_' + new Date().getTime();
      var nowStr = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
      var answers = data.answers || {};
      
      var row = [
        submissionId,
        nowStr,
        answers['q1_company'] || '',
        data.department || answers['q1_department'] || '',
        data.job_group || answers['q2'] || '',
        data.position || answers['q3'] || '',
        data.delivery_mode || answers['q10'] || '',
        data.open_needs || '',
        data.open_feedback || ''
      ];
      
      for (var q = 1; q <= 29; q++) {
        var ans = answers['q' + q];
        if (Array.isArray(ans)) {
          row.push(ans.join(', '));
        } else {
          row.push(ans !== undefined ? ans : '');
        }
      }
      
      sheet.appendRow(row);
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        id: submissionId,
        message: '설문 응답이 구글 시트에 정상 기록되었습니다.'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 2. 스타벅스 이벤트 응모 저장
    else if (action === 'event_submit') {
      var eventSheet = ss.getSheetByName('스타벅스_이벤트응모자');
      if (!eventSheet) {
        eventSheet = ss.insertSheet('스타벅스_이벤트응모자');
        var eventHeaders = ['접수번호', '전화번호', '설문ID', '응모일시', '소속부문', '직군', '직급', '추첨당첨여부'];
        eventSheet.appendRow(eventHeaders);
        eventSheet.getRange(1, 1, 1, eventHeaders.length).setBackground('#006241').setFontColor('#ffffff').setFontWeight('bold');
        eventSheet.setFrozenRows(1);
      }
      
      var phone = String(data.phone || '').replace(/[^0-9]/g, '');
      var formattedPhone = phone.length === 11 ? 
        phone.slice(0,3) + '-' + phone.slice(3,7) + '-' + phone.slice(7) : phone;
      
      var lastRow = eventSheet.getLastRow();
      if (lastRow > 1) {
        var phoneColData = eventSheet.getRange(2, 2, lastRow - 1, 1).getValues();
        for (var p = 0; p < phoneColData.length; p++) {
          var existingPhone = String(phoneColData[p][0]).replace(/[^0-9]/g, '');
          if (existingPhone === phone) {
            return ContentService.createTextOutput(JSON.stringify({
              success: false,
              already_submitted: true,
              error: '이미 이벤트 응모가 완료된 번호입니다. (' + formattedPhone + ') 이벤트 응모는 1인 1회로 한정됩니다.'
            })).setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
      
      var entryId = 'EVT-' + Math.floor(Math.random() * 8999 + 1000) + '-' + lastRow;
      var eventRow = [
        entryId,
        formattedPhone,
        data.survey_id || '',
        Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss'),
        data.department || '',
        data.job_group || '',
        data.position || '',
        '미추첨'
      ];
      eventSheet.appendRow(eventRow);
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        entry_id: entryId,
        message: '이벤트 응모가 완료되었습니다.'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // 3. 전화번호 중복 사전 체크
    else if (action === 'event_check') {
      var checkSheet = ss.getSheetByName('스타벅스_이벤트응모자');
      var chkPhone = String(data.phone || '').replace(/[^0-9]/g, '');
      if (checkSheet && checkSheet.getLastRow() > 1) {
        var pData = checkSheet.getRange(2, 2, checkSheet.getLastRow() - 1, 1).getValues();
        for (var k = 0; k < pData.length; k++) {
          if (String(pData[k][0]).replace(/[^0-9]/g, '') === chkPhone) {
            return ContentService.createTextOutput(JSON.stringify({
              success: true,
              already_submitted: true
            })).setMimeType(ContentService.MimeType.JSON);
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        already_submitted: false
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
    status: 'ok',
    message: 'Google Apps Script API 정상 작동'
  })).setMimeType(ContentService.MimeType.JSON);
}
