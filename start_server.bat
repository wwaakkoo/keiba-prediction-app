@echo off
echo 競馬予測アプリを起動中...
echo.
echo このアプリは以下のURLでアクセスできます：
echo http://localhost:8000
echo.
echo 携帯からアクセスする場合は、同じWiFiに接続して
echo http://[PCのIPアドレス]:8000 でアクセスしてください
echo.
echo PCのIPアドレスを確認するには「ipconfig」を実行してください
echo.
echo サーバーを停止するには Ctrl+C を押してください
echo.
python -m http.server 8000
pause 