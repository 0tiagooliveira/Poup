// --- CONFIGURAÇÃO E VARIÁVEIS GLOBAIS ---
const db = firebase.firestore();
const auth = firebase.auth();

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let currentUser = null;
let transacaoParaExcluirId = null;
let transacaoParaExcluirTipo = null;

// MAPEAMENTO DE ÍCONES POR CATEGORIA
const categoryDetails = {
    // Receitas
    'salário': { icon: 'attach_money', background: '#21C25E' },
    'freelance': { icon: 'work', background: '#1a9d4d' },
    'investimentos': { icon: 'analytics', background: '#14b8a6' },
    'dividendos': { icon: 'analytics', background: '#14b8a6' },
    'vendas': { icon: 'shopping_cart', background: '#21C25E' },
    'bonificação': { icon: 'stars', background: '#21C25E' },
    'prêmio': { icon: 'emoji_events', background: '#f59e0b' },
    'aluguel': { icon: 'home', background: '#21C25E' },
    // Despesas
    'alimentação': { icon: 'restaurant', background: '#D32F2F' },
    'transporte': { icon: 'local_gas_station', background: '#D32F2F' },
    'moradia': { icon: 'home', background: '#D32F2F' },
    'saúde': { icon: 'local_hospital', background: '#D32F2F' },
    'educação': { icon: 'school', background: '#D32F2F' },
    'lazer': { icon: 'sports_esports', background: '#D32F2F' },
    'vestuário': { icon: 'checkroom', background: '#D32F2F' },
    'contas': { icon: 'electric_bolt', background: '#D32F2F' },
    // Default
    'receita-default': { icon: 'trending_up', background: '#21C25E' },
    'despesa-default': { icon: 'trending_down', background: '#D32F2F' },
    'transferencia-default': { icon: 'swap_horiz', background: '#2196F3' }
};

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

let todasTransacoes = [];
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

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
    initializeUI();
});

function initializeAuth() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            updateMonthDisplay();
            loadTransacoes();
        } else {
            window.location.href = '../Login/Login.html';
        }
    });
}

function initializeUI() {
    document.getElementById('prev-month').addEventListener('click', () => changeMonth(-1));
    document.getElementById('next-month').addEventListener('click', () => changeMonth(1));
    
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
        renderTransacoes(todasTransacoes);
        updateTotals(todasTransacoes);
        return;
    }
    const termoLower = termo.toLowerCase();
    const filtradas = todasTransacoes.filter(t => {
        const descricao = (t.descricao || '').toLowerCase();
        const categoria = (t.categoria || '').toLowerCase();
        return descricao.includes(termoLower) || categoria.includes(termoLower);
    });
    renderTransacoes(filtradas);
    updateTotals(filtradas);
}

// Carrega contas do usuário
async function carregarContasUsuario() {
    if (!currentUser) return;
    try {
        const snap = await db.collection('contas').where('userId', '==', currentUser.uid).get();
        mapaContas = {};
        snap.forEach(doc => {
            const data = doc.data() || {};
            const nome = data.nome || data.descricao || data.banco || 'Conta';
            mapaContas[doc.id] = nome;
        });
    } catch (e) {
        console.warn('Erro ao carregar contas:', e);
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
    loadTransacoes();
}

function updateMonthDisplay() {
    document.getElementById('current-month').textContent = `${monthNames[currentMonth]} ${currentYear}`;
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

// --- CARREGAR TRANSAÇÕES ---
async function loadTransacoes() {
    if (!currentUser) return;
    
    try {
        await carregarContasUsuario();
        
        todasTransacoes = [];
        
        // Carregar receitas
        const receitasSnap = await db.collection('receitas')
            .where('userId', '==', currentUser.uid)
            .get();
        
        receitasSnap.forEach(doc => {
            const data = doc.data();
            if (!data.data) return;
            
            const dataFirestore = parseDateField(data.data);
            if (!dataFirestore) return;
            
            if (dataFirestore.getMonth() === currentMonth && dataFirestore.getFullYear() === currentYear) {
                todasTransacoes.push({
                    id: doc.id,
                    tipo: 'receita',
                    ...data,
                    dataObj: dataFirestore
                });
            }
        });
        
        // Carregar despesas
        const despesasSnap = await db.collection('despesas')
            .where('userId', '==', currentUser.uid)
            .get();
        
        despesasSnap.forEach(doc => {
            const data = doc.data();
            if (!data.data) return;
            
            const dataFirestore = parseDateField(data.data);
            if (!dataFirestore) return;
            
            if (dataFirestore.getMonth() === currentMonth && dataFirestore.getFullYear() === currentYear) {
                todasTransacoes.push({
                    id: doc.id,
                    tipo: 'despesa',
                    ...data,
                    dataObj: dataFirestore
                });
            }
        });
        
        // Carregar transferências
        try {
            const transferenciasSnap = await db.collection('transferencias')
                .where('userId', '==', currentUser.uid)
                .get();
            
            transferenciasSnap.forEach(doc => {
                const data = doc.data();
                if (!data.data) return;
                
                const dataFirestore = parseDateField(data.data);
                if (!dataFirestore) return;
                
                if (dataFirestore.getMonth() === currentMonth && dataFirestore.getFullYear() === currentYear) {
                    todasTransacoes.push({
                        id: doc.id,
                        tipo: 'transferencia',
                        ...data,
                        dataObj: dataFirestore
                    });
                }
            });
        } catch (e) {
            console.log('Coleção transferencias não existe');
        }
        
        // Ordenar por data decrescente
        todasTransacoes.sort((a, b) => b.dataObj - a.dataObj);
        
        renderTransacoes(todasTransacoes);
        updateTotals(todasTransacoes);
        
    } catch (error) {
        console.error('Erro ao carregar transações:', error);
        mostrarMensagem('Erro ao carregar transações');
    }
}

// --- RENDERIZAR TRANSAÇÕES ---
function renderTransacoes(transacoes) {
    const lista = document.getElementById('transacoes-list');
    
    if (!transacoes || transacoes.length === 0) {
        lista.innerHTML = `
            <div class="estado-vazio">
                <span class="material-icons-round">receipt_long</span>
                <h3>Nenhuma transação</h3>
                <p>Adicione receitas, despesas ou transferências</p>
            </div>
        `;
        return;
    }
    
    // Agrupar por data
    const grupos = {};
    transacoes.forEach(t => {
        const dataKey = t.dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
        if (!grupos[dataKey]) grupos[dataKey] = [];
        grupos[dataKey].push(t);
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

function criarItemTransacao(t) {
    const categoria = (t.categoria || '').toLowerCase();
    let detalhes = categoryDetails[categoria];
    
    if (!detalhes) {
        detalhes = categoryDetails[`${t.tipo}-default`] || categoryDetails['receita-default'];
    }
    
    const nomeCategoria = capitalize(t.categoria || (t.tipo === 'receita' ? 'Receita' : t.tipo === 'despesa' ? 'Despesa' : 'Transferência'));
    const valorFormatado = formatCurrency(parseValueToNumber(t.valor));
    const isPago = t.recebido || t.pago || t.concluida || false;
    
    // Nome da conta
    let conta = '';
    if (t.conta && typeof t.conta === 'object') {
        conta = t.conta.nome || t.conta.nomeExibicao || '';
    } else if (t.carteira && mapaContas[t.carteira]) {
        conta = mapaContas[t.carteira];
    } else if (typeof t.conta === 'string') {
        conta = t.conta;
    }
    const iconeBanco = obterIconeBanco(conta);
    
    // Classes de cor
    let corClasse = '';
    if (t.tipo === 'receita') corClasse = 'receita-cor';
    else if (t.tipo === 'despesa') corClasse = 'despesa-cor';
    else corClasse = 'transferencia-cor';
    
    const statusClasse = isPago ? 'badge-status-ok' : 'badge-status-pendente';
    const statusIcone = isPago ? 'check_circle' : 'radio_button_unchecked';
    
    return `
        <div class="receita-item" data-id="${t.id}" data-tipo="${t.tipo}">
            <div class="receita-icone" style="background-color: ${detalhes.background};">
                <span class="material-icons">${detalhes.icon}</span>
            </div>
            <div class="receita-conteudo">
                <span class="receita-titulo">${t.descricao || 'Sem descrição'}</span>
                <div class="receita-detalhes">
                    ${nomeCategoria ? `<span class="detalhes-categoria">${nomeCategoria}</span>` : ''}
                </div>
            </div>
            <div class="receita-acoes">
                <span class="receita-valor ${corClasse}">${valorFormatado}</span>
                <div class="receita-badges">
                    ${conta ? `<span class="badge-circular badge-conta">${iconeBanco}</span>` : ''}
                    ${t.tipo !== 'transferencia' ? `
                    <button class="badge-circular badge-status ${statusClasse}" data-id="${t.id}" data-tipo="${t.tipo}" onclick="event.stopPropagation()">
                        <span class="material-icons">${statusIcone}</span>
                    </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// --- ATUALIZAR TOTAIS ---
function updateTotals(transacoes) {
    const receitas = transacoes.filter(t => t.tipo === 'receita');
    const despesas = transacoes.filter(t => t.tipo === 'despesa');
    
    const totalReceitas = receitas.reduce((sum, t) => sum + parseValueToNumber(t.valor), 0);
    const totalDespesas = despesas.reduce((sum, t) => sum + parseValueToNumber(t.valor), 0);
    
    const saldoAtual = totalReceitas - totalDespesas;
    const balancoMensal = totalReceitas - totalDespesas;
    
    document.getElementById('saldo-atual').textContent = formatCurrency(saldoAtual);
    document.getElementById('balanco-mensal').textContent = formatCurrency(balancoMensal);
    
    // Adicionar classe de cor
    const balancoEl = document.getElementById('balanco-mensal');
    balancoEl.classList.remove('receita-cor', 'despesa-cor');
    if (balancoMensal >= 0) {
        balancoEl.classList.add('receita-cor');
    } else {
        balancoEl.classList.add('despesa-cor');
    }
}

// --- EVENT LISTENERS ---
function attachEventListeners() {
    // Status (Pago/Não Pago)
    document.querySelectorAll('.badge-circular.badge-status').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = btn.dataset.id;
            const tipo = btn.dataset.tipo;
            
            // Verificar status atual
            const docSnap = await db.collection(tipo === 'receita' ? 'receitas' : 'despesas').doc(id).get();
            if (!docSnap.exists) return;
            
            const data = docSnap.data();
            const isPago = data.recebido || data.pago || data.concluida || false;
            
            // Alternar status
            await togglePago(id, tipo, !isPago);
        });
    });
}

// --- AÇÕES ---
async function togglePago(id, tipo, novoStatus) {
    try {
        const colecao = tipo === 'receita' ? 'receitas' : 'despesas';
        const campo = tipo === 'receita' ? 'recebido' : 'pago';
        
        await db.collection(colecao).doc(id).update({
            [campo]: novoStatus
        });
        
        loadTransacoes();
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        mostrarMensagem('Erro ao atualizar status');
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
    
    if (!tituloPagina.contains(event.target)) {
        dropdown.style.display = 'none';
        const icon = document.querySelector('.titulo-pagina .material-icons');
        icon.style.transform = 'rotate(0deg)';
    }
});
