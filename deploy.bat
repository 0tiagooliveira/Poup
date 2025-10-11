@echo off
:: ========================================
:: POUP+ - Script de Deploy Automatizado
:: ========================================

echo.
echo ========================================
echo   POUP+ - Deploy Automatizado
echo ========================================
echo.

:: Cores no terminal (Windows)
color 0A

:: Verificar se está na pasta correta
if not exist "index.html" (
    echo [ERRO] index.html nao encontrado!
    echo Execute este script na raiz do projeto.
    pause
    exit /b 1
)

echo [INFO] Pasta do projeto: %CD%
echo.

:: Menu de opcoes
echo Escolha uma opcao:
echo.
echo 1. Deploy apenas Firebase
echo 2. Deploy apenas GitHub
echo 3. Deploy completo (Firebase + GitHub)
echo 4. Teste local (Firebase Serve)
echo 5. Ver status do Git
echo 6. Cancelar
echo.

set /p opcao="Digite o numero da opcao: "

if "%opcao%"=="1" goto firebase_only
if "%opcao%"=="2" goto github_only
if "%opcao%"=="3" goto deploy_completo
if "%opcao%"=="4" goto teste_local
if "%opcao%"=="5" goto git_status
if "%opcao%"=="6" goto cancelar

echo [ERRO] Opcao invalida!
pause
exit /b 1

:: ========================================
:: FIREBASE ONLY
:: ========================================
:firebase_only
echo.
echo ========================================
echo   Deploy Firebase Hosting
echo ========================================
echo.

echo [INFO] Verificando Firebase CLI...
firebase --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Firebase CLI nao encontrado!
    echo Instale com: npm install -g firebase-tools
    pause
    exit /b 1
)

echo [OK] Firebase CLI instalado
echo.

echo [INFO] Fazendo login no Firebase...
firebase login
if errorlevel 1 (
    echo [ERRO] Falha no login!
    pause
    exit /b 1
)

echo [INFO] Iniciando deploy...
firebase deploy --only hosting
if errorlevel 1 (
    echo [ERRO] Falha no deploy!
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Deploy Firebase Concluido!
echo ========================================
echo.
echo Acesse: https://poup-beta.web.app
echo.
pause
exit /b 0

:: ========================================
:: GITHUB ONLY
:: ========================================
:github_only
echo.
echo ========================================
echo   Deploy GitHub
echo ========================================
echo.

echo [INFO] Verificando Git...
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Git nao encontrado!
    echo Instale: https://git-scm.com/downloads
    pause
    exit /b 1
)

echo [OK] Git instalado
echo.

:: Verificar se ja e um repositorio Git
if not exist ".git" (
    echo [INFO] Inicializando Git...
    git init
    echo [OK] Git inicializado
)

echo [INFO] Verificando status...
git status

echo.
set /p commit_msg="Digite a mensagem do commit: "
if "%commit_msg%"=="" set commit_msg="Update"

echo.
echo [INFO] Adicionando arquivos...
git add .

echo [INFO] Fazendo commit...
git commit -m "%commit_msg%"

echo [INFO] Enviando para GitHub...
git push
if errorlevel 1 (
    echo.
    echo [AVISO] Erro no push. Pode ser necessario configurar o remote.
    echo.
    set /p usuario="Digite seu usuario do GitHub: "
    set /p repo="Digite o nome do repositorio: "
    
    git remote add origin https://github.com/!usuario!/!repo!.git
    git branch -M main
    git push -u origin main
)

echo.
echo ========================================
echo   Deploy GitHub Concluido!
echo ========================================
echo.
pause
exit /b 0

:: ========================================
:: DEPLOY COMPLETO
:: ========================================
:deploy_completo
echo.
echo ========================================
echo   Deploy Completo (Firebase + GitHub)
echo ========================================
echo.

:: GitHub
call :github_only

echo.
echo [INFO] Aguarde 3 segundos...
timeout /t 3 /nobreak >nul

:: Firebase
call :firebase_only

echo.
echo ========================================
echo   Deploy Completo Finalizado!
echo ========================================
echo.
echo GitHub: https://github.com/seu-usuario/Poup
echo Firebase: https://poup-beta.web.app
echo.
pause
exit /b 0

:: ========================================
:: TESTE LOCAL
:: ========================================
:teste_local
echo.
echo ========================================
echo   Teste Local (Firebase Serve)
echo ========================================
echo.

echo [INFO] Iniciando servidor local...
echo [INFO] Acesse: http://localhost:5000
echo [INFO] Pressione Ctrl+C para parar
echo.
firebase serve
pause
exit /b 0

:: ========================================
:: GIT STATUS
:: ========================================
:git_status
echo.
echo ========================================
echo   Status do Git
echo ========================================
echo.
git status
echo.
git log --oneline -10
echo.
pause
exit /b 0

:: ========================================
:: CANCELAR
:: ========================================
:cancelar
echo.
echo [INFO] Operacao cancelada pelo usuario.
pause
exit /b 0
