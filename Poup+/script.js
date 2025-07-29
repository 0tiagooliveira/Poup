// NÃO inicialize o Firebase aqui! Ele já está inicializado no index.html.

document.addEventListener('DOMContentLoaded', function() {
    // --- Lógica para alternar abas ---
    const tabs = document.querySelectorAll('.tab');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // --- Lógica para mostrar/esconder senha ---
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    });

    // --- Função para mostrar o popup customizado ---
    function mostrarPopup(mensagem, callback) {
        const popup = document.getElementById('popup-mensagem');
        const popupTexto = document.getElementById('popup-texto');
        const popupBotao = document.getElementById('popup-botao');

        if (!popup || !popupTexto || !popupBotao) return;

        popupTexto.textContent = mensagem;
        popup.style.display = 'flex';

        popupBotao.onclick = function() {
            popup.style.display = 'none';
            if (callback) callback();
        };
    }

    // --- Conexão com Firebase Authentication ---
    const auth = firebase.auth();

    // Formulário de Criar Conta
    const formCriarConta = document.getElementById('form-criar-conta');
    if (formCriarConta) {
        formCriarConta.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email-criar').value;
            const senha = document.getElementById('senha-criar').value;
            
            auth.createUserWithEmailAndPassword(email, senha)
                .then((userCredential) => {
                    console.log('Conta criada com sucesso:', userCredential.user);
                    mostrarPopup('Conta criada com sucesso! Agora faça o login para continuar.', () => {
                        document.getElementById('email-login').value = email;
                        document.querySelector('.tab[data-tab="criar-conta"]').classList.remove('active');
                        document.querySelector('.tab[data-tab="login"]').classList.add('active');
                        document.getElementById('criar-conta').classList.remove('active');
                        document.getElementById('login').classList.add('active');
                        document.getElementById('senha-login').focus();
                    });
                })
                .catch((error) => {
                    console.error('Erro ao criar conta:', error.message);
                    let mensagemErro = 'Ocorreu um erro. Tente novamente.';
                    if (error.code === 'auth/email-already-in-use') {
                        mensagemErro = 'Este e-mail já está em uso.';
                    } else if (error.code === 'auth/weak-password') {
                        mensagemErro = 'A senha é muito fraca. Use pelo menos 6 caracteres.';
                    } else if (error.code === 'auth/invalid-email') {
                        mensagemErro = 'O formato do e-mail é inválido.';
                    }
                    mostrarPopup(mensagemErro);
                });
        });
    }

    // Formulário de Login
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email-login').value;
            const senha = document.getElementById('senha-login').value;
            
            auth.signInWithEmailAndPassword(email, senha)
                .then((userCredential) => {
                    console.log('Login realizado com sucesso:', userCredential.user);
                    // Aguarde o onAuthStateChanged antes de redirecionar
                    auth.onAuthStateChanged(function(user) {
                        if (user) {
                            window.location.href = './Home/home.html';
                        } else {
                            mostrarPopup('Erro ao autenticar. Tente novamente.');
                            console.log('Falha ao autenticar após login.');
                        }
                    });
                })
                .catch((error) => {
                    console.error('Erro no login:', error.message);
                    mostrarPopup('E-mail ou senha incorretos. Por favor, tente novamente.');
                });
        });
    }
});