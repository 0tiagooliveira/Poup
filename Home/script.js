// VariÃ¡veis globais do Firebase e autenticaÃ§Ã£o
let firebaseApp, auth, googleProvider;
let usuarioJaAutenticado = false;
let usuario = null;
let db = null; // Firestore database

// Mapeamento de categorias para Ã­cones
const categoriaParaIcone = {
    // Receitas
    'SalÃ¡rio': 'paid',
    'Freelancer': 'business_center',
    'Freelance': 'business_center',
    'Investimentos': 'trending_up',
    'Vendas': 'point_of_sale',
    'Venda de co...': 'point_of_sale', // Para "Venda de co..." no print
    'Dividendos': 'account_balance',
    'Rendimento': 'savings',
    'Outras': 'attach_money',
    
    // Despesas
    'AlimentaÃ§Ã£o': 'restaurant',
    'Transporte': 'local_gas_station',
    'Uber': 'local_taxi',
    'Churrasco': 'restaurant',
    'Moradia': 'home',
    'SaÃºde': 'local_hospital',
    'EducaÃ§Ã£o': 'school',
    'Lazer': 'sports_esports',
    'VestuÃ¡rio': 'checkroom',
    'Contas de Casa': 'electric_bolt',
    'Outros': 'shopping_cart'
};

// FunÃ§Ã£o para obter Ã­cone baseado na categoria
function obterIconePorCategoria(categoria, tipoTransacao) {
    if (categoriaParaIcone[categoria]) {
        return categoriaParaIcone[categoria];
    }
    // Fallback baseado no tipo
    return tipoTransacao === 'receita' ? 'savings' : 'shopping_cart';
}

// Configurar menu adicionar
function configurarMenuAdicionar() {
    const botaoAdicionarMenu = document.getElementById('botao-adicionar-home');
    const menuAdicionar = document.getElementById('menu-adicionar-home');
    
    if (botaoAdicionarMenu && menuAdicionar) {
        botaoAdicionarMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = menuAdicionar.style.display === 'block';
            menuAdicionar.style.display = isVisible ? 'none' : 'block';
        });
        
        // Fechar menu ao clicar fora
        document.addEventListener('click', (e) => {
            if (menuAdicionar && 
                !botaoAdicionarMenu?.contains(e.target) && 
                !menuAdicionar.contains(e.target)) {
                menuAdicionar.style.display = 'none';
            }
        });
    }
}

// Mapeamento de bancos para Ã­cones SVG
const bancosIcones = {
    'Nubank': '../Icon/Nubank.svg',
    'Banco do Brasil': '../Icon/banco-do-brasil.svg',
    'Bradesco': '../Icon/bradesco.svg',
    'ItaÃº': '../Icon/itau.svg',
    'Santander': '../Icon/santander.svg',
    'Caixa': '../Icon/caixa.svg',
    'PicPay': '../Icon/picpay.svg'
};

// Mapeamento de bancos para variÃ¡veis de cor e fallback hex (para uso consistente na Home)
const bancosCores = [
    { chave: 'nubank', var: '--nubank', hex: '#820ad1' },
    { chave: 'itaÃº', var: '--itau', hex: '#EC7000' },
    { chave: 'itau', var: '--itau', hex: '#EC7000' },
    { chave: 'bradesco', var: '--bradesco', hex: '#CC092F' },
    { chave: 'santander', var: '--santander', hex: '#EC0000' },
    { chave: 'caixa', var: '--caixa', hex: '#0070AF' },
    { chave: 'banco do brasil', var: '--banco-brasil', hex: '#FFEF38' },
    { chave: 'bb', var: '--banco-brasil', hex: '#FFEF38' },
    { chave: 'picpay', var: '--picpay', hex: '#21C25E' },
    { chave: 'carteira', var: '--carteira', hex: '#4CAF50' }
];

function getCorConta(conta) {
    if (!conta) return 'var(--outros, #6B7280)';
    // Campos possÃ­veis onde a "marca" do banco pode aparecer
    const candidatos = [
        conta.banco,
        conta.nome,
        conta.descricao,
        conta.instituicao,
        conta.iconeBanco,
    ].filter(Boolean).map(c => String(c).toLowerCase());

    // Checar tambÃ©m se Ã­cone SVG contÃ©m nome do banco
    if (conta.icone && /nubank|itau|itaÃº|bradesco|santander|caixa|picpay|banco-do-brasil|bb|carteira/i.test(conta.icone)) {
        candidatos.push(conta.icone.toLowerCase());
    }

    for (const item of bancosCores) {
        if (candidatos.some(txt => txt.includes(item.chave))) {
            const corFinal = `var(${item.var}, ${item.hex})`;
            // Debug (pode remover depois)
            console.debug('[getCorConta] Match', item.chave, '->', corFinal, 'para conta', conta.id || conta.nome);
            return corFinal;
        }
    }
    // Se a conta tiver cor personalizada salva, usa
    if (conta.cor) {
        console.debug('[getCorConta] Usando cor personalizada da conta', conta.id, conta.cor);
        return conta.cor;
    }
    // Fallback final neutro
    console.debug('[getCorConta] Nenhum match encontrado. Fallback --outros. Conta:', conta.id || conta.nome);
    return 'var(--outros, #6B7280)';
}

// FunÃ§Ã£o para obter Ã­cone do banco
function obterIconeBanco(conta) {
    // Se o Ã­cone jÃ¡ Ã© um SVG path, retorna ele mesmo
    if (conta.icone && conta.icone.includes('.svg')) {
        return conta.icone;
    }
    
    // Se tem o campo banco definido, usa o mapeamento
    if (conta.banco && bancosIcones[conta.banco]) {
        return bancosIcones[conta.banco];
    }
    
    // Fallback para Ã­cone material
    return null;
}

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
        }
        auth = firebase.auth();
        db = firebase.firestore(); // Inicializar Firestore globalmente
        googleProvider = new firebase.auth.GoogleAuthProvider();
    }
})();

// Sistema de autenticaÃ§Ã£o simplificado com token
function salvarTokenUsuario(usuario) {
    // Usar displayName se disponÃ­vel, senÃ£o extrair nome do email (antes do @)
    let nomeExibicao = usuario.displayName;
    if (!nomeExibicao && usuario.email) {
        nomeExibicao = usuario.email.split('@')[0];
        // Capitalizar primeira letra se necessÃ¡rio
        nomeExibicao = nomeExibicao.charAt(0).toUpperCase() + nomeExibicao.slice(1);
    }
    
    const dadosUsuario = {
        uid: usuario.uid,
        email: usuario.email,
        nome: nomeExibicao || 'UsuÃ¡rio',
        timestamp: Date.now()
    };
    localStorage.setItem('tokenUsuarioPoup', JSON.stringify(dadosUsuario));
}

function obterTokenUsuario() {
    try {
        const token = localStorage.getItem('tokenUsuarioPoup');
        if (token) {
            const dadosUsuario = JSON.parse(token);
            // Verificar se o token nÃ£o estÃ¡ expirado (24 horas)
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
        console.error('[AUTH] Erro ao ler token:', error);
        localStorage.removeItem('tokenUsuarioPoup');
        return null;
    }
}

// ===== FUNÃ‡Ã•ES GLOBAIS DE POPUP =====

// VariÃ¡vel global para controlar exclusÃ£o de conta
let contaParaExcluirId = null;

// FunÃ§Ã£o global para mostrar popup de exclusÃ£o de conta
window.mostrarPopupExcluirConta = function(contaId, mensagem) {
    contaParaExcluirId = contaId;
    const popupExcluirContaCustom = document.getElementById('popup-excluir-conta-custom');
    const popupExcluirContaMsg = document.getElementById('popup-excluir-conta-msg');
    
    if (popupExcluirContaMsg && popupExcluirContaCustom) {
        popupExcluirContaMsg.textContent = mensagem;
        popupExcluirContaCustom.style.display = 'flex';
    }
};

// FunÃ§Ã£o global para fechar popup de exclusÃ£o de conta
window.fecharPopupExcluirConta = function() {
    console.log('Fechando popup de exclusÃ£o...');
    const popupExcluirContaCustom = document.getElementById('popup-excluir-conta-custom');
    if (popupExcluirContaCustom) {
        popupExcluirContaCustom.style.display = 'none';
        console.log('Popup fechado com sucesso');
    } else {
        console.error('Elemento popup nÃ£o encontrado!');
    }
    contaParaExcluirId = null;
};

// FunÃ§Ã£o global para confirmar exclusÃ£o de conta
window.confirmarExclusaoConta = function() {
    if (contaParaExcluirId) {
        excluirConta(contaParaExcluirId);
        window.fecharPopupExcluirConta();
    }
};

function limparTokenUsuario() {
    localStorage.removeItem('tokenUsuarioPoup');
}

// FunÃ§Ãµes de cache local para trabalhar offline
function salvarContaNoCache(conta) {
    try {
        const chave = `conta_${conta.id}`;
        localStorage.setItem(chave, JSON.stringify(conta));
    } catch (error) {
        console.warn('[Cache] Erro ao salvar conta:', error);
    }
}

function buscarContaNoCacheLocal(contaId) {
    try {
        const chave = `conta_${contaId}`;
        const contaStr = localStorage.getItem(chave);
        return contaStr ? JSON.parse(contaStr) : null;
    } catch (error) {
        console.warn('[Cache] Erro ao buscar conta:', error);
        return null;
    }
}

// FunÃ§Ã£o para configurar event listeners dos modais
function configurarEventListenersModais() {
    console.log('Configurando event listeners dos modais...');
    
    // Usar event delegation no document para garantir que funcione
    document.addEventListener('click', function(e) {
        // BotÃ£o "NÃ£o"
        if (e.target && e.target.id === 'popup-excluir-conta-nao') {
            e.preventDefault();
            e.stopPropagation();
            console.log('BotÃ£o NÃ£o clicado via delegation!');
            window.fecharPopupExcluirConta();
            return;
        }
        
        // BotÃ£o "Sim"
        if (e.target && e.target.id === 'popup-excluir-conta-sim') {
            e.preventDefault();
            e.stopPropagation();
            console.log('BotÃ£o Sim clicado via delegation!');
            if (contaParaExcluirId) {
                excluirConta(contaParaExcluirId);
            }
            window.fecharPopupExcluirConta();
            return;
        }
    });
    
    console.log('Event delegation configurado!');
}

// FunÃ§Ã£o para excluir a conta
function excluirConta(contaId) {
    console.log('Excluindo conta com ID:', contaId);
    
    // Verificar se Firebase estÃ¡ disponÃ­vel
    if (!firebase || !firebase.firestore) {
        console.error('Firebase nÃ£o estÃ¡ disponÃ­vel');
        mostrarToast('Erro: Firebase nÃ£o disponÃ­vel', '#ef233c');
        return;
    }
    
    const db = firebase.firestore();
    db.collection('contas').doc(contaId).delete()
        .then(() => {
            console.log('Conta excluÃ­da com sucesso!');
            mostrarToast('Conta excluÃ­da!');
            if (auth && auth.currentUser) {
                carregarContasHome(auth.currentUser.uid);
            }
        })
        .catch(error => {
            console.error('Erro ao excluir conta:', error);
            mostrarToast('Erro ao excluir conta', '#ef233c');
        });
}

// FunÃ§Ã£o para verificar se notificaÃ§Ãµes foram limpas recentemente
function verificarStatusNotificacoes() {
    const timestampLimpeza = localStorage.getItem('notificacoesLimpasEm');
    
    if (timestampLimpeza) {
        const agora = Date.now();
        const tempoDecorrido = agora - parseInt(timestampLimpeza);
        const umaHora = 3600000; // 1 hora em millisegundos
        
        if (tempoDecorrido < umaHora) {
            // Ainda dentro do perÃ­odo de 1 hora, manter bloqueadas
            window.notificacoesLimpas = true;
            const minutos = Math.ceil((umaHora - tempoDecorrido) / 60000);
            console.log(`NotificaÃ§Ãµes ainda bloqueadas por mais ${minutos} minutos`);
        } else {
            // Passou de 1 hora, reabilitar
            window.notificacoesLimpas = false;
            localStorage.removeItem('notificacoesLimpasEm');
            console.log('PerÃ­odo de 1 hora expirado, notificaÃ§Ãµes reabilitadas');
        }
    } else {
        window.notificacoesLimpas = false;
    }
}

// InicializaÃ§Ã£o principal com controle total
document.addEventListener('DOMContentLoaded', function() {
    mostrarCarregamento();
    console.log('[INIT] Verificando autenticaÃ§Ã£o...');
    
    // Verificar se notificaÃ§Ãµes foram limpas recentemente
    verificarStatusNotificacoes();
    
    // Configurar event listeners dos modais imediatamente
    configurarEventListenersModais();
    
    // Configurar menu adicionar
    configurarMenuAdicionar();
    
    // Configurar listeners para mudanÃ§as no avatar
    configurarListenersAvatar();
    
    // Primeiro, verificar se hÃ¡ token vÃ¡lido
    const tokenUsuario = obterTokenUsuario();
    
    if (tokenUsuario) {
        // Token existe, mas ainda precisa da autenticaÃ§Ã£o Firebase para Firestore
        console.log('[AUTH] Token encontrado, aguardando Firebase...');
        
        auth.onAuthStateChanged(user => {
            const containerApp = document.querySelector('.container-app');
            if (user) {
                usuario = user; // Definir variÃ¡vel global
                usuarioJaAutenticado = true;
                salvarTokenUsuario(user); // Atualizar token
                setTimeout(() => {
                    esconderCarregamento();
                    if (containerApp) containerApp.style.display = 'block';
                }, 350);
                inicializarComponentes(user);
            } else {
                // Token invÃ¡lido, limpar e redirecionar
                console.log('[AUTH] Token invÃ¡lido, redirecionando...');
                limparTokenUsuario();
                window.location.href = '../index.html';
            }
        });
        
        // Timeout para Firebase
        setTimeout(() => {
            if (!usuario || !usuarioJaAutenticado) {
                console.log('[AUTH] Timeout do Firebase, redirecionando...');
                limparTokenUsuario();
                window.location.href = '../index.html';
            }
        }, 5000);
        
        return;
    }
    
    // SÃ³ usar Firebase se nÃ£o hÃ¡ token
    if (auth) {
        console.log('[AUTH] Verificando Firebase...');
        auth.onAuthStateChanged(user => {
            const containerApp = document.querySelector('.container-app');
            if (user) {
                usuario = user; // Definir variÃ¡vel global
                usuarioJaAutenticado = true;
                salvarTokenUsuario(user);
                setTimeout(() => {
                    esconderCarregamento();
                    if (containerApp) containerApp.style.display = 'block';
                }, 350);
                inicializarComponentes(user);
            } else {
                console.log('[AUTH] Redirecionando para login...');
                esconderCarregamento();
                window.location.href = '../index.html';
            }
        });
    } else {
        esconderCarregamento();
        alert('Erro ao carregar Firebase. Verifique sua configuraÃ§Ã£o.');
    }

    // Clique nos cartÃµes de receitas/despesas (cartÃ£o-lista-ux)
    document.querySelectorAll('.cartao-receitas.cartao-lista-ux').forEach(card => {
        card.addEventListener('click', function(e) {
            // Evita navegaÃ§Ã£o se clicar em botÃ£o interno
            if (!e.target.classList.contains('botao-mini-ux')) {
                window.location.href = '../Lista-de-receitas/Lista-de-receitas.html';
            }
        });
    });
    document.querySelectorAll('.cartao-despesas.cartao-lista-ux').forEach(card => {
        card.addEventListener('click', function(e) {
            if (!e.target.classList.contains('botao-mini-ux')) {
                window.location.href = '../Lista-de-despesas/Lista-de-despesas.html';
            }
        });
    });
});

// VariÃ¡veis globais para mÃªs/ano selecionado
let mesSelecionado, anoSelecionado;
(function setMesAnoInicial() {
    const hoje = new Date();
    mesSelecionado = hoje.getMonth();
    anoSelecionado = hoje.getFullYear();
})();

// FunÃ§Ã£o para atualizar o seletor de mÃªs
function atualizarSeletorMes() {
    const seletorMes = document.querySelector('.seletor-mes');
    if (!seletorMes) return;
    seletorMes.selectedIndex = mesSelecionado;
}

// FunÃ§Ã£o para atualizar saldo ao trocar mÃªs
async function atualizarSaldoMes(uid) {
    console.log(`[Home] Atualizando dados para o mÃªs ${mesSelecionado+1}/${anoSelecionado}`);
    await calcularSaldoTotalMesAtual(uid);
    calcularValorTotalReceitas(uid);
    calcularValorTotalDespesas(uid);
    
    // Atualizar tambÃ©m os grÃ¡ficos e listas
    carregarResumoReceitas(uid);
    carregarReceitasHome(uid);
    carregarDespesasHome(uid);
}

// FunÃ§Ã£o principal de inicializaÃ§Ã£o dos componentes da Home
async function inicializarComponentes(user) {
    console.log('Inicializando componentes para o usuÃ¡rio:', user.uid);

    const elementos = {
        avatarUsuarioBtn: document.getElementById('avatar-usuario-btn'),
        menuUsuario: document.getElementById('menu-usuario'),
        sairBtn: document.getElementById('sair-btn'),
        nomeUsuario: document.querySelector('.nome-usuario'),
    };

    // Carregar nome e avatar das configuraÃ§Ãµes
    carregarDadosPerfilHome(elementos.nomeUsuario);
    
    if (elementos.nomeUsuario) {
        // Usar displayName se disponÃ­vel, senÃ£o extrair nome do email (antes do @)
        let nomeExibicao = user.displayName;
        if (!nomeExibicao && user.email) {
            nomeExibicao = user.email.split('@')[0];
            // Capitalizar primeira letra se necessÃ¡rio
            nomeExibicao = nomeExibicao.charAt(0).toUpperCase() + nomeExibicao.slice(1);
        }
        elementos.nomeUsuario.textContent = nomeExibicao || 'UsuÃ¡rio';
    }

    configurarEventos(elementos);
    atualizarSeletorMes(); // Definir mÃªs atual no seletor
    carregarDadosDaHome(user.uid);
    
    // Configurar event listeners dos modais
    configurarEventListenersModais();

    // Inicializar sistema de notificaÃ§Ãµes
    inicializarNotificacoes();

    // Calcular saldo total do mÃªs atual - aguardar resultado
    console.log('[INIT] Executando calcularSaldoTotalMesAtual na inicializaÃ§Ã£o...');
    await calcularSaldoTotalMesAtual(user.uid);
    calcularValorTotalReceitas(user.uid);
    calcularValorTotalDespesas(user.uid);
}

// FunÃ§Ã£o para carregar dados do perfil (nome e avatar) salvos nas ConfiguraÃ§Ãµes
function carregarDadosPerfilHome(nomeElement) {
    try {
        console.log('[Home] Carregando dados do perfil...');
        
        // Carregar nome do usuÃ¡rio
        const dadosUsuario = localStorage.getItem('dadosUsuario');
        if (dadosUsuario) {
            const dados = JSON.parse(dadosUsuario);
            if (nomeElement && dados.nome) {
                nomeElement.textContent = dados.nome;
                console.log('[Home] Nome carregado:', dados.nome);
            }
        }
        
        // Carregar avatar do usuÃ¡rio
        carregarAvatarUsuario();
        
        console.log('[Home] âœ… Dados do perfil carregados com sucesso');
    } catch (error) {
        console.error('[Home] Erro ao carregar dados do perfil:', error);
    }
}

// FunÃ§Ã£o especÃ­fica para carregar avatar do usuÃ¡rio
function carregarAvatarUsuario() {
    const avatarContainer = document.querySelector('.avatar-usuario');
    if (!avatarContainer) return;
    
    // Primeiro, verificar localStorage
    const avatarSalvo = localStorage.getItem('avatarUsuario');
    
    if (avatarSalvo) {
        mostrarAvatarUsuario(avatarSalvo);
    } else {
        // Se nÃ£o hÃ¡ no localStorage, buscar no Firestore
        const user = auth.currentUser;
        if (user && user.uid) {
            db.collection('users').doc(user.uid).get()
                .then(doc => {
                    if (doc.exists) {
                        const userData = doc.data();
                        if (userData.fotoPerfilURL) {
                            localStorage.setItem('avatarUsuario', userData.fotoPerfilURL);
                            mostrarAvatarUsuario(userData.fotoPerfilURL);
                        }
                    }
                })
                .catch(error => {
                    console.error('[Home] Erro ao carregar avatar do Firestore:', error);
                });
        }
    }
}

// FunÃ§Ã£o para mostrar avatar na interface
function mostrarAvatarUsuario(avatarURL) {
    const avatarContainer = document.querySelector('.avatar-usuario');
    if (!avatarContainer || !avatarURL) return;
    
    // Remove o Ã­cone padrÃ£o
    const iconePadrao = avatarContainer.querySelector('.material-icons-round');
    if (iconePadrao) {
        iconePadrao.remove();
    }
    
    // Adiciona ou atualiza a imagem
    let avatarImg = avatarContainer.querySelector('img');
    if (!avatarImg) {
        avatarImg = document.createElement('img');
        avatarImg.style.width = '100%';
        avatarImg.style.height = '100%';
        avatarImg.style.objectFit = 'cover';
        avatarImg.style.borderRadius = '50%';
        avatarContainer.appendChild(avatarImg);
    }
    avatarImg.src = avatarURL;
    console.log('[Home] Avatar carregado');
}

// FunÃ§Ã£o para remover avatar e mostrar Ã­cone padrÃ£o
function removerAvatarUsuario() {
    const avatarContainer = document.querySelector('.avatar-usuario');
    if (!avatarContainer) return;
    
    // Remove a imagem
    const avatarImg = avatarContainer.querySelector('img');
    if (avatarImg) {
        avatarImg.remove();
    }
    
    // Adiciona Ã­cone padrÃ£o se nÃ£o existir
    if (!avatarContainer.querySelector('.material-icons-round')) {
        const iconePadrao = document.createElement('span');
        iconePadrao.className = 'material-icons-round';
        iconePadrao.textContent = 'account_circle';
        avatarContainer.appendChild(iconePadrao);
    }
}

// Configurar listeners para mudanÃ§as no avatar
function configurarListenersAvatar() {
    // Listener para eventos customizados de outras pÃ¡ginas
    window.addEventListener('avatarAtualizado', function(event) {
        console.log('[Home] Avatar atualizado via evento:', event.detail);
        const fotoURL = event.detail.fotoURL;
        
        if (fotoURL) {
            mostrarAvatarUsuario(fotoURL);
        } else {
            removerAvatarUsuario();
            localStorage.removeItem('avatarUsuario');
        }
    });
    
    // Listener para mudanÃ§as no localStorage (outras abas)
    window.addEventListener('storage', function(event) {
        if (event.key === 'avatarUsuario') {
            console.log('[Home] Avatar atualizado via localStorage');
            if (event.newValue) {
                mostrarAvatarUsuario(event.newValue);
            } else {
                removerAvatarUsuario();
            }
        }
    });
}

// Configura eventos de clique e interaÃ§Ã£o da Home
function configurarEventos(elementos) {
    console.log('Configurando eventos de clique...');
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
            limparTokenUsuario(); // Limpar token local
            auth.signOut().then(() => {
                console.log('[AUTH] UsuÃ¡rio deslogado com sucesso.');
                window.location.href = '../index.html';
            }).catch(error => {
                console.error('[AUTH] Erro ao fazer logout:', error);
                // Mesmo com erro no Firebase, limpar token e redirecionar
                window.location.href = '../index.html';
            });
        });
    }
    
    // Configurar botÃ£o de configuraÃ§Ãµes do menu do usuÃ¡rio
    const configUsuarioBtn = document.getElementById('config-usuario-btn');
    if (configUsuarioBtn) {
        configUsuarioBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Redirecionando para ConfiguraÃ§Ãµes...');
            window.location.href = '../Configuracoes/Configuracoes.html';
        });
    }
    
    // Configurar item de navegaÃ§Ã£o de configuraÃ§Ãµes
    const navegacaoSettings = document.querySelector('.item-navegacao[href="#"]:last-child');
    if (navegacaoSettings && navegacaoSettings.textContent.includes('ConfiguraÃ§Ãµes')) {
        navegacaoSettings.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Redirecionando para ConfiguraÃ§Ãµes via navegaÃ§Ã£o...');
            window.location.href = '../ConfiguraÃ§Ãµes/Configuracoes.html';
        });
        // Remover o href="#" e adicionar um href real
        navegacaoSettings.href = '../ConfiguraÃ§Ãµes/Configuracoes.html';
    }
    
    document.addEventListener('click', function(e) {
        if (elementos.menuUsuario && !elementos.menuUsuario.contains(e.target) && !elementos.avatarUsuarioBtn.contains(e.target)) {
            elementos.menuUsuario.classList.remove('mostrar');
        }
    });

    // Filtros dos grÃ¡ficos (exemplo)
    document.querySelectorAll('.botao-filtro-receita').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.botao-filtro-receita').forEach(b => b.classList.remove('ativo'));
            this.classList.add('ativo');
            // Chame funÃ§Ã£o para filtrar receitas por perÃ­odo/categoria se desejar
        });
    });

    // Configurar botÃµes de navegaÃ§Ã£o de mÃªs
    const btnAnterior = document.querySelector('.botao-mes.anterior');
    const btnProximo = document.querySelector('.botao-mes.proximo');
    const seletorMes = document.querySelector('.seletor-mes');
    
    if (btnAnterior) {
        btnAnterior.addEventListener('click', function() {
            mesSelecionado--;
            if (mesSelecionado < 0) {
                mesSelecionado = 11;
                anoSelecionado--;
            }
            atualizarSeletorMes();
            if (auth.currentUser) atualizarSaldoMes(auth.currentUser.uid);
        });
        console.log('[Home] BotÃ£o anterior configurado');
    } else {
        console.error('[Home] BotÃ£o anterior nÃ£o encontrado');
    }
    
    if (btnProximo) {
        btnProximo.addEventListener('click', function() {
            mesSelecionado++;
            if (mesSelecionado > 11) {
                mesSelecionado = 0;
                anoSelecionado++;
            }
            atualizarSeletorMes();
            if (auth.currentUser) atualizarSaldoMes(auth.currentUser.uid);
        });
        console.log('[Home] BotÃ£o prÃ³ximo configurado');
    } else {
        console.error('[Home] BotÃ£o prÃ³ximo nÃ£o encontrado');
    }

    // Seletor de mÃªs
    if (seletorMes) {
        seletorMes.addEventListener('change', function() {
            mesSelecionado = this.selectedIndex;
            if (auth.currentUser) atualizarSaldoMes(auth.currentUser.uid);
        });
        console.log('[Home] Seletor de mÃªs configurado');
    } else {
        console.error('[Home] Seletor de mÃªs nÃ£o encontrado');
    }
    document.querySelectorAll('.botao-filtro').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.botao-filtro').forEach(b => b.classList.remove('ativo'));
            this.classList.add('ativo');
            // Chame funÃ§Ã£o para filtrar despesas por perÃ­odo/categoria se desejar
        });
    });
}

// Carrega todos os dados necessÃ¡rios para a Home
function carregarDadosDaHome(userId) {
    console.log(`Buscando dados da home para o usuÃ¡rio: ${userId}`);
    carregarContasHome(userId);
    carregarResumoReceitas(userId);
    carregarReceitasHome(userId);
    carregarDespesasHome(userId);
    carregarCartoesCreditoHome(userId);
}

// Carregar notificaÃ§Ãµes para todas as receitas e despesas existentes
async function carregarNotificacoesTransacoes(userId) {
    if (!window.notificacoesManager) {
        console.log('Sistema de notificaÃ§Ãµes nÃ£o disponÃ­vel');
        return;
    }
    
    // Verificar se jÃ¡ carregou notificaÃ§Ãµes nesta sessÃ£o OU se foram limpas pelo usuÃ¡rio
    if (sessionStorage.getItem('notificacoesCarregadas') && !window.notificacoesLimpas) {
        console.log('NotificaÃ§Ãµes jÃ¡ foram carregadas nesta sessÃ£o');
        return;
    }
    
    // Se as notificaÃ§Ãµes foram limpas, nÃ£o carregar novamente
    if (window.notificacoesLimpas) {
        console.log('NotificaÃ§Ãµes foram limpas pelo usuÃ¡rio, nÃ£o recarregando');
        return;
    }
    
    try {
        const db = firebase.firestore();
        const mesAtual = new Date().getMonth();
        const anoAtual = new Date().getFullYear();
        
        let totalNotificacoes = 0;
        
        // Carregar receitas do mÃªs atual
        const receitasSnapshot = await db.collection('receitas')
            .where('userId', '==', userId)
            .get();
        
        receitasSnapshot.forEach(doc => {
            const receita = { id: doc.id, ...doc.data() };
            
            // Verificar se Ã© do mÃªs atual
            if (isDataNoMesSelecionado(receita.data, mesAtual, anoAtual)) {
                const valor = parseValueToNumber(receita.valor || '0');
                const formatCurrency = (val) => {
                    return new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                    }).format(val);
                };
                
                const status = receita.recebido || receita.pago || receita.concluida ? 'âœ…' : 'â³';
                
                window.notificacoesManager.criarNotificacao({
                    tipo: 'receita_existente',
                    titulo: `${status} Receita registrada`,
                    descricao: `${receita.descricao || 'Receita'} - ${formatCurrency(valor)}`,
                    icone: 'trending_up',
                    dados: { receitaId: receita.id, tipo: 'receita' }
                });
                totalNotificacoes++;
            }
        });
        
        // Carregar despesas do mÃªs atual
        const despesasSnapshot = await db.collection('despesas')
            .where('userId', '==', userId)
            .get();
        
        despesasSnapshot.forEach(doc => {
            const despesa = { id: doc.id, ...doc.data() };
            
            // Verificar se Ã© do mÃªs atual
            if (isDataNoMesSelecionado(despesa.data, mesAtual, anoAtual)) {
                const valor = parseValueToNumber(despesa.valor || '0');
                const formatCurrency = (val) => {
                    return new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                    }).format(val);
                };
                
                const status = despesa.pago || despesa.concluida || despesa.recebido ? 'âœ…' : 'â³';
                
                window.notificacoesManager.criarNotificacao({
                    tipo: 'despesa_existente',
                    titulo: `${status} Despesa registrada`,
                    descricao: `${despesa.descricao || 'Despesa'} - ${formatCurrency(valor)}`,
                    icone: 'trending_down',
                    dados: { despesaId: despesa.id, tipo: 'despesa' }
                });
                totalNotificacoes++;
            }
        });
        
        // Marcar como carregadas nesta sessÃ£o
        sessionStorage.setItem('notificacoesCarregadas', 'true');
        
        console.log(`âœ… ${totalNotificacoes} notificaÃ§Ãµes de transaÃ§Ãµes carregadas`);
    } catch (error) {
        console.error('âŒ Erro ao carregar notificaÃ§Ãµes de transaÃ§Ãµes:', error);
    }
}

// [FUNÃ‡ÃƒO REMOVIDA - DUPLICADA]

// Carrega cartÃµes de crÃ©dito do Firestore e renderiza na Home
function carregarCartoesCreditoHome(uid) {
    console.log('[Home] Buscando cartÃµes de crÃ©dito para o usuÃ¡rio:', uid);
    // Tenta buscar, mas trata erro de permissÃ£o de forma amigÃ¡vel
    firebase.firestore().collection('cartoes')
        .where('userId', '==', uid)
        .get()
        .then(snapshot => {
            let cartoes = [];
            snapshot.forEach(doc => {
                cartoes.push({ ...doc.data(), id: doc.id });
            });
            console.log('[Home] Total de cartÃµes de crÃ©dito carregados:', cartoes.length);
            // Aqui vocÃª pode renderizar os cartÃµes na tela, se desejar
        })
        .catch(error => {
            if (
                error.code === 'permission-denied' ||
                (error.message && error.message.includes('Missing or insufficient permissions'))
            ) {
                console.warn('[Home] PermissÃ£o insuficiente para buscar cartÃµes de crÃ©dito. ColeÃ§Ã£o "cartoes" nÃ£o estÃ¡ acessÃ­vel para este usuÃ¡rio.');
            } else {
                console.error('[Home] Erro ao buscar cartÃµes de crÃ©dito:', error);
            }
        });
}

// Carrega resumo de receitas (total recebido) e chama grÃ¡fico de receitas por categoria
function carregarResumoReceitas(userId) {
    if (typeof firebase === "undefined" || !firebase.firestore) {
        console.error('Firebase nÃ£o disponÃ­vel para carregar receitas.');
        return;
    }
    const db = firebase.firestore();
    db.collection('receitas')
        .where('userId', '==', userId)
        .get()
        .then(snapshot => {
            let totalRecebido = 0;
            let receitas = [];
            snapshot.forEach(doc => {
                const receita = doc.data();
                
                // Filtrar apenas receitas do mÃªs/ano selecionado
                const isDoMesSelecionado = isDataNoMesSelecionado(receita.data, mesSelecionado, anoSelecionado);
                const recebido = receita.recebido !== false;
                
                if (isDoMesSelecionado) {
                    receitas.push(receita);
                    if (recebido) {
                        const valor = parseValueToNumber(receita.valor || '0'); // Usar funÃ§Ã£o correta
                        totalRecebido += valor;
                    }
                }
            });
            
            const valorReceitas = document.querySelector('.valor-receitas');
            if (valorReceitas) {
                atualizarValorComAnimacao(valorReceitas, totalRecebido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
            }
            console.log(`[Home] Total de receitas do mÃªs ${mesSelecionado+1}/${anoSelecionado}: ${receitas.length}, total recebido: R$ ${totalRecebido.toFixed(2)}`);
            carregarGraficoReceitasPorCategoria(userId, receitas);
        })
        .catch(error => {
            console.error('[Home] Erro ao buscar receitas do Firestore:', error);
        });
}

// Renderiza receitas na Home (mÃ¡x 3, visual consistente e valores corretos)
function carregarReceitasHome(uid) {
    firebase.firestore().collection('receitas')
        .where('userId', '==', uid)
        .get()
        .then(snapshot => {
            let receitas = [];
            let totalReceitas = 0;
            snapshot.forEach(doc => {
                const receita = doc.data();
                
                // Filtrar apenas receitas do mÃªs/ano selecionado
                const isDoMesSelecionado = isDataNoMesSelecionado(receita.data, mesSelecionado, anoSelecionado);
                const recebido = receita.recebido !== false;
                
                if (isDoMesSelecionado) {
                    receitas.push(receita);
                    if (recebido) {
                        let valor = parseValueToNumber(receita.valor || '0'); // Usar funÃ§Ã£o correta
                        
                        // CORREÃ‡ÃƒO TEMPORÃRIA: Se Ã© "SalÃ¡rio" e valor Ã© 500, corrigir para 5000
                        if (receita.descricao === 'SalÃ¡rio' && valor === 500) {
                            valor = 5000;
                        }
                        
                        totalReceitas += valor;
                    }
                }
            });
            
            const valorReceitasEl = document.querySelector('.valor-receitas');
            if (valorReceitasEl) {
                valorReceitasEl.textContent = totalReceitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            }
            const listaHome = document.getElementById('lista-receitas-home');
            if (listaHome) {
                listaHome.innerHTML = '';
                if (receitas.length === 0) {
                    listaHome.innerHTML = `<div style="text-align:center;color:#888;padding:24px 0;">
                        <span class="material-icons-round" style="font-size:2.2rem;opacity:0.3;">receipt_long</span>
                        <div style="margin-top:8px;">Nenhuma receita cadastrada este mÃªs.</div>
                    </div>`;
                } else {
                    receitas.slice(0, 3).forEach(receita => {
                        // Debug especÃ­fico para o SalÃ¡rio
                        if (receita.descricao === 'SalÃ¡rio') {
                        }
                        
                        let valor = parseValueToNumber(receita.valor || '0');
                        
                        // CORREÃ‡ÃƒO TEMPORÃRIA: Se Ã© "SalÃ¡rio" e valor Ã© 500, corrigir para 5000
                        if (receita.descricao === 'SalÃ¡rio' && valor === 500) {
                            console.log('ï¿½ CORREÃ‡ÃƒO: SalÃ¡rio de 500 corrigido para 5000');
                            valor = 5000;
                        }
                        
                        if (receita.descricao === 'SalÃ¡rio') {
                            console.log('ï¿½ðŸš¨ DEBUG SALÃRIO - valor final:', valor);
                        }
                        
                        const iconeReceita = receita.iconeCategoria || obterIconePorCategoria(receita.categoria, 'receita');
                        const div = document.createElement('div');
                        div.className = 'item-mini-ux receita';
                        div.innerHTML = `
                            <span class="mini-icone receita"><span class="material-icons-round" style="color:#21C25E;background:#e8f5ee;">${iconeReceita}</span></span>
                            <span class="mini-descricao">${receita.descricao || '-'}</span>
                            <span class="mini-data">${receita.data || ''}</span>
                            <span class="mini-valor" style="color:#21C25E;">${valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        `;
                        listaHome.appendChild(div);
                    });
                }
            }
            carregarGraficoReceitasPorCategoria(uid, receitas);
        })
        .catch(error => {
            console.error('[Home] Erro ao buscar receitas:', error);
        });
}

// Renderiza despesas na Home (mÃ¡x 3, visual consistente e valores corretos)
function carregarDespesasHome(uid) {
    firebase.firestore().collection('despesas')
        .where('userId', '==', uid)
        .get()
        .then(snapshot => {
            let despesas = [];
            let totalDespesas = 0;
            snapshot.forEach(doc => {
                const despesa = doc.data();
                
                // Filtrar apenas despesas do mÃªs/ano selecionado
                const isDoMesSelecionado = isDataNoMesSelecionado(despesa.data, mesSelecionado, anoSelecionado);
                const pago = despesa.pago !== false;
                
                if (isDoMesSelecionado) {
                    despesas.push(despesa);
                    if (pago) {
                        const valor = parseValueToNumber(despesa.valor || '0'); // Usar funÃ§Ã£o correta
                        totalDespesas += valor;
                    }
                }
            });
            const valorDespesasEl = document.querySelector('.valor-despesas');
            if (valorDespesasEl) {
                atualizarValorComAnimacao(valorDespesasEl, totalDespesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
            }
            const listaHome = document.getElementById('lista-despesas-home');
            if (listaHome) {
                listaHome.innerHTML = '';
                if (despesas.length === 0) {
                    listaHome.innerHTML = `<div style="text-align:center;color:#888;padding:24px 0;">
                        <span class="material-icons-round" style="font-size:2.2rem;opacity:0.3;">shopping_cart</span>
                        <div style="margin-top:8px;">Nenhuma despesa cadastrada este mÃªs.</div>
                    </div>`;
                } else {
                    despesas.slice(0, 3).forEach(despesa => {
                        const valor = parseValueToNumber(despesa.valor || '0'); // Usar funÃ§Ã£o correta
                        const iconeDespesa = despesa.iconeCategoria || obterIconePorCategoria(despesa.categoria, 'despesa');
                        const div = document.createElement('div');
                        div.className = 'item-mini-ux despesa';
                        div.innerHTML = `
                            <span class="mini-icone despesa"><span class="material-icons-round" style="color:#fff;background:#ef233c;">${iconeDespesa}</span></span>
                            <span class="mini-descricao">${despesa.descricao || '-'}</span>
                            <span class="mini-data">${despesa.data || ''}</span>
                            <span class="mini-valor" style="color:#ef233c;">${valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        `;
                        listaHome.appendChild(div);
                    });
                }
            }
            carregarGraficoDespesasPorCategoria(uid, despesas);
        })
        .catch(error => {
            console.error('[Home] Erro ao buscar despesas:', error);
        });
}

// VariÃ¡veis globais para grÃ¡ficos Chart.js
let graficoReceitasCategoria = null;
let graficoDespesasCategoria = null;

// Ãcones globais para grÃ¡ficos de categoria (evita ReferenceError)
const icones = [
    'shopping_cart', 'home', 'check_circle', 'star', 'payments', 'attach_money', 'local_offer', 'category'
];

// GrÃ¡fico de receitas por categoria com lista lateral de categorias (estilo grÃ¡fico 2)
function carregarGraficoReceitasPorCategoria(uid, receitas) {
    console.log('[Home] Montando grÃ¡fico de receitas por categoria...');
    let categorias = {};
    let total = 0;
    let categoriaIcones = {}; // Mapeia categoria -> Ã­cone

    receitas.forEach(receita => {
        if (receita.categoria) {
            const valor = parseValueToNumber(receita.valor || '0'); // Usar a funÃ§Ã£o correta
            categorias[receita.categoria] = (categorias[receita.categoria] || 0) + valor;
            total += valor;
            // Captura o Ã­cone personalizado se existir
            if (receita.iconeCategoria) {
                categoriaIcones[receita.categoria] = receita.iconeCategoria;
            } else if (receita.icone) {
                categoriaIcones[receita.categoria] = receita.icone;
            }
        }
    });

    const labels = Object.keys(categorias);
    const data = Object.values(categorias);

    // DESTROI O GRÃFICO ANTERIOR SE EXISTIR
    if (graficoReceitasCategoria) {
        graficoReceitasCategoria.destroy();
        graficoReceitasCategoria = null;
    }

    // Defina tons de verde para receitas, maior categoria = verde principal
    const tonsVerde = [
        '#21C25E', '#48bb78', '#43e97b', '#b2f7cc', '#4fd1c5', '#38a169', '#81e6d9', '#2ecc71'
    ];

    const containerReceitas = document.getElementById('cartao-estado-ativo-receitas');
    const vazioReceitas = document.getElementById('cartao-estado-vazio-receitas');

    if (labels.length > 0) {
        // Ordena categorias por valor decrescente para identificar a maior
        const ordenadas = labels.map((cat, idx) => ({ cat, valor: data[idx] }))
            .sort((a, b) => b.valor - a.valor);
        // Reordena labels/data para que a maior fique em primeiro (verde principal)
        const labelsOrdenadas = ordenadas.map(o => o.cat);
        const dataOrdenada = ordenadas.map(o => o.valor);

        const ctx = document.getElementById('grafico-receitas-categoria').getContext('2d');
        graficoReceitasCategoria = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labelsOrdenadas,
                datasets: [{
                    data: dataOrdenada,
                    backgroundColor: tonsVerde.slice(0, labelsOrdenadas.length)
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                layout: { padding: 8 },
                plugins: {
                    legend: { display: false }
                }
            }
        });

        document.getElementById('valor-total-receitas').textContent = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        // Monta lista lateral de categorias com barra de progresso, Ã­cone, valor e %
        const listaCategorias = document.getElementById('lista-categorias-receitas');
        if (listaCategorias) {
            listaCategorias.innerHTML = '';
            labelsOrdenadas.forEach((cat, idx) => {
                const valor = dataOrdenada[idx];
                const percent = total > 0 ? Math.round((valor / total) * 100) : 0;
                const cor = tonsVerde[idx % tonsVerde.length];
                // Ordem de prioridade para Ã­cone da categoria:
                // 1. Ãcone salvo em alguma receita dessa categoria (categoriaIcones)
                // 2. Mapeamento categoriaParaIcone
                // 3. Fallback por tipo (obterIconePorCategoria)
                let icone = categoriaIcones[cat] 
                    || categoriaParaIcone[cat] 
                    || obterIconePorCategoria(cat, 'receita');
                listaCategorias.innerHTML += `
                    <div class="grafico-categoria-item">
                        <div class="grafico-categoria-icone" style="background:${cor}22;">
                            <span class="material-icons-round" style="color:${cor};font-size:1.35rem;">${icone}</span>
                        </div>
                        <div class="grafico-categoria-info">
                            <div class="grafico-categoria-nome">${cat}</div>
                            <div class="grafico-categoria-barra">
                                <div class="grafico-categoria-barra-preenchida" style="width:${percent}%;background:${cor};"></div>
                            </div>
                        </div>
                        <div class="grafico-categoria-valores">
                            <span class="grafico-categoria-valor">${valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            <span class="grafico-categoria-percent">${percent}%</span>
                        </div>
                    </div>`;
            });
        }

        if (containerReceitas) containerReceitas.style.display = 'flex';
        if (vazioReceitas) vazioReceitas.style.display = 'none';
        console.log('[Home] GrÃ¡fico de receitas por categoria criado.');
    } else {
        if (containerReceitas) containerReceitas.style.display = 'none';
        if (vazioReceitas) vazioReceitas.style.display = 'flex';
        const listaCategorias = document.getElementById('lista-categorias-receitas');
        if (listaCategorias) listaCategorias.innerHTML = '';
        console.log('[Home] Nenhuma receita para grÃ¡fico de categoria.');
    }
}

// GrÃ¡fico de despesas por categoria com lista lateral de categorias (estilo grÃ¡fico 2)
function carregarGraficoDespesasPorCategoria(uid, despesas) {
    console.log('[Home] Montando grÃ¡fico de despesas por categoria...');
    let categorias = {};
    let total = 0;
    let categoriaIcones = {}; // map categoria -> icone personalizado
    despesas.forEach(despesa => {
        if (despesa.categoria) {
            const valor = parseValueToNumber(despesa.valor || '0');
            categorias[despesa.categoria] = (categorias[despesa.categoria] || 0) + valor;
            total += valor;
            if (despesa.iconeCategoria) {
                categoriaIcones[despesa.categoria] = despesa.iconeCategoria;
            } else if (despesa.icone) {
                categoriaIcones[despesa.categoria] = despesa.icone;
            } else {
                // fallback usando funÃ§Ã£o jÃ¡ existente
                categoriaIcones[despesa.categoria] = obterIconePorCategoria(despesa.categoria, 'despesa');
            }
        }
    });
    const labels = Object.keys(categorias);
    const data = Object.values(categorias);

    if (graficoDespesasCategoria) {
        graficoDespesasCategoria.destroy();
        graficoDespesasCategoria = null;
    }

    // Defina tons de vermelho para despesas, maior categoria = vermelho principal
    const tonsVermelho = [
        '#EF233C', // Vermelho principal (maior categoria)
        '#FF6B6B', // Vermelho claro
        '#FF8C69', // Laranja avermelhado
        '#FFD6D6', // Rosa claro
        '#FFB347', // Laranja
        '#C0392B', // Vermelho escuro
        '#FF7675', // Rosa vibrante
        '#B22234'  // Vermelho escuro
    ];

    const containerDespesas = document.getElementById('cartao-estado-ativo-categorias');
    const vazioDespesas = document.getElementById('cartao-estado-vazio-categorias');

    if (labels.length > 0) {
        // Ordena categorias por valor decrescente para identificar a maior
        const ordenadas = labels.map((cat, idx) => ({ cat, valor: data[idx] }))
            .sort((a, b) => b.valor - a.valor);
        // Reordena labels/data para que a maior fique em primeiro (vermelho principal)
        const labelsOrdenadas = ordenadas.map(o => o.cat);
        const dataOrdenada = ordenadas.map(o => o.valor);

        const ctx = document.getElementById('grafico-despesas-categoria').getContext('2d');
        graficoDespesasCategoria = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labelsOrdenadas,
                datasets: [{
                    data: dataOrdenada,
                    backgroundColor: tonsVermelho.slice(0, labelsOrdenadas.length)
                }]
            },
            options: {
                maintainAspectRatio: false,
                cutout: '70%',
                layout: { padding: 8 },
                plugins: {
                    legend: { display: false }
                }
            }
        });

    document.getElementById('valor-total-despesas').textContent = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const listaCategorias = document.getElementById('lista-categorias-despesas');
        if (listaCategorias) {
            listaCategorias.innerHTML = '';
            labelsOrdenadas.forEach((cat, idx) => {
                const valor = dataOrdenada[idx];
                const percent = total > 0 ? Math.round((valor / total) * 100) : 0;
                const cor = tonsVermelho[idx % tonsVermelho.length];
                const icone = categoriaIcones[cat] || 'shopping_cart';
                const item = document.createElement('div');
                item.className = 'grafico-categoria-item';
                item.innerHTML = `
                    <div class="grafico-categoria-icone" style="background:${cor}22;">
                        <span class="material-icons-round" style="color:${cor};font-size:1.35rem;">${icone}</span>
                    </div>
                    <div class="grafico-categoria-info">
                        <div class="grafico-categoria-nome">${cat}</div>
                        <div class="grafico-categoria-barra">
                            <div class="grafico-categoria-barra-preenchida" style="width:${percent}%;background:${cor};"></div>
                        </div>
                    </div>
                    <div class="grafico-categoria-valores">
                        <span class="grafico-categoria-valor">${valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        <span class="grafico-categoria-percent">${percent}%</span>
                    </div>`;
                listaCategorias.appendChild(item);
            });
        }

        if (containerDespesas) containerDespesas.style.display = 'flex';
        if (vazioDespesas) vazioDespesas.style.display = 'none';
        console.log('[Home] GrÃ¡fico de despesas por categoria criado.');
    } else {
        if (containerDespesas) containerDespesas.style.display = 'none';
        if (vazioDespesas) vazioDespesas.style.display = 'flex';
        const listaCategorias = document.getElementById('lista-categorias-despesas');
        if (listaCategorias) listaCategorias.innerHTML = '';
        console.log('[Home] Nenhuma despesa para grÃ¡fico de categoria.');
    }
}

// ===== NOVO CÃLCULO DE SALDO POR CONTA (AGREGAÃ‡ÃƒO ÃšNICA) =====
// Cache simples para nomes de conta em notificaÃ§Ãµes e montagens rÃ¡pidas
const cacheNomesContas = {};

// (Deprecated) calcularSaldoConta antigo removido em favor de agregaÃ§Ã£o Ãºnica em carregarContasHome
// Nova estratÃ©gia: buscamos todas as contas, receitas e despesas uma Ãºnica vez e agregamos por ID da carteira

function agregarTransacoesPorConta({contas, receitas, despesas, filtrarMes, mesSelecionado, anoSelecionado}) {
    const mapa = {};
    // PrÃ©-popular mapa com saldo inicial
    contas.forEach(c => {
        mapa[c.id] = {
            conta: c,
            saldoInicial: parseFloat(c.saldoInicial || c.saldo || 0) || 0,
            receitas: 0,
            despesas: 0
        };
        cacheNomesContas[c.id] = c.nome || c.descricao || c.banco || 'Conta';
    });

    const mesmaCompetencia = (dataStr) => {
        if (!filtrarMes) return true; // Se nÃ£o precisamos filtrar, sempre inclui
        return isDataNoMesSelecionado(dataStr, mesSelecionado, anoSelecionado);
    };

    receitas.forEach(r => {
        // Campo de vÃ­nculo Ã© 'carteira' contendo o ID da conta
        if (!r.carteira || !mapa[r.carteira]) {
            return;
        }
        if ((r.recebido === false) || !mesmaCompetencia(r.data)) {
            return;
        }
        const valor = parseValueToNumber(r.valor || 0);
        mapa[r.carteira].receitas += valor;
    });
    despesas.forEach(d => {
        if (!d.carteira || !mapa[d.carteira]) {
            return;
        }
        if ((d.pago === false) || !mesmaCompetencia(d.data)) {
            return;
        }
        const valor = parseValueToNumber(d.valor || 0);
        mapa[d.carteira].despesas += valor;
    });
    return mapa;
}

// Renderiza contas e esconde/mostra cartÃ£o vazio
async function carregarContasHome(uid) {
    console.log('[Home] (Nova) agregaÃ§Ã£o de contas para usuÃ¡rio:', uid);
    console.log('[Home] Firestore instance:', firebase.firestore());
    try {
        const dbRef = firebase.firestore();
        console.log('[Home] Buscando dados em paralelo...');
        // Buscar em paralelo
        const [contasSnap, receitasSnap, despesasSnap] = await Promise.all([
            dbRef.collection('contas').where('userId', '==', uid).get(),
            dbRef.collection('receitas').where('userId', '==', uid).get(),
            dbRef.collection('despesas').where('userId', '==', uid).get()
        ]);

        console.log('[Home] Documentos retornados:');
        console.log('- Contas:', contasSnap.size);
        console.log('- Receitas:', receitasSnap.size);
        console.log('- Despesas:', despesasSnap.size);

        const contas = [];
        contasSnap.forEach(doc => {
            const conta = { id: doc.id, ...doc.data() };
            contas.push(conta);
            salvarContaNoCache(conta);
        });

        const receitas = [];
        receitasSnap.forEach(doc => {
            const receita = doc.data();
            receitas.push(receita);
        });
        const despesas = [];
        despesasSnap.forEach(doc => {
            const despesa = doc.data();
            despesas.push(despesa);
        });

        contas.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

        const mapa = agregarTransacoesPorConta({
            contas,
            receitas,
            despesas,
            filtrarMes: true,
            mesSelecionado,
            anoSelecionado
        });

        console.log('[Home] Resultado da agregaÃ§Ã£o:', mapa);
        console.log('[Home] MÃªs selecionado:', mesSelecionado, 'Ano:', anoSelecionado);

        const container = document.getElementById('container-contas-home');
        const vazio = document.getElementById('cartao-estado-vazio-contas');
        const botaoNovaContaContainer = document.getElementById('botao-nova-conta-container');
        if (!container) return;
        container.innerHTML = '';

        if (contas.length === 0) {
            if (vazio) vazio.style.display = 'block';
            if (botaoNovaContaContainer) botaoNovaContaContainer.style.display = 'none';
        } else {
            if (vazio) vazio.style.display = 'none';
            if (botaoNovaContaContainer) botaoNovaContaContainer.style.display = 'flex';

            contas.forEach(conta => {
                const dados = mapa[conta.id];
                const saldoAtual = (dados?.saldoInicial || 0) + (dados?.receitas || 0) - (dados?.despesas || 0);
                const saldoFormatado = saldoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                const div = document.createElement('div');
                div.className = 'conta-home-card-ux';
                div.setAttribute('data-conta-id', conta.id);

                const varColor = getCorConta(conta);

                let iconeSvg = obterIconeBanco(conta);
                if (!iconeSvg && conta.banco === 'Nubank') iconeSvg = bancosIcones['Nubank'];

                if (iconeSvg) {
                    console.debug('[CardConta] SVG banco=', conta.banco, 'nome=', conta.nome, 'id=', conta.id, 'varColor=', varColor);
                    div.innerHTML = `
                        <div class="conta-ux-esquerda">
                            <div class="conta-ux-icone conta-ux-icone-svg" data-color="${varColor}" style="background:${varColor};border-radius:50%;width:54px;height:54px;display:flex;align-items:center;justify-content:center;">
                                <img src="${iconeSvg}" alt="${conta.banco || 'Banco'}" style="width:32px;height:32px;object-fit:contain;">
                            </div>
                            <div class="conta-ux-info">
                                <div class="conta-ux-nome" title="${conta.nome || conta.descricao || 'Conta'}">${conta.nome || conta.descricao || 'Conta'}</div>
                                <div class="conta-ux-tipo">${conta.tipo || 'Conta bancÃ¡ria'}</div>
                            </div>
                        </div>
                        <div class="conta-ux-direita">
                            <div class="conta-ux-saldo" title="Saldo atual">${saldoFormatado}</div>
                            <button class="botao-excluir-conta" data-conta-id="${conta.id}" title="Excluir conta" aria-label="Excluir conta">
                                <span class="material-icons-round">delete</span>
                            </button>
                        </div>`;
                } else {
                    console.debug('[CardConta] MATERIAL banco=', conta.banco, 'nome=', conta.nome, 'id=', conta.id, 'varColor=', varColor);
                    div.innerHTML = `
                        <div class="conta-ux-esquerda">
                            <div class="conta-ux-icone" data-color="${varColor}" style="background:${varColor};width:54px;height:54px;border-radius:50%;display:flex;align-items:center;justify-content:center;">
                                <span class="material-icons-round" style="color:#fff;font-size:2.2rem;">${conta.iconeBanco || conta.icone || 'account_balance_wallet'}</span>
                            </div>
                            <div class="conta-ux-info">
                                <div class="conta-ux-nome" title="${conta.nome || conta.descricao || 'Conta'}">${conta.nome || conta.descricao || 'Conta'}</div>
                                <div class="conta-ux-tipo">${conta.tipo || 'Conta bancÃ¡ria'}</div>
                            </div>
                        </div>
                        <div class="conta-ux-direita">
                            <div class="conta-ux-saldo" title="Saldo atual">${saldoFormatado}</div>
                            <button class="botao-excluir-conta" data-conta-id="${conta.id}" title="Excluir conta" aria-label="Excluir conta">
                                <span class="material-icons-round">delete</span>
                            </button>
                        </div>`;
                }

                div.style.opacity = 0;
                div.style.transform = 'translateY(14px) scale(.97)';
                requestAnimationFrame(() => {
                    div.style.transition = 'opacity .45s, transform .45s';
                    div.style.opacity = 1;
                    div.style.transform = 'translateY(0) scale(1)';
                });

                div.addEventListener('click', (e) => {
                    if (!e.target.closest('.botao-excluir-conta')) {
                        window.location.href = `../Detalhes-Conta/Detalhes-Conta.html?conta=${conta.id}`;
                    }
                });

                container.appendChild(div);
            });
        }

        carregarCartoesCreditoHome(uid);
    } catch (err) {
        console.error('[Home] Erro na agregaÃ§Ã£o de contas:', err);
    }
}
// Exemplo de carregamento de cartÃµes de crÃ©dito
function carregarCartoesCreditoHome(uid) {
    console.log('[Home] Buscando cartÃµes de crÃ©dito para o usuÃ¡rio:', uid);
    // Tenta buscar, mas trata erro de permissÃ£o de forma amigÃ¡vel
    firebase.firestore().collection('cartoes')
        .where('userId', '==', uid)
        .get()
        .then(snapshot => {
            let cartoes = [];
            snapshot.forEach(doc => {
                cartoes.push({ ...doc.data(), id: doc.id });
            });
            console.log('[Home] Total de cartÃµes de crÃ©dito carregados:', cartoes.length);
            // Aqui vocÃª pode renderizar os cartÃµes na tela, se desejar
        })
        .catch(error => {
            if (
                error.code === 'permission-denied' ||
                (error.message && error.message.includes('Missing or insufficient permissions'))
            ) {
                console.warn('[Home] PermissÃ£o insuficiente para buscar cartÃµes de crÃ©dito. ColeÃ§Ã£o "cartoes" nÃ£o estÃ¡ acessÃ­vel para este usuÃ¡rio.');
            } else {
                console.error('[Home] Erro ao buscar cartÃµes de crÃ©dito:', error);
            }
        });
}

// Eventos para popup de exclusÃ£o de conta (mantÃ©m apenas este listener global)
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('botao-excluir-conta') || event.target.closest('.botao-excluir-conta')) {
        const btn = event.target.closest('.botao-excluir-conta');
        const contaId = btn.getAttribute('data-conta-id');
        // Mostra o popup customizado
        mostrarPopupExcluirConta(contaId, 'Tem certeza que deseja excluir esta conta?');
    }
});

// UX: Mostra carregamento animado enquanto carrega dados
function mostrarCarregamento(mensagem = "Carregando...") {
    let overlay = document.getElementById('loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.style = "position:fixed;top:0;left:0;width:100vw;height:100vh;background:#fff;z-index:9999;display:flex;flex-direction:column;justify-content:center;align-items:center;";
        document.body.appendChild(overlay);
    }
    overlay.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;">
            <div class="spinner" style="margin-bottom:18px;width:48px;height:48px;border:6px solid #e0e0e0;border-top:6px solid #21C25E;border-radius:50%;animation:spin 1s linear infinite;"></div>
            <p style="font-family:'Poppins',sans-serif;font-size:1.1rem;color:#333;">${mensagem}</p>
        </div>
        <style>
        @keyframes spin { 0%{transform:rotate(0deg);} 100%{transform:rotate(360deg);} }
        </style>
    `;
    overlay.style.display = 'flex';
}
function esconderCarregamento() {
    let overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'none';
}

// UX: Feedback visual ao atualizar valores
function atualizarValorComAnimacao(el, novoValor) {
    if (!el) return;
    el.textContent = novoValor;
    el.style.transition = 'background 0.4s';
    el.style.background = '#e8f5ee';
    setTimeout(() => { el.style.background = 'transparent'; }, 600);
}

// UX: AnimaÃ§Ã£o ao adicionar/remover contas/despesas/receitas
function animarEntradaElemento(el) {
    if (!el) return;
    el.style.opacity = 0;
    el.style.transform = 'translateY(16px)';
    setTimeout(() => {
        el.style.transition = 'opacity 0.5s, transform 0.5s';
        el.style.opacity = 1;
        el.style.transform = 'translateY(0)';
    }, 10);
}

// UX: Mensagem amigÃ¡vel se nÃ£o houver dados
function mostrarMensagemVazia(container, mensagem, icone = 'info') {
    if (!container) return;
    container.innerHTML = `
        <div style="text-align:center;padding:40px 0;color:#888;">
            <span class="material-icons-round" style="font-size:48px;margin-bottom:12px;opacity:0.4;">${icone}</span>
            <div style="font-size:1.1rem;">${mensagem}</div>
        </div>
    `;
}

// FunÃ§Ã£o para obter o mÃªs atual no formato MM/YYYY
function getMesAnoAtual() {
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();
    return `${mes}/${ano}`;
}

// FunÃ§Ã£o para verificar se uma data estÃ¡ no mÃªs atual
function isDataNoMesAtual(dataStr) {
    if (!dataStr) return false;
    // Suporta formatos dd/mm/yyyy ou yyyy-mm-dd
    let mesAno;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataStr)) {
        const [dia, mes, ano] = dataStr.split('/');
        mesAno = `${mes}/${ano}`;
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
        const [ano, mes] = dataStr.split('-');
        mesAno = `${mes}/${ano}`;
    } else {
        return false;
    }
    return mesAno === getMesAnoAtual();
}

// FunÃ§Ã£o para calcular o saldo total do mÃªs atual
async function calcularSaldoTotalMesAtual(uid) {
    try {
        let saldoInicialContas = 0;
        let totalReceitasEfetivadas = 0;
        let totalDespesasEfetivadas = 0;
        let totalTransferenciasEntrada = 0;
        let totalTransferenciasSaida = 0;

        console.log('[Home] Iniciando cÃ¡lculo do saldo atual...');

        // 1. Buscar contas ativas que devem ser incluÃ­das na soma
        const contasSnapshot = await firebase.firestore().collection('contas')
            .where('userId', '==', uid)
            .get();

        contasSnapshot.forEach(doc => {
            const conta = doc.data();
            // Verificar se a conta estÃ¡ ativa e deve ser incluÃ­da na soma
            const contaAtiva = conta.ativa !== false; // Por padrÃ£o, ativa se nÃ£o especificado
            const incluirNaSoma = conta.incluirNaHome !== false; // MudanÃ§a para usar incluirNaHome
            
            if (contaAtiva && incluirNaSoma) {
                const saldoInicial = parseFloat(conta.saldoInicial || conta.saldo || 0);
                saldoInicialContas += saldoInicial;
                console.log(`[Home] Conta ${conta.nome}: Saldo Inicial = ${saldoInicial}, Incluir na soma: ${incluirNaSoma}`);
            } else {
                console.log(`[Home] Conta ${conta.nome}: ExcluÃ­da da soma (ativa: ${contaAtiva}, incluir: ${incluirNaSoma})`);
            }
        });

        // 2. Buscar receitas efetivadas do mÃªs/ano selecionado
        const receitasSnapshot = await firebase.firestore().collection('receitas')
            .where('userId', '==', uid)
            .get();

        receitasSnapshot.forEach(doc => {
            const receita = doc.data();
            // Consideramos efetivada se recebido === true ou concluida === true
            const efetivada = receita.recebido === true || receita.concluida === true;
            
            // Verificar se a receita Ã© do mÃªs/ano selecionado
            const dataReceita = receita.data;
            const isDoMesSelecionado = isDataNoMesSelecionado(dataReceita, mesSelecionado, anoSelecionado);
            
            if (efetivada && isDoMesSelecionado) {
                const valor = parseValueToNumber(receita.valor);
                totalReceitasEfetivadas += valor;
            }
        });

        // 3. Buscar despesas efetivadas do mÃªs/ano selecionado
        const despesasSnapshot = await firebase.firestore().collection('despesas')
            .where('userId', '==', uid)
            .get();

        despesasSnapshot.forEach(doc => {
            const despesa = doc.data();
            // Consideramos efetivada se pago === true ou concluida === true
            const efetivada = despesa.pago === true || despesa.concluida === true;
            
            // Verificar se a despesa Ã© do mÃªs/ano selecionado
            const dataDespesa = despesa.data;
            const isDoMesSelecionado = isDataNoMesSelecionado(dataDespesa, mesSelecionado, anoSelecionado);
            
            if (efetivada && isDoMesSelecionado) {
                const valor = parseValueToNumber(despesa.valor);
                totalDespesasEfetivadas += valor;
            }
        });

        // 4. Buscar transferÃªncias do mÃªs/ano selecionado
        const transferenciasSnapshot = await firebase.firestore().collection('transferencias')
            .where('userId', '==', uid)
            .get();

        transferenciasSnapshot.forEach(doc => {
            const transferencia = doc.data();
            
            // Verificar se a transferÃªncia Ã© do mÃªs/ano selecionado
            const dataTransferencia = transferencia.data;
            const isDoMesSelecionado = isDataNoMesSelecionado(dataTransferencia, mesSelecionado, anoSelecionado);
            
            if (isDoMesSelecionado) {
                const valor = parseValueToNumber(transferencia.valor);
                
                if (transferencia.tipo === 'entrada') {
                    totalTransferenciasEntrada += valor;
                    console.log(`[Home] TransferÃªncia entrada do mÃªs ${mesSelecionado+1}/${anoSelecionado}: R$ ${valor.toFixed(2)}`);
                } else if (transferencia.tipo === 'saida') {
                    totalTransferenciasSaida += valor;
                    console.log(`[Home] TransferÃªncia saÃ­da do mÃªs ${mesSelecionado+1}/${anoSelecionado}: R$ ${valor.toFixed(2)}`);
                }
            }
        });

        // 5. Aplicar a fÃ³rmula: Saldo atual = Saldo Inicial + (Receitas + Transf. Entrada) - (Despesas + Transf. SaÃ­da)
        const saldoAtual = saldoInicialContas + totalReceitasEfetivadas + totalTransferenciasEntrada - totalDespesasEfetivadas - totalTransferenciasSaida;

        // 6. Atualizar a interface
        const saldoEl = document.querySelector('.valor-saldo');
        console.log('[Home] Elemento saldo encontrado:', saldoEl);
        
        if (saldoEl) {
            const saldoFormatado = saldoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            console.log('[Home] Valor formatado:', saldoFormatado);
            saldoEl.textContent = saldoFormatado;
            console.log('[Home] Saldo atualizado na interface');
        } else {
            console.error('[Home] Elemento .valor-saldo nÃ£o encontrado no DOM');
        }

        console.log(`[Home] === CÃLCULO DO SALDO PARA ${mesSelecionado+1}/${anoSelecionado} ===`);
        console.log(`[Home] Saldo Inicial das Contas: ${saldoInicialContas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
        console.log(`[Home] Receitas Efetivadas: ${totalReceitasEfetivadas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
        console.log(`[Home] TransferÃªncias Entrada: ${totalTransferenciasEntrada.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
        console.log(`[Home] Despesas Efetivadas: ${totalDespesasEfetivadas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
        console.log(`[Home] TransferÃªncias SaÃ­da: ${totalTransferenciasSaida.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
        console.log(`[Home] SALDO ATUAL: ${saldoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
        console.log(`[Home] ============================================`);

        // Atualizar indicador vs mÃªs anterior
        atualizarIndicadorSaldo(uid, saldoAtual);

    } catch (error) {
        console.error('[Home] Erro ao calcular saldo atual:', error);
        
        // Em caso de erro, mostrar R$ 0,00
        const saldoEl = document.querySelector('.valor-saldo');
        if (saldoEl) {
            saldoEl.textContent = 'R$ 0,00';
        }
    }
}

// FunÃ§Ã£o auxiliar para converter valores para nÃºmero (reutilizar da Lista de Receitas)
function parseValueToNumber(value) {
    if (typeof value === 'number') {
        return value;
    }
    
    if (typeof value === 'string') {
        // Remove sÃ­mbolos de moeda e espaÃ§os
        let cleanValue = value.replace(/[R$\s]/g, '');
        
        // Formato brasileiro completo: 5.000,00 ou 1.234.567,89
        if (/^\d{1,3}(\.\d{3})*,\d{2}$/.test(cleanValue)) {
            cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
        }
        // Formato milhares sem centavos: 5.000 ou 1.234.567
        else if (/^\d{1,3}(\.\d{3})+$/.test(cleanValue)) {
            cleanValue = cleanValue.replace(/\./g, '');
        }
        // Formato simples com vÃ­rgula: 5000,00
        else if (/^\d+,\d{1,2}$/.test(cleanValue)) {
            cleanValue = cleanValue.replace(',', '.');
        }
        // Formato americano: 5000.00
        else if (/^\d+\.\d{1,2}$/.test(cleanValue)) {
            // JÃ¡ estÃ¡ no formato correto
        }
        // Apenas nÃºmero: 5000
        else if (/^\d+$/.test(cleanValue)) {
            // JÃ¡ estÃ¡ no formato correto
        }
        // Fallback - se tem ponto e vÃ­rgula, formato brasileiro
        else if (cleanValue.includes('.') && cleanValue.includes(',')) {
            cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
        }
        // SÃ³ vÃ­rgula = decimal
        else if (cleanValue.includes(',') && !cleanValue.includes('.')) {
            cleanValue = cleanValue.replace(',', '.');
        }
        // SÃ³ ponto - verificar se Ã© decimal ou milhares
        else if (cleanValue.includes('.') && !cleanValue.includes(',')) {
            const parts = cleanValue.split('.');
            // Se Ãºltima parte tem mais de 2 dÃ­gitos = separador de milhares
            if (parts.length > 1 && parts[parts.length - 1].length > 2) {
                cleanValue = cleanValue.replace(/\./g, '');
            }
        }
        
        const numValue = parseFloat(cleanValue) || 0;
        return numValue;
    }
    
    return 0;
}

// FunÃ§Ã£o para verificar se uma data estÃ¡ no mÃªs/ano selecionado
function isDataNoMesSelecionado(dataStr, mes, ano) {
    if (!dataStr) return false;
    
    let dataObj;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataStr)) {
        const [dia, mesStr, anoStr] = dataStr.split('/');
        // Converter mÃªs para base 0 (janeiro = 0, dezembro = 11)
        const mesNumerico = parseInt(mesStr, 10) - 1;
        dataObj = new Date(parseInt(anoStr, 10), mesNumerico, parseInt(dia, 10));
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
        const [anoStr, mesStr, dia] = dataStr.split('-');
        // Converter mÃªs para base 0
        const mesNumerico = parseInt(mesStr, 10) - 1;
        dataObj = new Date(parseInt(anoStr, 10), mesNumerico, parseInt(dia, 10));
    } else {
        return false;
    }
    
    return dataObj.getMonth() === mes && dataObj.getFullYear() === ano;
}

// UX: Toast para feedback rÃ¡pido
function mostrarToast(mensagem, cor = "#21C25E") {
    let toast = document.getElementById('toast-ux');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-ux';
        toast.style = "position:fixed;bottom:32px;left:50%;transform:translateX(-50%);background:"+cor+";color:#fff;padding:14px 32px;border-radius:24px;font-family:'Poppins',sans-serif;font-size:1rem;z-index:99999;box-shadow:0 4px 16px rgba(0,0,0,0.13);opacity:0;transition:opacity 0.4s;";
        document.body.appendChild(toast);
    }
    toast.textContent = mensagem;
    toast.style.opacity = 1;
    setTimeout(() => { toast.style.opacity = 0; }, 2200);
}

// FunÃ§Ã£o para calcular e exibir o valor total das receitas do mÃªs selecionado
function calcularValorTotalReceitas(uid) {
    firebase.firestore().collection('receitas')
        .where('userId', '==', uid)
        .get()
        .then(snapshot => {
            let total = 0;
            snapshot.forEach(doc => {
                const receita = doc.data();
                // Verificar se estÃ¡ efetivada e Ã© do mÃªs selecionado
                const efetivada = receita.recebido !== false;
                const isDoMesSelecionado = isDataNoMesSelecionado(receita.data, mesSelecionado, anoSelecionado);
                
                if (efetivada && isDoMesSelecionado) {
                    const valor = parseValueToNumber(receita.valor);
                    total += valor;
                }
            });
            
            // Total de receitas calculado
            const valorFormatado = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const el = document.querySelectorAll('.valor-receitas');
            el.forEach(e => {
                e.textContent = valorFormatado;
                otimizarExibicaoValor(e, valorFormatado);
            });
        })
        .catch(error => {
            console.error('[Home] Erro ao calcular receitas:', error);
        });
}

// FunÃ§Ã£o para calcular e exibir o valor total das despesas do mÃªs selecionado
function calcularValorTotalDespesas(uid) {
    firebase.firestore().collection('despesas')
        .where('userId', '==', uid)
        .get()
        .then(snapshot => {
            let total = 0;
            snapshot.forEach(doc => {
                const despesa = doc.data();
                // Verificar se estÃ¡ efetivada e Ã© do mÃªs selecionado
                const efetivada = despesa.pago !== false;
                const isDoMesSelecionado = isDataNoMesSelecionado(despesa.data, mesSelecionado, anoSelecionado);
                
                if (efetivada && isDoMesSelecionado) {
                    const valor = parseValueToNumber(despesa.valor);
                    total += valor;
                }
            });
            
            // Total de despesas calculado
            const valorFormatado = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            const el = document.querySelectorAll('.valor-despesas');
            el.forEach(e => {
                e.textContent = valorFormatado;
                otimizarExibicaoValor(e, valorFormatado);
            });
        })
        .catch(error => {
            console.error('[Home] Erro ao calcular despesas:', error);
        });
}

// FunÃ§Ã£o para atualizar indicador de saldo vs mÃªs anterior
async function atualizarIndicadorSaldo(uid, saldoAtual) {
    try {
        const hoje = new Date();
        let mesAnterior = mesSelecionado - 1;
        let anoAnterior = anoSelecionado;
        
        if (mesAnterior < 0) {
            mesAnterior = 11;
            anoAnterior = anoSelecionado - 1;
        }

        // Calcular saldo do mÃªs anterior
        let saldoInicialContas = 0;
        let totalReceitasEfetivadas = 0;
        let totalDespesasEfetivadas = 0;
        let totalTransferenciasEntrada = 0;
        let totalTransferenciasSaida = 0;

        // Buscar contas ativas
        const contasSnapshot = await db.collection('contas')
            .where('userId', '==', uid)
            .get();

        contasSnapshot.forEach(doc => {
            const conta = doc.data();
            // Filtrar contas ativas e que devem ser incluÃ­das na soma
            const contaAtiva = conta.ativa !== false;
            const incluirNaHome = conta.incluirNaHome !== false;
            
            if (contaAtiva && incluirNaHome) {
                const saldoInicial = parseValueToNumber(conta.saldoInicial || 0);
                saldoInicialContas += saldoInicial;
            }
        });

        // Buscar receitas do mÃªs anterior
        const receitasSnapshot = await db.collection('receitas')
            .where('userId', '==', uid)
            .get();

        receitasSnapshot.forEach(doc => {
            const receita = doc.data();
            if (receita.efetivada && 
                isDataNoMesSelecionado(receita.data, mesAnterior, anoAnterior)) {
                totalReceitasEfetivadas += parseValueToNumber(receita.valor || 0);
            }
        });

        // Buscar despesas do mÃªs anterior
        const despesasSnapshot = await db.collection('despesas')
            .where('userId', '==', uid)
            .get();

        despesasSnapshot.forEach(doc => {
            const despesa = doc.data();
            if (despesa.efetivada && 
                isDataNoMesSelecionado(despesa.data, mesAnterior, anoAnterior)) {
                totalDespesasEfetivadas += parseValueToNumber(despesa.valor || 0);
            }
        });

        // Buscar transferÃªncias do mÃªs anterior
        const transferenciasSnapshot = await db.collection('transferencias')
            .where('userId', '==', uid)
            .get();

        transferenciasSnapshot.forEach(doc => {
            const transf = doc.data();
            if (isDataNoMesSelecionado(transf.data, mesAnterior, anoAnterior)) {
                totalTransferenciasEntrada += parseValueToNumber(transf.valorEntrada || 0);
                totalTransferenciasSaida += parseValueToNumber(transf.valorSaida || 0);
            }
        });

        const saldoAnterior = saldoInicialContas + totalReceitasEfetivadas + totalTransferenciasEntrada - totalDespesasEfetivadas - totalTransferenciasSaida;
        
        // Calcular variaÃ§Ã£o percentual
        let variacao = 0;
        let icone = 'trending_flat';
        
        if (saldoAnterior !== 0) {
            variacao = ((saldoAtual - saldoAnterior) / Math.abs(saldoAnterior)) * 100;
        } else if (saldoAtual > 0) {
            variacao = 100;
        }

        if (variacao > 0) {
            icone = 'trending_up';
        } else if (variacao < 0) {
            icone = 'trending_down';
        }

        // Atualizar interface
        const indicadorIcon = document.querySelector('.indicador-saldo .material-icons-round');
        const indicadorText = document.querySelector('.indicador-saldo span:last-child');
        
        if (indicadorIcon) {
            indicadorIcon.textContent = icone;
        }
        
        if (indicadorText) {
            const variacaoAbs = Math.abs(variacao);
            indicadorText.textContent = `${variacaoAbs.toFixed(1)}% vs mÃªs anterior`;
        }

        console.log(`[Home] Indicador atualizado: ${variacao.toFixed(1)}% vs mÃªs anterior`);

    } catch (error) {
        console.error('[Home] Erro ao calcular indicador de saldo:', error);
    }
}

// ATENÃ‡ÃƒO: Para resolver os erros de permissÃ£o do Firestore, vocÃª precisa ajustar as regras de seguranÃ§a do Firestore no console do Firebase.
// Siga o passo a passo abaixo:

/*
1. Acesse o console do Firebase: https://console.firebase.google.com/
2. No menu lateral, clique em "Firestore Database" e depois na aba "Regras".
3. Para desenvolvimento, use temporariamente as regras abaixo para permitir acesso apenas a usuÃ¡rios autenticados:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}

4. Clique em "Publicar" para salvar as regras.

5. Para produÃ§Ã£o, utilize regras mais restritivas, por exemplo:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /contas/{contaId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    match /receitas/{receitaId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    match /despesas/{despesaId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    match /cartoes/{cartaoId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    match /transferencias/{transfId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}

6. Clique em "Publicar" novamente.

IMPORTANTE: Nunca deixe as regras abertas (allow read, write: if true) em produÃ§Ã£o!
*/

// [FUNÃ‡ÃƒO REMOVIDA - DUPLICADA]

// [CÃ“DIGO DO MUTATIONOBSERVER REMOVIDO - USANDO EVENTO DIRETO]

// ===== SISTEMA DE NOTIFICAÃ‡Ã•ES =====

// ConfiguraÃ§Ã£o das notificaÃ§Ãµes
const notificacoesConfig = {
    maxNotificacoes: 50,
    tiposIcones: {
        receita: 'trending_up',
        receita_criada: 'trending_up',
        despesa: 'trending_down', 
        despesa_criada: 'trending_down',
        conta: 'account_balance',
        conta_criada: 'account_balance',
        lembrete: 'schedule',
        sistema: 'info'
    }
};

// Gerenciador de notificaÃ§Ãµes
class NotificacoesManager {
    constructor() {
        this.notificacoes = [];
        this.naoLidas = 0;
        this.overlay = null;
        this.painel = null;
        this.botaoNotificacao = null;
        this.badge = null;
        this.init();
    }

    init() {
        // Elementos do DOM
        this.overlay = document.getElementById('notificacoes-overlay');
        this.painel = document.querySelector('.notificacoes-painel');
        this.botaoNotificacao = document.querySelector('.botao-notificacao');
        this.badge = document.querySelector('.notificacao-badge');

        if (!this.botaoNotificacao || !this.overlay) return;

        // Event listeners
        this.setupEventListeners();
        
        // Carregar notificaÃ§Ãµes
        this.carregarNotificacoes();
    }

    setupEventListeners() {
        // Abrir painel
        this.botaoNotificacao.addEventListener('click', (e) => {
            e.stopPropagation();
            this.abrirPainel();
        });

        // Fechar painel
        document.querySelector('.btn-fechar-notificacoes')?.addEventListener('click', () => {
            this.fecharPainel();
        });

        // Fechar ao clicar no overlay
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.fecharPainel();
            }
        });

        // Marcar todas como lidas
        const btnLimparTodas = document.querySelector('.btn-marcar-todas-lidas');
        if (btnLimparTodas) {
            btnLimparTodas.addEventListener('click', () => {
                console.log('BotÃ£o Limpar Todas clicado!');
                this.marcarTodasComoLidas();
            });
        }

        // Event delegation como fallback para o botÃ£o limpar todas
        document.addEventListener('click', (e) => {
            if (e.target && (e.target.classList.contains('btn-marcar-todas-lidas') || 
                e.target.textContent.includes('Limpar Todas'))) {
                console.log('BotÃ£o Limpar Todas clicado via event delegation!');
                e.preventDefault();
                e.stopPropagation();
                this.marcarTodasComoLidas();
            }
        });

        // Fechar com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.overlay.classList.contains('show')) {
                this.fecharPainel();
            }
        });
    }

    async carregarNotificacoes() {
        if (!usuario || !db) {
            // Se nÃ£o hÃ¡ usuÃ¡rio ou Firebase, carregar apenas do localStorage
            this.carregarNotificacoesLocal();
            return;
        }

        this.mostrarLoading();

        try {
            // Carregar apenas notificaÃ§Ãµes individuais pendentes
            console.log('ðŸ“± Inicializando sistema de notificaÃ§Ãµes individuais');
            

            // Fallback: Carregar notificaÃ§Ãµes do Firebase (mÃ©todo antigo)
            const snapshot = await db.collection('notificacoes')
                .where('userId', '==', usuario.uid)
                .limit(notificacoesConfig.maxNotificacoes)
                .get();

            this.notificacoes = [];
            this.naoLidas = 0;

            snapshot.forEach(doc => {
                const notificacao = { id: doc.id, ...doc.data() };
                this.notificacoes.push(notificacao);
                this.naoLidas++;
            });

            // Carregar tambÃ©m notificaÃ§Ãµes do localStorage
            this.carregarNotificacoesLocal(false); // false = nÃ£o limpar as notificaÃ§Ãµes jÃ¡ carregadas

            // Ordenar no cliente por dataHora (mais recente primeiro)
            this.notificacoes.sort((a, b) => {
                const dataA = a.dataHora?.toDate ? a.dataHora.toDate() : new Date(a.dataHora || a.timestamp || 0);
                const dataB = b.dataHora?.toDate ? b.dataHora.toDate() : new Date(b.dataHora || b.timestamp || 0);
                return dataB - dataA;
            });

            this.renderizarNotificacoes();
            this.atualizarBadge();

        } catch (error) {
            console.error('Erro ao carregar notificaÃ§Ãµes:', error);
            // Em caso de erro, carregar pelo menos do localStorage
            this.carregarNotificacoesLocal();
        }
    }

    // Nova funÃ§Ã£o para carregar notificaÃ§Ãµes do localStorage
    carregarNotificacoesLocal(limpar = true) {
        try {
            if (limpar) {
                this.notificacoes = [];
                this.naoLidas = 0;
            }

            const notificacoesLocal = JSON.parse(localStorage.getItem('notificacoes') || '[]');
            
            notificacoesLocal.forEach(notif => {
                // Evitar duplicatas
                if (!this.notificacoes.find(n => n.id === notif.id)) {
                    this.notificacoes.push(notif);
                    if (!notif.lida) {
                        this.naoLidas++;
                    }
                }
            });

            if (limpar) {
                this.renderizarNotificacoes();
                this.atualizarBadge();
            }

        } catch (error) {
            console.error('Erro ao carregar notificaÃ§Ãµes do localStorage:', error);
        }
    }

    mostrarLoading() {
        const content = document.querySelector('.notificacoes-content');
        if (!content) return;

        content.innerHTML = `
            <div class="notificacoes-loading">
                <div class="loading-spinner"></div>
                <p>Carregando notificaÃ§Ãµes...</p>
            </div>
        `;
    }

    mostrarErro() {
        const content = document.querySelector('.notificacoes-content');
        if (!content) return;

        content.innerHTML = `
            <div class="notificacoes-vazio">
                <span class="material-icons-round">error_outline</span>
                <p>Erro ao carregar</p>
                <small>Tente novamente mais tarde</small>
            </div>
        `;
    }

    renderizarNotificacoes() {
        const content = document.querySelector('.notificacoes-content');
        if (!content) return;

        if (this.notificacoes.length === 0) {
            const mensagem = window.notificacoesLimpas ? 
                'NotificaÃ§Ãµes foram limpas' : 
                'Nenhuma notificaÃ§Ã£o';
            const submensagem = window.notificacoesLimpas ? 
                'Todas as notificaÃ§Ãµes foram removidas com sucesso' : 
                'Suas notificaÃ§Ãµes aparecerÃ£o aqui';
                
            content.innerHTML = `
                <div class="notificacoes-vazio">
                    <span class="material-icons-round">notifications_none</span>
                    <p>${mensagem}</p>
                    <small>${submensagem}</small>
                </div>
            `;
            return;
        }

        const lista = this.notificacoes.map(notificacao => this.criarItemNotificacao(notificacao)).join('');
        
        content.innerHTML = `
            <div class="notificacoes-lista">
                ${lista}
            </div>
        `;

        // Adicionar event listeners aos itens
        content.querySelectorAll('.notificacao-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.dataset.id;
                this.marcarComoLida(id);
                this.processarAcaoNotificacao(id);
            });
        });
    }

    criarItemNotificacao(notificacao) {
        // Usar timestamp da notificaÃ§Ã£o individual ou dataHora
        const timestamp = notificacao.timestamp || notificacao.dataHora;
        const tempo = this.formatarTempo(timestamp);
        
        // Usar Ã­cone da notificaÃ§Ã£o individual ou Ã­cone padrÃ£o do tipo
        const icone = notificacao.icone || notificacoesConfig.tiposIcones[notificacao.tipo] || 'notifications';
        
        // Usar cor da notificaÃ§Ã£o individual ou cor baseada no tipo
        let cor = notificacao.cor;
        if (!cor) {
            // Cores baseadas no tipo
            if (notificacao.tipo === 'receita' || notificacao.tipo === 'receita_criada') {
                cor = '#4CAF50'; // Verde
            } else if (notificacao.tipo === 'despesa' || notificacao.tipo === 'despesa_criada') {
                cor = '#D32F2F'; // Vermelho
            } else if (notificacao.tipo === 'conta' || notificacao.tipo === 'conta_criada') {
                cor = '#2196F3'; // Azul
            } else {
                cor = '#21C25E'; // Verde padrÃ£o
            }
        }
        
        // DescriÃ§Ã£o pode vir de vÃ¡rios campos
        const descricao = notificacao.descricao || notificacao.mensagem || '';
        
        // Formatar valor se disponÃ­vel
        let valorHtml = '';
        if (notificacao.valor) {
            // Se jÃ¡ Ã© string formatada (ex: "R$ 100,00"), usar direto
            if (typeof notificacao.valor === 'string' && notificacao.valor.includes('R$')) {
                valorHtml = `<div class="notificacao-valor" style="color: ${cor}">${notificacao.valor}</div>`;
            } else {
                // Se Ã© nÃºmero, formatar
                const valor = typeof notificacao.valor === 'number' ? notificacao.valor : parseFloat(notificacao.valor) || 0;
                const valorFormatado = new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                }).format(valor);
                valorHtml = `<div class="notificacao-valor" style="color: ${cor}">${valorFormatado}</div>`;
            }
        }
        
        // InformaÃ§Ãµes extras para notificaÃ§Ãµes individuais
        let infoExtra = '';
        if (notificacao.categoria) {
            infoExtra += `<span class="notificacao-categoria">ðŸ“‚ ${notificacao.categoria}</span>`;
        }
        if (notificacao.status) {
            const statusIcon = notificacao.status === 'Recebida' || notificacao.status === 'Paga' || notificacao.status === 'Ativa' ? 'âœ…' : 'â³';
            infoExtra += `<span class="notificacao-status">${statusIcon} ${notificacao.status}</span>`;
        }
        
        return `
            <div class="notificacao-item nao-lida" data-id="${notificacao.id}">
                <div class="notificacao-icone" style="background: ${cor}15; color: ${cor};">
                    <span class="material-icons-round">${icone}</span>
                </div>
                <div class="notificacao-conteudo">
                    <div class="notificacao-titulo">${notificacao.titulo}</div>
                    <div class="notificacao-descricao">${descricao}</div>
                    ${valorHtml}
                    ${infoExtra ? `<div class="notificacao-extras">${infoExtra}</div>` : ''}
                    <div class="notificacao-tempo">${tempo}</div>
                </div>
            </div>
        `;
    }

    formatarTempo(dataHora) {
        if (!dataHora) return '';
        
        const agora = new Date();
        const data = dataHora.toDate ? dataHora.toDate() : new Date(dataHora);
        const diff = agora - data;
        
        const minutos = Math.floor(diff / 60000);
        const horas = Math.floor(minutos / 60);
        const dias = Math.floor(horas / 24);
        
        if (minutos < 1) return 'Agora';
        if (minutos < 60) return `${minutos}min`;
        if (horas < 24) return `${horas}h`;
        if (dias < 7) return `${dias}d`;
        
        return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    }

    async marcarComoLida(id) {
        const notificacao = this.notificacoes.find(n => n.id === id);
        if (!notificacao || notificacao.lida) return;

        try {
            // Em vez de atualizar, vamos deletar a notificaÃ§Ã£o
            await db.collection('notificacoes').doc(id).delete();
            
            // Remover da lista local
            this.notificacoes = this.notificacoes.filter(n => n.id !== id);
            this.naoLidas--;
            this.atualizarBadge();
            
            // Atualizar visualmente - remover o item
            const item = document.querySelector(`[data-id="${id}"]`);
            if (item) {
                item.style.transition = 'all 0.3s ease';
                item.style.transform = 'translateX(100%)';
                item.style.opacity = '0';
                
                setTimeout(() => {
                    this.renderizarNotificacoes();
                }, 300);
            }

        } catch (error) {
            console.error('Erro ao remover notificaÃ§Ã£o:', error);
        }
    }

    async marcarTodasComoLidas() {
        console.log('marcarTodasComoLidas chamada, notificaÃ§Ãµes nÃ£o lidas:', this.naoLidas);
        
        if (this.naoLidas === 0) {
            console.log('Nenhuma notificaÃ§Ã£o nÃ£o lida para limpar');
            return;
        }

        // Mostrar popup de confirmaÃ§Ã£o personalizado
        this.mostrarPopupConfirmacao();
    }

    mostrarPopupConfirmacao() {
        const popup = document.getElementById('popup-confirmar-limpeza');
        const btnConfirmar = document.getElementById('btn-confirmar-limpeza');
        const btnCancelar = document.getElementById('btn-cancelar-limpeza');
        
        if (!popup) return;
        
        popup.style.display = 'flex';
        
        // Remover listeners anteriores se existirem
        const confirmarClone = btnConfirmar.cloneNode(true);
        const cancelarClone = btnCancelar.cloneNode(true);
        btnConfirmar.parentNode.replaceChild(confirmarClone, btnConfirmar);
        btnCancelar.parentNode.replaceChild(cancelarClone, btnCancelar);

        // Event listeners para os botÃµes
        const confirmarClick = () => {
            console.log('Confirmando limpeza de notificaÃ§Ãµes');
            popup.style.display = 'none';
            this.executarLimpeza();
        };
        
        const cancelarClick = () => {
            console.log('Cancelando limpeza de notificaÃ§Ãµes');
            popup.style.display = 'none';
        };
        
        confirmarClone.addEventListener('click', confirmarClick);
        cancelarClone.addEventListener('click', cancelarClick);
        
        // Fechar ao clicar fora
        const fecharFora = (e) => {
            if (e.target === popup) {
                console.log('Fechando popup ao clicar fora');
                cancelarClick();
                popup.removeEventListener('click', fecharFora);
            }
        };
        popup.addEventListener('click', fecharFora);
    }

    async executarLimpeza() {
        console.log('Executando limpeza de notificaÃ§Ãµes...');
        console.log('NotificaÃ§Ãµes antes da limpeza:', this.notificacoes.length);
        
        try {
            // Definir flag para impedir regeneraÃ§Ã£o automÃ¡tica
            window.notificacoesLimpas = true;
            
            // Se Firebase estiver disponÃ­vel, deletar do Firestore
            if (typeof db !== 'undefined' && db) {
                // Deletar todas as notificaÃ§Ãµes do usuÃ¡rio
                const userId = window.firebaseUser?.uid || usuario?.uid || 'anonimo';
                const snapshot = await db.collection('notificacoes')
                    .where('userId', '==', userId)
                    .get();
                
                const batch = db.batch();
                snapshot.docs.forEach(doc => {
                    console.log('Deletando notificaÃ§Ã£o do Firebase:', doc.id);
                    batch.delete(doc.ref);
                });

                await batch.commit();
                console.log('Todas as notificaÃ§Ãµes deletadas do Firebase');
            }
            
            // Limpar localStorage e sessionStorage completamente
            localStorage.removeItem('notificacoes');
            sessionStorage.removeItem('notificacoesCarregadas');
            console.log('NotificaÃ§Ãµes removidas do localStorage e sessionStorage');
            
            // Limpar todas as notificaÃ§Ãµes locais
            this.notificacoes = [];
            this.naoLidas = 0;
            
            console.log('NotificaÃ§Ãµes apÃ³s limpeza:', this.notificacoes.length);
            
            this.atualizarBadge();
            this.renderizarNotificacoes();
            
            // Fechar o painel de notificaÃ§Ãµes
            this.fecharPainel();
            
            // Marcar timestamp da limpeza no localStorage para persistir entre sessÃµes
            const agora = Date.now();
            localStorage.setItem('notificacoesLimpasEm', agora.toString());
            console.log('NotificaÃ§Ãµes limpas e timestamp salvo:', agora);
            
            // Reabilitar notificaÃ§Ãµes apÃ³s 1 hora
            setTimeout(() => {
                window.notificacoesLimpas = false;
                localStorage.removeItem('notificacoesLimpasEm');
                console.log('NotificaÃ§Ãµes reabilitadas apÃ³s 1 hora');
            }, 3600000); // 1 hora = 3600000ms
            
            console.log('NotificaÃ§Ãµes limpas com sucesso!');

        } catch (error) {
            console.error('Erro ao remover todas as notificaÃ§Ãµes:', error);
        }
    }

    processarAcaoNotificacao(id) {
        const notificacao = this.notificacoes.find(n => n.id === id);
        if (!notificacao || !notificacao.acao) return;

        // Fechar painel
        this.fecharPainel();

        // Processar aÃ§Ã£o baseada no tipo
        switch (notificacao.acao.tipo) {
            case 'navegacao':
                if (notificacao.acao.url) {
                    window.location.href = notificacao.acao.url;
                }
                break;
            case 'funcao':
                if (notificacao.acao.funcao && typeof window[notificacao.acao.funcao] === 'function') {
                    window[notificacao.acao.funcao](notificacao.acao.parametros);
                }
                break;
        }
    }

    atualizarBadge() {
        if (!this.badge) return;

        if (this.naoLidas > 0) {
            this.badge.textContent = this.naoLidas > 99 ? '99+' : this.naoLidas;
            this.badge.style.display = 'flex';
        } else {
            this.badge.style.display = 'none';
        }
    }

    abrirPainel() {
        if (!this.overlay) return;
        
        this.overlay.classList.add('show');
        document.body.style.overflow = 'hidden';
        
        // Carregar notificaÃ§Ãµes atualizadas
        this.carregarNotificacoes();
        
        // Verificar se hÃ¡ notificaÃ§Ãµes antigas/de exemplo para limpar
        this.verificarLimpezaNotificacoes();
    }

    // Verificar e limpar notificaÃ§Ãµes desnecessÃ¡rias
    async verificarLimpezaNotificacoes() {
        if (!usuario || !db) return;

        try {
            const snapshot = await db.collection('notificacoes')
                .where('userId', '==', usuario.uid)
                .get();

            const notificacoesParaRemover = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                // Remover apenas notificaÃ§Ãµes de exemplo antigas especÃ­ficas
                const isNotificacaoExemplo = 
                    (data.titulo === 'Bem-vindo ao Poup+!' && data.descricao?.includes('aplicaÃ§Ã£o financeira estÃ¡ configurada')) ||
                    (data.titulo === 'Lembrete de Pagamento' && data.descricao?.includes('conta de luz atÃ© sexta-feira')) ||
                    (data.titulo === 'Receita Adicionada' && data.descricao?.includes('SalÃ¡rio foi adicionado')) ||
                    (data.titulo === 'Despesa Registrada' && data.descricao?.includes('Compra no supermercado'));

                if (isNotificacaoExemplo) {
                    notificacoesParaRemover.push(doc.ref);
                }
            });

            if (notificacoesParaRemover.length > 0) {
                const batch = db.batch();
                notificacoesParaRemover.forEach(ref => {
                    batch.delete(ref);
                });
                
                await batch.commit();
                console.log(`${notificacoesParaRemover.length} notificaÃ§Ãµes de exemplo removidas`);
                
                // Recarregar apÃ³s limpeza
                setTimeout(() => this.carregarNotificacoes(), 500);
            }

        } catch (error) {
            console.error('Erro ao verificar limpeza:', error);
        }
    }

    fecharPainel() {
        if (!this.overlay) return;
        
        this.overlay.classList.remove('show');
        document.body.style.overflow = '';
    }

    // MÃ©todos pÃºblicos para criar notificaÃ§Ãµes
    async criarNotificacao(dados) {
        if (!usuario || !db) return;
        
        // Verificar se as notificaÃ§Ãµes foram limpas recentemente
        if (window.notificacoesLimpas) {
            console.log('NotificaÃ§Ãµes foram limpas, nÃ£o criando nova notificaÃ§Ã£o');
            return;
        }

        const notificacao = {
            userId: usuario.uid,
            titulo: dados.titulo,
            descricao: dados.descricao,
            tipo: dados.tipo || 'sistema',
            valor: dados.valor || null,
            acao: dados.acao || null,
            lida: false,
            dataHora: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            await db.collection('notificacoes').add(notificacao);
            
            // Limpar notificaÃ§Ãµes antigas (mais de 7 dias)
            this.limparNotificacoesAntigas();
            
            // Recarregar notificaÃ§Ãµes se o painel estiver aberto
            if (this.overlay && this.overlay.classList.contains('show')) {
                this.carregarNotificacoes();
            } else {
                // Apenas atualizar o badge
                this.naoLidas++;
                this.atualizarBadge();
            }

        } catch (error) {
            console.error('Erro ao criar notificaÃ§Ã£o:', error);
        }
    }

    // FunÃ§Ã£o para limpar notificaÃ§Ãµes antigas automaticamente
    async limparNotificacoesAntigas() {
        if (!usuario || !db) return;

        try {
            const seteDiasAtras = new Date();
            seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);

            const snapshot = await db.collection('notificacoes')
                .where('userId', '==', usuario.uid)
                .where('dataHora', '<', seteDiasAtras)
                .get();

            if (!snapshot.empty) {
                const batch = db.batch();
                snapshot.forEach(doc => {
                    batch.delete(doc.ref);
                });
                
                await batch.commit();
                console.log(`${snapshot.size} notificaÃ§Ãµes antigas removidas`);
            }

        } catch (error) {
            console.error('Erro ao limpar notificaÃ§Ãµes antigas:', error);
        }
    }

    // MÃ©todos de conveniÃªncia para tipos especÃ­ficos
    async notificarReceita(receita) {
        const desc = receita?.descricao || receita?.mensagem || 'Receita adicionada';
        await this.criarNotificacao({
            titulo: 'Nova Receita Adicionada',
            descricao: `${desc} foi adicionada Ã  sua conta`,
            tipo: 'receita',
            valor: receita?.valor ? `+${receita.valor}` : null,
            acao: {
                tipo: 'navegacao',
                url: '../Lista-de-receitas/Lista-de-receitas.html'
            }
        });
    }

    async notificarDespesa(despesa) {
        const desc = despesa?.descricao || despesa?.mensagem || 'Despesa adicionada';
        await this.criarNotificacao({
            titulo: 'Nova Despesa Adicionada',
            descricao: `${desc} foi adicionada Ã  sua conta`,
            tipo: 'despesa',
            valor: despesa?.valor ? `-${despesa.valor}` : null,
            acao: {
                tipo: 'navegacao',
                url: '../Lista-de-despesas/Lista-de-despesas.html'
            }
        });
    }

    async notificarLembrete(titulo, descricao) {
        await this.criarNotificacao({
            titulo,
            descricao,
            tipo: 'lembrete'
        });
    }
}

// InstÃ¢ncia global do gerenciador
let notificacoesManager = null;

// Inicializar quando o usuÃ¡rio estiver autenticado
function inicializarNotificacoes() {
    if (usuario && !notificacoesManager) {
        notificacoesManager = new NotificacoesManager();
        
        // Disponibilizar globalmente
        window.notificacoesManager = notificacoesManager;
        
        // Processar notificaÃ§Ãµes pendentes de outras pÃ¡ginas
        if (typeof window.processarNotificacoesPendentes === 'function') {
            setTimeout(() => {
                window.processarNotificacoesPendentes();
            }, 1000);
        }
        
        // Carregar notificaÃ§Ãµes de transaÃ§Ãµes existentes
        setTimeout(() => {
            if (notificacoesManager && usuario) {
                carregarNotificacoesTransacoes(usuario.uid);
            }
        }, 2000);
        
        // DESABILITADO: NotificaÃ§Ãµes de resumo (apenas as transaÃ§Ãµes individuais)
        // setTimeout(() => {
        //     if (notificacoesManager) {
        //         gerarNotificacoesBasedadosReais();
        //     }
        // }, 3000);
    }
}

// FunÃ§Ã£o para gerar notificaÃ§Ãµes baseadas nos dados reais da conta
async function gerarNotificacoesBasedadosReais() {
    if (!usuario || !db || !notificacoesManager) return;
    
    // Verificar se as notificaÃ§Ãµes foram limpas recentemente
    if (window.notificacoesLimpas) {
        console.log('NotificaÃ§Ãµes foram limpas recentemente, nÃ£o gerando novas');
        return;
    }
    
    try {
        // Verificar se jÃ¡ existem notificaÃ§Ãµes para evitar duplicatas
        const notificacoesExistentes = await db.collection('notificacoes')
            .where('userId', '==', usuario.uid)
            .get();
            
        if (!notificacoesExistentes.empty) {
            console.log('NotificaÃ§Ãµes jÃ¡ existem, nÃ£o criando novas');
            return;
        }

        // Carregar receitas recentes (Ãºltimos 7 dias)
        const seteDiasAtras = new Date();
        seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
        
        const receitasSnapshot = await db.collection('receitas')
            .where('userId', '==', usuario.uid)
            .get();
            
        const despesasSnapshot = await db.collection('despesas')
            .where('userId', '==', usuario.uid)
            .get();

        // Criar notificaÃ§Ãµes para receitas recentes
        let receitasRecentes = 0;
        receitasSnapshot.forEach(doc => {
            const receita = doc.data();
            if (receita.timestamp) {
                const dataReceita = new Date(receita.timestamp);
                if (dataReceita >= seteDiasAtras) {
                    receitasRecentes++;
                }
            }
        });

        // Criar notificaÃ§Ãµes para despesas recentes
        let despesasRecentes = 0;
        despesasSnapshot.forEach(doc => {
            const despesa = doc.data();
            if (despesa.criadoEm) {
                const dataDespesa = despesa.criadoEm.toDate ? despesa.criadoEm.toDate() : new Date(despesa.criadoEm);
                if (dataDespesa >= seteDiasAtras) {
                    despesasRecentes++;
                }
            }
        });

        // Criar notificaÃ§Ã£o de resumo se houver atividade
        if (receitasRecentes > 0) {
            await notificacoesManager.criarNotificacao({
                titulo: 'Receitas Adicionadas',
                descricao: `VocÃª adicionou ${receitasRecentes} receita${receitasRecentes > 1 ? 's' : ''} nos Ãºltimos 7 dias`,
                tipo: 'receita',
                acao: {
                    tipo: 'navegacao',
                    url: '../Lista-de-receitas/Lista-de-receitas.html'
                }
            });
        }

        if (despesasRecentes > 0) {
            await notificacoesManager.criarNotificacao({
                titulo: 'Despesas Registradas',
                descricao: `VocÃª registrou ${despesasRecentes} despesa${despesasRecentes > 1 ? 's' : ''} nos Ãºltimos 7 dias`,
                tipo: 'despesa',
                acao: {
                    tipo: 'navegacao',
                    url: '../Lista-de-despesas/Lista-de-despesas.html'
                }
            });
        }

        // NotificaÃ§Ã£o de boas-vindas se for primeiro acesso
        if (receitasRecentes === 0 && despesasRecentes === 0) {
            await notificacoesManager.criarNotificacao({
                titulo: 'Bem-vindo ao Poup+',
                descricao: 'Comece adicionando suas receitas e despesas para ter controle total das suas finanÃ§as',
                tipo: 'sistema'
            });
        }

        // Verificar contas sem movimentaÃ§Ã£o recente
        const contasSnapshot = await db.collection('contas')
            .where('userId', '==', usuario.uid)
            .get();
            
        if (!contasSnapshot.empty && (receitasRecentes > 0 || despesasRecentes > 0)) {
            await notificacoesManager.criarNotificacao({
                titulo: 'Acompanhe seu Saldo',
                descricao: 'Suas contas foram atualizadas. Verifique seus saldos atuais',
                tipo: 'sistema',
                acao: {
                    tipo: 'navegacao',
                    url: '../Contas/Contas.html'
                }
            });
        }

    } catch (error) {
        console.error('Erro ao gerar notificaÃ§Ãµes baseadas em dados reais:', error);
    }
}

// Disponibilizar o notificacoesManager globalmente para outras pÃ¡ginas
window.notificacoesManager = notificacoesManager;

// Menu de AÃ§Ãµes Flutuante
class MenuAcoes {
    constructor() {
        this.menuElement = document.getElementById('menu-acoes');
        this.overlayElement = document.getElementById('overlay-menu');
        this.botaoAdicionar = document.querySelector('.botao-adicionar');
        this.isMenuAberto = false;
        this.init();
    }

    init() {
        if (!this.menuElement || !this.botaoAdicionar) {
            console.warn('Elementos do menu de aÃ§Ãµes nÃ£o encontrados');
            return;
        }

        // Event listener para o botÃ£o adicionar
        this.botaoAdicionar.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.toggleMenu();
        });

        // Event listener para o overlay (fechar ao clicar fora)
        this.overlayElement?.addEventListener('click', () => {
            this.fecharMenu();
        });

        // Event listener para ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMenuAberto) {
                this.fecharMenu();
            }
        });

        // Event listeners para as aÃ§Ãµes
        const acaoItems = this.menuElement?.querySelectorAll('.acao-item');
        acaoItems?.forEach(item => {
            item.addEventListener('click', (e) => {
                // Permitir navegaÃ§Ã£o normal
                this.fecharMenu();
            });
        });
    }

    toggleMenu() {
        if (this.isMenuAberto) {
            this.fecharMenu();
        } else {
            this.abrirMenu();
        }
    }

    abrirMenu() {
        this.isMenuAberto = true;
        this.menuElement.style.display = 'block';
        // Pequeno delay para permitir a transiÃ§Ã£o
        setTimeout(() => {
            this.menuElement.classList.add('ativo');
        }, 10);
        
        // Bloquear scroll do body
        document.body.style.overflow = 'hidden';
        
        console.log('Menu de aÃ§Ãµes aberto');
    }

    fecharMenu() {
        this.isMenuAberto = false;
        this.menuElement.classList.remove('ativo');
        
        // Aguardar animaÃ§Ã£o antes de esconder
        setTimeout(() => {
            this.menuElement.style.display = 'none';
        }, 300);
        
        // Restaurar scroll do body
        document.body.style.overflow = '';
        
        console.log('Menu de aÃ§Ãµes fechado');
    }
}

// Inicializar menu de aÃ§Ãµes quando a pÃ¡gina carregar
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar um pouco para garantir que todos os elementos estejam prontos
    setTimeout(() => {
        window.menuAcoes = new MenuAcoes();
    }, 500);
});

// ===== FUNÃ‡Ã•ES UTILITÃRIAS PARA NOTIFICAÃ‡Ã•ES GLOBAIS =====

// FunÃ§Ã£o para criar notificaÃ§Ã£o de nova conta
// Evitar redefiniÃ§Ã£o se jÃ¡ existir (definida em js/notificacoes-utils.js)
if (typeof window.criarNotificacaoNovaConta !== 'function') {
    window.criarNotificacaoNovaConta = async function(conta) {
        try {
            if (window.notificacoesManager) {
                await window.notificacoesManager.criarNotificacao({
                    tipo: 'conta_criada',
                    titulo: 'Nova conta adicionada',
                    descricao: `A conta "${conta.nome || conta.banco || 'Nova conta'}" foi criada com sucesso!`,
                    icone: 'account_balance',
                    dados: { contaId: conta.id }
                });
            }
        } catch (error) {
            console.error('Erro ao criar notificaÃ§Ã£o de nova conta:', error);
        }
    };
}

// FunÃ§Ã£o para criar notificaÃ§Ã£o de nova receita
if (typeof window.criarNotificacaoNovaReceita !== 'function') {
    window.criarNotificacaoNovaReceita = async function(receita) {
        try {
            if (!window.notificacoesManager) return;
            const valorBruto = receita.valor || 0;
            const valorNum = parseValueToNumber(valorBruto);
            const formatCurrency = (val) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(val);
            let contaNome = '';
            if (receita.carteira) {
                contaNome = cacheNomesContas[receita.carteira];
                if (!contaNome) {
                    try {
                        const contaDoc = await firebase.firestore().collection('contas').doc(receita.carteira).get();
                        if (contaDoc.exists) {
                            contaNome = contaDoc.data().nome || contaDoc.data().descricao || contaDoc.data().banco || 'Conta';
                            cacheNomesContas[receita.carteira] = contaNome;
                        }
                    } catch(e) { /* ignore */ }
                }
            }
            const complementoConta = contaNome ? ` na conta ${contaNome}` : '';
            await window.notificacoesManager.criarNotificacao({
                tipo: 'receita',
                titulo: 'Receita registrada',
                descricao: `${receita.descricao || 'Receita'} de ${formatCurrency(valorNum)}${complementoConta}`,
                valor: `+${formatCurrency(valorNum)}`,
                acao: { tipo: 'navegacao', url: '../Lista-de-receitas/Lista-de-receitas.html' }
            });
        } catch (error) {
            console.error('Erro ao criar notificaÃ§Ã£o de nova receita:', error);
        }
    };
}

// FunÃ§Ã£o para criar notificaÃ§Ã£o de nova despesa
if (typeof window.criarNotificacaoNovaDespesa !== 'function') {
    window.criarNotificacaoNovaDespesa = async function(despesa) {
        try {
            if (!window.notificacoesManager) return;
            const valorNum = parseValueToNumber(despesa.valor || 0);
            const formatCurrency = (val) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(val);
            let contaNome = '';
            if (despesa.carteira) {
                contaNome = cacheNomesContas[despesa.carteira];
                if (!contaNome) {
                    try {
                        const contaDoc = await firebase.firestore().collection('contas').doc(despesa.carteira).get();
                        if (contaDoc.exists) {
                            contaNome = contaDoc.data().nome || contaDoc.data().descricao || contaDoc.data().banco || 'Conta';
                            cacheNomesContas[despesa.carteira] = contaNome;
                        }
                    } catch(e) { /* ignore */ }
                }
            }
            const complementoConta = contaNome ? ` na conta ${contaNome}` : '';
            await window.notificacoesManager.criarNotificacao({
                tipo: 'despesa',
                titulo: 'Despesa registrada',
                descricao: `${despesa.descricao || 'Despesa'} de ${formatCurrency(valorNum)}${complementoConta}`,
                valor: `-${formatCurrency(valorNum)}`,
                acao: { tipo: 'navegacao', url: '../Lista-de-despesas/Lista-de-despesas.html' },
                dados: { 
                    despesaId: despesa.id || null,
                    tipo: 'despesa',
                    categoria: despesa.categoria || 'Sem categoria'
                }
            });
        } catch (error) {
            console.error('Erro ao criar notificaÃ§Ã£o de nova despesa:', error);
        }
    };
}

// FunÃ§Ã£o para otimizar exibiÃ§Ã£o de valores em dispositivos mÃ³veis
function otimizarExibicaoValor(elemento, valor) {
    // Verificar se estamos em dispositivo mÃ³vel
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile && valor.length > 12) {
        // Para valores muito longos em mobile, adicionar classe especial
        elemento.classList.add('valor-longo');
        
        // Ajustar font-size dinamicamente baseado no comprimento
        const comprimento = valor.length;
        if (comprimento > 15) {
            elemento.style.fontSize = '0.9rem';
        } else if (comprimento > 12) {
            elemento.style.fontSize = '1rem';
        }
        
        // Adicionar tooltip com valor completo
        elemento.title = `Valor completo: ${valor}`;
    } else {
        elemento.classList.remove('valor-longo');
        elemento.style.fontSize = '';
    }
}

// Executar otimizaÃ§Ã£o quando a janela for redimensionada
window.addEventListener('resize', () => {
    document.querySelectorAll('.valor-receitas, .valor-despesas').forEach(el => {
        otimizarExibicaoValor(el, el.textContent);
    });
});

// Renderizar cartÃµes de crÃ©dito na interface
function renderizarCartoesCredito(cartoes) {
    const secaoCartoes = document.querySelector('.secao:has(h2:contains("CartÃµes de crÃ©dito"))');
    let secaoCartoesAlternativa = null;
    
    // Fallback: procurar pela estrutura conhecida
    if (!secaoCartoes) {
        const titulosSecao = document.querySelectorAll('h2.titulo-secao');
        titulosSecao.forEach(titulo => {
            if (titulo.textContent.includes('CartÃµes de crÃ©dito')) {
                secaoCartoesAlternativa = titulo.closest('.secao');
            }
        });
    }
    
    const secaoFinal = secaoCartoes || secaoCartoesAlternativa;
    
    if (!secaoFinal) {
        console.warn('[Home] SeÃ§Ã£o de cartÃµes nÃ£o encontrada');
        return;
    }
    
    // Limpar conteÃºdo existente (remover estado vazio)
    const estadoVazio = secaoFinal.querySelector('.cartao-estado-vazio');
    if (estadoVazio) {
        estadoVazio.remove();
    }
    
    if (cartoes.length === 0) {
        // Mostrar estado vazio
        const estadoVazioHTML = `
            <div class="cartao-estado-vazio">
                <div class="icone-vazio">
                    <span class="material-icons-round">credit_card</span>
                </div>
                <p>Nenhum cartÃ£o cadastrado</p>
                <a href="../Novo CartÃ£o/Novo CartÃ£o.html" class="botao-primario">Adicionar cartÃ£o</a>
            </div>
        `;
        secaoFinal.insertAdjacentHTML('beforeend', estadoVazioHTML);
        return;
    }
    
    // Criar container para cartÃµes
    let containerCartoes = secaoFinal.querySelector('.container-cartoes');
    if (!containerCartoes) {
        containerCartoes = document.createElement('div');
        containerCartoes.className = 'container-cartoes';
        containerCartoes.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        `;
        secaoFinal.appendChild(containerCartoes);
    }
    
    // Limpar cartÃµes existentes
    containerCartoes.innerHTML = '';
    
    // Renderizar cada cartÃ£o
    cartoes.forEach(cartao => {
        const cartaoHTML = criarCartaoCredito(cartao);
        containerCartoes.insertAdjacentHTML('beforeend', cartaoHTML);
    });
}

// Criar HTML para um cartÃ£o de crÃ©dito
function criarCartaoCredito(cartao) {
    const limite = parseFloat(cartao.limite || 0);
    const usado = parseFloat(cartao.gastoAtual || 0);
    const disponivel = limite - usado;
    const percentualUsado = limite > 0 ? (usado / limite * 100) : 0;
    
    // Determinar cor baseada no percentual usado
    let corBarra = '#22c55e'; // Verde
    if (percentualUsado > 80) {
        corBarra = '#ef4444'; // Vermelho
    } else if (percentualUsado > 60) {
        corBarra = '#f59e0b'; // Amarelo
    }
    
    return `
        <div class="cartao-credito" style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 12px;
            padding: 1.5rem;
            color: white;
            position: relative;
            overflow: hidden;
            cursor: pointer;
            transition: transform 0.2s ease;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        " onclick="window.location.href='../Lista-de-cartoes/Lista-de-cartoes.html'" 
           onmouseover="this.style.transform='translateY(-2px)'" 
           onmouseout="this.style.transform='translateY(0)'">
            <div style="position: relative; z-index: 2;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <div>
                        <h3 style="font-size: 1.1rem; font-weight: 600; margin: 0 0 0.25rem 0;">${cartao.descricao || 'CartÃ£o de CrÃ©dito'}</h3>
                        <p style="font-size: 0.875rem; opacity: 0.8; margin: 0;">${cartao.bandeira || 'Visa'}</p>
                    </div>
                    <span class="material-icons-round" style="font-size: 1.5rem; opacity: 0.8;">credit_card</span>
                </div>
                
                <div style="margin-bottom: 1rem;">
                    <p style="font-size: 0.75rem; opacity: 0.7; margin: 0 0 0.25rem 0;">Limite disponÃ­vel</p>
                    <p style="font-size: 1.25rem; font-weight: 600; margin: 0;">${disponivel.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                </div>
                
                <div style="margin-bottom: 0.5rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                        <span style="font-size: 0.75rem; opacity: 0.7;">Usado: ${usado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        <span style="font-size: 0.75rem; opacity: 0.7;">${percentualUsado.toFixed(0)}%</span>
                    </div>
                    <div style="background: rgba(255,255,255,0.2); border-radius: 4px; height: 4px; overflow: hidden;">
                        <div style="background: ${corBarra}; height: 100%; width: ${percentualUsado}%; transition: width 0.3s ease;"></div>
                    </div>
                </div>
            </div>
            
            <!-- PadrÃ£o decorativo -->
            <div style="position: absolute; top: -50%; right: -50%; width: 100%; height: 100%; background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%); z-index: 1;"></div>
        </div>
    `;
}
