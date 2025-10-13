// --- CONFIGURAÇÃO E VARIÁVEIS GLOBAIS ---
const db = firebase.firestore();
const auth = firebase.auth();

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let currentUser = null;
let receitaParaExcluirId = null; // Armazena o ID da receita para o popup

// MAPEAMENTO COMPLETO DE CATEGORIAS COM ÍCONES E CORES
const categoryDetails = {
    'processo cedaspy': { icon: 'trending_up', background: '#21C25E' },
    'rendimentos de processos': { icon: 'trending_up', background: '#21C25E' },
    'pis': { icon: 'stars', background: '#21C25E' },
    'pagamento abono salarial': { icon: 'stars', background: '#21C25E' },
    'bonificação': { icon: 'stars', background: '#21C25E' },
    'salário': { icon: 'attach_money', background: '#21C25E' },
    'salario': { icon: 'attach_money', background: '#21C25E' },
    'salário ionlab': { icon: 'attach_money', background: '#21C25E' },
    'freelance': { icon: 'work', background: '#1a9d4d' },
    'investimentos': { icon: 'analytics', background: '#14b8a6' },
    'dividendos': { icon: 'analytics', background: '#14b8a6' },
    'vendas': { icon: 'shopping_cart', background: '#21C25E' },
    'comissão': { icon: 'percent', background: '#21C25E' },
    'prêmio': { icon: 'emoji_events', background: '#f59e0b' },
    'reembolso': { icon: 'cached', background: '#21C25E' },
    'aluguel': { icon: 'home', background: '#21C25E' },
    'pensão': { icon: 'account_balance', background: '#21C25E' },
    'aposentadoria': { icon: 'elderly', background: '#21C25E' },
    'auxílio': { icon: 'help', background: '#21C25E' },
    'benefício': { icon: 'favorite', background: '#21C25E' },
    'default': { icon: 'receipt_long', background: '#21C25E' }
};

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// Configurar menu adicionar
function configurarMenuAdicionar() {
    const botaoAdicionar = document.getElementById('botao-adicionar-receitas');
    const menu = document.getElementById('menu-adicionar-receitas');

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
}// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
    initializeUI();
});

function initializeAuth() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            updateMonthDisplay();
            loadReceitas();
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
    
    // Adicionar listener para botão adicionar principal ir direto para Nova-Receita
    const botaoAdicionarPrincipal = document.getElementById('botao-adicionar-receitas');
    if (botaoAdicionarPrincipal) {
        botaoAdicionarPrincipal.addEventListener('click', (e) => {
            // Se for clique simples (não long press), ir direto para Nova-Receita
            let pressTimer;
            let isLongPress = false;
            
            const handleClick = () => {
                if (!isLongPress) {
                    window.location.href = '../Nova-Receita/Nova-Receita.html';
                }
            };
            
            botaoAdicionarPrincipal.addEventListener('mousedown', () => {
                pressTimer = setTimeout(() => {
                    isLongPress = true;
                    // Aqui o menu normal aparece
                }, 500);
            });
            
            botaoAdicionarPrincipal.addEventListener('mouseup', () => {
                clearTimeout(pressTimer);
                if (!isLongPress) {
                    setTimeout(handleClick, 10);
                }
                setTimeout(() => { isLongPress = false; }, 100);
            });
        });
    }
    
    // Configurar listeners do modal
    initializeModalListeners();
    
    // Listeners do popup de exclusão
    const popupCancelar = document.getElementById('popup-cancelar');
    const popupExcluir = document.getElementById('popup-excluir');
    if (popupCancelar) {
        popupCancelar.addEventListener('click', () => {
            const popupConfirmacao = document.getElementById('popup-confirmacao');
            if (popupConfirmacao) popupConfirmacao.style.display = 'none';
        });
    }
    if (popupExcluir) {
        popupExcluir.addEventListener('click', confirmDeleteReceita);
    }
    
    // Adicionar listeners para dropdown, filtros e busca
    setupDropdownAndFilters();
    setupBusca();
    setupPopupFiltros();
    
    // Botão de filtros no cabeçalho
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
            loadReceitas(); // Recarregar todas as Receitas
        });
    }
    
    if (inputBusca) {
        inputBusca.addEventListener('input', (e) => {
            console.log('Buscando por:', e.target.value);
            buscarReceitas(e.target.value);
        });
    }
}

let todasReceitas = []; // Armazenar todas as Receitas para busca
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

function buscarReceitas(termo) {
    if (!termo.trim()) {
        renderReceitas(todasReceitas);
        updateTotals(todasReceitas);
        return;
    }
    const termoLower = termo.toLowerCase();
    const receitasFiltradas = todasReceitas.filter(receita => {
        const descricao = (receita.descricao || '').toLowerCase();
        const categoria = (receita.categoria || '').toLowerCase();
        const conta = (receita.conta || '').toLowerCase();
        return descricao.includes(termoLower) || categoria.includes(termoLower) || conta.includes(termoLower);
    });
    renderReceitas(receitasFiltradas);
    updateTotals(receitasFiltradas);
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
        <a href="../Lista-de-receitas/Lista-de-receitas.html" class="dropdown-item active">
            <span class="material-icons">trending_up</span>
            Receitas
        </a>
        <a href="../Lista-de-despesas/Lista-de-despesas.html" class="dropdown-item">
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
    loadReceitas();
}

function updateMonthDisplay() {
    const currentMonthEl = document.getElementById('current-month');
    if (currentMonthEl) {
        currentMonthEl.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    }
}

// --- LÓGICA DE DADOS (Mantida do seu código original) ---
async function loadReceitas(filtros = null) {
    if (!currentUser) return;

    try {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

        // Garantir que temos o mapa de contas carregado
        if (Object.keys(mapaContas).length === 0) {
            await carregarContasUsuario();
        }

    const querySnapshot = await db.collection('receitas').where('userId', '==', currentUser.uid).get();
    const receitas = [];
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
            
            const receitaDate = parseDateField(data.data) || new Date();
            
            if (receitaDate >= firstDay && receitaDate <= lastDay) {
                const receita = { id: doc.id, ...data, data: receitaDate };
                receitas.push(receita);
            }
        });

        // Aplicar filtros se fornecidos
        let receitasFiltradas = receitas;
        if (filtros) {
            receitasFiltradas = aplicarFiltros(receitas, filtros);
        }

        // sort by normalized Date (desc) ou pela ordem escolhida
        const ordem = filtros?.ordem || 'data-desc';
    receitasFiltradas.sort((a, b) => {
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

        // Armazenar para busca
    todasReceitas = receitasFiltradas;
    renderReceitas(receitasFiltradas);
    updateTotals(receitasFiltradas);

    } catch (error) {
        console.error('Erro ao carregar Receitas:', error);
    }
}

// Função para aplicar filtros nas receitas
function aplicarFiltros(receitas, filtros) {
    let receitasFiltradas = [...receitas];
    if (filtros.situacao && filtros.situacao !== 'todos') {
        switch (filtros.situacao) {
            case 'efetuadas':
                // CORREÇÃO: Incluir 'recebido' no filtro de receitas efetuadas
                receitasFiltradas = receitasFiltradas.filter(d => d.pago === true || d.concluida === true || d.recebido === true);
                break;
            case 'pendentes':
                // CORREÇÃO: Incluir 'recebido' no filtro de receitas pendentes
                receitasFiltradas = receitasFiltradas.filter(d => d.pago !== true && d.concluida !== true && d.recebido !== true);
                break;
            case 'ignoradas':
                receitasFiltradas = receitasFiltradas.filter(d => d.ignorada === true);
                break;
        }
    }
    if (filtros.categoria && filtros.categoria !== 'todos') {
        receitasFiltradas = receitasFiltradas.filter(d => d.categoria && d.categoria.toLowerCase().includes(filtros.categoria.toLowerCase()));
    }
    if (filtros.conta && filtros.conta !== 'todos') {
        receitasFiltradas = receitasFiltradas.filter(d => {
            const contaNome = typeof d.conta === 'object' && d.conta !== null ? (d.conta.nome || d.conta.nomeExibicao || '') : (d.conta || '');
            return contaNome.toLowerCase().includes(filtros.conta.toLowerCase());
        });
    }
    if (filtros.tag && filtros.tag !== 'todos') {
        receitasFiltradas = receitasFiltradas.filter(d => d.tags && Array.isArray(d.tags) && d.tags.some(tag => tag.toLowerCase().includes(filtros.tag.toLowerCase())));
    }
    return receitasFiltradas;
}

// --- RENDERIZAÇÃO (Receitas) ---
function renderReceitas(receitas) {
    const container = document.getElementById('receitas-list');
    if (!container) {
        console.error('Container receitas-list não encontrado!');
        return;
    }
    container.innerHTML = '';

    if (!receitas || receitas.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem 2rem; color: #6b7280;">
                <div style="margin-bottom: 1rem;">
                    <span class="material-icons-round" style="font-size: 3rem; opacity: 0.3;">trending_up</span>
                </div>
                <p style="margin-bottom: 0.5rem; font-size: 1.1rem;">Nenhuma receita encontrada</p>
                <p style="margin-bottom: 2rem; font-size: 0.9rem; opacity: 0.7;">Comece registrando sua primeira receita</p>
                <button onclick="window.location.href='../Nova-Receita/Nova-Receita.html'" 
                        class="empty-state-button"
                        style="background-color: var(--cor-primaria); color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 1rem; display: inline-flex; align-items: center; gap: 8px; transition: transform 0.2s ease;">
                    <span class="material-icons-round" style="font-size: 20px;">add</span>
                    Adicionar Receita
                </button>
            </div>
        `;
        return;
    }

    const grouped = groupByDate(receitas);
    const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));
    sortedDates.forEach(dateKey => {
        const grupo = document.createElement('div');
        grupo.className = 'grupo-data';
        grupo.innerHTML = `<h3 class="titulo-data">${formatDateGroup(dateKey)}</h3>`;
        grouped[dateKey].forEach(d => grupo.appendChild(createReceitaItem(d)));
        container.appendChild(grupo);
    });
}

function createReceitaItem(receita) {
    const item = document.createElement('div');
    item.className = 'receita-item';

    // CORREÇÃO: Priorizar iconeCategoria e corCategoria salvos no documento
    let icon, background;
    if (receita.iconeCategoria && receita.corCategoria) {
        icon = receita.iconeCategoria;
        background = receita.corCategoria;
    } else {
        const categoriaKey = (receita.categoria || receita.descricao || 'default').toLowerCase();
        const categoryInfo = categoryDetails[categoriaKey] || categoryDetails.default;
        icon = categoryInfo.icon;
        background = categoryInfo.background;
    }

    const categoria = receita.categoria || '';
    let conta = '';
    if (receita.conta && typeof receita.conta === 'object') {
        conta = receita.conta.nome || receita.conta.nomeExibicao || '';
    } else if (receita.carteira && mapaContas[receita.carteira]) {
        conta = mapaContas[receita.carteira];
    } else if (typeof receita.conta === 'string') {
        conta = receita.conta;
    }
    const iconeBanco = obterIconeBanco(conta);
    
    // CORREÇÃO 2: Verificar 'pago', 'concluida' E 'recebido' (receitas recorrentes usam 'recebido')
    const estaRecebida = receita.pago === true || receita.concluida === true || receita.recebido === true;
    const statusClasse = estaRecebida ? 'badge-status-ok' : 'badge-status-pendente';
    const statusIcone = estaRecebida ? 'check_circle' : 'radio_button_unchecked';

    item.innerHTML = `
        <div class="receita-icone" style="background-color: ${background};">
            <span class="material-icons">${icon}</span>
        </div>
        <div class="receita-conteudo">
            <span class="receita-titulo">${receita.descricao || 'Sem descrição'}</span>
            <div class="receita-detalhes">
                ${categoria ? `<span class=\"detalhes-categoria\">${categoria}</span>` : ''}
            </div>
        </div>
        <div class="receita-acoes">
            <span class="receita-valor">${formatCurrency(parseValueToNumber(receita.valor))}</span>
            <div class="receita-badges">
                ${conta ? `<span class=\"badge-circular badge-conta\">${iconeBanco}</span>` : ''}
                <button class="badge-circular badge-status ${statusClasse}" onclick="event.stopPropagation(); toggleReceita('${receita.id}', ${!estaRecebida})">
                    <span class="material-icons">${statusIcone}</span>
                </button>
            </div>
        </div>`;

    // Abrir modal
    item.addEventListener('click', (e) => {
        if (!e.target.closest('.botao-acao')) abrirModalDetalhesReceita(receita);
    });

    // Clique longo para excluir
    let pressTimer;
    const startPress = () => { pressTimer = window.setTimeout(() => promptDeleteReceita(receita.id), 800); };
    const cancelPress = () => clearTimeout(pressTimer);
    item.addEventListener('mousedown', startPress);
    item.addEventListener('mouseup', cancelPress);
    item.addEventListener('mouseleave', cancelPress);
    item.addEventListener('touchstart', startPress);
    item.addEventListener('touchend', cancelPress);

    return item;
}


// --- FUNÇÕES UTILITÁRIAS (Mantidas do seu código original) ---
function groupByDate(receitas) {
    return receitas.reduce((groups, receita) => {
        const dataObj = receita.data instanceof Date ? receita.data : new Date(receita.data);
        const dateKey = isNaN(dataObj) ? 'Data inválida' : dataObj.toDateString();
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(receita);
        return groups;
    }, {});
}

function formatDateGroup(dateString) {
    const date = new Date(dateString);
    const dayName = date.toLocaleDateString('pt-BR', { weekday: 'long' });
    return `${dayName.charAt(0).toUpperCase() + dayName.slice(1)}, ${date.getDate()}`;
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

function updateTotals(receitas) {
    let totalPago = 0;
    let totalPendente = 0;
    receitas.forEach(d => {
        const valor = parseValueToNumber(d.valor);
        // CORREÇÃO: Verificar também o campo 'recebido' usado por receitas recorrentes
        const efetivada = (d.pago === true) || (d.concluida === true) || (d.recebido === true);
        if (efetivada) totalPago += valor; else totalPendente += valor;
    });
    const pagoFormatted = formatCurrency(totalPago);
    const pendenteFormatted = formatCurrency(totalPendente);
    const pagoElement = document.getElementById('total-recebido');
    const pendenteElement = document.getElementById('total-previsto');
    if (pagoElement) pagoElement.textContent = pagoFormatted;
    if (pendenteElement) pendenteElement.textContent = pendenteFormatted;
}

function formatCurrency(value) {
    const numValue = Number(value) || 0;
    const formatted = numValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    return formatted;
}


// --- AÇÕES (Funções originais com melhorias) ---
function promptDeleteReceita(receitaId) {
    receitaParaExcluirId = receitaId;
    document.getElementById('popup-confirmacao').style.display = 'flex';
}

async function confirmDeleteReceita() {
    if (!receitaParaExcluirId) return;
    try {
        await db.collection('receitas').doc(receitaParaExcluirId).delete();
        loadReceitas();
        mostrarPopup('Receita excluída com sucesso!');
    } catch (error) {
        console.error('Erro ao excluir receita:', error);
        mostrarPopup('Erro ao excluir receita. Tente novamente.');
    } finally {
        document.getElementById('popup-confirmacao').style.display = 'none';
        receitaParaExcluirId = null;
    }
}

async function toggleReceita(receitaId, novoStatus) {
    try {
        // Atualiza todos os campos possíveis para garantir compatibilidade
        await db.collection('receitas').doc(receitaId).update({ 
            pago: novoStatus,
            concluida: novoStatus,
            recebido: novoStatus  // Adicionar campo usado por receitas recorrentes
        });
        loadReceitas();
    } catch (error) {
        console.error('Erro ao atualizar receita:', error);
    }
}

window.toggleReceita = toggleReceita;
window.confirmDeleteReceita = confirmDeleteReceita;

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
let receitaAtual = null;

function abrirModalDetalhesReceita(receita) {
    receitaAtual = receita;
    document.getElementById('modal-descricao').textContent = receita.descricao || 'Sem descrição';
    document.getElementById('modal-valor').textContent = formatCurrency(parseValueToNumber(receita.valor));
    document.getElementById('modal-data').textContent = formatarData(receita.data);
    // Conta
    let nomeContaExibicao = '';
    if (receita.conta && typeof receita.conta === 'object') {
        nomeContaExibicao = receita.conta.nome || receita.conta.nomeExibicao || '';
    } else if (receita.carteira && mapaContas[receita.carteira]) {
        nomeContaExibicao = mapaContas[receita.carteira];
    } else if (typeof receita.conta === 'string') {
        nomeContaExibicao = receita.conta;
    }
    if (!nomeContaExibicao) nomeContaExibicao = 'Conta não informada';
    const contaEl = document.getElementById('modal-conta');
    if (contaEl) contaEl.textContent = nomeContaExibicao;
    document.getElementById('modal-categoria').textContent = receita.categoria || 'Sem categoria';
    document.getElementById('modal-tags').textContent = receita.tags || 'Nenhuma tag';
    document.getElementById('modal-lembrete').textContent = receita.lembrete || 'Nenhum';
    document.getElementById('modal-observacao').textContent = receita.observacao || 'Nenhuma';
    // Ícone categoria
    const categoriaIcone = document.querySelector('.detalhe-linha:nth-child(3) .detalhe-item-lado:first-child .material-icons');
    const categoriaKey = (receita.categoria || receita.descricao || 'default').toLowerCase();
    let iconCategory;
    if (receita.iconeCategoria) {
        iconCategory = receita.iconeCategoria;
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
    // Status pago - verifica todos os campos possíveis: 'pago', 'concluida' e 'recebido'
    const statusPago = document.getElementById('status-pago');
    const estaRecebida = receita.pago === true || receita.concluida === true || receita.recebido === true;
    if (statusPago) statusPago.classList.toggle('active', estaRecebida);
    // Toggle ignorar
    const toggleIgnorar = document.getElementById('ignorar-receita');
    if (toggleIgnorar) toggleIgnorar.checked = receita.ignorada || false;
    document.getElementById('modal-detalhes-receita').style.display = 'flex';
}

function fecharModalDetalhesReceita() {
    const modal = document.getElementById('modal-detalhes-receita');
    if (modal) modal.style.display = 'none';
    receitaAtual = null;
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
    // Listeners do modal de receita
    const fechar = document.getElementById('fechar-modal-detalhes');
    if (fechar) fechar.addEventListener('click', fecharModalDetalhesReceita);
    const overlay = document.getElementById('modal-detalhes-receita');
    if (overlay) overlay.addEventListener('click', (e) => { if (e.target.id === 'modal-detalhes-receita') fecharModalDetalhesReceita(); });
    const editar = document.getElementById('botao-editar-receita');
    if (editar) editar.addEventListener('click', () => {
        if (receitaAtual) {
            localStorage.setItem('receitaParaEditar', JSON.stringify(receitaAtual));
            // Página de edição de receita
            window.location.href = `../Editar-Receita/Editar-Receita.html?id=${receitaAtual.id}`;
        }
    });
    const ignorar = document.getElementById('ignorar-receita');
    if (ignorar) ignorar.addEventListener('change', async (e) => {
        if (receitaAtual) {
            try {
                await db.collection('receitas').doc(receitaAtual.id).update({ ignorada: e.target.checked });
                receitaAtual.ignorada = e.target.checked;
            } catch (err) {
                console.error('Erro ao ignorar receita:', err);
                e.target.checked = !e.target.checked;
            }
        }
    });
    const statusPagoBtn = document.getElementById('status-pago');
    if (statusPagoBtn) statusPagoBtn.addEventListener('click', async () => {
        if (receitaAtual) {
            try {
                // Verifica o status atual (pode estar em 'pago', 'concluida' ou 'recebido')
                const statusAtual = receitaAtual.pago === true || receitaAtual.concluida === true || receitaAtual.recebido === true;
                const novoStatus = !statusAtual;
                // Atualiza todos os campos para manter consistência
                await db.collection('receitas').doc(receitaAtual.id).update({ 
                    pago: novoStatus,
                    concluida: novoStatus,
                    recebido: novoStatus
                });
                receitaAtual.pago = novoStatus;
                receitaAtual.concluida = novoStatus;
                receitaAtual.recebido = novoStatus;
                statusPagoBtn.classList.toggle('active', novoStatus);
                loadReceitas();
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
        aplicarFiltrosReceitas();
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
    if (!todasReceitas || todasReceitas.length === 0) return;
    
    // Extrair categorias únicas
    const categorias = [...new Set(todasReceitas
        .map(r => r.categoria)
        .filter(Boolean)
        .map(c => c.toLowerCase())
    )];
    
    // Extrair contas únicas
    const contas = [...new Set(todasReceitas
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
function aplicarFiltrosReceitas() {
    const filtros = {
        situacao: document.querySelector('[data-filtro="situacao"].active')?.dataset.valor || 'todos',
        categoria: document.querySelector('[data-filtro="categoria"].active')?.dataset.valor || 'todos',
        conta: document.querySelector('[data-filtro="conta"].active')?.dataset.valor || 'todos',
        tag: document.querySelector('[data-filtro="tag"].active')?.dataset.valor || 'todos',
        ordem: document.querySelector('.dropdown-item.active')?.dataset.ordem || 'data-desc',
        periodo: document.getElementById('filtro-periodo-toggle').checked
    };
    
    console.log('Filtros aplicados:', filtros);
    
    // Aplicar filtros recarregando as Receitas
    loadReceitas(filtros);
    
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

