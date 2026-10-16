@echo off
chcp 65001 > nul
title 2027 구성원 교육 Needs 설문조사 - GitHub & Render 자동 배포
echo ===================================================================
echo  🚀 2027 구성원 교육 Needs 설문조사 - GitHub & Render 자동 배포
echo ===================================================================
echo.
echo [1/3] 변경된 최신 파일 스테이징 중...
cd /d "c:\실습\DEV\2027 구성원 교육니즈 설문조사"
git add .

echo [2/3] 커밋 생성 중...
git commit -m "Update survey and Bukang game settings"

echo [3/3] GitHub 저장소(origin/main)로 푸시 중...
git push origin main

echo.
echo ===================================================================
echo  ✅ GitHub 푸시 완료!
echo  🌐 Render(랜더)에서 1~2분 내로 라이브 웹페이지 자동 재배포가 완료됩니다.
echo  👉 배포 웹사이트: https://two027-hrd-needs-survey.onrender.com/
echo ===================================================================
echo.
pause
