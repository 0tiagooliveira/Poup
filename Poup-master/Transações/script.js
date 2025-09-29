// --- CONFIGURAÇÃO E VARIÁVEIS GLOBAIS ---
const db = firebase.firestore();
const auth = firebase.auth();

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let currentUser = null;

// MAPEAMENTO DE CATEGORIAS COM ÍCONES E CORES
const categoryDetails = {
    // Receitas
    'salário': { icon: 'attach_money', background: '#22c55e', tipo: 'receita' },
    'freelance': { icon: 'work', background: '#22c55e', tipo: 'receita' },
    'investimentos': { icon: 'analytics', background: '#22c55e', tipo: 'receita' },
    'vendas': { icon: 'shopping_cart', background: '#22c55e', tipo: 'receita' },
    'bonificação': { icon: 'stars', background: '#22c55e', tipo: 'receita' },
    'dividendos': { icon: 'analytics', background: '#22c55e', tipo: 'receita' },
    'aluguel': { icon: 'home', background: '#22c55e', tipo: 'receita' },
    
    // Despesas
    'alimentação': { icon: 'restaurant', background: '#ef4444', tipo: 'despesa' },
    'transporte': { icon: 'directions_car', background: '#ef4444', tipo: 'despesa' },
    'moradia': { icon: 'home', background: '#ef4444', tipo: 'despesa' },
    'saúde': { icon: 'local_hospital', background: '#ef4444', tipo: 'despesa' },
    'educação': { icon: 'school', background: '#ef4444', tipo: 'despesa' },
    'lazer': { icon: 'sports_esports', background: '#ef4444', tipo: 'despesa' },
    'compras': { icon: 'shopping_cart', background: '#ef4444', tipo: 'despesa' },
    'conta': { icon: 'receipt', background: '#ef4444', tipo: 'despesa' },
    'outros': { icon: 'more_horiz', background: '#64748b', tipo: 'despesa' },
    
    'default': { icon: 'receipt_long', background: '#64748b' }
};

const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// --- INICIALIZAÇÃO ---
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM carregado - inicializando Transações');
    
    initializeUI();
    updateMonthDisplay();
    
    // Tentar diferentes estratégias para carregar dados
    if (typeof firebase !== 'undefined' && firebase.auth) {
        console.log('Firebase disponível, inicializando auth');
        initializeAuth();
    } else {
        console.log('Firebase não disponível, usando dados de exemplo');
        // Simular usuário para teste com dados de exemplo
        currentUser = { uid: 'test-user' };
        loadTransacoes();
    }
    
    console.log('Inicialização completa');
});

function initializeAuth() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            console.log('Usuário autenticado:', user.uid);
            updateMonthDisplay();
            loadTransacoes();
        } else {
            // Para teste, vou usar o mesmo UID que pode estar nos dados reais
            console.log('Usuário não autenticado, tentando diferentes UIDs...');
            
            // Primeiro tentar com dados reais
            loadTransacoesComDiferentesUIDs();
        }
    });
}

async function loadTransacoesComDiferentesUIDs() {
    const possibleUIDs = [
        'test-user',
        // Adicione aqui outros UIDs que podem existir nos dados
    ];
    
    for (const uid of possibleUIDs) {
        currentUser = { uid: uid };
        console.log(`Tentando carregar dados com UID: ${uid}`);
        
        try {
            await loadTransacoes();
            // Se chegou até aqui sem erro, pode ter funcionado
            break;
        } catch (error) {
            console.log(`Falha com UID ${uid}:`, error);
            continue;
        }
    }
    
    updateMonthDisplay();
}

function initializeUI() {
    document.getElementById('prev-month').addEventListener('click', () => changeMonth(-1));
    document.getElementById('next-month').addEventListener('click', () => changeMonth(1));
    
    // Listener para o botão adicionar da barra de navegação
    const botaoAdicionar = document.querySelector('.botao-adicionar');
    if (botaoAdicionar) {
        botaoAdicionar.addEventListener('click', () => {
            // Pode abrir um popup para escolher entre receita ou despesa
            window.location.href = '../Nova-Receita/Nova-Receita.html';
        });
    }
    
    // Botão voltar
    const botaoVoltar = document.querySelector('.botao-voltar');
    if (botaoVoltar) {
        botaoVoltar.addEventListener('click', () => {
            window.location.href = '../Home/home.html';
        });
    }
    
    // Event listeners para popups
    const popupBotao = document.getElementById('popup-botao');
    if (popupBotao) {
        popupBotao.addEventListener('click', () => {
            document.getElementById('popup-mensagem').style.display = 'none';
        });
    }
    
    const popupCancelar = document.getElementById('popup-confirmacao-cancelar');
    if (popupCancelar) {
        popupCancelar.addEventListener('click', () => {
            document.getElementById('popup-confirmacao').style.display = 'none';
        });
    }
    
    // Garantir que popups estejam ocultos
    document.getElementById('popup-mensagem').style.display = 'none';
    document.getElementById('popup-confirmacao').style.display = 'none';
}

// --- FUNÇÃO PARA MUDAR MÊS ---
function changeMonth(direction) {
    currentMonth += direction;
    
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
    const monthElement = document.getElementById('current-month');
    if (monthElement) {
        monthElement.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    }
}

// --- FUNÇÃO PARA CARREGAR TRANSAÇÕES ---
async function loadTransacoes() {
    if (!currentUser) return;
    
    try {
        let receitas = [];
        let despesas = [];
        
        // Se o Firebase estiver disponível, carregar do Firestore
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            console.log('Carregando transações do Firebase...');
            
            // Carregar receitas
            const receitasQuery = await db.collection('users')
                .doc(currentUser.uid)
                .collection('receitas')
                .get();
                
            // Carregar despesas
            const despesasQuery = await db.collection('users')
                .doc(currentUser.uid)
                .collection('despesas')
                .get();
            
            receitas = receitasQuery.docs.map(doc => {
                const data = doc.data();
                console.log('Receita encontrada:', data);
                return {
                    id: doc.id,
                    tipo: 'receita',
                    ...data
                };
            });
            
            despesas = despesasQuery.docs.map(doc => {
                const data = doc.data();
                console.log('Despesa encontrada:', data);
                return {
                    id: doc.id,
                    tipo: 'despesa',
                    ...data
                };
            });
            
            console.log('Receitas carregadas:', receitas);
            console.log('Despesas carregadas:', despesas);
        } else {
            // Fallback: criar dados de exemplo
            console.log('Firebase não disponível, usando dados de exemplo');
            receitas = [
                {
                    id: '1',
                    tipo: 'receita',
                    descricao: 'Venda de coxinha',
                    categoria: 'Venda de Produtos',
                    valor: 20,
                    data: '2025-09-20'
                },
                {
                    id: '2',
                    tipo: 'receita',
                    descricao: 'Freelance',
                    categoria: 'freelance',
                    valor: 800,
                    data: '2025-09-10'
                }
            ];
            
            despesas = [
                {
                    id: '3',
                    tipo: 'despesa',
                    descricao: 'Supermercado',
                    categoria: 'alimentação',
                    valor: 250,
                    data: '2025-09-18'
                },
                {
                    id: '4',
                    tipo: 'despesa',
                    descricao: 'Gasolina',
                    categoria: 'transporte',
                    valor: 120,
                    data: '2025-09-16'
                }
            ];
        }
        
        console.log('Total de receitas:', receitas.length);
        console.log('Total de despesas:', despesas.length);
        
        // Combinar receitas e despesas
        const todasTransacoes = [...receitas, ...despesas];
        console.log('Todas as transações combinadas:', todasTransacoes);
        
        // Filtrar transações do mês atual
        const transacoesFiltradas = filterTransacoesByMonth(todasTransacoes, currentMonth, currentYear);
        console.log(`Transações filtradas para ${currentMonth}/${currentYear}:`, transacoesFiltradas);
        
        displayTransacoes(transacoesFiltradas);
        updateResumo(receitas, despesas, transacoesFiltradas);
        
    } catch (error) {
        console.error('Erro ao carregar transações:', error);
        
        // Em caso de erro, usar dados de exemplo
        const dadosExemplo = [
            {
                id: '1',
                tipo: 'receita',
                descricao: 'Venda de coxinha',
                categoria: 'Venda de Produtos',
                valor: 20,
                data: '2025-09-20'
            },
            {
                id: '2',
                tipo: 'despesa',
                descricao: 'Supermercado',
                categoria: 'alimentação',
                valor: 250,
                data: '2025-09-18'
            }
        ];
        
        console.log('Usando dados de exemplo devido ao erro:', dadosExemplo);
        displayTransacoes(dadosExemplo);
        updateResumo([dadosExemplo[0]], [dadosExemplo[1]], dadosExemplo);
    }
}

function filterTransacoesByMonth(transacoes, month, year) {
    console.log(`Filtrando transações para mês ${month} (${monthNames[month]}) de ${year}`);
    console.log('Transações antes do filtro:', transacoes);
    
    const filtered = transacoes.filter(transacao => {
        if (!transacao.data) {
            console.log('Transação sem data:', transacao);
            return false;
        }
        
        const transacaoDate = new Date(transacao.data);
        console.log(`Verificando transação: ${transacao.descricao}, data: ${transacao.data}, parsed: ${transacaoDate}, mês: ${transacaoDate.getMonth()}, ano: ${transacaoDate.getFullYear()}`);
        
        const matches = transacaoDate.getMonth() === month && transacaoDate.getFullYear() === year;
        console.log(`Transação ${transacao.descricao} ${matches ? 'INCLUÍDA' : 'EXCLUÍDA'}`);
        
        return matches;
    });
    
    console.log('Transações após filtro:', filtered);
    return filtered;
}

// --- FUNÇÃO PARA EXIBIR TRANSAÇÕES ---
function displayTransacoes(transacoes) {
    console.log('Exibindo transações:', transacoes);
    const container = document.getElementById('lista-transacoes');
    
    if (!container) {
        console.error('Container lista-transacoes não encontrado!');
        return;
    }
    
    if (transacoes.length === 0) {
        console.log('Nenhuma transação para exibir');
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: var(--cor-texto-secundario);">
                <span class="material-icons" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;">receipt_long</span>
                <p style="font-size: 1.1rem; margin-bottom: 8px;">Nenhuma transação encontrada</p>
                <p style="font-size: 0.9rem;">As transações deste mês aparecerão aqui</p>
            </div>
        `;
        return;
    }
    
    console.log(`Renderizando ${transacoes.length} transações`);
    
    // Agrupar transações por data
    const transacoesAgrupadas = groupTransacoesByDate(transacoes);
    console.log('Transações agrupadas:', transacoesAgrupadas);
    
    let html = '';
    Object.keys(transacoesAgrupadas).sort((a, b) => new Date(b) - new Date(a)).forEach(data => {
        const dataFormatada = formatDateHeader(data);
        html += `
            <div class="grupo-data">
                <div class="titulo-data">${dataFormatada}</div>
        `;
        
        transacoesAgrupadas[data].forEach(transacao => {
            const categoria = transacao.categoria?.toLowerCase() || 'outros';
            const details = categoryDetails[categoria] || categoryDetails['default'];
            
            html += `
                <div class="transacao-item ${transacao.tipo}">
                    <div class="transacao-icone" style="background-color: ${transacao.tipo === 'receita' ? '#22c55e' : '#ef4444'}">
                        <span class="material-icons">${details.icon}</span>
                    </div>
                    <div class="transacao-conteudo">
                        <div class="transacao-titulo">${transacao.descricao || transacao.categoria || 'Transação'}</div>
                        <div class="transacao-detalhes">
                            <span class="detalhes-linha">${transacao.categoria || 'Sem categoria'}</span>
                        </div>
                    </div>
                    <div class="transacao-acoes">
                        <div class="transacao-valor ${transacao.tipo}">${formatCurrency(transacao.valor)}</div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
    });
    
    console.log('HTML gerado:', html);
    container.innerHTML = html;
    console.log('Transações renderizadas com sucesso');
}

function groupTransacoesByDate(transacoes) {
    const grupos = {};
    
    transacoes.forEach(transacao => {
        const data = transacao.data;
        if (!grupos[data]) {
            grupos[data] = [];
        }
        grupos[data].push(transacao);
    });
    
    return grupos;
}

function formatDateHeader(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Ontem';
    } else {
        const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const dayName = dayNames[date.getDay()];
        const day = date.getDate();
        return `${dayName}, ${day}`;
    }
}

// --- FUNÇÃO PARA ATUALIZAR RESUMO ---
function updateResumo(todasReceitas, todasDespesas, transacoesFiltradas) {
    // Calcular totais
    const totalReceitas = transacoesFiltradas
        .filter(t => t.tipo === 'receita')
        .reduce((sum, t) => sum + (parseFloat(t.valor) || 0), 0);
        
    const totalDespesas = transacoesFiltradas
        .filter(t => t.tipo === 'despesa')
        .reduce((sum, t) => sum + (parseFloat(t.valor) || 0), 0);
    
    // Atualizar elementos do resumo
    const receitasElement = document.getElementById('total-receitas');
    const despesasElement = document.getElementById('total-despesas');
    
    if (receitasElement) {
        receitasElement.textContent = formatCurrency(totalReceitas);
    }
    
    if (despesasElement) {
        despesasElement.textContent = formatCurrency(totalDespesas);
    }
}

// --- FUNÇÃO PARA FORMATAR MOEDA ---
function formatCurrency(value) {
    const numValue = parseFloat(value) || 0;
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(numValue);
}