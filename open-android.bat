@echo off
title Open Android Studio

set PNPM_CMD=C:\Users\19002857\AppData\Roaming\npm\pnpm.cmd
set PROJECT_DIR=C:\Users\19002857\Desktop\plant2048\artifacts\plant-2048
set PATH=C:\Program Files\nodejs;%APPDATA%\npm;%PATH%

cd /d "%PROJECT_DIR%"
echo Opening Android Studio...
call "%PNPM_CMD%" exec cap open android

pause
