// --- CONFIGURAÇÃO E VARIÁVEIS GLOBAIS ---
const db = firebase.firestore();
const auth = firebase.auth();

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let currentUser = null;
let receitaParaExcluirId = null; // Armazena o ID da receita para o popup

// MAPEAMENTO COMPLETO DE CATEGORIAS COM ÍCONES E CORES
const categoryDetails = {
    'processo cedaspy': { icon: 'trending_up', background: '#22c55e' },
    'rendimentos de processos': { icon: 'trending_up', background: '#22c55e' },
    'pis': { icon: 'stars', background: '#8b5cf6' },
    'pagamento abono salarial': { icon: 'stars', background: '#8b5cf6' },
    'bonificação': { icon: 'stars', background: '#8b5cf6' },
    'salário': { icon: 'attach_money', background: '#ef4444' },
    'salario': { icon: 'attach_money', background: '#ef4444' },
    'salário ionlab': { icon: 'attach_money', background: '#ef4444' },
    'freelance': { icon: 'work', background: '#f59e0b' },
    'investimentos': { icon: 'analytics', background: '#14b8a6' },
    'dividendos': { icon: 'analytics', background: '#14b8a6' },
    'vendas': { icon: 'shopping_cart', background: '#10b981' },
    'comissão': { icon: 'percent', background: '#8b5cf6' },
    'prêmio': { icon: 'emoji_events', background: '#f59e0b' },
    'reembolso': { icon: 'cached', background: '#6366f1' },
    'aluguel': { icon: 'home', background: '#ef4444' },
    'pensão': { icon: 'account_balance', background: '#64748b' },
    'aposentadoria': { icon: 'elderly', background: '#64748b' },
    'auxílio': { icon: 'help', background: '#06b6d4' },
    'benefício': { icon: 'favorite', background: '#ec4899' },
    'default': { icon: 'receipt_long', background: '#64748b' }
};

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

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
            loadReceitas();
        } else {
            window.location.href = '../Login/Login.html';
        }
    });
}

function initializeUI() {
    document.getElementById('prev-month').addEventListener('click', () => changeMonth(-1));
    document.getElementById('next-month').addEventListener('click', () => changeMonth(1));
    
    // Listener para o botão adicionar da barra de navegação
    const botaoAdicionar = document.querySelector('.botao-adicionar');
    if (botaoAdicionar) {
        botaoAdicionar.addEventListener('click', () => {
            window.location.href = '../Nova-Receita/Nova-Receita.html';
        });
    }
    
    // Listeners do popup de exclusão
    document.getElementById('popup-cancelar').addEventListener('click', () => {
        document.getElementById('popup-confirmacao').style.display = 'none';
    });
    document.getElementById('popup-excluir').addEventListener('click', confirmDeleteReceita);
    
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
            loadReceitas(); // Recarregar todas as receitas
        });
    }
    
    if (inputBusca) {
        inputBusca.addEventListener('input', (e) => {
            console.log('Buscando por:', e.target.value);
            buscarReceitas(e.target.value);
        });
    }
}

let todasReceitas = []; // Armazenar todas as receitas para busca

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
        
        return descricao.includes(termoLower) || 
               categoria.includes(termoLower) || 
               conta.includes(termoLower);
    });
    
    console.log('Receitas filtradas:', receitasFiltradas.length);
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
    document.getElementById('current-month').textContent = `${monthNames[currentMonth]} ${currentYear}`;
}

// --- LÓGICA DE DADOS (Mantida do seu código original) ---
async function loadReceitas(filtros = null) {
    if (!currentUser) return;

    try {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

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
            console.log('=== PROCESSANDO RECEITA ===');
            console.log('ID:', doc.id);
            console.log('Data bruta:', data);
            console.log('Campo data:', data.data);
            console.log('Campo valor:', data.valor);
            console.log('Campo concluida:', data.concluida);
            
            const receitaDate = parseDateField(data.data) || new Date();
            console.log('Data parseada:', receitaDate);
            console.log('Primeiro dia:', firstDay);
            console.log('Último dia:', lastDay);
            console.log('Data está no range?:', receitaDate >= firstDay && receitaDate <= lastDay);
            
            if (receitaDate >= firstDay && receitaDate <= lastDay) {
                // normalize: store data as Date object for later use
                const receita = { id: doc.id, ...data, data: receitaDate };
                console.log('Receita adicionada:', receita);
                receitas.push(receita);
            } else {
                console.log('Receita fora do range, ignorada');
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

        console.log('=== RECEITAS FINAIS ===');
        console.log('Total de receitas encontradas:', receitasFiltradas.length);
        receitasFiltradas.forEach((r, i) => {
            console.log(`Receita ${i+1}:`, {
                id: r.id,
                descricao: r.descricao,
                valor: r.valor,
                concluida: r.concluida,
                data: r.data
            });
        });

        // Armazenar para busca
        todasReceitas = receitasFiltradas;

        renderReceitas(receitasFiltradas);
        updateTotals(receitasFiltradas);

    } catch (error) {
        console.error('Erro ao carregar receitas:', error);
    }
}

// Função para aplicar filtros nas receitas
function aplicarFiltros(receitas, filtros) {
    let receitasFiltradas = [...receitas];
    
    // Filtro por situação
    if (filtros.situacao && filtros.situacao !== 'todos') {
        switch (filtros.situacao) {
            case 'efetuadas':
                receitasFiltradas = receitasFiltradas.filter(r => r.recebido === true || r.concluida === true);
                break;
            case 'pendentes':
                receitasFiltradas = receitasFiltradas.filter(r => r.recebido !== true && r.concluida !== true);
                break;
            case 'ignoradas':
                // Você pode implementar a lógica para receitas ignoradas
                // Por exemplo, se tiver um campo 'ignorada'
                receitasFiltradas = receitasFiltradas.filter(r => r.ignorada === true);
                break;
        }
    }
    
    // Filtro por categoria
    if (filtros.categoria && filtros.categoria !== 'todos') {
        receitasFiltradas = receitasFiltradas.filter(r => 
            r.categoria && r.categoria.toLowerCase().includes(filtros.categoria.toLowerCase())
        );
    }
    
    // Filtro por conta
    if (filtros.conta && filtros.conta !== 'todos') {
        receitasFiltradas = receitasFiltradas.filter(r => {
            const contaNome = typeof r.conta === 'object' && r.conta !== null 
                ? (r.conta.nome || r.conta.nomeExibicao || '')
                : (r.conta || '');
            return contaNome.toLowerCase().includes(filtros.conta.toLowerCase());
        });
    }
    
    // Filtro por tag
    if (filtros.tag && filtros.tag !== 'todos') {
        receitasFiltradas = receitasFiltradas.filter(r => 
            r.tags && Array.isArray(r.tags) && r.tags.some(tag => 
                tag.toLowerCase().includes(filtros.tag.toLowerCase())
            )
        );
    }
    
    console.log('Filtros aplicados:', filtros);
    console.log('Receitas antes do filtro:', receitas.length);
    console.log('Receitas após filtro:', receitasFiltradas.length);
    
    return receitasFiltradas;
}

// --- RENDERIZAÇÃO (Adaptada para o novo design) ---
function renderReceitas(receitas) {
    const container = document.getElementById('receitas-list');
    container.innerHTML = '';

    if (receitas.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem 2rem; color: #6b7280;">
                <div style="margin-bottom: 1rem;">
                    <span class="material-icons-round" style="font-size: 3rem; opacity: 0.3;">receipt_long</span>
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

    const groupedReceitas = groupByDate(receitas);
    const sortedDates = Object.keys(groupedReceitas).sort((a, b) => new Date(b) - new Date(a));

    sortedDates.forEach(dateKey => {
        const grupo = document.createElement('div');
        grupo.className = 'grupo-data';
        grupo.innerHTML = `<h3 class="titulo-data">${formatDateGroup(dateKey)}</h3>`;
        
        groupedReceitas[dateKey].forEach(receita => {
            grupo.appendChild(createReceitaItem(receita));
        });
        container.appendChild(grupo);
    });
}

function createReceitaItem(receita) {
    const item = document.createElement('div');
    item.className = 'receita-item';

    // PRIORIDADE: Usar categoria salva na receita, senão fallback para descrição
    const categoriaKey = (receita.categoria || receita.descricao || 'default').toLowerCase();
    
    // SISTEMA DE ÍCONES E CORES PERSONALIZADOS:
    // 1º - Verificar se há ícone e cor salvos na receita (prioridade)
    // 2º - Usar mapeamento padrão baseado na categoria/descrição
    let icon, background;
    
    if (receita.iconeCategoria && receita.corCategoria) {
        // Usar ícone e cor salvos diretamente na receita
        icon = receita.iconeCategoria;
        background = receita.corCategoria;
        console.log(`Usando ícone/cor salvos: ${icon} / ${background}`);
    } else {
        // Fallback para mapeamento padrão (com aliases)
        const aliases = {
            'decimo terceiro': 'calendar_month',
            'decimo-terceiro': 'calendar_month',
            '13 salario': 'calendar_month',
            '13o salario': 'calendar_month',
            '13o': 'calendar_month',
            '13º': 'calendar_month',
            'venda de servicos': 'work',
            'venda de produtos': 'point_of_sale'
        };
        const norm = categoriaKey.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const iconeAlias = aliases[norm];
        if (iconeAlias) {
            icon = iconeAlias;
            background = (categoryDetails[categoriaKey] || categoryDetails.default).background;
        } else {
            const categoryInfo = categoryDetails[categoriaKey] || categoryDetails.default;
            icon = categoryInfo.icon;
            background = categoryInfo.background;
        }
        console.log(`Usando fallback: ${icon} / ${background} para categoria: ${categoriaKey}`);
    }
    
    // Mostrar categoria e conta em uma linha separados por "|"
    const categoria = receita.categoria || '';
    let conta = '';
    if (typeof receita.conta === 'object' && receita.conta !== null) {
        conta = receita.conta.nome || receita.conta.nomeExibicao || '';
    } else {
        conta = receita.conta || '';
    }
    
    // Criar string com categoria | conta
    const detalhes = [categoria, conta].filter(Boolean).join(' | ');

    item.innerHTML = `
        <div class="receita-icone" style="background-color: ${background};">
            <span class="material-icons">${icon}</span>
        </div>
        <div class="receita-conteudo">
            <span class="receita-titulo">${receita.descricao}</span>
            <div class="receita-detalhes">
                ${detalhes ? `<span class="detalhes-linha">${detalhes}</span>` : ''}
            </div>
        </div>
        <div class="receita-acoes">
            <span class="receita-valor">${formatCurrency(parseValueToNumber(receita.valor))}</span>
            <button class="botao-acao botao-status ${receita.recebido ? 'concluido' : ''}" onclick="toggleReceita('${receita.id}', ${!receita.recebido})">
                <span class="material-icons">check_circle</span>
            </button>
        </div>
    `;

    // Adicionar event listener para abrir modal de detalhes
    item.addEventListener('click', (e) => {
        // Prevenir que cliques nos botões de ação abram o modal
        if (!e.target.closest('.botao-acao')) {
            abrirModalDetalhes(receita);
        }
    });

    // Adiciona listener para exclusão com clique longo (melhor UX)
    let pressTimer;
    item.addEventListener('mousedown', () => { pressTimer = window.setTimeout(() => promptDeleteReceita(receita.id), 800); });
    item.addEventListener('mouseup', () => clearTimeout(pressTimer));
    item.addEventListener('mouseleave', () => clearTimeout(pressTimer));
    item.addEventListener('touchstart', () => { pressTimer = window.setTimeout(() => promptDeleteReceita(receita.id), 800); });
    item.addEventListener('touchend', () => clearTimeout(pressTimer));

    return item;
}


// --- FUNÇÕES UTILITÁRIAS (Mantidas do seu código original) ---
function groupByDate(receitas) {
    return receitas.reduce((groups, receita) => {
        const dateKey = receita.data.toDateString(); // data já é objeto Date normalizado
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

function updateTotals(receitas) {
    console.log('=== ATUALIZANDO TOTAIS ===');
    console.log('Receitas recebidas:', receitas);
    console.log('Quantidade de receitas:', receitas.length);
    
    // Calcular total previsto (todas as receitas)
    const totalPrevisto = receitas.reduce((sum, r) => {
        const valor = parseValueToNumber(r.valor);
        console.log(`Receita ${r.descricao}: valor=${r.valor}, convertido=${valor}`);
        return sum + valor;
    }, 0);
    
    // Calcular total recebido (apenas receitas recebidas)
    const receitasRecebidas = receitas.filter(r => r.recebido === true);
    console.log('Receitas recebidas filtradas:', receitasRecebidas.length);
    
    const totalRecebido = receitasRecebidas.reduce((sum, r) => {
        const valor = parseValueToNumber(r.valor);
        console.log(`Receita recebida ${r.descricao}: valor original=${r.valor}, convertido=${valor}`);
        return sum + valor;
    }, 0);

    console.log('Total previsto calculado:', totalPrevisto);
    console.log('Total recebido calculado:', totalRecebido);
    
    const recebidoFormatted = formatCurrency(totalRecebido);
    const previstoFormatted = formatCurrency(totalPrevisto);
    
    console.log('Recebido formatado:', recebidoFormatted);
    console.log('Previsto formatado:', previstoFormatted);

    const recebidoElement = document.getElementById('total-recebido');
    const previstoElement = document.getElementById('total-previsto');
    
    if (recebidoElement) {
        recebidoElement.textContent = recebidoFormatted;
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
        await db.collection('receitas').doc(receitaId).update({ recebido: novoStatus });
        loadReceitas();
    } catch (error) {
        console.error('Erro ao atualizar receita:', error);
    }
}

// Tornar funções globais para onclick
window.toggleReceita = toggleReceita;

// === FUNÇÕES DO MODAL DE DETALHES ===
let receitaAtual = null;

function abrirModalDetalhes(receita) {
    receitaAtual = receita;
    
    // Preencher os dados no modal com dados reais da receita
    document.getElementById('modal-descricao').textContent = receita.descricao || 'Sem descrição';
    document.getElementById('modal-valor').textContent = formatCurrency(parseValueToNumber(receita.valor));
    document.getElementById('modal-data').textContent = formatarData(receita.data);
    
    // Exibir nome da conta corretamente
    let nomeContaExibicao = '';
    if (typeof receita.conta === 'object' && receita.conta !== null) {
        nomeContaExibicao = receita.conta.nome || receita.conta.nomeExibicao || 'Conta não informada';
    } else {
        nomeContaExibicao = receita.conta || 'Conta não informada';
    }
    document.getElementById('modal-conta').textContent = nomeContaExibicao;
    
    document.getElementById('modal-categoria').textContent = receita.categoria || 'Sem categoria';
    document.getElementById('modal-tags').textContent = receita.tags || 'Nenhuma tag';
    document.getElementById('modal-lembrete').textContent = receita.lembrete || 'Nenhum';
    document.getElementById('modal-observacao').textContent = receita.observacao || 'Nenhuma';
    
    // Configurar ícone da categoria baseado no sistema existente
    const categoriaIcone = document.querySelector('.detalhe-linha:nth-child(3) .detalhe-item-lado:first-child .material-icons');
    const categoriaKey = (receita.categoria || receita.descricao || 'default').toLowerCase();
    
    let iconCategory;
    if (receita.iconeCategoria) {
        // Usar ícone salvo na receita
        iconCategory = receita.iconeCategoria;
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
    
    // Verificar se receita.conta é um objeto ou string
    if (typeof receita.conta === 'object' && receita.conta !== null) {
        contaNome = (receita.conta.nome || receita.conta.nomeExibicao || '').toLowerCase();
    } else {
        contaNome = (receita.conta || '').toLowerCase();
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
    
    // Configurar status do botão "Recebido"
    const statusRecebido = document.getElementById('status-recebido');
    if (receita.recebido) {
        statusRecebido.classList.add('active');
    } else {
        statusRecebido.classList.remove('active');
    }
    
    // Configurar toggle de ignorar
    const toggleIgnorar = document.getElementById('ignorar-receita');
    toggleIgnorar.checked = receita.ignorada || false;
    
    // Atualizar totais no header (calcular com base nas receitas carregadas)
    calcularTotaisModal();
    
    // Mostrar modal
    document.getElementById('modal-detalhes-receita').style.display = 'flex';
}

function fecharModalDetalhes() {
    document.getElementById('modal-detalhes-receita').style.display = 'none';
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

// Event listeners para o modal
document.addEventListener('DOMContentLoaded', () => {
    // ... código existente ...
    
    // Event listeners do modal
    document.getElementById('fechar-modal-detalhes').addEventListener('click', fecharModalDetalhes);
    
    // Fechar modal ao clicar no overlay
    document.getElementById('modal-detalhes-receita').addEventListener('click', (e) => {
        if (e.target.id === 'modal-detalhes-receita') {
            fecharModalDetalhes();
        }
    });
    
    // Botão editar receita
    document.getElementById('botao-editar-receita').addEventListener('click', () => {
        if (receitaAtual) {
            // Redirecionar para página de edição com os dados da receita
            localStorage.setItem('receitaParaEditar', JSON.stringify(receitaAtual));
            window.location.href = `../Editar-Receita/Editar-Receita.html?id=${receitaAtual.id}`;
        }
    });
    
    // Toggle ignorar receita
    document.getElementById('ignorar-receita').addEventListener('change', async (e) => {
        if (receitaAtual) {
            try {
                await db.collection('receitas').doc(receitaAtual.id).update({ 
                    ignorada: e.target.checked 
                });
                receitaAtual.ignorada = e.target.checked;
            } catch (error) {
                console.error('Erro ao atualizar status de ignorar:', error);
                e.target.checked = !e.target.checked; // Reverter o toggle
            }
        }
    });
    
    // Status filters
    document.getElementById('status-recebido').addEventListener('click', async () => {
        if (receitaAtual) {
            try {
                const novoStatus = !receitaAtual.recebido;
                await db.collection('receitas').doc(receitaAtual.id).update({ 
                    recebido: novoStatus 
                });
                receitaAtual.recebido = novoStatus;
                
                // Atualizar visual
                const btn = document.getElementById('status-recebido');
                if (novoStatus) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
                
                // Recarregar lista
                loadReceitas();
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
    
    // Aplicar filtros recarregando as receitas
    loadReceitas(filtros);
    
    // Mostrar mensagem de sucesso
    mostrarPopup('Filtros aplicados com sucesso!');
}