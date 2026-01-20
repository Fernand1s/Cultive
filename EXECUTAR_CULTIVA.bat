@echo off
title Sistema Cultiva+ Full Stack
echo ====================================================
echo        INICIALIZANDO ECOSSISTEMA CULTIVA+ 🌿
echo ====================================================

:: 1. INICIANDO O BACK-END
echo [1/2] Iniciando API (Spring Boot)...
:: O segredo: rodamos o JAR a partir da raiz para o ./data ser encontrado
start "API Server" java -jar cultivamais/target/cultivamais-0.0.1-SNAPSHOT.jar

:: 2. AGUARDANDO BOOT DA API
echo Aguardando inicializacao do servidor (12s)...
timeout /t 12 /nobreak

:: 3. INICIANDO O FRONT-END
echo [2/2] Iniciando Interface (React + Vite)...
cd cultiva-front
start "Front-end" cmd /c "npm run dev -- --open"

exit