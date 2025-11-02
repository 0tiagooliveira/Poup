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

// Funções globais para popups
function abrirPopup(id) {
    console.log(`Tentando abrir popup: ${id}`);
    
    const popup = document.getElementById(id);
    if (popup) {
        console.log(`Popup encontrado: ${id}`);
        
        // Remove a classe primeiro se já existir
        popup.classList.remove('show');
        
        // Força os estilos inline para garantir que apareça centrado
        popup.style.display = 'flex';
        popup.style.position = 'fixed';
        popup.style.top = '0';
        popup.style.left = '0';
        popup.style.width = '100%';
        popup.style.height = '100%';
        popup.style.zIndex = '9999';
        popup.style.justifyContent = 'center';
        popup.style.alignItems = 'center';
        popup.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        
        // Adiciona a classe show para animação
        setTimeout(() => {
            popup.classList.add('show');
        }, 10);
        
        console.log(`Popup ${id} aberto com sucesso`);
        console.log('Estilos aplicados:', popup.style.cssText);
    } else {
        console.error(`Popup não encontrado: ${id}`);
        console.log('Elementos disponíveis com ID:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
    }
}

function fecharPopup(popupId) {
    const popup = document.getElementById(popupId);
    if (popup) {
        popup.classList.remove('show');
        setTimeout(() => popup.style.display = 'none', 200);
    }
}

function mostrarLoadingPopup(show) {
    const btnText = document.querySelector('#btn-popup-enviar .btn-text');
    const btnLoading = document.querySelector('#btn-popup-enviar .popup-loading');
    const btnEnviar = document.getElementById('btn-popup-enviar');
    
    if (btnEnviar) {
        btnEnviar.disabled = show;
    }
    
    if (btnText && btnLoading) {
        if (show) {
            btnText.style.display = 'none';
            btnLoading.style.display = 'flex';
        } else {
            btnText.style.display = 'block';
            btnLoading.style.display = 'none';
        }
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Funções para mostrar notificações
function mostrarNotificacao(tipo, titulo, mensagem, callback = null) {
    console.log('mostrarNotificacao chamado:', tipo, titulo, mensagem, !!callback);
    
    const popup = document.getElementById('popup-notificacao');
    const icone = document.getElementById('popup-notificacao-icon');
    const tituloEl = document.getElementById('popup-notificacao-titulo');
    const textoEl = document.getElementById('popup-notificacao-texto');
    
    console.log('Elementos encontrados:', !!popup, !!icone, !!tituloEl, !!textoEl);
    
    if (!popup || !icone || !tituloEl || !textoEl) {
        console.error('Alguns elementos do popup não foram encontrados!');
        console.error('popup:', popup);
        console.error('icone:', icone);
        console.error('tituloEl:', tituloEl);
        console.error('textoEl:', textoEl);
        
        // Fallback: usar alert se popup não existir
        alert(titulo + '\n\n' + mensagem);
        if (callback) callback();
        return;
    }
    
    // Remover classes anteriores
    icone.className = 'popup-icon';
    
    // Configurar ícone e cor baseado no tipo
    switch(tipo) {
        case 'sucesso':
            icone.classList.add('success');
            icone.innerHTML = '<i class="fas fa-check-circle"></i>';
            break;
        case 'erro':
            icone.classList.add('error');
            icone.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
            break;
        case 'warning':
            icone.classList.add('warning');
            icone.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        case 'info':
        default:
            icone.classList.add('info');
            icone.innerHTML = '<i class="fas fa-info-circle"></i>';
            break;
    }
    
    tituloEl.textContent = titulo;
    textoEl.textContent = mensagem;
    
    // Configurar callback se fornecido
    if (callback) {
        console.log('Configurando callback...');
        const btnOk = popup.querySelector('.botao-popup.primario');
        console.log('Botão OK encontrado:', !!btnOk);
        if (btnOk) {
            btnOk.onclick = function() {
                console.log('Botão OK clicado, executando callback...');
                fecharPopup('popup-notificacao');
                callback();
            };
        }
    } else {
        console.log('Nenhum callback fornecido');
        const btnOk = popup.querySelector('.botao-popup.primario');
        if (btnOk) {
            btnOk.onclick = function() {
                fecharPopup('popup-notificacao');
            };
        }
    }
    
    console.log('Abrindo popup...');
    abrirPopup('popup-notificacao');
}

function mostrarSucesso(titulo, mensagem, callback = null) {
    console.log('mostrarSucesso chamado:', titulo, mensagem, !!callback);
    mostrarNotificacao('sucesso', titulo, mensagem, callback);
}

function mostrarErro(titulo, mensagem, callback = null) {
    mostrarNotificacao('erro', titulo, mensagem, callback);
}

function mostrarWarning(titulo, mensagem, callback = null) {
    mostrarNotificacao('warning', titulo, mensagem, callback);
}

function mostrarInfo(titulo, mensagem, callback = null) {
    mostrarNotificacao('info', titulo, mensagem, callback);
}

function mostrarConfirmacao(titulo, mensagem, callbackConfirmar, callbackCancelar = null) {
    const popup = document.getElementById('popup-confirmacao');
    const tituloEl = document.getElementById('popup-confirmacao-titulo');
    const textoEl = document.getElementById('popup-confirmacao-texto');
    const btnConfirmar = document.getElementById('popup-confirmacao-confirmar');
    
    if (!popup || !tituloEl || !textoEl || !btnConfirmar) return;
    
    tituloEl.textContent = titulo;
    textoEl.textContent = mensagem;
    
    // Configurar callbacks
    btnConfirmar.onclick = function() {
        fecharPopup('popup-confirmacao');
        if (callbackConfirmar) callbackConfirmar();
    };
    
    const btnCancelar = popup.querySelector('.botao-popup.secundario');
    if (btnCancelar) {
        btnCancelar.onclick = function() {
            fecharPopup('popup-confirmacao');
            if (callbackCancelar) callbackCancelar();
        };
    }
    
    abrirPopup('popup-confirmacao');
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado');
    console.log('Firebase disponível:', typeof firebase !== "undefined");
    console.log('Auth disponível:', !!auth);
    
    // Verifica se Firebase está carregado
    if (!auth) {
        console.error("Firebase Auth não está disponível");
        alert("Firebase não carregado. Certifique-se de que os scripts do Firebase estão incluídos no HTML e que o Live Server está configurado corretamente.");
        return;
    }

    console.log('Firebase inicializado com sucesso');

    // Debug: Verificar se popups existem
    console.log('Verificando popups disponíveis:');
    console.log('popup-notificacao:', !!document.getElementById('popup-notificacao'));
    console.log('popup-recuperar-senha:', !!document.getElementById('popup-recuperar-senha'));
    console.log('popup-sucesso:', !!document.getElementById('popup-sucesso'));
    console.log('popup-email-info:', !!document.getElementById('popup-email-info'));
    console.log('popup-confirmacao:', !!document.getElementById('popup-confirmacao'));

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
            const nome = document.getElementById('nome-criar').value.trim();
            const email = document.getElementById('email-criar').value;
            const senha = document.getElementById('senha-criar').value;

            // Validação do nome
            if (nome.length < 2) {
                mostrarWarning('Nome Inválido', 'Por favor, digite um nome válido com pelo menos 2 caracteres.');
                return;
            }

            auth.createUserWithEmailAndPassword(email, senha)
                .then(userCredential => {
                    // Atualizar o perfil do usuário com o nome
                    return userCredential.user.updateProfile({
                        displayName: nome
                    });
                })
                .then(() => {
                    // Salvar informações adicionais no Firestore (opcional)
                    const db = firebase.firestore();
                    const user = auth.currentUser;
                    return db.collection('users').doc(user.uid).set({
                        name: nome,
                        email: email,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                })
                .then(() => {
                    console.log('Conta criada com sucesso');
                    mostrarSucesso(
                        'Conta Criada!', 
                        'Sua conta foi criada com sucesso. Bem-vindo ao Poup+!',
                        () => {
                            window.location.href = 'Home/home.html';
                        }
                    );
                })
                .catch(error => {
                    console.error('Erro ao criar conta:', error);
                    let errorMessage = 'Não foi possível criar sua conta.';
                    
                    switch(error.code) {
                        case 'auth/email-already-in-use':
                            errorMessage = 'Este email já está sendo usado por outra conta.';
                            break;
                        case 'auth/invalid-email':
                            errorMessage = 'Email inválido. Verifique o formato.';
                            break;
                        case 'auth/weak-password':
                            errorMessage = 'Senha muito fraca. Use pelo menos 6 caracteres.';
                            break;
                        default:
                            errorMessage = 'Erro inesperado: ' + (error.message || 'Tente novamente.');
                    }
                    
                    mostrarErro('Erro ao Criar Conta', errorMessage);
                });
        });
    }

    // Formulário de Login
    const formLogin = document.getElementById('form-login');
    console.log('Formulário de login encontrado:', !!formLogin);
    
    if (formLogin) {
        console.log('Adicionando event listener ao formulário de login');
        formLogin.addEventListener('submit', function(e) {
            e.preventDefault();
            console.log('Formulário de login submetido');
            console.log('Tentando fazer login...');
            
            const email = document.getElementById('email-login').value;
            const senha = document.getElementById('senha-login').value;
            
            console.log('Email:', email);
            console.log('Senha length:', senha.length);

            if (!email || !senha) {
                mostrarWarning('Campos Obrigatórios', 'Por favor, preencha todos os campos.');
                return;
            }

            auth.signInWithEmailAndPassword(email, senha)
                .then(userCredential => {
                    console.log('Login realizado com sucesso!', userCredential);
                    console.log('Tentando mostrar popup de sucesso...');
                    
                    mostrarSucesso(
                        'Login Realizado!', 
                        'Bem-vindo de volta!',
                        () => {
                            console.log('Callback executado, redirecionando...');
                            window.location.href = 'Home/home.html';
                        }
                    );
                    
                    // Fallback: redirecionar após 3 segundos se o popup não funcionar
                    setTimeout(() => {
                        console.log('Fallback: redirecionando após timeout...');
                        window.location.href = 'Home/home.html';
                    }, 3000);
                })
                .catch(error => {
                    console.error('Erro no login:', error);
                    console.error('Código do erro:', error.code);
                    console.error('Mensagem do erro:', error.message);
                    
                    let errorMessage = 'Erro ao fazer login: ';
                    
                    switch(error.code) {
                        case 'auth/user-not-found':
                            errorMessage = 'Usuário não encontrado. Verifique o email ou crie uma conta.';
                            break;
                        case 'auth/wrong-password':
                            errorMessage = 'Senha incorreta. Tente novamente.';
                            break;
                        case 'auth/invalid-email':
                            errorMessage = 'Email inválido. Verifique o formato do email.';
                            break;
                        case 'auth/too-many-requests':
                            errorMessage = 'Muitas tentativas de login. Tente novamente mais tarde.';
                            break;
                        case 'auth/user-disabled':
                            errorMessage = 'Esta conta foi desabilitada.';
                            break;
                        case 'auth/invalid-login-credentials':
                        case 'auth/internal-error':
                            errorMessage = 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.';
                            break;
                        default:
                            errorMessage = 'Erro de autenticação: ' + (error.message || 'Erro desconhecido');
                    }
                    
                    mostrarErro('Erro no Login', errorMessage);
                });
        });
    } else {
        console.error('Formulário de login não encontrado! Verifique se o ID está correto.');
    }

    // Botões de login social
    const btnGoogle = document.querySelector('.btn-social.google');
    if (btnGoogle) {
        btnGoogle.addEventListener('click', function() {
            auth.signInWithPopup(googleProvider)
                .then(result => {
                    mostrarSucesso(
                        'Login com Google!', 
                        'Login realizado com sucesso!',
                        () => {
                            window.location.href = 'Home/home.html';
                        }
                    );
                })
                .catch(error => {
                    mostrarErro('Erro no Login', 'Erro ao fazer login com Google: ' + (error.message || error));
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
        btnEsqueceuSenha.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Abrindo popup de recuperação de senha');
            
            // Pegar o email digitado no login (se houver)
            const emailLogin = document.getElementById('email-login');
            const emailPopup = document.getElementById('email-popup-recuperar');
            
            if (emailLogin && emailLogin.value.trim() && emailPopup) {
                emailPopup.value = emailLogin.value.trim();
            }
            
            // Abrir popup
            abrirPopup('popup-recuperar-senha');
        });
    }

    // Popup de Recuperação de Senha
    const btnPopupEnviar = document.getElementById('btn-popup-enviar');
    const formPopupRecuperar = document.getElementById('form-popup-recuperar');
    let emailRecuperacao = '';

    if (btnPopupEnviar) {
        btnPopupEnviar.addEventListener('click', function() {
            enviarEmailRecuperacao();
        });
    }

    if (formPopupRecuperar) {
        formPopupRecuperar.addEventListener('submit', function(e) {
            e.preventDefault();
            enviarEmailRecuperacao();
        });
    }

    function enviarEmailRecuperacao() {
        const emailInput = document.getElementById('email-popup-recuperar');
        const email = emailInput.value.trim();
        
        console.log('Enviando email de recuperação para:', email);

        // Validação
        if (!email) {
            mostrarWarning('Email Obrigatório', 'Por favor, digite seu email.');
            return;
        }

        if (!isValidEmail(email)) {
            mostrarWarning('Email Inválido', 'Por favor, digite um email válido.');
            return;
        }

        // Mostrar loading
        mostrarLoadingPopup(true);
        emailRecuperacao = email;

        // Enviar email via Firebase
        auth.sendPasswordResetEmail(email)
            .then(() => {
                console.log('Email de recuperação enviado com sucesso');
                mostrarLoadingPopup(false);
                fecharPopup('popup-recuperar-senha');
                abrirPopup('popup-sucesso');
                
                // Mostrar botão de reenviar após 30 segundos
                setTimeout(() => {
                    const btnReenviar = document.getElementById('btn-reenviar-popup');
                    if (btnReenviar) {
                        btnReenviar.style.display = 'inline-block';
                    }
                }, 30000);
            })
            .catch(error => {
                console.error('Erro ao enviar email de recuperação:', error);
                mostrarLoadingPopup(false);
                
                let errorMessage = 'Erro ao enviar email: ';
                
                switch(error.code) {
                    case 'auth/user-not-found':
                        errorMessage = 'Não encontramos uma conta com esse email. Verifique se digitou corretamente.';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Email inválido. Verifique o formato do email.';
                        break;
                    case 'auth/too-many-requests':
                        errorMessage = 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.';
                        break;
                    default:
                        errorMessage = 'Erro inesperado. Tente novamente mais tarde.';
                }
                
                mostrarErro('Erro no Envio', errorMessage);
            });
    }

    // Botão de reenviar email
    const btnReenviarPopup = document.getElementById('btn-reenviar-popup');
    if (btnReenviarPopup) {
        btnReenviarPopup.addEventListener('click', function() {
            if (!emailRecuperacao) {
                mostrarErro('Erro', 'Email não encontrado.');
                return;
            }

            btnReenviarPopup.disabled = true;
            btnReenviarPopup.textContent = 'Reenviando...';
            
            auth.sendPasswordResetEmail(emailRecuperacao)
                .then(() => {
                    console.log('Email reenviado com sucesso');
                    mostrarSucesso('Email Reenviado', 'Email reenviado com sucesso!');
                    btnReenviarPopup.disabled = false;
                    btnReenviarPopup.textContent = 'Reenviar Email';
                })
                .catch(error => {
                    console.error('Erro ao reenviar email:', error);
                    btnReenviarPopup.disabled = false;
                    btnReenviarPopup.textContent = 'Reenviar Email';
                    mostrarErro('Erro', 'Erro ao reenviar email. Tente novamente.');
                });
        });
    }

    // Fechar popup clicando fora
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('popup-overlay')) {
            fecharPopup(e.target.id);
        }
    });
});