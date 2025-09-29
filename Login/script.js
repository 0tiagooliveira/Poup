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
        // Configurar o provedor Google para solicitar informações específicas
        googleProvider.addScope('profile');
        googleProvider.addScope('email');
        googleProvider.setCustomParameters({
            'prompt': 'select_account'
        });
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
    
    console.log('Firebase Auth inicializado:', !!auth);
    console.log('Google Provider inicializado:', !!googleProvider);

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
            const nome = document.getElementById('nome-criar').value;
            const email = document.getElementById('email-criar').value;
            const senha = document.getElementById('senha-criar').value;

            auth.createUserWithEmailAndPassword(email, senha)
                .then(userCredential => {
                    // Salvar nome no Firestore
                    const user = userCredential.user;
                    if (typeof firebase !== "undefined" && firebase.firestore) {
                        firebase.firestore().collection('usuarios').doc(user.uid).set({
                            nome: nome,
                            email: email
                        });
                    }
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
    const btnGoogleButtons = document.querySelectorAll('.btn-social.google');
    console.log('Botões Google encontrados:', btnGoogleButtons.length);
    
    btnGoogleButtons.forEach((btnGoogle, index) => {
        console.log(`Adicionando listener ao botão Google ${index + 1}`);
        btnGoogle.addEventListener('click', function() {
            console.log('Botão Google clicado');
            
            if (!googleProvider) {
                alert('Google Provider não está configurado.');
                return;
            }
            
            auth.signInWithPopup(googleProvider)
                .then(result => {
                    console.log('Login Google bem-sucedido:', result);
                    const user = result.user;
                    
                    // Salvar dados do usuário no Firestore (se não existir)
                    if (typeof firebase !== "undefined" && firebase.firestore) {
                        const userRef = firebase.firestore().collection('usuarios').doc(user.uid);
                        userRef.get().then(doc => {
                            if (!doc.exists) {
                                // Usuário novo, salvar dados
                                userRef.set({
                                    nome: user.displayName || 'Usuário Google',
                                    email: user.email,
                                    fotoURL: user.photoURL || '',
                                    provedor: 'google'
                                });
                            }
                        });
                    }
                    
                    alert('Login com Google realizado com sucesso!');
                    window.location.href = '../Home/home.html';
                })
                .catch(error => {
                    console.error('Erro detalhado:', error);
                    let mensagemErro = 'Erro ao fazer login com Google: ';
                    
                    switch(error.code) {
                        case 'auth/popup-closed-by-user':
                            mensagemErro += 'Popup foi fechado antes de completar o login.';
                            break;
                        case 'auth/popup-blocked':
                            mensagemErro += 'Popup foi bloqueado pelo navegador. Permita popups para este site.';
                            break;
                        case 'auth/cancelled-popup-request':
                            mensagemErro += 'Solicitação de popup foi cancelada.';
                            break;
                        case 'auth/unauthorized-domain':
                            mensagemErro = 'CONFIGURAÇÃO NECESSÁRIA:\n\n';
                            mensagemErro += '1. Acesse o Firebase Console (console.firebase.google.com)\n';
                            mensagemErro += '2. Vá para Authentication > Sign-in method\n';
                            mensagemErro += '3. Clique em Google\n';
                            mensagemErro += '4. Em "Authorized domains", adicione:\n';
                            mensagemErro += '   - 127.0.0.1\n';
                            mensagemErro += '   - localhost\n';
                            mensagemErro += '5. Salve as alterações\n\n';
                            mensagemErro += 'Depois teste novamente o login com Google.';
                            break;
                        default:
                            // Verifica se é erro de domínio não autorizado pela mensagem
                            if (error.message && error.message.includes('not authorized to run this operation')) {
                                mensagemErro = 'CONFIGURAÇÃO NECESSÁRIA:\n\n';
                                mensagemErro += '1. Acesse o Firebase Console (console.firebase.google.com)\n';
                                mensagemErro += '2. Vá para Authentication > Sign-in method\n';
                                mensagemErro += '3. Clique em Google\n';
                                mensagemErro += '4. Em "Authorized domains", adicione:\n';
                                mensagemErro += '   - 127.0.0.1\n';
                                mensagemErro += '   - localhost\n';
                                mensagemErro += '5. Salve as alterações\n\n';
                                mensagemErro += 'Depois teste novamente o login com Google.';
                            } else {
                                mensagemErro += error.message || 'Erro desconhecido.';
                            }
                    }
                    
                    alert(mensagemErro);
                });
        });
    });

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