#!/bin/bash

echo "🚀 Iniciando deploy do Poup+ para Firebase Hosting..."

# Verificar se Firebase CLI está instalado
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI não encontrado. Instalando..."
    npm install -g firebase-tools
fi

# Fazer login no Firebase (se necessário)
echo "🔐 Verificando autenticação..."
firebase login --reauth

# Verificar arquivos necessários
echo "📁 Verificando estrutura de arquivos..."
if [ ! -f "index.html" ]; then
    echo "❌ index.html não encontrado!"
    exit 1
fi

if [ ! -f "styles.css" ]; then
    echo "❌ styles.css não encontrado!"
    exit 1
fi

if [ ! -f "script.js" ]; then
    echo "❌ script.js não encontrado!"
    exit 1
fi

# Limpar cache do Firebase
echo "🧹 Limpando cache..."
firebase hosting:channel:delete preview --force 2>/dev/null || true

# Deploy para Firebase Hosting
echo "📤 Fazendo deploy..."
firebase deploy --only hosting

if [ $? -eq 0 ]; then
    echo "✅ Deploy concluído com sucesso!"
    echo "🌐 Sua aplicação está disponível em: https://poup-beta.web.app"
    
    # Abrir no navegador (opcional)
    read -p "Deseja abrir no navegador? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        firebase hosting:channel:open live
    fi
else
    echo "❌ Erro durante o deploy!"
    exit 1
fi
