git checkout --orphan temp_branch
git add -A
git commit -m "feat: complete admin dashboard backend integration"
git branch -D main
git branch -m main
git push -f origin main
git push -f lunatics main
