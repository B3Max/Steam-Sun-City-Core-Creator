@echo off
chcp 65001 >nul
echo Перезапуск Steam Sun - Конструктор изобретений...
echo.

echo Остановка существующего контейнера...
docker stop steam-sun-container 2>nul
docker rm steam-sun-container 2>nul

echo.
echo Сборка Docker-образа...
docker build -t steam-sun-app .

echo.
echo Запуск нового контейнера...
docker run -d -p 3000:3000 --name steam-sun-container steam-sun-app

echo.
echo Приложение перезапущено!
echo Откройте браузер и перейдите по адресу: http://localhost:3000
echo.
@REM pause
