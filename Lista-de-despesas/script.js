// --- CONFIGURAÇÃO E VARIÁVEIS GLOBAIS ---
const db = firebase.firestore();
const auth = firebase.auth();

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let currentUser = null;
let despesaParaExcluirId = null; // Armazena o ID da despesa para o popup
let despesaAtual = null; // Variável para armazenar a despesa atualmente selecionada no modal

// MAPEAMENTO COMPLETO DE CATEGORIAS COM ÍCONES E CORES
const categoryDetails = {
    'alimentação': { icon: 'restaurant', background: '#ef4444' },
    'transporte': { icon: 'directions_car', background: '#f59e0b' },
    'moradia': { icon: 'home', background: '#8b5cf6' },
    'saúde': { icon: 'local_hospital', background: '#ec4899' },
    'educação': { icon: 'school', background: '#06b6d4' },
    'lazer': { icon: 'sports_esports', background: '#10b981' },
    'vestuário': { icon: 'checkroom', background: '#64748b' },
    'compras': { icon: 'shopping_cart', background: '#f59e0b' },
    'contas': { icon: 'receipt', background: '#ef4444' },
    'investimentos': { icon: 'trending_up', background: '#22c55e' },
    'impostos': { icon: 'account_balance', background: '#991b1b' },
    'seguros': { icon: 'security', background: '#1e40af' },
    'empréstimos': { icon: 'account_balance_wallet', background: '#7c2d12' },
    'cartão de crédito': { icon: 'credit_card', background: '#be185d' },
    'transferências': { icon: 'swap_horiz', background: '#059669' },
    'doações': { icon: 'volunteer_activism', background: '#dc2626' },
    'pets': { icon: 'pets', background: '#ca8a04' },
    'viagem': { icon: 'flight', background: '#0284c7' },
    'tecnologia': { icon: 'devices', background: '#7c3aed' },
    'outros': { icon: 'more_horiz', background: '#64748b' },
    'default': { icon: 'payment', background: '#64748b' }
};

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    initializeAuth();
    initializeUI();
    
    // Inicializar menu de ações após um pequeno delay
    setTimeout(() => {
        window.menuAcoes = new MenuAcoes();
    }, 100);
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
    document.getElementById('prev-month').addEventListener('click', () => changeMonth(-1));
    document.getElementById('next-month').addEventListener('click', () => changeMonth(1));
    
    // Listeners do popup de exclusão
    document.getElementById('popup-cancelar').addEventListener('click', () => {
        document.getElementById('popup-confirmacao').style.display = 'none';
    });
    document.getElementById('popup-excluir').addEventListener('click', confirmDeleteDespesa);
    
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
        
        return descricao.includes(termoLower) || 
               categoria.includes(termoLower) || 
               conta.includes(termoLower);
    });
    
    console.log('Despesas filtradas:', despesasFiltradas.length);
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

function toggleDropdown() {
    const dropdown = document.getElementById('dropdown-menu');
    
    if (!dropdown) {
        createDropdown();
    } else {
        const isVisible = dropdown.style.display === 'block';
        dropdown.style.display = isVisible ? 'none' : 'block';
    }
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
    document.getElementById('current-month').textContent = `${monthNames[currentMonth]} ${currentYear}`;
}

// --- LÓGICA DE DADOS (Mantida do seu código original) ---
async function loadDespesas(filtros = null) {
    if (!currentUser) return;

    try {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

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
            console.log('Campo pago:', data.pago);
            
            const despesaDate = parseDateField(data.data) || new Date();
            console.log('Data parseada:', despesaDate);
            console.log('Primeiro dia:', firstDay);
            console.log('Último dia:', lastDay);
            console.log('Data está no range?:', despesaDate >= firstDay && despesaDate <= lastDay);
            
            if (despesaDate >= firstDay && despesaDate <= lastDay) {
                // normalize: store data as Date object for later use
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
        despesasFiltradas.forEach((d, i) => {
            console.log(`Despesa ${i+1}:`, {
                id: d.id,
                descricao: d.descricao,
                valor: d.valor,
                pago: d.pago,
                data: d.data
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
    
    // Filtro por situação
    if (filtros.situacao && filtros.situacao !== 'todos') {
        switch (filtros.situacao) {
            case 'efetuadas':
                despesasFiltradas = despesasFiltradas.filter(d => d.pago === true);
                break;
            case 'pendentes':
                despesasFiltradas = despesasFiltradas.filter(d => d.pago !== true);
                break;
            case 'ignoradas':
                // Você pode implementar a lógica para despesas ignoradas
                // Por exemplo, se tiver um campo 'ignorada'
                despesasFiltradas = despesasFiltradas.filter(d => d.ignorada === true);
                break;
        }
    }
    
    // Filtro por categoria
    if (filtros.categoria && filtros.categoria !== 'todos') {
        despesasFiltradas = despesasFiltradas.filter(r => 
            r.categoria && r.categoria.toLowerCase().includes(filtros.categoria.toLowerCase())
        );
    }
    
    // Filtro por conta
    if (filtros.conta && filtros.conta !== 'todos') {
        despesasFiltradas = despesasFiltradas.filter(r => {
            const contaNome = typeof r.conta === 'object' && r.conta !== null 
                ? (r.conta.nome || r.conta.nomeExibicao || '')
                : (r.conta || '');
            return contaNome.toLowerCase().includes(filtros.conta.toLowerCase());
        });
    }
    
    // Filtro por tag
    if (filtros.tag && filtros.tag !== 'todos') {
        despesasFiltradas = despesasFiltradas.filter(r => 
            r.tags && Array.isArray(r.tags) && r.tags.some(tag => 
                tag.toLowerCase().includes(filtros.tag.toLowerCase())
            )
        );
    }
    
    console.log('Filtros aplicados:', filtros);
    console.log('Despesas antes do filtro:', despesas.length);
    console.log('Despesas após filtro:', despesasFiltradas.length);
    
    return despesasFiltradas;
}

// --- RENDERIZAÇÃO (Adaptada para o novo design) ---
function renderDespesas(despesas) {
    const container = document.getElementById('despesas-list');
    container.innerHTML = '';

    if (despesas.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem 2rem; color: #6b7280;">
                <div style="margin-bottom: 1rem;">
                    <span class="material-icons-round" style="font-size: 3rem; opacity: 0.3;">shopping_cart</span>
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

    const groupedDespesas = groupByDate(despesas);
    const sortedDates = Object.keys(groupedDespesas).sort((a, b) => new Date(b) - new Date(a));

    sortedDates.forEach(dateKey => {
        const grupo = document.createElement('div');
        grupo.className = 'grupo-data';
        grupo.innerHTML = `<h3 class="titulo-data">${formatDateGroup(dateKey)}</h3>`;
        
        groupedDespesas[dateKey].forEach(despesa => {
            grupo.appendChild(createDespesaItem(despesa));
        });
        container.appendChild(grupo);
    });
}

function createDespesaItem(despesa) {
    const item = document.createElement('div');
    item.className = 'despesa-item';

    // PRIORIDADE: Usar categoria salva na despesa, senão fallback para descrição
    const categoriaKey = (despesa.categoria || despesa.descricao || 'default').toLowerCase();
    
    // SISTEMA DE ÍCONES E CORES PERSONALIZADOS:
    // 1º - Verificar se há ícone e cor salvos na despesa (prioridade)
    // 2º - Usar mapeamento padrão baseado na categoria/descrição
    let icon, background;
    
    if (despesa.iconeCategoria && despesa.corCategoria) {
        // Usar ícone e cor salvos diretamente na despesa
        icon = despesa.iconeCategoria;
        background = despesa.corCategoria;
        console.log(`Usando ícone/cor salvos: ${icon} / ${background}`);
    } else {
        // Fallback para mapeamento padrão
        const categoryInfo = categoryDetails[categoriaKey] || categoryDetails.default;
        icon = categoryInfo.icon;
        background = categoryInfo.background;
        console.log(`Usando mapeamento padrão: ${icon} / ${background} para categoria: ${categoriaKey}`);
    }
    
    // Mostrar categoria e conta em uma linha separados por "|"
    const categoria = despesa.categoria || '';
    let conta = '';
    if (typeof despesa.carteira === 'object' && despesa.carteira !== null) {
        conta = despesa.carteira.nome || despesa.carteira.nomeExibicao || '';
    } else {
        conta = despesa.carteira || '';
    }
    
    // Criar string com categoria | conta
    const detalhes = [categoria, conta].filter(Boolean).join(' | ');

    // Verificar se é despesa automática
    const isAutomatica = despesa.origem === 'automatica';
    const indicadorAutomatico = isAutomatica ? '<span class="indicador-automatico" title="Despesa gerada automaticamente">🔄</span>' : '';

    item.innerHTML = `
        <div class="despesa-icone" style="background-color: ${background};">
            <span class="material-icons">${icon}</span>
        </div>
        <div class="despesa-conteudo">
            <span class="despesa-titulo">${despesa.descricao} ${indicadorAutomatico}</span>
            <div class="despesa-detalhes">
                ${detalhes ? `<span class="detalhes-linha">${detalhes}</span>` : ''}
            </div>
        </div>
        <div class="despesa-acoes">
            <span class="despesa-valor">${formatCurrency(parseValueToNumber(despesa.valor))}</span>
            <button class="botao-acao botao-status ${despesa.pago ? 'concluido' : ''}" onclick="toggleDespesa('${despesa.id}', ${!despesa.pago})">
                <span class="material-icons">check_circle</span>
            </button>
        </div>
    `;

    // Adicionar event listener para abrir modal de detalhes
    item.addEventListener('click', (e) => {
        // Prevenir que cliques nos botões de ação abram o modal
        if (!e.target.closest('.botao-acao')) {
            abrirModalDetalhes(despesa);
        }
    });

    // Adiciona listener para exclusão com clique longo (melhor UX)
    let pressTimer;
    item.addEventListener('mousedown', () => { pressTimer = window.setTimeout(() => promptDeleteDespesa(despesa.id), 800); });
    item.addEventListener('mouseup', () => clearTimeout(pressTimer));
    item.addEventListener('mouseleave', () => clearTimeout(pressTimer));
    item.addEventListener('touchstart', () => { pressTimer = window.setTimeout(() => promptDeleteDespesa(despesa.id), 800); });
    item.addEventListener('touchend', () => clearTimeout(pressTimer));

    return item;
}


// --- FUNÇÕES UTILITÁRIAS (Mantidas do seu código original) ---
function groupByDate(despesas) {
    return despesas.reduce((groups, despesa) => {
        const dateKey = despesa.data.toDateString(); // data já é objeto Date normalizado
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
    console.log('=== ATUALIZANDO TOTAIS ===');
    console.log('Despesas recebidas:', despesas);
    console.log('Quantidade de despesas:', despesas.length);
    
    // Calcular total previsto (todas as despesas)
    const totalPrevisto = despesas.reduce((sum, r) => {
        const valor = parseValueToNumber(r.valor);
        console.log(`Despesa ${r.descricao}: valor=${r.valor}, convertido=${valor}`);
        return sum + valor;
    }, 0);
    
    // Calcular total pago (apenas despesas pagas)
    const despesasPagas = despesas.filter(r => r.pago === true);
    console.log('Despesas pagas filtradas:', despesasPagas.length);
    
    const totalPago = despesasPagas.reduce((sum, r) => {
        const valor = parseValueToNumber(r.valor);
        console.log(`Despesa paga ${r.descricao}: valor original=${r.valor}, convertido=${valor}`);
        return sum + valor;
    }, 0);

    console.log('Total previsto calculado:', totalPrevisto);
    console.log('Total pago calculado:', totalPago);
    
    const pagoFormatted = formatCurrency(totalPago);
    const previstoFormatted = formatCurrency(totalPrevisto);
    
    console.log('Pago formatado:', pagoFormatted);
    console.log('Previsto formatado:', previstoFormatted);

    const pagoElement = document.getElementById('total-recebido');
    const previstoElement = document.getElementById('total-previsto');
    
    if (pagoElement) {
        pagoElement.textContent = pagoFormatted;
        console.log('Elemento total-recebido atualizado');
    } else {
        console.error('Elemento total-recebido não encontrado');
    }
    
    if (previstoElement) {
        previstoElement.textContent = previstoFormatted;
        console.log('Elemento total-previsto atualizado');
    } else {
        console.error('Elemento total-previsto não encontrado');
    }
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

// Tornar funções globais para onclick
window.toggleDespesa = toggleDespesa;

// === FUNÇÕES DO MODAL DE DETALHES ===

function abrirModalDetalhes(despesa) {
    despesaAtual = despesa;
    
    // Preencher os dados no modal com dados reais da despesa
    document.getElementById('modal-descricao').textContent = despesa.descricao || 'Sem descrição';
    document.getElementById('modal-valor').textContent = formatCurrency(parseValueToNumber(despesa.valor));
    document.getElementById('modal-data').textContent = formatarData(despesa.data);
    
    // Exibir nome da conta corretamente - verificar várias propriedades possíveis
    let nomeContaExibicao = '';
    if (typeof despesa.conta === 'object' && despesa.conta !== null) {
        nomeContaExibicao = despesa.conta.nome || 
                           despesa.conta.nomeExibicao || 
                           despesa.conta.banco || 
                           despesa.conta.nomeCompleto ||
                           despesa.conta.nomeBanco ||
                           despesa.conta.id ||
                           'Conta não informada';
    } else if (typeof despesa.carteira === 'object' && despesa.carteira !== null) {
        // Tentar usar carteira se conta não estiver disponível
        nomeContaExibicao = despesa.carteira.nome || 
                           despesa.carteira.nomeExibicao || 
                           despesa.carteira.banco || 
                           despesa.carteira.nomeCompleto ||
                           despesa.carteira.nomeBanco ||
                           despesa.carteira.id ||
                           'Conta não informada';
    } else {
        nomeContaExibicao = despesa.conta || despesa.carteira || 'Conta não informada';
    }
    document.getElementById('modal-conta').textContent = nomeContaExibicao;
    
    document.getElementById('modal-categoria').textContent = despesa.categoria || 'Sem categoria';
    document.getElementById('modal-tags').textContent = despesa.tags || 'Nenhuma tag';
    document.getElementById('modal-lembrete').textContent = despesa.lembrete || 'Nenhum';
    document.getElementById('modal-observacao').textContent = despesa.observacao || 'Nenhuma';
    
    // Configurar ícone da categoria baseado no sistema existente
    const categoriaIcone = document.querySelector('.detalhe-linha:nth-child(3) .detalhe-item-lado:first-child .material-icons');
    const categoriaKey = (despesa.categoria || despesa.descricao || 'default').toLowerCase();
    
    let iconCategory;
    if (despesa.iconeCategoria) {
        // Usar ícone salvo na despesa
        iconCategory = despesa.iconeCategoria;
    } else {
        // Usar mapeamento padrão
        const categoryInfo = categoryDetails[categoriaKey] || categoryDetails.default;
        iconCategory = categoryInfo.icon;
    }
    
    if (categoriaIcone) {
        categoriaIcone.textContent = iconCategory;
    }
    
    // Configurar ícone da conta baseado na conta real
    const contaIcone = document.getElementById('modal-conta-icone');
    let contaNome = '';
    
    // Verificar se despesa.conta é um objeto ou string
    if (typeof despesa.conta === 'object' && despesa.conta !== null) {
        contaNome = (despesa.conta.nome || despesa.conta.nomeExibicao || '').toLowerCase();
    } else {
        contaNome = (despesa.conta || '').toLowerCase();
    }
    
    if (contaNome.includes('nubank')) {
        contaIcone.style.background = '#8b5cf6'; // Roxo do Nubank
        contaIcone.innerHTML = '<span class="material-icons">account_balance</span>';
    } else if (contaNome.includes('bradesco')) {
        contaIcone.style.background = '#e53e3e'; // Vermelho do Bradesco
        contaIcone.innerHTML = '<span class="material-icons">account_balance</span>';
    } else if (contaNome.includes('itau') || contaNome.includes('itaú')) {
        contaIcone.style.background = '#ff8c00'; // Laranja do Itaú
        contaIcone.innerHTML = '<span class="material-icons">account_balance</span>';
    } else if (contaNome.includes('santander')) {
        contaIcone.style.background = '#e53e3e'; // Vermelho do Santander
        contaIcone.innerHTML = '<span class="material-icons">account_balance</span>';
    } else if (contaNome.includes('caixa')) {
        contaIcone.style.background = '#0066cc'; // Azul da Caixa
        contaIcone.innerHTML = '<span class="material-icons">account_balance</span>';
    } else if (contaNome.includes('banco do brasil') || contaNome.includes('bb')) {
        contaIcone.style.background = '#ffdd00'; // Amarelo do BB
        contaIcone.innerHTML = '<span class="material-icons">account_balance</span>';
    } else if (contaNome.includes('picpay')) {
        contaIcone.style.background = '#21c25e'; // Verde do PicPay
        contaIcone.innerHTML = '<span class="material-icons">account_balance</span>';
    } else {
        contaIcone.style.background = '#64748b'; // Cinza padrão
        contaIcone.innerHTML = '<span class="material-icons">account_balance</span>';
    }
    
    // Configurar status do botão "Pago"
    const statusPago = document.getElementById('status-pago');
    if (despesa.pago) {
        statusPago.classList.add('active');
    } else {
        statusPago.classList.remove('active');
    }
    
    // Configurar toggle de ignorar
    const toggleIgnorar = document.getElementById('ignorar-despesa');
    toggleIgnorar.checked = despesa.ignorada || false;
    
    // Atualizar totais no header (calcular com base nas despesas carregadas)
    calcularTotaisModal();
    
    // Mostrar modal
    document.getElementById('modal-detalhes-despesa').style.display = 'flex';
}

function fecharModalDetalhes() {
    document.getElementById('modal-detalhes-despesa').style.display = 'none';
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

// Event listeners para o modal
document.addEventListener('DOMContentLoaded', () => {
    // ... código existente ...
    
    // Event listeners do modal
    const fecharModalBtn = document.getElementById('fechar-modal-detalhes');
    if (fecharModalBtn) {
        fecharModalBtn.addEventListener('click', fecharModalDetalhes);
    }
    
    // Fechar modal ao clicar no overlay
    const modalDetalhes = document.getElementById('modal-detalhes-despesa');
    if (modalDetalhes) {
        modalDetalhes.addEventListener('click', (e) => {
            if (e.target.id === 'modal-detalhes-despesa') {
                fecharModalDetalhes();
            }
        });
    }
    
    // Botão editar despesa
    const botaoEditarDespesa = document.getElementById('botao-editar-despesa');
    if (botaoEditarDespesa) {
        botaoEditarDespesa.addEventListener('click', () => {
            if (despesaAtual) {
                // Redirecionar para página de edição com os dados da despesa
                localStorage.setItem('despesaParaEditar', JSON.stringify(despesaAtual));
                window.location.href = `../Editar-Despesa/Editar-Despesa.html?id=${despesaAtual.id}`;
            }
        });
    }
    
    // Toggle ignorar despesa
    const toggleIgnorarDespesa = document.getElementById('ignorar-despesa');
    if (toggleIgnorarDespesa) {
        toggleIgnorarDespesa.addEventListener('change', async (e) => {
            if (despesaAtual) {
                try {
                    await db.collection('despesas').doc(despesaAtual.id).update({ 
                        ignorada: e.target.checked 
                    });
                    despesaAtual.ignorada = e.target.checked;
                } catch (error) {
                    console.error('Erro ao atualizar status de ignorar:', error);
                    e.target.checked = !e.target.checked; // Reverter o toggle
                }
            }
        });
    }
    
    // Status filters
    document.getElementById('status-pago').addEventListener('click', async () => {
        if (despesaAtual) {
            try {
                const novoStatus = !despesaAtual.pago;
                await db.collection('despesas').doc(despesaAtual.id).update({ 
                    pago: novoStatus 
                });
                despesaAtual.pago = novoStatus;
                
                // Atualizar visual
                const btn = document.getElementById('status-pago');
                if (novoStatus) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
                
                // Recarregar lista
                loadDespesas();
            } catch (error) {
                console.error('Erro ao atualizar status da receita:', error);
            }
        }
    });
});

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

// Menu de Ações Flutuante
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
            console.warn('Elementos do menu de ações não encontrados');
            console.log('menuElement:', this.menuElement);
            console.log('botaoAdicionar:', this.botaoAdicionar);
            return;
        }

        console.log('Inicializando menu de ações na Lista de Despesas');

        // Event listener para o botão adicionar
        this.botaoAdicionar.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Botão + clicado - abrindo menu de ações');
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

        // Event listeners para as ações
        const acaoItems = this.menuElement?.querySelectorAll('.acao-item');
        acaoItems?.forEach(item => {
            item.addEventListener('click', (e) => {
                // Permitir navegação normal
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
        // Pequeno delay para permitir a transição
        setTimeout(() => {
            this.menuElement.classList.add('ativo');
        }, 10);
        
        // Bloquear scroll do body
        document.body.style.overflow = 'hidden';
        
        console.log('Menu de ações aberto');
    }

    fecharMenu() {
        this.isMenuAberto = false;
        this.menuElement.classList.remove('ativo');
        
        // Aguardar animação antes de esconder
        setTimeout(() => {
            this.menuElement.style.display = 'none';
        }, 300);
        
        // Restaurar scroll do body
        document.body.style.overflow = '';
        
        console.log('Menu de ações fechado');
    }
}