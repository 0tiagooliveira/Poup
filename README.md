# 💚 Poup+ | Controle Financeiro Pessoal

<div align="center">
  
  ![Poup+ Logo](Icon/LogoPoup.svg)
  
  **Aplicativo web para controle financeiro pessoal com interface moderna e intuitiva**
  
  [![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
  [![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript)
  [![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/pt-BR/docs/Web/HTML)
  [![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/pt-BR/docs/Web/CSS)
  
</div>

---

## 📋 Sobre o Projeto

**Poup+** é um aplicativo web de controle financeiro pessoal desenvolvido para ajudar você a gerenciar suas finanças de forma simples e eficiente. Com interface moderna e intuitiva, você pode acompanhar receitas, despesas, contas bancárias e visualizar gráficos detalhados.

### ✨ Características Principais

- 💰 **Controle de Receitas e Despesas** - Registre e acompanhe suas transações
- 🏦 **Gestão de Contas** - Gerencie múltiplas contas bancárias e carteiras
- 📊 **Gráficos Interativos** - Visualize suas finanças com gráficos detalhados
- 📱 **Design Responsivo** - Funciona perfeitamente em mobile e desktop
- 🔐 **Autenticação Segura** - Login com Google via Firebase Auth
- ☁️ **Sincronização em Nuvem** - Dados salvos no Firebase Firestore
- 🎨 **Interface Moderna** - Design clean com Material Icons
- 🔔 **Notificações** - Sistema de notificações para lembretes
- 📤 **Exportação de Dados** - Exporte seus dados em JSON
- 👤 **Perfil Personalizável** - Avatar, nome e configurações personalizadas

---

## 🚀 Demo

**Acesse o aplicativo:** [https://poup-beta.web.app](https://poup-beta.web.app)

---

## 📸 Screenshots

### Home
![Home](docs/screenshots/home.png)

### Configurações
![Configurações](docs/screenshots/configuracoes.png)

### Gráficos
![Gráficos](docs/screenshots/graficos.png)

---

## 🛠️ Tecnologias Utilizadas

### Frontend
- **HTML5** - Estrutura semântica
- **CSS3** - Estilização com CSS Grid e Flexbox
- **JavaScript (ES6+)** - Lógica da aplicação
- **Material Icons** - Biblioteca de ícones

### Backend / Serviços
- **Firebase Auth** - Autenticação de usuários
- **Firebase Firestore** - Banco de dados NoSQL
- **Firebase Storage** - Armazenamento de imagens
- **Firebase Hosting** - Hospedagem web

### Bibliotecas
- **Chart.js** - Gráficos interativos
- **Firebase SDK v8** - Integração com Firebase

---

## 📁 Estrutura do Projeto

```
Poup-master/
│
├── index.html                 # Página de login
├── 404.html                   # Página de erro
├── firebase-config.js         # Configuração do Firebase
├── firebase.json              # Config do Firebase Hosting
├── firestore.indexes.json     # Índices do Firestore
├── firestore.rules            # Regras de segurança
│
├── Home/                      # Página inicial
│   ├── home.html
│   ├── script.js
│   └── styles.css
│
├── Configurações/             # Configurações do usuário
│   ├── Configuracoes.html
│   ├── script_novo.js
│   └── styles.css
│
├── Contas/                    # Gestão de contas
│   ├── Contas.html
│   ├── script.js
│   └── styles.css
│
├── Nova-Receita/              # Cadastro de receitas
│   ├── Nova-Receita.html
│   ├── script.js
│   └── styles.css
│
├── Nova-Despesa/              # Cadastro de despesas
│   ├── Nova-Despesa.html
│   ├── script.js
│   └── styles.css
│
├── Lista-de-receitas/         # Listagem de receitas
│   ├── Lista-de-receitas.html
│   ├── script.js
│   └── styles.css
│
├── Lista-de-despesas/         # Listagem de despesas
│   ├── Lista-de-despesas.html
│   ├── script.js
│   └── styles.css
│
├── Gráficos/                  # Dashboard de gráficos
│   ├── Gráficos.html
│   ├── script.js
│   └── styles.css
│
├── Transações/                # Histórico de transações
│   ├── Transações.html
│   ├── script.js
│   └── styles.css
│
├── Icon/                      # Ícones SVG
│   ├── LogoPoup.svg
│   ├── perfil.svg
│   └── ...
│
├── js/                        # Scripts utilitários
│   └── notificacoes-utils.js
│
└── docs/                      # Documentação
    ├── DEPLOY.md
    ├── FIREBASE_CONFIGURACOES.md
    ├── NOVA_UX_CAMPOS_EDITAVEIS.md
    └── SINCRONIZACAO_PERFIL.md
```

---

## 🔧 Instalação e Configuração

### Pré-requisitos

- Node.js (v14 ou superior)
- Firebase CLI
- Conta no Firebase

### Passo 1: Clone o repositório

```bash
git clone https://github.com/SEU_USUARIO/Poup.git
cd Poup
```

### Passo 2: Configure o Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
2. Ative os serviços:
   - Authentication (Google Sign-in)
   - Firestore Database
   - Storage
   - Hosting

3. Configure as credenciais no arquivo `firebase-config.js`:

```javascript
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJECT.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_PROJECT.appspot.com",
  messagingSenderId: "SEU_MESSAGING_ID",
  appId: "SEU_APP_ID",
  measurementId: "SEU_MEASUREMENT_ID"
};
```

### Passo 3: Configure as Regras de Segurança

#### Firestore Rules (`firestore.rules`):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /usuarios/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /contas/{contaId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    match /receitas/{receitaId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    match /despesas/{despesaId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

#### Storage Rules:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /avatars/{userId}/{fileName} {
      allow read: if true;
      allow write: if request.auth.uid == userId
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

### Passo 4: Deploy

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login no Firebase
firebase login

# Inicializar projeto
firebase init hosting

# Deploy
firebase deploy
```

### Passo 5: Desenvolvimento Local

```bash
# Servir localmente
firebase serve

# Ou usar Live Server no VS Code
# Abra index.html com Live Server
```

---

## 💡 Como Usar

### 1. **Fazer Login**
- Acesse a página inicial
- Clique em "Entrar com Google"
- Autorize o acesso

### 2. **Adicionar Contas**
- Vá em "Contas"
- Clique em "Nova Conta"
- Preencha os dados (nome, banco, saldo inicial)
- Salve

### 3. **Registrar Receitas**
- Clique no botão "+"
- Selecione "Receita"
- Preencha: descrição, valor, categoria, data, conta
- Salve

### 4. **Registrar Despesas**
- Clique no botão "+"
- Selecione "Despesa"
- Preencha: descrição, valor, categoria, data, conta
- Salve

### 5. **Visualizar Gráficos**
- Acesse a aba "Gráficos"
- Veja receitas e despesas por categoria
- Compare meses diferentes

### 6. **Configurar Perfil**
- Acesse "Configurações"
- Clique no lápis para editar nome/email
- Clique na câmera para alterar foto
- Configure notificações e preferências

---

## 🔒 Segurança

- ✅ Autenticação via Firebase Auth
- ✅ Regras de segurança do Firestore
- ✅ Dados isolados por usuário
- ✅ Validação no frontend e backend
- ✅ HTTPS obrigatório (Firebase Hosting)
- ✅ Tokens de autenticação seguros

---

## 📊 Estrutura de Dados

### Firestore Collections

#### `usuarios/{uid}`
```javascript
{
  nome: "João Silva",
  email: "joao@email.com",
  avatar: "https://...",
  dataCriacao: Timestamp,
  dataAtualizacao: Timestamp
}
```

#### `contas/{contaId}`
```javascript
{
  userId: "abc123",
  nome: "Nubank",
  tipo: "Conta Corrente",
  banco: "Nubank",
  saldoInicial: 1000.00,
  cor: "#820ad1",
  icone: "../Icon/Nubank.svg",
  ativa: true,
  incluirNaHome: true
}
```

#### `receitas/{receitaId}`
```javascript
{
  userId: "abc123",
  descricao: "Salário",
  valor: 5000.00,
  categoria: "Salário",
  data: "01/10/2025",
  carteira: "contaId",
  recebido: true,
  iconeCategoria: "paid"
}
```

#### `despesas/{despesaId}`
```javascript
{
  userId: "abc123",
  descricao: "Mercado",
  valor: 350.00,
  categoria: "Alimentação",
  data: "05/10/2025",
  carteira: "contaId",
  pago: true,
  iconeCategoria: "shopping_cart"
}
```

---

## 🎨 Paleta de Cores

```css
--cor-primaria: #22c55e        /* Verde principal */
--cor-primaria-escura: #16a34a /* Verde escuro */
--cor-secundaria: #3b82f6      /* Azul */
--cor-erro: #ef4444            /* Vermelho */
--cor-aviso: #f59e0b           /* Amarelo */
--cor-sucesso: #22c55e         /* Verde */
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Siga os passos:

1. Fork o projeto
2. Crie uma branch: `git checkout -b feature/nova-funcionalidade`
3. Commit suas mudanças: `git commit -m 'Adiciona nova funcionalidade'`
4. Push para a branch: `git push origin feature/nova-funcionalidade`
5. Abra um Pull Request

---

## 📝 Roadmap

- [ ] Modo escuro
- [ ] PWA (Progressive Web App)
- [ ] Relatórios em PDF
- [ ] Integração com Open Banking
- [ ] Cartões de crédito
- [ ] Metas de economia
- [ ] Planejamento financeiro
- [ ] Multi-idioma (i18n)
- [ ] Aplicativo mobile nativo

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Autor

**Seu Nome**
- GitHub: [@seu-usuario](https://github.com/seu-usuario)
- Email: seu@email.com

---

## 🙏 Agradecimentos

- Firebase pela infraestrutura
- Material Icons pela biblioteca de ícones
- Chart.js pelos gráficos
- Comunidade open source

---

## 📞 Suporte

Se tiver problemas ou sugestões:
- Abra uma [Issue](https://github.com/seu-usuario/Poup/issues)
- Envie um email: seu@email.com

---

<div align="center">
  
  **Feito com 💚 por [Seu Nome]**
  
  ⭐ Se este projeto te ajudou, considere dar uma estrela!
  
</div>
