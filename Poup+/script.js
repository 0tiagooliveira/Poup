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
                    
                    // Usa o novo popup em vez do alert
                    mostrarPopup('Conta criada com sucesso! Agora faça o login para continuar.', () => {
                        // Preenche o e-mail no formulário de login
                        document.getElementById('email-login').value = email;

                        // Alterna para a aba de login
                        document.querySelector('.tab[data-tab="criar-conta"]').classList.remove('active');
                        document.querySelector('.tab[data-tab="login"]').classList.add('active');
                        document.getElementById('criar-conta').classList.remove('active');
                        document.getElementById('login').classList.add('active');

                        // Foca no campo de senha para facilitar
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
                    // Usa o popup para erros também
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
                    // Redireciona diretamente para a home, sem alertas.
                    window.location.href = './Home/home.html';
                })
                .catch((error) => {
                    console.error('Erro no login:', error.message);
                    // Usa o popup para erros de login
                    mostrarPopup('E-mail ou senha incorretos. Por favor, tente novamente.');
                });
        });
    }

    // Botão de esqueceu a senha
    const btnEsqueceuSenha = document.querySelector('.btn-link');
    if (btnEsqueceuSenha) {
        btnEsqueceuSenha.addEventListener('click', function() {
            const email = document.getElementById('email-login').value;
            if (!email) {
                alert('Por favor, digite seu e-mail no campo correspondente antes de pedir a redefinição de senha.');
                return;
            }

            auth.sendPasswordResetEmail(email)
                .then(() => {
                    mostrarPopup('E-mail de redefinição de senha enviado para ' + email);
                })
                .catch((error) => {
                    console.error('Erro ao enviar e-mail de redefinição:', error);
                    mostrarPopup('Não foi possível enviar o e-mail de redefinição. Verifique se o e-mail está correto.');
                });
        });
    }
});