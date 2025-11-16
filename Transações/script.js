// --- CONFIGURAÇÃO E VARIÁVEIS GLOBAIS ---
const db = firebase.firestore();
const auth = firebase.auth();

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let currentUser = null;
let despesaParaExcluirId = null;
let authInitialized = false; // Evitar inicialização dupla

// MAPEAMENTO DE CATEGORIAS ESPECÍFICAS PARA CARTÃO DE CRÉDITO
const categoryDetails = {
    'compras online': { icon: 'shopping_cart', background: '#e91e63' },
    'shopping': { icon: 'local_mall', background: '#9c27b0' },
    'restaurantes': { icon: 'restaurant', background: '#ff5722' },
    'combustível': { icon: 'local_gas_station', background: '#607d8b' },
    'viagem': { icon: 'flight', background: '#00bcd4' },
    'assinaturas': { icon: 'subscriptions', background: '#795548' },
    'farmácia': { icon: 'local_pharmacy', background: '#4caf50' },
    'entretenimento': { icon: 'movie', background: '#f44336' },
    'supermercado': { icon: 'storefront', background: '#8bc34a' },
    'transporte': { icon: 'local_taxi', background: '#ffeb3b' },
    'hospedagem': { icon: 'hotel', background: '#3f51b5' },
    'roupas': { icon: 'shopping_bag', background: '#e91e63' },
    'eletrônicos': { icon: 'devices', background: '#2196f3' },
    'beleza': { icon: 'spa', background: '#ff4081' },
    'educação': { icon: 'library_books', background: '#9c27b0' },
    'saúde': { icon: 'local_hospital', background: '#4caf50' },
    'pet shop': { icon: 'pets', background: '#ff9800' },
    'pagamento de contas': { icon: 'payment', background: '#795548' },
    'delivery': { icon: 'delivery_dining', background: '#f44336' },
    'academia': { icon: 'fitness_center', background: '#4caf50' },
    'default': { icon: 'credit_card', background: '#D32F2F' }
};

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

let todasTransacoes = [];
let mapaCartoes = {};
let mapaContas = {};

// Configurar menu adicionar
function configurarMenuAdicionar() {
    const botaoAdicionarMenu = document.getElementById('botao-adicionar-transacoes');
    const menuAdicionar = document.getElementById('menu-adicionar-transacoes');
    
    if (botaoAdicionarMenu && menuAdicionar) {
        botaoAdicionarMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            if (menuAdicionar.style.display === 'none' || !menuAdicionar.style.display) {
                menuAdicionar.style.display = 'block';
            } else {
                menuAdicionar.style.display = 'none';
            }
        });
        
        document.addEventListener('click', (e) => {
            if (!menuAdicionar.contains(e.target) && e.target !== botaoAdicionarMenu && !botaoAdicionarMenu.contains(e.target)) {
                menuAdicionar.style.display = 'none';
            }
        });
    }
}

// --- UTILITÁRIOS DOM ---
function waitForElements(selectors, maxAttempts = 10) {
    return new Promise((resolve) => {
        let attempts = 0;
        
        function checkElements() {
            attempts++;
            const elements = selectors.map(sel => document.querySelector(sel));
            const allFound = elements.every(el => el !== null);
            
            console.log(`[Transações] Tentativa ${attempts}: Elementos encontrados:`, 
                elements.map((el, i) => `${selectors[i]}:${!!el}`).join(', '));
            
            if (allFound) {
                resolve(elements);
            } else if (attempts < maxAttempts) {
                setTimeout(checkElements, 200);
            } else {
                console.error('[Transações] Timeout aguardando elementos');
                resolve(elements); // Retorna mesmo se não encontrou todos
            }
        }
        
        checkElements();
    });
}

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    // Aguardar um tempo significativo para o DOM estar completamente pronto
    setTimeout(() => {
        initializeAuth();
    }, 1500);
});

async function initializeAuth() {
    if (authInitialized) {
        console.log('[Transações] Auth já inicializado, ignorando...');
        return;
    }
    
    if (!firebase.apps.length) {
        console.log('[Transações] Firebase não inicializado ainda, aguardando...');
        setTimeout(initializeAuth, 500);
        return;
    }
    
    authInitialized = true;
    console.log('[Transações] Inicializando auth...');
    
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            
            console.log('[Transações] Usuário autenticado, inicializando aplicação...');
            
            // Verificar se elementos existem
            const mesElement = document.getElementById('mes-atual');
            const listaElement = document.getElementById('transacoes-list');
            
            console.log('[Transações] Elementos DOM:', {
                'mes-atual': !!mesElement,
                'transacoes-list': !!listaElement
            });
            
            // Inicializar independentemente
            initializeUI();
            updateMonthDisplay();
            loadTodasTransacoes();
        } else {
            window.location.href = '../Login/Login.html';
        }
    });
}

function initializeUI() {
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => changeMonth(-1));
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => changeMonth(1));
    }
    
    configurarMenuAdicionar();
    
    setupBusca();
    setupPopupFiltros();
    
    const botaoFiltros = document.getElementById('botao-filtros');
    if (botaoFiltros) {
        botaoFiltros.addEventListener('click', () => {
            abrirPopupFiltros();
        });
    }
}

function setupBusca() {
    const botaoBusca = document.getElementById('botao-busca');
    const barraBusca = document.getElementById('barra-busca');
    const inputBusca = document.getElementById('input-busca');
    const fecharBusca = document.getElementById('fechar-busca');
    
    if (botaoBusca) {
        botaoBusca.addEventListener('click', () => {
            barraBusca.style.display = 'block';
            inputBusca.focus();
        });
    }
    
    if (fecharBusca) {
        fecharBusca.addEventListener('click', () => {
            barraBusca.style.display = 'none';
            inputBusca.value = '';
            renderTransacoes(todasTransacoes);
            updateTotals(todasTransacoes);
        });
    }
    
    if (inputBusca) {
        inputBusca.addEventListener('input', (e) => {
            buscarTransacoes(e.target.value);
        });
    }
}

function buscarTransacoes(termo) {
    if (!termo.trim()) {
        renderTodasTransacoes(todasTransacoes);
        updateTotals(todasTransacoes);
        return;
    }
    const termoLower = termo.toLowerCase();
    const filtradas = todasTransacoes.filter(t => {
        const descricao = (t.descricao || '').toLowerCase();
        const categoria = (t.categoria || '').toLowerCase();
        return descricao.includes(termoLower) || categoria.includes(termoLower);
    });
    renderTodasTransacoes(filtradas);
    updateTotals(filtradas);
}

// Carrega cartões do usuário
async function carregarCartoesUsuario() {
    if (!currentUser) return;
    try {
        const snap = await db.collection('cartoes').where('usuarioId', '==', currentUser.uid).get();
        mapaCartoes = {};
        snap.forEach(doc => {
            const data = doc.data() || {};
            const nome = data.nome || data.descricao || data.banco || 'Cartão';
            mapaCartoes[doc.id] = nome;
        });
    } catch (error) {
        console.error('Erro ao carregar cartões:', error);
    }
}

// Carrega contas do usuário
async function carregarContasUsuario() {
    if (!currentUser) return;
    try {
        const snap = await db.collection('contas').where('usuarioId', '==', currentUser.uid).get();
        mapaContas = {};
        snap.forEach(doc => {
            const data = doc.data() || {};
            const nome = data.nome || data.descricao || data.banco || 'Conta';
            mapaContas[doc.id] = nome;
        });
    } catch (error) {
        console.error('Erro ao carregar contas:', error);
    }
}

// --- NAVEGAÇÃO DE MÊS ---
function changeMonth(delta) {
    currentMonth += delta;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    } else if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    updateMonthDisplay();
    loadTodasTransacoes();
}

function updateMonthDisplay() {
    // Ajuste: o id no HTML é 'mes-atual'
    const mesEl = document.getElementById('mes-atual');
    if (mesEl) {
        mesEl.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    } else {
        console.warn('[Transações] elemento #mes-atual não encontrado ao atualizar mês');
    }
}

// Helper para converter diversos formatos de data em Date
function parseDateField(field) {
    if (!field && field !== 0) return null;
    // Firestore Timestamp-like with toDate()
    if (field && typeof field.toDate === 'function') {
        try { return field.toDate(); } catch (e) { /* fallthrough */ }
    }
    // already a Date
    if (field instanceof Date) return field;
    // number (seconds or milliseconds)
    if (typeof field === 'number') {
        // heurística: segundos se menor que 1e12
        return field > 1e12 ? new Date(field) : new Date(field * 1000);
    }
    // object with seconds property
    if (typeof field === 'object' && (field.seconds !== undefined || field._seconds !== undefined)) {
        const s = field.seconds !== undefined ? field.seconds : field._seconds;
        return new Date(Number(s) * 1000);
    }
    // string like '07/08/2025' or ISO
    if (typeof field === 'string') {
        const parts = field.split('/');
        if (parts.length === 3) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            return new Date(year, month, day);
        }
        return new Date(field);
    }
    return null;
}

// --- CARREGAR TODAS AS TRANSAÇÕES ---
async function loadTodasTransacoes() {
    if (!currentUser) return;
    
    try {
        console.log('[Transações] Carregando todas as transações...');
        
        // Carregar contas e cartões para mapear nomes
        await Promise.all([carregarContasUsuario(), carregarCartoesUsuario()]);
        
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
        
        todasTransacoes = [];
        
        // Carregar despesas regulares
        const despesasSnap = await db.collection('despesas')
            .where('userId', '==', currentUser.uid)
            .get();
        
        despesasSnap.forEach(doc => {
            const data = doc.data();
            if (data.data) {
                const dataDoc = data.data.toDate ? data.data.toDate() : new Date(data.data);
                if (dataDoc >= firstDay && dataDoc <= lastDay) {
                    todasTransacoes.push({
                        id: doc.id,
                        tipo: data.tipo === 'cartao' ? 'despesa-cartao' : 'despesa',
                        ...data
                    });
                }
            }
        });
        
        // Carregar receitas
        const receitasSnap = await db.collection('receitas')
            .where('userId', '==', currentUser.uid)
            .get();
        
        receitasSnap.forEach(doc => {
            const data = doc.data();
            if (data.data) {
                const dataDoc = data.data.toDate ? data.data.toDate() : new Date(data.data);
                if (dataDoc >= firstDay && dataDoc <= lastDay) {
                    todasTransacoes.push({
                        id: doc.id,
                        tipo: 'receita',
                        ...data
                    });
                }
            }
        });
        
        // Carregar transferências
        try {
            const transferenciasSnap = await db.collection('transferencias')
                .where('userId', '==', currentUser.uid)
                .get();
            
            transferenciasSnap.forEach(doc => {
                const data = doc.data();
                if (data.data) {
                    const dataDoc = data.data.toDate ? data.data.toDate() : new Date(data.data);
                    if (dataDoc >= firstDay && dataDoc <= lastDay) {
                        todasTransacoes.push({
                            id: doc.id,
                            tipo: 'transferencia',
                            ...data
                        });
                    }
                }
            });
        } catch (error) {
            console.log('[Transações] Coleção transferencias não existe ainda');
        }
        
        // Ordenar por data decrescente
        todasTransacoes.sort((a, b) => {
            const dateA = a.data.toDate ? a.data.toDate() : new Date(a.data);
            const dateB = b.data.toDate ? b.data.toDate() : new Date(b.data);
            return dateB - dateA;
        });
        
        console.log(`[Transações] Carregadas ${todasTransacoes.length} transações`);
        
        renderTodasTransacoes(todasTransacoes);
        updateTotals(todasTransacoes);
        
    } catch (error) {
        console.error('[Transações] Erro ao carregar transações:', error);
    }
}

// Carrega cartões do usuário uma única vez para mapear IDs em nomes
async function carregarCartoesUsuario() {
    if (!currentUser) return;
    try {
        const snap = await db.collection('cartoes').where('userId', '==', currentUser.uid).get();
        mapaCartoes = {};
        snap.forEach(doc => {
            const data = doc.data() || {};
            const nome = data.nome || data.apelido || data.banco || 'Cartão';
            mapaCartoes[doc.id] = nome;
        });
    } catch (e) {
        console.warn('Não foi possível carregar cartões para mapear nomes:', e);
    }
}

// --- RENDERIZAR TODAS AS TRANSAÇÕES ---
function renderTodasTransacoes(transacoes) {
    const lista = document.getElementById('transacoes-list');
    
    if (!lista) {
        console.error('[Transações] elemento #transacoes-list não encontrado');
        return;
    }
    
    if (!transacoes || transacoes.length === 0) {
        lista.innerHTML = `
            <div class="estado-vazio">
                <span class="material-icons-round">receipt_long</span>
                <h3>Nenhuma transação</h3>
                <p>Suas transações do mês aparecerão aqui</p>
                <button onclick="window.location.href='../Nova-Receita/Nova-Receita.html'" 
                        style="background: #21C25E; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; margin-top: 16px; margin-right: 8px;">
                    Nova Receita
                </button>
                <button onclick="window.location.href='../Nova-Despesa/Nova-Despesa.html'" 
                        style="background: #D32F2F; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600; margin-top: 16px;">
                    Nova Despesa
                </button>
            </div>
        `;
        return;
    }
    
    // Agrupar por data
    const grupos = {};
    transacoes.forEach(t => {
        let dataObj;
        if (t.data && t.data.toDate) {
            dataObj = t.data.toDate();
        } else if (t.data instanceof Date) {
            dataObj = t.data;
        } else {
            dataObj = new Date();
        }
        
        const dataKey = dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
        if (!grupos[dataKey]) grupos[dataKey] = [];
        grupos[dataKey].push({...t, dataObj});
    });
    
    let html = '';
    Object.keys(grupos).forEach(dataKey => {
        const transacoesGrupo = grupos[dataKey];
        const diaSemana = transacoesGrupo[0].dataObj.toLocaleDateString('pt-BR', { weekday: 'long' });
        const dia = transacoesGrupo[0].dataObj.getDate();
        
        html += `
            <div class="data-grupo">
                <div class="data-cabecalho">
                    <span class="data-texto">${capitalize(diaSemana)}, ${dia}</span>
                </div>
        `;
        
        transacoesGrupo.forEach(t => {
            html += criarItemTransacao(t);
        });
        
        html += `</div>`;
    });
    
    lista.innerHTML = html;
    
    // Adicionar listeners
    attachEventListeners();
}

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
                cleanValue = cleanValue;
            } else {
                cleanValue = cleanValue.replace(/\./g, '');
            }
        }
        
        const numValue = parseFloat(cleanValue) || 0;
        return numValue;
    }
    
    return 0;
}

function formatCurrency(value) {
    const numValue = Number(value) || 0;
    const formatted = numValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    return formatted;
}

function obterIconeBanco(nomeConta = '') {
    const n = (nomeConta || '').toLowerCase();
    if (!n) return '<span class="material-icons">account_balance</span>';
    if (n.includes('nubank')) return '<img src="../Icon/Nubank.svg" alt="Nubank" />';
    if (n.includes('bradesco')) return '<img src="../Icon/bradesco.svg" alt="Bradesco" />';
    if (n.includes('itau') || n.includes('itaú')) return '<img src="../Icon/itau.svg" alt="Itaú" />';
    if (n.includes('santander')) return '<img src="../Icon/santander.svg" alt="Santander" />';
    if (n.includes('caixa')) return '<img src="../Icon/caixa.svg" alt="Caixa" />';
    if (n.includes('banco do brasil') || n.includes('bb')) return '<img src="../Icon/banco-do-brasil.svg" alt="Banco do Brasil" />';
    if (n.includes('picpay')) return '<img src="../Icon/picpay.svg" alt="PicPay" />';
    return '<span class="material-icons">account_balance</span>';
}

function criarItemTransacao(transacao) {
    const categoria = (transacao.categoria || '').toLowerCase();
    let detalhes = categoryDetails[categoria] || categoryDetails['default'];
    
    const nomeCategoria = capitalize(transacao.categoria || 'Sem categoria');
    const valorFormatado = formatCurrency(parseValueToNumber(transacao.valor));
    
    let corClasse, iconeStatus, statusClasse, isPago;
    let nomeConta = '';
    let iconeConta = '';
    
    // Configurar baseado no tipo
    switch (transacao.tipo) {
        case 'receita':
            corClasse = 'receita-cor';
            isPago = transacao.recebido || false;
            nomeConta = mapaContas[transacao.carteira] || 'Conta';
            iconeConta = obterIconeBanco(nomeConta);
            break;
            
        case 'despesa':
            corClasse = 'despesa-cor';
            isPago = transacao.pago || false;
            nomeConta = mapaContas[transacao.carteira] || 'Conta';
            iconeConta = obterIconeBanco(nomeConta);
            break;
            
        case 'despesa-cartao':
            corClasse = 'despesa-cor';
            isPago = transacao.pago || false;
            nomeConta = mapaCartoes[transacao.cartaoId || transacao.carteira] || 'Cartão';
            iconeConta = obterIconeCartao(nomeConta);
            break;
            
        case 'transferencia':
            corClasse = 'transferencia-cor';
            isPago = transacao.concluida || true;
            const contaOrigem = mapaContas[transacao.contaOrigem] || 'Conta';
            const contaDestino = mapaContas[transacao.contaDestino] || 'Conta';
            nomeConta = `${contaOrigem} → ${contaDestino}`;
            iconeConta = '<span class="material-icons">swap_horiz</span>';
            detalhes = { icon: 'swap_horiz', background: '#FF9800' };
            break;
            
        default:
            corClasse = 'despesa-cor';
            isPago = false;
    }
    
    statusClasse = isPago ? 'badge-status-ok' : 'badge-status-pendente';
    iconeStatus = isPago ? 'check_circle' : 'radio_button_unchecked';
    
    const descricaoExibida = transacao.tipo === 'transferencia' 
        ? (transacao.descricao || 'Transferência entre contas')
        : (transacao.descricao || 'Sem descrição');
    
    return `
        <div class="receita-item" data-id="${transacao.id}" data-tipo="${transacao.tipo}" onclick="abrirDetalhesTransacao('${transacao.id}', '${transacao.tipo}')">
            <div class="receita-icone" style="background-color: ${detalhes.background};">
                <span class="material-icons">${detalhes.icon}</span>
            </div>
            <div class="receita-conteudo">
                <span class="receita-titulo">${descricaoExibida}</span>
                <div class="receita-detalhes">
                    <span class="detalhes-categoria">${nomeCategoria}</span>
                    <span class="detalhes-conta">${nomeConta}</span>
                </div>
            </div>
            <div class="receita-acoes">
                <span class="receita-valor ${corClasse}">${valorFormatado}</span>
                <div class="receita-badges">
                    <span class="badge-circular badge-conta">${iconeConta}</span>
                    ${transacao.tipo !== 'transferencia' ? `
                    <button class="badge-circular badge-status ${statusClasse}" data-id="${transacao.id}" onclick="event.stopPropagation(); toggleStatusTransacao('${transacao.id}', '${transacao.tipo}', ${!isPago})">
                        <span class="material-icons">${iconeStatus}</span>
                    </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function obterIconeCartao(nomeCartao = '') {
    const n = (nomeCartao || '').toLowerCase();
    if (!n) return '<span class="material-icons">credit_card</span>';
    if (n.includes('nubank')) return '<img src="../Icon/Nubank.svg" alt="Nubank" />';
    if (n.includes('bradesco')) return '<img src="../Icon/bradesco.svg" alt="Bradesco" />';
    if (n.includes('itau') || n.includes('itaú')) return '<img src="../Icon/itau.svg" alt="Itaú" />';
    if (n.includes('santander')) return '<img src="../Icon/santander.svg" alt="Santander" />';
    if (n.includes('caixa')) return '<img src="../Icon/caixa.svg" alt="Caixa" />';
    if (n.includes('banco do brasil') || n.includes('bb')) return '<img src="../Icon/banco-do-brasil.svg" alt="Banco do Brasil" />';
    return '<span class="material-icons">credit_card</span>';
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// --- ATUALIZAR TOTAIS ---
function updateTotals(transacoes) {
    const receitas = transacoes.filter(t => t.tipo === 'receita');
    const despesas = transacoes.filter(t => t.tipo === 'despesa' || t.tipo === 'despesa-cartao');
    
    const totalReceitas = receitas.reduce((sum, t) => sum + parseValueToNumber(t.valor), 0);
    const totalDespesas = despesas.reduce((sum, t) => sum + parseValueToNumber(t.valor), 0);
    
    const saldoAtual = totalReceitas - totalDespesas;
    
    const receitasElement = document.getElementById('saldo-atual');
    const saldoElement = document.getElementById('balanco-mensal');
    
    if (receitasElement) {
        receitasElement.textContent = formatCurrency(totalReceitas);
    }
    
    if (saldoElement) {
        saldoElement.textContent = formatCurrency(saldoAtual);
    }
    
    // Adicionar classe de cor baseado no saldo
    const saldoEl = document.getElementById('balanco-mensal');
    if (saldoEl) {
        saldoEl.classList.remove('receita-cor', 'despesa-cor');
        if (saldoAtual >= 0) {
            saldoEl.classList.add('receita-cor');
        } else {
            saldoEl.classList.add('despesa-cor');
        }
    }
}

// --- EVENT LISTENERS ---
function attachEventListeners() {
    const clearBtn = document.querySelector('.clear-search');
    const inputBusca = document.getElementById('input-busca');
    
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            inputBusca.value = '';
            renderTodasTransacoes(todasTransacoes);
            updateTotals(todasTransacoes);
        });
    }
    
    if (inputBusca) {
        inputBusca.addEventListener('input', (e) => {
            buscarTransacoes(e.target.value);
        });
    }
}

// --- AÇÕES ---
async function toggleStatusTransacao(id, tipo, novoStatus) {
    try {
        let colecao, campo;
        
        switch (tipo) {
            case 'receita':
                colecao = 'receitas';
                campo = 'recebido';
                break;
            case 'despesa':
                colecao = 'despesas';
                campo = 'pago';
                break;
            case 'despesa-cartao':
                // Tentar primeiro na coleção despesas-cartao
                try {
                    await db.collection('despesas-cartao').doc(id).update({
                        pago: novoStatus
                    });
                    loadTodasTransacoes();
                    return;
                } catch (error) {
                    // Fallback para coleção despesas
                    console.log('[Transações] Atualizando na coleção despesas (fallback)');
                    colecao = 'despesas';
                    campo = 'pago';
                }
                break;
            case 'transferencia':
                colecao = 'transferencias';
                campo = 'concluida';
                break;
            default:
                throw new Error('Tipo de transação não suportado');
        }
        
        await db.collection(colecao).doc(id).update({
            [campo]: novoStatus
        });
        
        loadTodasTransacoes();
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        mostrarMensagem('Erro ao atualizar status');
    }
}

function abrirDetalhesTransacao(id, tipo) {
    switch (tipo) {
        case 'receita':
            window.location.href = `../Editar-Receita/Editar-Receita.html?id=${id}`;
            break;
        case 'despesa':
            window.location.href = `../Editar-Despesa/Editar-Despesa.html?id=${id}`;
            break;
        case 'despesa-cartao':
            window.location.href = `../Editar-Despesa/Editar-Despesa.html?id=${id}&tipo=cartao`;
            break;
        case 'transferencia':
            // Para transferências, pode mostrar detalhes ou editar se houver página específica
            alert('Detalhes de transferência em desenvolvimento');
            break;
        default:
            console.error('Tipo de transação não reconhecido:', tipo);
    }
}

// --- POPUP DE FILTROS ---
function setupPopupFiltros() {
    const voltarBtn = document.getElementById('filtros-voltar');
    const aplicarBtn = document.getElementById('aplicar-filtros');
    
    if (voltarBtn) {
        voltarBtn.addEventListener('click', fecharPopupFiltros);
    }
    
    if (aplicarBtn) {
        aplicarBtn.addEventListener('click', fecharPopupFiltros);
    }
}

function abrirPopupFiltros() {
    document.getElementById('popup-filtros').style.display = 'flex';
}

function fecharPopupFiltros() {
    document.getElementById('popup-filtros').style.display = 'none';
}

// --- MENSAGENS ---
function mostrarMensagem(texto) {
    const popup = document.getElementById('popup-mensagem');
    const popupTexto = document.getElementById('popup-texto');
    const popupBotao = document.getElementById('popup-botao');
    
    if (!popup || !popupTexto || !popupBotao) {
        console.error('[Transações] elementos de popup não encontrados');
        console.error('Mensagem:', texto);
        return;
    }
    
    popupTexto.textContent = texto;
    popup.style.display = 'flex';
    
    popupBotao.onclick = () => {
        popup.style.display = 'none';
    };
    
    setTimeout(() => {
        popup.style.display = 'none';
    }, 3000);
}

// Funções do Dropdown de Navegação
function toggleDropdown() {
    const dropdown = document.getElementById('dropdown-menu');
    const isVisible = dropdown.style.display === 'block';
    
    // Fechar todos os dropdowns primeiro
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.style.display = 'none';
    });
    
    // Abrir/fechar o dropdown atual
    dropdown.style.display = isVisible ? 'none' : 'block';
    
    // Rotacionar ícone
    const icon = document.querySelector('.titulo-pagina .material-icons');
    icon.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
}

function navegarPara(url) {
    window.location.href = url;
}

// Fechar dropdown ao clicar fora
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('dropdown-menu');
    const tituloPagina = document.querySelector('.titulo-pagina');
    
    // Se clicou em um link do dropdown, permite navegação
    if (event.target.closest('.dropdown-item')) {
        return;
    }
    
    if (!tituloPagina.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.style.display = 'none';
        const icon = document.querySelector('.titulo-pagina .material-icons');
        if (icon) icon.style.transform = 'rotate(0deg)';
    }
});
