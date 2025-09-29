// Dados das instituições (será substituído pelas contas do Firebase)
let userAccounts = [];

// Dados das bandeiras de cartão (usando ícones reais da pasta Icon)
const bandeiras = [
    { name: 'Visa', icon: '../Icon/visa.svg', type: 'image' },
    { name: 'Mastercard', icon: '../Icon/mastercard.svg', type: 'image' },
    { name: 'Elo', icon: '../Icon/elo.svg', type: 'image' },
    { name: 'Hipercard', icon: '../Icon/hipercard.svg', type: 'image' },
    { name: 'American Express', icon: '../Icon/american-express.svg', type: 'image' }
];

// Firebase Configuration
let firebaseApp, auth, db;

// Inicializar Firebase
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
        db = firebase.firestore();
        
        // Configurar persistência da autenticação
        auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
            .then(() => {
                console.log('[Novo Cartão] Firebase persistência configurada');
            })
            .catch((error) => {
                console.error('[Novo Cartão] Erro ao configurar persistência:', error);
            });
        
        console.log('[Novo Cartão] Firebase inicializado com sucesso');
    } else {
        console.warn('[Novo Cartão] Firebase SDK não carregado');
    }
})();

// Funções de autenticação com token
function salvarTokenUsuario(user) {
    const dadosUsuario = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        timestamp: Date.now()
    };
    localStorage.setItem('tokenUsuarioPoup', JSON.stringify(dadosUsuario));
}

function obterTokenUsuario() {
    try {
        const token = localStorage.getItem('tokenUsuarioPoup');
        if (token) {
            const dadosUsuario = JSON.parse(token);
            // Verificar se o token não está expirado (24 horas)
            const horasExpiracao = 24;
            const tempoExpiracao = horasExpiracao * 60 * 60 * 1000;
            
            if (Date.now() - dadosUsuario.timestamp < tempoExpiracao) {
                return dadosUsuario;
            } else {
                localStorage.removeItem('tokenUsuarioPoup');
            }
        }
        return null;
    } catch (error) {
        console.error('[Novo Cartão] Erro ao ler token:', error);
        localStorage.removeItem('tokenUsuarioPoup');
        return null;
    }
}

function limparTokenUsuario() {
    localStorage.removeItem('tokenUsuarioPoup');
}

// Função para tentar reautenticação silenciosa
async function tentarReautenticacaoSilenciosa(tokenUsuario) {
    try {
        console.log('[Novo Cartão] Tentando reautenticação silenciosa para:', tokenUsuario.email);
        
        if (tokenUsuario.email && auth) {
            console.log('[Novo Cartão] Email disponível para reautenticação:', tokenUsuario.email);
            
            // Primeiro, aguardar o Firebase processar qualquer estado persistido
            const waitResult = await aguardarFirebaseAuth();
            if (waitResult && waitResult.uid === tokenUsuario.uid) {
                console.log('[Novo Cartão] Usuário encontrado através de aguardar Firebase!', waitResult.uid);
                return waitResult;
            }
            
            // Se não conseguiu restaurar automaticamente, tentar forçar refresh do token
            console.log('[Novo Cartão] Tentando forçar refresh do token de autenticação...');
            
            try {
                // Verificar se há algum método de refresh disponível
                if (auth.currentUser && auth.currentUser.getIdToken) {
                    console.log('[Novo Cartão] Tentando refresh do token atual...');
                    const token = await auth.currentUser.getIdToken(true);
                    console.log('[Novo Cartão] Token refreshed, usuário:', auth.currentUser.uid);
                    return auth.currentUser;
                }
                
                // Se não há usuário atual, mas temos dados locais válidos
                console.log('[Novo Cartão] Sem currentUser mas token local válido. Pode ser necessário relogin...');
                
            } catch (refreshError) {
                console.log('[Novo Cartão] Erro ao refresh token:', refreshError);
            }
            
            return null;
        }
        
        return null;
    } catch (error) {
        console.error('[Novo Cartão] Erro na reautenticação silenciosa:', error);
        return null;
    }
}

// Função para aguardar Firebase Auth estar pronto (melhorada)
async function aguardarFirebaseAuth() {
    return new Promise((resolve) => {
        if (!auth) {
            resolve(null);
            return;
        }
        
        // Se já há um usuário atual
        if (auth.currentUser) {
            resolve(auth.currentUser);
            return;
        }
        
        let checkCount = 0;
        const maxChecks = 15; // 15 segundos de espera
        
        const checkAuth = () => {
            checkCount++;
            console.log(`[Novo Cartão] Aguardando Firebase ${checkCount}/${maxChecks} - Current user:`, auth.currentUser ? auth.currentUser.uid : 'null');
            
            if (auth.currentUser) {
                console.log('[Novo Cartão] Usuário encontrado ao aguardar Firebase!', auth.currentUser.uid);
                resolve(auth.currentUser);
            } else if (checkCount >= maxChecks) {
                console.log('[Novo Cartão] Timeout ao aguardar Firebase Auth.');
                resolve(null);
            } else {
                setTimeout(checkAuth, 1000);
            }
        };
        
        // Começar verificação
        setTimeout(checkAuth, 500);
    });
}

let selectedInstitution = null;
let selectedBrand = bandeiras[0]; // Visa como padrão
let filteredInstitutions = [];
let limitValue = 0;
let calculatorState = {
    valorAtual: '0',
    digitandoValor: false
};

// Inicializar a aplicação
document.addEventListener('DOMContentLoaded', function() {
    setupSearch();
    setupCalculator();
    setupBrandSelector();
    
    // Mostrar indicador de carregamento
    showLoadingState();
    
    // Primeiro, verificar se há token válido
    const tokenUsuario = obterTokenUsuario();
    
    if (tokenUsuario) {
        // Token existe, mas ainda precisa da autenticação Firebase para Firestore
        console.log('[Novo Cartão] Token encontrado, aguardando Firebase...', tokenUsuario.uid);
        
        // Mostrar loading
        showLoadingMessage();
        
        if (auth) {
            // Verificar se o usuário já está autenticado imediatamente
            if (auth.currentUser) {
                console.log('[Novo Cartão] Usuário já autenticado:', auth.currentUser.uid);
                buscarContasUsuario(auth.currentUser.uid);
                return;
            }
            
            // Aguardar autenticação do Firebase
            const unsubscribe = auth.onAuthStateChanged(user => {
                unsubscribe(); // Desinscrever após primeira execução
                
                if (user) {
                    console.log('[Novo Cartão] Usuário autenticado via Firebase:', user.uid);
                    salvarTokenUsuario(user); // Atualizar token
                    buscarContasUsuario(user.uid);
                } else {
                    console.log('[Novo Cartão] Auth Firebase não reconhece usuário, tentando silent refresh...');
                    
                    // Se temos token local mas Firebase não reconhece, tentar silent refresh
                    if (tokenUsuario && tokenUsuario.uid) {
                        console.log('[Novo Cartão] Tentando reautenticar automaticamente...');
                        
                        // Tentar reautenticação silenciosa
                        tentarReautenticacaoSilenciosa(tokenUsuario).then(user => {
                            if (user) {
                                console.log('[Novo Cartão] Reautenticação silenciosa bem-sucedida:', user.uid);
                                buscarContasUsuario(user.uid);
                            } else {
                                console.log('[Novo Cartão] Reautenticação silenciosa falhou. Aguardando mais...');
                                
                                // Aguardar 5 segundos para Firebase carregar (reduzido)
                                setTimeout(() => {
                                    if (auth.currentUser) {
                                        console.log('[Novo Cartão] Usuário encontrado após delay extra:', auth.currentUser.uid);
                                        buscarContasUsuario(auth.currentUser.uid);
                                    } else {
                                        console.log('[Novo Cartão] Token não reconhecido pelo Firebase após todas as tentativas.');
                                        console.log('[Novo Cartão] Dados do token local:', tokenUsuario);
                                        console.log('[Novo Cartão] Usuário atual do Firebase:', auth.currentUser);
                                        
                                        // Aguardar 3 segundos antes de decidir (reduzido)
                                        setTimeout(() => {
                                            if (auth.currentUser && auth.currentUser.uid === tokenUsuario.uid) {
                                                console.log('[Novo Cartão] Usuário finalmente encontrado!', auth.currentUser.uid);
                                                buscarContasUsuario(auth.currentUser.uid);
                                            } else {
                                                // Token local existe mas Firebase não reconhece = sessão expirada
                                                console.log('[Novo Cartão] Sessão Firebase expirada. Redirecionando para Home...');
                                                showReauthMessage();
                                            }
                                        }, 3000);
                                    }
                                }, 5000);
                            }
                        });
                    } else {
                        showLoginMessage();
                    }
                }
            });
            
            // Timeout para Firebase Auth (aumentado para 25 segundos para dar tempo às verificações)
            setTimeout(() => {
                if (auth.currentUser) {
                    console.log('[Novo Cartão] Usuário autenticado após timeout:', auth.currentUser.uid);
                    buscarContasUsuario(auth.currentUser.uid);
                } else {
                    console.log('[Novo Cartão] Timeout de autenticação após 25s. Redirecionando...');
                    if (tokenUsuario) {
                        console.log('[Novo Cartão] Limpando token inválido...');
                        limparTokenUsuario();
                        showReauthMessage();
                    } else {
                        showLoginMessage();
                    }
                }
            }, 25000);
        } else {
            console.warn('[Novo Cartão] Firebase auth não disponível');
            showLoginMessage();
        }
        
        return;
    }
    
    // Se não há token, mostrar login
    console.log('[Novo Cartão] Sem token local. Mostrando tela de login...');
    showLoginMessage();
});

// Mostrar mensagem de carregamento
function showLoadingMessage() {
    const container = document.getElementById('institutionsList');
    if (!container) {
        console.error('[Novo Cartão] Elemento institutionsList não encontrado para loading');
        return;
    }
    
    container.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--cor-texto);">
            <div style="font-size: 2rem; margin-bottom: 16px;">⏳</div>
            <h3 style="margin-bottom: 8px; color: var(--cor-texto);">Carregando...</h3>
            <p style="color: var(--cor-texto-secundario);">
                Buscando suas contas...
            </p>
        </div>
    `;
}

// Mostrar estado de carregamento
function showLoadingState() {
    const container = document.getElementById('institutionsList');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: var(--cor-texto);">
                <div style="font-size: 2rem; margin-bottom: 16px;">⏳</div>
                <h3 style="margin-bottom: 8px; color: var(--cor-texto);">Carregando...</h3>
                <p style="color: var(--cor-texto-secundario);">
                    Buscando suas contas...
                </p>
            </div>
        `;
    }
}

// Buscar e carregar contas do usuário do Firebase
function buscarContasUsuario(uid) {
    console.log('[Novo Cartão] Buscando contas para usuário:', uid);
    
    if (!db) {
        console.error('[Novo Cartão] Firestore não disponível');
        showNoAccountsMessage();
        return;
    }
    
    db.collection('contas')
        .where('userId', '==', uid)
        .get()
        .then(snapshot => {
            console.log('[Novo Cartão] Resposta do Firestore recebida. Docs encontrados:', snapshot.size);
            
            const contas = [];
            snapshot.forEach(doc => {
                const dadosConta = { id: doc.id, ...doc.data() };
                contas.push(dadosConta);
                console.log('[Novo Cartão] Conta carregada:', dadosConta.nomeInstituicao || dadosConta.nome, dadosConta);
            });
            
            console.log('[Novo Cartão] Total de contas carregadas:', contas.length);
            
            if (contas.length > 0) {
                userAccounts = contas;
                filteredInstitutions = contas;
                renderInstitutions();
            } else {
                console.warn('[Novo Cartão] Nenhuma conta encontrada para o usuário:', uid);
                showNoAccountsMessage();
            }
        })
        .catch(error => {
            console.error('[Novo Cartão] Erro ao buscar contas:', error);
            console.error('[Novo Cartão] Código do erro:', error.code);
            console.error('[Novo Cartão] Mensagem:', error.message);
            
            // Se o erro for de autenticação, mostrar login
            if (error.code === 'permission-denied' || error.code === 'unauthenticated') {
                console.error('[Novo Cartão] ERRO DE AUTENTICAÇÃO: Redirecionando para login');
                showLoginMessage();
            } else {
                showNoAccountsMessage();
            }
        });
}

// Mostrar mensagem quando não há contas
function showNoAccountsMessage() {
    const container = document.getElementById('institutionsList');
    if (!container) {
        console.error('[Novo Cartão] Elemento institutionsList não encontrado para showNoAccountsMessage');
        return;
    }
    
    container.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--cor-texto);">
            <div style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;">🏦</div>
            <h3 style="margin-bottom: 8px; color: var(--cor-texto);">Nenhuma conta encontrada</h3>
            <p style="color: var(--cor-texto-secundario); margin-bottom: 20px;">
                Você precisa cadastrar uma conta bancária primeiro para criar um cartão.
            </p>
            <button onclick="window.location.href='../Nova-conta/Nova-conta.html'" 
                    style="background: var(--cor-primaria); color: white; border: none; 
                           padding: 12px 24px; border-radius: 8px; cursor: pointer;
                           font-weight: 500;">
                Cadastrar Nova Conta
            </button>
        </div>
    `;
}

// Mostrar mensagem de reautenticação (melhorada)
function showReauthMessage() {
    const container = document.getElementById('institutionsList');
    if (!container) {
        console.error('[Novo Cartão] Elemento institutionsList não encontrado');
        // Redirecionar diretamente se não conseguir mostrar a mensagem
        setTimeout(() => {
            const homeUrl = `../Home/home.html?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`;
            window.location.href = homeUrl;
        }, 1000);
        return;
    }
    
    container.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--cor-texto);">
            <div style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;">🔄</div>
            <h3 style="margin-bottom: 8px; color: var(--cor-texto);">Sessão expirou</h3>
            <p style="color: var(--cor-texto-secundario); margin-bottom: 20px;">
                Sua sessão Firebase expirou. Vamos renovar automaticamente.
            </p>
            <div style="margin-bottom: 20px;">
                <div style="width: 40px; height: 40px; border: 3px solid var(--cor-primaria); 
                           border-top: 3px solid transparent; border-radius: 50%; 
                           margin: 0 auto; animation: spin 1s linear infinite;"></div>
            </div>
            <p style="color: var(--cor-texto-secundario); font-size: 14px;">
                Redirecionando em 3 segundos...
            </p>
            <button onclick="(function(){ const homeUrl = '../Home/home.html?returnTo=' + encodeURIComponent(window.location.pathname + window.location.search); window.location.href = homeUrl; })()" 
                    style="background: var(--cor-primaria); color: white; border: none; 
                           padding: 12px 24px; border-radius: 8px; cursor: pointer;
                           font-weight: 500; margin-top: 16px;">
                Ir para Home Agora
            </button>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    
    // Auto-redirect após 3 segundos
    setTimeout(() => {
        const homeUrl = `../Home/home.html?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`;
        window.location.href = homeUrl;
    }, 3000);
}

// Mostrar mensagem de login quando necessário
function showLoginMessage() {
    const container = document.getElementById('institutionsList');
    container.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--cor-texto);">
            <div style="font-size: 3rem; margin-bottom: 16px; opacity: 0.5;">🔐</div>
            <h3 style="margin-bottom: 8px; color: var(--cor-texto);">Login necessário</h3>
            <p style="color: var(--cor-texto-secundario); margin-bottom: 20px;">
                Faça login para acessar suas contas e criar cartões.
            </p>
            <button onclick="(function(){ const loginUrl = '../Login/login.html?returnTo=' + encodeURIComponent(window.location.pathname + window.location.search); window.location.href = loginUrl; })()" 
                    style="background: var(--cor-primaria); color: white; border: none; 
                           padding: 12px 24px; border-radius: 8px; cursor: pointer;
                           font-weight: 500;">
                Fazer Login
            </button>
        </div>
    `;
}

// Mostrar mensagem quando não há contas
function showNoAccountsMessage() {
    const institutionsList = document.getElementById('institutionsList');
    if (institutionsList) {
        institutionsList.innerHTML = `
            <div class="no-accounts-message">
                <div style="text-align: center; padding: 40px 20px; color: var(--cor-texto-secundario);">
                    <div style="font-size: 3rem; margin-bottom: 16px;">🏦</div>
                    <h3 style="margin-bottom: 8px; color: var(--cor-texto);">Nenhuma conta encontrada</h3>
                    <p style="margin-bottom: 20px;">Você precisa criar uma conta bancária primeiro</p>
                    <button onclick="window.location.href='../Nova-conta/Nova-conta.html'" 
                            style="background: var(--cor-primaria); color: white; border: none; 
                                   padding: 12px 24px; border-radius: 8px; cursor: pointer;">
                        Criar Nova Conta
                    </button>
                </div>
            </div>
        `;
    }
}

// Mostrar mensagem para fazer login
function showLoginMessage() {
    const institutionsList = document.getElementById('institutionsList');
    if (institutionsList) {
        institutionsList.innerHTML = `
            <div class="login-message">
                <div style="text-align: center; padding: 40px 20px; color: var(--cor-texto-secundario);">
                    <div style="font-size: 3rem; margin-bottom: 16px;">🔐</div>
                    <h3 style="margin-bottom: 8px; color: var(--cor-texto);">Faça login para continuar</h3>
                    <p>Você precisa estar logado para criar cartões</p>
                </div>
            </div>
        `;
    }
}

// Funções da calculadora
function abrirCalculadora() {
    const calculadoraContainer = document.getElementById('calculadora-container');
    const calculadoraDisplay = document.getElementById('calculadora-display');
    const limitAmount = document.getElementById('limitAmount');
    
    calculadoraContainer.style.display = 'block';
    calculatorState.valorAtual = limitAmount.textContent.replace('R$ ', '').replace(/\./g, '').replace(',', '.');
    calculadoraDisplay.value = formatarValor(calculatorState.valorAtual);
    calculatorState.digitandoValor = false;
}

function fecharCalculadora() {
    const calculadoraContainer = document.getElementById('calculadora-container');
    calculadoraContainer.style.display = 'none';
}

function cancelarCalculadora() {
    fecharCalculadora();
}

function confirmarCalculadora() {
    const limitAmount = document.getElementById('limitAmount');
    const valorFormatado = formatarMoeda(calculatorState.valorAtual);
    limitAmount.textContent = `R$ ${valorFormatado}`;
    limitValue = parseFloat(calculatorState.valorAtual);
    fecharCalculadora();
}

function adicionarNumero(numero) {
    if (!calculatorState.digitandoValor) {
        calculatorState.valorAtual = '0';
        calculatorState.digitandoValor = true;
    }
    
    if (calculatorState.valorAtual === '0' && numero !== '.') {
        calculatorState.valorAtual = numero;
    } else {
        if (calculatorState.valorAtual.includes('.') && calculatorState.valorAtual.split('.')[1].length >= 2) {
            return;
        }
        calculatorState.valorAtual += numero;
    }
    
    const calculadoraDisplay = document.getElementById('calculadora-display');
    calculadoraDisplay.value = formatarValor(calculatorState.valorAtual);
}

function adicionarOperacao(operacao) {
    if (operacao === '.') {
        if (!calculatorState.valorAtual.includes('.')) {
            calculatorState.valorAtual += '.';
            calculatorState.digitandoValor = true;
        }
    }
    const calculadoraDisplay = document.getElementById('calculadora-display');
    calculadoraDisplay.value = formatarValor(calculatorState.valorAtual);
}

function apagarInput() {
    if (calculatorState.valorAtual.length > 1) {
        calculatorState.valorAtual = calculatorState.valorAtual.slice(0, -1);
    } else {
        calculatorState.valorAtual = '0';
        calculatorState.digitandoValor = false;
    }
    const calculadoraDisplay = document.getElementById('calculadora-display');
    calculadoraDisplay.value = formatarValor(calculatorState.valorAtual);
}

function formatarValor(valor) {
    if (valor.includes('.')) {
        const partes = valor.split('.');
        return `${partes[0]},${partes[1].substring(0, 2)}`;
    }
    return valor.replace('.', ',');
}

function formatarMoeda(valor) {
    const numero = parseFloat(valor);
    return numero.toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
}

function setupCalculator() {
    const calculadoraBotoes = document.querySelector('.calculadora-botoes');
    const botaoApagar = document.getElementById('botao-apagar');
    const botaoCancelar = document.querySelector('.btn-cancelar-calculadora');
    const botaoConfirmar = document.querySelector('.btn-confirmar-calculadora');
    
    if (calculadoraBotoes) {
        calculadoraBotoes.addEventListener('click', function(e) {
            if (e.target.tagName === 'BUTTON') {
                const valor = e.target.textContent;
                
                if (valor.match(/[0-9]/)) {
                    adicionarNumero(valor);
                } else if (valor === ',') {
                    adicionarOperacao('.');
                } else if (valor === '=') {
                    confirmarCalculadora();
                }
            }
        });
    }
    
    if (botaoApagar) botaoApagar.addEventListener('click', apagarInput);
    if (botaoCancelar) botaoCancelar.addEventListener('click', cancelarCalculadora);
    if (botaoConfirmar) botaoConfirmar.addEventListener('click', confirmarCalculadora);
}

// Funções do seletor de bandeiras
function setupBrandSelector() {
    renderBrandList();
    updateSelectedBrand();
}

function renderBrandList() {
    const listaBandeiras = document.getElementById('lista-bandeiras');
    if (!listaBandeiras) return;
    
    listaBandeiras.innerHTML = '';
    bandeiras.forEach(bandeira => {
        const item = document.createElement('div');
        item.className = 'bandeira-item';
        item.onclick = () => selectBrandHandler(bandeira);
        
        const iconeHTML = bandeira.type === 'image' 
            ? `<img src="${bandeira.icon}" alt="${bandeira.name}" style="width: 32px; height: 20px; object-fit: contain;">`
            : `<span style="color: ${bandeira.color}; font-weight: bold; font-size: 14px;">${bandeira.icon}</span>`;
        
        item.innerHTML = `
            <div class="bandeira-icone">
                ${iconeHTML}
            </div>
            <span class="bandeira-nome">${bandeira.name}</span>
        `;
        
        listaBandeiras.appendChild(item);
    });
}

function selectBrandHandler(bandeira) {
    selectedBrand = bandeira;
    updateSelectedBrand();
    closeBrandModal();
}

function updateSelectedBrand() {
    const selectedBrandIcon = document.getElementById('selectedBrandIcon');
    const selectedBrandName = document.getElementById('selectedBrandName');
    
    if (selectedBrandIcon && selectedBrandName) {
        const iconeHTML = selectedBrand.type === 'image' 
            ? `<img src="${selectedBrand.icon}" alt="${selectedBrand.name}" style="width: 32px; height: 20px; object-fit: contain;">`
            : `<span style="color: ${selectedBrand.color}; font-weight: bold; font-size: 14px;">${selectedBrand.icon}</span>`;
        
        selectedBrandIcon.innerHTML = iconeHTML;
        selectedBrandName.textContent = selectedBrand.name;
    }
}

function openBrandModal() {
    const modalBandeiras = document.getElementById('modal-bandeiras');
    if (modalBandeiras) {
        modalBandeiras.style.display = 'flex';
    }
}

function closeBrandModal() {
    const modalBandeiras = document.getElementById('modal-bandeiras');
    if (modalBandeiras) {
        modalBandeiras.style.display = 'none';
    }
}

// Event listeners para modal de bandeiras
document.addEventListener('DOMContentLoaded', function() {
    const fecharModalBandeiras = document.getElementById('fechar-modal-bandeiras');
    const modalBandeiras = document.getElementById('modal-bandeiras');
    
    if (fecharModalBandeiras) {
        fecharModalBandeiras.addEventListener('click', closeBrandModal);
    }
    
    if (modalBandeiras) {
        modalBandeiras.addEventListener('click', function(e) {
            if (e.target === modalBandeiras) {
                closeBrandModal();
            }
        });
    }
});

// Renderizar lista de contas do usuário
function renderInstitutions() {
    const institutionsList = document.getElementById('institutionsList');
    if (!institutionsList) return;
    
    institutionsList.innerHTML = '';
    
    if (filteredInstitutions.length === 0) {
        institutionsList.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--cor-texto-secundario);">
                Nenhuma conta encontrada com esse nome
            </div>
        `;
        return;
    }
    
    filteredInstitutions.forEach(conta => {
        const item = document.createElement('div');
        item.className = 'institution-item';
        item.onclick = () => selectInstitutionHandler(conta);
        
        // Usar os dados reais da conta
        const svgIcon = conta.icone || '../Icon/banco-do-brasil.svg';
        const corFundo = conta.cor || '#e8f5ee';
        const nomeConta = conta.nome || conta.descricao || 'Conta sem nome';
        const tipoConta = conta.tipo || 'Conta';
        
        item.innerHTML = `
            <div class="institution-icons">
                <div class="circulo-icone-conta" style="
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: ${corFundo};
                    margin-right: 0;
                    border: 2px solid var(--cor-card);
                    box-shadow: var(--sombra);
                ">
                    <img src="${svgIcon}" alt="${nomeConta}" style="width: 22px; height: 22px; object-fit: contain;">
                </div>
            </div>
            <span class="institution-name">${nomeConta}</span>
            <span class="arrow">›</span>
        `;
        
        institutionsList.appendChild(item);
    });
}

// Configurar busca
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        filteredInstitutions = userAccounts.filter(conta => {
            const nome = (conta.nome || conta.descricao || '').toLowerCase();
            const banco = (conta.banco || '').toLowerCase();
            const tipo = (conta.tipo || '').toLowerCase();
            
            return nome.includes(searchTerm) || 
                   banco.includes(searchTerm) || 
                   tipo.includes(searchTerm);
        });
        renderInstitutions();
    });
}

// Selecionar conta do usuário
function selectInstitutionHandler(conta) {
    console.log('[Novo Cartão] Conta selecionada:', conta);
    selectedInstitution = conta;
    showCardForm();
}

// Mostrar formulário do cartão
function showCardForm() {
    document.getElementById('selectInstitutionPage').style.display = 'none';
    document.getElementById('cardFormPage').style.display = 'block';
    
    if (selectedInstitution) {
        updateSelectedInstitution();
    }
}

// Atualizar conta selecionada no formulário
function updateSelectedInstitution() {
    const institutionInfo = document.getElementById('selectedInstitutionInfo');
    if (!institutionInfo || !selectedInstitution) return;
    
    const svgIcon = selectedInstitution.icone || '../Icon/banco-do-brasil.svg';
    const corFundo = selectedInstitution.cor || '#e8f5ee';
    const nomeConta = selectedInstitution.nome || selectedInstitution.descricao || 'Conta sem nome';
    const tipoConta = selectedInstitution.tipo || 'Conta';
    
    institutionInfo.innerHTML = `
        <div class="circulo-icone-conta" style="
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: ${corFundo};
            margin-right: 12px;
            border: 2px solid var(--cor-primaria);
        ">
            <img src="${svgIcon}" alt="${nomeConta}" style="width: 18px; height: 18px; object-fit: contain;">
        </div>
        <span>${nomeConta}</span>
    `;
}

// Navegar de volta para lista de instituições
function goBackToInstitutions() {
    document.getElementById('cardFormPage').style.display = 'none';
    document.getElementById('selectInstitutionPage').style.display = 'block';
}

// Voltar (sair da tela)
// Função para voltar
function goBack() {
    // Navegar para a página Home
    window.location.href = '../Home/home.html';
}

// Selecionar bandeira do cartão
function selectBrand() {
    openBrandModal();
}

// Selecionar instituição (no formulário)
function selectInstitution() {
    goBackToInstitutions();
}

// Salvar cartão
function saveCard() {
    const description = document.getElementById('description').value;
    const closeDay = document.getElementById('closeDay').value;
    const dueDay = document.getElementById('dueDay').value;
    
    // Validações
    if (!selectedInstitution) {
        alert('Por favor, selecione uma conta bancária');
        return;
    }
    
    if (!description.trim()) {
        alert('Por favor, insira uma descrição para o cartão');
        return;
    }
    
    const cardData = {
        institution: selectedInstitution,
        description: description.trim(),
        brand: selectedBrand,
        closeDay: parseInt(closeDay),
        dueDay: parseInt(dueDay),
        limit: limitValue,
        createdAt: new Date().toISOString()
    };
    
    console.log('Salvando cartão:', cardData);
    
    // Salvar apenas no Firebase
    if (db && auth && auth.currentUser) {
        const cardFirestore = { ...cardData, userId: auth.currentUser.uid };
        db.collection('cartoes').add(cardFirestore)
            .then(() => {
                console.log('Cartão salvo no Firestore!');
                showSuccessMessage('Cartão salvo com sucesso!');
                resetForm();
                // Voltar para a Home para visualizar o cartão na lista
                setTimeout(() => {
                    window.location.href = '../Home/home.html';
                }, 800);
            })
            .catch(error => {
                console.error('Erro ao salvar cartão:', error);
                alert('Erro ao salvar cartão. Verifique sua conexão e tente novamente.');
            });
    } else {
        alert('Erro: Usuário não autenticado. Faça login e tente novamente.');
    }
}

// Mostrar mensagem de sucesso
function showSuccessMessage(message) {
    // Criar ou mostrar popup de sucesso
    let popup = document.getElementById('success-popup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'success-popup';
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--cor-card);
            padding: 20px 30px;
            border-radius: 12px;
            box-shadow: var(--sombra-elevada);
            z-index: 3000;
            text-align: center;
            color: var(--cor-texto);
            font-family: 'Poppins', sans-serif;
            border: 2px solid var(--cor-primaria);
        `;
        document.body.appendChild(popup);
    }
    
    popup.innerHTML = `
        <div style="color: var(--cor-primaria); font-size: 2rem; margin-bottom: 10px;">✓</div>
        <div style="font-weight: 600; margin-bottom: 15px;">${message}</div>
        <button onclick="this.parentElement.style.display='none'" 
                style="background: var(--cor-primaria); color: white; border: none; 
                       padding: 8px 20px; border-radius: 6px; cursor: pointer;">
            OK
        </button>
    `;
    
    popup.style.display = 'block';
    
    // Auto-hide após 3 segundos
    setTimeout(() => {
        if (popup && popup.style.display !== 'none') {
            popup.style.display = 'none';
        }
    }, 3000);
}

// Resetar formulário após salvar
function resetForm() {
    document.getElementById('description').value = '';
    document.getElementById('closeDay').value = '1';
    document.getElementById('dueDay').value = '5';
    document.getElementById('limitAmount').textContent = 'R$ 0,00';
    
    selectedInstitution = null;
    limitValue = 0;
    
    // Voltar para tela de seleção de conta
    setTimeout(() => {
        goBackToInstitutions();
    }, 2000);
}

// Atualizar limite do cartão (se necessário)
function updateLimit(value) {
    const limitAmount = document.getElementById('limitAmount');
    const formattedValue = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
    
    limitAmount.textContent = formattedValue;
}
