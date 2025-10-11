// INÍCIO: Firebase Auth
// Adicione isso ANTES do DOMContentLoaded
let firebaseApp, auth, googleProvider;
let loginEmAndamento = false; // Flag para evitar múltiplos logins simultâneos
let ultimaReinicicializacao = 0; // Timestamp da última reinicialização

// Função para limpar cache do Firebase e reinicializar
function reinicializarFirebase() {
    const agora = Date.now();
    // Evitar múltiplas reinicializações em sequência
    if (agora - ultimaReinicicializacao < 5000) {
        console.log('Reinicialização bloqueada - muito cedo');
        return;
    }
    ultimaReinicicializacao = agora;
    
    try {
        console.log('Iniciando reinicialização do Firebase...');
        
        // Limpar localStorage e sessionStorage do Firebase
        localStorage.removeItem('firebase:authUser:' + 'AIzaSyC7RB9fULmkp9xeJIjc0dL58atHJ8CM-Xc:[DEFAULT]');
        sessionStorage.removeItem('firebase:authUser:' + 'AIzaSyC7RB9fULmkp9xeJIjc0dL58atHJ8CM-Xc:[DEFAULT]');
        
        // Limpar todas as apps existentes
        if (firebase.apps.length > 0) {
            firebase.apps.forEach(app => {
                try {
                    app.delete();
                } catch (e) {
                    console.warn('Erro ao deletar app Firebase:', e);
                }
            });
        }
        
        // Aguardar um pouco para garantir limpeza
        setTimeout(() => {
            initFirebase();
        }, 200);
    } catch (error) {
        console.error('Erro ao limpar Firebase:', error);
        initFirebase();
    }
}

function initFirebase() {
    if (typeof firebase !== "undefined") {
        try {
            if (!firebase.apps.length) {
                firebaseApp = firebase.initializeApp({
                    apiKey: "AIzaSyC7RB9fULmkp9xeJIjc0dL58atHJ8CM-Xc",
                    authDomain: "poup-beta.firebaseapp.com",
                    projectId: "poup-beta",
                    storageBucket: "poup-beta.appspot.com",
                    messagingSenderId: "954695915981",
                    appId: "1:954695915981:web:d31b216f79eac178094c84"
                });
            } else {
                firebaseApp = firebase.app();
            }
            auth = firebase.auth();
            googleProvider = new firebase.auth.GoogleAuthProvider();
            
            // Configurar o provedor Google com configurações otimizadas
            googleProvider.addScope('profile');
            googleProvider.addScope('email');
            
            // Configurações específicas para resolver problemas de Cross-Origin
            googleProvider.setCustomParameters({
                'prompt': 'select_account',
                'include_granted_scopes': 'true',
                'access_type': 'online'
            });
            
            // Configurar auth para melhor compatibilidade
            auth.useDeviceLanguage();
            
            console.log('Firebase inicializado com sucesso');
            console.log('API Key em uso:', firebaseApp.options.apiKey);
        } catch (error) {
            console.error("Erro ao inicializar Firebase:", error);
            // Aguardar DOM carregar para mostrar popup
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    mostrarPopupErro('Erro de Configuração', 'Falha ao inicializar sistema de autenticação. Recarregue a página.');
                });
            } else {
                mostrarPopupErro('Erro de Configuração', 'Falha ao inicializar sistema de autenticação. Recarregue a página.');
            }
        }
    } else {
        console.error("Firebase não carregado. Certifique-se de que os scripts do Firebase estão incluídos no HTML.");
        // Aguardar DOM carregar para mostrar popup
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                mostrarPopupErro('Erro de Sistema', 'Sistema de autenticação não carregado. Verifique sua conexão e recarregue a página.');
            });
        } else {
            mostrarPopupErro('Erro de Sistema', 'Sistema de autenticação não carregado. Verifique sua conexão e recarregue a página.');
        }
    }
}

// Inicializar Firebase
initFirebase();
// FIM: Firebase Auth

document.addEventListener('DOMContentLoaded', function() {
    // Verificar se Firebase está carregado
    if (!auth) {
        mostrarPopupErro('Erro de Configuração', 'Sistema de autenticação não foi carregado corretamente. Recarregue a página.');
        return;
    }
    
    console.log('Firebase Auth inicializado:', !!auth);
    console.log('Google Provider inicializado:', !!googleProvider);

    // Verificar se retornou de um redirect do Google
    auth.getRedirectResult().then(result => {
        if (result.user) {
            console.log('Login via redirect bem-sucedido:', result);
            const user = result.user;
            
            // Salvar dados do usuário no Firestore (se não existir)
            if (typeof firebase !== "undefined" && firebase.firestore) {
                const userRef = firebase.firestore().collection('usuarios').doc(user.uid);
                userRef.get().then(doc => {
                    if (!doc.exists) {
                        userRef.set({
                            nome: user.displayName || 'Usuário Google',
                            email: user.email,
                            fotoURL: user.photoURL || '',
                            provedor: 'google'
                        });
                    }
                });
            }
            
            mostrarPopupSucesso('Login com Google realizado com sucesso!');
            setTimeout(() => {
                window.location.href = './Home/home.html';
            }, 2000);
    }
}).catch(error => {
    if (error.code !== 'auth/popup-closed-by-user') {
        console.error('Erro no redirect:', error);
    }
});

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
            
            // Evitar submissões múltiplas
            if (loginEmAndamento) {
                return;
            }
            loginEmAndamento = true;
            
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
                    loginEmAndamento = false;
                    mostrarPopupSucesso('Conta criada com sucesso!');
                    setTimeout(() => {
                        window.location.href = './Home/home.html';
                    }, 2000);
                })
                .catch(error => {
                    loginEmAndamento = false;
                    let mensagem = '';
                    
                    switch(error.code) {
                        case 'auth/email-already-in-use':
                            mensagem = 'Este email já está sendo usado por outra conta.';
                            break;
                        case 'auth/weak-password':
                            mensagem = 'A senha é muito fraca. Use pelo menos 6 caracteres.';
                            break;
                        case 'auth/invalid-email':
                            mensagem = 'O email informado não é válido.';
                            break;
                        default:
                            mensagem = error.message || 'Erro desconhecido ao criar conta.';
                    }
                    
                    mostrarPopupErro('Erro ao Criar Conta', mensagem);
                });
        });
    }

    // Formulário de Login
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Evitar submissões múltiplas
            if (loginEmAndamento) {
                return;
            }
            loginEmAndamento = true;
            
            const email = document.getElementById('email-login').value;
            const senha = document.getElementById('senha-login').value;

            auth.signInWithEmailAndPassword(email, senha)
                .then(userCredential => {
                    loginEmAndamento = false;
                    mostrarPopupSucesso('Login realizado com sucesso!');
                    setTimeout(() => {
                        window.location.href = './Home/home.html';
                    }, 1500);
                })
                .catch(error => {
                    loginEmAndamento = false;
                    console.error('Erro no login:', error);
                    let mensagem = '';
                    
                    switch(error.code) {
                        case 'auth/user-not-found':
                            mensagem = 'Usuário não encontrado. Verifique o email ou crie uma nova conta.';
                            break;
                        case 'auth/wrong-password':
                            mensagem = 'Senha incorreta. Tente novamente ou recupere sua senha.';
                            break;
                        case 'auth/invalid-email':
                            mensagem = 'O email informado não é válido.';
                            break;
                        case 'auth/invalid-credential':
                            mensagem = 'Email ou senha inválidos. Verifique suas credenciais e tente novamente.';
                            break;
                        case 'auth/too-many-requests':
                            mensagem = 'Muitas tentativas de login. Por segurança, sua conta foi temporariamente bloqueada. Tente novamente em alguns minutos.';
                            break;
                        case 'auth/network-request-failed':
                            mensagem = 'Erro de conexão com a internet. Verifique sua conexão e tente novamente.';
                            break;
                        case 'auth/user-disabled':
                            mensagem = 'Esta conta foi desativada. Entre em contato com o suporte.';
                            break;
                        case 'auth/internal-error':
                            // Verificar se é erro de credenciais inválidas
                            if (error.message && error.message.includes('INVALID_LOGIN_CREDENTIALS')) {
                                mensagem = 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.';
                            } else {
                                mensagem = 'Erro interno do servidor. Tente novamente em alguns instantes.';
                            }
                            break;
                        default:
                            // Verificar mensagens específicas no erro
                            if (error.message && error.message.includes('INVALID_LOGIN_CREDENTIALS')) {
                                mensagem = 'Email ou senha incorretos. Verifique suas credenciais e tente novamente.';
                            } else if (error.message && error.message.includes('INVALID_PASSWORD')) {
                                mensagem = 'Senha incorreta. Tente novamente ou recupere sua senha.';
                            } else if (error.message && error.message.includes('EMAIL_NOT_FOUND')) {
                                mensagem = 'Este email não está cadastrado. Verifique o email ou crie uma nova conta.';
                            } else {
                                mensagem = 'Não foi possível fazer login. Verifique seus dados e tente novamente.';
                            }
                    }
                    
                    mostrarPopupErro('Erro no Login', mensagem);
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
            
            // Evitar cliques múltiplos
            if (loginEmAndamento) {
                console.log('Login já em andamento, ignorando clique');
                return;
            }
            
            if (!googleProvider) {
                mostrarPopupErro('Erro de Configuração', 'Sistema de login com Google não está configurado. Tente recarregar a página.');
                return;
            }
            
            // Tentar reinicializar Firebase se necessário
            if (!auth || !firebaseApp) {
                console.log('Reinicializando Firebase...');
                reinicializarFirebase();
                setTimeout(() => {
                    if (auth && googleProvider) {
                        realizarLoginGoogle();
                    } else {
                        mostrarPopupErro('Erro de Sistema', 'Não foi possível inicializar o sistema de login. Recarregue a página.');
                    }
                }, 1000);
                return;
            }
            
            realizarLoginGoogle();
        });
    });

    function realizarLoginGoogle() {
        // Evitar múltiplas tentativas simultâneas
        if (loginEmAndamento) {
            console.log('Login já em andamento');
            return;
        }
        
        loginEmAndamento = true;
        console.log('Iniciando login Google...');
        
        // Usar signInWithRedirect em vez de popup para evitar problemas de Cross-Origin
        const isMobile = /Mobi|Android/i.test(navigator.userAgent);
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        // Tentar método de popup primeiro, depois redirect se falhar
        auth.signInWithPopup(googleProvider)
            .then(result => {
                loginEmAndamento = false;
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
                
                mostrarPopupSucesso('Login com Google realizado com sucesso!');
                setTimeout(() => {
                    window.location.href = './Home/home.html';
                }, 2000);
            })
            .catch(error => {
                loginEmAndamento = false;
                console.error('Erro detalhado:', error);
                console.log('Tentativa de login com:', error.email || 'email não disponível');
                
                let titulo = 'Erro no Login';
                let mensagem = '';
                let tipo = 'erro'; // erro, info
                let tentarRedirect = false;
                
                switch(error.code) {
                    case 'auth/popup-closed-by-user':
                        tipo = 'info';
                        titulo = 'Login Cancelado';
                        mensagem = 'O login foi cancelado. Tente novamente quando desejar fazer login.';
                        break;
                    case 'auth/popup-blocked':
                        titulo = 'Popup Bloqueado';
                        mensagem = 'Seu navegador bloqueou o popup de login. Tentando método alternativo...';
                        tentarRedirect = true;
                        break;
                    case 'auth/cancelled-popup-request':
                        tipo = 'info';
                        titulo = 'Solicitação Cancelada';
                        mensagem = 'A solicitação de login foi cancelada. Você pode tentar novamente.';
                        break;
                    case 'auth/unauthorized-domain':
                        titulo = 'Domínio Não Autorizado';
                        mensagem = 'Este domínio não está autorizado para login com Google. Entre em contato com o administrador.';
                        break;
                    case 'auth/invalid-api-key':
                        titulo = 'Erro de Configuração';
                        mensagem = 'Chave de API inválida. Tentando reinicializar sistema...';
                        setTimeout(() => {
                            reinicializarFirebase();
                        }, 1000);
                        break;
                    case 'auth/internal-error':
                        // Tratar especificamente o erro interno
                        if (error.message && error.message.includes('INVALID_LOGIN_CREDENTIALS')) {
                            titulo = 'Credenciais Inválidas';
                            mensagem = 'Não foi possível validar suas credenciais. Por favor, tente novamente ou use outro método de login.';
                        } else {
                            titulo = 'Erro Interno';
                            mensagem = 'Erro interno do sistema. Por favor, tente novamente em alguns instantes.';
                        }
                        break;
                    default:
                        // Verificar mensagens específicas
                        if (error.message && error.message.includes('INVALID_LOGIN_CREDENTIALS')) {
                            titulo = 'Credenciais Inválidas';
                            mensagem = 'Não foi possível validar suas credenciais. Por favor, tente novamente ou use o método de login por email e senha.';
                        } else if (error.message && error.message.includes('API key not valid')) {
                            titulo = 'Erro de Sistema';
                            mensagem = 'Há um problema na configuração do sistema. Tentando corrigir automaticamente...';
                            setTimeout(() => {
                                reinicializarFirebase();
                            }, 1000);
                        } else if (error.message && error.message.includes('not authorized to run this operation')) {
                            titulo = 'Operação Não Autorizada';
                            mensagem = 'Este domínio não está configurado para login. Entre em contato com o administrador.';
                        } else if (error.message && error.message.includes('Cross-Origin-Opener-Policy')) {
                            titulo = 'Erro de Navegador';
                            mensagem = 'Problema de segurança do navegador. Tentando método alternativo...';
                            tentarRedirect = true;
                        } else {
                            mensagem = 'Não foi possível fazer login com Google. Por favor, tente novamente ou use o método de login por email e senha.';
                        }
                }
                
                // Tentar método de redirect se popup falhou
                if (tentarRedirect && !isLocalhost) {
                    console.log('Tentando login com redirect...');
                    auth.signInWithRedirect(googleProvider);
                    return;
                }
                
                if (tipo === 'info') {
                    mostrarPopupInfo(titulo, mensagem);
                } else {
                    mostrarPopupErro(titulo, mensagem);
                }
            });
    }

    const btnApple = document.getElementById('btn-apple');
    if (btnApple) {
        btnApple.addEventListener('click', function() {
            mostrarPopupInfo('Em Desenvolvimento', 'Login com Apple será implementado em breve.');
        });
    }

    const btnAppleLogin = document.getElementById('btn-apple-login');
    if (btnAppleLogin) {
        btnAppleLogin.addEventListener('click', function() {
            mostrarPopupInfo('Em Desenvolvimento', 'Login com Apple será implementado em breve.');
        });
    }

    // Botão de esqueceu a senha
    const btnEsqueceuSenha = document.querySelector('.btn-link');
    if (btnEsqueceuSenha) {
        btnEsqueceuSenha.addEventListener('click', function() {
            solicitarRedefinicaoSenha();
        });
    }
});

// Função para solicitar redefinição de senha
function solicitarRedefinicaoSenha() {
    // Pegar o email do campo de login se estiver preenchido
    const emailInput = document.getElementById('email-login');
    let email = emailInput ? emailInput.value.trim() : '';
    
    if (!email) {
        // Se não há email no campo, solicitar ao usuário
        email = prompt('Digite seu email para receber o link de redefinição de senha:');
        if (!email) {
            return; // Usuário cancelou
        }
    }
    
    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        mostrarPopupErro('Email Inválido', 'Por favor, digite um email válido.');
        return;
    }
    
    // Tentar reinicializar Firebase se necessário
    if (!auth) {
        mostrarPopupErro('Erro de Sistema', 'Sistema de autenticação não inicializado. Recarregue a página.');
        return;
    }
    
    // Enviar email de redefinição
    auth.sendPasswordResetEmail(email)
        .then(() => {
            mostrarPopupSucesso(`Email de redefinição de senha enviado para ${email}! Verifique sua caixa de entrada e spam.`);
        })
        .catch((error) => {
            console.error('Erro ao enviar email de redefinição:', error);
            
            let titulo = 'Erro ao Enviar Email';
            let mensagem = '';
            
            switch(error.code) {
                case 'auth/user-not-found':
                    mensagem = 'Não encontramos uma conta associada a este email. Verifique o email ou crie uma nova conta.';
                    break;
                case 'auth/invalid-email':
                    mensagem = 'Email inválido. Verifique se o email está correto.';
                    break;
                case 'auth/too-many-requests':
                    mensagem = 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.';
                    break;
                case 'auth/network-request-failed':
                    mensagem = 'Erro de conexão. Verifique sua internet e tente novamente.';
                    break;
                case 'auth/internal-error':
                    // Tentar reinicializar se for erro interno
                    titulo = 'Erro de Configuração';
                    mensagem = 'Erro interno do sistema. Tentando reinicializar...';
                    setTimeout(() => {
                        reinicializarFirebase();
                    }, 1000);
                    break;
                default:
                    mensagem = `Erro inesperado: ${error.message || 'Tente novamente mais tarde.'}`;
            }
            
            mostrarPopupErro(titulo, mensagem);
        });
}

// Funções para o popup
function mostrarPopupSucesso(mensagem) {
    const popup = document.getElementById('popup-sucesso');
    const mensagemElement = popup.querySelector('.popup-message');
    mensagemElement.textContent = mensagem;
    popup.style.display = 'flex';
}

function fecharPopup() {
    const popup = document.getElementById('popup-sucesso');
    popup.style.display = 'none';
}

function mostrarPopupErro(titulo, mensagem) {
    const popup = document.getElementById('popup-erro');
    const tituloElement = popup.querySelector('.popup-title');
    const mensagemElement = popup.querySelector('.popup-message');
    
    tituloElement.textContent = titulo;
    mensagemElement.textContent = mensagem;
    popup.style.display = 'flex';
}

function fecharPopupErro() {
    const popup = document.getElementById('popup-erro');
    popup.style.display = 'none';
}

function mostrarPopupInfo(titulo, mensagem) {
    const popup = document.getElementById('popup-info');
    const tituloElement = popup.querySelector('.popup-title');
    const mensagemElement = popup.querySelector('.popup-message');
    
    tituloElement.textContent = titulo;
    mensagemElement.textContent = mensagem;
    popup.style.display = 'flex';
}

function fecharPopupInfo() {
    const popup = document.getElementById('popup-info');
    popup.style.display = 'none';
}

// Fechar popups com ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        fecharPopup();
        fecharPopupErro();
        fecharPopupInfo();
    }
});

// Fechar popups clicando no overlay
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('popup-overlay')) {
        fecharPopup();
        fecharPopupErro();
        fecharPopupInfo();
    }
});