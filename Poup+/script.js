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
                    alert('Conta criada com sucesso! Redirecionando...');
                    window.location.href = './Home/home.html';
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
                    alert(mensagemErro);
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
                    window.location.href = './Home/home.html';
                })
                .catch((error) => {
                    console.error('Erro no login:', error.message);
                    alert('E-mail ou senha incorretos. Por favor, tente novamente.');
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
                    alert('E-mail de redefinição de senha enviado para ' + email);
                })
                .catch((error) => {
                    console.error('Erro ao enviar e-mail de redefinição:', error);
                    alert('Não foi possível enviar o e-mail de redefinição. Verifique se o e-mail está correto.');
                });
        });
    }
});