💚 Poup+ | Controle Financeiro Pessoal
<div align="center">
<img src="Icon/LogoPoup.svg" alt="Poup+ Logo" width="150"/>

Aplicativo web para controle financeiro pessoal com interface moderna e intuitiva.

</div>

📋 Sobre o Projeto
Poup+ é um aplicativo web de código aberto para controle financeiro pessoal, projetado para ajudar usuários a gerenciar suas finanças de forma simples e eficiente. Com uma interface moderna, é possível acompanhar receitas, despesas e contas bancárias, além de visualizar o progresso através de gráficos interativos.

✨ Funcionalidades
💰 Controle de Receitas e Despesas: Registre e categorize suas transações.

🏦 Gestão de Contas: Gerencie múltiplas contas e carteiras.

📊 Gráficos Interativos: Visualize suas finanças com gráficos detalhados (via Chart.js).

📱 Design Responsivo: Acesse de qualquer dispositivo, seja desktop ou mobile.

🔐 Autenticação Segura: Login com Google fornecido pelo Firebase Auth.

☁️ Sincronização em Nuvem: Seus dados são salvos com segurança no Firebase Firestore.

👤 Perfil Personalizável: Altere seu nome e avatar.

🚀 Demo
Acesse o aplicativo em produção: https://poup-beta.web.app

📸 Screenshots
Home	Configurações	Gráficos

Exportar para as Planilhas
🛠️ Tecnologias Utilizadas
Frontend: HTML5, CSS3 (Flexbox & Grid), JavaScript (ES6+).

Backend & Serviços: Firebase (Auth, Firestore, Storage, Hosting).

Bibliotecas: Chart.js, Material Icons.

🔧 Começando
Siga os passos abaixo para configurar e rodar o projeto localmente.

Pré-requisitos
Node.js (v14 ou superior)

Firebase CLI (npm install -g firebase-tools)

Uma conta no Firebase

Instalação
Clone o repositório:

Bash

git clone https://github.com/0tiagooliveira/Poup.git
cd Poup
Configure o Firebase:
a. Crie um projeto no Firebase Console.
b. Ative os serviços: Authentication (com provedor Google), Firestore, Storage e Hosting.
c. Na raiz do projeto, renomeie o arquivo firebase-config.example.js para firebase-config.js.
d. Preencha o arquivo firebase-config.js com as credenciais do seu projeto Firebase.

JavaScript

// firebase-config.js
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJECT.firebaseapp.com",
  projectId: "SEU_PROJECT_ID",
  storageBucket: "SEU_PROJECT.appspot.com",
  messagingSenderId: "SEU_MESSAGING_ID",
  appId: "SEU_APP_ID"
};
Importante: O arquivo firebase-config.js já está listado no .gitignore para evitar que suas chaves secretas sejam enviadas para o repositório.

Faça o deploy das regras de segurança:

As regras de segurança para o Firestore e Storage já estão nos arquivos (firestore.rules e storage.rules). Faça o deploy delas através do console do Firebase ou via CLI.

Rode o projeto localmente:

Bash

firebase serve
Ou utilize a extensão Live Server no VS Code.

📝 Roadmap
[ ] Modo escuro

[ ] Transformar em PWA (Progressive Web App)

[ ] Gestão de cartões de crédito

[ ] Metas de economia e planejamento financeiro

[ ] Relatórios em PDF

🤝 Contribuindo
Contribuições são muito bem-vindas! Se você tem alguma ideia para melhorar o projeto, sinta-se à vontade para criar um fork e abrir um Pull Request.

Faça um Fork do projeto.

Crie uma nova Branch (git checkout -b feature/sua-feature).

Faça o Commit das suas alterações (git commit -m 'Adiciona sua-feature').

Faça o Push para a Branch (git push origin feature/sua-feature).

Abra um Pull Request.

📄 Licença
Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.

<div align="center">
Feito com 💚 por <a href="https://github.com/0tiagooliveira">Tiago de Oliveira Coiado</a>



⭐ Se este projeto te ajudou, considere dar uma estrela! ⭐
</div>
