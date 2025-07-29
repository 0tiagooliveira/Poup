# 1. Verificar se está na pasta correta
cd "c:\Users\olive\Downloads\Versão 1.9\Poup+"

# 2. Verificar estrutura de arquivos
dir

# 3. Instalar Firebase CLI (se não tiver)
npm install -g firebase-tools

# 4. Fazer login no Firebase
firebase login

# 5. Verificar configuração
firebase projects:list

# 6. Definir projeto (substitua pelo seu project ID)
firebase use poup-beta

# 7. Fazer deploy
firebase deploy --only hosting

# 8. Verificar se funcionou
firebase hosting:channel:open live
