// Inicialização do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC7RB9fULmkp9xeJIjc0dL58atHJ8CM-Xc",
  authDomain: "poup-beta.firebaseapp.com",
  projectId: "poup-beta",
  storageBucket: "poup-beta.firebasestorage.app",
  messagingSenderId: "954695915981",
  appId: "1:954695915981:web:d31b216f79eac178094c84",
  measurementId: "G-LP9BDVD3KJ"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Página Home carregada. Verificando autenticação...');

    const auth = firebase.auth();
    const db = firebase.firestore();

    const loadingOverlay = document.getElementById('loading-overlay');
    const containerApp = document.querySelector('.container-app');

    // PONTO DE ENTRADA PRINCIPAL DA PÁGINA
    // Nada acontece antes que esta função dê uma resposta definitiva.
    auth.onAuthStateChanged(function(user) {
        console.log("Resultado do onAuthStateChanged:", user);
        if (user) {
            // RESPOSTA: Sim, o usuário está logado.
            console.log("Usuário autenticado:", user.uid);
            
            // Agora podemos mostrar o aplicativo e esconder o "Carregando..."
            if(loadingOverlay) loadingOverlay.style.display = 'none';
            if(containerApp) containerApp.style.display = 'block';
            
            // E então, inicializamos todos os componentes da página.
            inicializarComponentes(user);
        } else {
            // RESPOSTA: Não, o usuário não está logado.
            console.warn("Usuário não autenticado. Redirecionando para a página de login.");
            if(loadingOverlay) loadingOverlay.style.display = 'none';
            window.location.href = '../index.html';
        }
    });

    // Esta função só é chamada DEPOIS que o login é confirmado.
    function inicializarComponentes(user) {
        console.log('Inicializando componentes para o usuário:', user.uid);

        // Mapeamento dos elementos do DOM
        const elementos = {
            avatarUsuarioBtn: document.getElementById('avatar-usuario-btn'),
            menuUsuario: document.getElementById('menu-usuario'),
            sairBtn: document.getElementById('sair-btn'),
            nomeUsuario: document.querySelector('.nome-usuario'),
            // Adicione outros elementos da home aqui
        };

        // Atualiza o nome do usuário no cabeçalho
        if (elementos.nomeUsuario) {
            elementos.nomeUsuario.textContent = user.displayName || user.email;
        }

        // Configura todos os eventos de clique da página
        configurarEventos(elementos);

        // Carrega os dados do Firestore para este usuário
        carregarDadosDaHome(user.uid);
    }

    function configurarEventos(elementos) {
        console.log('Configurando eventos de clique...');

        // Eventos do Menu do Usuário
        if (elementos.avatarUsuarioBtn) {
            elementos.avatarUsuarioBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (elementos.menuUsuario) {
                    elementos.menuUsuario.classList.toggle('mostrar');
                }
            });
        }

        if (elementos.sairBtn) {
            elementos.sairBtn.addEventListener('click', function(e) {
                e.preventDefault();
                auth.signOut().then(() => {
                    console.log('Usuário deslogado com sucesso.');
                    window.location.href = '../index.html';
                });
            });
        }

        // Lógica para fechar o menu se clicar fora dele
        document.addEventListener('click', function(e) {
            if (elementos.menuUsuario && !elementos.menuUsuario.contains(e.target) && !elementos.avatarUsuarioBtn.contains(e.target)) {
                elementos.menuUsuario.classList.remove('mostrar');
            }
        });

        // Adicione aqui outros listeners, como os dos filtros dos gráficos
    }

    function carregarDadosDaHome(userId) {
        console.log(`Buscando dados da home para o usuário: ${userId}`);
        
        // Aqui você chamará as funções para carregar os dados do Firestore,
        // passando o userId para filtrar os resultados.
        // Exemplo:
        // carregarContas(userId);
        // carregarGraficoReceitas(userId);
        // carregarGraficoDespesas(userId);
        // atualizarSaldoTotal(userId);
    }
});