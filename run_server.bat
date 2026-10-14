@echo off
chcp 65001 >nul
echo =====================================================================
echo  [2027 그룹 인재육성 체계 수립 - 구성원 교육 Needs 설문조사 전용 서버]
echo  포트: 5001
echo  접속 URL: http://localhost:5001
echo =====================================================================
start "" "http://localhost:5001"
python app.py
pause
