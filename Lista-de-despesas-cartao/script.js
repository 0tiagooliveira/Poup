// --- CONFIGURAÇÃO E VARIÁVEIS GLOBAIS ---
const db = firebase.firestore();
const auth = firebase.auth();

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let currentUser = null;
let despesaParaExcluirId = null; // Armazena o ID da despesa para o popup
let cartaoSelecionado = null; // ID do cartão selecionado via URL
let nomeCartaoSelecionado = null; // Nome do cartão selecionado

// MAPEAMENTO COMPLETO DE CATEGORIAS ESPECÍFICAS PARA CARTÃO DE CRÉDITO
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

// --- INICIALIZAÇÃO ---
// Menu adicionar gerenciado pelo menu-adicionar-padrao.js - função removida para evitar conflitos
function configurarMenuAdicionar() {
    console.log('Menu adicionar será gerenciado pelo menu-adicionar-padrao.js');
}

document.addEventListener('DOMContentLoaded', () => {
    // Capturar parâmetros da URL
    capturarParametrosURL();
    configurarMenuAdicionar();
    initializeAuth();
    initializeUI();
});

// Recarregar despesas quando a página ficar visível (útil quando voltar de outras páginas)
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && currentUser) {
        console.log('🔄 Página ficou visível, recarregando despesas...');
        setTimeout(() => {
            loadDespesasCartao();
        }, 500);
    }
});

function capturarParametrosURL() {
    const urlParams = new URLSearchParams(window.location.search);
    cartaoSelecionado = urlParams.get('cartao');
    nomeCartaoSelecionado = urlParams.get('nome');
    
    if (cartaoSelecionado && nomeCartaoSelecionado) {
        console.log('📱 Cartão selecionado:', nomeCartaoSelecionado, 'ID:', cartaoSelecionado);
        // Atualizar título da página para mostrar o cartão específico
        const tituloPagina = document.querySelector('.titulo-pagina h1');
        if (tituloPagina) {
            tituloPagina.textContent = `${decodeURIComponent(nomeCartaoSelecionado)}`;
        }
        
        // Adicionar botão para voltar à lista geral
        adicionarBotaoVoltarLista();
    } else {
        console.log('📋 Mostrando todas as despesas de cartão');
    }
}

function initializeAuth() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            currentUser = user;
            updateMonthDisplay();
            // Aguardar um momento para garantir que as despesas recém-criadas sejam visíveis
            setTimeout(() => {
                loadDespesasCartao();
            }, 1000);
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
    
    // Adicionar listener específico para botão cartão
    const botaoCartao = document.querySelector('.botao-despesa');
    if (botaoCartao) {
        botaoCartao.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = '../Nova-Despesa-Cartão/Nova-Despesa-Cartão.html';
        });
    }
    
    // Listeners do popup de exclusão
    const popupCancelar = document.getElementById('popup-cancelar');
    if (popupCancelar) {
        popupCancelar.addEventListener('click', () => {
            const popupConfirmacao = document.getElementById('popup-confirmacao');
            if (popupConfirmacao) popupConfirmacao.style.display = 'none';
        });
    }
    
    // Botão de recarregar despesas
    const botaoRecarregar = document.getElementById('botao-recarregar');
    if (botaoRecarregar) {
        botaoRecarregar.addEventListener('click', () => {
            console.log('🔄 Recarregando despesas manualmente...');
            loadDespesasCartao();
        });
    }
    
    // Botão para mostrar todas as despesas (debug)
    const botaoMostrarTodas = document.getElementById('botao-mostrar-todas');
    if (botaoMostrarTodas) {
        botaoMostrarTodas.addEventListener('click', () => {
            console.log('📋 Carregando TODAS as despesas de cartão...');
            loadTodasDespesasCartao();
        });
    }
    
    // Botão para ir para fevereiro 2026 (onde estão as despesas)
    const botaoFevereiro = document.getElementById('botao-ir-fevereiro');
    if (botaoFevereiro) {
        botaoFevereiro.addEventListener('click', () => {
            console.log('📅 Navegando para Fevereiro 2026...');
            currentMonth = 1; // Fevereiro (0-indexed)
            currentYear = 2026;
            updateMonthDisplay();
            loadDespesasCartao();
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
            loadDespesasCartao(); // Recarregar todas as despesas do cartão
        });
    }
    
    if (inputBusca) {
        inputBusca.addEventListener('input', (e) => {
            console.log('Buscando por:', e.target.value);
            buscarDespesasCartao(e.target.value);
        });
    }
}

let todasDespesasCartao = []; // Armazenar todas as despesas de cartão para busca
let mapaCartoes = {}; // cache id -> nome do cartão

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
        console.log('💳 Cartões carregados:', Object.keys(mapaCartoes).length, mapaCartoes);
        
        // Também carregar contas para fallback
        const contasSnap = await db.collection('contas').where('userId', '==', currentUser.uid).get();
        contasSnap.forEach(doc => {
            const data = doc.data() || {};
            if (data.tipo === 'cartao' || data.tipo === 'cartão') {
                const nome = data.nome || data.apelido || data.banco || 'Cartão';
                mapaCartoes[doc.id] = nome;
            }
        });
        
        console.log('💳 Total de cartões/contas mapeados:', Object.keys(mapaCartoes).length, mapaCartoes);
    } catch (e) {
        console.warn('Não foi possível carregar cartões para mapear nomes:', e);
    }
}

function buscarDespesasCartao(termo) {
    if (!termo.trim()) {
        renderDespesasCartao(todasDespesasCartao);
        updateTotals(todasDespesasCartao);
        return;
    }
    const termoLower = termo.toLowerCase();
    const despesasFiltradas = todasDespesasCartao.filter(despesa => {
        const descricao = (despesa.descricao || '').toLowerCase();
        const categoria = (despesa.categoria || '').toLowerCase();
        const nomeCartao = mapaCartoes[despesa.cartaoId] || '';
        
        return descricao.includes(termoLower) || 
               categoria.includes(termoLower) ||
               nomeCartao.toLowerCase().includes(termoLower);
    });
    
    renderDespesasCartao(despesasFiltradas);
    updateTotals(despesasFiltradas);
}

// --- NAVEGAÇÃO DE MÊS ---
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
    loadDespesasCartao();
}

function adicionarBotaoVoltarLista() {
    const cabecalho = document.querySelector('.cabecalho-superior');
    if (cabecalho && !document.getElementById('botao-voltar-lista')) {
        const botaoVoltar = document.createElement('button');
        botaoVoltar.id = 'botao-voltar-lista';
        botaoVoltar.className = 'botao-icone';
        botaoVoltar.innerHTML = '<span class="material-icons-round">list</span>';
        botaoVoltar.title = 'Ver todas as despesas de cartão';
        botaoVoltar.style.marginLeft = 'auto';
        
        botaoVoltar.addEventListener('click', () => {
            window.location.href = 'Lista-de-despesas-cartao.html';
        });
        
        const acoesCabecalho = cabecalho.querySelector('.acoes-cabecalho');
        if (acoesCabecalho) {
            acoesCabecalho.insertBefore(botaoVoltar, acoesCabecalho.firstChild);
        }
    }
}

function updateMonthDisplay() {
    const monthElement = document.getElementById('mes-atual');
    if (monthElement) {
        monthElement.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    }
}

// --- CARREGAMENTO DE DESPESAS DO CARTÃO ---
async function loadDespesasCartao() {
    if (!currentUser) return;
    
    try {
        // Carregar cartões do usuário para mapear nomes
        await carregarCartoesUsuario();
        
        const startOfMonth = new Date(currentYear, currentMonth, 1);
        const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);
        
        console.log('Carregando despesas de cartão de', startOfMonth, 'até', endOfMonth);
        
        // Buscar despesas de cartão - primeiro tenta coleção específica, depois filtro na coleção geral
        let querySnapshot;
        try {
            // Buscar todas as despesas de cartão do usuário e filtrar localmente por mês
            querySnapshot = await db.collection('despesas-cartao')
                .where('userId', '==', currentUser.uid)
                .orderBy('timestamp', 'desc')
                .get();
            console.log(`📋 Encontradas ${querySnapshot.size} despesas na coleção despesas-cartao para filtrar por ${monthNames[currentMonth]} ${currentYear}`);
            
            // Se não encontrou nada na coleção específica, buscar também na geral
            if (querySnapshot.size === 0) {
                console.log('🔍 Nenhuma despesa encontrada na coleção despesas-cartao, buscando na coleção despesas...');
                throw new Error('Coleção vazia, tentar fallback');
            }
        } catch (error) {
            console.log('Coleção despesas-cartao não existe ainda, usando filtro na coleção despesas');
            // Fallback: buscar na coleção despesas com tipo=cartao
            console.log('Tentando fallback na coleção despesas...');
            const allDespesasSnap = await db.collection('despesas')
                .where('userId', '==', currentUser.uid)
                .where('tipo', '==', 'cartao')
                .get();
            
            const filteredDocs = [];
            allDespesasSnap.forEach(doc => {
                const data = doc.data();
                if (data.data) {
                    // Aceitar qualquer data por enquanto para debug
                    filteredDocs.push(doc);
                }
            });
            
            // Ordenar por data decrescente
            filteredDocs.sort((a, b) => {
                const dateA = a.data().data.toDate ? a.data().data.toDate() : new Date(a.data().data);
                const dateB = b.data().data.toDate ? b.data().data.toDate() : new Date(b.data().data);
                return dateB - dateA;
            });
            
            // Criar objeto mock com interface similar ao QuerySnapshot
            querySnapshot = { forEach: (callback) => filteredDocs.forEach(callback) };
        }
        
        const despesasCartao = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // Filtrar por mês (converter data string para Date para comparação)
            let dataDoc;
            if (data.data) {
                if (typeof data.data === 'string') {
                    // Converter data string (formato brasileiro) para Date
                    const partesData = data.data.split('/');
                    if (partesData.length === 3) {
                        dataDoc = new Date(partesData[2], partesData[1] - 1, partesData[0]);
                    }
                } else if (data.data.toDate) {
                    dataDoc = data.data.toDate();
                } else {
                    dataDoc = new Date(data.data);
                }
            }
            
            // Filtrar por mês/ano selecionado
            if (dataDoc && 
                dataDoc.getMonth() === currentMonth && 
                dataDoc.getFullYear() === currentYear) {
                
                // Se um cartão específico foi selecionado, filtrar apenas suas despesas
                if (cartaoSelecionado && data.conta !== cartaoSelecionado) {
                    console.log(`Pulando despesa - cartão diferente: ${data.conta} !== ${cartaoSelecionado}`);
                    return;
                }
                
                console.log(`✅ Despesa do mês ${currentMonth + 1}/${currentYear}: ${data.descricao} - ${data.data}`);
                despesasCartao.push({
                    id: doc.id,
                    ...data,
                    dataObj: dataDoc
                });
            } else if (dataDoc) {
                console.log(`📅 Despesa de outro mês: ${data.descricao} - ${data.data} (${dataDoc.getMonth() + 1}/${dataDoc.getFullYear()})`);
            } else {
                console.log(`❌ Data inválida para: ${data.descricao} - ${data.data}`);
            }
        });
        
        console.log(`💳 Despesas de cartão para ${monthNames[currentMonth]} ${currentYear}: ${despesasCartao.length} despesas`);
        if (cartaoSelecionado) {
            console.log(`🔍 Filtrado para cartão: ${nomeCartaoSelecionado} (${cartaoSelecionado})`);
        }
        
        // Log detalhado das despesas do mês
        if (despesasCartao.length > 0) {
            console.log(`📝 Despesas encontradas para ${monthNames[currentMonth]}/${currentYear}:`);
            despesasCartao.forEach((despesa, index) => {
                console.log(`${index + 1}. ${despesa.descricao} - ${despesa.valor} (${despesa.data})`);
            });
        } else {
            console.log(`📅 Nenhuma despesa encontrada para ${monthNames[currentMonth]} ${currentYear}`);
            console.log('💡 Dica: Use o botão "📋" para ver todas as despesas ou navegue para o mês correto');
        }
        
        todasDespesasCartao = despesasCartao;
        renderDespesasCartao(despesasCartao);
        updateTotals(despesasCartao);
        
    } catch (error) {
        console.error('Erro ao carregar despesas do cartão:', error);
        showMessage('Erro ao carregar despesas do cartão');
    }
}

// --- FUNÇÃO PARA CARREGAR TODAS AS DESPESAS (DEBUG) ---
async function loadTodasDespesasCartao() {
    if (!currentUser) return;
    
    try {
        console.log('📋 Carregando TODAS as despesas de cartão...');
        
        const despesasCartao = [];
        
        // Buscar da coleção despesas-cartao
        try {
            const snapshot = await db.collection('despesas-cartao')
                .where('userId', '==', currentUser.uid)
                .orderBy('timestamp', 'desc')
                .get();
            
            console.log(`📊 Encontradas ${snapshot.size} despesas na coleção despesas-cartao`);
            
            snapshot.forEach(doc => {
                const data = doc.data();
                despesasCartao.push({
                    id: doc.id,
                    ...data
                });
            });
            
        } catch (error) {
            console.log('Erro na coleção despesas-cartao:', error.message);
        }
        
        // Buscar também da coleção despesas (fallback)
        try {
            const snapshotDespesas = await db.collection('despesas')
                .where('userId', '==', currentUser.uid)
                .where('tipo', '==', 'cartao')
                .orderBy('timestamp', 'desc')
                .get();
            
            console.log(`📊 Encontradas ${snapshotDespesas.size} despesas de cartão na coleção despesas`);
            
            snapshotDespesas.forEach(doc => {
                const data = doc.data();
                despesasCartao.push({
                    id: doc.id,
                    ...data
                });
            });
            
        } catch (error) {
            console.log('Erro na coleção despesas:', error.message);
        }
        
        console.log(`💳 TOTAL de despesas de cartão encontradas: ${despesasCartao.length}`);
        
        // Log detalhado
        despesasCartao.forEach((despesa, index) => {
            console.log(`${index + 1}. ${despesa.descricao} - ${despesa.valor} (${despesa.data}) - Coleção: ${despesa.tipo ? 'despesas-cartao' : 'despesas'}`);
        });
        
        // Atualizar título temporariamente
        const monthElement = document.getElementById('mes-atual');
        if (monthElement) {
            monthElement.textContent = `Todas as Despesas (${despesasCartao.length})`;
        }
        
        todasDespesasCartao = despesasCartao;
        renderDespesasCartao(despesasCartao);
        updateTotals(despesasCartao);
        
    } catch (error) {
        console.error('❌ Erro ao carregar todas as despesas:', error);
    }
}

// --- RENDERIZAÇÃO DE DESPESAS ---
function renderDespesasCartao(despesas) {
    const container = document.getElementById('despesas-list');
    if (!container) return;
    
    if (!despesas.length) {
        const mesAtual = monthNames[currentMonth];
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #666;">
                <span class="material-icons-round" style="font-size: 4rem; color: #ddd; margin-bottom: 16px;">credit_card_off</span>
                <h3 style="margin-bottom: 8px; color: #333;">Nenhuma despesa em ${mesAtual} ${currentYear}</h3>
                <p style="margin-bottom: 16px;">Use ← → para navegar pelos meses</p>
                <p style="margin-bottom: 24px;">ou clique no botão "📋" para ver todas as despesas</p>
                <button onclick="window.location.href='../Nova-Despesa-Cartão/Nova-Despesa-Cartão.html'" 
                        style="background: #D32F2F; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    Adicionar Despesa
                </button>
            </div>
        `;
        return;
    }
    
    // Agrupar por data
    const groupedDespesas = groupByDate(despesas);
    let html = '';
    
    Object.entries(groupedDespesas).forEach(([date, despesasList]) => {
        html += `
            <div class="grupo-data">
                <h3 class="titulo-data">${formatDateForGroup(date)}</h3>
                ${despesasList.map(despesa => createDespesaCartaoHTML(despesa)).join('')}
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function createDespesaCartaoHTML(despesa) {
    const category = (despesa.categoria || '').toLowerCase();
    const categoryInfo = categoryDetails[category] || categoryDetails['default'];
    
    // Tentar múltiplos campos para identificar o cartão
    let nomeCartao = 'Cartão não identificado';
    if (despesa.cartaoId && mapaCartoes[despesa.cartaoId]) {
        nomeCartao = mapaCartoes[despesa.cartaoId];
    } else if (despesa.conta && mapaCartoes[despesa.conta]) {
        nomeCartao = mapaCartoes[despesa.conta];
    } else if (despesa.carteira && mapaCartoes[despesa.carteira]) {
        nomeCartao = mapaCartoes[despesa.carteira];
    }
    
    console.log(`💳 Despesa: ${despesa.descricao}, CartaoId: ${despesa.cartaoId}, Conta: ${despesa.conta}, Carteira: ${despesa.carteira}, Nome: ${nomeCartao}`);
    
    return `
        <div class="despesa-item" onclick="abrirModalDetalhes('${despesa.id}', ${JSON.stringify(despesa).replace(/"/g, '&quot;')})">
            <div class="despesa-icone" style="background-color: ${categoryInfo.background}">
                <span class="material-icons">${categoryInfo.icon}</span>
            </div>
            <div class="despesa-conteudo">
                <div class="despesa-titulo">${despesa.descricao || 'Compra no cartão'}</div>
                <div class="despesa-detalhes">
                    <div class="detalhes-categoria">${despesa.categoria || 'Compras'}</div>
                    <div class="detalhes-conta">
                        <span class="material-icons-round" style="font-size: 14px; margin-right: 4px;">credit_card</span>
                        ${nomeCartao}
                    </div>
                </div>
            </div>
            <div class="despesa-badges">
                ${getBadgeCartao(despesa)}
                ${getBadgeStatus(despesa)}
            </div>
            <div class="despesa-acoes">
                <span class="despesa-valor">R$ ${formatCurrency(despesa.valor)}</span>
            </div>
        </div>
    `;
}

function getBadgeCartao(despesa) {
    // Usar a mesma lógica de identificação do cartão
    let nomeCartao = '';
    if (despesa.cartaoId && mapaCartoes[despesa.cartaoId]) {
        nomeCartao = mapaCartoes[despesa.cartaoId];
    } else if (despesa.conta && mapaCartoes[despesa.conta]) {
        nomeCartao = mapaCartoes[despesa.conta];
    } else if (despesa.carteira && mapaCartoes[despesa.carteira]) {
        nomeCartao = mapaCartoes[despesa.carteira];
    }
    
    let iconeSvg = getIconeCartao(nomeCartao);
    
    return `
        <button class="badge-circular" onclick="event.stopPropagation()">
            ${iconeSvg || '<span class="material-icons">credit_card</span>'}
        </button>
    `;
}

function getIconeCartao(nomeCartao) {
    const nome = nomeCartao.toLowerCase();
    if (nome.includes('nubank')) return '<img src="../Icon/Nubank.svg" alt="Nubank" />';
    if (nome.includes('itau') || nome.includes('itaú')) return '<img src="../Icon/itau.svg" alt="Itaú" />';
    if (nome.includes('bradesco')) return '<img src="../Icon/bradesco.svg" alt="Bradesco" />';
    if (nome.includes('santander')) return '<img src="../Icon/santander.svg" alt="Santander" />';
    if (nome.includes('caixa')) return '<img src="../Icon/caixa.svg" alt="Caixa" />';
    if (nome.includes('banco do brasil') || nome.includes('bb')) return '<img src="../Icon/banco-do-brasil.svg" alt="Banco do Brasil" />';
    return null;
}

function getBadgeStatus(despesa) {
    const isPago = despesa.pago === true;
    const statusClass = isPago ? 'badge-status-ok' : 'badge-status-pendente';
    const icon = isPago ? 'check' : 'schedule';
    
    return `
        <button class="badge-circular badge-status ${statusClass}" onclick="event.stopPropagation(); toggleStatusDespesa('${despesa.id}', ${!isPago})">
            <span class="material-icons">${icon}</span>
        </button>
    `;
}

// --- UTILITÁRIOS ---
function groupByDate(despesas) {
    const grouped = {};
    despesas.forEach(despesa => {
        let dateKey;
        if (despesa.data && despesa.data.toDate) {
            dateKey = despesa.data.toDate().toISOString().split('T')[0];
        } else if (despesa.data instanceof Date) {
            dateKey = despesa.data.toISOString().split('T')[0];
        } else {
            dateKey = new Date().toISOString().split('T')[0];
        }
        
        if (!grouped[dateKey]) {
            grouped[dateKey] = [];
        }
        grouped[dateKey].push(despesa);
    });
    return grouped;
}

function formatDateForGroup(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Ontem';
    } else {
        return date.toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long' 
        });
    }
}

function formatCurrency(value) {
    if (!value && value !== 0) return '0,00';
    
    // Se já é uma string formatada (ex: "R$ 500,00"), extrair apenas o número
    if (typeof value === 'string') {
        // Remover R$, espaços e converter vírgula para ponto
        const cleanValue = value.replace(/[R$\s]/g, '').replace(',', '.');
        const numValue = parseFloat(cleanValue);
        
        if (isNaN(numValue)) return '0,00';
        
        return numValue.toLocaleString('pt-BR', { 
            minimumFractionDigits: 2,
            maximumFractionDigits: 2 
        });
    }
    
    // Se é um número
    return parseFloat(value).toLocaleString('pt-BR', { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
    });
}

// --- TOTAIS ---
function updateTotals(despesas) {
    // Função auxiliar para extrair valor numérico
    const extractValue = (valor) => {
        if (!valor) return 0;
        if (typeof valor === 'string') {
            const cleanValue = valor.replace(/[R$\s]/g, '').replace(',', '.');
            return parseFloat(cleanValue) || 0;
        }
        return parseFloat(valor) || 0;
    };
    
    const totalFatura = despesas.reduce((sum, despesa) => sum + extractValue(despesa.valor), 0);
    const totalPago = despesas.filter(d => d.pago).reduce((sum, despesa) => sum + extractValue(despesa.valor), 0);
    
    const totalFaturaElement = document.getElementById('total-previsto');
    const totalPagoElement = document.getElementById('total-recebido');
    
    if (totalFaturaElement) {
        totalFaturaElement.textContent = `R$ ${formatCurrency(totalFatura)}`;
    }
    if (totalPagoElement) {
        totalPagoElement.textContent = `R$ ${formatCurrency(totalPago)}`;
    }
}

// --- STATUS DAS DESPESAS ---
async function toggleStatusDespesa(despesaId, novoStatus) {
    try {
        // Tentar primeiro na coleção despesas-cartao
        try {
            await db.collection('despesas-cartao').doc(despesaId).update({
                pago: novoStatus
            });
        } catch (error) {
            // Fallback para coleção despesas
            console.log('Atualizando na coleção despesas (fallback)');
            await db.collection('despesas').doc(despesaId).update({
                pago: novoStatus
            });
        }
        
        // Recarregar despesas
        loadDespesasCartao();
        
        const statusText = novoStatus ? 'paga' : 'pendente';
        showMessage(`Despesa marcada como ${statusText}`);
        
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        showMessage('Erro ao atualizar status da despesa');
    }
}

// --- MODAL DE DETALHES ---
function initializeModalListeners() {
    const modal = document.getElementById('modal-detalhes-despesa');
    const fecharModal = document.getElementById('fechar-modal-detalhes');
    
    if (fecharModal) {
        fecharModal.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
}

function abrirModalDetalhes(despesaId, despesa) {
    const modal = document.getElementById('modal-detalhes-despesa');
    if (!modal) return;
    
    // Preencher dados do modal
    document.getElementById('modal-descricao').textContent = despesa.descricao || 'Compra no cartão';
    document.getElementById('modal-valor').textContent = `R$ ${formatCurrency(despesa.valor)}`;
    document.getElementById('modal-categoria').textContent = despesa.categoria || 'Compras';
    document.getElementById('modal-conta').textContent = mapaCartoes[despesa.cartaoId] || 'Cartão';
    
    // Formatar data
    let dataFormatada = 'Data não informada';
    if (despesa.data) {
        let date;
        if (despesa.data.toDate) {
            date = despesa.data.toDate();
        } else if (despesa.data instanceof Date) {
            date = despesa.data;
        } else {
            date = new Date(despesa.data);
        }
        dataFormatada = date.toLocaleDateString('pt-BR');
    }
    document.getElementById('modal-data').textContent = dataFormatada;
    
    // Tags, lembrete, observação (placeholder)
    document.getElementById('modal-tags').textContent = 'Nenhuma tag';
    document.getElementById('modal-lembrete').textContent = 'Nenhum';
    document.getElementById('modal-observacao').textContent = 'Nenhuma';
    
    modal.style.display = 'flex';
}

// --- MENSAGENS ---
function showMessage(text) {
    const popup = document.getElementById('popup-mensagem');
    const popupTexto = document.getElementById('popup-texto');
    const popupBotao = document.getElementById('popup-botao');
    
    if (popup && popupTexto && popupBotao) {
        popupTexto.textContent = text;
        popup.style.display = 'flex';
        
        popupBotao.onclick = () => {
            popup.style.display = 'none';
        };
    }
}

// --- DROPDOWN MENU ---
function toggleDropdown() {
    const dropdown = document.getElementById('dropdown-menu');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
}

// Fechar dropdown ao clicar fora
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('dropdown-menu');
    const titulo = document.querySelector('.titulo-pagina');
    
    if (dropdown && titulo && !titulo.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});