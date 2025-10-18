// === FIREBASE E CONFIGURAÃ‡ÃƒO ===
// Usando Firebase v8 para compatibilidade

// ConfiguraÃ§Ã£o do Firebase (mesma da home)
const firebaseConfig = {
    apiKey: "AIzaSyC7RB9fULmkp9xeJIjc0dL58atHJ8CM-Xc",
    authDomain: "poup-beta.firebaseapp.com",
    projectId: "poup-beta",
    storageBucket: "poup-beta.appspot.com",
    messagingSenderId: "954695915981",
    appId: "1:954695915981:web:d31b216f79eac178094c84"
};

// VariÃ¡veis Firebase
let db = null;
let auth = null;
let usuarioAtual = null;

// Console logs apenas em debug
const DEBUG_MODE = window.location.search.includes('debug=true');

if (DEBUG_MODE) {
    console.log('ðŸ“Š Sistema de GrÃ¡ficos Iniciado');
    console.log('ðŸ”— URL:', window.location.href);
}

// === FUNÃ‡Ã•ES DE LOG ===
function logInfo(emoji, mensagem, dados = null) {
    if (DEBUG_MODE) {
        if (dados) {
            console.log(`${emoji} [GRÃFICOS] ${mensagem}`, dados);
        } else {
            console.log(`${emoji} [GRÃFICOS] ${mensagem}`);
        }
    }
}

// FunÃ§Ã£o auxiliar para converter data de forma segura
function converterDataParaObjeto(dataInput) {
    try {
        // Se jÃ¡ Ã© objeto Date, retorna
        if (dataInput instanceof Date) {
            return dataInput;
        }
        
        // Se Ã© string no formato "DD/MM/AAAA"
        if (typeof dataInput === 'string' && dataInput.includes('/')) {
            return new Date(dataInput.split('/').reverse().join('-'));
        }
        
        // Se Ã© objeto com propriedade data
        if (typeof dataInput === 'object' && dataInput.data) {
            return converterDataParaObjeto(dataInput.data);
        }
        
        // Fallback: tentar converter diretamente
        return new Date(dataInput);
    } catch (error) {
        logError('ðŸ“…', 'Erro ao converter data:', { dataInput, error });
        return new Date(); // Retorna data atual como fallback
    }
}

function logError(emoji, mensagem, erro = null) {
    console.error(`${emoji} [GRÃFICOS] ${mensagem}`, erro || '');
}

function logWarn(emoji, mensagem, dados = null) {
    console.warn(`${emoji} [GRÃFICOS] ${mensagem}`, dados || '');
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

// Dados brutos carregados (para reprocessar ao mudar perÃ­odo)
let dadosBrutos = {
    despesas: [],
    receitas: [],
    contas: [],
    transferencias: []
};

// Estado atual dos grÃ¡ficos
let tipoAtivo = 'donut'; // Inicia com grÃ¡fico de rosca (Despesas por categoria)
let categoriaAtiva = 'despesas-categoria'; // Mostra despesas por categoria
let graficoAtual = null;

// PerÃ­odo selecionado
let mesAtual = new Date().getMonth();
let anoAtual = new Date().getFullYear();

// === INICIALIZAÃ‡ÃƒO ===
logInfo('ðŸš€', 'Iniciando sistema de grÃ¡ficos...');

// Aguardar Firebase ser carregado
firebase.initializeApp(firebaseConfig);
db = firebase.firestore();
auth = firebase.auth();

logInfo('âœ…', 'Firebase inicializado com sucesso');
logInfo('ðŸ—„', 'Firestore conectado');
logInfo('ðŸ”', 'Auth conectado');

// Aguardar DOM e autenticaÃ§Ã£o
// Configurar menu adicionar
function configurarMenuAdicionar() {
    const botaoAdicionar = document.getElementById('botao-adicionar-graficos');
    const menu = document.getElementById('menu-adicionar-graficos');

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

document.addEventListener('DOMContentLoaded', function() {
    logInfo('ðŸ ', 'DOM carregado, inicializando aplicaÃ§Ã£o...');
    
    configurarMenuAdicionar();
    
    // Verificar autenticaÃ§Ã£o
    auth.onAuthStateChanged((user) => {
        if (user) {
            usuarioAtual = user;
            logInfo('ðŸ‘¤', `UsuÃ¡rio autenticado: ${user.email}`);
            logInfo('ðŸ†”', `UID: ${user.uid}`);
            
            // Aguardar um breve momento para garantir que o Firestore estÃ¡ pronto
            setTimeout(() => {
                // Inicializar controles
                inicializarControles();
                logInfo('âœ…', 'Controles inicializados');
                
                // Inicializar texto do perÃ­odo
                const periodoTexto = document.getElementById('periodo-texto');
                if (periodoTexto) {
                    const meses = ['JANEIRO', 'FEVEREIRO', 'MARÃ‡O', 'ABRIL', 'MAIO', 'JUNHO', 
                                  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
                    periodoTexto.textContent = `${meses[mesAtual]} ${anoAtual}`;
                }
                
                // Carregar dados e criar grÃ¡fico inicial
                carregarDadosReais();
            }, 100);
        } else {
            logError('âŒ', 'UsuÃ¡rio nÃ£o autenticado, redirecionando...');
            window.location.href = '../index.html';
        }
    });
});

// === CARREGAMENTO DE DADOS ===
async function carregarDadosReais() {
    try {
        logInfo('ðŸ“¡', 'Carregando dados reais do Firebase...');
        
        // Verificar se o usuÃ¡rio estÃ¡ autenticado antes de prosseguir
        if (!usuarioAtual || !usuarioAtual.uid) {
            logError('âŒ', 'UsuÃ¡rio nÃ£o estÃ¡ autenticado');
            return;
        }
        
        // Carregar dados em paralelo mas com tratamento de erro individual
        const promisesCarregamento = [
            carregarDespesas().catch(error => {
                logError('âŒ', 'Falha ao carregar despesas:', error);
                return [];
            }),
            carregarReceitas().catch(error => {
                logError('âŒ', 'Falha ao carregar receitas:', error);
                return [];
            }),
            carregarContas().catch(error => {
                logError('âŒ', 'Falha ao carregar contas:', error);
                return [];
            }),
            carregarTransferencias().catch(error => {
                logError('âŒ', 'Falha ao carregar transferÃªncias:', error);
                return [];
            })
        ];

        const [despesas, receitas, contas, transferencias] = await Promise.all(promisesCarregamento);

        // Salvar dados brutos para reprocessamento
        dadosBrutos = { despesas, receitas, contas, transferencias };
        
        const dadosCarregados = { despesas, receitas, contas, transferencias };
        
        logInfo('ðŸ“Š', 'Dados carregados:', {
            despesas: despesas.length,
            receitas: receitas.length,
            contas: contas.length,
            transferencias: transferencias.length
        });
        
        // Processar dados
        processarDadosParaGraficos(dadosCarregados);
        
        // Inicializar UI com grÃ¡fico de linha selecionado
        inicializarUIInicial();
        
        // Criar grÃ¡fico inicial
        criarGrafico();
        
    } catch (error) {
        logError('âŒ', 'Erro crÃ­tico ao carregar dados:', error);
        
        // Tentar mostrar uma mensagem amigÃ¡vel para o usuÃ¡rio
        mostrarMensagemSemDados();
    }
}

async function carregarDespesas() {
    try {
        logInfo('ðŸ’¸', 'Carregando despesas...');
        
        // Verificar se o usuÃ¡rio estÃ¡ autenticado
        if (!usuarioAtual || !usuarioAtual.uid) {
            throw new Error('UsuÃ¡rio nÃ£o autenticado');
        }
        
        const despesas = [];
        const snapshot = await db.collection('despesas').where('userId', '==', usuarioAtual.uid).get();
        
        snapshot.forEach(doc => {
            despesas.push({ id: doc.id, ...doc.data() });
        });
        
        logInfo('ðŸ’¸', `${despesas.length} despesas carregadas`);
        return despesas;
    } catch (error) {
        logError('âŒ', 'Erro ao carregar despesas:', error);
        // Em caso de erro, retornar array vazio para nÃ£o quebrar o app
        return [];
    }
}

async function carregarReceitas() {
    try {
        logInfo('ðŸ’°', 'Carregando receitas...');
        
        // Verificar se o usuÃ¡rio estÃ¡ autenticado
        if (!usuarioAtual || !usuarioAtual.uid) {
            throw new Error('UsuÃ¡rio nÃ£o autenticado');
        }
        
        const receitas = [];
        const snapshot = await db.collection('receitas').where('userId', '==', usuarioAtual.uid).get();
        
        snapshot.forEach(doc => {
            receitas.push({ id: doc.id, ...doc.data() });
        });
        
        logInfo('ðŸ’°', `${receitas.length} receitas carregadas`);
        return receitas;
    } catch (error) {
        logError('âŒ', 'Erro ao carregar receitas:', error);
        return [];
    }
}

async function carregarContas() {
    try {
        logInfo('ðŸ¦', 'Carregando contas...');
        
        // Verificar se o usuÃ¡rio estÃ¡ autenticado
        if (!usuarioAtual || !usuarioAtual.uid) {
            throw new Error('UsuÃ¡rio nÃ£o autenticado');
        }
        
        const contas = [];
        const snapshot = await db.collection('contas').where('userId', '==', usuarioAtual.uid).get();
        
        snapshot.forEach(doc => {
            contas.push({ id: doc.id, ...doc.data() });
        });
        
        logInfo('ðŸ¦', `${contas.length} contas carregadas`);
        return contas;
    } catch (error) {
        logError('âŒ', 'Erro ao carregar contas:', error);
        return [];
    }
}

async function carregarTransferencias() {
    try {
        logInfo('ðŸ”„', 'Carregando transferÃªncias...');
        
        // Verificar se o usuÃ¡rio estÃ¡ autenticado
        if (!usuarioAtual || !usuarioAtual.uid) {
            throw new Error('UsuÃ¡rio nÃ£o autenticado');
        }
        
        const transferencias = [];
        const snapshot = await db.collection('transferencias').where('userId', '==', usuarioAtual.uid).get();
        
        snapshot.forEach(doc => {
            transferencias.push({ id: doc.id, ...doc.data() });
        });
        
        logInfo('ðŸ”„', `${transferencias.length} transferÃªncias carregadas`);
        return transferencias;
    } catch (error) {
        logError('âŒ', 'Erro ao carregar transferÃªncias:', error);
        return [];
    }
}

// === PROCESSAMENTO DE DADOS ===
function processarDadosParaGraficos(dados) {
    logInfo('ðŸ”„', 'Processando dados para grÃ¡ficos...');
    
    // Criar mapa de contas (ID -> Nome)
    const mapaContas = {};
    (dados.contas || []).forEach(conta => {
        mapaContas[conta.id] = conta.nome || conta.banco || 'Conta sem nome';
    });
    
    // Processar despesas por categoria
    dadosReais.despesasCategoria = processarPorCategoria(dados.despesas || [], 'despesa');
    
    // Processar receitas por categoria
    dadosReais.receitasCategoria = processarPorCategoria(dados.receitas || [], 'receita');
    
    // Processar despesas por conta (com mapeamento de ID para nome)
    dadosReais.despesasConta = processarPorConta(dados.despesas || [], mapaContas);
    
    // Processar receitas por conta (com mapeamento de ID para nome)
    dadosReais.receitasConta = processarPorConta(dados.receitas || [], mapaContas);
    
    // Calcular saldos por conta
    dadosReais.saldosConta = calcularSaldosPorConta(dados.contas || [], dados.receitas || [], dados.despesas || []);
    
    // Processar despesas fixas x variÃ¡veis
    dadosReais.despesasFixasVariaveis = processarFixasVariaveis(dados.despesas || [], 'despesa');
    
    // Processar receitas fixas x variÃ¡veis
    dadosReais.receitasFixasVariaveis = processarFixasVariaveis(dados.receitas || [], 'receita');
    
    logInfo('âœ…', 'Dados processados com sucesso');
}

function processarPorCategoria(transacoes, tipo) {
    const resultado = {};
    
    transacoes.forEach(transacao => {
        // Converter valores usando a mesma lÃ³gica da Home
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
        
        // Log para debug
        if (DEBUG_MODE) {
            logInfo('ðŸ“', `Processando ${tipo}: ${categoria} = R$ ${valor.toFixed(2)}`);
        }
    });
    
    logInfo('ðŸ“Š', `Processadas ${transacoes.length} ${tipo}s em ${Object.keys(resultado).length} categorias`);
    logInfo('ðŸ“Š', `Resultado: ${JSON.stringify(resultado)}`);
    return resultado;
}

function processarPorConta(transacoes, mapaContas) {
    const resultado = {};
    
    transacoes.forEach(transacao => {
        // Converter valores usando a mesma lÃ³gica da Home
        let valor = 0;
        if (typeof transacao.valor === 'string') {
            valor = parseFloat(transacao.valor.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
        } else if (typeof transacao.valor === 'number') {
            valor = transacao.valor;
        }
        
        // Garantir que o valor seja positivo
        valor = Math.abs(valor);
        
        // Usar o campo 'carteira' que Ã© o ID da conta
        const contaId = transacao.carteira || transacao.conta;
        const nomeConta = mapaContas[contaId] || contaId || 'Conta PadrÃ£o';
        
        resultado[nomeConta] = (resultado[nomeConta] || 0) + valor;
        
        // Log para debug
        if (DEBUG_MODE) {
            logInfo('ðŸ’³', `Processando conta: ${contaId} -> ${nomeConta} = R$ ${valor.toFixed(2)}`);
        }
    });
    
    logInfo('ðŸ’³', `Processadas ${transacoes.length} transaÃ§Ãµes em ${Object.keys(resultado).length} contas`);
    logInfo('ðŸ’³', `Resultado: ${JSON.stringify(resultado)}`);
    return resultado;
}

function calcularSaldosPorConta(contas, receitas, despesas) {
    const saldos = {};
    
    // Inicializar com saldo inicial das contas
    contas.forEach(conta => {
        let saldoInicial = 0;
        
        // Tentar obter saldo inicial ou atual
        if (conta.saldoInicial) {
            if (typeof conta.saldoInicial === 'string') {
                saldoInicial = parseFloat(conta.saldoInicial.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
            } else if (typeof conta.saldoInicial === 'number') {
                saldoInicial = conta.saldoInicial;
            }
        } else if (conta.saldoAtual) {
            if (typeof conta.saldoAtual === 'string') {
                saldoInicial = parseFloat(conta.saldoAtual.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
            } else if (typeof conta.saldoAtual === 'number') {
                saldoInicial = conta.saldoAtual;
            }
        }
        
        const nomeConta = conta.nome || conta.banco || 'Conta Sem Nome';
        saldos[nomeConta] = saldoInicial;
    });
    
    // Somar receitas por conta
    receitas.forEach(receita => {
        if (receita.recebido || receita.pago || receita.concluida) {
            let valor = 0;
            if (typeof receita.valor === 'string') {
                valor = parseFloat(receita.valor.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
            } else if (typeof receita.valor === 'number') {
                valor = receita.valor;
            }
            
            // Buscar nome da conta pelo ID
            const contaId = receita.carteira || receita.conta;
            const conta = contas.find(c => c.id === contaId);
            const nomeConta = conta ? (conta.nome || conta.banco) : contaId;
            
            if (nomeConta) {
                saldos[nomeConta] = (saldos[nomeConta] || 0) + Math.abs(valor);
            }
        }
    });
    
    // Subtrair despesas por conta
    despesas.forEach(despesa => {
        if (despesa.pago || despesa.concluida || despesa.recebido) {
            let valor = 0;
            if (typeof despesa.valor === 'string') {
                valor = parseFloat(despesa.valor.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
            } else if (typeof despesa.valor === 'number') {
                valor = despesa.valor;
            }
            
            // Buscar nome da conta pelo ID
            const contaId = despesa.carteira || despesa.conta;
            const conta = contas.find(c => c.id === contaId);
            const nomeConta = conta ? (conta.nome || conta.banco) : contaId;
            
            if (nomeConta) {
                saldos[nomeConta] = (saldos[nomeConta] || 0) - Math.abs(valor);
            }
        }
    });
    
    // Filtrar apenas contas com saldo (remover zeros)
    const saldosFiltrados = {};
    Object.keys(saldos).forEach(nomeConta => {
        if (saldos[nomeConta] !== 0) {
            // Manter valores absolutos para o grÃ¡fico
            saldosFiltrados[nomeConta] = Math.abs(saldos[nomeConta]);
        }
    });
    
    logInfo('ðŸ¦', `Calculados saldos para ${Object.keys(saldosFiltrados).length} contas`);
    logInfo('ðŸ¦', `Saldos: ${JSON.stringify(saldosFiltrados)}`);
    return saldosFiltrados;
}

function processarFixasVariaveis(transacoes, tipo) {
    const resultado = {
        'Fixas': 0,
        'VariÃ¡veis': 0
    };
    
    transacoes.forEach(transacao => {
        // Converter valores usando a mesma lÃ³gica da Home
        let valor = 0;
        if (typeof transacao.valor === 'string') {
            valor = parseFloat(transacao.valor.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
        } else if (typeof transacao.valor === 'number') {
            valor = transacao.valor;
        }
        
        // Garantir que o valor seja positivo
        valor = Math.abs(valor);
        
        // Verificar se Ã© recorrente/fixa (campos diferentes para receitas e despesas)
        const ehFixa = transacao.recorrente === true || 
                       transacao.fixa === true || 
                       transacao.despesaFixa === true ||
                       transacao.receitaFixa === true ||
                       transacao.repetir === true;
        
        if (ehFixa) {
            resultado['Fixas'] += valor;
        } else {
            resultado['VariÃ¡veis'] += valor;
        }
    });
    
    logInfo('ðŸ“Š', `Processadas ${transacoes.length} ${tipo}s: ${resultado['Fixas'].toFixed(2)} fixas, ${resultado['VariÃ¡veis'].toFixed(2)} variÃ¡veis`);
    
    // Filtrar categorias com valor zero
    const resultadoFiltrado = {};
    Object.keys(resultado).forEach(key => {
        if (resultado[key] > 0) {
            resultadoFiltrado[key] = resultado[key];
        }
    });
    
    return resultadoFiltrado;
}

// === OBTENÃ‡ÃƒO DE DADOS PARA GRÃFICO ===
function obterDadosParaGrafico(categoria) {
    const chaveCategoria = mapearCategoria(categoria);
    
    // Primeiro, verificar se temos dados para a categoria especÃ­fica
    if (dadosReais[chaveCategoria] && Object.keys(dadosReais[chaveCategoria]).length > 0) {
        return dadosReais[chaveCategoria];
    }
    
    // Se nÃ£o temos dados para categoria especÃ­fica, usar dados apropriados baseado no tipo
    // CORREÃ‡ÃƒO: Para despesas, mostrar apenas dados de despesas
    if (categoria.includes('despesas')) {
        // Priorizar categorias de despesas
        if (dadosReais.despesasCategoria && Object.keys(dadosReais.despesasCategoria).length > 0) {
            return dadosReais.despesasCategoria;
        }
        if (dadosReais.despesasConta && Object.keys(dadosReais.despesasConta).length > 0) {
            return dadosReais.despesasConta;
        }
    }
    
    // CORREÃ‡ÃƒO: Para receitas, mostrar apenas dados de receitas  
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
    
    logWarn('âš ï¸', `Sem dados especÃ­ficos para: ${categoria}`);
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

// === INICIALIZAÃ‡ÃƒO DA UI ===
function inicializarUIInicial() {
    // Ativar botÃ£o de rosca/donut
    document.querySelectorAll('.tipo-grafico').forEach(btn => {
        if (btn.dataset.tipo === 'donut' || btn.dataset.tipo === 'rosca') {
            btn.classList.add('ativo');
        } else {
            btn.classList.remove('ativo');
        }
    });
    
    // Ativar filtro de despesas por categoria
    document.querySelectorAll('.filtro-categoria').forEach(btn => {
        if (btn.dataset.categoria === 'despesas-categoria') {
            btn.classList.add('ativo');
        } else {
            btn.classList.remove('ativo');
        }
    });
    
    // Mostrar filtros de donut/rosca, ocultar os outros
    document.getElementById('filtros-donut').style.display = 'flex';
    document.getElementById('filtros-linha').style.display = 'none';
    document.getElementById('filtros-colunas').style.display = 'none';
    
    logInfo('âœ…', 'UI inicializada com grÃ¡fico de rosca (Despesas por categoria)');
}

// === CONTROLES ===
function inicializarControles() {
    // BotÃµes de tipo
    document.querySelectorAll('.tipo-grafico').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const novoTipo = e.currentTarget.dataset.tipo;
            
            // Se mudou o tipo de grÃ¡fico, ajustar categoria padrÃ£o
            if (novoTipo !== tipoAtivo) {
                if (novoTipo === 'linha') {
                    // Ao clicar em linha, mostrar Despesas da semana
                    categoriaAtiva = 'despesas-semana';
                } else if (novoTipo === 'colunas') {
                    // Ao clicar em barras, mostrar BalanÃ§o mensal
                    categoriaAtiva = 'balanco-mensal';
                } else if (novoTipo === 'donut' || novoTipo === 'rosca') {
                    // Ao clicar em rosca, mostrar Despesas por categoria
                    categoriaAtiva = 'despesas-categoria';
                }
                
                // Atualizar botÃµes de categoria ativos
                document.querySelectorAll('.filtro-categoria').forEach(b => b.classList.remove('ativo'));
                const btnCategoriaCorrespondente = document.querySelector(`.filtro-categoria[data-categoria="${categoriaAtiva}"]`);
                if (btnCategoriaCorrespondente) {
                    btnCategoriaCorrespondente.classList.add('ativo');
                }
            }
            
            tipoAtivo = novoTipo;
            
            // Atualizar UI
            document.querySelectorAll('.tipo-grafico').forEach(b => b.classList.remove('ativo'));
            e.currentTarget.classList.add('ativo');
            
            // Mostrar/ocultar filtros apropriados
            document.getElementById('filtros-donut').style.display = tipoAtivo === 'donut' ? 'flex' : 'none';
            document.getElementById('filtros-linha').style.display = tipoAtivo === 'linha' ? 'flex' : 'none';
            document.getElementById('filtros-colunas').style.display = tipoAtivo === 'colunas' ? 'flex' : 'none';
            
            // Recriar grÃ¡fico
            criarGrafico();
        });
    });
    
    // BotÃµes de categoria
    document.querySelectorAll('.filtro-categoria').forEach(btn => {
        btn.addEventListener('click', (e) => {
            categoriaAtiva = e.currentTarget.dataset.categoria;
            
            // Atualizar UI
            document.querySelectorAll('.filtro-categoria').forEach(b => b.classList.remove('ativo'));
            e.currentTarget.classList.add('ativo');
            
            // Atualizar o texto do perÃ­odo baseado na categoria
            const periodoTexto = document.getElementById('periodo-texto');
            if (periodoTexto && tipoAtivo === 'linha') {
                if (categoriaAtiva === 'despesas-semana') {
                    const hoje = new Date(anoAtual, mesAtual, new Date().getDate());
                    const dadosSemana = gerarDadosSemana(hoje);
                    periodoTexto.textContent = dadosSemana.periodo;
                } else if (categoriaAtiva === 'despesas-mes') {
                    const meses = ['JANEIRO', 'FEVEREIRO', 'MARÃ‡O', 'ABRIL', 'MAIO', 'JUNHO', 
                                  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
                    periodoTexto.textContent = meses[mesAtual];
                } else if (categoriaAtiva === 'despesas-ano') {
                    periodoTexto.textContent = anoAtual.toString();
                }
            } else if (periodoTexto && tipoAtivo === 'donut') {
                const meses = ['JANEIRO', 'FEVEREIRO', 'MARÃ‡O', 'ABRIL', 'MAIO', 'JUNHO', 
                              'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
                periodoTexto.textContent = `${meses[mesAtual]} ${anoAtual}`;
            }
            
            // Recriar grÃ¡fico
            criarGrafico();
        });
    });
    
    // BotÃµes de perÃ­odo (anterior/prÃ³ximo)
    const btnAnterior = document.querySelector('.botao-periodo.anterior');
    const btnProximo = document.querySelector('.botao-periodo.proximo');
    const periodoTexto = document.getElementById('periodo-texto');
    
    if (btnAnterior && btnProximo && periodoTexto) {
        // FunÃ§Ã£o para atualizar o texto do perÃ­odo
        function atualizarPeriodo() {
            const meses = ['JANEIRO', 'FEVEREIRO', 'MARÃ‡O', 'ABRIL', 'MAIO', 'JUNHO', 
                          'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
            
            // Para grÃ¡ficos de linha, atualizar perÃ­odo baseado na categoria
            if (tipoAtivo === 'linha') {
                if (categoriaAtiva === 'despesas-semana') {
                    const hoje = new Date(anoAtual, mesAtual, new Date().getDate());
                    const dadosSemana = gerarDadosSemana(hoje);
                    periodoTexto.textContent = dadosSemana.periodo;
                } else if (categoriaAtiva === 'despesas-mes') {
                    periodoTexto.textContent = meses[mesAtual];
                } else if (categoriaAtiva === 'despesas-ano') {
                    periodoTexto.textContent = anoAtual.toString();
                }
            } else {
                // Para grÃ¡ficos de rosca e barras
                periodoTexto.textContent = `${meses[mesAtual]} ${anoAtual}`;
            }
            
            // Reprocessar dados com o novo perÃ­odo
            if (dadosBrutos.despesas.length > 0 || dadosBrutos.receitas.length > 0) {
                if (tipoAtivo !== 'linha') {
                    filtrarDadosPorPeriodo();
                }
                criarGrafico();
            }
        }
        
        btnAnterior.addEventListener('click', () => {
            if (tipoAtivo === 'linha' && categoriaAtiva === 'despesas-ano') {
                // Para despesas por ano, mudar o ano
                anoAtual--;
            } else {
                // Para outros, mudar o mÃªs
                mesAtual--;
                if (mesAtual < 0) {
                    mesAtual = 11;
                    anoAtual--;
                }
            }
            atualizarPeriodo();
        });
        
        btnProximo.addEventListener('click', () => {
            if (tipoAtivo === 'linha' && categoriaAtiva === 'despesas-ano') {
                // Para despesas por ano, mudar o ano
                anoAtual++;
            } else {
                // Para outros, mudar o mÃªs
                mesAtual++;
                if (mesAtual > 11) {
                    mesAtual = 0;
                    anoAtual++;
                }
            }
            atualizarPeriodo();
        });
        
        // Inicializar com o mÃªs atual
        atualizarPeriodo();
    }
}

// === FILTRAR DADOS POR PERÃODO ===
function filtrarDadosPorPeriodo() {
    logInfo('ðŸ“…', `Filtrando dados para ${mesAtual + 1}/${anoAtual}`);
    
    // FunÃ§Ã£o auxiliar para verificar se uma data estÃ¡ no perÃ­odo selecionado
    function estaNoPeriodo(data) {
        if (!data) return false;
        
        let dataObj;
        if (data.toDate) {
            // Timestamp do Firestore
            dataObj = data.toDate();
        } else if (data instanceof Date) {
            dataObj = data;
        } else if (typeof data === 'string') {
            dataObj = new Date(data);
        } else if (typeof data === 'number') {
            dataObj = new Date(data);
        } else {
            return false;
        }
        
        return dataObj.getMonth() === mesAtual && dataObj.getFullYear() === anoAtual;
    }
    
    // Filtrar despesas
    const despesasFiltradas = dadosBrutos.despesas.filter(d => estaNoPeriodo(d.data));
    
    // Filtrar receitas
    const receitasFiltradas = dadosBrutos.receitas.filter(r => estaNoPeriodo(r.data));
    
    logInfo('ðŸ“…', `Filtrados: ${despesasFiltradas.length} despesas, ${receitasFiltradas.length} receitas`);
    
    // Reprocessar dados com os dados filtrados
    processarDadosParaGraficos({
        despesas: despesasFiltradas,
        receitas: receitasFiltradas,
        contas: dadosBrutos.contas,
        transferencias: dadosBrutos.transferencias
    });
}

// === CRIAÃ‡ÃƒO DE GRÃFICOS ===
function criarGrafico() {
    const canvas = document.getElementById('grafico-principal');
    if (!canvas) {
        logError('âŒ', 'Canvas nÃ£o encontrado');
        return;
    }
    
    const ctx = canvas.getContext('2d');
    logInfo('ðŸ–¼ï¸', 'Contexto do canvas obtido');
    
    // Destruir grÃ¡fico anterior
    if (graficoAtual) {
        graficoAtual.destroy();
        graficoAtual = null;
    }
    
    // Obter dados corretos para a categoria atual
    const dados = obterDadosParaGrafico(categoriaAtiva);
    
    // Para grÃ¡ficos de linha e barras, nÃ£o verificamos dados aqui (eles geram prÃ³prios dados)
    if (tipoAtivo === 'donut' && (!dados || Object.keys(dados).length === 0)) {
        mostrarMensagemSemDados();
        return;
    }
    
    // Criar grÃ¡fico baseado no tipo
    if (tipoAtivo === 'donut') {
        criarGraficoDonut(ctx, dados);
        atualizarListaItens(dados);
    } else if (tipoAtivo === 'linha') {
        criarGraficoLinha(ctx, null); // GrÃ¡fico de linha gera prÃ³prios dados
        atualizarListaItensLinha(); // Atualizar lista para grÃ¡ficos de linha
    } else if (tipoAtivo === 'colunas') {
        criarGraficoBarras(ctx, dados);
        atualizarListaItensBarras(); // Atualizar lista para grÃ¡ficos de barras
    }
    
    logInfo('âœ…', 'GrÃ¡fico criado com sucesso');
}

function criarGraficoDonut(ctx, dados) {
    logInfo('ðŸ©', 'Criando grÃ¡fico de rosca');
    
    // Remover mensagem de "sem dados" se existir
    const canvas = document.getElementById('grafico-principal');
    const mensagemAnterior = canvas?.parentElement?.querySelector('.mensagem-sem-dados');
    if (mensagemAnterior) {
        mensagemAnterior.remove();
    }
    
    const labels = Object.keys(dados);
    const valores = Object.values(dados);
    
    // Verificar se hÃ¡ dados vÃ¡lidos
    if (labels.length === 0 || valores.every(v => v === 0)) {
        mostrarMensagemSemDados();
        return;
    }
    
    // Gerar cores baseadas no tipo de categoria
    const cores = gerarCoresParaCategoria(labels.length, categoriaAtiva);
    
    // Calcular total
    const total = valores.reduce((a, b) => a + b, 0);
    
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
                                const porcentagemNum = ((valor / total) * 100);
                                const porcentagem = porcentagemNum % 1 === 0 ? porcentagemNum.toFixed(0) : porcentagemNum.toFixed(1);
                                return `${context.label}: R$ ${valor.toFixed(2)} (${porcentagem}%)`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
        
        logInfo('ðŸ“Š', 'Chart.js criado com sucesso');
        logInfo('âœ…', 'GrÃ¡fico donut criado completamente');
        
    } catch (error) {
        logError('âŒ', 'Erro ao criar grÃ¡fico donut:', error);
    }
}

function criarGraficoLinha(ctx, dados) {
    logInfo('ðŸ“ˆ', 'Criando grÃ¡fico de linha');
    
    // Remover mensagem de "sem dados" se existir
    const canvas = document.getElementById('grafico-principal');
    const mensagemAnterior = canvas?.parentElement?.querySelector('.mensagem-sem-dados');
    if (mensagemAnterior) {
        mensagemAnterior.remove();
    }
    
    // Determinar o tipo de perÃ­odo e gerar dados apropriados
    let labels = [];
    let valores = [];
    let periodoTexto = '';
    
    if (categoriaAtiva === 'despesas-semana') {
        // Gerar dados para a semana (Ãºltimos 7 dias)
        const hoje = new Date(anoAtual, mesAtual, new Date().getDate());
        const dadosSemana = gerarDadosSemana(hoje);
        labels = dadosSemana.labels;
        valores = dadosSemana.valores;
        periodoTexto = dadosSemana.periodo;
    } else if (categoriaAtiva === 'despesas-mes') {
        // Gerar dados para o mÃªs inteiro
        const dadosMes = gerarDadosMes(mesAtual, anoAtual);
        labels = dadosMes.labels;
        valores = dadosMes.valores;
        periodoTexto = dadosMes.periodo;
    } else if (categoriaAtiva === 'despesas-ano') {
        // Gerar dados para o ano inteiro (por mÃªs)
        const dadosAno = gerarDadosAno(anoAtual);
        labels = dadosAno.labels;
        valores = dadosAno.valores;
        periodoTexto = dadosAno.periodo;
    }
    
    // Atualizar texto do perÃ­odo
    const periodoElement = document.getElementById('periodo-texto');
    if (periodoElement && periodoTexto) {
        periodoElement.textContent = periodoTexto;
    }
    
    // Verificar se hÃ¡ dados
    if (valores.length === 0 || valores.every(v => v === 0)) {
        mostrarMensagemSemDados();
        return;
    }
    
    // Calcular total
    const total = valores.reduce((a, b) => a + b, 0);
    
    try {
        graficoAtual = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: '',
                    data: valores,
                    borderColor: '#06b6d4',
                    backgroundColor: 'rgba(6, 182, 212, 0.3)',
                    tension: 0.4,
                    fill: true,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        displayColors: false,
                        callbacks: {
                            title: function(context) {
                                return context[0].label;
                            },
                            label: function(context) {
                                return `R$ ${context.parsed.y.toFixed(2).replace('.', ',')}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#f1f5f9',
                            drawBorder: false
                        },
                        ticks: {
                            callback: function(value) {
                                return 'R$' + value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                            },
                            font: {
                                size: 12
                            },
                            color: '#64748b'
                        }
                    },
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            font: {
                                size: 11
                            },
                            color: '#64748b',
                            maxRotation: 0
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
        
        logInfo('âœ…', 'GrÃ¡fico de linha criado com sucesso');
        
    } catch (error) {
        logError('âŒ', 'Erro ao criar grÃ¡fico de linha:', error);
    }
}

// === FUNÃ‡Ã•ES AUXILIARES PARA GRÃFICOS DE LINHA ===
function gerarDadosSemana(dataFinal) {
    const labels = [];
    const valores = [];
    const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    
    // Gerar Ãºltimos 7 dias
    const dias = [];
    for (let i = 6; i >= 0; i--) {
        const data = new Date(dataFinal);
        data.setDate(data.getDate() - i);
        dias.push(data);
    }
    
    // Criar labels (ex: "23 SET.")
    dias.forEach(data => {
        const dia = data.getDate();
        const mes = meses[data.getMonth()];
        labels.push(`${dia} ${mes}.`);
    });
    
    // Calcular valores para cada dia
    dias.forEach(data => {
        const despesasDoDia = dadosBrutos.despesas.filter(d => {
            if (!d.data) return false;
            
            let dataObj;
            if (d.data.toDate) {
                dataObj = d.data.toDate();
            } else if (d.data instanceof Date) {
                dataObj = d.data;
            } else {
                dataObj = new Date(d.data);
            }
            
            return dataObj.getDate() === data.getDate() &&
                   dataObj.getMonth() === data.getMonth() &&
                   dataObj.getFullYear() === data.getFullYear();
        });
        
        const total = despesasDoDia.reduce((acc, d) => {
            let valor = 0;
            if (typeof d.valor === 'string') {
                valor = parseFloat(d.valor.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
            } else if (typeof d.valor === 'number') {
                valor = d.valor;
            }
            return acc + Math.abs(valor);
        }, 0);
        
        valores.push(total);
    });
    
    // PerÃ­odo (ex: "23 SET. - 29 SET.")
    const primeiraData = dias[0];
    const ultimaData = dias[dias.length - 1];
    const periodo = `${primeiraData.getDate()} ${meses[primeiraData.getMonth()]}. - ${ultimaData.getDate()} ${meses[ultimaData.getMonth()]}.`;
    
    return { labels, valores, periodo };
}

function gerarDadosMes(mes, ano) {
    const labels = [];
    const valores = [];
    const meses = ['JANEIRO', 'FEVEREIRO', 'MARÃ‡O', 'ABRIL', 'MAIO', 'JUNHO', 
                   'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
    const mesesAbrev = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    
    // NÃºmero de dias no mÃªs
    const diasNoMes = new Date(ano, mes + 1, 0).getDate();
    
    // Criar labels (ex: "01 SET.", "06 SET.", "11 SET.", etc.)
    // Mostrar apenas alguns dias para nÃ£o ficar muito poluÃ­do
    const intervalo = Math.ceil(diasNoMes / 6); // Aproximadamente 6 labels
    for (let dia = 1; dia <= diasNoMes; dia += intervalo) {
        labels.push(`${dia.toString().padStart(2, '0')} ${mesesAbrev[mes]}.`);
    }
    
    // Calcular valores para cada dia (agrupados no intervalo)
    for (let i = 0; i < labels.length; i++) {
        const diaInicio = 1 + (i * intervalo);
        const diaFim = Math.min(diaInicio + intervalo - 1, diasNoMes);
        
        let totalIntervalo = 0;
        for (let dia = diaInicio; dia <= diaFim; dia++) {
            const despesasDoDia = dadosBrutos.despesas.filter(d => {
                if (!d.data) return false;
                
                let dataObj;
                if (d.data.toDate) {
                    dataObj = d.data.toDate();
                } else if (d.data instanceof Date) {
                    dataObj = d.data;
                } else {
                    dataObj = new Date(d.data);
                }
                
                return dataObj.getDate() === dia &&
                       dataObj.getMonth() === mes &&
                       dataObj.getFullYear() === ano;
            });
            
            const totalDia = despesasDoDia.reduce((acc, d) => {
                let valor = 0;
                if (typeof d.valor === 'string') {
                    valor = parseFloat(d.valor.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
                } else if (typeof d.valor === 'number') {
                    valor = d.valor;
                }
                return acc + Math.abs(valor);
            }, 0);
            
            totalIntervalo += totalDia;
        }
        
        valores.push(totalIntervalo);
    }
    
    return { labels, valores, periodo: meses[mes] };
}

function gerarDadosAno(ano) {
    const labels = ['JAN.', 'FEV.', 'MAR.', 'ABR.', 'MAI.', 'JUN.', 
                    'JUL.', 'AGO.', 'SET.', 'OUT.', 'NOV.', 'DEZ.'];
    const valores = [];
    
    // Calcular total para cada mÃªs
    for (let mes = 0; mes < 12; mes++) {
        const despesasDoMes = dadosBrutos.despesas.filter(d => {
            if (!d.data) return false;
            
            let dataObj;
            if (d.data.toDate) {
                dataObj = d.data.toDate();
            } else if (d.data instanceof Date) {
                dataObj = d.data;
            } else {
                dataObj = new Date(d.data);
            }
            
            return dataObj.getMonth() === mes && dataObj.getFullYear() === ano;
        });
        
        const total = despesasDoMes.reduce((acc, d) => {
            let valor = 0;
            if (typeof d.valor === 'string') {
                valor = parseFloat(d.valor.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
            } else if (typeof d.valor === 'number') {
                valor = d.valor;
            }
            return acc + Math.abs(valor);
        }, 0);
        
        valores.push(total);
    }
    
    return { labels, valores, periodo: ano.toString() };
}

function criarGraficoBarras(ctx, dados) {
    logInfo('ðŸ“Š', 'Criando grÃ¡fico de barras');
    
    // Remover mensagem de "sem dados" se existir
    const canvas = document.getElementById('grafico-principal');
    const mensagemAnterior = canvas?.parentElement?.querySelector('.mensagem-sem-dados');
    if (mensagemAnterior) {
        mensagemAnterior.remove();
    }
    
    // Verificar tipo de grÃ¡fico de barras e criar apropriadamente
    if (categoriaAtiva === 'balanco-mensal') {
        criarGraficoBalancoMensal(ctx);
    } else if (categoriaAtiva === 'fluxo-caixa-anual') {
        criarGraficoFluxoCaixaAnual(ctx);
    } else if (categoriaAtiva === 'despesas-dia-semana') {
        criarGraficoDespesasDiaSemana(ctx);
    }
}

// BalanÃ§o Mensal: Receitas e Despesas lado a lado (Ãºltimos 3 meses)
function criarGraficoBalancoMensal(ctx) {
    logInfo('ðŸ’°', 'Criando grÃ¡fico de balanÃ§o mensal');
    
    // Gerar Ãºltimos 3 meses
    const meses = [];
    const receitasPorMes = [];
    const despesasPorMes = [];
    
    for (let i = 2; i >= 0; i--) {
        const data = new Date(anoAtual, mesAtual - i, 1);
        const mes = data.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).toUpperCase();
        meses.push(mes.replace('.', ''));
        
        // Filtrar receitas do mÃªs
        const receitasMes = dadosBrutos.receitas.filter(r => {
            const dataReceita = converterDataParaObjeto(r.data);
            return dataReceita.getMonth() === data.getMonth() && dataReceita.getFullYear() === data.getFullYear();
        });
        
        // Filtrar despesas do mÃªs
        const despesasMes = dadosBrutos.despesas.filter(d => {
            const dataDespesa = converterDataParaObjeto(d.data);
            return dataDespesa.getMonth() === data.getMonth() && dataDespesa.getFullYear() === data.getFullYear();
        });
        
        // Calcular totais
        const totalReceitas = receitasMes.reduce((acc, r) => {
            let valor = 0;
            if (typeof r.valor === 'string') {
                valor = parseFloat(r.valor.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
            } else if (typeof r.valor === 'number') {
                valor = r.valor;
            }
            return acc + Math.abs(valor);
        }, 0);
        
        const totalDespesas = despesasMes.reduce((acc, d) => {
            let valor = 0;
            if (typeof d.valor === 'string') {
                valor = parseFloat(d.valor.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
            } else if (typeof d.valor === 'number') {
                valor = d.valor;
            }
            return acc + Math.abs(valor);
        }, 0);
        
        receitasPorMes.push(totalReceitas);
        despesasPorMes.push(totalDespesas);
    }
    
    // Atualizar perÃ­odo
    const periodoElement = document.getElementById('periodo-texto');
    if (periodoElement) {
        periodoElement.textContent = `${meses[0]} - ${meses[2]}`;
    }
    
    // Verificar se hÃ¡ dados
    if (receitasPorMes.every(v => v === 0) && despesasPorMes.every(v => v === 0)) {
        mostrarMensagemSemDados();
        return;
    }
    
    try {
        graficoAtual = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: meses,
                datasets: [
                    {
                        label: 'Receitas',
                        data: receitasPorMes,
                        backgroundColor: '#10b981',
                        borderColor: '#059669',
                        borderWidth: 1,
                        borderRadius: 8
                    },
                    {
                        label: 'Despesas',
                        data: despesasPorMes,
                        backgroundColor: '#ef4444',
                        borderColor: '#dc2626',
                        borderWidth: 1,
                        borderRadius: 8
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            pointStyle: 'circle',
                            padding: 15,
                            font: {
                                size: 13,
                                family: 'Inter'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14 },
                        bodyFont: { size: 13 },
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: R$ ${context.parsed.y.toFixed(2).replace('.', ',')}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#f1f5f9'
                        },
                        ticks: {
                            callback: function(value) {
                                return 'R$' + value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                            }
                        }
                    }
                }
            }
        });
        
        logInfo('âœ…', 'GrÃ¡fico de balanÃ§o mensal criado');
    } catch (error) {
        logError('âŒ', 'Erro ao criar grÃ¡fico de balanÃ§o mensal:', error);
    }
}

// Fluxo de Caixa Anual: Barras empilhadas + linha de saldo
function criarGraficoFluxoCaixaAnual(ctx) {
    logInfo('ðŸ“Š', 'Criando grÃ¡fico de fluxo de caixa anual');
    
    const meses = ['JAN.', 'FEV.', 'MAR.', 'ABR.', 'MAI.', 'JUN.', 'JUL.', 'AGO.', 'SET.', 'OUT.', 'NOV.', 'DEZ.'];
    const receitasPorMes = [];
    const despesasPorMes = [];
    const saldoPorMes = [];
    
    // Processar cada mÃªs do ano
    for (let mes = 0; mes < 12; mes++) {
        // Filtrar receitas
        const receitasMes = dadosBrutos.receitas.filter(r => {
            const dataReceita = converterDataParaObjeto(r.data);
            return dataReceita.getMonth() === mes && dataReceita.getFullYear() === anoAtual;
        });
        
        // Filtrar despesas
        const despesasMes = dadosBrutos.despesas.filter(d => {
            const dataDespesa = converterDataParaObjeto(d.data);
            return dataDespesa.getMonth() === mes && dataDespesa.getFullYear() === anoAtual;
        });
        
        // Calcular totais
        const totalReceitas = receitasMes.reduce((acc, r) => {
            let valor = 0;
            if (typeof r.valor === 'string') {
                valor = parseFloat(r.valor.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
            } else if (typeof r.valor === 'number') {
                valor = r.valor;
            }
            return acc + Math.abs(valor);
        }, 0);
        
        const totalDespesas = despesasMes.reduce((acc, d) => {
            let valor = 0;
            if (typeof d.valor === 'string') {
                valor = parseFloat(d.valor.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
            } else if (typeof d.valor === 'number') {
                valor = d.valor;
            }
            return acc + Math.abs(valor);
        }, 0);
        
        receitasPorMes.push(totalReceitas);
        despesasPorMes.push(-totalDespesas); // Negativo para empilhar abaixo
        saldoPorMes.push(totalReceitas - totalDespesas);
    }
    
    // Atualizar perÃ­odo
    const periodoElement = document.getElementById('periodo-texto');
    if (periodoElement) {
        periodoElement.textContent = anoAtual.toString();
    }
    
    // Verificar se hÃ¡ dados
    if (receitasPorMes.every(v => v === 0) && despesasPorMes.every(v => v === 0)) {
        mostrarMensagemSemDados();
        return;
    }
    
    try {
        graficoAtual = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: meses,
                datasets: [
                    {
                        type: 'line',
                        label: '(Receitas - Despesas)',
                        data: saldoPorMes,
                        borderColor: '#3b82f6',
                        backgroundColor: '#3b82f6',
                        borderWidth: 3,
                        pointRadius: 5,
                        pointBackgroundColor: '#3b82f6',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        tension: 0.4,
                        order: 0
                    },
                    {
                        label: 'Receitas',
                        data: receitasPorMes,
                        backgroundColor: '#10b981',
                        borderColor: '#059669',
                        borderWidth: 1,
                        borderRadius: 6,
                        order: 1
                    },
                    {
                        label: 'Despesa',
                        data: despesasPorMes,
                        backgroundColor: '#ef4444',
                        borderColor: '#dc2626',
                        borderWidth: 1,
                        borderRadius: 6,
                        order: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 12,
                            font: {
                                size: 12,
                                family: 'Inter'
                            },
                            generateLabels: function(chart) {
                                const labels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                                // Personalizar Ã­cones
                                labels[0].pointStyle = 'circle'; // Linha
                                labels[1].pointStyle = 'circle'; // Receitas
                                labels[2].pointStyle = 'circle'; // Despesas
                                return labels;
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                const value = Math.abs(context.parsed.y);
                                return `${context.dataset.label}: R$ ${value.toFixed(2).replace('.', ',')}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: false,
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        stacked: false,
                        grid: {
                            color: '#f1f5f9'
                        },
                        ticks: {
                            callback: function(value) {
                                return 'R$' + value.toLocaleString('pt-BR', { minimumFractionDigits: 0 });
                            }
                        }
                    }
                }
            }
        });
        
        logInfo('âœ…', 'GrÃ¡fico de fluxo de caixa anual criado');
    } catch (error) {
        logError('âŒ', 'Erro ao criar grÃ¡fico de fluxo de caixa:', error);
    }
}

// Despesas por Dia da Semana
function criarGraficoDespesasDiaSemana(ctx) {
    logInfo('ðŸ“…', 'Criando grÃ¡fico de despesas por dia da semana');
    
    const diasSemana = ['DOM.', 'SEG.', 'TER.', 'QUA.', 'QUI.', 'SEX.', 'SÃB.'];
    const despesasPorDia = [0, 0, 0, 0, 0, 0, 0];
    
    // Filtrar despesas do mÃªs atual
    dadosBrutos.despesas.forEach(d => {
        const dataDespesa = converterDataParaObjeto(d.data);
        if (dataDespesa.getMonth() === mesAtual && dataDespesa.getFullYear() === anoAtual) {
            const diaSemana = dataDespesa.getDay();
            let valor = 0;
            if (typeof d.valor === 'string') {
                valor = parseFloat(d.valor.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
            } else if (typeof d.valor === 'number') {
                valor = d.valor;
            }
            despesasPorDia[diaSemana] += Math.abs(valor);
        }
    });
    
    // Atualizar perÃ­odo
    const periodoElement = document.getElementById('periodo-texto');
    if (periodoElement) {
        const mesNome = new Date(anoAtual, mesAtual).toLocaleDateString('pt-BR', { month: 'long' }).toUpperCase();
        periodoElement.textContent = mesNome;
    }
    
    // Verificar se hÃ¡ dados
    if (despesasPorDia.every(v => v === 0)) {
        mostrarMensagemSemDados();
        return;
    }
    
    try {
        graficoAtual = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: diasSemana,
                datasets: [{
                    label: 'Despesas',
                    data: despesasPorDia,
                    backgroundColor: '#ef4444',
                    borderColor: '#dc2626',
                    borderWidth: 1,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            pointStyle: 'circle',
                            padding: 15,
                            font: {
                                size: 13,
                                family: 'Inter'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                return `Despesas: R$ ${context.parsed.y.toFixed(2).replace('.', ',')}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#f1f5f9'
                        },
                        ticks: {
                            callback: function(value) {
                                return 'R$' + value.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
                            }
                        }
                    }
                }
            }
        });
        
        logInfo('âœ…', 'GrÃ¡fico de despesas por dia da semana criado');
    } catch (error) {
        logError('âŒ', 'Erro ao criar grÃ¡fico de despesas por dia:', error);
    }
}

// === UTILITÃRIOS ===
function gerarCoresParaCategoria(quantidade, categoria) {
    // Cores verdes para receitas (tons variados de verde)
    const coresReceitas = [
        '#10b981', '#059669', '#047857', '#065f46', '#16a34a',
        '#15803d', '#14532d', '#22c55e', '#84cc16', '#65a30d'
    ];
    
    // Cores vermelhas para despesas (tons variados de vermelho/laranja)
    const coresDespesas = [
        '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d',
        '#f97316', '#ea580c', '#c2410c', '#9a3412', '#f59e0b'
    ];
    
    // Cores azuis/verdes para saldos
    const coresSaldos = [
        '#14b8a6', '#0d9488', '#0f766e', '#115e59', '#134e4a',
        '#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63'
    ];
    
    // Escolher paleta baseada na categoria
    let cores = coresReceitas;
    if (categoria.includes('despesas') || categoria.includes('despesa')) {
        cores = coresDespesas;
    } else if (categoria.includes('saldos') || categoria.includes('saldo')) {
        cores = coresSaldos;
    } else if (categoria.includes('receitas') || categoria.includes('receita')) {
        cores = coresReceitas;
    }
    
    const resultado = [];
    for (let i = 0; i < quantidade; i++) {
        resultado.push(cores[i % cores.length]);
    }
    
    return resultado;
}

function atualizarListaItens(dados) {
    const listaItens = document.getElementById('lista-itens');
    if (!listaItens) return;
    
    // Limpar lista
    listaItens.innerHTML = '';
    
    // Calcular total
    const valores = Object.values(dados);
    const total = valores.reduce((a, b) => a + b, 0);
    
    // Obter cores
    const labels = Object.keys(dados);
    const cores = gerarCoresParaCategoria(labels.length, categoriaAtiva);
    
    // Criar item para cada categoria
    labels.forEach((label, index) => {
        const valor = dados[label];
        const porcentagemNum = ((valor / total) * 100);
        const porcentagem = porcentagemNum % 1 === 0 ? porcentagemNum.toFixed(0) : porcentagemNum.toFixed(1);
        
        const item = document.createElement('div');
        item.className = 'item-lista';
        item.style.cssText = 'display: flex; align-items: center; padding: 16px; border-bottom: 1px solid #f1f5f9;';
        
        // Buscar Ã­cone e cor reais
        const iconeInfo = obterIconeECor(label, cores[index]);
        
        console.log(`Ãcone para "${label}":`, iconeInfo); // Debug
        
        // Container do Ã­cone
        const iconeContainer = document.createElement('div');
        iconeContainer.style.cssText = `width: 48px; height: 48px; border-radius: 50%; background-color: ${iconeInfo.cor}; display: flex; align-items: center; justify-content: center; margin-right: 12px;`;
        
        if (iconeInfo.tipo === 'material-icon') {
            // Ãcone Material Icons
            const icone = document.createElement('span');
            icone.className = 'material-icons-round';
            icone.textContent = iconeInfo.icone;
            icone.style.cssText = 'color: white; font-size: 24px;';
            iconeContainer.appendChild(icone);
        } else if (iconeInfo.tipo === 'svg') {
            // Ãcone SVG
            const icone = document.createElement('img');
            icone.src = iconeInfo.icone;
            icone.style.cssText = 'width: 28px; height: 28px; filter: brightness(0) invert(1);';
            iconeContainer.appendChild(icone);
        } else if (iconeInfo.tipo === 'logo') {
            // Logo do banco
            const icone = document.createElement('img');
            icone.src = iconeInfo.icone;
            icone.style.cssText = 'width: 32px; height: 32px;';
            iconeContainer.appendChild(icone);
        }
        
        // ConteÃºdo
        const conteudo = document.createElement('div');
        conteudo.style.cssText = 'flex: 1;';
        
        const nome = document.createElement('div');
        nome.textContent = label;
        nome.style.cssText = 'font-weight: 600; font-size: 16px; color: #1e293b;';
        
        const subtitulo = document.createElement('div');
        subtitulo.textContent = 'Porcentagem';
        subtitulo.style.cssText = 'font-size: 14px; color: #64748b; margin-top: 2px;';
        
        conteudo.appendChild(nome);
        conteudo.appendChild(subtitulo);
        
        // Valores
        const valoresDiv = document.createElement('div');
        valoresDiv.style.cssText = 'text-align: right;';
        
        const valorTexto = document.createElement('div');
        valorTexto.textContent = `R$ ${valor.toFixed(2).replace('.', ',')}`;
        valorTexto.style.cssText = categoriaAtiva.includes('receita') ? 
            'font-weight: 600; font-size: 16px; color: #10b981;' : 
            'font-weight: 600; font-size: 16px; color: #ef4444;';
        
        const porcentagemTexto = document.createElement('div');
        porcentagemTexto.textContent = `${porcentagem}%`;
        porcentagemTexto.style.cssText = 'font-size: 14px; color: #64748b; margin-top: 2px;';
        
        valoresDiv.appendChild(valorTexto);
        valoresDiv.appendChild(porcentagemTexto);
        
        item.appendChild(iconeContainer);
        item.appendChild(conteudo);
        item.appendChild(valoresDiv);
        
        listaItens.appendChild(item);
    });
}

// Atualizar lista de itens para grÃ¡ficos de LINHA
function atualizarListaItensLinha() {
    const listaItens = document.getElementById('lista-itens');
    if (!listaItens) return;
    
    listaItens.innerHTML = '';
    
    let dados = {};
    let titulo = '';
    
    // Determinar qual tipo de grÃ¡fico de linha
    if (categoriaAtiva === 'despesas-semana') {
        titulo = 'Despesas dos Ãºltimos 7 dias';
        // Calcular total da semana
        const hoje = new Date();
        const seteDiasAtras = new Date(hoje);
        seteDiasAtras.setDate(hoje.getDate() - 7);
        
        const despesasSemana = dadosBrutos.despesas.filter(d => {
            const dataDespesa = converterDataParaObjeto(d.data);
            return dataDespesa >= seteDiasAtras && dataDespesa <= hoje;
        });
        
        const total = despesasSemana.reduce((acc, d) => {
            let valor = 0;
            if (typeof d.valor === 'string') {
                valor = parseFloat(d.valor.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
            } else if (typeof d.valor === 'number') {
                valor = d.valor;
            }
            return acc + Math.abs(valor);
        }, 0);
        
        dados = { 'Total da Semana': total };
        
    } else if (categoriaAtiva === 'despesas-mes') {
        titulo = 'Despesas do mÃªs';
        const despesasMes = dadosBrutos.despesas.filter(d => {
            const dataDespesa = converterDataParaObjeto(d.data);
            return dataDespesa.getMonth() === mesAtual && dataDespesa.getFullYear() === anoAtual;
        });
        
        const total = despesasMes.reduce((acc, d) => {
            let valor = 0;
            if (typeof d.valor === 'string') {
                valor = parseFloat(d.valor.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
            } else if (typeof d.valor === 'number') {
                valor = d.valor;
            }
            return acc + Math.abs(valor);
        }, 0);
        
        dados = { 'Total do MÃªs': total };
        
    } else if (categoriaAtiva === 'despesas-ano') {
        titulo = 'Despesas do ano';
        const despesasAno = dadosBrutos.despesas.filter(d => {
            const dataDespesa = converterDataParaObjeto(d.data);
            return dataDespesa.getFullYear() === anoAtual;
        });
        
        const total = despesasAno.reduce((acc, d) => {
            let valor = 0;
            if (typeof d.valor === 'string') {
                valor = parseFloat(d.valor.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
            } else if (typeof d.valor === 'number') {
                valor = d.valor;
            }
            return acc + Math.abs(valor);
        }, 0);
        
        dados = { 'Total do Ano': total };
    }
    
    // Criar item Ãºnico com resumo
    const item = document.createElement('div');
    item.style.cssText = 'padding: 20px; text-align: center;';
    
    const iconeContainer = document.createElement('div');
    iconeContainer.style.cssText = 'width: 56px; height: 56px; border-radius: 50%; background-color: #ef4444; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px;';
    
    const icone = document.createElement('span');
    icone.className = 'material-icons-round';
    icone.textContent = 'trending_down';
    icone.style.cssText = 'color: white; font-size: 28px;';
    iconeContainer.appendChild(icone);
    
    const tituloDiv = document.createElement('div');
    tituloDiv.textContent = titulo;
    tituloDiv.style.cssText = 'font-size: 16px; font-weight: 600; color: #64748b; margin-bottom: 8px;';
    
    const valorDiv = document.createElement('div');
    const valorTotal = Object.values(dados)[0] || 0;
    valorDiv.textContent = `R$ ${valorTotal.toFixed(2).replace('.', ',')}`;
    valorDiv.style.cssText = 'font-size: 28px; font-weight: 700; color: #ef4444;';
    
    item.appendChild(iconeContainer);
    item.appendChild(tituloDiv);
    item.appendChild(valorDiv);
    
    listaItens.appendChild(item);
}

// Atualizar lista de itens para grÃ¡ficos de BARRAS
function atualizarListaItensBarras() {
    const listaItens = document.getElementById('lista-itens');
    if (!listaItens) return;
    
    listaItens.innerHTML = '';
    
    if (categoriaAtiva === 'balanco-mensal') {
        // Mostrar resumo dos Ãºltimos 3 meses
        let totalReceitas = 0;
        let totalDespesas = 0;
        
        for (let i = 2; i >= 0; i--) {
            const data = new Date(anoAtual, mesAtual - i, 1);
            
            const receitasMes = dadosBrutos.receitas.filter(r => {
                const dataReceita = converterDataParaObjeto(r.data);
                return dataReceita.getMonth() === data.getMonth() && dataReceita.getFullYear() === data.getFullYear();
            });
            
            const despesasMes = dadosBrutos.despesas.filter(d => {
                const dataDespesa = converterDataParaObjeto(d.data);
                return dataDespesa.getMonth() === data.getMonth() && dataDespesa.getFullYear() === data.getFullYear();
            });
            
            totalReceitas += receitasMes.reduce((acc, r) => {
                let valor = 0;
                if (typeof r.valor === 'string') {
                    valor = parseFloat(r.valor.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
                } else if (typeof r.valor === 'number') {
                    valor = r.valor;
                }
                return acc + Math.abs(valor);
            }, 0);
            
            totalDespesas += despesasMes.reduce((acc, d) => {
                let valor = 0;
                if (typeof d.valor === 'string') {
                    valor = parseFloat(d.valor.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
                } else if (typeof d.valor === 'number') {
                    valor = d.valor;
                }
                return acc + Math.abs(valor);
            }, 0);
        }
        
        const saldo = totalReceitas - totalDespesas;
        
        // Container principal
        const container = document.createElement('div');
        container.style.cssText = 'display: flex; justify-content: space-around; padding: 20px;';
        
        // Item Receitas
        const itemReceitas = criarItemResumo('trending_up', 'Receitas', totalReceitas, '#10b981');
        // Item Despesas
        const itemDespesas = criarItemResumo('trending_down', 'Despesas', totalDespesas, '#ef4444');
        // Item Saldo
        const corSaldo = saldo >= 0 ? '#10b981' : '#ef4444';
        const itemSaldo = criarItemResumo('account_balance_wallet', 'Saldo', saldo, corSaldo);
        
        container.appendChild(itemReceitas);
        container.appendChild(itemDespesas);
        container.appendChild(itemSaldo);
        
        listaItens.appendChild(container);
        
    } else if (categoriaAtiva === 'fluxo-caixa-anual') {
        // Mostrar resumo anual
        let totalReceitasAno = 0;
        let totalDespesasAno = 0;
        
        dadosBrutos.receitas.forEach(r => {
            const dataReceita = converterDataParaObjeto(r.data);
            if (dataReceita.getFullYear() === anoAtual) {
                let valor = 0;
                if (typeof r.valor === 'string') {
                    valor = parseFloat(r.valor.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
                } else if (typeof r.valor === 'number') {
                    valor = r.valor;
                }
                totalReceitasAno += Math.abs(valor);
            }
        });
        
        dadosBrutos.despesas.forEach(d => {
            const dataDespesa = converterDataParaObjeto(d.data);
            if (dataDespesa.getFullYear() === anoAtual) {
                let valor = 0;
                if (typeof d.valor === 'string') {
                    valor = parseFloat(d.valor.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
                } else if (typeof d.valor === 'number') {
                    valor = d.valor;
                }
                totalDespesasAno += Math.abs(valor);
            }
        });
        
        const saldoAno = totalReceitasAno - totalDespesasAno;
        
        const container = document.createElement('div');
        container.style.cssText = 'display: flex; justify-content: space-around; padding: 20px;';
        
        const itemReceitas = criarItemResumo('trending_up', 'Receitas', totalReceitasAno, '#10b981');
        const itemDespesas = criarItemResumo('trending_down', 'Despesas', totalDespesasAno, '#ef4444');
        const corSaldo = saldoAno >= 0 ? '#10b981' : '#ef4444';
        const itemSaldo = criarItemResumo('account_balance_wallet', 'Saldo', saldoAno, corSaldo);
        
        container.appendChild(itemReceitas);
        container.appendChild(itemDespesas);
        container.appendChild(itemSaldo);
        
        listaItens.appendChild(container);
        
    } else if (categoriaAtiva === 'despesas-dia-semana') {
        // Mostrar total de despesas do mÃªs e mÃ©dia por dia
        const despesasMes = dadosBrutos.despesas.filter(d => {
            const dataDespesa = converterDataParaObjeto(d.data);
            return dataDespesa.getMonth() === mesAtual && dataDespesa.getFullYear() === anoAtual;
        });
        
        const totalDespesas = despesasMes.reduce((acc, d) => {
            let valor = 0;
            if (typeof d.valor === 'string') {
                valor = parseFloat(d.valor.replace(/[^\d,-]/g, '').replace(',', '.')) || 0;
            } else if (typeof d.valor === 'number') {
                valor = d.valor;
            }
            return acc + Math.abs(valor);
        }, 0);
        
        const mediaPorDia = totalDespesas / 30; // AproximaÃ§Ã£o
        
        const container = document.createElement('div');
        container.style.cssText = 'display: flex; justify-content: space-around; padding: 20px;';
        
        const itemTotal = criarItemResumo('shopping_cart', 'Total do MÃªs', totalDespesas, '#ef4444');
        const itemMedia = criarItemResumo('calendar_today', 'MÃ©dia por Dia', mediaPorDia, '#f59e0b');
        
        container.appendChild(itemTotal);
        container.appendChild(itemMedia);
        
        listaItens.appendChild(container);
    }
}

// FunÃ§Ã£o auxiliar para criar item de resumo
function criarItemResumo(icone, titulo, valor, cor) {
    const item = document.createElement('div');
    item.style.cssText = 'flex: 1; text-align: center; padding: 10px;';
    
    const iconeContainer = document.createElement('div');
    iconeContainer.style.cssText = `width: 48px; height: 48px; border-radius: 50%; background-color: ${cor}; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px;`;
    
    const iconeSpan = document.createElement('span');
    iconeSpan.className = 'material-icons-round';
    iconeSpan.textContent = icone;
    iconeSpan.style.cssText = 'color: white; font-size: 24px;';
    iconeContainer.appendChild(iconeSpan);
    
    const tituloDiv = document.createElement('div');
    tituloDiv.textContent = titulo;
    tituloDiv.style.cssText = 'font-size: 13px; font-weight: 500; color: #64748b; margin-bottom: 6px;';
    
    const valorDiv = document.createElement('div');
    valorDiv.textContent = `R$ ${Math.abs(valor).toFixed(2).replace('.', ',')}`;
    valorDiv.style.cssText = `font-size: 18px; font-weight: 700; color: ${cor};`;
    
    item.appendChild(iconeContainer);
    item.appendChild(tituloDiv);
    item.appendChild(valorDiv);
    
    return item;
}

function obterIconeECor(label, corPadrao) {
    // Para despesas/receitas fixas x variÃ¡veis
    if (label === 'Fixas' || label === 'VariÃ¡veis') {
        if (label === 'Fixas') {
            return {
                tipo: 'material-icon',
                icone: 'repeat',
                cor: categoriaAtiva.includes('despesa') ? '#ef4444' : '#10b981'
            };
        } else {
            return {
                tipo: 'material-icon',
                icone: 'schedule',
                cor: categoriaAtiva.includes('despesa') ? '#f97316' : '#22c55e'
            };
        }
    }
    
    // Para categorias (buscar na lista de receitas/despesas)
    if (categoriaAtiva.includes('categoria')) {
        // Buscar nas despesas
        if (categoriaAtiva.includes('despesa')) {
            const despesaComCategoria = dadosBrutos.despesas.find(d => d.categoria === label);
            if (despesaComCategoria && despesaComCategoria.iconeCategoria) {
                // Verificar se Ã© um Material Icon ou SVG
                const icone = despesaComCategoria.iconeCategoria;
                const isSvg = icone.endsWith('.svg');
                
                return {
                    tipo: isSvg ? 'svg' : 'material-icon',
                    icone: isSvg ? `../Icon/${icone}` : icone,
                    cor: despesaComCategoria.corCategoria || corPadrao
                };
            }
        }
        // Buscar nas receitas
        else if (categoriaAtiva.includes('receita')) {
            const receitaComCategoria = dadosBrutos.receitas.find(r => r.categoria === label);
            if (receitaComCategoria && receitaComCategoria.iconeCategoria) {
                // Verificar se Ã© um Material Icon ou SVG
                const icone = receitaComCategoria.iconeCategoria;
                const isSvg = icone.endsWith('.svg');
                
                return {
                    tipo: isSvg ? 'svg' : 'material-icon',
                    icone: isSvg ? `../Icon/${icone}` : icone,
                    cor: receitaComCategoria.corCategoria || corPadrao
                };
            }
        }
    }
    
    // Para contas (buscar na lista de contas)
    if (categoriaAtiva.includes('conta') || categoriaAtiva.includes('saldo')) {
        const conta = dadosBrutos.contas.find(c => (c.nome === label) || (c.banco === label));
        if (conta) {
            // Tentar usar logo do banco
            const bancoLower = (conta.banco || '').toLowerCase().replace(/\s+/g, '-');
            const logosDisponiveis = ['nubank', 'bradesco', 'itau', 'santander', 'caixa', 'banco-do-brasil', 'picpay'];
            
            if (logosDisponiveis.includes(bancoLower)) {
                return {
                    tipo: 'logo',
                    icone: `../Icon/${bancoLower}.svg`,
                    cor: conta.cor || corPadrao
                };
            }
            
            // Ãcone baseado no tipo de conta
            let icone = 'account_balance';
            if (conta.tipo === 'Carteira') icone = 'account_balance_wallet';
            else if (conta.tipo === 'PoupanÃ§a') icone = 'savings';
            else if (conta.tipo === 'Investimentos') icone = 'trending_up';
            
            return {
                tipo: 'material-icon',
                icone: icone,
                cor: conta.cor || corPadrao
            };
        }
    }
    
    // Fallback: Ã­cone padrÃ£o
    return {
        tipo: 'material-icon',
        icone: categoriaAtiva.includes('receita') ? 'attach_money' : 'shopping_cart',
        cor: corPadrao
    };
}

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
    // Limpar canvas
    const canvas = document.getElementById('grafico-principal');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    // Limpar lista de itens
    const listaItens = document.getElementById('lista-itens');
    if (listaItens) {
        listaItens.innerHTML = '';
    }
    
    // Criar mensagem visual
    const containerGrafico = canvas?.parentElement;
    if (containerGrafico) {
        // Remover mensagem anterior se existir
        const mensagemAnterior = containerGrafico.querySelector('.mensagem-sem-dados');
        if (mensagemAnterior) {
            mensagemAnterior.remove();
        }
        
        // Criar nova mensagem
        const mensagem = document.createElement('div');
        mensagem.className = 'mensagem-sem-dados';
        mensagem.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: #64748b;
            z-index: 10;
        `;
        
        // Ãcone
        const icone = document.createElement('span');
        icone.className = 'material-icons-round';
        icone.textContent = 'pie_chart';
        icone.style.cssText = 'font-size: 64px; color: #cbd5e1; display: block; margin-bottom: 16px;';
        
        // TÃ­tulo
        const titulo = document.createElement('div');
        titulo.textContent = 'Nenhum dado encontrado';
        titulo.style.cssText = 'font-size: 18px; font-weight: 600; color: #475569; margin-bottom: 8px;';
        
        // SubtÃ­tulo
        const subtitulo = document.createElement('div');
        const mesNome = new Date(anoAtual, mesAtual).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        subtitulo.textContent = `Nenhuma transaÃ§Ã£o foi registrada em ${mesNome}`;
        subtitulo.style.cssText = 'font-size: 14px; color: #94a3b8;';
        
        mensagem.appendChild(icone);
        mensagem.appendChild(titulo);
        mensagem.appendChild(subtitulo);
        
        // Posicionar em relaÃ§Ã£o ao canvas
        containerGrafico.style.position = 'relative';
        containerGrafico.appendChild(mensagem);
    }
    
    // Atualizar o total para R$ 0,00
    const totalValor = document.getElementById('total-valor');
    if (totalValor) {
        totalValor.textContent = 'R$ 0,00';
    }
    
    logInfo('â„¹ï¸', 'Nenhum dado disponÃ­vel para exibir');
}

// Log de performance
window.addEventListener('load', () => {
    if (DEBUG_MODE) {
        logInfo('âš¡', 'PÃ¡gina carregada completamente');
        logInfo('ðŸ“Š', 'Sistema de grÃ¡ficos pronto para uso');
        logInfo('â±ï¸', `Tempo de carregamento: ${performance.now().toFixed(2)}ms`);
    }
});

// Log de erros globais apenas em casos crÃ­ticos
window.addEventListener('error', (event) => {
    logError('ðŸ’¥', 'Erro crÃ­tico na aplicaÃ§Ã£o:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno
    });
});

logInfo('ðŸŽ¯', 'Script de grÃ¡ficos carregado completamente');
logInfo('ðŸ“Š', `Estado inicial: Tipo=${tipoAtivo}, Categoria=${categoriaAtiva}`);

