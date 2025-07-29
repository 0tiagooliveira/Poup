// INÍCIO: Firebase Auth
// Adicione isso ANTES do DOMContentLoaded
let firebaseApp, auth, googleProvider;
(function initFirebase() {
    if (typeof firebase !== "undefined") {
        if (!firebase.apps.length) {
            firebaseApp = firebase.initializeApp({
                apiKey: "AIzaSyC7RB9fULmkp9xeJIjc0dL58atHJ8CM-Xc",
                authDomain: "poup-beta.firebaseapp.com",
                projectId: "poup-beta",
                storageBucket: "poup-beta.appspot.com",
                messagingSenderId: "954695915981",
                appId: "1:954695915981:web:d31b216f79eac178094c84",
                measurementId: "G-LP9BDVD3KJ"
            });
        } else {
            firebaseApp = firebase.app();
        }
        auth = firebase.auth();
        googleProvider = new firebase.auth.GoogleAuthProvider();
    } else {
        console.error("Firebase não carregado. Certifique-se de que os scripts do Firebase estão incluídos no HTML.");
    }
})();
// FIM: Firebase Auth

document.addEventListener('DOMContentLoaded', function() {
    // Verifica se Firebase está carregado
    if (!auth) {
        alert("Firebase não carregado. Certifique-se de que os scripts do Firebase estão incluídos no HTML e que o Live Server está configurado corretamente.");
        return;
    }

    // Alternar entre abas
    const tabs = document.querySelectorAll('.tab');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remover classe active de todas as abas
            tabs.forEach(t => t.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Adicionar classe active à aba clicada
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Alternar visibilidade da senha
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            
            // Alternar ícone
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    });

    // Verificar se é Android para esconder botão Apple
    const isAndroid = /Android/i.test(navigator.userAgent);
    if (isAndroid) {
        document.body.classList.add('android');
    }

    // Formulário de Criar Conta
    const formCriarConta = document.getElementById('form-criar-conta');
    if (formCriarConta) {
        formCriarConta.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email-criar').value;
            const senha = document.getElementById('senha-criar').value;

            auth.createUserWithEmailAndPassword(email, senha)
                .then(userCredential => {
                    alert('Conta criada com sucesso!');
                    window.location.href = '../Home/home.html';
                })
                .catch(error => {
                    alert('Erro ao criar conta: ' + (error.message || error));
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
                .then(userCredential => {
                    window.location.href = '../Home/home.html';
                })
                .catch(error => {
                    alert('Erro ao fazer login: ' + (error.message || error));
                });
        });
    }

    // Botões de login social
    const btnGoogle = document.querySelector('.btn-social.google');
    if (btnGoogle) {
        btnGoogle.addEventListener('click', function() {
            auth.signInWithPopup(googleProvider)
                .then(result => {
                    alert('Login com Google realizado!');
                    window.location.href = '../Home/home.html';
                })
                .catch(error => {
                    alert('Erro ao fazer login com Google: ' + (error.message || error));
                });
        });
    }

    const btnApple = document.getElementById('btn-apple');
    if (btnApple) {
        btnApple.addEventListener('click', function() {
            // Lógica para login com Apple
            console.log('Login com Apple');
            alert('Redirecionando para login com Apple');
        });
    }

    const btnAppleLogin = document.getElementById('btn-apple-login');
    if (btnAppleLogin) {
        btnAppleLogin.addEventListener('click', function() {
            // Lógica para login com Apple
            console.log('Login com Apple');
            alert('Redirecionando para login com Apple');
        });
    }

    // Botão de esqueceu a senha
    const btnEsqueceuSenha = document.querySelector('.btn-link');
    if (btnEsqueceuSenha) {
        btnEsqueceuSenha.addEventListener('click', function() {
            // Lógica para recuperar senha
            console.log('Esqueceu a senha');
            alert('Redirecionando para recuperação de senha');
        });
    }
});