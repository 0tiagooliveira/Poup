# 🚀 Guia Rápido - Deploy Poup+

## ⚡ Comandos Essenciais

### 🔥 Firebase

```bash
# Login
firebase login

# Deploy completo
firebase deploy

# Deploy apenas hosting
firebase deploy --only hosting

# Teste local
firebase serve

# Ver projetos
firebase projects:list

# Usar projeto específico
firebase use poup-beta
```

### 📦 GitHub

```bash
# Inicializar Git
git init

# Adicionar todos os arquivos
git add .

# Fazer commit
git commit -m "Sua mensagem"

# Adicionar repositório remoto
git remote add origin https://github.com/usuario/repo.git

# Enviar para GitHub
git push -u origin main

# Ver status
git status

# Ver histórico
git log --oneline
```

---

## 🎯 Deploy Rápido (3 comandos)

### Primeira vez:

```bash
# 1. Git
git init
git add .
git commit -m "🎉 Initial commit"
git remote add origin https://github.com/SEU_USUARIO/Poup.git
git push -u origin main

# 2. Firebase
firebase login
firebase init hosting
firebase deploy
```

### Atualizações:

```bash
# 1 comando
git add . && git commit -m "Atualização" && git push && firebase deploy
```

---

## 🖱️ Script Automatizado (Windows)

### Duplo clique em `deploy.bat`

Ou execute no PowerShell:
```bash
.\deploy.bat
```

**Menu:**
1. Deploy Firebase
2. Deploy GitHub  
3. Deploy completo (ambos)
4. Teste local
5. Ver status Git

---

## 🌐 URLs Importantes

### Seu Projeto
- **Firebase:** https://poup-beta.web.app
- **GitHub:** https://github.com/SEU_USUARIO/Poup

### Consoles
- **Firebase Console:** https://console.firebase.google.com/project/poup-beta
- **GitHub Repository:** https://github.com/SEU_USUARIO/Poup
- **Firebase Hosting:** https://console.firebase.google.com/project/poup-beta/hosting

---

## ✅ Checklist Pre-Deploy

- [ ] Código testado localmente
- [ ] Credenciais do Firebase atualizadas
- [ ] .gitignore configurado
- [ ] README.md atualizado
- [ ] Regras de segurança do Firestore
- [ ] Regras de segurança do Storage
- [ ] Commit com mensagem descritiva

---

## 🔧 Configuração Inicial (Fazer 1 vez)

### 1. Instalar ferramentas:
```bash
# Node.js (https://nodejs.org)
node --version

# Firebase CLI
npm install -g firebase-tools

# Git (https://git-scm.com)
git --version
```

### 2. Configurar Git:
```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"
```

### 3. Gerar Token GitHub:
1. GitHub → Settings → Developer settings
2. Personal access tokens → Generate new token
3. Selecionar: `repo`
4. Copiar token

---

## 📝 Mensagens de Commit (Boas Práticas)

```bash
# Novo recurso
git commit -m "✨ Adiciona integração Firebase"

# Correção de bug
git commit -m "🐛 Corrige erro no login"

# Atualização de documentação
git commit -m "📝 Atualiza README"

# Melhoria de performance
git commit -m "⚡ Otimiza carregamento"

# Refatoração
git commit -m "♻️ Refatora código de autenticação"

# Estilo/formatação
git commit -m "💄 Melhora UI das configurações"
```

### Emojis úteis:
- ✨ `:sparkles:` - Novo recurso
- 🐛 `:bug:` - Correção de bug
- 📝 `:memo:` - Documentação
- ⚡ `:zap:` - Performance
- 🎨 `:art:` - Estilo/UI
- 🔒 `:lock:` - Segurança
- 🚀 `:rocket:` - Deploy
- ♻️ `:recycle:` - Refatoração

---

## 🆘 Problemas Comuns

### "Permission denied"
```bash
# Configurar credenciais
git config --global credential.helper store
git push
# Digite usuario e TOKEN (não senha!)
```

### "Not a git repository"
```bash
git init
```

### "Firebase project not found"
```bash
firebase use --add
# Selecione poup-beta
```

### "Port already in use"
```bash
firebase serve --port 5001
```

---

## 🎯 Workflow Recomendado

### Desenvolvimento:
```bash
# 1. Criar branch para nova feature
git checkout -b feature/nova-funcionalidade

# 2. Fazer alterações e commits
git add .
git commit -m "✨ Implementa nova funcionalidade"

# 3. Testar localmente
firebase serve

# 4. Merge na main
git checkout main
git merge feature/nova-funcionalidade

# 5. Deploy
git push
firebase deploy
```

---

## 💡 Dicas

1. **Sempre teste localmente antes de deploy:**
   ```bash
   firebase serve
   ```

2. **Faça commits pequenos e frequentes:**
   ```bash
   git commit -m "Mensagem clara"
   ```

3. **Use branches para features:**
   ```bash
   git checkout -b feature/nome
   ```

4. **Verifique status antes de commitar:**
   ```bash
   git status
   ```

5. **Veja o histórico:**
   ```bash
   git log --oneline --graph
   ```

---

## 📞 Suporte

- **Documentação Firebase:** https://firebase.google.com/docs
- **Documentação Git:** https://git-scm.com/doc
- **GitHub Docs:** https://docs.github.com

---

**Última atualização:** 10/10/2025
