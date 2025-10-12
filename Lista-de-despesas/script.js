// --- CONFIGURAÇÃO E VARIÁVEIS GLOBAIS ---
const db = firebase.firestore();
const auth = firebase.auth();

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let currentUser = null;
let despesaParaExcluirId = null; // Armazena o ID da despesa para o popup

// MAPEAMENTO COMPLETO DE CATEGORIAS COM ÍCONES E CORES
const categoryDetails = {
    'processo cedaspy': { icon: 'trending_up', background: '#D32F2F' },
    'rendimentos de processos': { icon: 'trending_up', background: '#D32F2F' },
    'pis': { icon: 'stars', background: '#8b5cf6' },
    'pagamento abono salarial': { icon: 'stars', background: '#8b5cf6' },
    'bonificação': { icon: 'stars', background: '#8b5cf6' },
    'salário': { icon: 'attach_money', background: '#ef4444' },
    'salario': { icon: 'attach_money', background: '#ef4444' },
    'salário ionlab': { icon: 'attach_money', background: '#ef4444' },
    'freelance': { icon: 'work', background: '#f59e0b' },
    'investimentos': { icon: 'analytics', background: '#14b8a6' },
    'dividendos': { icon: 'analytics', background: '#14b8a6' },
    'vendas': { icon: 'shopping_cart', background: '#D32F2F' },
    'comissão': { icon: 'percent', background: '#D32F2F' },
    'prêmio': { icon: 'emoji_events', background: '#f59e0b' },
    'reembolso': { icon: 'cached', background: '#6366f1' },
    'aluguel': { icon: 'home', background: '#D32F2F' },
    'pensão': { icon: 'account_balance', background: '#64748b' },
    'aposentadoria': { icon: 'elderly', background: '#64748b' },
    'auxílio': { icon: 'help', background: '#06b6d4' },
    'benefício': { icon: 'favorite', background: '#ec4899' },
    'default': { icon: 'receipt_long', background: '#D32F2F' }
};

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// --- INICIALIZAÇÃO ---
// Configurar menu adicionar
function configurarMenuAdicionar() {
    const botaoAdicionar = document.getElementById('botao-adicionar-despesas');
    const menu = document.getElementById('menu-adicionar-despesas');

    if (!botaoAdicionar || !menu) return;

    botaoAdicionar.addEventListener('click', (e) => {
        e.stopPropagation();
        if (menu.style.display === 'none' || !menu.style.display) {
            menu.style.display = 'block';
        } else {
            menu.style.display = 'none';
        }
    });

    document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && e.target !== botaoAdicionar && !botaoAdicionar.contains(e.target)) {
            menu.style.display = 'none';
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    configurarMenuAdicionar();
    initializeAuth();
    initializeUI();
});

function initializeAuth() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            updateMonthDisplay();
            loadDespesas();
        } else {
            window.location.href = '../Login/Login.html';
        }
    });
}

function initializeUI() {
    const prevMonth = document.getElementById('prev-month');
    const nextMonth = document.getElementById('next-month');
    if (prevMonth) prevMonth.addEventListener('click', () => changeMonth(-1));
    if (nextMonth) nextMonth.addEventListener('click', () => changeMonth(1));
    
    // Configurar menu adicionar
    configurarMenuAdicionar();
    
    // Configurar listeners do modal
    initializeModalListeners();
    
    // Listeners do popup de exclusão
    const popupCancelar = document.getElementById('popup-cancelar');
    if (popupCancelar) {
        popupCancelar.addEventListener('click', () => {
            const popupConfirmacao = document.getElementById('popup-confirmacao');
            if (popupConfirmacao) popupConfirmacao.style.display = 'none';
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
            console.log('Abrindo busca');
            barraBusca.style.display = 'block';
            inputBusca.focus();
        });
    }
    
    if (fecharBusca) {
        fecharBusca.addEventListener('click', () => {
            console.log('Fechando busca');
            barraBusca.style.display = 'none';
            inputBusca.value = '';
            loadDespesas(); // Recarregar todas as despesas
        });
    }
    
    if (inputBusca) {
        inputBusca.addEventListener('input', (e) => {
            console.log('Buscando por:', e.target.value);
            buscarDespesas(e.target.value);
        });
    }
}

let todasDespesas = []; // Armazenar todas as despesas para busca
let mapaContas = {}; // cache id -> nome da conta

// Carrega contas do usuário uma única vez para mapear IDs em nomes
async function carregarContasUsuario() {
    if (!currentUser) return;
    try {
        const snap = await db.collection('contas').where('userId', '==', currentUser.uid).get();
        mapaContas = {};
        snap.forEach(doc => {
            const data = doc.data() || {};
            const nome = data.nome || data.descricao || data.banco || data.nomeConta || 'Conta';
            mapaContas[doc.id] = nome;
        });
    } catch (e) {
        console.warn('Não foi possível carregar contas para mapear nomes:', e);
    }
}

function buscarDespesas(termo) {
    if (!termo.trim()) {
        renderDespesas(todasDespesas);
        updateTotals(todasDespesas);
        return;
    }
    const termoLower = termo.toLowerCase();
    const despesasFiltradas = todasDespesas.filter(despesa => {
        const descricao = (despesa.descricao || '').toLowerCase();
        const categoria = (despesa.categoria || '').toLowerCase();
        const conta = (despesa.conta || '').toLowerCase();
        return descricao.includes(termoLower) || categoria.includes(termoLower) || conta.includes(termoLower);
    });
    renderDespesas(despesasFiltradas);
    updateTotals(despesasFiltradas);
}

function setupDropdownAndFilters() {
    // Dropdown toggle
    const titleElement = document.querySelector('.titulo-pagina');
    if (titleElement) {
        titleElement.addEventListener('click', toggleDropdown);
    }
    
    // Fechar dropdown ao clicar fora
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.titulo-pagina') && !e.target.closest('.dropdown-menu')) {
            hideDropdown();
        }
    });
}

function createDropdown() {
    const dropdown = document.createElement('div');
    dropdown.id = 'dropdown-menu';
    dropdown.className = 'dropdown-menu';
    dropdown.innerHTML = `
        <a href="../Lista-de-receitas/Lista-de-receitas.html" class="dropdown-item">
            <span class="material-icons">trending_up</span>
            Receitas
        </a>
        <a href="../Lista-de-despesas/Lista-de-despesas.html" class="dropdown-item active">
            <span class="material-icons">trending_down</span>
            Despesas
        </a>
    `;
    
    const cabecalho = document.querySelector('.cabecalho');
    if (cabecalho) {
        cabecalho.appendChild(dropdown);
        dropdown.style.display = 'block';
    }
}

function hideDropdown() {
    const dropdown = document.getElementById('dropdown-menu');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
}

function changeMonth(direction) {
    currentMonth += direction;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    updateMonthDisplay();
    loadDespesas();
}

function updateMonthDisplay() {
    const currentMonthEl = document.getElementById('current-month');
    if (currentMonthEl) {
        currentMonthEl.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    }
}

// --- LÓGICA DE DADOS (Mantida do seu código original) ---
async function loadDespesas(filtros = null) {
    if (!currentUser) return;

    try {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

        // Garantir que temos o mapa de contas carregado
        if (Object.keys(mapaContas).length === 0) {
            await carregarContasUsuario();
        }

    const querySnapshot = await db.collection('despesas').where('userId', '==', currentUser.uid).get();
    const despesas = [];
        // helper to parse many possible date formats into a Date object
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
                    const [d, m, y] = parts.map(p => Number(p));
                    if (!isNaN(d) && !isNaN(m) && !isNaN(y)) return new Date(y, m - 1, d);
                }
                const iso = new Date(field);
                if (!isNaN(iso)) return iso;
            }
            return null;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log('=== PROCESSANDO DESPESA ===');
            console.log('ID:', doc.id);
            console.log('Data bruta:', data);
            console.log('Campo data:', data.data);
            console.log('Campo valor:', data.valor);
            console.log('Campo concluida:', data.concluida);
            console.log('Campo pago:', data.pago);
            console.log('Campo iconeCategoria:', data.iconeCategoria);
            console.log('Campo corCategoria:', data.corCategoria);
            
            const despesaDate = parseDateField(data.data) || new Date();
            console.log('Data parseada:', despesaDate);
            console.log('Primeiro dia:', firstDay);
            console.log('Último dia:', lastDay);
            console.log('Data está no range?:', despesaDate >= firstDay && despesaDate <= lastDay);
            
            if (despesaDate >= firstDay && despesaDate <= lastDay) {
                const despesa = { id: doc.id, ...data, data: despesaDate };
                console.log('Despesa adicionada:', despesa);
                despesas.push(despesa);
            } else {
                console.log('Despesa fora do range, ignorada');
            }
        });

        // Aplicar filtros se fornecidos
        let despesasFiltradas = despesas;
        if (filtros) {
            despesasFiltradas = aplicarFiltros(despesas, filtros);
        }

        // sort by normalized Date (desc) ou pela ordem escolhida
        const ordem = filtros?.ordem || 'data-desc';
    despesasFiltradas.sort((a, b) => {
            switch (ordem) {
                case 'data-asc':
                    return a.data - b.data;
                case 'data-desc':
                    return b.data - a.data;
                case 'valor-asc':
                    return parseValueToNumber(a.valor) - parseValueToNumber(b.valor);
                case 'valor-desc':
                    return parseValueToNumber(b.valor) - parseValueToNumber(a.valor);
                case 'descricao':
                    return (a.descricao || '').localeCompare(b.descricao || '');
                default:
                    return b.data - a.data;
            }
        });

        console.log('=== DESPESAS FINAIS ===');
        console.log('Total de despesas encontradas:', despesasFiltradas.length);
        despesasFiltradas.forEach((r, i) => {
            console.log(`Despesa ${i+1}:`, {
                id: r.id,
                descricao: r.descricao,
                valor: r.valor,
                concluida: r.concluida,
                data: r.data
            });
        });

        // Armazenar para busca
    todasDespesas = despesasFiltradas;
    renderDespesas(despesasFiltradas);
    updateTotals(despesasFiltradas);

    } catch (error) {
        console.error('Erro ao carregar despesas:', error);
    }
}

// Função para aplicar filtros nas despesas
function aplicarFiltros(despesas, filtros) {
    let despesasFiltradas = [...despesas];
    if (filtros.situacao && filtros.situacao !== 'todos') {
        switch (filtros.situacao) {
            case 'efetuadas':
                despesasFiltradas = despesasFiltradas.filter(d => d.pago === true || d.concluida === true);
                break;
            case 'pendentes':
                despesasFiltradas = despesasFiltradas.filter(d => d.pago !== true && d.concluida !== true);
                break;
            case 'ignoradas':
                despesasFiltradas = despesasFiltradas.filter(d => d.ignorada === true);
                break;
        }
    }
    if (filtros.categoria && filtros.categoria !== 'todos') {
        despesasFiltradas = despesasFiltradas.filter(d => d.categoria && d.categoria.toLowerCase().includes(filtros.categoria.toLowerCase()));
    }
    if (filtros.conta && filtros.conta !== 'todos') {
        despesasFiltradas = despesasFiltradas.filter(d => {
            const contaNome = typeof d.conta === 'object' && d.conta !== null ? (d.conta.nome || d.conta.nomeExibicao || '') : (d.conta || '');
            return contaNome.toLowerCase().includes(filtros.conta.toLowerCase());
        });
    }
    if (filtros.tag && filtros.tag !== 'todos') {
        despesasFiltradas = despesasFiltradas.filter(d => d.tags && Array.isArray(d.tags) && d.tags.some(tag => tag.toLowerCase().includes(filtros.tag.toLowerCase())));
    }
    return despesasFiltradas;
}

// --- RENDERIZAÇÃO (Despesas) ---
function renderDespesas(despesas) {
    const container = document.getElementById('despesas-list');
    if (!container) return;
    container.innerHTML = '';

    if (!despesas || despesas.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem 2rem; color: #6b7280;">
                <div style="margin-bottom: 1rem;">
                    <span class="material-icons-round" style="font-size: 3rem; opacity: 0.3;">trending_down</span>
                </div>
                <p style="margin-bottom: 0.5rem; font-size: 1.1rem;">Nenhuma despesa encontrada</p>
                <p style="margin-bottom: 2rem; font-size: 0.9rem; opacity: 0.7;">Comece registrando sua primeira despesa</p>
                <button onclick="window.location.href='../Nova-Despesa/Nova-Despesa.html'" 
                        class="empty-state-button"
                        style="background-color: var(--cor-primaria); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 1rem; display: inline-flex; align-items: center; gap: 8px; transition: transform 0.2s ease;">
                    <span class="material-icons-round" style="font-size: 20px;">add</span>
                    Adicionar Despesa
                </button>
            </div>
        `;
        return;
    }

    const grouped = groupByDate(despesas);
    const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));
    sortedDates.forEach(dateKey => {
        const grupo = document.createElement('div');
        grupo.className = 'grupo-data';
        grupo.innerHTML = `<h3 class="titulo-data">${formatDateGroup(dateKey)}</h3>`;
        grouped[dateKey].forEach(d => grupo.appendChild(createDespesaItem(d)));
        container.appendChild(grupo);
    });
}

function createDespesaItem(despesa) {
    const item = document.createElement('div');
    item.className = 'despesa-item';

    console.log(`\n==== CRIANDO ITEM DESPESA ====`);
    console.log('Despesa completa:', despesa);
    console.log('despesa.iconeCategoria:', despesa.iconeCategoria);
    console.log('despesa.corCategoria:', despesa.corCategoria);
    console.log('despesa.categoria:', despesa.categoria);
    console.log('despesa.descricao:', despesa.descricao);

    // CORREÇÃO: Priorizar iconeCategoria e corCategoria salvos no documento
    let icon, background;
    if (despesa.iconeCategoria && despesa.corCategoria) {
        console.log(`✅ [DESPESA ${despesa.id}] Usando ícone personalizado:`, despesa.iconeCategoria, despesa.corCategoria);
        icon = despesa.iconeCategoria;
        background = despesa.corCategoria;
    } else {
        const categoriaKey = (despesa.categoria || despesa.descricao || 'default').toLowerCase();
        const categoryInfo = categoryDetails[categoriaKey] || categoryDetails.default;
        console.log(`⚠️ [DESPESA ${despesa.id}] Usando ícone do mapeamento para "${categoriaKey}":`, categoryInfo.icon, categoryInfo.background);
        icon = categoryInfo.icon;
        background = categoryInfo.background;
    }
    
    console.log(`📌 Ícone final usado: ${icon}, Cor final: ${background}`);
    console.log(`==== FIM ITEM DESPESA ====\n`);

    const categoria = despesa.categoria || '';
    let conta = '';
    if (despesa.conta && typeof despesa.conta === 'object') {
        conta = despesa.conta.nome || despesa.conta.nomeExibicao || '';
    } else if (despesa.carteira && mapaContas[despesa.carteira]) {
        conta = mapaContas[despesa.carteira];
    } else if (typeof despesa.conta === 'string') {
        conta = despesa.conta;
    }
    const iconeBanco = obterIconeBanco(conta);
    const statusClasse = despesa.pago ? 'badge-status-ok' : 'badge-status-pendente';
    const statusIcone = despesa.pago ? 'check_circle' : 'radio_button_unchecked';

    item.innerHTML = `
        <div class="despesa-icone" style="background-color: ${background};">
            <span class="material-icons">${icon}</span>
        </div>
        <div class="despesa-conteudo">
            <span class="despesa-titulo">${despesa.descricao || 'Sem descrição'}</span>
            <div class="despesa-detalhes">
                ${categoria ? `<span class=\"detalhes-categoria\">${categoria}</span>` : ''}
            </div>
        </div>
        <div class="despesa-acoes">
            <span class="despesa-valor">${formatCurrency(parseValueToNumber(despesa.valor))}</span>
            <div class="despesa-badges">
                ${conta ? `<span class=\"badge-circular badge-conta\">${iconeBanco}</span>` : ''}
                <button class="badge-circular badge-status ${statusClasse}" onclick="event.stopPropagation(); toggleDespesa('${despesa.id}', ${!despesa.pago})">
                    <span class="material-icons">${statusIcone}</span>
                </button>
            </div>
        </div>`;

    // Abrir modal
    item.addEventListener('click', (e) => {
        if (!e.target.closest('.botao-acao')) abrirModalDetalhesDespesa(despesa);
    });

    // Clique longo para excluir
    let pressTimer;
    const startPress = () => { pressTimer = window.setTimeout(() => promptDeleteDespesa(despesa.id), 800); };
    const cancelPress = () => clearTimeout(pressTimer);
    item.addEventListener('mousedown', startPress);
    item.addEventListener('mouseup', cancelPress);
    item.addEventListener('mouseleave', cancelPress);
    item.addEventListener('touchstart', startPress);
    item.addEventListener('touchend', cancelPress);

    return item;
}


// --- FUNÇÕES UTILITÁRIAS (Mantidas do seu código original) ---
function groupByDate(despesas) {
    return despesas.reduce((groups, despesa) => {
        const dataObj = despesa.data instanceof Date ? despesa.data : new Date(despesa.data);
        const dateKey = isNaN(dataObj) ? 'Data inválida' : dataObj.toDateString();
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(despesa);
        return groups;
    }, {});
}

function formatDateGroup(dateString) {
    const date = new Date(dateString);
    const dayName = date.toLocaleDateString('pt-BR', { weekday: 'long' });
    return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${date.getDate()}`;
}

function parseValueToNumber(value) {
    console.log('Parseando valor:', value, 'tipo:', typeof value);
    
    if (typeof value === 'number') {
        return value;
    }
    
    if (typeof value === 'string') {
        // Remove símbolos de moeda e espaços
        let cleanValue = value.replace(/[R$\s]/g, '');
        console.log('Valor limpo:', cleanValue);
        
        // Se tem ponto e vírgula, o ponto é separador de milhares
        if (cleanValue.includes('.') && cleanValue.includes(',')) {
            // Formato: 1.000,50 -> remover pontos, vírgula vira ponto decimal
            cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
        }
        // Se tem apenas vírgula, ela é o separador decimal
        else if (cleanValue.includes(',') && !cleanValue.includes('.')) {
            // Formato: 1000,50 -> vírgula vira ponto decimal
            cleanValue = cleanValue.replace(',', '.');
        }
        // Se tem apenas ponto
        else if (cleanValue.includes('.') && !cleanValue.includes(',')) {
            // Pode ser separador decimal (10.50) ou milhares (1000.)
            const parts = cleanValue.split('.');
            if (parts.length === 2 && parts[1].length <= 2) {
                // É decimal: 10.50
                cleanValue = cleanValue;
            } else {
                // É separador de milhares: 1.000 -> 1000
                cleanValue = cleanValue.replace(/\./g, '');
            }
        }
        
        console.log('Valor normalizado:', cleanValue);
        
        const numValue = parseFloat(cleanValue) || 0;
        console.log('Valor convertido:', numValue);
        return numValue;
    }
    
    return 0;
}

function updateTotals(despesas) {
    let totalPago = 0;
    let totalPendente = 0;
    despesas.forEach(d => {
        const valor = parseValueToNumber(d.valor);
        const efetivada = (d.pago === true) || (d.concluida === true);
        if (efetivada) totalPago += valor; else totalPendente += valor;
    });
    const pagoFormatted = formatCurrency(totalPago);
    const pendenteFormatted = formatCurrency(totalPendente);
    const pagoElement = document.getElementById('total-recebido'); // reutilizando id existente no HTML
    const pendenteElement = document.getElementById('total-previsto');
    if (pagoElement) pagoElement.textContent = pagoFormatted; else console.warn('Elemento total-recebido não encontrado');
    if (pendenteElement) pendenteElement.textContent = pendenteFormatted; else console.warn('Elemento total-previsto não encontrado');
}

function formatCurrency(value) {
    console.log('Formatando valor:', value, 'tipo:', typeof value);
    const numValue = Number(value) || 0;
    console.log('Valor numérico:', numValue);
    const formatted = numValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    console.log('Valor formatado:', formatted);
    return formatted;
}


// --- AÇÕES (Funções originais com melhorias) ---
function promptDeleteDespesa(despesaId) {
    despesaParaExcluirId = despesaId;
    document.getElementById('popup-confirmacao').style.display = 'flex';
}

async function confirmDeleteDespesa() {
    if (!despesaParaExcluirId) return;
    try {
        await db.collection('despesas').doc(despesaParaExcluirId).delete();
        loadDespesas();
        mostrarPopup('Despesa excluída com sucesso!');
    } catch (error) {
        console.error('Erro ao excluir despesa:', error);
        mostrarPopup('Erro ao excluir despesa. Tente novamente.');
    } finally {
        document.getElementById('popup-confirmacao').style.display = 'none';
        despesaParaExcluirId = null;
    }
}

async function toggleDespesa(despesaId, novoStatus) {
    try {
        await db.collection('despesas').doc(despesaId).update({ pago: novoStatus });
        loadDespesas();
    } catch (error) {
        console.error('Erro ao atualizar despesa:', error);
    }
}

window.toggleDespesa = toggleDespesa;
window.confirmDeleteDespesa = confirmDeleteDespesa;

// Retorna ícone (SVG ou material) para a conta baseada no nome
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

// === FUNÇÕES DO MODAL DE DETALHES ===
let despesaAtual = null;

function abrirModalDetalhesDespesa(despesa) {
    despesaAtual = despesa;
    document.getElementById('modal-descricao').textContent = despesa.descricao || 'Sem descrição';
    document.getElementById('modal-valor').textContent = formatCurrency(parseValueToNumber(despesa.valor));
    document.getElementById('modal-data').textContent = formatarData(despesa.data);
    // Conta
    let nomeContaExibicao = '';
    if (despesa.conta && typeof despesa.conta === 'object') {
        nomeContaExibicao = despesa.conta.nome || despesa.conta.nomeExibicao || '';
    } else if (despesa.carteira && mapaContas[despesa.carteira]) {
        nomeContaExibicao = mapaContas[despesa.carteira];
    } else if (typeof despesa.conta === 'string') {
        nomeContaExibicao = despesa.conta;
    }
    if (!nomeContaExibicao) nomeContaExibicao = 'Conta não informada';
    const contaEl = document.getElementById('modal-conta');
    if (contaEl) contaEl.textContent = nomeContaExibicao;
    document.getElementById('modal-categoria').textContent = despesa.categoria || 'Sem categoria';
    document.getElementById('modal-tags').textContent = despesa.tags || 'Nenhuma tag';
    document.getElementById('modal-lembrete').textContent = despesa.lembrete || 'Nenhum';
    document.getElementById('modal-observacao').textContent = despesa.observacao || 'Nenhuma';
    // Ícone categoria
    const categoriaIcone = document.querySelector('.detalhe-linha:nth-child(3) .detalhe-item-lado:first-child .material-icons');
    const categoriaKey = (despesa.categoria || despesa.descricao || 'default').toLowerCase();
    let iconCategory;
    if (despesa.iconeCategoria) {
        iconCategory = despesa.iconeCategoria;
    } else {
        const categoryInfo = categoryDetails[categoriaKey] || categoryDetails.default;
        iconCategory = categoryInfo.icon;
    }
    if (categoriaIcone) categoriaIcone.textContent = iconCategory;
    // Ícone conta
    const contaIcone = document.getElementById('modal-conta-icone');
    let contaNome = (nomeContaExibicao || '').toLowerCase();
    const bancos = [
        { chave:['nubank'], cor:'#8b5cf6', svg:'../Icon/Nubank.svg' },
        { chave:['bradesco'], cor:'#e53e3e', svg:'../Icon/bradesco.svg' },
        { chave:['itau','itaú'], cor:'#ff8c00', svg:'../Icon/itau.svg' },
        { chave:['santander'], cor:'#e53e3e', svg:'../Icon/santander.svg' },
        { chave:['caixa'], cor:'#0066cc', svg:'../Icon/caixa.svg' },
        { chave:['banco do brasil','bb'], cor:'#ffdd00', svg:'../Icon/banco-do-brasil.svg' },
        { chave:['picpay'], cor:'#21c25e', svg:'../Icon/picpay.svg' }
    ];
    if (contaIcone) {
        let aplicado = false;
        for (const b of bancos) {
            if (b.chave.some(k => contaNome.includes(k))) {
                contaIcone.style.background = b.cor;
                contaIcone.innerHTML = `<img src="${b.svg}" alt="Conta" style="width:16px;height:16px;object-fit:contain;" />`;
                aplicado = true; break;
            }
        }
        if (!aplicado) {
            contaIcone.style.background = '#64748b';
            contaIcone.innerHTML = '<span class="material-icons" style="font-size:16px;">account_balance</span>';
        }
    }
    // Status pago
    const statusPago = document.getElementById('status-pago');
    if (statusPago) statusPago.classList.toggle('active', !!despesa.pago);
    // Toggle ignorar
    const toggleIgnorar = document.getElementById('ignorar-despesa');
    if (toggleIgnorar) toggleIgnorar.checked = despesa.ignorada || false;
    document.getElementById('modal-detalhes-despesa').style.display = 'flex';
}

function fecharModalDetalhesDespesa() {
    const modal = document.getElementById('modal-detalhes-despesa');
    if (modal) modal.style.display = 'none';
    despesaAtual = null;
}

function calcularTotaisModal() {
    // Como removemos os IDs dos totais, não precisamos atualizar dinamicamente
    // Os valores ficam fixos como na imagem: R$0,00 pendente e R$5.333,54 recebido
    console.log('Totais fixos exibidos no modal conforme design');
}

function formatarData(dataString) {
    if (!dataString) return 'Data não informada';
    
    try {
        const data = new Date(dataString);
        const dia = data.getDate();
        const mes = data.toLocaleDateString('pt-BR', { month: 'short' });
        const ano = data.getFullYear();
        
        return `${dia} ${mes}. ${ano}`;
    } catch (error) {
        return dataString;
    }
}

// Event listeners para o modal - Consolidado na inicialização principal
function initializeModalListeners() {
    // Listeners do modal de despesa
    const fechar = document.getElementById('fechar-modal-detalhes');
    if (fechar) fechar.addEventListener('click', fecharModalDetalhesDespesa);
    const overlay = document.getElementById('modal-detalhes-despesa');
    if (overlay) overlay.addEventListener('click', (e) => { if (e.target.id === 'modal-detalhes-despesa') fecharModalDetalhesDespesa(); });
    const editar = document.getElementById('botao-editar-despesa');
    if (editar) editar.addEventListener('click', () => {
        if (despesaAtual) {
            localStorage.setItem('despesaParaEditar', JSON.stringify(despesaAtual));
            // Página de edição de despesa (ajustar quando existir)
            window.location.href = `../Editar-Despesa/Editar-Despesa.html?id=${despesaAtual.id}`;
        }
    });
    const ignorar = document.getElementById('ignorar-despesa');
    if (ignorar) ignorar.addEventListener('change', async (e) => {
        if (despesaAtual) {
            try {
                await db.collection('despesas').doc(despesaAtual.id).update({ ignorada: e.target.checked });
                despesaAtual.ignorada = e.target.checked;
            } catch (err) {
                console.error('Erro ao ignorar despesa:', err);
                e.target.checked = !e.target.checked;
            }
        }
    });
    const statusPagoBtn = document.getElementById('status-pago');
    if (statusPagoBtn) statusPagoBtn.addEventListener('click', async () => {
        if (despesaAtual) {
            try {
                const novoStatus = !despesaAtual.pago;
                await db.collection('despesas').doc(despesaAtual.id).update({ pago: novoStatus });
                despesaAtual.pago = novoStatus;
                statusPagoBtn.classList.toggle('active', novoStatus);
                loadDespesas();
            } catch (err) {
                console.error('Erro ao atualizar status pago:', err);
            }
        }
    });
}

// Função para mostrar popup de mensagem
function mostrarPopup(mensagem, callback) {
    const popupTexto = document.getElementById('popup-texto');
    const popupMensagem = document.getElementById('popup-mensagem');
    const popupBotao = document.getElementById('popup-botao');
    
    popupTexto.textContent = mensagem;
    popupMensagem.style.display = 'flex';
    
    // Remove listener anterior se existir
    const newHandler = function() {
        popupMensagem.style.display = 'none';
        if (callback) callback();
        popupBotao.removeEventListener('click', newHandler);
    };
    
    popupBotao.addEventListener('click', newHandler);
}

// Setup do popup de filtros
function setupPopupFiltros() {
    const popupFiltros = document.getElementById('popup-filtros');
    const filtrosVoltar = document.getElementById('filtros-voltar');
    const aplicarFiltros = document.getElementById('aplicar-filtros');
    const ordenarDropdown = document.getElementById('ordenar-dropdown');
    const ordenarMenu = document.getElementById('ordenar-menu');
    
    // Abrir popup de filtros (você pode adicionar este botão no cabeçalho)
    window.abrirPopupFiltros = function() {
        carregarOpcoesFiltros();
        popupFiltros.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    };
    
    // Fechar popup de filtros
    function fecharPopupFiltros() {
        popupFiltros.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    // Event listeners
    filtrosVoltar.addEventListener('click', fecharPopupFiltros);
    aplicarFiltros.addEventListener('click', () => {
        aplicarFiltrosDespesas();
        fecharPopupFiltros();
    });
    
    // Dropdown de ordenação
    ordenarDropdown.addEventListener('click', () => {
        const isOpen = ordenarMenu.style.display === 'block';
        ordenarMenu.style.display = isOpen ? 'none' : 'block';
        ordenarDropdown.classList.toggle('open', !isOpen);
    });
    
    // Itens do dropdown
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active de todos
            dropdownItems.forEach(i => i.classList.remove('active'));
            // Adiciona active ao clicado
            item.classList.add('active');
            // Atualiza texto do dropdown
            document.querySelector('.dropdown-texto').textContent = item.textContent;
            // Fecha dropdown
            ordenarMenu.style.display = 'none';
            ordenarDropdown.classList.remove('open');
        });
    });
    
    // Chips de filtro iniciais
    adicionarListenersChips();
    
    // Toggle do período
    const periodoToggle = document.getElementById('filtro-periodo-toggle');
    periodoToggle.addEventListener('change', () => {
        console.log('Filtro de período:', periodoToggle.checked);
    });
    
    // Fechar ao clicar fora
    popupFiltros.addEventListener('click', (e) => {
        if (e.target === popupFiltros) {
            fecharPopupFiltros();
        }
    });
}

// Função para carregar opções de filtros dinamicamente
function carregarOpcoesFiltros() {
    if (!todasDespesas || todasDespesas.length === 0) return;
    
    // Extrair categorias únicas
    const categorias = [...new Set(todasDespesas
        .map(r => r.categoria)
        .filter(Boolean)
        .map(c => c.toLowerCase())
    )];
    
    // Extrair contas únicas
    const contas = [...new Set(todasDespesas
        .map(r => {
            if (typeof r.conta === 'object' && r.conta !== null) {
                return r.conta.nome || r.conta.nomeExibicao || '';
            }
            return r.conta || '';
        })
        .filter(Boolean)
    )];
    
    // Atualizar seção de categorias
    const categoriasContainer = document.querySelector('[data-filtro="categoria"]').closest('.filtro-secao');
    if (categoriasContainer) {
        const opcoesContainer = categoriasContainer.querySelector('.filtro-opcoes');
        
        let categoriasHTML = `
            <div class="filtro-opcao-linha">
                <span class="material-icons">bookmark</span>
                <button class="filtro-chip active" data-filtro="categoria" data-valor="todos">Todos</button>
            </div>
        `;
        
        categorias.forEach(categoria => {
            categoriasHTML += `
                <button class="filtro-chip" data-filtro="categoria" data-valor="${categoria}">${categoria}</button>
            `;
        });
        
        opcoesContainer.innerHTML = categoriasHTML;
    }
    
    // Atualizar seção de contas
    const contasContainer = document.querySelector('[data-filtro="conta"]').closest('.filtro-secao');
    if (contasContainer) {
        const opcoesContainer = contasContainer.querySelector('.filtro-opcoes');
        
        let contasHTML = `
            <div class="filtro-opcao-linha">
                <span class="material-icons">account_balance</span>
                <button class="filtro-chip active" data-filtro="conta" data-valor="todos">Todos</button>
            </div>
        `;
        
        contas.forEach(conta => {
            contasHTML += `
                <button class="filtro-chip" data-filtro="conta" data-valor="${conta}">${conta}</button>
            `;
        });
        
        opcoesContainer.innerHTML = contasHTML;
    }
    
    // Re-adicionar event listeners para os novos chips
    adicionarListenersChips();
}

// Função para adicionar listeners aos chips de filtro
function adicionarListenersChips() {
    const filtroChips = document.querySelectorAll('.filtro-chip');
    filtroChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const filtroTipo = chip.dataset.filtro;
            // Remove active de chips do mesmo tipo
            document.querySelectorAll(`[data-filtro="${filtroTipo}"]`).forEach(c => c.classList.remove('active'));
            // Adiciona active ao clicado
            chip.classList.add('active');
        });
    });
}

// Função para aplicar os filtros selecionados
function aplicarFiltrosDespesas() {
    const filtros = {
        situacao: document.querySelector('[data-filtro="situacao"].active')?.dataset.valor || 'todos',
        categoria: document.querySelector('[data-filtro="categoria"].active')?.dataset.valor || 'todos',
        conta: document.querySelector('[data-filtro="conta"].active')?.dataset.valor || 'todos',
        tag: document.querySelector('[data-filtro="tag"].active')?.dataset.valor || 'todos',
        ordem: document.querySelector('.dropdown-item.active')?.dataset.ordem || 'data-desc',
        periodo: document.getElementById('filtro-periodo-toggle').checked
    };
    
    console.log('Filtros aplicados:', filtros);
    
    // Aplicar filtros recarregando as despesas
    loadDespesas(filtros);
    
    // Mostrar mensagem de sucesso
    mostrarPopup('Filtros aplicados com sucesso!');
}

// Funções do Dropdown de Navegação
function toggleDropdown() {
    console.log('toggleDropdown chamado!');
    
    const dropdown = document.getElementById('dropdown-menu');
    if (!dropdown) {
        console.error('Elemento dropdown-menu não encontrado');
        return;
    }
    
    console.log('Estado atual do dropdown:', dropdown.style.display);
    const isVisible = dropdown.style.display === 'block';
    
    // Fechar todos os dropdowns primeiro
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.style.display = 'none';
    });
    
    // Abrir/fechar o dropdown atual
    const newDisplay = isVisible ? 'none' : 'block';
    dropdown.style.display = newDisplay;
    
    // Rotacionar ícone
    const icon = document.querySelector('.titulo-pagina .material-icons');
    if (icon) {
        icon.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
        console.log('Ícone rotacionado:', icon.style.transform);
    }
    
    console.log('Novo estado do dropdown:', dropdown.style.display);
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