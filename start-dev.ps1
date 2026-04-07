# plant-2048 dev server launcher
$env:PATH = "C:\Program Files\nodejs;" + $env:PATH
$projectPath = "C:\Users\19002857\Desktop\업무\2048\Color-Bloom\Color-Bloom\artifacts\plant-2048"
Set-Location $projectPath
& "C:\Program Files\nodejs\pnpm.cmd" install
& "C:\Program Files\nodejs\pnpm.cmd" run dev
