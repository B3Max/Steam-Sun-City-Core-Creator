@echo off
chcp 65001 >nul
echo Остановка Steam Sun - Конструктор изобретений...
echo.

echo Остановка контейнера...
docker stop steam-sun-container

echo.
echo Удаление контейнера...
docker rm steam-sun-container

echo.
echo Приложение остановлено!
pause
