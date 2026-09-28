@echo off
title CampusIQ+ API Gateway Endpoint Tester
echo ===============================================================================
echo            Running CampusIQ+ API Gateway Microservices Test Suite
echo ===============================================================================
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0test-gateway-endpoints.ps1"
pause
