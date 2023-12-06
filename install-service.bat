@echo off
echo Installing...
@echo>start-service.bat
@echo WinSW-x64 start service.xml> start.bat
WinSW-x64 install service.xml
npm install