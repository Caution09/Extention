@echo off
echo default-master.js生成ツール
echo ========================

REM Pythonの存在確認
python --version >nul 2>&1
if errorlevel 1 (
    echo エラー: Pythonがインストールされていません
    echo Pythonをインストールしてから再実行してください
    pause
    exit /b 1
)

echo Pythonスクリプトを実行中...
python "%~dp0generate_master.py"

if errorlevel 1 (
    echo エラー: スクリプトの実行に失敗しました
) else (
    echo 正常に完了しました
)

echo.
echo 任意のキーを押してください...
pause >nul