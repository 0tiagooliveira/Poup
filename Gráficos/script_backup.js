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

// Console logs essenciais
console.log('� Sistema de Gráficos Iniciado');
console.log('🔗 URL:', window.location.href);

// === FUNÇÕES DE LOG ===
function logInfo(emoji, mensagem, dados = null) {
    if (dados) {
        console.log(`${emoji} [GRÁFICOS] ${mensagem}`, dados);
    } else {
        console.log(`${emoji} [GRÁFICOS] ${mensagem}`);
    }
}

function logError(emoji, mensagem, erro = null) {
    console.error(`${emoji} [GRÁFICOS] ${mensagem}`, erro || '');
}

function logWarn(emoji, mensagem, dados = null) {
    console.warn(`${emoji} [GRÁFICOS] ${mensagem}`, dados || '');
}

// Log de início
logInfo('🚀', 'Iniciando sistema de gráficos...');

// Dados reais do Firebase - estrutura para armazenar dados carregados
let dadosReais = {
    despesasCategoria: null,
    despesasConta: null,
    receitasCategoria: null,
    receitasConta: null,
    saldosConta: null,
    despesasFixasVariaveis: null,
    receitasFixasVariaveis: null,
    despesasSemana: null,
    despesasMes: null,
    despesasAno: null,
    balancoMensal: null,
    fluxoCaixaAnual: null,
    despesasDiaSemana: null
};

// Variáveis globais
let graficoAtual = null;
let tipoAtivo = 'donut';
let categoriaAtiva = 'despesas-categoria';

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    logInfo('�', 'DOM carregado, inicializando aplicação...');
    
    // Verificar se Firebase está disponível
    if (typeof firebase === 'undefined') {
        logError('❌', 'Firebase não está carregado!');
        inicializarSemFirebase();
        return;
    }
    
    try {
        // Inicializar Firebase
        logInfo('🔥', 'Inicializando Firebase...');
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        auth = firebase.auth();
        
        logInfo('✅', 'Firebase inicializado com sucesso');
        logInfo('�', 'Firestore conectado');
        logInfo('🔐', 'Auth conectado');
        
        // Observar mudanças de autenticação
        auth.onAuthStateChanged((user) => {
            if (user) {
                usuarioAtual = user;
                logInfo('👤', `Usuário autenticado: ${user.email}`);
                logInfo('🆔', `UID: ${user.uid}`);
                inicializarEventListeners();
                carregarDadosReais();
            } else {
                logWarn('⚠️', 'Usuário não autenticado, redirecionando para login...');
                // Redirecionar para login se não estiver autenticado
                window.location.href = '../index.html';
            }
        });
        
    } catch (error) {
        logError('💥', 'Erro ao inicializar Firebase:', error);
        inicializarSemFirebase();
    }
});

function inicializarSemFirebase() {
    logError('�', 'Firebase não disponível - redirecionando para login');
    window.location.href = '../index.html';
}

// === CARREGAMENTO DE DADOS REAIS ===
async function carregarDadosReais() {
    if (!usuarioAtual) {
        logError('❌', 'Usuário não autenticado, redirecionando...');
        window.location.href = '../index.html';
        return;
    }
    
    try {
        logInfo('📡', 'Carregando dados reais do Firebase...');
        
        // Carregar dados em paralelo
        const [despesas, receitas, contas, transferencias] = await Promise.all([
            carregarDespesas(),
            carregarReceitas(), 
            carregarContas(),
            carregarTransferencias()
        ]);
        
        logInfo('📊', 'Dados carregados:', {
            despesas: despesas.length,
            receitas: receitas.length,
            contas: contas.length,
            transferencias: transferencias.length
        });
        
        // Verificar se há dados suficientes (pelo menos receitas OU despesas)
        if (despesas.length === 0 && receitas.length === 0) {
            logWarn('📊', 'Nenhum dado encontrado, usuário pode estar começando a usar o app');
            mostrarMensagemSemDados();
            return;
        }
        
        logInfo('✅', 'Dados suficientes encontrados, processando para gráficos...');
        
        // Processar dados para gráficos
        processarDadosParaGraficos(despesas, receitas, contas, transferencias);
        
    } catch (error) {
        logError('❌', 'Erro ao carregar dados:', error);
        mostrarMensagemErro();
    }
}

async function carregarDespesas() {
    try {
        logInfo('💸', 'Carregando despesas...');
        const snapshot = await db.collection('despesas')
            .where('userId', '==', usuarioAtual.uid)
            .orderBy('data', 'desc')
            .limit(100)
            .get();
        
        const despesas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        logInfo('💸', `${despesas.length} despesas carregadas`);
        return despesas;
    } catch (error) {
        logError('❌', 'Erro ao carregar despesas:', error);
        return [];
    }
}

async function carregarReceitas() {
    try {
        logInfo('💰', 'Carregando receitas...');
        const snapshot = await db.collection('receitas')
            .where('userId', '==', usuarioAtual.uid)
            .orderBy('data', 'desc')
            .limit(100)
            .get();
        
        const receitas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
        const snapshot = await db.collection('contas')
            .where('userId', '==', usuarioAtual.uid)
            .get();
        
        const contas = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
        const snapshot = await db.collection('transferencias')
            .where('userId', '==', usuarioAtual.uid)
            .orderBy('data', 'desc')
            .limit(50)
            .get();
        
        const transferencias = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        logInfo('🔄', `${transferencias.length} transferências carregadas`);
        return transferencias;
    } catch (error) {
        logError('❌', 'Erro ao carregar transferências:', error);
        return [];
    }
}

// === PROCESSAMENTO DE DADOS ===
function processarDadosParaGraficos(despesas, receitas, contas, transferencias) {
    console.log('🔄 Processando dados para gráficos...');
    console.log(`[Gráficos] Total de receitas carregadas: ${receitas.length}`);
    console.log(`[Gráficos] Total de despesas carregadas: ${despesas.length}`);
    console.log(`[Gráficos] Total de contas carregadas: ${contas.length}`);
    
    // Processar despesas por categoria
    const despesasPorCategoria = processarPorCategoria(despesas);
    console.log('📊 Despesas por categoria:', despesasPorCategoria);
    
    // Processar receitas por categoria  
    const receitasPorCategoria = processarPorCategoria(receitas);
    console.log('💰 Receitas por categoria:', receitasPorCategoria);
    
    // Processar por conta
    const despesasPorConta = processarPorConta(despesas, contas);
    const receitasPorConta = processarPorConta(receitas, contas);
    
    // Calcular saldos por conta
    const saldosPorConta = calcularSaldosPorConta(contas, receitas, despesas);
    console.log('💳 Saldos por conta:', saldosPorConta);
    
    // Atualizar dados globais com dados reais
    atualizarDadosGlobais({
        despesasPorCategoria,
        receitasPorCategoria,
        despesasPorConta,
        receitasPorConta,
        saldosPorConta
    });
    
    // Recriar gráfico com dados reais
    criarGrafico();
}

function processarPorCategoria(transacoes) {
    const categorias = {};
    
    transacoes.forEach(transacao => {
        const categoria = transacao.categoria || 'Outros';
        // Usar a mesma lógica de conversão do Home
        const valor = parseFloat((transacao.valor || '0').toString().replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
        
        if (!categorias[categoria]) {
            categorias[categoria] = 0;
        }
        categorias[categoria] += valor;
    });
    
    console.log(`📊 Processadas ${transacoes.length} transações em ${Object.keys(categorias).length} categorias:`, categorias);
    return categorias;
}

function processarPorConta(transacoes, contas) {
    const contasMap = {};
    
    // Criar mapa de contas
    contas.forEach(conta => {
        contasMap[conta.id] = conta.nome || conta.banco || 'Conta Desconhecida';
    });
    
    const porConta = {};
    
    transacoes.forEach(transacao => {
        const contaNome = contasMap[transacao.contaId] || 'Conta Desconhecida';
        // Usar a mesma lógica de conversão do Home
        const valor = parseFloat((transacao.valor || '0').toString().replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
        
        if (!porConta[contaNome]) {
            porConta[contaNome] = 0;
        }
        porConta[contaNome] += valor;
    });
    
    console.log(`💳 Processadas ${transacoes.length} transações em ${Object.keys(porConta).length} contas:`, porConta);
    return porConta;
}

function calcularSaldosPorConta(contas, receitas, despesas) {
    const saldos = {};
    
    contas.forEach(conta => {
        const nome = conta.nome || conta.banco || 'Conta Desconhecida';
        // Usar a mesma lógica de conversão do Home
        saldos[nome] = parseFloat((conta.saldo || '0').toString().replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
    });
    
    console.log(`🏦 Calculados saldos para ${Object.keys(saldos).length} contas:`, saldos);
    return saldos;
}

function atualizarDadosGlobais(dadosCarregados) {
    logInfo('🔄', 'Atualizando dados globais com dados reais...');
    
    // Atualizar dadosReais com dados carregados do Firebase
    if (dadosCarregados.despesasPorCategoria && Object.keys(dadosCarregados.despesasPorCategoria).length > 0) {
        const categorias = Object.keys(dadosCarregados.despesasPorCategoria);
        const valores = Object.values(dadosCarregados.despesasPorCategoria);
        
        dadosReais.despesasCategoria = {
            labels: categorias,
            valores: valores,
            cores: gerarCores(categorias.length),
            total: valores.reduce((a, b) => a + b, 0)
        };
        logInfo('✅', 'Despesas por categoria atualizadas');
    }
    
    if (dadosCarregados.receitasPorCategoria && Object.keys(dadosCarregados.receitasPorCategoria).length > 0) {
        const categorias = Object.keys(dadosCarregados.receitasPorCategoria);
        const valores = Object.values(dadosCarregados.receitasPorCategoria);
        
        dadosReais.receitasCategoria = {
            labels: categorias,
            valores: valores,
            cores: gerarCores(categorias.length),
            total: valores.reduce((a, b) => a + b, 0)
        };
        logInfo('✅', 'Receitas por categoria atualizadas');
    }
    
    if (dadosCarregados.despesasPorConta && Object.keys(dadosCarregados.despesasPorConta).length > 0) {
        const contas = Object.keys(dadosCarregados.despesasPorConta);
        const valores = Object.values(dadosCarregados.despesasPorConta);
        
        dadosReais.despesasConta = {
            labels: contas,
            valores: valores,
            cores: gerarCores(contas.length),
            total: valores.reduce((a, b) => a + b, 0)
        };
        logInfo('✅', 'Despesas por conta atualizadas');
    }
    
    if (dadosCarregados.receitasPorConta && Object.keys(dadosCarregados.receitasPorConta).length > 0) {
        const contas = Object.keys(dadosCarregados.receitasPorConta);
        const valores = Object.values(dadosCarregados.receitasPorConta);
        
        dadosReais.receitasConta = {
            labels: contas,
            valores: valores,
            cores: gerarCores(contas.length),
            total: valores.reduce((a, b) => a + b, 0)
        };
        logInfo('✅', 'Receitas por conta atualizadas');
    }
    
    if (dadosCarregados.saldosPorConta && Object.keys(dadosCarregados.saldosPorConta).length > 0) {
        const contas = Object.keys(dadosCarregados.saldosPorConta);
        const valores = Object.values(dadosCarregados.saldosPorConta);
        
        dadosReais.saldosConta = {
            labels: contas,
            valores: valores,
            cores: gerarCores(contas.length),
            total: valores.reduce((a, b) => a + b, 0)
        };
        logInfo('✅', 'Saldos por conta atualizados');
    }
    
    logInfo('✅', 'Dados globais atualizados com dados reais');
}

function mostrarMensagemSemDados() {
    const container = document.getElementById('grafico-principal').parentElement;
    container.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--texto-secundario);">
            <span class="material-icons-round" style="font-size: 64px; color: var(--primaria); margin-bottom: 16px;">trending_up</span>
            <h3 style="color: var(--texto); margin-bottom: 8px;">Nenhum dado encontrado</h3>
            <p>Adicione algumas transações para ver seus gráficos aqui.</p>
            <button onclick="window.location.href='../Home/home.html'" style="
                background: var(--primaria); 
                color: white; 
                border: none; 
                padding: 12px 24px; 
                border-radius: 8px; 
                margin-top: 16px; 
                cursor: pointer;
            ">Ir para início</button>
        </div>
    `;
}

function mostrarMensagemErro() {
    const container = document.getElementById('grafico-principal').parentElement;
    container.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--texto-secundario);">
            <span class="material-icons-round" style="font-size: 64px; color: var(--erro); margin-bottom: 16px;">error</span>
            <h3 style="color: var(--texto); margin-bottom: 8px;">Erro ao carregar dados</h3>
            <p>Ocorreu um erro ao buscar suas informações. Tente novamente.</p>
            <button onclick="location.reload()" style="
                background: var(--primaria); 
                color: white; 
                border: none; 
                padding: 12px 24px; 
                border-radius: 8px; 
                margin-top: 16px; 
                cursor: pointer;
            ">Tentar novamente</button>
        </div>
    `;
}

function inicializarEventListeners() {
    logInfo('🎛️', 'Inicializando controles...');
    
    // Tipos de gráficos
    const tiposGrafico = document.querySelectorAll('.tipo-grafico');
    
    tiposGrafico.forEach((botao) => {
        botao.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remover ativo de todos
            tiposGrafico.forEach(b => b.classList.remove('ativo'));
            // Adicionar ativo ao clicado
            this.classList.add('ativo');
            
            tipoAtivo = this.dataset.tipo;
            logInfo('📊', `Tipo alterado: ${tipoAtivo}`);
            
            alternarFiltros();
            criarGrafico();
        });
    });
    
    // Filtros de categoria
    const filtrosCategoria = document.querySelectorAll('.filtro-categoria');
    
    filtrosCategoria.forEach((botao) => {
        botao.addEventListener('click', function(e) {
            e.preventDefault();
            
            const container = this.parentElement;
            container.querySelectorAll('.filtro-categoria').forEach(b => b.classList.remove('ativo'));
            this.classList.add('ativo');
            
            categoriaAtiva = this.dataset.categoria;
            logInfo('🏷️', `Categoria: ${categoriaAtiva}`);
            
            criarGrafico();
        });
    });
    
    // Botões de navegação de período
    const botaoAnterior = document.querySelector('.anterior');
    const botaoProximo = document.querySelector('.proximo');
    
    if (botaoAnterior) {
        botaoAnterior.addEventListener('click', (e) => {
            e.preventDefault();
            navegarPeriodo(-1);
        });
    }
    
    if (botaoProximo) {
        botaoProximo.addEventListener('click', (e) => {
            e.preventDefault();
            navegarPeriodo(1);
        });
    }
    
    // Botão voltar
    const botaoVoltar = document.querySelector('.botao-voltar');
    if (botaoVoltar) {
        botaoVoltar.addEventListener('click', (e) => {
            e.preventDefault();
            history.back();
        });
    }
    
    logInfo('✅', 'Controles inicializados');
    logInfo('📊', `Estado inicial - Tipo: ${tipoAtivo}, Categoria: ${categoriaAtiva}`);
}

function alternarFiltros() {
    // Esconder todos os filtros
    const todosFiltros = document.querySelectorAll('.filtros-categoria');
    todosFiltros.forEach(filtro => {
        filtro.style.display = 'none';
    });
    
    // Mostrar filtro ativo
    const filtroAtivo = document.getElementById(`filtros-${tipoAtivo}`);
    if (filtroAtivo) {
        filtroAtivo.style.display = 'flex';
        
        // Ativar primeiro filtro
        const primeiroFiltro = filtroAtivo.querySelector('.filtro-categoria');
        if (primeiroFiltro) {
            // Remover ativo de todos
            filtroAtivo.querySelectorAll('.filtro-categoria').forEach(b => b.classList.remove('ativo'));
            // Ativar primeiro
            primeiroFiltro.classList.add('ativo');
            categoriaAtiva = primeiroFiltro.dataset.categoria;
        }
    }
}

function criarGrafico() {
    const canvas = document.getElementById('grafico-principal');
    if (!canvas) {
        logError('❌', 'Canvas não encontrado!');
        return;
    }
    
    // Limpar gráfico anterior se existir
    if (graficoAtual) {
        graficoAtual.destroy();
        graficoAtual = null;
    }
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        logError('❌', 'Contexto 2D não encontrado!');
        return;
    }
    logInfo('🖼️', 'Contexto do canvas obtido');
    
    if (graficoAtual) {
        logInfo('🗑️', 'Destruindo gráfico anterior');
        graficoAtual.destroy();
        graficoAtual = null;
    }
    
    try {
        switch (tipoAtivo) {
            case 'donut':
                logInfo('🍩', 'Criando gráfico de rosca');
                criarGraficoDonut(ctx);
                break;
            case 'linha':
                logInfo('📈', 'Criando gráfico de linha');
                criarGraficoLinha(ctx);
                break;
            case 'colunas':
                logInfo('📊', 'Criando gráfico de colunas');
                criarGraficoColunas(ctx);
                break;
            default:
                logWarn('⚠️', `Tipo de gráfico desconhecido: ${tipoAtivo}`);
                return;
        }
        
        logInfo('✅', 'Gráfico criado com sucesso');
        
    } catch (error) {
        logError('💥', 'Erro ao criar gráfico:', error);
    }
}

function criarGraficoDonut(ctx) {
    // Converter categoria para camelCase correto
    const chaveCategoria = categoriaAtiva
        .replace(/-./g, (match) => match.charAt(1).toUpperCase());
    
    logInfo('🔍', `Buscando dados para: ${categoriaAtiva} -> ${chaveCategoria}`);
    
    const dados = dadosReais[chaveCategoria];
    
    if (!dados) {
        logWarn('⚠️', `Dados não encontrados para: ${chaveCategoria}`);
        
        // Usar dados de receitas como fallback se não há despesas
        const dadosFallback = dadosReais.receitasCategoria || dadosReais.despesasCategoria;
        if (dadosFallback) {
            logInfo('🔄', 'Usando dados disponíveis como fallback');
            criarGraficoComDados(ctx, dadosFallback);
        } else {
            mostrarMensagemSemDados();
        }
        return;
    }
    
    criarGraficoComDados(ctx, dados);
}

function criarGraficoComDados(ctx, dados) {
    logInfo('🍩', 'Dados do gráfico donut:', {
        categoria: categoriaAtiva,
        labels: dados.labels,
        total: dados.total,
        quantidadeItens: dados.valores ? dados.valores.length : 0
    });
    
    // Verificar se há dados válidos
    if (!dados.labels || !dados.valores || dados.labels.length === 0 || dados.valores.length === 0) {
        logWarn('⚠️', 'Dados vazios ou inválidos para o gráfico');
        mostrarMensagemSemDados();
        return;
    }
    
    // Verificar se há pelo menos um valor maior que zero
    const temValoresPositivos = dados.valores.some(valor => valor > 0);
    if (!temValoresPositivos) {
        logWarn('⚠️', 'Todos os valores são zero ou negativos');
        mostrarMensagemSemDados();
        return;
    }
    
    try {
        graficoAtual = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: dados.labels,
                datasets: [{
                    data: dados.valores,
                    backgroundColor: dados.cores,
                    borderWidth: 0,
                    cutout: '60%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const valor = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const porcentagem = ((valor / total) * 100).toFixed(2);
                                return `${context.label}: R$${valor.toFixed(2)} (${porcentagem}%)`;
                            }
                        }
                    }
                }
            }
        });
        
        logInfo('📊', 'Chart.js criado com sucesso');
        
        atualizarValorTotal(dados.total, categoriaAtiva);
        atualizarListaItens(dados);
        
        logInfo('✅', 'Gráfico donut criado completamente');
        
    } catch (error) {
        logError('💥', 'Erro ao criar gráfico donut:', error);
    }
}

function criarGraficoLinha(ctx) {
    const chaveCategoria = categoriaAtiva.replace(/-/g, '');
    const dados = dadosReais[chaveCategoria];
    
    if (!dados) {
        logWarn('⚠️', 'Dados de linha não encontrados para categoria:', categoriaAtiva);
        // Mostrar mensagem de sem dados se não há dados reais disponíveis
        mostrarMensagemSemDados();
        return;
    }
    
    criarGraficoLinhaComDados(ctx, dados);
}

function criarGraficoLinhaComDados(ctx, dados) {
    logInfo('📈', 'Dados do gráfico de linha:', {
        categoria: categoriaAtiva,
        periodo: dados.periodo,
        pontos: dados.valores.length,
        valorMax: Math.max(...dados.valores)
    });
    
    try {
        graficoAtual = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dados.labels,
                datasets: [{
                    data: dados.valores,
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#06b6d4',
                    pointBorderColor: '#06b6d4',
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return 'R$' + value.toFixed(2).replace('.', ',');
                            }
                        }
                    }
                }
            }
        });
        
        atualizarValorTotal(dados.total, categoriaAtiva);
        atualizarPeriodo(dados.periodo);
        document.getElementById('lista-itens').innerHTML = '';
        
        logInfo('✅', 'Gráfico de linha criado com sucesso');
        
    } catch (error) {
        logError('💥', 'Erro ao criar gráfico de linha:', error);
    }
}

function criarGraficoColunas(ctx) {
    const chaveCategoria = categoriaAtiva.replace(/-/g, '');
    const dados = dadosReais[chaveCategoria];
    
    if (!dados) {
        logWarn('⚠️', 'Dados de colunas não encontrados para categoria:', categoriaAtiva);
        // Mostrar mensagem de sem dados se não há dados reais disponíveis
        mostrarMensagemSemDados();
        return;
    }
    
    criarGraficoColunasComDados(ctx, dados);
}

function criarGraficoColunasComDados(ctx, dados) {
    logInfo('📊', 'Dados do gráfico de colunas:', {
        categoria: categoriaAtiva,
        periodo: dados.periodo,
        colunas: dados.labels.length
    });
    
    let configGrafico = {
        type: 'bar',
        data: {
            labels: dados.labels
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'R$' + Math.abs(value).toFixed(0).replace('.', ',');
                        }
                    }
                }
            }
        }
    };
    
    // Configurar datasets baseado no tipo
    if (categoriaAtiva.includes('balanco') || dados.receitas) {
        configGrafico.data.datasets = [
            {
                label: 'Receitas',
                data: dados.receitas,
                backgroundColor: '#22c55e'
            },
            {
                label: 'Despesas',
                data: dados.despesas,
                backgroundColor: '#ef4444'
            }
        ];
    } else if (categoriaAtiva.includes('fluxo') || dados.saldo) {
        configGrafico.data.datasets = [
            {
                label: '(Receitas - Despesas)',
                data: dados.saldo,
                type: 'line',
                borderColor: '#3b82f6',
                backgroundColor: '#3b82f6',
                pointRadius: 6,
                fill: false
            },
            {
                label: 'Receitas',
                data: dados.receitas,
                backgroundColor: '#22c55e'
            },
            {
                label: 'Despesa',
                data: dados.despesas,
                backgroundColor: '#ef4444'
            }
        ];
    } else {
        configGrafico.data.datasets = [
            {
                label: 'Despesas',
                data: dados.valores || dados.despesas,
                backgroundColor: '#ef4444'
            }
        ];
    }
    
    try {
        graficoAtual = new Chart(ctx, configGrafico);
        
        atualizarPeriodo(dados.periodo);
        document.getElementById('lista-itens').innerHTML = '';
        document.getElementById('valor-total').innerHTML = '';
        
        logInfo('✅', 'Gráfico de colunas criado com sucesso');
        
    } catch (error) {
        logError('💥', 'Erro ao criar gráfico de colunas:', error);
    }
}

function atualizarValorTotal(valor, categoria) {
    const valorElement = document.getElementById('valor-total');
    const cor = categoria.includes('receita') ? '#22c55e' : 
                categoria.includes('saldo') ? '#22c55e' : '#ef4444';
                
    valorElement.innerHTML = `
        <span class="valor" style="color: ${cor}">R$${valor.toFixed(2).replace('.', ',')}</span>
        <span class="total-texto">Total <span class="material-icons-round">expand_more</span></span>
    `;
}

function atualizarListaItens(dados) {
    const container = document.getElementById('lista-itens');
    const total = dados.total;
    
    const itensHtml = dados.labels.map((label, index) => {
        const valor = dados.valores[index];
        const porcentagem = ((valor / total) * 100).toFixed(2);
        const cor = dados.cores[index];
        const icone = obterIconeCategoria(label);
        
        return `
            <div class="item-lista">
                <div class="item-icone" style="background: ${cor};">
                    <span class="material-icons-round">${icone}</span>
                </div>
                <div class="item-info">
                    <div class="item-nome">${label}</div>
                    <div class="item-porcentagem">Porcentagem</div>
                </div>
                <div class="item-valor">
                    <div class="item-valor-principal">R$${valor.toFixed(2).replace('.', ',')}</div>
                    <div class="item-valor-porcentagem">${porcentagem}%</div>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = itensHtml;
}

function obterIconeCategoria(categoria) {
    const icones = {
        'Supermercado': 'shopping_cart',
        'Veículo': 'directions_car',
        'Bebê': 'child_care',
        'Educação': 'school',
        'Saúde': 'local_hospital',
        'Lazer': 'sports_esports',
        'Casa': 'home',
        'Transporte': 'train',
        'Salário': 'payments',
        'Bonificação': 'star',
        'Presente': 'card_giftcard',
        'Nubank': 'credit_card',
        'Open Finance': 'account_balance',
        'VC - Vale Combustível': 'local_gas_station'
    };
    
    return icones[categoria] || 'category';
}

function atualizarPeriodo(periodo) {
    document.getElementById('periodo-texto').textContent = periodo;
}

function navegarPeriodo(direcao) {
    console.log('🗓️ Navegando período:', direcao > 0 ? 'Próximo' : 'Anterior');
    
    // Implementar navegação de período se necessário
    const periodoAtual = document.getElementById('periodo-texto').textContent;
    console.log('📅 Período atual:', periodoAtual);
    
    // Aqui você pode implementar lógica para alterar período e recarregar dados
    if (usuarioAtual) {
        console.log('🔄 Recarregando dados para novo período...');
        // carregarDadosReais(); // Descomente quando implementar filtros de data
    }
}

// === FUNÇÕES UTILITÁRIAS ===
function gerarCores(quantidade) {
    const coresPadrao = [
        '#ef4444', '#22c55e', '#3b82f6', '#f59e0b', 
        '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
        '#f97316', '#6366f1', '#14b8a6', '#f59e0b'
    ];
    
    const cores = [];
    for (let i = 0; i < quantidade; i++) {
        cores.push(coresPadrao[i % coresPadrao.length]);
    }
    
    return cores;
}

// Log de performance
window.addEventListener('load', () => {
    logInfo('⚡', 'Página carregada completamente');
    logInfo('📊', 'Sistema de gráficos pronto para uso');
    logInfo('⏱️', `Tempo de carregamento: ${performance.now().toFixed(2)}ms`);
});

// Log de erros globais
window.addEventListener('error', (event) => {
    logError('💥', 'Erro global na aplicação:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
    });
});

// Log de erros não capturados em promises
window.addEventListener('unhandledrejection', (event) => {
    logError('🚫', 'Promise rejeitada não capturada:', event.reason);
});

// Override console.warn para adicionar emoji
const originalWarn = console.warn;
console.warn = function(...args) {
    originalWarn.apply(console, ['⚠️ [GRÁFICOS]', ...args]);
};

// Log final
logInfo('🎯', 'Script de gráficos carregado completamente');
logInfo('📊', `Estado inicial: Tipo=${tipoAtivo}, Categoria=${categoriaAtiva}`);