// === CONFIGURAÇÃO DO FIREBASE ===
let auth, db, firebaseConfigurado = false;

// Função para inicializar Firebase após DOM carregar
function inicializarFirebase() {
    try {
        if (typeof firebase === 'undefined') {
            console.error('❌ Firebase não está carregado');
            return false;
        }
        
        auth = firebase.auth();
        db = firebase.firestore();
        firebaseConfigurado = true;
        console.log('✅ Firebase configurado com sucesso');
        return true;
    } catch (error) {
        console.error('❌ Erro ao configurar Firebase:', error);
        firebaseConfigurado = false;
        return false;
    }
}

// === VARIÁVEIS GLOBAIS ===
let cartoesData = [];
let mesAtualCartoes = new Date();

// === INICIALIZAÇÃO ===
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando Lista de Cartões...');
    
    // Verificar se elementos existem
    const elementosChave = ['cartoes-list', 'limite-total', 'valor-faturas', 'mes-atual'];
    elementosChave.forEach(id => {
        const elemento = document.getElementById(id);
        console.log(`🔍 Elemento ${id}:`, elemento ? '✅ Encontrado' : '❌ Não encontrado');
    });
    
    // Inicializar Firebase
    if (!inicializarFirebase()) {
        console.error('❌ Falha ao inicializar Firebase, usando dados locais...');
        // Continuar mesmo sem Firebase
        criarDadosTeste();
    }
    
    configurarEventos();
    atualizarMesDisplay();
    
    // Se Firebase não estiver disponível, pular autenticação
    if (firebaseConfigurado) {
        verificarAutenticacao();
    } else {
        console.log('⚠️ Firebase não disponível, carregando dados locais...');
        carregarCartoesLocalStorage();
    }
    
    const dropdownMenu = document.querySelector('.dropdown-menu');
    if (dropdownMenu) {
        dropdownMenu.style.display = 'none';
    }
});

// === CONFIGURAR EVENTOS ===
function configurarEventos() {
    // Navegação de mês
    document.getElementById('prev-month')?.addEventListener('click', () => {
        mesAtualCartoes.setMonth(mesAtualCartoes.getMonth() - 1);
        atualizarMesDisplay();
        carregarCartoes();
    });
    
    document.getElementById('next-month')?.addEventListener('click', () => {
        mesAtualCartoes.setMonth(mesAtualCartoes.getMonth() + 1);
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

        if (dropdownMenu && dropdownMenu.style.display === 'block' && tituloPagina && !tituloPagina.contains(event.target)) {
            dropdownMenu.style.display = 'none';
        }
    });
}

// === ATUALIZAR MÊS DISPLAY ===
function atualizarMesDisplay() {
    const mesElement = document.getElementById('mes-atual');
    if (mesElement) {
        const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                       'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        mesElement.textContent = `${meses[mesAtualCartoes.getMonth()]} ${mesAtualCartoes.getFullYear()}`;
    }
}

// === AUTENTICAÇÃO ===
function verificarAutenticacao() {
    if (!firebaseConfigurado) {
        console.error('❌ Firebase não configurado, usando modo local');
        carregarCartoesLocalStorage();
        return;
    }
    
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('✅ Usuário autenticado:', user.email);
            carregarCartoes();
        } else {
            console.log('❌ Usuário não autenticado, usando dados locais para teste');
            carregarCartoesLocalStorage();
        }
    });
}

// === CARREGAR CARTÕES ===
function carregarCartoes() {
    if (!firebaseConfigurado) {
        console.error('❌ Firebase não configurado');
        return;
    }
    
    const user = auth.currentUser;
    if (!user) {
        console.error('❌ Usuário não autenticado');
        return;
    }
    
    console.log('🔄 Carregando cartões...');
    
    db.collection('cartoes')
        .where('userId', '==', user.uid)
        .get()
        .then((querySnapshot) => {
            cartoesData = [];
            querySnapshot.forEach((doc) => {
                cartoesData.push({ id: doc.id, ...doc.data() });
            });
            
            console.log(`📋 ${cartoesData.length} cartões carregados`);
            renderizarCartoes();
            atualizarResumo();
        })
        .catch((error) => {
            console.error('❌ Erro ao carregar cartões:', error);
            // Fallback para localStorage se Firebase falhar
            carregarCartoesLocalStorage();
        });
}

// === FALLBACK LOCALSTORAGE ===
function carregarCartoesLocalStorage() {
    console.log('📱 Carregando cartões do localStorage...');
    const dadosLocais = localStorage.getItem('cartoes');
    if (dadosLocais) {
        try {
            cartoesData = JSON.parse(dadosLocais);
            console.log(`📋 ${cartoesData.length} cartões carregados do localStorage`);
            renderizarCartoes();
            atualizarResumo();
        } catch (error) {
            console.error('❌ Erro ao carregar do localStorage:', error);
            criarDadosTeste();
        }
    } else {
        console.log('📭 Nenhum cartão encontrado no localStorage, criando dados de teste...');
        criarDadosTeste();
    }
}

// === LIMPAR DADOS DE TESTE ===
function limparDadosTeste() {
    localStorage.removeItem('cartoes');
    console.log('🧹 Dados de teste removidos do localStorage');
    location.reload();
}

// === ATUALIZAR DADOS DE TESTE ===
function atualizarDadosTeste() {
    localStorage.removeItem('cartoes');
    criarDadosTeste();
    console.log('🔄 Dados de teste atualizados com novos bancos');
}

// === CRIAR DADOS DE TESTE ===
function criarDadosTeste() {
    cartoesData = [
        {
            id: 'cartao1',
            nome: 'Nubank Roxinho',
            bandeira: 'Mastercard',
            limite: 5000,
            disponivel: 3500,
            valorFatura: 1500,
            ativo: true,
            vencimento: 15
        },
        {
            id: 'cartao2', 
            nome: 'Bradesco Visa',
            bandeira: 'Visa',
            limite: 3000,
            disponivel: 2000,
            valorFatura: 1000,
            ativo: true,
            vencimento: 10
        },
        {
            id: 'cartao3',
            nome: 'Itaú Click',
            bandeira: 'Visa',
            limite: 4000,
            disponivel: 3200,
            valorFatura: 800,
            ativo: true,
            vencimento: 5
        }
    ];
    
    // Ordenar por nome
    cartoesData.sort((a, b) => a.nome.localeCompare(b.nome));
    
    // Salvar no localStorage para próximas visitas
    localStorage.setItem('cartoes', JSON.stringify(cartoesData));
    console.log('✅ Dados de teste criados e salvos no localStorage');
    
    renderizarCartoes();
    atualizarResumo();
}

// === FUNÇÃO AUXILIAR PARA CRIAR CARTÃO ===
function criarElementoCartao(cartao) {
    // Definir cor baseada na bandeira
    const coresBandeiras = {
        'Visa': '#1a1f71',
        'Mastercard': '#eb001b', 
        'Elo': '#f79100',
        'American Express': '#006fcf',
        'Hipercard': '#e31e24'
    };
    
    // Definir cores específicas dos bancos
    const coresBancos = {
        'Itau': '#ec7000',
        'ITAU': '#ec7000',
        'Itaú': '#ec7000',
        'ITAÚ': '#ec7000',
        'Bradesco': '#cc092f',
        'BRADESCO': '#cc092f',
        'Nubank': '#820ad1',
        'NUBANK': '#820ad1'
    };
    
    // Detectar banco pelo nome do cartão
    let banco = '';
    let iconeSvg = '';
    let corCartao = coresBandeiras[cartao.bandeira] || '#007bff';
    
    const nomeCartao = cartao.nome.toLowerCase();
    
    // Verificar Itaú
    if (nomeCartao.includes('itau') || nomeCartao.includes('itaú') || 
        nomeCartao.includes('ita') && nomeCartao.includes('u')) {
        banco = 'Itaú';
        iconeSvg = '../Icon/itau.svg';
        corCartao = coresBancos['Itaú'];
    } 
    // Verificar Bradesco
    else if (nomeCartao.includes('bradesco') || nomeCartao.includes('brad')) {
        banco = 'Bradesco';
        iconeSvg = '../Icon/bradesco.svg';
        corCartao = coresBancos['Bradesco'];
    } 
    // Verificar Nubank
    else if (nomeCartao.includes('nubank') || nomeCartao.includes('roxinho') || 
             nomeCartao.includes('nu bank') || nomeCartao.includes('nu')) {
        banco = 'Nubank';
        iconeSvg = '../Icon/Nubank.svg';
        corCartao = coresBancos['Nubank'];
    }
    // Verificar outros bancos comuns
    else if (nomeCartao.includes('santander')) {
        banco = 'Santander';
        iconeSvg = '../Icon/santander.svg';
        corCartao = '#ec0000';
    }
    else if (nomeCartao.includes('bb') || nomeCartao.includes('banco do brasil')) {
        banco = 'Banco do Brasil';
        iconeSvg = '../Icon/banco-do-brasil.svg';
        corCartao = '#fbb034';
    }
    else if (nomeCartao.includes('caixa')) {
        banco = 'Caixa';
        iconeSvg = '../Icon/caixa.svg';
        corCartao = '#0066cc';
    }
    else if (nomeCartao.includes('picpay')) {
        banco = 'PicPay';
        iconeSvg = '../Icon/picpay.svg';
        corCartao = '#21c25e';
    }
    
    // Calcular percentual usado
    const limitePorcentagem = cartao.limite > 0 ? Math.round(((cartao.valorFatura || 0) / cartao.limite) * 100) : 0;
    
    const itemCartao = document.createElement('div');
    itemCartao.className = 'cartao-credito-home';
    itemCartao.style.cursor = 'pointer';
    
    // Adicionar evento de clique para navegar para despesas do cartão sem filtro
    itemCartao.addEventListener('click', (e) => {
        // Evitar navegação se clicar nos botões de ação
        if (e.target.closest('.btn-acao')) {
            return;
        }
        console.log('📱 Navegando para todas as despesas de cartão');
        window.location.href = '../Lista-de-despesas-cartao/Lista-de-despesas-cartao.html';
    });
    
    itemCartao.innerHTML = `
        <div class="cartao-credito-header">
            <div class="cartao-credito-left">
                <div class="cartao-credito-icone conta-ux-icone-svg" style="background: ${corCartao};">
                    ${iconeSvg ? 
                        `<img src="${iconeSvg}" alt="${banco}" style="width:28px;height:28px;object-fit:contain;">` : 
                        `<span class="material-icons-round">credit_card</span>`
                    }
                </div>
                <div class="cartao-credito-info">
                    <h4>${cartao.nome}</h4>
                    <p class="cartao-bandeira">${cartao.bandeira || 'Sem bandeira'}</p>
                </div>
            </div>
            <div class="cartao-credito-valores">
                <div class="fatura-atual">
                    <div class="label">Fatura Atual</div>
                    <div class="valor">R$ ${(cartao.valorFatura || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                </div>
                <div class="limite-total">
                    <div class="label">Limite</div>
                    <div class="valor">R$ ${(cartao.limite || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</div>
                </div>
            </div>
            <div class="cartao-acoes">
                <button onclick="editarCartao('${cartao.id}')" class="btn-acao" title="Editar cartão">
                    <span class="material-icons-round">edit</span>
                </button>
                <button onclick="excluirCartao('${cartao.id}')" class="btn-acao" title="Excluir cartão">
                    <span class="material-icons-round">delete</span>
                </button>
            </div>
        </div>
        <div class="cartao-credito-barra">
            <div class="barra-progresso">
                <div class="barra-preenchida" style="width: ${limitePorcentagem}%; background-color: ${corCartao};"></div>
            </div>
            <span class="porcentagem">${limitePorcentagem}%</span>
        </div>
    `;
    
    return itemCartao;
}

// === RENDERIZAR CARTÕES ===
function renderizarCartoes() {
    const listaCartoes = document.getElementById('cartoes-list');
    if (!listaCartoes) return;
    
    if (cartoesData.length === 0) {
        listaCartoes.innerHTML = `
            <div class="estado-vazio">
                <p>Nenhum cartão encontrado</p>
            </div>
        `;
        return;
    }
    
    listaCartoes.innerHTML = '';
    
    // Ordenar cartões por nome
    const cartoesOrdenados = [...cartoesData].sort((a, b) => a.nome.localeCompare(b.nome));
    
    cartoesOrdenados.forEach(cartao => {
        const itemCartao = criarElementoCartao(cartao);
        listaCartoes.appendChild(itemCartao);
    });
}

// === ATUALIZAR RESUMO ===
function atualizarResumo() {
    const totalCartoes = cartoesData.length;
    const limiteTotal = cartoesData.reduce((total, cartao) => total + (cartao.limite || 0), 0);
    const valorFaturas = cartoesData.reduce((total, cartao) => total + (cartao.valorFatura || 0), 0);
    
    // Atualizar elementos que existem no HTML
    const limiteTotalEl = document.getElementById('limite-total');
    const valorFaturasEl = document.getElementById('valor-faturas');
    
    if (limiteTotalEl) {
        limiteTotalEl.textContent = `R$ ${limiteTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    }
    if (valorFaturasEl) {
        valorFaturasEl.textContent = `R$ ${valorFaturas.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    }
    
    console.log(`📊 Resumo: ${totalCartoes} cartões, Limite: R$ ${limiteTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}, Faturas: R$ ${valorFaturas.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`);
}

// === FILTRAR CARTÕES ===
function filtrarCartoes(termo) {
    if (!termo) {
        renderizarCartoes();
        return;
    }
    
    const cartoesFiltrados = cartoesData.filter(cartao => 
        cartao.nome.toLowerCase().includes(termo.toLowerCase()) ||
        (cartao.bandeira && cartao.bandeira.toLowerCase().includes(termo.toLowerCase()))
    );
    
    const listaCartoes = document.getElementById('cartoes-list');
    if (!listaCartoes) return;
    
    if (cartoesFiltrados.length === 0) {
        listaCartoes.innerHTML = `
            <div class="estado-vazio">
                <p>Nenhum cartão encontrado para "${termo}"</p>
            </div>
        `;
        return;
    }
    
    listaCartoes.innerHTML = '';
    
    cartoesFiltrados.forEach(cartao => {
        const itemCartao = criarElementoCartao(cartao);
        listaCartoes.appendChild(itemCartao);
    });
}

// === APLICAR FILTROS ===
function aplicarFiltros() {
    const filtroBandeira = document.getElementById('filtro-bandeira').value;
    const filtroStatus = document.getElementById('filtro-status').value;
    
    let cartoesFiltrados = [...cartoesData];
    
    if (filtroBandeira) {
        cartoesFiltrados = cartoesFiltrados.filter(cartao => 
            cartao.bandeira && cartao.bandeira.toLowerCase().includes(filtroBandeira.toLowerCase())
        );
    }
    
    if (filtroStatus) {
        if (filtroStatus === 'ativo') {
            cartoesFiltrados = cartoesFiltrados.filter(cartao => cartao.ativo !== false);
        } else if (filtroStatus === 'inativo') {
            cartoesFiltrados = cartoesFiltrados.filter(cartao => cartao.ativo === false);
        }
    }
    
    const listaCartoes = document.getElementById('cartoes-list');
    if (!listaCartoes) return;
    
    if (cartoesFiltrados.length === 0) {
        listaCartoes.innerHTML = `
            <div class="estado-vazio">
                <p>Nenhum cartão encontrado com os filtros aplicados</p>
            </div>
        `;
        return;
    }
    
    listaCartoes.innerHTML = '';
    
    cartoesFiltrados.forEach(cartao => {
        const itemCartao = criarElementoCartao(cartao);
        listaCartoes.appendChild(itemCartao);
    });
}

// === EDITAR CARTÃO ===
function editarCartao(cartaoId) {
    console.log(`✏️ Editando cartão: ${cartaoId}`);
    // Implementar edição
    alert('Funcionalidade de edição em desenvolvimento');
}

// === EXCLUIR CARTÃO ===
function excluirCartao(cartaoId) {
    if (!confirm('Tem certeza que deseja excluir este cartão?')) {
        return;
    }
    
    if (!firebaseConfigurado) {
        console.error('❌ Firebase não configurado');
        return;
    }
    
    db.collection('cartoes').doc(cartaoId).delete()
        .then(() => {
            console.log('✅ Cartão excluído com sucesso');
            carregarCartoes();
        })
        .catch((error) => {
            console.error('❌ Erro ao excluir cartão:', error);
            alert('Erro ao excluir cartão');
        });
}

// === FUNÇÕES AUXILIARES ===
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

function formatarData(data) {
    return new Date(data).toLocaleDateString('pt-BR');
}

// Debug: Verificar se Firebase está disponível
console.log('🔍 Firebase disponível:', typeof firebase !== 'undefined');
console.log('🔍 Auth disponível:', typeof firebase !== 'undefined' && firebase.auth);
console.log('🔍 Firestore disponível:', typeof firebase !== 'undefined' && firebase.firestore);

// === FUNÇÃO DE TESTE MANUAL ===
window.testarCartoes = function() {
    console.log('🧪 Iniciando teste manual...');
    
    // Verificar elementos
    const listaCartoes = document.getElementById('cartoes-list');
    const limiteTotal = document.getElementById('limite-total');
    const valorFaturas = document.getElementById('valor-faturas');
    
    console.log('📋 Lista cartões:', listaCartoes);
    console.log('💰 Limite total:', limiteTotal); 
    console.log('📄 Valor faturas:', valorFaturas);
    
    // Não sobrescrever dados reais, apenas mostrar informações
    console.log('✅ Elementos verificados! Não sobrescrevendo dados reais.');
};

// Expor funções para o console
window.limparDadosTeste = limparDadosTeste;
window.atualizarDadosTeste = atualizarDadosTeste;

// Função para testar dropdown
window.testarDropdown = function() {
    console.log('🧪 Testando dropdown...');
    const dropdown = document.getElementById('dropdown-menu');
    const titulo = document.querySelector('.titulo-pagina');
    
    console.log('Dropdown elemento:', dropdown);
    console.log('Título elemento:', titulo);
    console.log('Dropdown display atual:', dropdown ? dropdown.style.display : 'não encontrado');
    
    if (dropdown && titulo) {
        // Forçar mostrar dropdown
        dropdown.style.display = 'block';
        dropdown.style.pointerEvents = 'auto';
        console.log('✅ Dropdown forçado a aparecer');
    } else {
        console.log('❌ Elementos não encontrados');
    }
};