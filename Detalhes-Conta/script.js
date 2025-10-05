// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyC7RB9fULmkp9xeJIjc0dL58atHJ8CM-Xc",
    authDomain: "poup-beta.firebaseapp.com",
    projectId: "poup-beta",
    storageBucket: "poup-beta.appspot.com",
    messagingSenderId: "954695915981",
    appId: "1:954695915981:web:d31b216f79eac178094c84",
    measurementId: "G-LP9BDVD3KJ"
};

// Mapeamento de bancos para ícones SVG
const bancosIcones = {
    'Nubank': '../Icon/Nubank.svg',
    'Banco Nubank': '../Icon/Nubank.svg',
    'nubank': '../Icon/Nubank.svg',
    'NUBANK': '../Icon/Nubank.svg',
    'Banco do Brasil': '../Icon/banco-do-brasil.svg',
    'banco do brasil': '../Icon/banco-do-brasil.svg',
    'Bradesco': '../Icon/bradesco.svg',
    'bradesco': '../Icon/bradesco.svg',
    'BRADESCO': '../Icon/bradesco.svg',
    'Itaú': '../Icon/itau.svg',
    'Itau': '../Icon/itau.svg',
    'itau': '../Icon/itau.svg',
    'ITAU': '../Icon/itau.svg',
    'Santander': '../Icon/santander.svg',
    'santander': '../Icon/santander.svg',
    'SANTANDER': '../Icon/santander.svg',
    'Caixa': '../Icon/caixa.svg',
    'caixa': '../Icon/caixa.svg',
    'CAIXA': '../Icon/caixa.svg',
    'Caixa Econômica Federal': '../Icon/caixa.svg',
    'PicPay': '../Icon/picpay.svg',
    'picpay': '../Icon/picpay.svg',
    'PICPAY': '../Icon/picpay.svg'
};

// Função para obter ícone do banco (melhorada)
function obterIconeBanco(conta) {
    console.log('[Debug] Procurando ícone para conta:', conta);
    
    // Se o ícone já é um SVG path, retorna ele mesmo
    if (conta.icone && conta.icone.includes('.svg')) {
        console.log('[Debug] Usando ícone direto da conta:', conta.icone);
        return conta.icone;
    }
    
    // Se tem o campo banco definido, usa o mapeamento
    if (conta.banco) {
        const nomeBanco = conta.banco.trim();
        console.log('[Debug] Nome do banco:', nomeBanco);
        
        // Tentar exato primeiro
        if (bancosIcones[nomeBanco]) {
            console.log('[Debug] Encontrado ícone exato:', bancosIcones[nomeBanco]);
            return bancosIcones[nomeBanco];
        }
        
        // Tentar variações (lower case)
        const bancoLower = nomeBanco.toLowerCase();
        if (bancosIcones[bancoLower]) {
            console.log('[Debug] Encontrado ícone lowercase:', bancosIcones[bancoLower]);
            return bancosIcones[bancoLower];
        }
        
        // Tentar busca parcial
        for (const [key, value] of Object.entries(bancosIcones)) {
            if (key.toLowerCase().includes(bancoLower) || bancoLower.includes(key.toLowerCase())) {
                console.log('[Debug] Encontrado ícone por busca parcial:', value);
                return value;
            }
        }
    }
    
    console.log('[Debug] Nenhum ícone encontrado, usando padrão');
    return null;
}

// Mapeamento de cores dos bancos
const coresBancos = {
    'nubank': '#820ad1',
    'banco nubank': '#820ad1',
    'nu bank': '#820ad1',
    'itau': '#EC7000',
    'itaú': '#EC7000',
    'banco itau': '#EC7000',
    'bradesco': '#CC092F',
    'banco bradesco': '#CC092F',
    'santander': '#EC0000',
    'banco santander': '#EC0000',
    'caixa': '#0070AF',
    'caixa econômica': '#0070AF',
    'caixa economica': '#0070AF',
    'banco do brasil': '#FFEF38',
    'bb': '#FFEF38',
    'picpay': '#21C25E',
    'pic pay': '#21C25E',
    'carteira': '#4CAF50',
    'dinheiro': '#4CAF50'
};

// Função para aplicar tema do banco
function aplicarTemaBanco(banco) {
    console.log('[Debug] aplicarTemaBanco chamado com banco:', banco);
    const bancoNormalizado = (banco || '').toLowerCase().trim();
    console.log('[Debug] Banco normalizado:', bancoNormalizado);
    
    // Buscar cor do banco
    let corBanco = coresBancos[bancoNormalizado];
    console.log('[Debug] Cor encontrada diretamente:', corBanco);
    
    // Se não encontrou, tentar busca parcial
    if (!corBanco) {
        for (const [key, value] of Object.entries(coresBancos)) {
            if (key.includes(bancoNormalizado) || bancoNormalizado.includes(key)) {
                corBanco = value;
                break;
            }
        }
    }
    
    // Cor padrão se não encontrou
    if (!corBanco) {
        corBanco = '#00BCD4'; // Cor padrão azul
    }
    
    // Aplicar cor como CSS custom property (mesma cor para tudo)
    document.documentElement.style.setProperty('--primary', corBanco);
    document.documentElement.style.setProperty('--primary-dark', corBanco);
    
    // Aplicar cor sólida no header
    const header = document.querySelector('.header-detalhes');
    const body = document.body;
    
    if (header) {
        header.style.background = `${corBanco} !important`;
        header.style.setProperty('background', corBanco, 'important');
    }
    
    // Aplicar cor sólida no background do body
    if (body) {
        body.style.background = `${corBanco} !important`;
        body.style.setProperty('background', corBanco, 'important');
    }
    
    console.log('[Debug] Tema aplicado para banco:', banco, 'com cor:', corBanco);
}

// Inicializar Firebase
let firebaseApp, auth, db;

(function initFirebase() {
    if (typeof firebase !== "undefined") {
        if (!firebase.apps.length) {
            firebaseApp = firebase.initializeApp(firebaseConfig);
        }
        auth = firebase.auth();
        db = firebase.firestore();
        
        // Configurar Firebase para funcionar offline
        db.enablePersistence()
          .catch((err) => {
              if (err.code == 'failed-precondition') {
                  console.warn('[Firebase] Múltiplas abas abertas, persistence desabilitado');
              } else if (err.code == 'unimplemented') {
                  console.warn('[Firebase] Navegador não suporta persistence');
              }
          });
    }
})();

// Variáveis globais
let contaAtual = null;
let todasContas = [];
let usuario = null;

// Elementos DOM
const elements = {
    loadingOverlay: document.getElementById('loading-overlay'),
    containerApp: document.querySelector('.container-app'),
    btnVoltar: document.getElementById('btn-voltar'),
    contaNome: document.getElementById('conta-nome'),
    saldoAtual: document.getElementById('saldo-atual'),
    bancoIcone: document.getElementById('banco-icone'),
    bancoNome: document.getElementById('banco-nome'),
    tipoConta: document.getElementById('tipo-conta'),
    saldoInicial: document.getElementById('saldo-inicial'),
    qtdDespesas: document.getElementById('qtd-despesas'),
    qtdReceitas: document.getElementById('qtd-receitas'),
    qtdTransferencias: document.getElementById('qtd-transferencias'),
    incluirTelaInicial: document.getElementById('incluir-tela-inicial'),
    btnReajustar: document.getElementById('btn-reajustar'),
    popupReajustar: document.getElementById('popup-reajustar'),
    popupSelectorConta: document.getElementById('popup-selector-conta'),
    contasLista: document.getElementById('contas-lista'),
    novoSaldo: document.getElementById('novo-saldo')
};

// Sistema de token para evitar verificação desnecessária
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

function salvarTokenUsuario(usuario) {
    const dadosUsuario = {
        uid: usuario.uid,
        email: usuario.email,
        nome: usuario.displayName || usuario.email,
        timestamp: Date.now()
    };
    localStorage.setItem('tokenUsuarioPoup', JSON.stringify(dadosUsuario));
}

function limparTokenUsuario() {
    localStorage.removeItem('tokenUsuarioPoup');
}

// Função auxiliar para converter valor para número
function parseValueToNumber(valor) {
    if (typeof valor === 'number') return valor;
    if (typeof valor === 'string') {
        return parseFloat(valor.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
    }
    return 0;
}

// Função auxiliar para verificar se data é do mês selecionado
function isDataNoMesSelecionado(data, mesSelecionado, anoSelecionado) {
    if (!data) return false;
    
    let dataObj;
    if (data.toDate) {
        dataObj = data.toDate(); // Firestore Timestamp
    } else {
        dataObj = new Date(data);
    }
    
    const mes = dataObj.getMonth() + 1; // +1 porque getMonth() retorna 0-11
    const ano = dataObj.getFullYear();
    
    return mes === mesSelecionado && ano === anoSelecionado;
}

// Calcular saldo atual da conta com receitas e despesas
async function calcularSaldoConta(uid, contaId, mesSelecionado, anoSelecionado) {
    try {
        // Buscar a conta
        const contaDoc = await db.collection('contas').doc(contaId).get();
        if (!contaDoc.exists) return 0;
        
        const conta = contaDoc.data();
        let saldoInicial = parseFloat(conta.saldoInicial || conta.saldo || 0);
        
        // Buscar receitas vinculadas à conta no mês/ano selecionado
        const receitasSnapshot = await db.collection('receitas')
            .where('userId', '==', uid)
            .where('contaId', '==', contaId)
            .get();
            
        let totalReceitas = 0;
        receitasSnapshot.forEach(doc => {
            const receita = doc.data();
            const efetivada = receita.recebido === true || receita.concluida === true;
            const isDoMesSelecionado = isDataNoMesSelecionado(receita.data, mesSelecionado, anoSelecionado);
            
            if (efetivada && isDoMesSelecionado) {
                totalReceitas += parseValueToNumber(receita.valor);
            }
        });
        
        // Buscar despesas vinculadas à conta no mês/ano selecionado
        const despesasSnapshot = await db.collection('despesas')
            .where('userId', '==', uid)
            .where('contaId', '==', contaId)
            .get();
            
        let totalDespesas = 0;
        despesasSnapshot.forEach(doc => {
            const despesa = doc.data();
            const efetivada = despesa.pago === true || despesa.concluida === true;
            const isDoMesSelecionado = isDataNoMesSelecionado(despesa.data, mesSelecionado, anoSelecionado);
            
            if (efetivada && isDoMesSelecionado) {
                totalDespesas += parseValueToNumber(despesa.valor);
            }
        });
        
        // Calcular saldo atual da conta
        const saldoAtual = saldoInicial + totalReceitas - totalDespesas;
        
        return saldoAtual;
        
    } catch (error) {
        console.error('[Detalhes] Erro ao calcular saldo da conta:', error);
        return 0;
    }
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

function carregarContasDoCache() {
    try {
        const contas = [];
        for (let i = 0; i < localStorage.length; i++) {
            const chave = localStorage.key(i);
            if (chave && chave.startsWith('conta_')) {
                const contaStr = localStorage.getItem(chave);
                if (contaStr) {
                    const conta = JSON.parse(contaStr);
                    if (conta.userId === usuario.uid && conta.ativa !== false) {
                        contas.push(conta);
                    }
                }
            }
        }
        console.log('[Cache] Contas carregadas do cache local:', contas.length);
        return contas;
    } catch (error) {
        console.warn('[Cache] Erro ao carregar contas do cache:', error);
        return [];
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('[Detalhes] Inicializando aplicação...');
    mostrarLoading();
    
    // Primeiro, verificar se há token válido
    const tokenUsuario = obterTokenUsuario();
    
    if (tokenUsuario) {
        // Token existe, mas ainda precisa da autenticação Firebase para Firestore
        console.log('[Detalhes] Token encontrado, aguardando Firebase...');
        
        auth.onAuthStateChanged(user => {
            if (user) {
                usuario = user;
                salvarTokenUsuario(user); // Atualizar token
                console.log('[Detalhes] Firebase autenticado, carregando dados...');
                inicializarApp();
            } else {
                // Token inválido, limpar e redirecionar
                console.log('[Detalhes] Token inválido, redirecionando...');
                limparTokenUsuario();
                window.location.href = '../index.html';
            }
        });
        
        // Timeout para Firebase
        setTimeout(() => {
            if (!usuario) {
                console.log('[Detalhes] Timeout do Firebase, redirecionando...');
                limparTokenUsuario();
                window.location.href = '../index.html';
            }
        }, 5000);
        
        return;
    }
    
    // Só usar Firebase se não há token
    if (auth) {
        console.log('[Detalhes] Verificando Firebase...');
        auth.onAuthStateChanged(user => {
            if (user) {
                usuario = user;
                salvarTokenUsuario(user);
                console.log('[Detalhes] Usuário autenticado via Firebase:', user.uid);
                inicializarApp();
            } else {
                console.log('[Detalhes] Redirecionando para login...');
                window.location.href = '../index.html';
            }
        });
    } else {
        alert('Erro ao carregar Firebase. Verifique sua configuração.');
        window.location.href = '../index.html';
    }
});

// Função para tentar carregar dados online em background
async function tentarCarregarDadosOnline(tokenUsuario, contaId) {
    try {
        // Aguardar autenticação Firebase
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Timeout')), 3000);
            
            auth.onAuthStateChanged(user => {
                clearTimeout(timeout);
                if (user) {
                    resolve(user);
                } else {
                    reject(new Error('Não autenticado'));
                }
            });
        });
        
        console.log('[Detalhes] Atualizando dados online...');
        await carregarDetalheConta(contaId);
        await carregarEstatisticas();
        
    } catch (error) {
        console.log('[Detalhes] Não foi possível atualizar online, usando cache:', error.message);
    }
}

// Mostrar erro de conexão sem redirecionar
function mostrarErroConexao() {
    const urlParams = new URLSearchParams(window.location.search);
    const contaId = urlParams.get('conta');
    
    if (contaId) {
        const contaCacheada = buscarContaNoCacheLocal(contaId);
        if (contaCacheada) {
            console.log('[Detalhes] Usando dados do cache offline...');
            const tokenUsuario = obterTokenUsuario();
            usuario = { 
                uid: tokenUsuario.uid, 
                email: tokenUsuario.email,
                displayName: tokenUsuario.nome 
            };
            contaAtual = contaCacheada;
            atualizarInterface();
            mostrarToast('Usando dados offline', 'warning');
            return;
        }
    }
    
    // Se não há cache, mostrar erro e redirecionar
    console.log('[Detalhes] Sem dados disponíveis, redirecionando...');
    mostrarToast('Erro de conexão. Redirecionando...', 'error');
    setTimeout(() => {
        window.location.href = '../index.html';
    }, 3000);
}

// Carregar estatísticas offline (versão simplificada)
function carregarEstatisticasSimples() {
    try {
        console.log('[Detalhes] Carregando estatísticas do localStorage...');
        
        if (!contaAtual || !contaAtual.nome) {
            console.warn('[Detalhes] Conta atual não encontrada para carregar estatísticas do localStorage');
            elements.qtdDespesas.textContent = '0 Despesas';
            elements.qtdReceitas.textContent = '0 Receitas';
            elements.qtdTransferencias.textContent = '0 Transferências';
            return;
        }

        // Carregar despesas do localStorage
        const despesasLocal = JSON.parse(localStorage.getItem('despesas') || '[]');
        const qtdDespesas = despesasLocal.filter(despesa => {
            // Verificar tanto 'conta' quanto 'carteira' para compatibilidade
            const contaDespesa = despesa.conta || despesa.carteira;
            return contaDespesa && contaDespesa.nome === contaAtual.nome;
        }).length;
        
        // Carregar receitas do localStorage
        const receitasLocal = JSON.parse(localStorage.getItem('receitas') || '[]');
        const qtdReceitas = receitasLocal.filter(receita => 
            receita.conta && receita.conta.nome === contaAtual.nome
        ).length;
        
        // Transferências - por enquanto 0 até implementarmos
        const qtdTransferencias = 0;
        
        // Atualizar interface
        elements.qtdDespesas.textContent = `${qtdDespesas} ${qtdDespesas === 1 ? 'Despesa' : 'Despesas'}`;
        elements.qtdReceitas.textContent = `${qtdReceitas} ${qtdReceitas === 1 ? 'Receita' : 'Receitas'}`;
        elements.qtdTransferencias.textContent = `${qtdTransferencias} ${qtdTransferencias === 1 ? 'Transferência' : 'Transferências'}`;
        
        console.log('[Detalhes] Estatísticas carregadas do localStorage:', {
            conta: contaAtual.nome,
            despesas: qtdDespesas,
            receitas: qtdReceitas,
            transferencias: qtdTransferencias
        });
        
    } catch (error) {
        console.error('[Detalhes] Erro ao carregar estatísticas do localStorage:', error);
        // Valores padrão em caso de erro
        elements.qtdDespesas.textContent = '0 Despesas';
        elements.qtdReceitas.textContent = '0 Receitas';
        elements.qtdTransferencias.textContent = '0 Transferências';
    }
}

// Configurar event listeners
function configurarEventListeners() {
    console.log('[Detalhes] Configurando event listeners...');
    
    // Botão voltar
    elements.btnVoltar.addEventListener('click', () => {
        window.history.back();
    });

    // Seletor de conta
    console.log('[Detalhes] Configurando click do seletor de conta...');
    const contaAtualElement = document.getElementById('conta-atual');
    if (contaAtualElement) {
        contaAtualElement.addEventListener('click', abrirSelectorConta);
        console.log('[Detalhes] Event listener do seletor configurado');
    } else {
        console.error('[Detalhes] Elemento conta-atual não encontrado!');
    }

    // Toggle incluir na tela inicial
    elements.incluirTelaInicial.addEventListener('change', atualizarIncluirTelaInicial);

    // Botão reajustar saldo
    elements.btnReajustar.addEventListener('click', abrirPopupReajustar);

    // Popup reajustar saldo
    document.getElementById('cancelar-reajuste').addEventListener('click', fecharPopupReajustar);
    document.getElementById('confirmar-reajuste').addEventListener('click', confirmarReajuste);

    // Popup selector conta
    document.getElementById('cancelar-selector').addEventListener('click', fecharSelectorConta);

    // Formatação do input de valor
    elements.novoSaldo.addEventListener('input', formatarValorInput);
    elements.novoSaldo.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            confirmarReajuste();
        }
    });

    // Navegação para listas
    console.log('[Detalhes] Configurando navegação para listas...');
    
    // Card de despesas - navegar para lista de despesas
    const cardDespesas = document.querySelector('.info-item.half-width:has(#qtd-despesas)');
    if (cardDespesas) {
        cardDespesas.style.cursor = 'pointer';
        cardDespesas.addEventListener('click', () => {
            if (contaAtual) {
                window.location.href = `../Lista-de-despesas/Lista-de-despesas.html?conta=${contaAtual.id}`;
            }
        });
    } else {
        // Fallback - buscar pelo elemento pai do qtd-despesas
        const qtdDespesasElement = elements.qtdDespesas;
        if (qtdDespesasElement) {
            const cardDespesasFallback = qtdDespesasElement.closest('.info-item.half-width');
            if (cardDespesasFallback) {
                cardDespesasFallback.style.cursor = 'pointer';
                cardDespesasFallback.addEventListener('click', () => {
                    if (contaAtual) {
                        window.location.href = `../Lista-de-despesas/Lista-de-despesas.html?conta=${contaAtual.id}`;
                    }
                });
            }
        }
    }

    // Card de receitas - navegar para lista de receitas
    const cardReceitas = document.querySelector('.info-item.half-width:has(#qtd-receitas)');
    if (cardReceitas) {
        cardReceitas.style.cursor = 'pointer';
        cardReceitas.addEventListener('click', () => {
            if (contaAtual) {
                window.location.href = `../Lista-de-receitas/Lista-de-receitas.html?conta=${contaAtual.id}`;
            }
        });
    } else {
        // Fallback - buscar pelo elemento pai do qtd-receitas
        const qtdReceitasElement = elements.qtdReceitas;
        if (qtdReceitasElement) {
            const cardReceitasFallback = qtdReceitasElement.closest('.info-item.half-width');
            if (cardReceitasFallback) {
                cardReceitasFallback.style.cursor = 'pointer';
                cardReceitasFallback.addEventListener('click', () => {
                    if (contaAtual) {
                        window.location.href = `../Lista-de-receitas/Lista-de-receitas.html?conta=${contaAtual.id}`;
                    }
                });
            }
        }
    }

    console.log('[Detalhes] Navegação configurada para cards de despesas e receitas');
}

// Configurar atualização automática das estatísticas
function configurarAtualizacaoAutomatica() {
    console.log('[Detalhes] Configurando atualização automática das estatísticas...');
    
    // Atualizar estatísticas quando a página recebe foco (usuário volta de outras páginas)
    window.addEventListener('focus', async () => {
        console.log('[Detalhes] Página recebeu foco, atualizando estatísticas...');
        if (contaAtual && usuario) {
            try {
                await carregarEstatisticas();
                console.log('[Detalhes] Estatísticas atualizadas após foco');
            } catch (error) {
                console.warn('[Detalhes] Erro ao atualizar estatísticas após foco:', error);
                // Fallback para localStorage em caso de erro
                carregarEstatisticasSimples();
            }
        }
    });
    
    // Atualizar estatísticas a cada 30 segundos (opcional)
    setInterval(async () => {
        if (contaAtual && usuario && !document.hidden) {
            try {
                await carregarEstatisticas();
                console.log('[Detalhes] Estatísticas atualizadas automaticamente');
            } catch (error) {
                console.warn('[Detalhes] Erro na atualização automática:', error);
            }
        }
    }, 30000); // 30 segundos
    
    console.log('[Detalhes] Atualização automática configurada');
}

// Inicializar aplicação
async function inicializarApp() {
    try {
        mostrarLoading();
        console.log('[Detalhes] Iniciando aplicação com usuário:', usuario.uid);
        
        // Obter ID da conta da URL
        const urlParams = new URLSearchParams(window.location.search);
        const contaId = urlParams.get('conta');
        
        if (!contaId) {
            console.error('[Detalhes] ID da conta não encontrado na URL');
            mostrarToast('ID da conta não encontrado', 'error');
            setTimeout(() => {
                window.location.href = '../Home/home.html';
            }, 2000);
            return;
        }

        console.log('[Detalhes] Carregando conta:', contaId);

        // Aguardar um pouco para garantir que o Firebase esteja pronto
        await new Promise(resolve => setTimeout(resolve, 500));

        // Carregar todas as contas
        await carregarTodasContas();
        
        // Carregar conta específica
        await carregarDetalheConta(contaId);
        
        // Configurar event listeners
        configurarEventListeners();
        
        // Configurar atualização automática quando a página recebe foco
        configurarAtualizacaoAutomatica();
        
        esconderLoading();
        console.log('[Detalhes] Aplicação inicializada com sucesso');
        
    } catch (error) {
        console.error('[Detalhes] Erro ao inicializar:', error);
        mostrarToast('Erro ao carregar detalhes da conta', 'error');
        esconderLoading();
        
        // Redirecionar para home após erro
        setTimeout(() => {
            window.location.href = '../Home/home.html';
        }, 3000);
    }
}

// Carregar todas as contas do usuário
async function carregarTodasContas() {
    try {
        console.log('[Detalhes] Carregando contas para usuário:', usuario.uid);
        
        // Primeiro, tentar buscar TODAS as contas do usuário (sem filtro ativa)
        let snapshot = await db.collection('contas')
            .where('userId', '==', usuario.uid)
            .get();
        
        console.log('[Detalhes] Total de contas do usuário (sem filtro):', snapshot.size);
        
        // Se não encontrou nada, pode ser problema no userId
        if (snapshot.size === 0) {
            console.warn('[Detalhes] Nenhuma conta encontrada para userId:', usuario.uid);
            console.warn('[Detalhes] Tentando buscar com diferentes variações...');
            
            // Tentar buscar por email como fallback
            snapshot = await db.collection('contas')
                .where('userEmail', '==', usuario.email)
                .get();
            
            console.log('[Detalhes] Contas encontradas por email:', snapshot.size);
        }
        
        todasContas = [];
        
        snapshot.forEach(doc => {
            const conta = {
                id: doc.id,
                ...doc.data()
            };
            
            console.log('[Detalhes] Conta encontrada:', {
                id: conta.id,
                nome: conta.nome,
                ativa: conta.ativa,
                userId: conta.userId,
                userEmail: conta.userEmail
            });
            
            // Filtrar apenas contas ativas (se o campo existir)
            if (conta.ativa === undefined || conta.ativa === true) {
                todasContas.push(conta);
                console.log('[Detalhes] Conta adicionada à lista:', conta.nome);
            } else {
                console.log('[Detalhes] Conta inativa ignorada:', conta.nome);
            }
            
            // Salvar no cache para backup
            salvarContaNoCache(conta);
        });
        
        console.log('[Detalhes] Total de contas ativas carregadas:', todasContas.length);
        console.log('[Detalhes] Todas as contas:', todasContas);
        
    } catch (error) {
        console.error('[Detalhes] ERRO ao carregar contas online:', error);
        throw error;
    }
}

// Carregar detalhes de uma conta específica
async function carregarDetalheConta(contaId) {
    try {
        console.log('[Detalhes] Carregando conta online:', contaId);
        
        // SEMPRE buscar dados online do Firebase
        const contaDoc = await db.collection('contas').doc(contaId).get();
        
        if (!contaDoc.exists) {
            throw new Error('Conta não encontrada no banco de dados');
        }
        
        contaAtual = {
            id: contaDoc.id,
            ...contaDoc.data()
        };
        
        console.log('[Detalhes] Conta carregada online:', contaAtual);
        
        // Salvar no cache como backup
        salvarContaNoCache(contaAtual);
        
        // Atualizar interface
        atualizarInterface();
        
        // Carregar estatísticas online
        await carregarEstatisticas();
        
    } catch (error) {
        console.error('[Detalhes] ERRO ao carregar conta online:', error);
        throw error; // Propagar erro para mostrar problema real
    }
}

// Atualizar interface com dados da conta
function atualizarInterface() {
    if (!contaAtual) return;
    
    // Nome da conta
    elements.contaNome.textContent = contaAtual.nome || 'Conta sem nome';
    
    // Saldo atual
    const saldo = parseFloat(contaAtual.saldo || contaAtual.saldoInicial || 0);
    elements.saldoAtual.textContent = formatarMoeda(saldo);
    
    // Banco
    elements.bancoNome.textContent = contaAtual.banco || 'Não informado';
    
    // Ícone do banco
    console.log('[Debug] Atualizando ícone do banco para:', contaAtual.banco);
    const iconePath = obterIconeBanco(contaAtual);
    
    // Remover todas as classes de banco anteriores
    elements.bancoIcone.className = elements.bancoIcone.className
        .replace(/\b(nubank|itau|bradesco|santander|caixa|banco-brasil|picpay|carteira|outros)\b/g, '');
    
    // Adicionar classe de cor baseada no banco
    const bancoNormalizado = (contaAtual.banco || '').toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '');
    
    const classesBanco = {
        'nubank': 'nubank',
        'nu-bank': 'nubank',
        'itau': 'itau',
        'itaú': 'itau',
        'bradesco': 'bradesco',
        'santander': 'santander',
        'caixa': 'caixa',
        'caixa-economica': 'caixa',
        'banco-do-brasil': 'banco-brasil',
        'bb': 'banco-brasil',
        'picpay': 'picpay',
        'pic-pay': 'picpay',
        'carteira': 'carteira',
        'dinheiro': 'carteira'
    };
    
    const classeBanco = classesBanco[bancoNormalizado] || 'outros';
    elements.bancoIcone.classList.add(classeBanco);
    
    if (iconePath && elements.bancoIcone) {
        console.log('[Debug] Carregando ícone:', iconePath);
        // Limpar conteúdo atual
        elements.bancoIcone.innerHTML = '';
        
        // Criar elemento img para o SVG
        const img = document.createElement('img');
        img.src = iconePath;
        img.alt = contaAtual.banco || 'Ícone do banco';
        img.style.width = '32px';
        img.style.height = '32px';
        img.style.objectFit = 'contain';
        
        img.onerror = function() {
            console.error('[Debug] Erro ao carregar ícone:', iconePath);
            // Se não conseguir carregar o SVG, volta para o ícone padrão
            elements.bancoIcone.innerHTML = '<span class="material-icons-round">account_balance</span>';
        };
        
        img.onload = function() {
            console.log('[Debug] Ícone carregado com sucesso!');
        };
        
        elements.bancoIcone.appendChild(img);
    } else {
        console.log('[Debug] Usando ícone padrão - iconePath:', iconePath, 'bancoIcone element:', !!elements.bancoIcone);
        // Se não encontrar ícone, usar o padrão
        if (elements.bancoIcone) {
            elements.bancoIcone.innerHTML = '<span class="material-icons-round">account_balance</span>';
        }
    }
    
    // Tipo da conta
    elements.tipoConta.textContent = contaAtual.tipo || 'Não informado';
    
    // Saldo inicial
    const saldoInicial = parseFloat(contaAtual.saldoInicial || 0);
    elements.saldoInicial.textContent = formatarMoeda(saldoInicial);
    
    // Toggle incluir na tela inicial
    elements.incluirTelaInicial.checked = contaAtual.incluirNaSoma !== false;
    
    // Aplicar tema de cores baseado no banco
    aplicarTemaBanco(contaAtual.banco);
}

// Carregar estatísticas da conta
async function carregarEstatisticas() {
    try {
        console.log('[Detalhes] Carregando estatísticas online...');
        
        if (!contaAtual || !contaAtual.nome) {
            console.warn('[Detalhes] Conta atual não encontrada para carregar estatísticas');
            return;
        }

        // Carregar despesas online - verificar campo 'conta.nome' ou 'carteira.nome'
        const despesasSnapshot = await db.collection('despesas')
            .where('userId', '==', usuario.uid)
            .get();
        
        // Filtrar despesas pela conta (verificar tanto conta quanto carteira)
        let qtdDespesas = 0;
        despesasSnapshot.forEach(doc => {
            const despesa = doc.data();
            const contaDespesa = despesa.conta || despesa.carteira;
            if (contaDespesa && contaDespesa.nome === contaAtual.nome) {
                qtdDespesas++;
            }
        });
        
        elements.qtdDespesas.textContent = `${qtdDespesas} ${qtdDespesas === 1 ? 'Despesa' : 'Despesas'}`;
        
        // Carregar receitas online - usar campo 'conta.nome'
        const receitasSnapshot = await db.collection('receitas')
            .where('userId', '==', usuario.uid)
            .get();
        
        // Filtrar receitas pela conta (campo conta.nome)
        let qtdReceitas = 0;
        receitasSnapshot.forEach(doc => {
            const receita = doc.data();
            if (receita.conta && receita.conta.nome === contaAtual.nome) {
                qtdReceitas++;
            }
        });
        
        elements.qtdReceitas.textContent = `${qtdReceitas} ${qtdReceitas === 1 ? 'Receita' : 'Receitas'}`;
        
        // Carregar transferências online - por enquanto mantemos como 0 até implementarmos transferências
        const qtdTransferencias = 0;
        elements.qtdTransferencias.textContent = `${qtdTransferencias} ${qtdTransferencias === 1 ? 'Transferência' : 'Transferências'}`;
        
        console.log('[Detalhes] Estatísticas carregadas online:', {
            conta: contaAtual.nome,
            despesas: qtdDespesas,
            receitas: qtdReceitas,
            transferencias: qtdTransferencias
        });
        
    } catch (error) {
        console.error('[Detalhes] ERRO ao carregar estatísticas online:', error);
        // Em caso de erro, mostrar valores padrão
        elements.qtdDespesas.textContent = '0 Despesas';
        elements.qtdReceitas.textContent = '0 Receitas';
        elements.qtdTransferencias.textContent = '0 Transferências';
    }
}

// Abrir popup de reajustar saldo
function abrirPopupReajustar() {
    const saldoAtual = parseFloat(contaAtual.saldo || contaAtual.saldoInicial || 0);
    elements.novoSaldo.value = saldoAtual.toFixed(2).replace('.', ',');
    elements.popupReajustar.classList.add('show');
    elements.novoSaldo.focus();
    elements.novoSaldo.select();
}

// Fechar popup de reajustar saldo
function fecharPopupReajustar() {
    elements.popupReajustar.classList.remove('show');
    elements.novoSaldo.value = '';
}

// Confirmar reajuste de saldo
async function confirmarReajuste() {
    try {
        const novoValor = parseValueToNumber(elements.novoSaldo.value);
        
        if (isNaN(novoValor) || novoValor < 0) {
            mostrarToast('Digite um valor válido', 'error');
            return;
        }
        
        // Atualizar no Firestore
        await db.collection('contas').doc(contaAtual.id).update({
            saldo: novoValor,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Atualizar dados locais
        contaAtual.saldo = novoValor;
        elements.saldoAtual.textContent = formatarMoeda(novoValor);
        
        fecharPopupReajustar();
        mostrarToast('Saldo reajustado com sucesso!', 'success');
        
        console.log('[Detalhes] Saldo reajustado para:', formatarMoeda(novoValor));
        
    } catch (error) {
        console.error('[Detalhes] Erro ao reajustar saldo:', error);
        mostrarToast('Erro ao reajustar saldo', 'error');
    }
}

// Abrir seletor de conta (funcionalidade simples)
async function abrirSelectorConta() {
    if (!elements.popupSelectorConta || !elements.contasLista) {
        console.error('[Detalhes] Elementos do popup não encontrados');
        return;
    }
    
    // Se não há contas carregadas, tentar recarregar
    if (todasContas.length === 0) {
        try {
            await carregarTodasContas();
        } catch (error) {
            console.error('[Detalhes] Erro ao recarregar contas:', error);
        }
    }
    
    // Mostrar popup
    elements.popupSelectorConta.classList.add('show');
    
    // Renderizar lista
    elements.contasLista.innerHTML = '<p class="loading-contas">Carregando...</p>';
    await renderizarListaContas();
}

// Fechar seletor de conta
function fecharSelectorConta() {
    elements.popupSelectorConta.classList.remove('show');
}

// Renderizar lista de contas no seletor (mantendo visual atual simples)
async function renderizarListaContas() {
    console.log('[Detalhes] Renderizando lista de contas. Total:', todasContas.length);
    elements.contasLista.innerHTML = '';
    
    if (todasContas.length === 0) {
        elements.contasLista.innerHTML = '<p class="no-contas">Nenhuma conta encontrada</p>';
        return;
    }
    
    // Obter mês e ano atuais
    const agora = new Date();
    const mesAtual = agora.getMonth() + 1;
    const anoAtual = agora.getFullYear();
    
    for (const conta of todasContas) {
        // Calcular saldo atual da conta
        const saldoAtual = await calcularSaldoConta(usuario.uid, conta.id, mesAtual, anoAtual);
        
        const div = document.createElement('div');
        div.className = `conta-item ${conta.id === contaAtual.id ? 'active' : ''}`;
        
        // Visual simples, só texto
        div.innerHTML = `
            <div class="conta-item-info">
                <span class="conta-item-nome">${conta.nome}</span>
                <span class="conta-item-banco">${conta.banco || 'Banco'}</span>
                <span class="conta-item-saldo">R$ ${saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            ${conta.id === contaAtual.id ? '<span class="conta-item-selected">✓</span>' : ''}
        `;
        
        div.addEventListener('click', () => {
            console.log('[Detalhes] Conta selecionada:', conta.nome, conta.id);
            selecionarConta(conta.id);
        });
        
        elements.contasLista.appendChild(div);
    }
    
    console.log('[Detalhes] Lista de contas renderizada com sucesso');
}

// Selecionar conta
async function selecionarConta(contaId) {
    try {
        console.log('[Detalhes] Selecionando conta:', contaId);
        fecharSelectorConta();
        mostrarLoading();
        
        // Atualizar URL
        const url = new URL(window.location);
        url.searchParams.set('conta', contaId);
        window.history.replaceState({}, '', url);
        
        // Carregar nova conta
        await carregarDetalheConta(contaId);
        
        // Carregar estatísticas da nova conta
        await carregarEstatisticas();
        
        esconderLoading();
        console.log('[Detalhes] Conta selecionada com sucesso');
        
    } catch (error) {
        console.error('[Detalhes] Erro ao selecionar conta:', error);
        mostrarToast('Erro ao carregar conta', 'error');
        esconderLoading();
    }
}

// Atualizar configuração de incluir na tela inicial
async function atualizarIncluirTelaInicial() {
    try {
        const incluir = elements.incluirTelaInicial.checked;
        
        await db.collection('contas').doc(contaAtual.id).update({
            incluirNaSoma: incluir,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        contaAtual.incluirNaSoma = incluir;
        
        const mensagem = incluir ? 'Conta incluída na tela inicial' : 'Conta removida da tela inicial';
        mostrarToast(mensagem, 'success');
        
        console.log('[Detalhes] Incluir na soma atualizado:', incluir);
        
    } catch (error) {
        console.error('[Detalhes] Erro ao atualizar configuração:', error);
        mostrarToast('Erro ao atualizar configuração', 'error');
        
        // Reverter toggle em caso de erro
        elements.incluirTelaInicial.checked = !elements.incluirTelaInicial.checked;
    }
}

// Utilitários
function mostrarLoading() {
    elements.loadingOverlay.style.display = 'flex';
    elements.containerApp.style.display = 'none';
}

function esconderLoading() {
    elements.loadingOverlay.style.display = 'none';
    elements.containerApp.style.display = 'block';
}

function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
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

function formatarValorInput(event) {
    let value = event.target.value;
    
    // Remove tudo que não é dígito
    value = value.replace(/\D/g, '');
    
    // Converte para formato brasileiro
    if (value.length > 2) {
        value = value.replace(/(\d)(\d{2})$/, '$1,$2');
    }
    
    if (value.length > 6) {
        value = value.replace(/(\d)(\d{3})(\d{2})$/, '$1.$2,$3');
    }
    
    if (value.length > 10) {
        value = value.replace(/(\d)(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3,$4');
    }
    
    event.target.value = value;
}

function mostrarToast(mensagem, tipo = 'info') {
    const cores = {
        success: '#21C25E',
        error: '#EF233C',
        warning: '#FFB800',
        info: '#00B4D8'
    };
    
    let toast = document.getElementById('toast-ux');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-ux';
        toast.style.cssText = `
            position: fixed;
            bottom: 32px;
            left: 50%;
            transform: translateX(-50%);
            background: ${cores[tipo]};
            color: white;
            padding: 14px 32px;
            border-radius: 24px;
            font-family: 'Poppins', sans-serif;
            font-size: 1rem;
            z-index: 99999;
            box-shadow: 0 4px 16px rgba(0,0,0,0.13);
            opacity: 0;
            transition: opacity 0.4s;
        `;
        document.body.appendChild(toast);
    }
    
    toast.style.background = cores[tipo];
    toast.textContent = mensagem;
    toast.style.opacity = '1';
    
    setTimeout(() => {
        toast.style.opacity = '0';
    }, 2200);
}
