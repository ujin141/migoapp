@echo off
cd /d "c:\Users\ujin1\Desktop\MIGO\MigoApp"

echo [1/4] Fixing auto-generated syntax errors in translations...
node fix_syntax.mjs

echo.
echo [2/4] Adding files to git...
git add .

echo [3/4] Committing changes...
git commit -m "fix: resolve corrupted syntax in locale files"

echo [4/4] Pushing to GitHub...
git push -u origin HEAD

echo.
echo =========================================
echo DEPLOYMENT TRIGGERED SUCCESSFULLY!
echo =========================================
echo Vercel will now auto-build and deploy.
echo.
pause
