@echo off
ECHO Iniciando o servidor Backend da Lamarka Pecas...

REM Entra na pasta do backend e inicia o servidor em uma NOVA janela de terminal
cd backend
start "Servidor Backend - Lamarka" cmd /k node server.js

REM Volta para a pasta raiz do projeto
cd ..

ECHO Abrindo a interface do Frontend no navegador...

REM Entra na pasta do frontend e abre o arquivo index.html no navegador padrao
cd frontend
start index.html

ECHO.
ECHO Processo finalizado. O servidor esta rodando na outra janela.