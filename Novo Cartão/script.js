// === CONFIGURAÇÃO DO FIREBASE ===
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    query, 
    where, 
    getDocs,
    serverTimestamp 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
import { 
    getAuth, 
    onAuthStateChanged 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';

// ⚠️ Configuração do Firebase - Poup+ Beta
const firebaseConfig = {
    apiKey: "AIzaSyC7RB9fULmkp9xeJIjc0dL58atHJ8CM-Xc",
    authDomain: "poup-beta.firebaseapp.com",
    projectId: "poup-beta",
    storageBucket: "poup-beta.appspot.com",
    messagingSenderId: "954695915981",
    appId: "1:954695915981:web:d31b216f79eac178094c84",
    measurementId: "G-LP9BDVD3KJ"
};

// Verificar se Firebase está configurado
const firebaseConfigurado = firebaseConfig.apiKey !== "your-api-key";

let app, db, auth;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    console.log('✅ Firebase inicializado com sucesso');
} catch (error) {
    console.error('❌ Erro ao inicializar Firebase:', error);
}

// === ESTADO DA APLICAÇÃO ===
let usuarioAtual = null;
let instituicaoSelecionada = null;
let contaSelecionada = null;
let bandeiraSelecionada = { id: 'visa', logo: '../Icon/visa.svg', nome: 'Visa' };
let diaFechamento = 1;
let diaVencimento = 5;
let limiteCartao = 0;
let contas = [];

// Dados das instituições (para seleção de instituição na Etapa 1)
const instituicoes = [
    { id: 'santander', nome: 'Santander', classe: 'santander', icone: '../Icon/santander.svg', cor: '#EC0000' },
    { id: 'nubank', nome: 'Nubank', classe: 'nubank', icone: '../Icon/Nubank.svg', cor: '#820AD1' },
    { id: 'bb', nome: 'Banco do Brasil', classe: 'bb', icone: '../Icon/banco-do-brasil.svg', cor: '#FFDD00' },
    { id: 'caixa', nome: 'Caixa', classe: 'caixa', icone: '../Icon/caixa.svg', cor: '#0D6EAE' },
    { id: 'itau', nome: 'Itaú', classe: 'itau', icone: '../Icon/itau.svg', cor: '#FF6600' },
    { id: 'bradesco', nome: 'Bradesco', classe: 'bradesco', icone: '../Icon/bradesco.svg', cor: '#CC092F' },
    { id: 'picpay', nome: 'PicPay', classe: 'picpay', icone: '../Icon/picpay.svg', cor: '#11C76F' }
];

// === INICIALIZAÇÃO ===
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando aplicação Novo Cartão...');
    
    // Verificar se Firebase está configurado
    if (!firebaseConfigurado) {
        mostrarErroFirebase();
        return;
    }
    
    verificarAutenticacao();
    // renderizarInstituicoes() será chamado após carregar contas do Firebase
    gerarDias();
});

// === MOSTRAR ERRO FIREBASE ===
function mostrarErroFirebase() {
    const etapa1 = document.getElementById('etapa-1');
    if (etapa1) {
        etapa1.innerHTML = `
            <div style="padding: 40px 20px; text-align: center;">
                <span class="material-icons" style="font-size: 64px; color: #FF6B6B; margin-bottom: 20px;">error_outline</span>
                <h2 style="color: #2D3748; margin-bottom: 16px;">Firebase não configurado</h2>
                <p style="color: #718096; margin-bottom: 24px; line-height: 1.6;">
                    O Firebase precisa ser configurado com suas credenciais reais antes de usar o aplicativo.
                </p>
                <div style="background: #FFF3CD; border: 1px solid #FFE69C; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: left;">
                    <h3 style="color: #856404; margin-bottom: 12px; font-size: 1rem;">📋 O que fazer:</h3>
                    <ol style="color: #856404; padding-left: 20px; line-height: 1.8;">
                        <li>Abra o arquivo: <code>Novo Cartão/script.js</code></li>
                        <li>Localize a linha 18 (firebaseConfig)</li>
                        <li>Substitua "your-api-key" pelas suas credenciais</li>
                        <li>Consulte o arquivo <strong>CONFIGURAR-FIREBASE.md</strong> para detalhes</li>
                    </ol>
                </div>
                <button onclick="window.location.href='../Home/home.html'" 
                        style="background: #21C25E; color: white; border: none; padding: 14px 32px; 
                               border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer;">
                    Voltar para Home
                </button>
            </div>
        `;
    }
    
    console.error(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║  ⚠️  FIREBASE NÃO CONFIGURADO                              ║
║                                                            ║
║  O Firebase precisa ser configurado antes de usar o app.  ║
║                                                            ║
║  📝 Veja: CONFIGURAR-FIREBASE.md                           ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
    `);
}

// === AUTENTICAÇÃO ===
function verificarAutenticacao() {
    if (!auth) {
        console.error('❌ Auth não inicializado');
        return;
    }
    
    onAuthStateChanged(auth, (usuario) => {
        if (usuario) {
            usuarioAtual = usuario;
            console.log('✅ Usuário autenticado:', usuario.email);
            carregarContas();
        } else {
            console.log('⚠️ Usuário não autenticado');
            
            // Mostrar mensagem em vez de redirecionar imediatamente
            const etapa1 = document.getElementById('etapa-1');
            if (etapa1) {
                etapa1.innerHTML = `
                    <div style="padding: 40px 20px; text-align: center;">
                        <span class="material-icons" style="font-size: 64px; color: #FFB020; margin-bottom: 20px;">lock</span>
                        <h2 style="color: #2D3748; margin-bottom: 16px;">Login necessário</h2>
                        <p style="color: #718096; margin-bottom: 24px;">
                            Você precisa estar logado para criar um cartão de crédito.
                        </p>
                        <button onclick="window.location.href='../Login/Login.html'" 
                                style="background: #21C25E; color: white; border: none; padding: 14px 32px; 
                                       border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer; margin-right: 12px;">
                            Fazer Login
                        </button>
                        <button onclick="window.location.href='../Home/home.html'" 
                                style="background: #E2E8F0; color: #2D3748; border: none; padding: 14px 32px; 
                                       border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer;">
                            Voltar
                        </button>
                    </div>
                `;
            }
        }
    }, (error) => {
        console.error('❌ Erro no onAuthStateChanged:', error);
    });
}

// === CARREGAR CONTAS DO FIREBASE ===
async function carregarContas() {
    if (!usuarioAtual) {
        console.log('❌ Sem usuário autenticado');
        return;
    }
    
    try {
        console.log('🔍 Buscando contas do usuário:', usuarioAtual.uid);
        
        const contasRef = collection(db, 'contas');
        
        // Buscar por userId (padrão da Home) OU usuarioId (novo padrão)
        const q1 = query(contasRef, where('userId', '==', usuarioAtual.uid));
        const q2 = query(contasRef, where('usuarioId', '==', usuarioAtual.uid));
        
        const [snapshot1, snapshot2] = await Promise.all([
            getDocs(q1),
            getDocs(q2)
        ]);
        
        contas = [];
        const contasIds = new Set(); // Para evitar duplicatas
        
        // Processar resultados do userId
        snapshot1.forEach((doc) => {
            if (!contasIds.has(doc.id)) {
                contasIds.add(doc.id);
                const data = doc.data();
                console.log('📊 Conta encontrada (userId):', {
                    id: doc.id,
                    nomeBanco: data.nomeBanco || data.banco,
                    icone: data.icone,
                    corIcone: data.corIcone || data.cor
                });
                
                contas.push({
                    id: doc.id,
                    nomeBanco: data.nomeBanco || data.banco || data.descricao || 'Banco',
                    tipoConta: data.tipoConta || data.tipo || 'Conta',
                    icone: data.icone || 'account_balance',
                    corIcone: data.corIcone || data.cor || '#21C25E',
                    saldo: data.saldo || 0,
                    openFinance: data.openFinance || false
                });
            }
        });
        
        // Processar resultados do usuarioId
        snapshot2.forEach((doc) => {
            if (!contasIds.has(doc.id)) {
                contasIds.add(doc.id);
                const data = doc.data();
                console.log('📊 Conta encontrada (usuarioId):', {
                    id: doc.id,
                    nomeBanco: data.nomeBanco || data.banco,
                    icone: data.icone,
                    corIcone: data.corIcone || data.cor
                });
                
                contas.push({
                    id: doc.id,
                    nomeBanco: data.nomeBanco || data.banco || data.descricao || 'Banco',
                    tipoConta: data.tipoConta || data.tipo || 'Conta',
                    icone: data.icone || 'account_balance',
                    corIcone: data.corIcone || data.cor || '#21C25E',
                    saldo: data.saldo || 0,
                    openFinance: data.openFinance || false
                });
            }
        });
        
        console.log('✅ Total de contas carregadas:', contas.length);
        
        if (contas.length === 0) {
            console.log('⚠️ Nenhuma conta encontrada. Usuário precisa criar uma conta primeiro.');
            alert('⚠️ Você precisa cadastrar uma conta bancária antes de criar um cartão de crédito.\n\nVá em "Nova Conta" para cadastrar sua primeira conta.');
        }
        
        // Renderizar as contas na tela (Etapa 1)
        renderizarInstituicoes();
        renderizarContasModal();
        
    } catch (error) {
        console.error('❌ Erro ao carregar contas:', error);
        alert('Erro ao carregar suas contas. Verifique sua conexão e tente novamente.');
        contas = [];
        renderizarContasModal();
    }
}

// === RENDERIZAR CONTAS DO USUÁRIO (Etapa 1) ===
function renderizarInstituicoes() {
    const lista = document.getElementById('lista-instituicoes');
    if (!lista) return;
    
    lista.innerHTML = '';
    
    // Se não houver contas, mostrar mensagem
    if (contas.length === 0) {
        lista.innerHTML = `
            <div style="text-align: center; padding: 60px 20px; color: #718096;">
                <span class="material-icons" style="font-size: 64px; margin-bottom: 16px; opacity: 0.5;">account_balance</span>
                <h3 style="color: #2D3748; margin-bottom: 12px;">Nenhuma conta encontrada</h3>
                <p style="font-size: 0.95rem; line-height: 1.6; margin-bottom: 24px;">
                    Você precisa cadastrar uma conta bancária antes de criar um cartão de crédito.
                </p>
                <button onclick="window.location.href='../Nova-conta/Nova-conta.html'" 
                        style="background: #21C25E; color: white; border: none; padding: 14px 32px; 
                               border-radius: 12px; font-size: 1rem; font-weight: 600; cursor: pointer;">
                    Cadastrar Conta
                </button>
            </div>
        `;
        return;
    }
    
    // Renderizar contas do usuário
    contas.forEach(conta => {
        const item = document.createElement('div');
        item.className = 'item-instituicao';
        item.onclick = () => selecionarContaComoInstituicao(conta);
        
        // Determinar se é SVG ou Material Icon
        const isSVG = conta.icone && (conta.icone.endsWith('.svg') || conta.icone.includes('/'));
        const corIcone = conta.corIcone || '#21C25E';
        
        item.innerHTML = `
            <div class="instituicao-icone" style="background-color: ${corIcone};">
                ${isSVG 
                    ? `<img src="${conta.icone}" alt="${conta.nomeBanco}" style="width: 28px; height: 28px; object-fit: contain;">` 
                    : `<span class="material-icons" style="color: white; font-size: 28px;">${conta.icone}</span>`
                }
            </div>
            <div style="flex: 1;">
                <span class="instituicao-nome">${conta.nomeBanco || 'Banco'}</span>
            </div>
        `;
        
        lista.appendChild(item);
    });
}

// === SELECIONAR CONTA COMO INSTITUIÇÃO ===
function selecionarContaComoInstituicao(conta) {
    // Criar objeto instituição a partir da conta
    instituicaoSelecionada = {
        id: conta.id,
        nome: conta.nomeBanco,
        icone: conta.icone,
        cor: conta.corIcone
    };
    
    // Já pré-selecionar esta conta também
    contaSelecionada = conta;
    
    console.log('Conta selecionada como instituição:', instituicaoSelecionada);
    console.log('Conta vinculada automaticamente:', contaSelecionada);
    
    mostrarEtapa2();
}

// === NAVEGAÇÃO ENTRE ETAPAS ===
function mostrarEtapa2() {
    document.getElementById('etapa-1').classList.add('hidden');
    document.getElementById('etapa-2').classList.remove('hidden');
    
    // Atualizar display da conta selecionada
    if (contaSelecionada) {
        atualizarDisplayConta();
    }
}

function voltarEtapa1() {
    document.getElementById('etapa-2').classList.add('hidden');
    document.getElementById('etapa-1').classList.remove('hidden');
}

function voltar() {
    window.history.back();
}

// === MODAIS ===
function abrirSeletorBandeira() {
    document.getElementById('modal-bandeira').classList.remove('hidden');
}

function abrirSeletorConta() {
    document.getElementById('modal-conta').classList.remove('hidden');
}

function abrirSeletorDia(tipo) {
    const modal = document.getElementById('modal-dia');
    const titulo = document.getElementById('modal-dia-titulo');
    
    modal.setAttribute('data-tipo', tipo);
    
    if (tipo === 'fechamento') {
        titulo.textContent = 'Dia do fechamento';
        marcarDiaSelecionado(diaFechamento);
    } else {
        titulo.textContent = 'Dia do vencimento';
        marcarDiaSelecionado(diaVencimento);
    }
    
    modal.classList.remove('hidden');
}

function fecharModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// Fechar modal ao clicar no overlay
document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });
});

// === SELEÇÃO DE BANDEIRA ===
window.selecionarBandeira = function(id, logo, nome) {
    bandeiraSelecionada = { id, logo, nome };
    
    const display = document.getElementById('bandeira-display');
    display.innerHTML = `
        <img src="${logo}" alt="${nome}" class="bandeira-icone-mini">
        <span class="bandeira-texto">${nome}</span>
    `;
    
    fecharModal('modal-bandeira');
};

// === RENDERIZAR CONTAS NO MODAL ===
function renderizarContasModal() {
    const lista = document.getElementById('lista-contas-modal');
    if (!lista) return;
    
    lista.innerHTML = '';
    
    if (contas.length === 0) {
        lista.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; color: #718096;">
                <span class="material-icons" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;">account_balance</span>
                <p>Nenhuma conta encontrada</p>
                <p style="font-size: 0.9rem; margin-top: 8px;">Cadastre uma conta primeiro</p>
            </div>
        `;
        return;
    }
    
    contas.forEach(conta => {
        const item = document.createElement('div');
        item.className = 'item-conta-modal';
        if (contaSelecionada && contaSelecionada.id === conta.id) {
            item.classList.add('selecionado');
        }
        
        item.onclick = () => selecionarConta(conta);
        
        // Determinar se é SVG ou ícone do Material Icons
        const isSVG = conta.icone && (conta.icone.endsWith('.svg') || conta.icone.includes('/'));
        const corIcone = conta.corIcone || '#21C25E';
        
        item.innerHTML = `
            <div class="conta-icone-modal" style="background-color: ${corIcone};">
                ${isSVG 
                    ? `<img src="${conta.icone}" alt="${conta.nomeBanco}" style="width: 28px; height: 28px; object-fit: contain;">` 
                    : `<span class="material-icons" style="color: white; font-size: 28px;">${conta.icone}</span>`
                }
            </div>
            <div class="conta-info-modal">
                <div class="conta-nome-modal">${conta.nomeBanco || 'Banco'}</div>
                <div class="conta-tipo-modal">${conta.tipoConta || 'Conta'}</div>
            </div>
            ${conta.openFinance ? '<span class="badge-openfinance"><span class="material-icons" style="font-size: 14px;">verified</span> Open Finance</span>' : ''}
            ${contaSelecionada && contaSelecionada.id === conta.id ? '<span class="material-icons conta-check">check_circle</span>' : ''}
        `;
        
        lista.appendChild(item);
    });
}

// === SELECIONAR CONTA ===
function selecionarConta(conta) {
    contaSelecionada = conta;
    atualizarDisplayConta();
    renderizarContasModal();
    fecharModal('modal-conta');
}

// === ATUALIZAR DISPLAY DA CONTA ===
function atualizarDisplayConta() {
    if (!contaSelecionada) return;
    
    const display = document.getElementById('conta-display');
    if (!display) return;
    
    const isSVG = contaSelecionada.icone && (contaSelecionada.icone.endsWith('.svg') || contaSelecionada.icone.includes('/'));
    const corIcone = contaSelecionada.corIcone || '#21C25E';
    
    display.innerHTML = `
        <div class="conta-icone-mini" style="background-color: ${corIcone};">
            ${isSVG 
                ? `<img src="${contaSelecionada.icone}" alt="${contaSelecionada.nomeBanco}" style="width: 20px; height: 20px; object-fit: contain;">` 
                : `<span class="material-icons" style="color: white; font-size: 20px;">${contaSelecionada.icone}</span>`
            }
        </div>
        <span class="conta-texto">${contaSelecionada.nomeBanco}</span>
    `;
}

// === GERAR DIAS (1-31) ===
function gerarDias() {
    const lista = document.getElementById('lista-dias');
    if (!lista) return;
    
    lista.innerHTML = '';
    
    for (let i = 1; i <= 31; i++) {
        const dia = document.createElement('div');
        dia.className = 'opcao-dia';
        dia.textContent = i;
        dia.onclick = () => selecionarDia(i);
        
        lista.appendChild(dia);
    }
}

function marcarDiaSelecionado(dia) {
    setTimeout(() => {
        document.querySelectorAll('.opcao-dia').forEach(opcao => {
            opcao.classList.remove('selecionado');
            if (parseInt(opcao.textContent) === dia) {
                opcao.classList.add('selecionado');
            }
        });
    }, 100);
}

function selecionarDia(dia) {
    const modal = document.getElementById('modal-dia');
    const tipo = modal.getAttribute('data-tipo');
    
    if (tipo === 'fechamento') {
        diaFechamento = dia;
        document.getElementById('dia-fechamento-display').textContent = dia;
    } else {
        diaVencimento = dia;
        document.getElementById('dia-vencimento-display').textContent = dia;
    }
    
    fecharModal('modal-dia');
}

// === BUSCA ===
document.getElementById('busca-instituicao')?.addEventListener('input', (e) => {
    const termo = e.target.value.toLowerCase();
    document.querySelectorAll('.item-instituicao').forEach(item => {
        const nome = item.querySelector('.instituicao-nome').textContent.toLowerCase();
        item.style.display = nome.includes(termo) ? 'flex' : 'none';
    });
});

document.getElementById('busca-conta')?.addEventListener('input', (e) => {
    const termo = e.target.value.toLowerCase();
    document.querySelectorAll('.item-conta-modal').forEach(item => {
        const nome = item.querySelector('.conta-nome-modal').textContent.toLowerCase();
        const tipo = item.querySelector('.conta-tipo-modal').textContent.toLowerCase();
        item.style.display = (nome.includes(termo) || tipo.includes(termo)) ? 'flex' : 'none';
    });
});

// === ATUALIZAR LIMITE ===
document.getElementById('descricao')?.addEventListener('focus', () => {
    // Poderia abrir calculadora aqui
});

// === SALVAR CARTÃO ===
window.salvarCartao = async function() {
    const descricao = document.getElementById('descricao').value;
    
    console.log('🔍 Validando dados do cartão:', {
        descricao,
        contaSelecionada,
        bandeiraSelecionada,
        limiteCartao,
        diaFechamento,
        diaVencimento
    });
    
    // Validações
    if (!contaSelecionada) {
        alert('❌ Selecione uma conta para vincular o cartão');
        return;
    }
    
    if (!descricao.trim()) {
        mostrarPopupDescricao();
        return;
    }
    
    if (limiteCartao === undefined || limiteCartao === null || limiteCartao <= 0) {
        mostrarPopupAviso();
        return;
    }
    
    if (!diaFechamento || diaFechamento < 1 || diaFechamento > 31) {
        alert('❌ Selecione um dia de fechamento válido');
        return;
    }
    
    if (!diaVencimento || diaVencimento < 1 || diaVencimento > 31) {
        alert('❌ Selecione um dia de vencimento válido');
        return;
    }
    
    // Preparar dados
    const cartaoData = {
        descricao: descricao.trim(),
        bandeira: bandeiraSelecionada.nome,
        bandeiraSvg: bandeiraSelecionada.logo,
        contaId: contaSelecionada.id,
        nomeBanco: contaSelecionada.nomeBanco,
        icone: contaSelecionada.icone,
        corIcone: contaSelecionada.corIcone,
        limite: Number(limiteCartao),
        utilizado: 0,
        disponivel: Number(limiteCartao),
        valorFatura: 0,
        diaFechamento: Number(diaFechamento),
        diaVencimento: Number(diaVencimento),
        ativo: true,
        criadoEm: serverTimestamp()
    };
    
    if (usuarioAtual) {
        cartaoData.usuarioId = usuarioAtual.uid;
    }
    
    console.log('💾 Salvando cartão no Firebase:', cartaoData);
    
    try {
        // Salvar no Firebase
        const docRef = await addDoc(collection(db, 'cartoes'), cartaoData);
        console.log('✅ Cartão salvo com ID:', docRef.id);
        
        mostrarPopupSucesso();
        
        // Redirecionar após 2 segundos
        setTimeout(() => {
            window.location.href = '../Lista-de-cartoes/Lista-de-cartoes.html';
        }, 2000);
        
    } catch (error) {
        console.error('❌ Erro ao salvar cartão:', error);
        alert('❌ Erro ao salvar cartão. Tente novamente.\n\n' + error.message);
    }
};

// === CALCULADORA ===
let valorAtualCalculadora = '0';
let digitandoValor = false;

window.abrirCalculadora = function() {
    const calculadoraContainer = document.getElementById('calculadora-container');
    const calculadoraDisplay = document.getElementById('calculadora-display');
    const valorLimiteDisplay = document.getElementById('valor-limite-display');
    
    calculadoraContainer.style.display = 'block';
    
    // Pegar valor atual do limite (removendo R$ e formatação)
    const valorTexto = valorLimiteDisplay.textContent.replace('R$ ', '').replace(/\./g, '').replace(',', '.');
    valorAtualCalculadora = valorTexto || '0';
    calculadoraDisplay.value = formatarValorCalculadora(valorAtualCalculadora);
    digitandoValor = false;
};

function fecharCalculadora() {
    document.getElementById('calculadora-container').style.display = 'none';
}

function cancelarCalculadora() {
    fecharCalculadora();
}

function confirmarCalculadora() {
    const valorFormatado = formatarMoeda(valorAtualCalculadora);
    document.getElementById('valor-limite-display').textContent = `R$ ${valorFormatado}`;
    limiteCartao = parseFloat(valorAtualCalculadora);
    fecharCalculadora();
}

function adicionarNumero(numero) {
    if (!digitandoValor) {
        valorAtualCalculadora = '0';
        digitandoValor = true;
    }
    
    if (valorAtualCalculadora === '0' && numero !== '.') {
        valorAtualCalculadora = numero;
    } else {
        if (valorAtualCalculadora.includes('.') && valorAtualCalculadora.split('.')[1].length >= 2) {
            return; // Limite de 2 casas decimais
        }
        valorAtualCalculadora += numero;
    }
    
    document.getElementById('calculadora-display').value = formatarValorCalculadora(valorAtualCalculadora);
}

function apagarDigito() {
    if (valorAtualCalculadora.length > 1) {
        valorAtualCalculadora = valorAtualCalculadora.slice(0, -1);
    } else {
        valorAtualCalculadora = '0';
        digitandoValor = false;
    }
    document.getElementById('calculadora-display').value = formatarValorCalculadora(valorAtualCalculadora);
}

function formatarValorCalculadora(valor) {
    if (valor.includes('.')) {
        const partes = valor.split('.');
        return `${partes[0]},${partes[1].substring(0, 2)}`;
    }
    return valor.replace('.', ',');
}

function formatarMoeda(valor) {
    const numero = parseFloat(valor);
    return numero.toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
}

// Event listeners da calculadora
document.addEventListener('DOMContentLoaded', () => {
    const calculadoraBotoes = document.querySelector('.calculadora-botoes');
    const btnApagar = document.getElementById('botao-apagar');
    const btnCancelar = document.querySelector('.btn-cancelar-calculadora');
    const btnConfirmar = document.querySelector('.btn-confirmar-calculadora');
    
    if (calculadoraBotoes) {
        calculadoraBotoes.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                const valor = e.target.textContent;
                
                if (!isNaN(valor) || valor === ',' || valor === '.') {
                    const numero = valor === ',' ? '.' : valor;
                    adicionarNumero(numero);
                } else if (valor === '=') {
                    confirmarCalculadora();
                } else if (['+', '-', '*', '/'].includes(valor)) {
                    // Operações matemáticas simples podem ser implementadas aqui
                    console.log('Operação:', valor);
                }
            }
        });
    }
    
    if (btnApagar) {
        btnApagar.addEventListener('click', apagarDigito);
    }
    
    if (btnCancelar) {
        btnCancelar.addEventListener('click', cancelarCalculadora);
    }
    
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', confirmarCalculadora);
    }
});

// === POPUP DE AVISO: DESCRIÇÃO OBRIGATÓRIA ===
function mostrarPopupDescricao() {
    const popup = document.getElementById('popup-aviso-descricao');
    if (popup) {
        popup.style.display = 'flex';
    }
}

window.fecharPopupDescricao = function() {
    const popup = document.getElementById('popup-aviso-descricao');
    if (popup) {
        popup.style.display = 'none';
    }
    
    // Focar no campo de descrição para facilitar a entrada
    const inputDescricao = document.getElementById('descricao-cartao');
    if (inputDescricao) {
        inputDescricao.focus();
        inputDescricao.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// === POPUP DE AVISO: LIMITE OBRIGATÓRIO ===
function mostrarPopupAviso() {
    const popup = document.getElementById('popup-aviso-limite');
    popup.style.display = 'flex';
}

window.fecharPopupAviso = function() {
    const popup = document.getElementById('popup-aviso-limite');
    popup.style.display = 'none';
    
    // Focar no campo de limite para facilitar a entrada
    const secaoLimite = document.querySelector('.secao-limite');
    if (secaoLimite) {
        secaoLimite.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// === POPUP DE SUCESSO ===
function mostrarPopupSucesso() {
    const popup = document.getElementById('popup-sucesso');
    popup.style.display = 'flex';
}

// Expor funções globalmente
window.voltarEtapa1 = voltarEtapa1;
window.voltar = voltar;
window.abrirSeletorBandeira = abrirSeletorBandeira;
window.abrirSeletorConta = abrirSeletorConta;
window.abrirSeletorDia = abrirSeletorDia;
window.fecharModal = fecharModal;

console.log('✅ Script Novo Cartão carregado');
