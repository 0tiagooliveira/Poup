# 🚀 Deploy - Poup+ (GitHub + Firebase)

## 📋 Pré-requisitos

### 1. **Git**
- Instalar Git: https://git-scm.com/downloads
- Verificar instalação:
  ```bash
  git --version
  ```

### 2. **Conta GitHub**
- Criar conta: https://github.com/join
- Gerar token de acesso (se necessário)

### 3. **Firebase CLI**
- Instalar Node.js: https://nodejs.org/
- Instalar Firebase CLI:
  ```bash
  npm install -g firebase-tools
  ```
- Verificar instalação:
  ```bash
  firebase --version
  ```

---

## 🔥 Parte 1: Deploy para Firebase Hosting

### Passo 1: Login no Firebase
```bash
firebase login
```
- Abre o navegador para autenticação
- Faça login com sua conta Google

### Passo 2: Inicializar Firebase (se ainda não foi feito)
```bash
cd "d:\Downloads\Poup-master (1)\Poup-master"
firebase init hosting
```

**Configurações recomendadas:**
- ✅ Use an existing project: `poup-beta` (ou seu projeto)
- ✅ Public directory: `.` (raiz do projeto)
- ❌ Configure as a single-page app: `No`
- ❌ Set up automatic builds: `No`
- ❌ Overwrite index.html: `No`

### Passo 3: Deploy para Firebase
```bash
firebase deploy
```

**Resultado esperado:**
```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/poup-beta/overview
Hosting URL: https://poup-beta.web.app
```

### Passo 4: Acessar o site
Abra o navegador e acesse: **https://poup-beta.web.app**

---

## 📦 Parte 2: Subir para GitHub

### Passo 1: Criar repositório no GitHub
1. Acesse: https://github.com/new
2. Preencha:
   - **Repository name:** `Poup`
   - **Description:** `Aplicativo de controle financeiro pessoal`
   - **Visibility:** `Public` ou `Private`
3. ❌ **NÃO** marque "Initialize with README"
4. Clique em **Create repository**

### Passo 2: Inicializar Git no projeto
```bash
cd "d:\Downloads\Poup-master (1)\Poup-master"
git init
```

### Passo 3: Adicionar arquivos
```bash
git add .
```

### Passo 4: Fazer primeiro commit
```bash
git commit -m "🎉 Initial commit - Poup+ v1.0"
```

### Passo 5: Conectar ao repositório GitHub
**Substitua `SEU_USUARIO` pelo seu nome de usuário do GitHub:**
```bash
git remote add origin https://github.com/SEU_USUARIO/Poup.git
```

### Passo 6: Enviar para GitHub
```bash
git branch -M main
git push -u origin main
```

**Se pedir autenticação:**
- Username: `seu_usuario_github`
- Password: `seu_token_de_acesso` (não a senha!)

**Como gerar token:**
1. GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Selecione `repo`
4. Copie o token e use como senha

---

## 🔄 Atualizações Futuras

### Fazer deploy de alterações:

```bash
# 1. Adicionar arquivos modificados
git add .

# 2. Fazer commit com mensagem descritiva
git commit -m "✨ Adiciona integração Firebase nas configurações"

# 3. Enviar para GitHub
git push

# 4. Deploy no Firebase
firebase deploy
```

---

## 📝 Comandos Úteis

### Git
```bash
# Ver status dos arquivos
git status

# Ver histórico de commits
git log --oneline

# Desfazer último commit (mantém alterações)
git reset --soft HEAD~1

# Criar nova branch
git checkout -b feature/nova-funcionalidade

# Mudar de branch
git checkout main

# Ver branches
git branch -a
```

### Firebase
```bash
# Ver projetos
firebase projects:list

# Selecionar projeto
firebase use poup-beta

# Ver hosting sites
firebase hosting:sites:list

# Deploy apenas hosting
firebase deploy --only hosting

# Ver logs
firebase functions:log
```

---

## 🌐 URLs do Projeto

Após o deploy, seu projeto estará disponível em:

### Firebase Hosting
```
https://poup-beta.web.app
https://poup-beta.firebaseapp.com
```

### GitHub Repository
```
https://github.com/SEU_USUARIO/Poup
```

### Firebase Console
```
https://console.firebase.google.com/project/poup-beta
```

---

## 🔒 Segurança

### ⚠️ IMPORTANTE: Nunca committar credenciais!

O arquivo `.gitignore` já está configurado para ignorar:
- ✅ `.firebase/` (cache do Firebase)
- ✅ `.firebaserc` (configuração local)
- ✅ `node_modules/` (dependências)
- ✅ `*.log` (arquivos de log)
- ✅ Arquivos temporários

### Verificar antes de commitar:
```bash
git status
```

Se aparecer algum arquivo sensível, adicione ao `.gitignore`:
```bash
echo "arquivo-secreto.js" >> .gitignore
git add .gitignore
git commit -m "🔒 Adiciona arquivo ao gitignore"
```

---

## 🎯 Checklist de Deploy

### GitHub
- [ ] Repositório criado
- [ ] Git inicializado
- [ ] Primeiro commit feito
- [ ] Remote configurado
- [ ] Push para main branch
- [ ] README.md atualizado
- [ ] .gitignore configurado

### Firebase
- [ ] Firebase CLI instalado
- [ ] Login no Firebase feito
- [ ] Projeto inicializado
- [ ] Deploy realizado
- [ ] Site acessível
- [ ] Regras de segurança configuradas
- [ ] Domínio personalizado (opcional)

---

## 🆘 Problemas Comuns

### Erro: "fatal: not a git repository"
**Solução:**
```bash
git init
```

### Erro: "Permission denied"
**Solução:**
```bash
git config --global credential.helper store
git push
# Insira suas credenciais
```

### Erro: "Firebase project not found"
**Solução:**
```bash
firebase use --add
# Selecione o projeto poup-beta
```

### Erro: "Port 5000 already in use"
**Solução:**
```bash
firebase serve --port 5001
```

### Erro: "Authentication failed"
**Solução:**
```bash
firebase login --reauth
```

---

## 📚 Recursos Adicionais

### Documentação
- Git: https://git-scm.com/doc
- GitHub: https://docs.github.com
- Firebase: https://firebase.google.com/docs
- Firebase Hosting: https://firebase.google.com/docs/hosting

### Tutoriais
- Git Tutorial: https://www.atlassian.com/git/tutorials
- Firebase Tutorial: https://firebase.google.com/docs/hosting/quickstart

---

## 🎉 Pronto!

Seu projeto Poup+ está agora:
- ✅ Versionado no GitHub
- ✅ Hospedado no Firebase
- ✅ Acessível publicamente
- ✅ Pronto para receber atualizações

**Parabéns! 🎊**

---

## 📞 Suporte

Se tiver problemas:
1. Verifique o console do Firebase
2. Verifique os logs: `firebase functions:log`
3. Teste localmente: `firebase serve`
4. Consulte a documentação oficial

---

**Última atualização:** 10 de outubro de 2025
