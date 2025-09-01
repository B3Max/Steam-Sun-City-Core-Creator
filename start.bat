@echo off
chcp 65001 >nul
echo Запуск Steam Sun - Конструктор изобретений...
echo.

echo Сборка Docker-образа...
docker build -t steam-sun-app .

echo.
echo Запуск контейнера...
docker run -d -p 3000:3000 --name steam-sun-container steam-sun-app

echo.
echo Приложение запущено!
echo Откройте браузер и перейдите по адресу: http://localhost:3000
echo.
echo Для остановки используйте: docker stop steam-sun-container
echo Для удаления контейнера: docker rm steam-sun-container
pause
