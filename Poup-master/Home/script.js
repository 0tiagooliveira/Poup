// Variáveis globais do Firebase e autenticação
let firebaseApp, auth, googleProvider;
let usuarioJaAutenticado = false;
let usuario = null;
let db = null; // Firestore database

// Mapeamento de categorias para ícones
const categoriaParaIcone = {
    // Receitas
    'Salário': 'paid',
    'Freelancer': 'business_center',
    'Freelance': 'business_center',
    'Investimentos': 'trending_up',
    'Vendas': 'point_of_sale',
    'Venda de co...': 'point_of_sale', // Para "Venda de co..." no print
    'Venda de Serviços': 'work',
    'Dividendos': 'account_balance',
    'Rendimento': 'savings',
    'Décimo Terceiro': 'calendar_month',
    'Outras': 'attach_money',
    
    // Despesas
    'Alimentação': 'restaurant',
    'Transporte': 'local_gas_station',
    'Uber': 'local_taxi',
    'Churrasco': 'restaurant',
    'Moradia': 'home',
    'Saúde': 'local_hospital',
    'Educação': 'school',
    'Lazer': 'sports_esports',
    'Vestuário': 'checkroom',
    'Contas de Casa': 'electric_bolt',
    'Outros': 'shopping_cart'
};

// Função para obter ícone baseado na categoria
function obterIconePorCategoria(categoria, tipoTransacao) {
    if (!categoria) return tipoTransacao === 'receita' ? 'savings' : 'shopping_cart';
    // 1) Tentativa direta (case exato)
    if (categoriaParaIcone[categoria]) return categoriaParaIcone[categoria];
    // 2) Normalizar e mapear aliases comuns (sem acentos, minúsculas)
    const norm = categoria.toString()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().trim();
    const aliases = {
        'decimo terceiro': 'calendar_month',
        'decimo-terceiro': 'calendar_month',
        '13 salario': 'calendar_month',
        '13o salario': 'calendar_month',
        '13 salario': 'calendar_month',
        '13o': 'calendar_month',
        '13º': 'calendar_month',
        'venda de servicos': 'work',
        'venda de produtos': 'point_of_sale'
    };
    if (aliases[norm]) return aliases[norm];
    // 3) Fallback baseado no tipo
    return tipoTransacao === 'receita' ? 'savings' : 'shopping_cart';
}

// Utilitário: obter parâmetro da URL
function getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
}

// Utilitário: redirecionar de volta se houver returnTo
function maybeRedirectBackAfterAuth() {
    const returnTo = getQueryParam('returnTo');
    if (returnTo) {
        // Evitar loops: se já estamos na Home com returnTo apontando para Home, ignore
        if (!/Home\/home\.html/i.test(returnTo)) {
            console.log('[AUTH] Redirecionando de volta para:', returnTo);
            // Dar um pequeno delay para UI renderizar
            setTimeout(() => {
                window.location.href = returnTo;
            }, 300);
        }
    }
}

// Mapeamento de bancos para ícones SVG
const bancosIcones = {
    'Nubank': '../Icon/Nubank.svg',
    'Banco do Brasil': '../Icon/banco-do-brasil.svg',
    'Bradesco': '../Icon/bradesco.svg',
    'Itaú': '../Icon/itau.svg',
    'Santander': '../Icon/santander.svg',
    'Caixa': '../Icon/caixa.svg',
    'PicPay': '../Icon/picpay.svg'
};

// Função para obter ícone do banco
function obterIconeBanco(conta) {
    // Se o ícone já é um SVG path, retorna ele mesmo
    if (conta.icone && conta.icone.includes('.svg')) {
        return conta.icone;
    }
    
    // Se tem o campo banco definido, usa o mapeamento
    if (conta.banco && bancosIcones[conta.banco]) {
        return bancosIcones[conta.banco];
    }
    
    // Fallback para ícone material
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

// Sistema de autenticação simplificado com token
function salvarTokenUsuario(usuario) {
    const dadosUsuario = {
        uid: usuario.uid,
        email: usuario.email,
        nome: usuario.displayName || usuario.email,
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
        console.error('[AUTH] Erro ao ler token:', error);
        localStorage.removeItem('tokenUsuarioPoup');
        return null;
    }
}

// ===== FUNÇÕES GLOBAIS DE POPUP =====

// Variável global para controlar exclusão de conta
let contaParaExcluirId = null;

// Função global para mostrar popup de exclusão de conta
window.mostrarPopupExcluirConta = function(contaId, mensagem) {
    contaParaExcluirId = contaId;
    const popupExcluirContaCustom = document.getElementById('popup-excluir-conta-custom');
    const popupExcluirContaMsg = document.getElementById('popup-excluir-conta-msg');
    
    if (popupExcluirContaMsg && popupExcluirContaCustom) {
        popupExcluirContaMsg.textContent = mensagem;
        popupExcluirContaCustom.style.display = 'flex';
    }
};

// Função global para fechar popup de exclusão de conta
window.fecharPopupExcluirConta = function() {
    console.log('Fechando popup de exclusão...');
    const popupExcluirContaCustom = document.getElementById('popup-excluir-conta-custom');
    if (popupExcluirContaCustom) {
        popupExcluirContaCustom.style.display = 'none';
        console.log('Popup fechado com sucesso');
    } else {
        console.error('Elemento popup não encontrado!');
    }
    contaParaExcluirId = null;
};

// Função global para confirmar exclusão de conta
window.confirmarExclusaoConta = function() {
    if (contaParaExcluirId) {
        excluirConta(contaParaExcluirId);
        window.fecharPopupExcluirConta();
    }
};

function limparTokenUsuario() {
    localStorage.removeItem('tokenUsuarioPoup');
}

// Funções de cache local para trabalhar offline
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

// Função para configurar event listeners dos modais
function configurarEventListenersModais() {
    console.log('Configurando event listeners dos modais...');
    
    // Usar event delegation no document para garantir que funcione
    document.addEventListener('click', function(e) {
        // Botão "Não"
        if (e.target && e.target.id === 'popup-excluir-conta-nao') {
            e.preventDefault();
            e.stopPropagation();
            console.log('Botão Não clicado via delegation!');
            window.fecharPopupExcluirConta();
            return;
        }
        
        // Botão "Sim"
        if (e.target && e.target.id === 'popup-excluir-conta-sim') {
            e.preventDefault();
            e.stopPropagation();
            console.log('Botão Sim clicado via delegation!');
            if (contaParaExcluirId) {
                excluirConta(contaParaExcluirId);
            }
            window.fecharPopupExcluirConta();
            return;
        }
    });
    
    console.log('Event delegation configurado!');
}

// Função para excluir a conta
function excluirConta(contaId) {
    console.log('Excluindo conta com ID:', contaId);
    
    // Verificar se Firebase está disponível
    if (!firebase || !firebase.firestore) {
        console.error('Firebase não está disponível');
        mostrarToast('Erro: Firebase não disponível', '#ef233c');
        return;
    }
    
    const db = firebase.firestore();
    db.collection('contas').doc(contaId).delete()
        .then(() => {
            console.log('Conta excluída com sucesso!');
            mostrarToast('Conta excluída!');
            if (auth && auth.currentUser) {
                carregarContasHome(auth.currentUser.uid);
            }
        })
        .catch(error => {
            console.error('Erro ao excluir conta:', error);
            mostrarToast('Erro ao excluir conta', '#ef233c');
        });
}

// Inicialização principal com controle total
document.addEventListener('DOMContentLoaded', function() {
    mostrarCarregamento();
    console.log('[INIT] Verificando autenticação...');
    
    // Configurar event listeners dos modais imediatamente
    configurarEventListenersModais();
    
    // Primeiro, verificar se há token válido
    const tokenUsuario = obterTokenUsuario();
    
    if (tokenUsuario) {
        // Token existe, mas ainda precisa da autenticação Firebase para Firestore
        console.log('[AUTH] Token encontrado, aguardando Firebase...');
        
        auth.onAuthStateChanged(user => {
            const containerApp = document.querySelector('.container-app');
            if (user) {
                usuario = user; // Definir variável global
                usuarioJaAutenticado = true;
                salvarTokenUsuario(user); // Atualizar token
                setTimeout(() => {
                    esconderCarregamento();
                    if (containerApp) containerApp.style.display = 'block';
                }, 350);
                inicializarComponentes(user);
                // Se veio com returnTo, volta para a página original
                maybeRedirectBackAfterAuth();
            } else {
                // Token inválido, limpar e redirecionar
                console.log('[AUTH] Token inválido, redirecionando...');
                limparTokenUsuario();
                const returnTo = getQueryParam('returnTo');
                const loginUrl = returnTo ? `../index.html?returnTo=${encodeURIComponent(returnTo)}` : '../index.html';
                window.location.href = loginUrl;
            }
        });
        
        // Timeout para Firebase
        setTimeout(() => {
            if (!usuario || !usuarioJaAutenticado) {
                console.log('[AUTH] Timeout do Firebase, redirecionando...');
                limparTokenUsuario();
                const returnTo = getQueryParam('returnTo');
                const loginUrl = returnTo ? `../index.html?returnTo=${encodeURIComponent(returnTo)}` : '../index.html';
                window.location.href = loginUrl;
            }
        }, 5000);
        
        return;
    }
    
    // Só usar Firebase se não há token
    if (auth) {
        console.log('[AUTH] Verificando Firebase...');
        auth.onAuthStateChanged(user => {
            const containerApp = document.querySelector('.container-app');
            if (user) {
                usuario = user; // Definir variável global
                usuarioJaAutenticado = true;
                salvarTokenUsuario(user);
                setTimeout(() => {
                    esconderCarregamento();
                    if (containerApp) containerApp.style.display = 'block';
                }, 350);
                inicializarComponentes(user);
                // Se veio com returnTo, volta para a página original
                maybeRedirectBackAfterAuth();
            } else {
                console.log('[AUTH] Redirecionando para login...');
                esconderCarregamento();
                const returnTo = getQueryParam('returnTo');
                const loginUrl = returnTo ? `../index.html?returnTo=${encodeURIComponent(returnTo)}` : '../index.html';
                window.location.href = loginUrl;
            }
        });
    } else {
        esconderCarregamento();
        alert('Erro ao carregar Firebase. Verifique sua configuração.');
    }

    // Clique nos cartões de receitas/despesas (cartão-lista-ux)
    document.querySelectorAll('.cartao-receitas.cartao-lista-ux').forEach(card => {
        card.addEventListener('click', function(e) {
            // Evita navegação se clicar em botão interno
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

// Variáveis globais para mês/ano selecionado
let mesSelecionado, anoSelecionado;
(function setMesAnoInicial() {
    const hoje = new Date();
    mesSelecionado = hoje.getMonth();
    anoSelecionado = hoje.getFullYear();
})();

// Função para atualizar o seletor de mês
function atualizarSeletorMes() {
    const seletorMes = document.querySelector('.seletor-mes');
    if (!seletorMes) return;
    seletorMes.selectedIndex = mesSelecionado;
}

// Função para atualizar saldo ao trocar mês
async function atualizarSaldoMes(uid) {
    console.log(`[Home] Atualizando dados para o mês ${mesSelecionado+1}/${anoSelecionado}`);
    await calcularSaldoTotalMesAtual(uid);
    calcularValorTotalReceitas(uid);
    calcularValorTotalDespesas(uid);
    
    // Atualizar também os gráficos e listas
    carregarResumoReceitas(uid);
    carregarReceitasHome(uid);
    carregarDespesasHome(uid);
}

// Função principal de inicialização dos componentes da Home
async function inicializarComponentes(user) {
    console.log('Inicializando componentes para o usuário:', user.uid);

    const elementos = {
        avatarUsuarioBtn: document.getElementById('avatar-usuario-btn'),
        menuUsuario: document.getElementById('menu-usuario'),
        sairBtn: document.getElementById('sair-btn'),
        nomeUsuario: document.querySelector('.nome-usuario'),
    };

    if (elementos.nomeUsuario) {
        elementos.nomeUsuario.textContent = user.displayName || user.email;
    }

    configurarEventos(elementos);
    atualizarSeletorMes(); // Definir mês atual no seletor
    carregarDadosDaHome(user.uid);
    
    // Configurar event listeners dos modais
    configurarEventListenersModais();

    // Inicializar sistema de notificações
    inicializarNotificacoes();

    // Calcular saldo total do mês atual - aguardar resultado
    console.log('[INIT] Executando calcularSaldoTotalMesAtual na inicialização...');
    await calcularSaldoTotalMesAtual(user.uid);
    calcularValorTotalReceitas(user.uid);
    calcularValorTotalDespesas(user.uid);
}

// Configura eventos de clique e interação da Home
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
                console.log('[AUTH] Usuário deslogado com sucesso.');
                window.location.href = '../index.html';
            }).catch(error => {
                console.error('[AUTH] Erro ao fazer logout:', error);
                // Mesmo com erro no Firebase, limpar token e redirecionar
                window.location.href = '../index.html';
            });
        });
    }
    document.addEventListener('click', function(e) {
        if (elementos.menuUsuario && !elementos.menuUsuario.contains(e.target) && !elementos.avatarUsuarioBtn.contains(e.target)) {
            elementos.menuUsuario.classList.remove('mostrar');
        }
    });

    // Filtros dos gráficos (exemplo)
    document.querySelectorAll('.botao-filtro-receita').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.botao-filtro-receita').forEach(b => b.classList.remove('ativo'));
            this.classList.add('ativo');
            // Chame função para filtrar receitas por período/categoria se desejar
        });
    });

    // Configurar botões de navegação de mês
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
        console.log('[Home] Botão anterior configurado');
    } else {
        console.error('[Home] Botão anterior não encontrado');
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
        console.log('[Home] Botão próximo configurado');
    } else {
        console.error('[Home] Botão próximo não encontrado');
    }

    // Seletor de mês
    if (seletorMes) {
        seletorMes.addEventListener('change', function() {
            mesSelecionado = this.selectedIndex;
            if (auth.currentUser) atualizarSaldoMes(auth.currentUser.uid);
        });
        console.log('[Home] Seletor de mês configurado');
    } else {
        console.error('[Home] Seletor de mês não encontrado');
    }
    document.querySelectorAll('.botao-filtro').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.botao-filtro').forEach(b => b.classList.remove('ativo'));
            this.classList.add('ativo');
            // Chame função para filtrar despesas por período/categoria se desejar
        });
    });
}

// Carrega todos os dados necessários para a Home
function carregarDadosDaHome(userId) {
    console.log(`Buscando dados da home para o usuário: ${userId}`);
    carregarContasHome(userId);
    carregarResumoReceitas(userId);
    carregarReceitasHome(userId);
    carregarDespesasHome(userId);
    carregarCartoesCreditoHome(userId);
}

// [FUNÇÃO REMOVIDA - DUPLICADA]

// Carrega cartões de crédito do Firestore e renderiza na Home
function carregarCartoesCreditoHome(uid) {
    console.log('[Home] Buscando cartões de crédito para o usuário:', uid);
    const container = document.getElementById('cartoes-home-container');
    const vazio = document.getElementById('cartao-estado-vazio-cartoes');
    const linkVerTodos = document.getElementById('link-ver-todos-cartoes');

    if (!container) return;

    firebase.firestore().collection('cartoes')
        .where('userId', '==', uid)
        .get()
        .then(snapshot => {
            const cartoes = [];
            snapshot.forEach(doc => cartoes.push({ id: doc.id, ...doc.data() }));
            console.log('[Home] Total de cartões de crédito carregados:', cartoes.length);

            if (cartoes.length === 0) {
                container.style.display = 'none';
                if (vazio) vazio.style.display = '';
                if (linkVerTodos) linkVerTodos.style.display = 'none';
                return;
            }

            // Render compacto: mostra até 2 cartões como no print, com logo da bandeira + nome da instituição
            container.innerHTML = '';
            const maxMostrar = Math.min(2, cartoes.length);
            for (let i = 0; i < maxMostrar; i++) {
                const c = cartoes[i];
                const nomeInstituicao = c?.institution?.nome || c?.institution?.descricao || 'Cartão';
                const bandeira = c?.brand || {};
                const logoHTML = bandeira.type === 'image' && bandeira.icon
                    ? `<img src="../Icon/${(bandeira.icon.split('/').pop())}" alt="${bandeira.name || ''}" style="height:18px;object-fit:contain;vertical-align:-3px;">`
                    : `<span style="font-weight:600;color:#233">${bandeira.name || ''}</span>`;

                const card = document.createElement('a');
                card.href = `../Cartões/Cartões.html?focus=${encodeURIComponent(c.id)}`;
                card.className = 'item-mini-ux';
                card.style.display = 'flex';
                card.style.alignItems = 'center';
                card.style.justifyContent = 'space-between';
                card.style.padding = '12px 14px';
                card.style.border = '1px solid #e7eaf3';
                card.style.borderRadius = '12px';
                card.style.background = '#fff';
                card.innerHTML = `
                    <div style="display:flex;align-items:center;gap:10px;">
                        <div>${logoHTML}</div>
                        <div style="font-weight:600;color:#1f2a44;">${nomeInstituicao}</div>
                    </div>
                    <span class="material-icons-round" style="color:#98a2b3;">chevron_right</span>
                `;
                container.appendChild(card);
            }

            container.style.display = '';
            if (vazio) vazio.style.display = 'none';
            if (linkVerTodos) linkVerTodos.style.display = '';
        })
        .catch(error => {
            if (
                error.code === 'permission-denied' ||
                (error.message && error.message.includes('Missing or insufficient permissions'))
            ) {
                console.warn('[Home] Permissão insuficiente para buscar cartões de crédito.');
            } else {
                console.error('[Home] Erro ao buscar cartões de crédito:', error);
            }
        });
}

// Carrega resumo de receitas (total recebido) e chama gráfico de receitas por categoria
function carregarResumoReceitas(userId) {
    if (typeof firebase === "undefined" || !firebase.firestore) {
        console.error('Firebase não disponível para carregar receitas.');
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
                
                // Filtrar apenas receitas do mês/ano selecionado
                const isDoMesSelecionado = isDataNoMesSelecionado(receita.data, mesSelecionado, anoSelecionado);
                const recebido = receita.recebido !== false;
                
                if (isDoMesSelecionado) {
                    receitas.push(receita);
                    if (recebido) {
                        const valor = parseValueToNumber(receita.valor || '0'); // Usar função correta
                        totalRecebido += valor;
                    }
                }
            });
            
            const valorReceitas = document.querySelector('.valor-receitas');
            if (valorReceitas) {
                atualizarValorComAnimacao(valorReceitas, totalRecebido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
            }
            console.log(`[Home] Total de receitas do mês ${mesSelecionado+1}/${anoSelecionado}: ${receitas.length}, total recebido: R$ ${totalRecebido.toFixed(2)}`);
            carregarGraficoReceitasPorCategoria(userId, receitas);
        })
        .catch(error => {
            console.error('[Home] Erro ao buscar receitas do Firestore:', error);
        });
}

// Renderiza receitas na Home (máx 3, visual consistente e valores corretos)
function carregarReceitasHome(uid) {
    firebase.firestore().collection('receitas')
        .where('userId', '==', uid)
        .get()
        .then(snapshot => {
            let receitas = [];
            let totalReceitas = 0;
            snapshot.forEach(doc => {
                const receita = doc.data();
                
                // Filtrar apenas receitas do mês/ano selecionado
                const isDoMesSelecionado = isDataNoMesSelecionado(receita.data, mesSelecionado, anoSelecionado);
                const recebido = receita.recebido !== false;
                
                if (isDoMesSelecionado) {
                    receitas.push(receita);
                    if (recebido) {
                        const valor = parseValueToNumber(receita.valor || '0'); // Usar função correta
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
                        <div style="margin-top:8px;">Nenhuma receita cadastrada este mês.</div>
                    </div>`;
                } else {
                    receitas.slice(0, 3).forEach(receita => {
                        const valor = parseValueToNumber(receita.valor || '0'); // Usar função correta
                        const iconeReceita = receita.iconeCategoria || obterIconePorCategoria(receita.categoria, 'receita');
                        const corReceita = receita.corCategoria || '#e8f5ee';
                        console.log('Debug receita:', receita.descricao, 'categoria:', receita.categoria, 'iconeCategoria:', receita.iconeCategoria, 'icone usado:', iconeReceita);
                        const div = document.createElement('div');
                        div.className = 'item-mini-ux receita';
                        div.innerHTML = `
                            <span class="mini-icone receita"><span class="material-icons-round" style="color:#21C25E;background:${corReceita}33;">${iconeReceita}</span></span>
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

// Renderiza despesas na Home (máx 3, visual consistente e valores corretos)
function carregarDespesasHome(uid) {
    firebase.firestore().collection('despesas')
        .where('userId', '==', uid)
        .get()
        .then(snapshot => {
            let despesas = [];
            let totalDespesas = 0;
            snapshot.forEach(doc => {
                const despesa = doc.data();
                
                // Filtrar apenas despesas do mês/ano selecionado
                const isDoMesSelecionado = isDataNoMesSelecionado(despesa.data, mesSelecionado, anoSelecionado);
                const pago = despesa.pago !== false;
                
                if (isDoMesSelecionado) {
                    despesas.push(despesa);
                    if (pago) {
                        const valor = parseValueToNumber(despesa.valor || '0'); // Usar função correta
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
                        <div style="margin-top:8px;">Nenhuma despesa cadastrada este mês.</div>
                    </div>`;
                } else {
                    despesas.slice(0, 3).forEach(despesa => {
                        const valor = parseValueToNumber(despesa.valor || '0'); // Usar função correta
                        const iconeDespesa = despesa.iconeCategoria || obterIconePorCategoria(despesa.categoria, 'despesa');
                        const corDespesa = despesa.corCategoria || '#fee7ea';
                        console.log('Debug despesa:', despesa.descricao, 'categoria:', despesa.categoria, 'iconeCategoria:', despesa.iconeCategoria, 'icone usado:', iconeDespesa);
                        const div = document.createElement('div');
                        div.className = 'item-mini-ux despesa';
                        div.innerHTML = `
                            <span class="mini-icone despesa"><span class="material-icons-round" style="color:#ef233c;background:${corDespesa}33;">${iconeDespesa}</span></span>
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

// Variáveis globais para gráficos Chart.js
let graficoReceitasCategoria = null;
let graficoDespesasCategoria = null;

// Ícones globais para gráficos de categoria (evita ReferenceError)
const icones = [
    'shopping_cart', 'home', 'check_circle', 'star', 'payments', 'attach_money', 'local_offer', 'category'
];

// Gráfico de receitas por categoria com lista lateral de categorias (estilo gráfico 2)
function carregarGraficoReceitasPorCategoria(uid, receitas) {
    console.log('[Home] Montando gráfico de receitas por categoria...');
    let categorias = {};
    let total = 0;
    let categoriaIcones = {}; // Mapeia categoria -> ícone

    receitas.forEach(receita => {
        if (receita.categoria) {
            const valor = parseValueToNumber(receita.valor || '0'); // Usar a função correta
            categorias[receita.categoria] = (categorias[receita.categoria] || 0) + valor;
            total += valor;
            // Captura o ícone personalizado se existir
            if (receita.iconeCategoria) {
                categoriaIcones[receita.categoria] = receita.iconeCategoria;
            } else if (receita.icone) {
                categoriaIcones[receita.categoria] = receita.icone;
            }
        }
    });

    const labels = Object.keys(categorias);
    const data = Object.values(categorias);

    // DESTROI O GRÁFICO ANTERIOR SE EXISTIR
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

        // Monta lista lateral de categorias com barra de progresso, ícone, valor e %
        const listaCategorias = document.getElementById('lista-categorias-receitas');
        if (listaCategorias) {
            listaCategorias.innerHTML = '';
            labelsOrdenadas.forEach((cat, idx) => {
                const valor = dataOrdenada[idx];
                const percent = total > 0 ? Math.round((valor / total) * 100) : 0;
                const cor = tonsVerde[idx % tonsVerde.length];
                // Busca ícone personalizado, senão usa padrão
                let icone = categoriaIcones[cat] || obterIconePorCategoria(cat, 'receita');
                // Se for um ícone padrão, pode usar material-icons-round, senão material-symbols-outlined
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
                    </div>
                `;
            });
        }

        if (containerReceitas) containerReceitas.style.display = 'flex';
        if (vazioReceitas) vazioReceitas.style.display = 'none';
        console.log('[Home] Gráfico de receitas por categoria criado.');
    } else {
        if (containerReceitas) containerReceitas.style.display = 'none';
        if (vazioReceitas) vazioReceitas.style.display = 'flex';
        const listaCategorias = document.getElementById('lista-categorias-receitas');
        if (listaCategorias) listaCategorias.innerHTML = '';
        console.log('[Home] Nenhuma receita para gráfico de categoria.');
    }
}

// Gráfico de despesas por categoria com lista lateral de categorias (estilo gráfico 2)
function carregarGraficoDespesasPorCategoria(uid, despesas) {
    console.log('[Home] Montando gráfico de despesas por categoria...');
    let categorias = {};
    let total = 0;
    let categoriaIcones = {}; // Mapeia categoria -> ícone salvo
    despesas.forEach(despesa => {
        if (despesa.categoria) {
            const valor = parseValueToNumber(despesa.valor || '0'); // Usar a função correta
            categorias[despesa.categoria] = (categorias[despesa.categoria] || 0) + valor;
            total += valor;
            // Captura o ícone personalizado se existir
            if (despesa.iconeCategoria) {
                categoriaIcones[despesa.categoria] = despesa.iconeCategoria;
            } else if (despesa.icone) {
                categoriaIcones[despesa.categoria] = despesa.icone;
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
                responsive: true,
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
                // Usa o ícone salvo na transação da categoria, senão um fallback mapeado pela categoria
                const icone = categoriaIcones[cat] || obterIconePorCategoria(cat, 'despesa');
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
                    </div>
                `;
                listaCategorias.appendChild(item);
            });
        }

        if (containerDespesas) containerDespesas.style.display = 'flex';
        if (vazioDespesas) vazioDespesas.style.display = 'none';
        console.log('[Home] Gráfico de despesas por categoria criado.');
    } else {
        if (containerDespesas) containerDespesas.style.display = 'none';
        if (vazioDespesas) vazioDespesas.style.display = 'flex';
        const listaCategorias = document.getElementById('lista-categorias-despesas');
        if (listaCategorias) listaCategorias.innerHTML = '';
        console.log('[Home] Nenhuma despesa para gráfico de categoria.');
    }
}

// Função para calcular saldo de uma conta específica incluindo receitas e despesas vinculadas
async function calcularSaldoConta(uid, contaId, mesSelecionado, anoSelecionado) {
    try {
        // Buscar a conta
        const contaDoc = await firebase.firestore().collection('contas').doc(contaId).get();
        if (!contaDoc.exists) return 0;
        
        const conta = contaDoc.data();
        let saldoInicial = parseFloat(conta.saldoInicial || conta.saldo || 0);
        
        // Buscar receitas vinculadas à conta pelo nome no mês/ano selecionado
        const receitasSnapshot = await firebase.firestore().collection('receitas')
            .where('userId', '==', uid)
            .get();
            
        let totalReceitas = 0;
        receitasSnapshot.forEach(doc => {
            const receita = doc.data();
            
            // Verificar se a receita pertence a esta conta (por nome)
            const pertenceAConta = receita.conta && receita.conta.nome === conta.nome;
            
            if (pertenceAConta) {
                const efetivada = receita.recebido !== false;
                const isDoMesSelecionado = isDataNoMesSelecionado(receita.data, mesSelecionado, anoSelecionado);
                
                if (efetivada && isDoMesSelecionado) {
                    const valor = parseValueToNumber(receita.valor);
                    totalReceitas += valor;
                }
            }
        });
        
        // Buscar despesas vinculadas à conta pelo nome no mês/ano selecionado
        const despesasSnapshot = await firebase.firestore().collection('despesas')
            .where('userId', '==', uid)
            .get();
            
        let totalDespesas = 0;
        despesasSnapshot.forEach(doc => {
            const despesa = doc.data();
            
            // Verificar se a despesa pertence a esta conta (por nome da carteira)
            const pertenceAConta = despesa.carteira && despesa.carteira.nome === conta.nome;
            
            if (pertenceAConta) {
                const efetivada = despesa.pago !== false;
                const isDoMesSelecionado = isDataNoMesSelecionado(despesa.data, mesSelecionado, anoSelecionado);
                
                if (efetivada && isDoMesSelecionado) {
                    const valor = parseValueToNumber(despesa.valor);
                    totalDespesas += valor;
                }
            }
        });
        
        // Calcular saldo atual da conta
        const saldoAtual = saldoInicial + totalReceitas - totalDespesas;
        
        return saldoAtual;
        
    } catch (error) {
        console.error('[ERRO] Falha ao calcular saldo da conta:', error);
        return 0;
    }
}

// Renderiza contas e esconde/mostra cartão vazio
async function carregarContasHome(uid) {
    console.log('[Home] Buscando contas para o usuário:', uid);
    try {
        const snapshot = await firebase.firestore().collection('contas')
            .where('userId', '==', uid)
            .get();
            
        let contas = [];
        snapshot.forEach(doc => {
            const conta = { ...doc.data(), id: doc.id };
            contas.push(conta);
            
            // Salvar conta no cache local
            salvarContaNoCache(conta);
        });
        
        // ORDENA por nome (opcional, mas deixa igual ao select de contas)
        contas.sort((a, b) => {
            const nomeA = (a.nome || a.descricao || '').toLowerCase();
            const nomeB = (b.nome || b.descricao || '').toLowerCase();
            return nomeA.localeCompare(nomeB);
        });
        console.log('[Home] Total de contas carregadas:', contas.length, contas);

        const container = document.getElementById('container-contas-home');
        const vazio = document.getElementById('cartao-estado-vazio-contas');
        const botaoNovaContaContainer = document.getElementById('botao-nova-conta-container');
        container.innerHTML = '';
        
        if (contas.length === 0) {
            vazio.style.display = 'block';
            if (botaoNovaContaContainer) botaoNovaContaContainer.style.display = 'none';
        } else {
            vazio.style.display = 'none';
            if (botaoNovaContaContainer) botaoNovaContaContainer.style.display = 'flex';
            
            // Processar cada conta individualmente para calcular seu saldo
            for (const conta of contas) {
                // Calcular saldo atual da conta incluindo receitas e despesas
                const saldoAtual = await calcularSaldoConta(uid, conta.id, mesSelecionado, anoSelecionado);
                
                const div = document.createElement('div');
                div.className = 'conta-home-card-ux';
                div.setAttribute('data-conta-id', conta.id); // Adicionar identificador
                
                // Verificar se deve usar SVG ou ícone material
                let iconeSvg = obterIconeBanco(conta);

                // Força Nubank a sempre usar SVG mesmo se não houver conta.icone
                if (!iconeSvg && conta.banco === 'Nubank') {
                    iconeSvg = bancosIcones['Nubank'];
                }

                if (iconeSvg) {
                    // Usar SVG do banco
                    div.innerHTML = `
                        <div class="conta-ux-esquerda">
                            <div class="conta-ux-icone conta-ux-icone-svg" style="
                                background: ${conta.cor || '#21C25E'} !important;
                                background-image: none !important;
                                border: none !important;
                                border-radius: 50% !important;
                                width: 54px !important;
                                height: 54px !important;
                                display: flex !important; 
                                align-items: center !important; 
                                justify-content: center !important;
                                box-shadow: 0 4px 16px rgba(33,194,94,0.10);">
                                <img src="${iconeSvg}" alt="${conta.banco || 'Banco'}" style="
                                    width: 32px; 
                                    height: 32px; 
                                    object-fit: contain;
                                ">
                            </div>
                            <div class="conta-ux-info">
                                <div class="conta-ux-nome" title="${conta.nome || conta.descricao || 'Conta'}">${conta.nome || conta.descricao || 'Conta'}</div>
                                <div class="conta-ux-tipo">${conta.tipo || 'Conta bancária'}</div>
                            </div>
                        </div>
                        <div class="conta-ux-direita">
                            <div class="conta-ux-saldo" title="Saldo atual">${saldoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                            <button class="botao-excluir-conta" data-conta-id="${conta.id}" title="Excluir conta" aria-label="Excluir conta">
                                <span class="material-icons-round">delete</span>
                        </div>
                    `;
                } else {
                    // Usar ícone material original
                    div.innerHTML = `
                        <div class="conta-ux-esquerda">
                            <div class="conta-ux-icone" style="
                                background: linear-gradient(135deg, ${conta.cor || '#e8f5ee'} 60%, #fff 100%);
                                box-shadow: 0 4px 16px rgba(33,194,94,0.10);
                                border: 2px solid ${conta.cor || '#21C25E22'};
                                display: flex; align-items: center; justify-content: center;">
                                <span class="material-icons-round" style="
                                    color:${conta.corIcone || '#21C25E'};
                                    font-size:2.4rem;
                                    filter: drop-shadow(0 2px 4px rgba(33,194,94,0.10));
                                    ">
                                    ${conta.iconeBanco || conta.icone || 'account_balance_wallet'}
                                </span>
                                </div>
                                <div class="conta-ux-info">
                                <div class="conta-ux-nome" title="${conta.nome || conta.descricao || 'Conta'}">${conta.nome || conta.descricao || 'Conta'}</div>
                                <div class="conta-ux-tipo">${conta.tipo || 'Conta bancária'}</div>
                            </div>
                        </div>
                        <div class="conta-ux-direita">
                            <div class="conta-ux-saldo" title="Saldo atual">${saldoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                            <button class="botao-excluir-conta" data-conta-id="${conta.id}" title="Excluir conta" aria-label="Excluir conta">
                                <span class="material-icons-round">delete</span>
                            </button>
                        </div>
                    `;
                }
                
                div.style.opacity = 0;
                div.style.transform = 'translateY(18px) scale(0.98)';
                setTimeout(() => {
                    div.style.transition = 'opacity 0.5s, transform 0.5s';
                    div.style.opacity = 1;
                    div.style.transform = 'translateY(0) scale(1)';
                }, 10);
                
                // FORÇA MÁXIMA: sobrescrever qualquer evento anterior
                div.onmousedown = null;
                div.onmouseup = null; 
                div.onclick = null;
                
                // Navegação simples para detalhes da conta
                div.addEventListener('click', function(event) {
                    if (!event.target.closest('.botao-excluir-conta')) {
                        window.location.href = `../Detalhes-Conta/Detalhes-Conta.html?conta=${conta.id}`;
                    }
                });
                
                // Backup adicional
                div.setAttribute('data-redirect-url', `../Detalhes-Conta/Detalhes-Conta.html?conta=${conta.id}`);
                
                // Adicionar estilo de cursor para indicar que é clicável
                div.style.cursor = 'pointer';
                
                // Backup onclick ainda mais direto
                div.onclick = function(event) {
                    if (!event.target.closest('.botao-excluir-conta')) {
                        const url = this.getAttribute('data-redirect-url');
                        if (url) {
                            console.log('[ONCLICK-BACKUP] Redirecionando para:', url);
                            document.location = url;
                        }
                        return false;
                    }
                };
                
                container.appendChild(div);
            }
        }
        // Chame também o carregamento dos cartões de crédito aqui
        carregarCartoesCreditoHome(uid);
        
    } catch (error) {
        console.error('[Home] Erro ao buscar contas:', error);
    }
}// Exemplo de carregamento de cartões de crédito
function carregarCartoesCreditoHome(uid) {
    console.log('[Home] Buscando cartões de crédito para o usuário:', uid);
    // Tenta buscar, mas trata erro de permissão de forma amigável
    firebase.firestore().collection('cartoes')
        .where('userId', '==', uid)
        .get()
        .then(snapshot => {
            let cartoes = [];
            snapshot.forEach(doc => {
                cartoes.push({ ...doc.data(), id: doc.id });
            });
            console.log('[Home] Total de cartões de crédito carregados:', cartoes.length);
            // Aqui você pode renderizar os cartões na tela, se desejar
        })
        .catch(error => {
            if (
                error.code === 'permission-denied' ||
                (error.message && error.message.includes('Missing or insufficient permissions'))
            ) {
                console.warn('[Home] Permissão insuficiente para buscar cartões de crédito. Coleção "cartoes" não está acessível para este usuário.');
            } else {
                console.error('[Home] Erro ao buscar cartões de crédito:', error);
            }
        });
}

// Eventos para popup de exclusão de conta (mantém apenas este listener global)
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

// UX: Animação ao adicionar/remover contas/despesas/receitas
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

// UX: Mensagem amigável se não houver dados
function mostrarMensagemVazia(container, mensagem, icone = 'info') {
    if (!container) return;
    container.innerHTML = `
        <div style="text-align:center;padding:40px 0;color:#888;">
            <span class="material-icons-round" style="font-size:48px;margin-bottom:12px;opacity:0.4;">${icone}</span>
            <div style="font-size:1.1rem;">${mensagem}</div>
        </div>
    `;
}

// Função para obter o mês atual no formato MM/YYYY
function getMesAnoAtual() {
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();
    return `${mes}/${ano}`;
}

// Função para verificar se uma data está no mês atual
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

// Função para calcular o saldo total do mês atual
async function calcularSaldoTotalMesAtual(uid) {
    try {
        let saldoInicialContas = 0;
        let totalReceitasEfetivadas = 0;
        let totalDespesasEfetivadas = 0;
        let totalTransferenciasEntrada = 0;
        let totalTransferenciasSaida = 0;

        console.log('[Home] Iniciando cálculo do saldo atual...');

        // 1. Buscar contas ativas que devem ser incluídas na soma
        const contasSnapshot = await firebase.firestore().collection('contas')
            .where('userId', '==', uid)
            .get();

        contasSnapshot.forEach(doc => {
            const conta = doc.data();
            // Verificar se a conta está ativa e deve ser incluída na soma
            const contaAtiva = conta.ativa !== false; // Por padrão, ativa se não especificado
            const incluirNaSoma = conta.incluirNaSoma !== false;
            
            if (contaAtiva && incluirNaSoma) {
                const saldoInicial = parseFloat(conta.saldoInicial || conta.saldo || 0);
                saldoInicialContas += saldoInicial;
                console.log(`[Home] Conta ${conta.nome}: Saldo Inicial = ${saldoInicial}, Incluir na soma: ${incluirNaSoma}`);
            } else {
                console.log(`[Home] Conta ${conta.nome}: Excluída da soma (ativa: ${contaAtiva}, incluir: ${incluirNaSoma})`);
            }
        });

        // 2. Buscar receitas efetivadas do mês/ano selecionado
        const receitasSnapshot = await firebase.firestore().collection('receitas')
            .where('userId', '==', uid)
            .get();

        receitasSnapshot.forEach(doc => {
            const receita = doc.data();
            // Consideramos efetivada se recebido === true ou concluida === true
            const efetivada = receita.recebido === true || receita.concluida === true;
            
            // Verificar se a receita é do mês/ano selecionado
            const dataReceita = receita.data;
            const isDoMesSelecionado = isDataNoMesSelecionado(dataReceita, mesSelecionado, anoSelecionado);
            
            if (efetivada && isDoMesSelecionado) {
                const valor = parseValueToNumber(receita.valor);
                totalReceitasEfetivadas += valor;
                console.log(`[Home] Receita efetivada do mês ${mesSelecionado+1}/${anoSelecionado}: ${receita.descricao} = R$ ${valor.toFixed(2)}`);
            }
        });

        // 3. Buscar despesas efetivadas do mês/ano selecionado
        const despesasSnapshot = await firebase.firestore().collection('despesas')
            .where('userId', '==', uid)
            .get();

        despesasSnapshot.forEach(doc => {
            const despesa = doc.data();
            // Consideramos efetivada se pago === true ou concluida === true
            const efetivada = despesa.pago === true || despesa.concluida === true;
            
            // Verificar se a despesa é do mês/ano selecionado
            const dataDespesa = despesa.data;
            const isDoMesSelecionado = isDataNoMesSelecionado(dataDespesa, mesSelecionado, anoSelecionado);
            
            if (efetivada && isDoMesSelecionado) {
                const valor = parseValueToNumber(despesa.valor);
                totalDespesasEfetivadas += valor;
                console.log(`[Home] Despesa efetivada do mês ${mesSelecionado+1}/${anoSelecionado}: ${despesa.descricao} = R$ ${valor.toFixed(2)}`);
            }
        });

        // 4. Buscar transferências do mês/ano selecionado
        const transferenciasSnapshot = await firebase.firestore().collection('transferencias')
            .where('userId', '==', uid)
            .get();

        transferenciasSnapshot.forEach(doc => {
            const transferencia = doc.data();
            
            // Verificar se a transferência é do mês/ano selecionado
            const dataTransferencia = transferencia.data;
            const isDoMesSelecionado = isDataNoMesSelecionado(dataTransferencia, mesSelecionado, anoSelecionado);
            
            if (isDoMesSelecionado) {
                const valor = parseValueToNumber(transferencia.valor);
                
                if (transferencia.tipo === 'entrada') {
                    totalTransferenciasEntrada += valor;
                    console.log(`[Home] Transferência entrada do mês ${mesSelecionado+1}/${anoSelecionado}: R$ ${valor.toFixed(2)}`);
                } else if (transferencia.tipo === 'saida') {
                    totalTransferenciasSaida += valor;
                    console.log(`[Home] Transferência saída do mês ${mesSelecionado+1}/${anoSelecionado}: R$ ${valor.toFixed(2)}`);
                }
            }
        });

        // 5. Aplicar a fórmula: Saldo atual = Saldo Inicial + (Receitas + Transf. Entrada) - (Despesas + Transf. Saída)
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
            console.error('[Home] Elemento .valor-saldo não encontrado no DOM');
        }

        console.log(`[Home] === CÁLCULO DO SALDO PARA ${mesSelecionado+1}/${anoSelecionado} ===`);
        console.log(`[Home] Saldo Inicial das Contas: ${saldoInicialContas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
        console.log(`[Home] Receitas Efetivadas: ${totalReceitasEfetivadas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
        console.log(`[Home] Transferências Entrada: ${totalTransferenciasEntrada.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
        console.log(`[Home] Despesas Efetivadas: ${totalDespesasEfetivadas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
        console.log(`[Home] Transferências Saída: ${totalTransferenciasSaida.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
        console.log(`[Home] SALDO ATUAL: ${saldoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`);
        console.log(`[Home] ============================================`);

        // Atualizar indicador vs mês anterior
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

// Função auxiliar para converter valores para número (reutilizar da Lista de Receitas)
function parseValueToNumber(value) {
    if (typeof value === 'number') {
        return value;
    }
    
    if (typeof value === 'string') {
        // Remove símbolos de moeda e espaços
        let cleanValue = value.replace(/[R$\s]/g, '');
        
        // Se tem ponto e vírgula, o ponto é separador de milhares
        if (cleanValue.includes('.') && cleanValue.includes(',')) {
            cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
        }
        // Se tem apenas vírgula, ela é o separador decimal
        else if (cleanValue.includes(',') && !cleanValue.includes('.')) {
            cleanValue = cleanValue.replace(',', '.');
        }
        // Se tem apenas ponto
        else if (cleanValue.includes('.') && !cleanValue.includes(',')) {
            const parts = cleanValue.split('.');
            if (parts.length === 2 && parts[1].length <= 2) {
                // É decimal: 10.50
                cleanValue = cleanValue;
            } else {
                // É separador de milhares: 1.000 -> 1000
                cleanValue = cleanValue.replace(/\./g, '');
            }
        }
        
        const numValue = parseFloat(cleanValue) || 0;
        return numValue;
    }
    
    return 0;
}

// Função para verificar se uma data está no mês/ano selecionado
function isDataNoMesSelecionado(dataStr, mes, ano) {
    if (!dataStr) return false;
    
    let dataObj;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataStr)) {
        const [dia, mesStr, anoStr] = dataStr.split('/');
        // Converter mês para base 0 (janeiro = 0, dezembro = 11)
        const mesNumerico = parseInt(mesStr, 10) - 1;
        dataObj = new Date(parseInt(anoStr, 10), mesNumerico, parseInt(dia, 10));
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
        const [anoStr, mesStr, dia] = dataStr.split('-');
        // Converter mês para base 0
        const mesNumerico = parseInt(mesStr, 10) - 1;
        dataObj = new Date(parseInt(anoStr, 10), mesNumerico, parseInt(dia, 10));
    } else {
        return false;
    }
    
    return dataObj.getMonth() === mes && dataObj.getFullYear() === ano;
}

// UX: Toast para feedback rápido
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

// Função para calcular e exibir o valor total das receitas do mês selecionado
function calcularValorTotalReceitas(uid) {
    firebase.firestore().collection('receitas')
        .where('userId', '==', uid)
        .get()
        .then(snapshot => {
            let total = 0;
            snapshot.forEach(doc => {
                const receita = doc.data();
                // Verificar se está efetivada e é do mês selecionado
                const efetivada = receita.recebido !== false;
                const isDoMesSelecionado = isDataNoMesSelecionado(receita.data, mesSelecionado, anoSelecionado);
                
                if (efetivada && isDoMesSelecionado) {
                    const valor = parseValueToNumber(receita.valor);
                    total += valor;
                    console.log(`[Home] Receita do mês ${mesSelecionado+1}/${anoSelecionado}: ${receita.descricao} = R$ ${valor.toFixed(2)}`);
                }
            });
            
            console.log(`[Home] Total de receitas do mês ${mesSelecionado+1}/${anoSelecionado}: R$ ${total.toFixed(2)}`);
            const el = document.querySelectorAll('.valor-receitas');
            el.forEach(e => e.textContent = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
        })
        .catch(error => {
            console.error('[Home] Erro ao calcular receitas:', error);
        });
}

// Função para calcular e exibir o valor total das despesas do mês selecionado
function calcularValorTotalDespesas(uid) {
    firebase.firestore().collection('despesas')
        .where('userId', '==', uid)
        .get()
        .then(snapshot => {
            let total = 0;
            snapshot.forEach(doc => {
                const despesa = doc.data();
                // Verificar se está efetivada e é do mês selecionado
                const efetivada = despesa.pago !== false;
                const isDoMesSelecionado = isDataNoMesSelecionado(despesa.data, mesSelecionado, anoSelecionado);
                
                if (efetivada && isDoMesSelecionado) {
                    const valor = parseValueToNumber(despesa.valor);
                    total += valor;
                    console.log(`[Home] Despesa do mês ${mesSelecionado+1}/${anoSelecionado}: ${despesa.descricao} = R$ ${valor.toFixed(2)}`);
                }
            });
            
            console.log(`[Home] Total de despesas do mês ${mesSelecionado+1}/${anoSelecionado}: R$ ${total.toFixed(2)}`);
            const el = document.querySelectorAll('.valor-despesas');
            el.forEach(e => e.textContent = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
        })
        .catch(error => {
            console.error('[Home] Erro ao calcular despesas:', error);
        });
}

// Função para atualizar indicador de saldo vs mês anterior
async function atualizarIndicadorSaldo(uid, saldoAtual) {
    try {
        const hoje = new Date();
        let mesAnterior = mesSelecionado - 1;
        let anoAnterior = anoSelecionado;
        
        if (mesAnterior < 0) {
            mesAnterior = 11;
            anoAnterior = anoSelecionado - 1;
        }

        // Calcular saldo do mês anterior
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
            // Filtrar contas ativas no código JavaScript
            if (conta.ativa !== false) {
                const saldoInicial = parseValueToNumber(conta.saldoInicial || 0);
                saldoInicialContas += saldoInicial;
            }
        });

        // Buscar receitas do mês anterior
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

        // Buscar despesas do mês anterior
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

        // Buscar transferências do mês anterior
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
        
        // Calcular variação percentual
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
            indicadorText.textContent = `${variacaoAbs.toFixed(1)}% vs mês anterior`;
        }

        console.log(`[Home] Indicador atualizado: ${variacao.toFixed(1)}% vs mês anterior`);

    } catch (error) {
        console.error('[Home] Erro ao calcular indicador de saldo:', error);
    }
}

// ATENÇÃO: Para resolver os erros de permissão do Firestore, você precisa ajustar as regras de segurança do Firestore no console do Firebase.
// Siga o passo a passo abaixo:

/*
1. Acesse o console do Firebase: https://console.firebase.google.com/
2. No menu lateral, clique em "Firestore Database" e depois na aba "Regras".
3. Para desenvolvimento, use temporariamente as regras abaixo para permitir acesso apenas a usuários autenticados:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}

4. Clique em "Publicar" para salvar as regras.

5. Para produção, utilize regras mais restritivas, por exemplo:

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

IMPORTANTE: Nunca deixe as regras abertas (allow read, write: if true) em produção!
*/

// [FUNÇÃO REMOVIDA - DUPLICADA]

// [CÓDIGO DO MUTATIONOBSERVER REMOVIDO - USANDO EVENTO DIRETO]

// ===== SISTEMA DE NOTIFICAÇÕES =====

// Configuração das notificações
const notificacoesConfig = {
    maxNotificacoes: 50,
    tiposIcones: {
        receita: 'trending_up',
        despesa: 'trending_down', 
        lembrete: 'schedule',
        sistema: 'info'
    }
};

// Gerenciador de notificações
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
        
        // Carregar notificações
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
        document.querySelector('.btn-marcar-todas-lidas')?.addEventListener('click', () => {
            this.marcarTodasComoLidas();
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
            // Se não há usuário ou Firebase, carregar apenas do localStorage
            this.carregarNotificacoesLocal();
            return;
        }

        this.mostrarLoading();

        try {
            // Carregar notificações do Firebase
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

            // Carregar também notificações do localStorage
            this.carregarNotificacoesLocal(false); // false = não limpar as notificações já carregadas

            // Ordenar no cliente por dataHora (mais recente primeiro)
            this.notificacoes.sort((a, b) => {
                const dataA = a.dataHora?.toDate ? a.dataHora.toDate() : new Date(a.dataHora || a.timestamp || 0);
                const dataB = b.dataHora?.toDate ? b.dataHora.toDate() : new Date(b.dataHora || b.timestamp || 0);
                return dataB - dataA;
            });

            this.renderizarNotificacoes();
            this.atualizarBadge();

        } catch (error) {
            console.error('Erro ao carregar notificações:', error);
            // Em caso de erro, carregar pelo menos do localStorage
            this.carregarNotificacoesLocal();
        }
    }

    // Nova função para carregar notificações do localStorage
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
            console.error('Erro ao carregar notificações do localStorage:', error);
        }
    }

    mostrarLoading() {
        const content = document.querySelector('.notificacoes-content');
        if (!content) return;

        content.innerHTML = `
            <div class="notificacoes-loading">
                <div class="loading-spinner"></div>
                <p>Carregando notificações...</p>
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
            content.innerHTML = `
                <div class="notificacoes-vazio">
                    <span class="material-icons-round">notifications_none</span>
                    <p>Nenhuma notificação</p>
                    <small>Suas notificações aparecerão aqui</small>
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
        const tempo = this.formatarTempo(notificacao.dataHora);
        const icone = notificacoesConfig.tiposIcones[notificacao.tipo] || 'info';
        // Todas as notificações são não lidas (classe sempre aplicada)
        
        return `
            <div class="notificacao-item nao-lida" data-id="${notificacao.id}">
                <div class="notificacao-icone ${notificacao.tipo}">
                    <span class="material-icons-round">${icone}</span>
                </div>
                <div class="notificacao-conteudo">
                    <div class="notificacao-titulo">${notificacao.titulo}</div>
                    <div class="notificacao-descricao">${notificacao.descricao}</div>
                    <div class="notificacao-meta">
                        <span class="notificacao-tempo">${tempo}</span>
                        ${notificacao.valor ? `<span class="notificacao-valor">${notificacao.valor}</span>` : ''}
                    </div>
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
            // Em vez de atualizar, vamos deletar a notificação
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
            console.error('Erro ao remover notificação:', error);
        }
    }

    async marcarTodasComoLidas() {
        if (this.naoLidas === 0) return;

        try {
            const batch = db.batch();
            
            // Deletar todas as notificações não lidas
            this.notificacoes.forEach(notificacao => {
                if (!notificacao.lida) {
                    const docRef = db.collection('notificacoes').doc(notificacao.id);
                    batch.delete(docRef);
                }
            });

            await batch.commit();
            
            // Remover da lista local
            this.notificacoes = this.notificacoes.filter(n => n.lida);
            this.naoLidas = 0;
            this.atualizarBadge();
            this.renderizarNotificacoes();

        } catch (error) {
            console.error('Erro ao remover todas as notificações:', error);
        }
    }

    processarAcaoNotificacao(id) {
        const notificacao = this.notificacoes.find(n => n.id === id);
        if (!notificacao || !notificacao.acao) return;

        // Fechar painel
        this.fecharPainel();

        // Processar ação baseada no tipo
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
        
        // Carregar notificações atualizadas
        this.carregarNotificacoes();
        
        // Verificar se há notificações antigas/de exemplo para limpar
        this.verificarLimpezaNotificacoes();
    }

    // Verificar e limpar notificações desnecessárias
    async verificarLimpezaNotificacoes() {
        if (!usuario || !db) return;

        try {
            const snapshot = await db.collection('notificacoes')
                .where('userId', '==', usuario.uid)
                .get();

            const notificacoesParaRemover = [];
            
            snapshot.forEach(doc => {
                const data = doc.data();
                // Remover apenas notificações de exemplo antigas específicas
                const isNotificacaoExemplo = 
                    (data.titulo === 'Bem-vindo ao Poup+!' && data.descricao?.includes('aplicação financeira está configurada')) ||
                    (data.titulo === 'Lembrete de Pagamento' && data.descricao?.includes('conta de luz até sexta-feira')) ||
                    (data.titulo === 'Receita Adicionada' && data.descricao?.includes('Salário foi adicionado')) ||
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
                console.log(`${notificacoesParaRemover.length} notificações de exemplo removidas`);
                
                // Recarregar após limpeza
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

    // Métodos públicos para criar notificações
    async criarNotificacao(dados) {
        if (!usuario || !db) return;

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
            
            // Limpar notificações antigas (mais de 7 dias)
            this.limparNotificacoesAntigas();
            
            // Recarregar notificações se o painel estiver aberto
            if (this.overlay && this.overlay.classList.contains('show')) {
                this.carregarNotificacoes();
            } else {
                // Apenas atualizar o badge
                this.naoLidas++;
                this.atualizarBadge();
            }

        } catch (error) {
            console.error('Erro ao criar notificação:', error);
        }
    }

    // Função para limpar notificações antigas automaticamente
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
                console.log(`${snapshot.size} notificações antigas removidas`);
            }

        } catch (error) {
            console.error('Erro ao limpar notificações antigas:', error);
        }
    }

    // Métodos de conveniência para tipos específicos
    async notificarReceita(receita) {
        await this.criarNotificacao({
            titulo: 'Nova Receita Adicionada',
            descricao: `${receita.descricao} foi adicionada à sua conta`,
            tipo: 'receita',
            valor: `+${receita.valor}`,
            acao: {
                tipo: 'navegacao',
                url: '../Lista-de-receitas/Lista-de-receitas.html'
            }
        });
    }

    async notificarDespesa(despesa) {
        await this.criarNotificacao({
            titulo: 'Nova Despesa Adicionada',
            descricao: `${despesa.descricao} foi adicionada à sua conta`,
            tipo: 'despesa',
            valor: `-${despesa.valor}`,
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

// Instância global do gerenciador
let notificacoesManager = null;

// Inicializar quando o usuário estiver autenticado
function inicializarNotificacoes() {
    if (usuario && !notificacoesManager) {
        notificacoesManager = new NotificacoesManager();
        
        // Disponibilizar globalmente
        window.notificacoesManager = notificacoesManager;
        
        // Gerar notificações baseadas nos dados reais após carregar
        setTimeout(() => {
            if (notificacoesManager) {
                gerarNotificacoesBasedadosReais();
            }
        }, 3000);
    }
}

// Função para gerar notificações baseadas nos dados reais da conta
async function gerarNotificacoesBasedadosReais() {
    if (!usuario || !db || !notificacoesManager) return;
    
    try {
        // Verificar se já existem notificações para evitar duplicatas
        const notificacoesExistentes = await db.collection('notificacoes')
            .where('userId', '==', usuario.uid)
            .get();
            
        if (!notificacoesExistentes.empty) {
            console.log('Notificações já existem, não criando novas');
            return;
        }

        // Carregar receitas recentes (últimos 7 dias)
        const seteDiasAtras = new Date();
        seteDiasAtras.setDate(seteDiasAtras.getDate() - 7);
        
        const receitasSnapshot = await db.collection('receitas')
            .where('userId', '==', usuario.uid)
            .get();
            
        const despesasSnapshot = await db.collection('despesas')
            .where('userId', '==', usuario.uid)
            .get();

        // Criar notificações para receitas recentes
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

        // Criar notificações para despesas recentes
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

        // Criar notificação de resumo se houver atividade
        if (receitasRecentes > 0) {
            await notificacoesManager.criarNotificacao({
                titulo: 'Receitas Adicionadas',
                descricao: `Você adicionou ${receitasRecentes} receita${receitasRecentes > 1 ? 's' : ''} nos últimos 7 dias`,
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
                descricao: `Você registrou ${despesasRecentes} despesa${despesasRecentes > 1 ? 's' : ''} nos últimos 7 dias`,
                tipo: 'despesa',
                acao: {
                    tipo: 'navegacao',
                    url: '../Lista-de-despesas/Lista-de-despesas.html'
                }
            });
        }

        // Notificação de boas-vindas se for primeiro acesso
        if (receitasRecentes === 0 && despesasRecentes === 0) {
            await notificacoesManager.criarNotificacao({
                titulo: 'Bem-vindo ao Poup+',
                descricao: 'Comece adicionando suas receitas e despesas para ter controle total das suas finanças',
                tipo: 'sistema'
            });
        }

        // Verificar contas sem movimentação recente
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
        console.error('Erro ao gerar notificações baseadas em dados reais:', error);
    }
}

// Disponibilizar o notificacoesManager globalmente para outras páginas
window.notificacoesManager = notificacoesManager;