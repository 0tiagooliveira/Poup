// === FIREBASE E CONFIGURAÇÃO ===
// Usando Firebase v8 para compatibilidade

// Configuração do Firebase (mesma da home)
const firebaseConfig = {
    apiKey: "AIzaSyC7RB9fULmkp9xeJIjc0dL58atHJ8CM-Xc",
    authDomain: "poup-beta.firebaseapp.com",
    projectId: "poup-beta",
    storageBucket: "poup-beta.appspot.com",
    messagingSenderId: "954695915981",
    appId: "1:954695915981:web:d31b216f79eac178094c84"
};

// Variáveis Firebase
let db = null;
let auth = null;
let usuarioAtual = null;

// Console logs apenas em debug
const DEBUG_MODE = window.location.search.includes('debug=true');

if (DEBUG_MODE) {
    console.log('📊 Sistema de Gráficos Iniciado');
    console.log('🔗 URL:', window.location.href);
}

// === FUNÇÕES DE LOG ===
function logInfo(emoji, mensagem, dados = null) {
    if (DEBUG_MODE) {
        if (dados) {
            console.log(`${emoji} [GRÁFICOS] ${mensagem}`, dados);
        } else {
            console.log(`${emoji} [GRÁFICOS] ${mensagem}`);
        }
    }
}

function logError(emoji, mensagem, erro = null) {
    console.error(`${emoji} [GRÁFICOS] ${mensagem}`, erro || '');
}

function logWarn(emoji, mensagem, dados = null) {
    console.warn(`${emoji} [GRÁFICOS] ${mensagem}`, dados || '');
}

// Dados reais do Firebase - estrutura para armazenar dados carregados
let dadosReais = {
    despesasCategoria: {},
    despesasConta: {},
    receitasCategoria: {},
    receitasConta: {},
    saldosConta: {},
    despesasFixasVariaveis: {},
    receitasFixasVariaveis: {},
};

// Estado atual dos gráficos
let tipoAtivo = 'donut';
let categoriaAtiva = 'despesas-categoria';
let graficoAtual = null;

// === INICIALIZAÇÃO ===
logInfo('🚀', 'Iniciando sistema de gráficos...');

// Aguardar Firebase ser carregado
firebase.initializeApp(firebaseConfig);
db = firebase.firestore();
auth = firebase.auth();

logInfo('✅', 'Firebase inicializado com sucesso');
logInfo('🗄', 'Firestore conectado');
logInfo('🔐', 'Auth conectado');

// Aguardar DOM e autenticação
document.addEventListener('DOMContentLoaded', function() {
    logInfo('🏠', 'DOM carregado, inicializando aplicação...');
    
    // Verificar autenticação
    auth.onAuthStateChanged((user) => {
        if (user) {
            usuarioAtual = user;
            logInfo('👤', `Usuário autenticado: ${user.email}`);
            logInfo('🆔', `UID: ${user.uid}`);
            
            // Aguardar um breve momento para garantir que o Firestore está pronto
            setTimeout(() => {
                // Inicializar controles
                inicializarControles();
                logInfo('✅', 'Controles inicializados');
                
                // Carregar dados e criar gráfico inicial
                carregarDadosReais();
            }, 100);
        } else {
            logError('❌', 'Usuário não autenticado, redirecionando...');
            window.location.href = '../index.html';
        }
    });
});

// === CARREGAMENTO DE DADOS ===
async function carregarDadosReais() {
    try {
        logInfo('📡', 'Carregando dados reais do Firebase...');
        
        // Verificar se o usuário está autenticado antes de prosseguir
        if (!usuarioAtual || !usuarioAtual.uid) {
            logError('❌', 'Usuário não está autenticado');
            return;
        }
        
        // Carregar dados em paralelo mas com tratamento de erro individual
        const promisesCarregamento = [
            carregarDespesas().catch(error => {
                logError('❌', 'Falha ao carregar despesas:', error);
                return [];
            }),
            carregarReceitas().catch(error => {
                logError('❌', 'Falha ao carregar receitas:', error);
                return [];
            }),
            carregarContas().catch(error => {
                logError('❌', 'Falha ao carregar contas:', error);
                return [];
            }),
            carregarTransferencias().catch(error => {
                logError('❌', 'Falha ao carregar transferências:', error);
                return [];
            })
        ];

        const [despesas, receitas, contas, transferencias] = await Promise.all(promisesCarregamento);

        const dadosCarregados = { despesas, receitas, contas, transferencias };
        
        logInfo('📊', 'Dados carregados:', {
            despesas: despesas.length,
            receitas: receitas.length,
            contas: contas.length,
            transferencias: transferencias.length
        });
        
        // Processar dados
        processarDadosParaGraficos(dadosCarregados);
        
        // Criar gráfico inicial
        criarGrafico();
        
    } catch (error) {
        logError('❌', 'Erro crítico ao carregar dados:', error);
        
        // Tentar mostrar uma mensagem amigável para o usuário
        mostrarMensagemSemDados();
    }
}

async function carregarDespesas() {
    try {
        logInfo('💸', 'Carregando despesas...');
        
        // Verificar se o usuário está autenticado
        if (!usuarioAtual || !usuarioAtual.uid) {
            throw new Error('Usuário não autenticado');
        }
        
        const despesas = [];
        const snapshot = await db.collection('despesas').where('usuarioId', '==', usuarioAtual.uid).get();
        
        snapshot.forEach(doc => {
            despesas.push({ id: doc.id, ...doc.data() });
        });
        
        logInfo('💸', `${despesas.length} despesas carregadas`);
        return despesas;
    } catch (error) {
        logError('❌', 'Erro ao carregar despesas:', error);
        // Em caso de erro, retornar array vazio para não quebrar o app
        return [];
    }
}

async function carregarReceitas() {
    try {
        logInfo('💰', 'Carregando receitas...');
        
        // Verificar se o usuário está autenticado
        if (!usuarioAtual || !usuarioAtual.uid) {
            throw new Error('Usuário não autenticado');
        }
        
        const receitas = [];
        const snapshot = await db.collection('receitas').where('usuarioId', '==', usuarioAtual.uid).get();
        
        snapshot.forEach(doc => {
            receitas.push({ id: doc.id, ...doc.data() });
        });
        
        logInfo('💰', `${receitas.length} receitas carregadas`);
        return receitas;
    } catch (error) {
        logError('❌', 'Erro ao carregar receitas:', error);
        return [];
    }
}

async function carregarContas() {
    try {
        logInfo('🏦', 'Carregando contas...');
        
        // Verificar se o usuário está autenticado
        if (!usuarioAtual || !usuarioAtual.uid) {
            throw new Error('Usuário não autenticado');
        }
        
        const contas = [];
        const snapshot = await db.collection('contas').where('usuarioId', '==', usuarioAtual.uid).get();
        
        snapshot.forEach(doc => {
            contas.push({ id: doc.id, ...doc.data() });
        });
        
        logInfo('🏦', `${contas.length} contas carregadas`);
        return contas;
    } catch (error) {
        logError('❌', 'Erro ao carregar contas:', error);
        return [];
    }
}

async function carregarTransferencias() {
    try {
        logInfo('🔄', 'Carregando transferências...');
        
        // Verificar se o usuário está autenticado
        if (!usuarioAtual || !usuarioAtual.uid) {
            throw new Error('Usuário não autenticado');
        }
        
        const transferencias = [];
        const snapshot = await db.collection('transferencias').where('usuarioId', '==', usuarioAtual.uid).get();
        
        snapshot.forEach(doc => {
            transferencias.push({ id: doc.id, ...doc.data() });
        });
        
        logInfo('🔄', `${transferencias.length} transferências carregadas`);
        return transferencias;
    } catch (error) {
        logError('❌', 'Erro ao carregar transferências:', error);
        return [];
    }
}

// === PROCESSAMENTO DE DADOS ===
function processarDadosParaGraficos(dados) {
    logInfo('🔄', 'Processando dados para gráficos...');
    
    // Processar despesas por categoria
    dadosReais.despesasCategoria = processarPorCategoria(dados.despesas || [], 'despesa');
    
    // Processar receitas por categoria
    dadosReais.receitasCategoria = processarPorCategoria(dados.receitas || [], 'receita');
    
    // Processar despesas por conta
    dadosReais.despesasConta = processarPorConta(dados.despesas || []);
    
    // Processar receitas por conta
    dadosReais.receitasConta = processarPorConta(dados.receitas || []);
    
    // Calcular saldos por conta
    dadosReais.saldosConta = calcularSaldosPorConta(dados.contas || [], dados.receitas || [], dados.despesas || []);
    
    logInfo('✅', 'Dados processados com sucesso');
}

function processarPorCategoria(transacoes, tipo) {
    const resultado = {};
    
    transacoes.forEach(transacao => {
        // Converter valores usando a mesma lógica da Home
        let valor = 0;
        if (typeof transacao.valor === 'string') {
            valor = parseFloat(transacao.valor.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
        } else if (typeof transacao.valor === 'number') {
            valor = transacao.valor;
        }
        
        // Garantir que o valor seja positivo
        valor = Math.abs(valor);
        
        const categoria = transacao.categoria || 'Outros';
        resultado[categoria] = (resultado[categoria] || 0) + valor;
    });
    
    logInfo('📊', `Processadas ${transacoes.length} ${tipo}s em ${Object.keys(resultado).length} categorias`);
    return resultado;
}

function processarPorConta(transacoes) {
    const resultado = {};
    
    transacoes.forEach(transacao => {
        // Converter valores usando a mesma lógica da Home
        let valor = 0;
        if (typeof transacao.valor === 'string') {
            valor = parseFloat(transacao.valor.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
        } else if (typeof transacao.valor === 'number') {
            valor = transacao.valor;
        }
        
        // Garantir que o valor seja positivo
        valor = Math.abs(valor);
        
        const conta = transacao.conta || 'Conta Padrão';
        resultado[conta] = (resultado[conta] || 0) + valor;
    });
    
    logInfo('💳', `Processadas ${transacoes.length} transações em ${Object.keys(resultado).length} contas`);
    return resultado;
}

function calcularSaldosPorConta(contas, receitas, despesas) {
    const saldos = {};
    
    // Inicializar com saldos das contas
    contas.forEach(conta => {
        let saldoAtual = 0;
        if (typeof conta.saldoAtual === 'string') {
            saldoAtual = parseFloat(conta.saldoAtual.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
        } else if (typeof conta.saldoAtual === 'number') {
            saldoAtual = conta.saldoAtual;
        }
        
        const nomeConta = conta.nome || conta.banco || 'Conta Sem Nome';
        saldos[nomeConta] = Math.abs(saldoAtual);
    });
    
    logInfo('🏦', `Calculados saldos para ${Object.keys(saldos).length} contas`);
    return saldos;
}

// === OBTENÇÃO DE DADOS PARA GRÁFICO ===
function obterDadosParaGrafico(categoria) {
    const chaveCategoria = mapearCategoria(categoria);
    
    // Primeiro, verificar se temos dados para a categoria específica
    if (dadosReais[chaveCategoria] && Object.keys(dadosReais[chaveCategoria]).length > 0) {
        return dadosReais[chaveCategoria];
    }
    
    // Se não temos dados para categoria específica, usar dados apropriados baseado no tipo
    // CORREÇÃO: Para despesas, mostrar apenas dados de despesas
    if (categoria.includes('despesas')) {
        // Priorizar categorias de despesas
        if (dadosReais.despesasCategoria && Object.keys(dadosReais.despesasCategoria).length > 0) {
            return dadosReais.despesasCategoria;
        }
        if (dadosReais.despesasConta && Object.keys(dadosReais.despesasConta).length > 0) {
            return dadosReais.despesasConta;
        }
    }
    
    // CORREÇÃO: Para receitas, mostrar apenas dados de receitas  
    if (categoria.includes('receitas')) {
        if (dadosReais.receitasCategoria && Object.keys(dadosReais.receitasCategoria).length > 0) {
            return dadosReais.receitasCategoria;
        }
        if (dadosReais.receitasConta && Object.keys(dadosReais.receitasConta).length > 0) {
            return dadosReais.receitasConta;
        }
    }
    
    // Para saldos, mostrar saldos
    if (categoria.includes('saldo')) {
        if (dadosReais.saldosConta && Object.keys(dadosReais.saldosConta).length > 0) {
            return dadosReais.saldosConta;
        }
    }
    
    logWarn('⚠️', `Sem dados específicos para: ${categoria}`);
    return { 'Sem dados': 0 };
}

function mapearCategoria(categoria) {
    const mapeamento = {
        'despesas-categoria': 'despesasCategoria',
        'despesas-conta': 'despesasConta', 
        'receitas-categoria': 'receitasCategoria',
        'receitas-conta': 'receitasConta',
        'saldos-conta': 'saldosConta',
        'despesas-fixas-variaveis': 'despesasFixasVariaveis',
        'receitas-fixas-variaveis': 'receitasFixasVariaveis'
    };
    
    return mapeamento[categoria] || categoria;
}

// === CONTROLES ===
function inicializarControles() {
    // Botões de tipo
    document.querySelectorAll('.tipo-grafico').forEach(btn => {
        btn.addEventListener('click', (e) => {
            tipoAtivo = e.currentTarget.dataset.tipo;
            
            // Atualizar UI
            document.querySelectorAll('.tipo-grafico').forEach(b => b.classList.remove('ativo'));
            e.currentTarget.classList.add('ativo');
            
            // Recriar gráfico
            criarGrafico();
        });
    });
    
    // Botões de categoria
    document.querySelectorAll('.filtro-categoria').forEach(btn => {
        btn.addEventListener('click', (e) => {
            categoriaAtiva = e.currentTarget.dataset.categoria;
            
            // Atualizar UI
            document.querySelectorAll('.filtro-categoria').forEach(b => b.classList.remove('ativo'));
            e.currentTarget.classList.add('ativo');
            
            // Recriar gráfico
            criarGrafico();
        });
    });
}

// === CRIAÇÃO DE GRÁFICOS ===
function criarGrafico() {
    const canvas = document.getElementById('grafico-principal');
    if (!canvas) {
        logError('❌', 'Canvas não encontrado');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    logInfo('🖼️', 'Contexto do canvas obtido');
    
    // Destruir gráfico anterior
    if (graficoAtual) {
        graficoAtual.destroy();
        graficoAtual = null;
    }
    
    // Obter dados corretos para a categoria atual
    const dados = obterDadosParaGrafico(categoriaAtiva);
    
    if (!dados || Object.keys(dados).length === 0) {
        mostrarMensagemSemDados();
        return;
    }
    
    // Criar gráfico baseado no tipo
    if (tipoAtivo === 'donut') {
        criarGraficoDonut(ctx, dados);
    } else if (tipoAtivo === 'linha') {
        criarGraficoLinha(ctx, dados);
    } else if (tipoAtivo === 'colunas') {
        criarGraficoBarras(ctx, dados);
    }
    
    logInfo('✅', 'Gráfico criado com sucesso');
}

function criarGraficoDonut(ctx, dados) {
    logInfo('🍩', 'Criando gráfico de rosca');
    
    const labels = Object.keys(dados);
    const valores = Object.values(dados);
    
    // Verificar se há dados válidos
    if (labels.length === 0 || valores.every(v => v === 0)) {
        mostrarMensagemSemDados();
        return;
    }
    
    const cores = gerarCores(labels.length);
    
    try {
        graficoAtual = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: valores,
                    backgroundColor: cores,
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const valor = context.parsed;
                                const porcentagem = ((valor / total) * 100).toFixed(1);
                                return `${context.label}: R$ ${valor.toFixed(2)} (${porcentagem}%)`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
        
        logInfo('📊', 'Chart.js criado com sucesso');
        logInfo('✅', 'Gráfico donut criado completamente');
        
    } catch (error) {
        logError('❌', 'Erro ao criar gráfico donut:', error);
    }
}

function criarGraficoLinha(ctx, dados) {
    logInfo('📈', 'Criando gráfico de linha');
    
    const labels = Object.keys(dados);
    const valores = Object.values(dados);
    
    try {
        graficoAtual = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: categoriaAtiva.replace('-', ' ').toUpperCase(),
                    data: valores,
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: R$ ${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
        
        logInfo('✅', 'Gráfico de linha criado com sucesso');
        
    } catch (error) {
        logError('❌', 'Erro ao criar gráfico de linha:', error);
    }
}

function criarGraficoBarras(ctx, dados) {
    logInfo('📊', 'Criando gráfico de barras');
    
    const labels = Object.keys(dados);
    const valores = Object.values(dados);
    
    try {
        graficoAtual = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: categoriaAtiva.replace('-', ' ').toUpperCase(),
                    data: valores,
                    backgroundColor: '#22c55e',
                    borderColor: '#16a34a',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: R$ ${context.parsed.y.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$ ' + value.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
        
        logInfo('✅', 'Gráfico de barras criado com sucesso');
        
    } catch (error) {
        logError('❌', 'Erro ao criar gráfico de barras:', error);
    }
}

// === UTILITÁRIOS ===
function gerarCores(quantidade) {
    const cores = [
        '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
        '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
    ];
    
    const resultado = [];
    for (let i = 0; i < quantidade; i++) {
        resultado.push(cores[i % cores.length]);
    }
    
    return resultado;
}

function mostrarMensagemSemDados() {
    const canvas = document.getElementById('grafico-principal');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#64748b';
        ctx.font = '16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('Nenhum dado encontrado para esta categoria', canvas.width / 2, canvas.height / 2);
    }
}

// Log de performance
window.addEventListener('load', () => {
    if (DEBUG_MODE) {
        logInfo('⚡', 'Página carregada completamente');
        logInfo('📊', 'Sistema de gráficos pronto para uso');
        logInfo('⏱️', `Tempo de carregamento: ${performance.now().toFixed(2)}ms`);
    }
});

// Log de erros globais apenas em casos críticos
window.addEventListener('error', (event) => {
    logError('💥', 'Erro crítico na aplicação:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno
    });
});

logInfo('🎯', 'Script de gráficos carregado completamente');
logInfo('📊', `Estado inicial: Tipo=${tipoAtivo}, Categoria=${categoriaAtiva}`);