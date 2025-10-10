// INÍCIO: Firebase Auth
let firebaseApp, auth;
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
    } else {
        console.error("Firebase não carregado. Certifique-se de que os scripts do Firebase estão incluídos no HTML.");
    }
})();
// FIM: Firebase Auth

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado - Página de Recuperação de Senha');
    console.log('Firebase disponível:', typeof firebase !== "undefined");
    console.log('Auth disponível:', !!auth);
    
    // Verifica se Firebase está carregado
    if (!auth) {
        console.error("Firebase Auth não está disponível");
        alert("Erro de configuração. Tente novamente mais tarde.");
        return;
    }

    console.log('Firebase inicializado com sucesso');

    // Elementos da página
    const formRecuperarSenha = document.getElementById('form-recuperar-senha');
    const emailInput = document.getElementById('email-recuperar');
    const btnEnviar = document.getElementById('btn-enviar');
    const btnText = document.querySelector('.btn-text');
    const btnLoading = document.querySelector('.btn-loading');
    const successMessage = document.getElementById('success-message');
    const reenviarBtn = document.getElementById('reenviar-email');
    
    let emailEnviado = '';

    // Formulário de Recuperação de Senha
    if (formRecuperarSenha) {
        formRecuperarSenha.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Formulário de recuperação submetido');
            
            const email = emailInput.value.trim();
            
            console.log('Email para recuperação:', email);

            // Validação do email
            if (!email) {
                alert('Por favor, digite seu email.');
                return;
            }

            if (!isValidEmail(email)) {
                alert('Por favor, digite um email válido.');
                return;
            }

            // Mostrar loading
            showLoading(true);
            
            // Enviar email de recuperação
            auth.sendPasswordResetEmail(email)
                .then(() => {
                    console.log('Email de recuperação enviado com sucesso');
                    emailEnviado = email;
                    showSuccess();
                })
                .catch(error => {
                    console.error('Erro ao enviar email de recuperação:', error);
                    console.error('Código do erro:', error.code);
                    console.error('Mensagem do erro:', error.message);
                    
                    showLoading(false);
                    
                    let errorMessage = 'Erro ao enviar email de recuperação: ';
                    
                    switch(error.code) {
                        case 'auth/user-not-found':
                            errorMessage = 'Não encontramos uma conta com esse email. Verifique se digitou corretamente ou crie uma nova conta.';
                            break;
                        case 'auth/invalid-email':
                            errorMessage = 'Email inválido. Verifique o formato do email.';
                            break;
                        case 'auth/too-many-requests':
                            errorMessage = 'Muitas tentativas de recuperação. Aguarde alguns minutos antes de tentar novamente.';
                            break;
                        case 'auth/network-request-failed':
                            errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
                            break;
                        default:
                            errorMessage = 'Erro inesperado: ' + (error.message || 'Tente novamente mais tarde.');
                    }
                    
                    alert(errorMessage);
                });
        });
    }

    // Botão de reenviar email
    if (reenviarBtn) {
        reenviarBtn.addEventListener('click', function() {
            console.log('Reenviando email para:', emailEnviado);
            
            if (!emailEnviado) {
                alert('Erro: email não encontrado.');
                return;
            }

            // Mostrar loading no botão de reenviar
            reenviarBtn.disabled = true;
            reenviarBtn.textContent = 'Reenviando...';
            
            auth.sendPasswordResetEmail(emailEnviado)
                .then(() => {
                    console.log('Email reenviado com sucesso');
                    alert('Email reenviado com sucesso! Verifique sua caixa de entrada.');
                    
                    reenviarBtn.disabled = false;
                    reenviarBtn.textContent = 'Reenviar email';
                })
                .catch(error => {
                    console.error('Erro ao reenviar email:', error);
                    
                    reenviarBtn.disabled = false;
                    reenviarBtn.textContent = 'Reenviar email';
                    
                    let errorMessage = 'Erro ao reenviar email: ';
                    
                    switch(error.code) {
                        case 'auth/too-many-requests':
                            errorMessage = 'Muitas tentativas de envio. Aguarde alguns minutos.';
                            break;
                        default:
                            errorMessage = error.message || 'Tente novamente mais tarde.';
                    }
                    
                    alert(errorMessage);
                });
        });
    }

    // Funções auxiliares
    function showLoading(show) {
        btnEnviar.disabled = show;
        
        if (show) {
            btnText.style.display = 'none';
            btnLoading.style.display = 'flex';
        } else {
            btnText.style.display = 'block';
            btnLoading.style.display = 'none';
        }
    }

    function showSuccess() {
        // Ocultar formulário
        formRecuperarSenha.style.display = 'none';
        
        // Mostrar mensagem de sucesso
        successMessage.style.display = 'block';
        successMessage.classList.add('fade-in');
        
        // Mostrar botão de reenviar após 30 segundos
        setTimeout(() => {
            if (reenviarBtn) {
                reenviarBtn.style.display = 'inline-block';
            }
        }, 30000);
    }

    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Pré-preencher email se vier de parâmetro da URL
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    if (emailParam && emailInput) {
        emailInput.value = emailParam;
        console.log('Email pré-preenchido:', emailParam);
    }

    console.log('Script de recuperação de senha carregado com sucesso');
});