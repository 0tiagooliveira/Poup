// === CONFIGURAÇÃO DO FIREBASE ===
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getFirestore, 
    collection, 
    query, 
    where, 
    orderBy, 
    onSnapshot,
    doc,
    deleteDoc 
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
let cartoes = [];
let mesAtual = new Date();

// === INICIALIZAÇÃO ===
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Iniciando Lista de Cartões...');
    
    configurarEventos();
    atualizarMesDisplay();
    verificarAutenticacao();
    
    const dropdownMenu = document.querySelector('.dropdown-menu');
    dropdownMenu.style.display = 'none';
});

// === CONFIGURAR EVENTOS ===
function configurarEventos() {
    // Navegação de mês
    document.getElementById('prev-month')?.addEventListener('click', () => {
        mesAtual.setMonth(mesAtual.getMonth() - 1);
        atualizarMesDisplay();
        carregarCartoes();
    });
    
    document.getElementById('next-month')?.addEventListener('click', () => {
        mesAtual.setMonth(mesAtual.getMonth() + 1);
        atualizarMesDisplay();
        carregarCartoes();
    });
    
    // Busca
    document.getElementById('botao-busca')?.addEventListener('click', () => {
        const barraBusca = document.getElementById('barra-busca');
        if (barraBusca) {
            barraBusca.style.display = 'block';
            document.getElementById('input-busca')?.focus();
        }
    });
    
    document.getElementById('fechar-busca')?.addEventListener('click', () => {
        const barraBusca = document.getElementById('barra-busca');
        if (barraBusca) {
            barraBusca.style.display = 'none';
            document.getElementById('input-busca').value = '';
            renderizarCartoes();
        }
    });
    
    document.getElementById('input-busca')?.addEventListener('input', (e) => {
        filtrarCartoes(e.target.value);
    });
    
    // Filtros
    document.getElementById('botao-filtros')?.addEventListener('click', () => {
        document.getElementById('modal-filtros').style.display = 'flex';
    });
    
    document.getElementById('fechar-modal-filtros')?.addEventListener('click', () => {
        document.getElementById('modal-filtros').style.display = 'none';
    });
    
    document.getElementById('limpar-filtros')?.addEventListener('click', () => {
        document.getElementById('filtro-bandeira').value = '';
        document.getElementById('filtro-status').value = '';
    });
    
    document.getElementById('aplicar-filtros')?.addEventListener('click', () => {
        aplicarFiltros();
        document.getElementById('modal-filtros').style.display = 'none';
    });
    
    // Fechar modal ao clicar fora
    document.getElementById('modal-filtros')?.addEventListener('click', (e) => {
        if (e.target.id === 'modal-filtros') {
            e.target.style.display = 'none';
        }
    });
    
    document.addEventListener('click', (event) => {
        const dropdownMenu = document.querySelector('.dropdown-menu');
        const tituloPagina = document.querySelector('.titulo-pagina');

        if (dropdownMenu.style.display === 'block' && !tituloPagina.contains(event.target)) {
            dropdownMenu.style.display = 'none';
        }
    });
}

// === ATUALIZAR MÊS DISPLAY ===
function atualizarMesDisplay() {
    const mesElement = document.getElementById('current-month');
    if (mesElement) {
        const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                       'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        mesElement.textContent = `${meses[mesAtual.getMonth()]} ${mesAtual.getFullYear()}`;
    }
}

// === AUTENTICAÇÃO ===
function verificarAutenticacao() {
    if (!firebaseConfigurado) {
        console.error('❌ Firebase não configurado');
        alert('Erro: Firebase não configurado. Configure o Firebase para usar esta funcionalidade.');
        return;
    }
    
    if (!auth) {
        console.error('❌ Auth não inicializado');
        return;
    }
    
    onAuthStateChanged(auth, (usuario) => {
        if (usuario) {
            usuarioAtual = usuario;
            console.log('✅ Usuário autenticado:', usuario.email);
            carregarCartoes();
        } else {
            console.log('⚠️ Usuário não autenticado - Redirecionando para login');
            window.location.href = '../Login/Login.html';
        }
    }, (error) => {
        console.error('❌ Erro no onAuthStateChanged:', error);
        window.location.href = '../Login/Login.html';
    });
}

// === CARREGAR CARTÕES DO FIREBASE ===
function carregarCartoes() {
    if (!usuarioAtual) {
        usarDadosExemplo();
        return;
    }
    
    mostrarLoading(true);
    
    try {
        const cartoesRef = collection(db, 'cartoes');
        const q = query(
            cartoesRef,
            where('usuarioId', '==', usuarioAtual.uid)
        );
        
        // Listener em tempo real
        onSnapshot(q, (snapshot) => {
            cartoes = [];
            
            snapshot.forEach((doc) => {
                const data = doc.data();
                // Filtrar apenas cartões ativos
                if (data.ativo !== false) {
                    cartoes.push({
                        id: doc.id,
                        ...data
                    });
                }
            });
            
            console.log('✅ Cartões carregados do Firebase:', cartoes.length);
            mostrarLoading(false);
            
            if (cartoes.length === 0) {
                console.log('ℹ️ Nenhum cartão encontrado no Firebase');
            }
            
            renderizarCartoes();
            atualizarResumo();
            
        }, (error) => {
            console.error('❌ Erro ao carregar cartões:', error);
            mostrarLoading(false);
            renderizarCartoes(); // Mostrar estado vazio ao invés de dados de exemplo
        });
        
    } catch (error) {
        console.error('Erro ao configurar listener:', error);
        mostrarLoading(false);
        usarDadosExemplo();
    }
}

// === DADOS DE EXEMPLO ===
// === RENDERIZAR CARTÕES ===
function renderizarCartoes() {
    const lista = document.getElementById('cartoes-list');
    const estadoVazio = document.getElementById('estado-vazio');
    
    if (!lista) return;
    
    if (cartoes.length === 0) {
        lista.style.display = 'none';
        estadoVazio.style.display = 'block';
        return;
    }
    
    lista.style.display = 'flex';
    estadoVazio.style.display = 'none';
    lista.innerHTML = '';
    
    cartoes.forEach(cartao => {
        const cartaoElement = criarCartaoElement(cartao);
        lista.appendChild(cartaoElement);
    });
}

// === CRIAR ELEMENTO DE CARTÃO ===
function criarCartaoElement(cartao) {
    const div = document.createElement('div');
    div.className = 'cartao-item';
    
    const percentualUtilizado = ((cartao.utilizado || 0) / (cartao.limite || 1) * 100).toFixed(1);
    const classeAlto = percentualUtilizado > 80 ? 'alto' : '';
    
    // Determinar ícone
    const isSVG = cartao.icone && (cartao.icone.endsWith('.svg') || cartao.icone.includes('/'));
    const corIcone = cartao.corIcone || '#21C25E';
    
    let iconeHTML = '';
    if (isSVG) {
        iconeHTML = `
            <div class="cartao-icone" style="background: ${corIcone}">
                <img src="${cartao.icone}" alt="${cartao.nomeBanco}" style="width: 28px; height: 28px; object-fit: contain;">
            </div>
        `;
    } else {
        iconeHTML = `
            <div class="cartao-icone" style="background: ${corIcone}">
                <span class="material-icons">${cartao.icone || 'credit_card'}</span>
            </div>
        `;
    }
    
    // Calcular data de fechamento
    const diaFechamento = cartao.diaFechamento || 1;
    const dataFechamento = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), diaFechamento);
    const dataFechamentoFormatada = `${String(dataFechamento.getDate()).padStart(2, '0')}/${String(dataFechamento.getMonth() + 1).padStart(2, '0')}`;
    
    div.innerHTML = `
        <div class="cartao-header">
            ${iconeHTML}
            <div class="cartao-info-header">
                <div class="cartao-nome">${cartao.nomeBanco || 'Cartão'}</div>
                <div class="cartao-bandeira">${cartao.bandeira || 'Bandeira'}</div>
            </div>
            <button class="botao-menu-cartao" onclick="event.stopPropagation(); abrirMenuCartao('${cartao.id}', this)">
                <span class="material-icons-round">more_vert</span>
            </button>
        </div>
        
        <div class="cartao-financeiro">
            <div class="financeiro-item">
                <span class="financeiro-label">Fatura parcial</span>
                <span class="financeiro-valor destaque">${formatarMoeda(cartao.valorFatura || 0)}</span>
            </div>
            <div class="financeiro-item">
                <span class="financeiro-label">Limite disponível</span>
                <span class="financeiro-valor">${formatarMoeda(cartao.disponivel || (cartao.limite - cartao.utilizado) || 0)}</span>
            </div>
        </div>
        
        <div class="cartao-progresso">
            <div class="progresso-info">
                <span class="progresso-texto">${formatarMoeda(cartao.utilizado || 0)} de ${formatarMoeda(cartao.limite || 0)}</span>
                <span class="progresso-percentual">${percentualUtilizado}%</span>
            </div>
            <div class="progresso-barra">
                <div class="progresso-preenchido ${classeAlto}" style="width: ${Math.min(percentualUtilizado, 100)}%"></div>
            </div>
        </div>
        
        <div class="cartao-rodape">
            <div class="cartao-data">
                <span class="material-icons-round">event</span>
                <span>Fecha em ${dataFechamentoFormatada}</span>
            </div>
        </div>
    `;
    
    return div;
}

// === ATUALIZAR RESUMO ===
function atualizarResumo() {
    let limiteTotal = 0;
    let valorFaturasTotal = 0;
    
    cartoes.forEach(cartao => {
        limiteTotal += cartao.limite || 0;
        valorFaturasTotal += cartao.valorFatura || 0;
    });
    
    const limiteTotalElement = document.getElementById('limite-total');
    const valorFaturasElement = document.getElementById('valor-faturas');
    
    if (limiteTotalElement) limiteTotalElement.textContent = formatarMoeda(limiteTotal);
    if (valorFaturasElement) valorFaturasElement.textContent = formatarMoeda(valorFaturasTotal);
}

// === LOADING ===
function mostrarLoading(mostrar) {
    const loading = document.getElementById('loading');
    const lista = document.getElementById('cartoes-list');
    const estadoVazio = document.getElementById('estado-vazio');
    
    if (mostrar) {
        loading.style.display = 'block';
        lista.style.display = 'none';
        estadoVazio.style.display = 'none';
    } else {
        loading.style.display = 'none';
    }
}

// === FILTRAR CARTÕES ===
function filtrarCartoes(termo) {
    if (!termo) {
        renderizarCartoes();
        return;
    }
    
    const lista = document.getElementById('cartoes-list');
    if (!lista) return;
    
    const termoLower = termo.toLowerCase();
    const cartoesFiltrados = cartoes.filter(cartao => 
        (cartao.nomeBanco || '').toLowerCase().includes(termoLower) ||
        (cartao.bandeira || '').toLowerCase().includes(termoLower)
    );
    
    lista.innerHTML = '';
    cartoesFiltrados.forEach(cartao => {
        const cartaoElement = criarCartaoElement(cartao);
        lista.appendChild(cartaoElement);
    });
}

// === APLICAR FILTROS ===
function aplicarFiltros() {
    const bandeira = document.getElementById('filtro-bandeira').value;
    const status = document.getElementById('filtro-status').value;
    
    let cartoesFiltrados = [...cartoes];
    
    if (bandeira) {
        cartoesFiltrados = cartoesFiltrados.filter(c => c.bandeira === bandeira);
    }
    
    if (status === 'aberta') {
        cartoesFiltrados = cartoesFiltrados.filter(c => (c.valorFatura || 0) > 0);
    } else if (status === 'fechada') {
        cartoesFiltrados = cartoesFiltrados.filter(c => (c.valorFatura || 0) === 0);
    }
    
    const lista = document.getElementById('cartoes-list');
    if (!lista) return;
    
    lista.innerHTML = '';
    cartoesFiltrados.forEach(cartao => {
        const cartaoElement = criarCartaoElement(cartao);
        lista.appendChild(cartaoElement);
    });
}

// === MENU POPUP DO CARTÃO ===
let menuAtual = null;
let cartaoAtualId = null;

window.abrirMenuCartao = function(cartaoId, botao) {
    // Fechar menu anterior se existir
    if (menuAtual) {
        menuAtual.remove();
    }
    
    cartaoAtualId = cartaoId;
    const cartao = cartoes.find(c => c.id === cartaoId);
    
    // Criar menu popup
    const menu = document.createElement('div');
    menu.className = 'menu-cartao-popup';
    menu.innerHTML = `
        <div class="menu-cartao-item" onclick="adicionarDespesaCartao('${cartaoId}')">
            <span class="material-icons-round">add_circle</span>
            <span>Adicionar despesa</span>
        </div>
        <div class="menu-cartao-item" onclick="editarCartao('${cartaoId}')">
            <span class="material-icons-round">edit</span>
            <span>Editar cartão</span>
        </div>
        <div class="menu-cartao-item menu-excluir" onclick="excluirCartao('${cartaoId}', '${(cartao?.nomeBanco || 'este cartão').replace(/'/g, "\\'")}')">
            <span class="material-icons-round">delete</span>
            <span>Excluir cartão</span>
        </div>
    `;
    
    // Posicionar menu próximo ao botão
    document.body.appendChild(menu);
    const rect = botao.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.top = `${rect.bottom + 8}px`;
    menu.style.right = `${window.innerWidth - rect.right}px`;
    
    menuAtual = menu;
    
    // Fechar ao clicar fora
    setTimeout(() => {
        document.addEventListener('click', fecharMenuCartao);
    }, 100);
};

function fecharMenuCartao(e) {
    if (menuAtual && !menuAtual.contains(e.target)) {
        menuAtual.remove();
        menuAtual = null;
        cartaoAtualId = null;
        document.removeEventListener('click', fecharMenuCartao);
    }
}

// === AÇÕES DOS CARTÕES ===
window.adicionarDespesaCartao = function(cartaoId) {
    console.log('Adicionar despesa para cartão:', cartaoId);
    // Redirecionar para Nova Despesa com o cartão selecionado
    window.location.href = `../Nova-Despesa/Nova-Despesa.html?cartao=${cartaoId}`;
};

window.editarCartao = function(cartaoId) {
    console.log('Editar cartão:', cartaoId);
    // Redirecionar para edição do cartão
    window.location.href = `../Editar-Cartao/Editar-Cartao.html?id=${cartaoId}`;
};

window.excluirCartao = function(cartaoId, nomeCartao) {
    // Fechar menu popup se estiver aberto
    if (menuAtual) {
        menuAtual.remove();
        menuAtual = null;
    }
    
    // Abrir modal de confirmação
    const modal = document.getElementById('modal-excluir-cartao');
    const nomeSpan = document.getElementById('nome-cartao-excluir');
    const btnConfirmar = document.getElementById('btn-confirmar-exclusao');
    const btnCancelar = document.getElementById('btn-cancelar-exclusao');
    
    nomeSpan.textContent = nomeCartao;
    modal.style.display = 'flex';
    
    // Remover listeners antigos
    const novoConfirmar = btnConfirmar.cloneNode(true);
    const novoCancelar = btnCancelar.cloneNode(true);
    btnConfirmar.parentNode.replaceChild(novoConfirmar, btnConfirmar);
    btnCancelar.parentNode.replaceChild(novoCancelar, btnCancelar);
    
    // Adicionar novos listeners
    novoConfirmar.addEventListener('click', async () => {
        modal.style.display = 'none';
        await executarExclusaoCartao(cartaoId, nomeCartao);
    });
    
    novoCancelar.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    // Fechar ao clicar no overlay
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
};

async function executarExclusaoCartao(cartaoId, nomeCartao) {
    try {
        if (!db) {
            console.error('Firebase não está configurado');
            alert('Erro: Firebase não configurado');
            return;
        }
        
        // Mostrar loading
        mostrarLoading(true);
        
        const cartaoRef = doc(db, 'cartoes', cartaoId);
        await deleteDoc(cartaoRef);
        
        mostrarLoading(false);
        
        console.log(`✅ Cartão "${nomeCartao}" excluído com sucesso`);
        
        // Mostrar toast de sucesso (opcional)
        mostrarToast(`Cartão "${nomeCartao}" excluído com sucesso!`, 'sucesso');
        
        // Os cartões serão recarregados automaticamente pelo listener
        
    } catch (error) {
        mostrarLoading(false);
        console.error('❌ Erro ao excluir cartão:', error);
        mostrarToast('Erro ao excluir cartão. Tente novamente.', 'erro');
    }
}

// === TOAST DE NOTIFICAÇÃO ===
function mostrarToast(mensagem, tipo = 'sucesso') {
    // Remover toast anterior se existir
    const toastAnterior = document.querySelector('.toast-notificacao');
    if (toastAnterior) {
        toastAnterior.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = `toast-notificacao toast-${tipo}`;
    
    const icone = tipo === 'sucesso' ? 'check_circle' : 'error';
    const cor = tipo === 'sucesso' ? '#10B981' : '#DC3545';
    
    toast.innerHTML = `
        <span class="material-icons-round" style="color: ${cor};">${icone}</span>
        <span>${mensagem}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Animar entrada
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Remover após 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

// === UTILITÁRIOS ===
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
    }).format(valor);
}

function toggleDropdown() {
    const dropdownMenu = document.querySelector('.dropdown-menu');
    dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
}

const tituloPagina = document.querySelector('.titulo-pagina');
tituloPagina.addEventListener('click', toggleDropdown);

console.log('✅ Script Lista de Cartões carregado');
