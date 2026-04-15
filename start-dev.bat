@echo off
chcp 65001 > nul
cd /d "C:\Users\19002857\Desktop\업무\2048\COLOR-~1\COLOR-~1\ARTIFA~1\GARDEN~1"
if errorlevel 1 (
  echo Path error, trying full path...
  cd /d "C:\Users\19002857\Desktop\업무\2048\Color-Bloom\Color-Bloom\artifacts\garden-2048"
)
"C:\Program Files\nodejs\pnpm.cmd" install
"C:\Program Files\nodejs\pnpm.cmd" run dev
