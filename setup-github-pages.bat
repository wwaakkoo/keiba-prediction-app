@echo off
echo 🏇 競馬予測アプリ GitHub Pages セットアップ
echo ============================================
echo.

echo 📋 必要な手順:
echo 1. GitHubでリポジトリを作成
echo 2. このプロジェクトをプッシュ
echo 3. GitHub Pagesを有効化
echo.

echo 🔧 自動セットアップを開始します...
echo.

REM Gitの初期化
if not exist .git (
    echo 📁 Gitリポジトリを初期化中...
    git init
    echo ✅ Git初期化完了
) else (
    echo ℹ️ 既にGitリポジトリが存在します
)

REM ファイルをステージング
echo 📦 ファイルをステージング中...
git add .
echo ✅ ステージング完了

REM 初回コミット
echo 💾 初回コミット中...
git commit -m "Initial commit: 競馬予測アプリ"
echo ✅ コミット完了

echo.
echo 🎯 次の手順:
echo.
echo 1. GitHubで新しいリポジトリを作成してください
echo   例: https://github.com/[あなたのユーザー名]/keiba-prediction-app
echo.
echo 2. 以下のコマンドを実行してください:
echo    git remote add origin https://github.com/[あなたのユーザー名]/keiba-prediction-app.git
echo    git branch -M main
echo    git push -u origin main
echo.
echo 3. GitHub Pagesを有効化:
echo    - リポジトリのSettings → Pages
echo    - Source: Deploy from a branch
echo    - Branch: gh-pages
echo    - Save
echo.
echo 4. 数分後に以下のURLでアクセス可能:
echo    https://[あなたのユーザー名].github.io/keiba-prediction-app/
echo.

pause 