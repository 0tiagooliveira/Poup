// Adicione isso ANTES do DOMContentLoaded
let firebaseApp, auth, googleProvider;

// Mapeamento de bancos para ícones SVG
const bancosIcones = {
    'Nubank': '../Icon/Nubank.svg',
    'Banco do Brasil': '../Icon/banco-do-brasil.svg',
    'Bradesco': '../Icon/bradesco.svg',
    'Itaú': '../Icon/itau.svg',
    'Santander': '../Icon/santander.svg',
    'Caixa': '../Icon/caixa.svg',
    'PicPay': '../Icon/picpay.svg'
};

// Função para obter ícone do banco
function obterIconeBanco(conta) {
    // Se o ícone já é um SVG path, retorna ele mesmo
    if (conta.icone && conta.icone.includes('.svg')) {
        return conta.icone;
    }
    
    // Se tem o campo banco definido, usa o mapeamento
    if (conta.banco && bancosIcones[conta.banco]) {
        return bancosIcones[conta.banco];
    }
    
    // Fallback para ícone material
    return null;
}

(function initFirebase() {
    if (typeof firebase !== "undefined") {
        if (!firebase.apps.length) {
            firebaseApp = firebase.initializeApp({
                apiKey: "AIzaSyC7RB9fULmkp9xeJIjc0dL58atHJ8CM-Xc",
                authDomain: "poup-beta.firebaseapp.com",
                projectId: "poup-beta",
                storageBucket: "poup-beta.appspot.com",
                messagingSenderId: "954695915981",
                appId: "1:954695915981:web:d31b216f79eac178094c84",
                measurementId: "G-LP9BDVD3KJ"
            });
        }
        auth = firebase.auth();
        googleProvider = new firebase.auth.GoogleAuthProvider();
    }
})();

// Inicialização principal
document.addEventListener('DOMContentLoaded', function() {
    mostrarLoading();
    console.log('Verificando autenticação...');
    if (auth) {
        auth.onAuthStateChanged(user => {
            const loadingOverlay = document.getElementById('loading-overlay');
            const containerApp = document.querySelector('.container-app');
            if (user) {
                setTimeout(() => { // UX: pequena espera para suavidade
                    esconderLoading();
                    if (containerApp) containerApp.style.display = 'block';
                }, 350);
                inicializarComponentes(user);
            } else {
                esconderLoading();
                window.location.href = '../Login/Login.html';
            }
        });
    } else {
        esconderLoading();
        alert('Erro ao carregar Firebase. Verifique sua configuração.');
    }

    // Adiciona event listeners aos botões dos popups
    const popupExcluirConta = document.getElementById('popup-excluir-conta');
    const popupExcluirCancelar = document.getElementById('popup-excluir-cancelar');
    const popupExcluirConfirmar = document.getElementById('popup-excluir-confirmar');
    const popupExcluirContaCustom = document.getElementById('popup-excluir-conta-custom');
    const popupExcluirContaMsg = document.getElementById('popup-excluir-conta-msg');
    const popupExcluirContaNao = document.getElementById('popup-excluir-conta-nao');
    const popupExcluirContaSim = document.getElementById('popup-excluir-conta-sim');

    // Torne as funções de popup globais
    let contaParaExcluirId = null;
    window.mostrarPopupExcluirConta = function(contaId, mensagem) {
        contaParaExcluirId = contaId;
        if (popupExcluirContaMsg && popupExcluirContaCustom) {
            popupExcluirContaMsg.textContent = mensagem;
            popupExcluirContaCustom.style.display = 'flex';
        }
    }
    window.fecharPopupExcluirConta = function() {
        if (popupExcluirContaCustom) popupExcluirContaCustom.style.display = 'none';
        contaParaExcluirId = null;
    }

    // Event listener para o botão "Não" no popup customizado
    if (popupExcluirContaNao) {
        popupExcluirContaNao.addEventListener('click', () => {
            window.fecharPopupExcluirConta();
        });
    }

    // Event listener para o botão "Sim" no popup customizado
    if (popupExcluirContaSim) {
        popupExcluirContaSim.addEventListener('click', () => {
            if (contaParaExcluirId) {
                excluirConta(contaParaExcluirId);
            }
            window.fecharPopupExcluirConta();
        });
    }

    // Função para excluir a conta
    function excluirConta(contaId) {
        console.log('Excluindo conta com ID:', contaId);
        const db = firebase.firestore();
        db.collection('contas').doc(contaId).delete()
            .then(() => {
                console.log('Conta excluída com sucesso!');
                mostrarToast('Conta excluída!');
                if (auth.currentUser) carregarContasHome(auth.currentUser.uid);
            })
            .catch(error => {
                console.error('Erro ao excluir conta:', error);
                mostrarToast('Erro ao excluir conta', '#ef233c');
            });
    }

    // Troca de mês pelos botões
    document.querySelector('.botao-mes.anterior').addEventListener('click', function() {
        mesSelecionado--;
        if (mesSelecionado < 0) {
            mesSelecionado = 11;
            anoSelecionado--;
        }
        atualizarSeletorMes();
        if (auth.currentUser) atualizarSaldoMes(auth.currentUser.uid);
    });
    document.querySelector('.botao-mes.proximo').addEventListener('click', function() {
        mesSelecionado++;
        if (mesSelecionado > 11) {
            mesSelecionado = 0;
            anoSelecionado++;
        }
        atualizarSeletorMes();
        if (auth.currentUser) atualizarSaldoMes(auth.currentUser.uid);
    });
    // Troca de mês pelo select
    document.querySelector('.seletor-mes').addEventListener('change', function() {
        mesSelecionado = this.selectedIndex;
        if (auth.currentUser) atualizarSaldoMes(auth.currentUser.uid);
    });

    // Ao carregar a página, garanta que o seletor de mês está correto
    atualizarSeletorMes();

    // Clique nos cartões de receitas/despesas (cartão-lista-ux)
    document.querySelectorAll('.cartao-receitas.cartao-lista-ux').forEach(card => {
        card.addEventListener('click', function(e) {
            // Evita navegação se clicar em botão interno
            if (!e.target.classList.contains('botao-mini-ux')) {
                window.location.href = '../Lista-de-receitas/Lista-de-receitas.html';
            }
        });
    });
    document.querySelectorAll('.cartao-despesas.cartao-lista-ux').forEach(card => {
        card.addEventListener('click', function(e) {
            if (!e.target.classList.contains('botao-mini-ux')) {
                window.location.href = '../Lista-de-despesas/Lista-de-despesas.html';
            }
        });
    });
});

// Variáveis globais para mês/ano selecionado
let mesSelecionado, anoSelecionado;
(function setMesAnoInicial() {
    const hoje = new Date();
    mesSelecionado = hoje.getMonth();
    anoSelecionado = hoje.getFullYear();
})();

// Função para atualizar o seletor de mês
function atualizarSeletorMes() {
    const seletorMes = document.querySelector('.seletor-mes');
    if (!seletorMes) return;
    seletorMes.selectedIndex = mesSelecionado;
}

// Função para atualizar saldo ao trocar mês
function atualizarSaldoMes(uid) {
    calcularSaldoTotalMesAtual(uid, mesSelecionado, anoSelecionado);
}

// Função principal de inicialização dos componentes da Home
function inicializarComponentes(user) {
    console.log('Inicializando componentes para o usuário:', user.uid);

    const elementos = {
        avatarUsuarioBtn: document.getElementById('avatar-usuario-btn'),
        menuUsuario: document.getElementById('menu-usuario'),
        sairBtn: document.getElementById('sair-btn'),
        nomeUsuario: document.querySelector('.nome-usuario'),
    };

    if (elementos.nomeUsuario) {
        elementos.nomeUsuario.textContent = user.displayName || user.email;
    }

    configurarEventos(elementos);
    carregarDadosDaHome(user.uid);

    // Calcular saldo total do mês atual
    calcularSaldoTotalMesAtual(user.uid);
    calcularValorTotalReceitas(user.uid);
    calcularValorTotalDespesas(user.uid);
}

// Configura eventos de clique e interação da Home
function configurarEventos(elementos) {
    console.log('Configurando eventos de clique...');
    if (elementos.avatarUsuarioBtn) {
        elementos.avatarUsuarioBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (elementos.menuUsuario) {
                elementos.menuUsuario.classList.toggle('mostrar');
            }
        });
    }
    if (elementos.sairBtn) {
        elementos.sairBtn.addEventListener('click', function(e) {
            e.preventDefault();
            auth.signOut().then(() => {
                console.log('Usuário deslogado com sucesso.');
                window.location.href = '../index.html';
            });
        });
    }
    document.addEventListener('click', function(e) {
        if (elementos.menuUsuario && !elementos.menuUsuario.contains(e.target) && !elementos.avatarUsuarioBtn.contains(e.target)) {
            elementos.menuUsuario.classList.remove('mostrar');
        }
    });

    // Filtros dos gráficos (exemplo)
    document.querySelectorAll('.botao-filtro-receita').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.botao-filtro-receita').forEach(b => b.classList.remove('ativo'));
            this.classList.add('ativo');
            // Chame função para filtrar receitas por período/categoria se desejar
        });
    });
    document.querySelectorAll('.botao-filtro').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.botao-filtro').forEach(b => b.classList.remove('ativo'));
            this.classList.add('ativo');
            // Chame função para filtrar despesas por período/categoria se desejar
        });
    });
}

// Carrega todos os dados necessários para a Home
function carregarDadosDaHome(userId) {
    console.log(`Buscando dados da home para o usuário: ${userId}`);
    carregarContasHome(userId);
    carregarResumoReceitas(userId);
    carregarReceitasHome(userId);
    carregarDespesasHome(userId);
    carregarCartoesCreditoHome(userId);
}

// Carrega contas do Firestore e renderiza na Home
function carregarContasHome(uid) {
    console.log('[Home] Buscando contas para o usuário:', uid);
    firebase.firestore().collection('contas')
        .where('userId', '==', uid)
        .get()
        .then(snapshot => {
            let contas = [];
            snapshot.forEach(doc => {
                contas.push({ ...doc.data(), id: doc.id });
            });
            // ORDENA por nome (opcional, mas deixa igual ao select de contas)
            contas.sort((a, b) => {
                const nomeA = (a.nome || a.descricao || '').toLowerCase();
                const nomeB = (b.nome || b.descricao || '').toLowerCase();
                return nomeA.localeCompare(nomeB);
            });
            console.log('[Home] Total de contas carregadas:', contas.length, contas);

            const container = document.getElementById('container-contas-home');
            const vazio = document.getElementById('cartao-estado-vazio-contas');
            const botaoNovaContaContainer = document.getElementById('botao-nova-conta-container');
            container.innerHTML = '';
            if (contas.length === 0) {
                vazio.style.display = 'block';
                if (botaoNovaContaContainer) botaoNovaContaContainer.style.display = 'none';
            } else {
                vazio.style.display = 'none';
                if (botaoNovaContaContainer) botaoNovaContaContainer.style.display = 'flex';
                contas.forEach(conta => {
                    const div = document.createElement('div');
                    div.className = 'conta-home-card-ux';
                    // Verificar se deve usar SVG ou ícone material
                    let iconeSvg = obterIconeBanco(conta);

                    // Força Nubank a sempre usar SVG mesmo se não houver conta.icone
                    if (!iconeSvg && conta.banco === 'Nubank') {
                        iconeSvg = bancosIcones['Nubank'];
                    }

                    if (iconeSvg) {
                        // Usar SVG do banco
                        div.innerHTML = `
                            <div class="conta-ux-esquerda">
                                <div class="conta-ux-icone conta-ux-icone-svg" style="
                                    background: ${conta.cor || '#21C25E'} !important;
                                    background-image: none !important;
                                    border: none !important;
                                    border-radius: 50% !important;
                                    width: 54px !important;
                                    height: 54px !important;
                                    display: flex !important; 
                                    align-items: center !important; 
                                    justify-content: center !important;
                                    box-shadow: 0 4px 16px rgba(33,194,94,0.10);">
                                    <img src="${iconeSvg}" alt="${conta.banco || 'Banco'}" style="
                                        width: 32px; 
                                        height: 32px; 
                                        object-fit: contain;
                                    ">
                                </div>
                                <div class="conta-ux-info">
                                    <div class="conta-ux-nome" title="${conta.nome || conta.descricao || 'Conta'}">${conta.nome || conta.descricao || 'Conta'}</div>
                                    <div class="conta-ux-tipo">${conta.tipo || 'Conta bancária'}</div>
                                </div>
                            </div>
                            <div class="conta-ux-direita">
                                <div class="conta-ux-saldo" title="Saldo atual">${(conta.saldo || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                                <button class="botao-excluir-conta" data-conta-id="${conta.id}" title="Excluir conta" aria-label="Excluir conta">
                                    <span class="material-icons-round">delete</span>
                                </button>
                            </div>
                        `;
                    } else {
                        // Usar ícone material original
                        div.innerHTML = `
                            <div class="conta-ux-esquerda">
                                <div class="conta-ux-icone" style="
                                    background: linear-gradient(135deg, ${conta.cor || '#e8f5ee'} 60%, #fff 100%);
                                    box-shadow: 0 4px 16px rgba(33,194,94,0.10);
                                    border: 2px solid ${conta.cor || '#21C25E22'};
                                    display: flex; align-items: center; justify-content: center;">
                                    <span class="material-icons-round" style="
                                        color:${conta.corIcone || '#21C25E'};
                                        font-size:2.4rem;
                                        filter: drop-shadow(0 2px 4px rgba(33,194,94,0.10));
                                        ">
                                        ${conta.iconeBanco || conta.icone || 'account_balance_wallet'}
                                    </span>
                                </div>
                                <div class="conta-ux-info">
                                    <div class="conta-ux-nome" title="${conta.nome || conta.descricao || 'Conta'}">${conta.nome || conta.descricao || 'Conta'}</div>
                                    <div class="conta-ux-tipo">${conta.tipo || 'Conta bancária'}</div>
                                </div>
                            </div>
                            <div class="conta-ux-direita">
                                <div class="conta-ux-saldo" title="Saldo atual">${(conta.saldo || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                                <button class="botao-excluir-conta" data-conta-id="${conta.id}" title="Excluir conta" aria-label="Excluir conta">
                                    <span class="material-icons-round">delete</span>
                                </button>
                            </div>
                        `;
                    }
                    div.style.opacity = 0;
                    div.style.transform = 'translateY(18px) scale(0.98)';
                    setTimeout(() => {
                        div.style.transition = 'opacity 0.5s, transform 0.5s';
                        div.style.opacity = 1;
                        div.style.transform = 'translateY(0) scale(1)';
                    }, 10);
                    container.appendChild(div);
                });
            }
            // Chame também o carregamento dos cartões de crédito aqui
            carregarCartoesCreditoHome(uid);
        })
        .catch(error => {
            console.error('[Home] Erro ao buscar contas:', error);
        });
}

// Carrega cartões de crédito do Firestore e renderiza na Home
function carregarCartoesCreditoHome(uid) {
    console.log('[Home] Buscando cartões de crédito para o usuário:', uid);
    // Tenta buscar, mas trata erro de permissão de forma amigável
    firebase.firestore().collection('cartoes')
        .where('userId', '==', uid)
        .get()
        .then(snapshot => {
            let cartoes = [];
            snapshot.forEach(doc => {
                cartoes.push({ ...doc.data(), id: doc.id });
            });
            console.log('[Home] Total de cartões de crédito carregados:', cartoes.length);
            // Aqui você pode renderizar os cartões na tela, se desejar
        })
        .catch(error => {
            if (
                error.code === 'permission-denied' ||
                (error.message && error.message.includes('Missing or insufficient permissions'))
            ) {
                console.warn('[Home] Permissão insuficiente para buscar cartões de crédito. Coleção "cartoes" não está acessível para este usuário.');
            } else {
                console.error('[Home] Erro ao buscar cartões de crédito:', error);
            }
        });
}

// Carrega resumo de receitas (total recebido) e chama gráfico de receitas por categoria
function carregarResumoReceitas(userId) {
    if (typeof firebase === "undefined" || !firebase.firestore) {
        console.error('Firebase não disponível para carregar receitas.');
        return;
    }
    const db = firebase.firestore();
    db.collection('receitas')
        .where('userId', '==', userId)
        .get()
        .then(snapshot => {
            let totalRecebido = 0;
            let receitas = [];
            snapshot.forEach(doc => {
                const receita = doc.data();
                receitas.push(receita);
                const valor = parseFloat((receita.valor || '0').toString().replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
                const recebido = receita.recebido !== false;
                if (recebido) totalRecebido += valor;
            });
            const valorReceitas = document.querySelector('.valor-receitas');
            if (valorReceitas) {
                atualizarValorComAnimacao(valorReceitas, totalRecebido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
            }
            console.log(`[Home] Total de receitas carregadas: ${receitas.length}, total recebido: ${totalRecebido}`);
            carregarGraficoReceitasPorCategoria(userId, receitas);
        })
        .catch(error => {
            console.error('[Home] Erro ao buscar receitas do Firestore:', error);
        });
}

// Renderiza receitas na Home (máx 3, visual consistente e valores corretos)
function carregarReceitasHome(uid) {
    firebase.firestore().collection('receitas')
        .where('userId', '==', uid)
        .get()
        .then(snapshot => {
            let receitas = [];
            let totalReceitas = 0;
            snapshot.forEach(doc => {
                const receita = doc.data();
                receitas.push(receita);
                if (receita.recebido !== false) {
                    let valor = receita.valor;
                    if (typeof valor === 'string') {
                        valor = valor.replace(/[^\d,.-]/g, '').replace(',', '.');
                        valor = parseFloat(valor) || 0;
                    } else {
                        valor = Number(valor) || 0;
                    }
                    totalReceitas += valor;
                }
            });
            const valorReceitasEl = document.querySelector('.valor-receitas');
            if (valorReceitasEl) {
                valorReceitasEl.textContent = totalReceitas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            }
            const listaHome = document.getElementById('lista-receitas-home');
            if (listaHome) {
                listaHome.innerHTML = '';
                if (receitas.length === 0) {
                    listaHome.innerHTML = `<div style="text-align:center;color:#888;padding:24px 0;">
                        <span class="material-icons-round" style="font-size:2.2rem;opacity:0.3;">receipt_long</span>
                        <div style="margin-top:8px;">Nenhuma receita cadastrada.</div>
                    </div>`;
                } else {
                    receitas.slice(0, 3).forEach(receita => {
                        let valor = receita.valor;
                        if (typeof valor === 'string') {
                            valor = valor.replace(/[^\d,.-]/g, '').replace(',', '.');
                            valor = parseFloat(valor) || 0;
                        } else {
                            valor = Number(valor) || 0;
                        }
                        const div = document.createElement('div');
                        div.className = 'item-mini-ux receita';
                        div.innerHTML = `
                            <span class="mini-icone receita"><span class="material-icons-round" style="color:#21C25E;background:#e8f5ee;">savings</span></span>
                            <span class="mini-descricao">${receita.descricao || '-'}</span>
                            <span class="mini-data">${receita.data || ''}</span>
                            <span class="mini-valor" style="color:#21C25E;">${valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        `;
                        listaHome.appendChild(div);
                    });
                }
            }
            carregarGraficoReceitasPorCategoria(uid, receitas);
        })
        .catch(error => {
            console.error('[Home] Erro ao buscar receitas:', error);
        });
}

// Renderiza despesas na Home (máx 3, visual consistente e valores corretos)
function carregarDespesasHome(uid) {
    firebase.firestore().collection('despesas')
        .where('userId', '==', uid)
        .get()
        .then(snapshot => {
            let despesas = [];
            let totalDespesas = 0;
            snapshot.forEach(doc => {
                const despesa = doc.data();
                despesas.push(despesa);
                if (despesa.pago !== false) {
                    let valor = despesa.valor;
                    if (typeof valor === 'string') {
                        valor = valor.replace(/[^\d,.-]/g, '').replace(',', '.');
                        valor = parseFloat(valor) || 0;
                    } else {
                        valor = Number(valor) || 0;
                    }
                    totalDespesas += valor;
                }
            });
            const valorDespesasEl = document.querySelector('.valor-despesas');
            if (valorDespesasEl) {
                atualizarValorComAnimacao(valorDespesasEl, totalDespesas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
            }
            const listaHome = document.getElementById('lista-despesas-home');
            if (listaHome) {
                listaHome.innerHTML = '';
                if (despesas.length === 0) {
                    listaHome.innerHTML = `<div style="text-align:center;color:#888;padding:24px 0;">
                        <span class="material-icons-round" style="font-size:2.2rem;opacity:0.3;">shopping_cart</span>
                        <div style="margin-top:8px;">Nenhuma despesa cadastrada.</div>
                    </div>`;
                } else {
                    despesas.slice(0, 3).forEach(despesa => {
                        let valor = despesa.valor;
                        if (typeof valor === 'string') {
                            valor = valor.replace(/[^\d,.-]/g, '').replace(',', '.');
                            valor = parseFloat(valor) || 0;
                        } else {
                            valor = Number(valor) || 0;
                        }
                        const div = document.createElement('div');
                        div.className = 'item-mini-ux despesa';
                        div.innerHTML = `
                            <span class="mini-icone despesa"><span class="material-icons-round" style="color:#ef233c;background:#fee7ea;">shopping_cart</span></span>
                            <span class="mini-descricao">${despesa.descricao || '-'}</span>
                            <span class="mini-data">${despesa.data || ''}</span>
                            <span class="mini-valor" style="color:#ef233c;">${valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        `;
                        listaHome.appendChild(div);
                    });
                }
            }
            carregarGraficoDespesasPorCategoria(uid, despesas);
        })
        .catch(error => {
            console.error('[Home] Erro ao buscar despesas:', error);
        });
}

// Variáveis globais para gráficos Chart.js
let graficoReceitasCategoria = null;
let graficoDespesasCategoria = null;

// Ícones globais para gráficos de categoria (evita ReferenceError)
const icones = [
    'shopping_cart', 'home', 'check_circle', 'star', 'payments', 'attach_money', 'local_offer', 'category'
];

// Gráfico de receitas por categoria com lista lateral de categorias (estilo gráfico 2)
function carregarGraficoReceitasPorCategoria(uid, receitas) {
    console.log('[Home] Montando gráfico de receitas por categoria...');
    let categorias = {};
    let total = 0;
    let categoriaIcones = {}; // Mapeia categoria -> ícone

    receitas.forEach(receita => {
        if (receita.categoria) {
            const valor = parseFloat((receita.valor || '0').toString().replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
            categorias[receita.categoria] = (categorias[receita.categoria] || 0) + valor;
            total += valor;
            // Captura o ícone personalizado se existir
            if (receita.iconeCategoria) {
                categoriaIcones[receita.categoria] = receita.iconeCategoria;
            } else if (receita.icone) {
                categoriaIcones[receita.categoria] = receita.icone;
            }
        }
    });

    const labels = Object.keys(categorias);
    const data = Object.values(categorias);

    // DESTROI O GRÁFICO ANTERIOR SE EXISTIR
    if (graficoReceitasCategoria) {
        graficoReceitasCategoria.destroy();
        graficoReceitasCategoria = null;
    }

    // Defina tons de verde para receitas, maior categoria = verde principal
    const tonsVerde = [
        '#21C25E', '#48bb78', '#43e97b', '#b2f7cc', '#4fd1c5', '#38a169', '#81e6d9', '#2ecc71'
    ];

    const containerReceitas = document.getElementById('cartao-estado-ativo-receitas');
    const vazioReceitas = document.getElementById('cartao-estado-vazio-receitas');

    if (labels.length > 0) {
        // Ordena categorias por valor decrescente para identificar a maior
        const ordenadas = labels.map((cat, idx) => ({ cat, valor: data[idx] }))
            .sort((a, b) => b.valor - a.valor);
        // Reordena labels/data para que a maior fique em primeiro (verde principal)
        const labelsOrdenadas = ordenadas.map(o => o.cat);
        const dataOrdenada = ordenadas.map(o => o.valor);

        const ctx = document.getElementById('grafico-receitas-categoria').getContext('2d');
        graficoReceitasCategoria = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labelsOrdenadas,
                datasets: [{
                    data: dataOrdenada,
                    backgroundColor: tonsVerde.slice(0, labelsOrdenadas.length)
                }]
            },
            options: {
                responsive: true,
                cutout: '70%',
                plugins: {
                    legend: { display: false }
                }
            }
        });

        document.getElementById('valor-total-receitas').textContent = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        // Monta lista lateral de categorias com barra de progresso, ícone, valor e %
        const listaCategorias = document.getElementById('lista-categorias-receitas');
        if (listaCategorias) {
            listaCategorias.innerHTML = '';
            labelsOrdenadas.forEach((cat, idx) => {
                const valor = dataOrdenada[idx];
                const percent = total > 0 ? Math.round((valor / total) * 100) : 0;
                const cor = tonsVerde[idx % tonsVerde.length];
                // Busca ícone personalizado, senão usa padrão
                let icone = categoriaIcones[cat] || 'category';
                // Se for um ícone padrão, pode usar material-icons-round, senão material-symbols-outlined
                listaCategorias.innerHTML += `
                    <div class="grafico-categoria-item">
                        <div class="grafico-categoria-icone" style="background:${cor}22;">
                            <span class="material-icons-round" style="color:${cor};font-size:1.35rem;">${icone}</span>
                        </div>
                        <div class="grafico-categoria-info">
                            <div class="grafico-categoria-nome">${cat}</div>
                            <div class="grafico-categoria-barra">
                                <div class="grafico-categoria-barra-preenchida" style="width:${percent}%;background:${cor};"></div>
                            </div>
                        </div>
                        <div class="grafico-categoria-valores">
                            <span class="grafico-categoria-valor">${valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            <span class="grafico-categoria-percent">${percent}%</span>
                        </div>
                    </div>
                `;
            });
        }

        if (containerReceitas) containerReceitas.style.display = 'flex';
        if (vazioReceitas) vazioReceitas.style.display = 'none';
        console.log('[Home] Gráfico de receitas por categoria criado.');
    } else {
        if (containerReceitas) containerReceitas.style.display = 'none';
        if (vazioReceitas) vazioReceitas.style.display = 'flex';
        const listaCategorias = document.getElementById('lista-categorias-receitas');
        if (listaCategorias) listaCategorias.innerHTML = '';
        console.log('[Home] Nenhuma receita para gráfico de categoria.');
    }
}

// Gráfico de despesas por categoria com lista lateral de categorias (estilo gráfico 2)
function carregarGraficoDespesasPorCategoria(uid, despesas) {
    console.log('[Home] Montando gráfico de despesas por categoria...');
    let categorias = {};
    let total = 0;
    despesas.forEach(despesa => {
        if (despesa.categoria) {
            const valor = parseFloat((despesa.valor || '0').toString().replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
            categorias[despesa.categoria] = (categorias[despesa.categoria] || 0) + valor;
            total += valor;
        }
    });
    const labels = Object.keys(categorias);
    const data = Object.values(categorias);

    if (graficoDespesasCategoria) {
        graficoDespesasCategoria.destroy();
        graficoDespesasCategoria = null;
    }

    // Defina tons de vermelho para despesas, maior categoria = vermelho principal
    const tonsVermelho = [
        '#EF233C', // Vermelho principal (maior categoria)
        '#FF6B6B', // Vermelho claro
        '#FF8C69', // Laranja avermelhado
        '#FFD6D6', // Rosa claro
        '#FFB347', // Laranja
        '#C0392B', // Vermelho escuro
        '#FF7675', // Rosa vibrante
        '#B22234'  // Vermelho escuro
    ];

    const containerDespesas = document.getElementById('cartao-estado-ativo-categorias');
    const vazioDespesas = document.getElementById('cartao-estado-vazio-categorias');

    if (labels.length > 0) {
        // Ordena categorias por valor decrescente para identificar a maior
        const ordenadas = labels.map((cat, idx) => ({ cat, valor: data[idx] }))
            .sort((a, b) => b.valor - a.valor);
        // Reordena labels/data para que a maior fique em primeiro (vermelho principal)
        const labelsOrdenadas = ordenadas.map(o => o.cat);
        const dataOrdenada = ordenadas.map(o => o.valor);

        const ctx = document.getElementById('grafico-despesas-categoria').getContext('2d');
        graficoDespesasCategoria = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labelsOrdenadas,
                datasets: [{
                    data: dataOrdenada,
                    backgroundColor: tonsVermelho.slice(0, labelsOrdenadas.length)
                }]
            },
            options: {
                responsive: true,
                cutout: '70%',
                plugins: {
                    legend: { display: false }
                }
            }
        });

        document.getElementById('valor-total-despesas').textContent = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        const listaCategorias = document.getElementById('lista-categorias-despesas');
        if (listaCategorias) {
            listaCategorias.innerHTML = '';
            labelsOrdenadas.forEach((cat, idx) => {
                const valor = dataOrdenada[idx];
                const percent = total > 0 ? Math.round((valor / total) * 100) : 0;
                const cor = tonsVermelho[idx % tonsVermelho.length];
                const icone = icones[idx % icones.length];
                const item = document.createElement('div');
                item.className = 'grafico-categoria-item';
                item.innerHTML = `
                    <div class="grafico-categoria-icone" style="background:${cor}22;">
                        <span class="material-icons-round" style="color:${cor};font-size:1.35rem;">${icone}</span>
                    </div>
                    <div class="grafico-categoria-info">
                        <div class="grafico-categoria-nome">${cat}</div>
                        <div class="grafico-categoria-barra">
                            <div class="grafico-categoria-barra-preenchida" style="width:${percent}%;background:${cor};"></div>
                        </div>
                    </div>
                    <div class="grafico-categoria-valores">
                        <span class="grafico-categoria-valor">${valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        <span class="grafico-categoria-percent">${percent}%</span>
                    </div>
                `;
                listaCategorias.appendChild(item);
            });
        }

        if (containerDespesas) containerDespesas.style.display = 'flex';
        if (vazioDespesas) vazioDespesas.style.display = 'none';
        console.log('[Home] Gráfico de despesas por categoria criado.');
    } else {
        if (containerDespesas) containerDespesas.style.display = 'none';
        if (vazioDespesas) vazioDespesas.style.display = 'flex';
        const listaCategorias = document.getElementById('lista-categorias-despesas');
        if (listaCategorias) listaCategorias.innerHTML = '';
        console.log('[Home] Nenhuma despesa para gráfico de categoria.');
    }
}

// Renderiza contas e esconde/mostra cartão vazio
function carregarContasHome(uid) {
    console.log('[Home] Buscando contas para o usuário:', uid);
    firebase.firestore().collection('contas')
        .where('userId', '==', uid)
        .get()
        .then(snapshot => {
            let contas = [];
            snapshot.forEach(doc => {
                contas.push({ ...doc.data(), id: doc.id });
            });
            // ORDENA por nome (opcional, mas deixa igual ao select de contas)
            contas.sort((a, b) => {
                const nomeA = (a.nome || a.descricao || '').toLowerCase();
                const nomeB = (b.nome || b.descricao || '').toLowerCase();
                return nomeA.localeCompare(nomeB);
            });
            console.log('[Home] Total de contas carregadas:', contas.length, contas);

            const container = document.getElementById('container-contas-home');
            const vazio = document.getElementById('cartao-estado-vazio-contas');
            const botaoNovaContaContainer = document.getElementById('botao-nova-conta-container');
            container.innerHTML = '';
            if (contas.length === 0) {
                vazio.style.display = 'block';
                if (botaoNovaContaContainer) botaoNovaContaContainer.style.display = 'none';
            } else {
                vazio.style.display = 'none';
                if (botaoNovaContaContainer) botaoNovaContaContainer.style.display = 'flex';
                contas.forEach(conta => {
                    const div = document.createElement('div');
                    div.className = 'conta-home-card-ux';
                    // Verificar se deve usar SVG ou ícone material
                    let iconeSvg = obterIconeBanco(conta);

                    // Força Nubank a sempre usar SVG mesmo se não houver conta.icone
                    if (!iconeSvg && conta.banco === 'Nubank') {
                        iconeSvg = bancosIcones['Nubank'];
                    }

                    if (iconeSvg) {
                        // Usar SVG do banco
                        div.innerHTML = `
                            <div class="conta-ux-esquerda">
                                <div class="conta-ux-icone conta-ux-icone-svg" style="
                                    background: ${conta.cor || '#21C25E'} !important;
                                    background-image: none !important;
                                    border: none !important;
                                    border-radius: 50% !important;
                                    width: 54px !important;
                                    height: 54px !important;
                                    display: flex !important; 
                                    align-items: center !important; 
                                    justify-content: center !important;
                                    box-shadow: 0 4px 16px rgba(33,194,94,0.10);">
                                    <img src="${iconeSvg}" alt="${conta.banco || 'Banco'}" style="
                                        width: 32px; 
                                        height: 32px; 
                                        object-fit: contain;
                                    ">
                                </div>
                                <div class="conta-ux-info">
                                    <div class="conta-ux-nome" title="${conta.nome || conta.descricao || 'Conta'}">${conta.nome || conta.descricao || 'Conta'}</div>
                                    <div class="conta-ux-tipo">${conta.tipo || 'Conta bancária'}</div>
                                </div>
                            </div>
                            <div class="conta-ux-direita">
                                <div class="conta-ux-saldo" title="Saldo atual">${(conta.saldo || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                                <button class="botao-excluir-conta" data-conta-id="${conta.id}" title="Excluir conta" aria-label="Excluir conta">
                                    <span class="material-icons-round">delete</span>
                                </button>
                            </div>
                        `;
                    } else {
                        // Usar ícone material original
                        div.innerHTML = `
                            <div class="conta-ux-esquerda">
                                <div class="conta-ux-icone" style="
                                    background: linear-gradient(135deg, ${conta.cor || '#e8f5ee'} 60%, #fff 100%);
                                    box-shadow: 0 4px 16px rgba(33,194,94,0.10);
                                    border: 2px solid ${conta.cor || '#21C25E22'};
                                    display: flex; align-items: center; justify-content: center;">
                                    <span class="material-icons-round" style="
                                        color:${conta.corIcone || '#21C25E'};
                                        font-size:2.4rem;
                                        filter: drop-shadow(0 2px 4px rgba(33,194,94,0.10));
                                        ">
                                        ${conta.iconeBanco || conta.icone || 'account_balance_wallet'}
                                    </span>
                                </div>
                                <div class="conta-ux-info">
                                    <div class="conta-ux-nome" title="${conta.nome || conta.descricao || 'Conta'}">${conta.nome || conta.descricao || 'Conta'}</div>
                                    <div class="conta-ux-tipo">${conta.tipo || 'Conta bancária'}</div>
                                </div>
                            </div>
                            <div class="conta-ux-direita">
                                <div class="conta-ux-saldo" title="Saldo atual">${(conta.saldo || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                                <button class="botao-excluir-conta" data-conta-id="${conta.id}" title="Excluir conta" aria-label="Excluir conta">
                                    <span class="material-icons-round">delete</span>
                                </button>
                            </div>
                        `;
                    }
                    div.style.opacity = 0;
                    div.style.transform = 'translateY(18px) scale(0.98)';
                    setTimeout(() => {
                        div.style.transition = 'opacity 0.5s, transform 0.5s';
                        div.style.opacity = 1;
                        div.style.transform = 'translateY(0) scale(1)';
                    }, 10);
                    container.appendChild(div);
                });
            }
            // Chame também o carregamento dos cartões de crédito aqui
            carregarCartoesCreditoHome(uid);
        })
        .catch(error => {
            console.error('[Home] Erro ao buscar contas:', error);
        });
}

// Exemplo de carregamento de cartões de crédito
function carregarCartoesCreditoHome(uid) {
    console.log('[Home] Buscando cartões de crédito para o usuário:', uid);
    // Tenta buscar, mas trata erro de permissão de forma amigável
    firebase.firestore().collection('cartoes')
        .where('userId', '==', uid)
        .get()
        .then(snapshot => {
            let cartoes = [];
            snapshot.forEach(doc => {
                cartoes.push({ ...doc.data(), id: doc.id });
            });
            console.log('[Home] Total de cartões de crédito carregados:', cartoes.length);
            // Aqui você pode renderizar os cartões na tela, se desejar
        })
        .catch(error => {
            if (
                error.code === 'permission-denied' ||
                (error.message && error.message.includes('Missing or insufficient permissions'))
            ) {
                console.warn('[Home] Permissão insuficiente para buscar cartões de crédito. Coleção "cartoes" não está acessível para este usuário.');
            } else {
                console.error('[Home] Erro ao buscar cartões de crédito:', error);
            }
        });
}

// Eventos para popup de exclusão de conta (mantém apenas este listener global)
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('botao-excluir-conta') || event.target.closest('.botao-excluir-conta')) {
        const btn = event.target.closest('.botao-excluir-conta');
        const contaId = btn.getAttribute('data-conta-id');
        // Mostra o popup customizado
        mostrarPopupExcluirConta(contaId, 'Tem certeza que deseja excluir esta conta?');
    }
});

// UX: Mostra loading animado enquanto carrega dados
function mostrarLoading(msg = "Carregando...") {
    let overlay = document.getElementById('loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.style = "position:fixed;top:0;left:0;width:100vw;height:100vh;background:#fff;z-index:9999;display:flex;flex-direction:column;justify-content:center;align-items:center;";
        document.body.appendChild(overlay);
    }
    overlay.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;">
            <div class="spinner" style="margin-bottom:18px;width:48px;height:48px;border:6px solid #e0e0e0;border-top:6px solid #21C25E;border-radius:50%;animation:spin 1s linear infinite;"></div>
            <p style="font-family:'Poppins',sans-serif;font-size:1.1rem;color:#333;">${msg}</p>
        </div>
        <style>
        @keyframes spin { 0%{transform:rotate(0deg);} 100%{transform:rotate(360deg);} }
        </style>
    `;
    overlay.style.display = 'flex';
}
function esconderLoading() {
    let overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.style.display = 'none';
}

// UX: Feedback visual ao atualizar valores
function atualizarValorComAnimacao(el, novoValor) {
    if (!el) return;
    el.textContent = novoValor;
    el.style.transition = 'background 0.4s';
    el.style.background = '#e8f5ee';
    setTimeout(() => { el.style.background = 'transparent'; }, 600);
}

// UX: Animação ao adicionar/remover contas/despesas/receitas
function animarEntradaElemento(el) {
    if (!el) return;
    el.style.opacity = 0;
    el.style.transform = 'translateY(16px)';
    setTimeout(() => {
        el.style.transition = 'opacity 0.5s, transform 0.5s';
        el.style.opacity = 1;
        el.style.transform = 'translateY(0)';
    }, 10);
}

// UX: Mensagem amigável se não houver dados
function mostrarMensagemVazia(container, mensagem, icone = 'info') {
    if (!container) return;
    container.innerHTML = `
        <div style="text-align:center;padding:40px 0;color:#888;">
            <span class="material-icons-round" style="font-size:48px;margin-bottom:12px;opacity:0.4;">${icone}</span>
            <div style="font-size:1.1rem;">${mensagem}</div>
        </div>
    `;
}

// Função para obter o mês atual no formato MM/YYYY
function getMesAnoAtual() {
    const hoje = new Date();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();
    return `${mes}/${ano}`;
}

// Função para verificar se uma data está no mês atual
function isDataNoMesAtual(dataStr) {
    if (!dataStr) return false;
    // Suporta formatos dd/mm/yyyy ou yyyy-mm-dd
    let mesAno;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataStr)) {
        const [dia, mes, ano] = dataStr.split('/');
        mesAno = `${mes}/${ano}`;
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
        const [ano, mes] = dataStr.split('-');
        mesAno = `${mes}/${ano}`;
    } else {
        return false;
    }
    return mesAno === getMesAnoAtual();
}

// Função para calcular o saldo total do mês atual
function calcularSaldoTotalMesAtual(uid) {
    let saldoInicial = 0;
    let totalReceitas = 0;
    let totalDespesas = 0;
    let totalTransfEntrada = 0;
    let totalTransfSaida = 0;

    // 1. Buscar contas ativas e somar saldo inicial
    firebase.firestore().collection('contas')
        .where('userId', '==', uid)
        .where('ativa', '==', true)
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                const conta = doc.data();
                saldoInicial += parseFloat(conta.saldoInicial || conta.saldo || 0);
            });

            // 2. Buscar todas as receitas efetivadas (recebido !== false)
            return firebase.firestore().collection('receitas')
                .where('userId', '==', uid)
                .get();
        })
        .then(snapshot => {
            snapshot.forEach(doc => {
                const receita = doc.data();
                if (receita.recebido !== false) {
                    totalReceitas += parseFloat((receita.valor || '0').toString().replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
                }
            });

            // 3. Buscar todas as despesas efetivadas (pago !== false)
            return firebase.firestore().collection('despesas')
                .where('userId', '==', uid)
                .get();
        })
        .then(snapshot => {
            snapshot.forEach(doc => {
                const despesa = doc.data();
                if (despesa.pago !== false) {
                    totalDespesas += parseFloat((despesa.valor || '0').toString().replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
                }
            });

            // 4. Buscar todas as transferências
            return firebase.firestore().collection('transferencias')
                .where('userId', '==', uid)
                .get();
        })
        .then(snapshot => {
            snapshot.forEach(doc => {
                const transf = doc.data();
                const valor = parseFloat((transf.valor || '0').toString().replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
                if (transf.tipo === 'entrada') {
                    totalTransfEntrada += valor;
                } else if (transf.tipo === 'saida') {
                    totalTransfSaida += valor;
                }
            });

            // 5. Calcular saldo total conforme solicitado
            const saldoAtual = saldoInicial + totalReceitas + totalTransfEntrada - totalDespesas - totalTransfSaida;
            const saldoEl = document.querySelector('.valor-saldo');
            if (saldoEl) {
                saldoEl.textContent = saldoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            }
            console.log(`[Home] Saldo Inicial: ${saldoInicial}, Receitas: ${totalReceitas}, Transf. Entrada: ${totalTransfEntrada}, Despesas: ${totalDespesas}, Transf. Saída: ${totalTransfSaida}, Saldo Atual: ${saldoAtual}`);
        })
        .catch(error => {
            if (
                error.code === 'permission-denied' ||
                (error.message && error.message.includes('Missing or insufficient permissions'))
            ) {
                console.warn('[Home] Permissão insuficiente para calcular saldo total. Coleção "contas", "receitas", "despesas" ou "transferencias" não está acessível para este usuário.');
            } else {
                console.error('[Home] Erro ao calcular saldo total:', error);
            }
        });
}

// Função para verificar se uma data está no mês/ano selecionado
function isDataNoMesSelecionado(dataStr, mes, ano) {
    if (!dataStr) return false;
    let dataObj;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dataStr)) {
        const [dia, mesStr, anoStr] = dataStr.split('/');
        dataObj = new Date(`${anoStr}-${mesStr}-${dia}`);
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) {
        const [anoStr, mesStr, dia] = dataStr.split('-');
        dataObj = new Date(`${anoStr}-${mesStr}-${dia}`);
    } else {
        return false;
    }
    return dataObj.getMonth() === mes && dataObj.getFullYear() === ano;
}

// Substitua a função calcularSaldoTotalMesAtual por esta versão corrigida:
function calcularSaldoTotalMesAtual(uid) {
    let saldoInicial = 0;
    let totalReceitas = 0;
    let totalDespesas = 0;
    let totalTransfEntrada = 0;
    let totalTransfSaida = 0;

    // 1. Buscar contas ativas e somar saldo inicial
    firebase.firestore().collection('contas')
        .where('userId', '==', uid)
        .where('ativa', '==', true)
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                const conta = doc.data();
                saldoInicial += parseFloat(conta.saldoInicial || conta.saldo || 0);
            });

            // 2. Buscar todas as receitas efetivadas (recebido !== false)
            return firebase.firestore().collection('receitas')
                .where('userId', '==', uid)
                .get();
        })
        .then(snapshot => {
            snapshot.forEach(doc => {
                const receita = doc.data();
                // Só soma receitas efetivadas e com categoria válida
                if (
                    receita.recebido !== false &&
                    receita.categoria &&
                    receita.categoria !== '-' &&
                    receita.categoria !== 'Selecione uma categoria' &&
                    receita.categoria !== 'category'
                ) {
                    totalReceitas += parseFloat((receita.valor || '0').toString().replace(/\./g, '').replace(',', '.')) || 0;
                }
            });

            // 3. Buscar todas as despesas efetivadas (pago !== false)
            return firebase.firestore().collection('despesas')
                .where('userId', '==', uid)
                .get();
        })
        .then(snapshot => {
            snapshot.forEach(doc => {
                const despesa = doc.data();
                // Só soma despesas efetivadas e com categoria válida
                if (
                    despesa.pago !== false &&
                    despesa.categoria &&
                    despesa.categoria !== '-' &&
                    despesa.categoria !== 'Selecione uma categoria' &&
                    despesa.categoria !== 'category'
                ) {
                    totalDespesas += parseFloat((despesa.valor || '0').toString().replace(/\./g, '').replace(',', '.')) || 0;
                }
            });

            // 4. Buscar todas as transferências
            return firebase.firestore().collection('transferencias')
                .where('userId', '==', uid)
                .get();
        })
        .then(snapshot => {
            snapshot.forEach(doc => {
                const transf = doc.data();
                const valor = parseFloat((transf.valor || '0').toString().replace(/\./g, '').replace(',', '.')) || 0;
                if (transf.tipo === 'entrada') {
                    totalTransfEntrada += valor;
                } else if (transf.tipo === 'saida') {
                    totalTransfSaida += valor;
                }
            });

            // 5. Calcular saldo total conforme solicitado
            const saldoAtual = saldoInicial + totalReceitas + totalTransfEntrada - totalDespesas - totalTransfSaida;
            const saldoEl = document.querySelector('.valor-saldo');
            if (saldoEl) {
                saldoEl.textContent = saldoAtual.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            }
            // Opcional: atualizar indicador de variação vs mês anterior
            atualizarIndicadorSaldo(uid, saldoAtual);
            console.log(`[Home] Saldo Inicial: ${saldoInicial}, Receitas: ${totalReceitas}, Transf. Entrada: ${totalTransfEntrada}, Despesas: ${totalDespesas}, Transf. Saída: ${totalTransfSaida}, Saldo Atual: ${saldoAtual}`);
        })
        .catch(error => {
            if (
                error.code === 'permission-denied' ||
                (error.message && error.message.includes('Missing or insufficient permissions'))
            ) {
                console.warn('[Home] Permissão insuficiente para calcular saldo total. Coleção "contas", "receitas", "despesas" ou "transferencias" não está acessível para este usuário.');
            } else {
                console.error('[Home] Erro ao calcular saldo total:', error);
            }
        });
}

// Opcional: Atualiza o indicador de variação do saldo vs mês anterior
function atualizarIndicadorSaldo(uid, saldoAtual) {
    // Busca saldo do mês anterior e calcula variação percentual
    const hoje = new Date();
    let mesAnterior = hoje.getMonth() - 1;
    let anoAnterior = hoje.getFullYear();
    if (mesAnterior < 0) {
        mesAnterior = 11;
        anoAnterior--;
    }
    // Repete a lógica do saldo, mas para o mês anterior
    let saldoAnterior = 0;
    let totalReceitas = 0;
    let totalDespesas = 0;
    let totalTransfEntrada = 0;
    let totalTransfSaida = 0;

    firebase.firestore().collection('contas')
        .where('userId', '==', uid)
        .where('ativa', '==', true)
        .get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                const conta = doc.data();
                saldoAnterior += parseFloat(conta.saldoInicial || conta.saldo || 0);
            });
            return firebase.firestore().collection('receitas')
                .where('userId', '==', uid)
                .get();
        })
        .then(snapshot => {
            snapshot.forEach(doc => {
                const receita = doc.data();
                if (
                    receita.recebido !== false &&
                    receita.categoria &&
                    receita.categoria !== '-' &&
                    receita.categoria !== 'Selecione uma categoria' &&
                    receita.categoria !== 'category' &&
                    isDataNoMesSelecionado(receita.data, mesAnterior, anoAnterior)
                ) {
                    totalReceitas += parseFloat((receita.valor || '0').toString().replace(/\./g, '').replace(',', '.')) || 0;
                }
            });
            return firebase.firestore().collection('despesas')
                .where('userId', '==', uid)
                .get();
        })
        .then(snapshot => {
            snapshot.forEach(doc => {
                const despesa = doc.data();
                if (
                    despesa.pago !== false &&
                    despesa.categoria &&
                    despesa.categoria !== '-' &&
                    despesa.categoria !== 'Selecione uma categoria' &&
                    despesa.categoria !== 'category' &&
                    isDataNoMesSelecionado(despesa.data, mesAnterior, anoAnterior)
                ) {
                    totalDespesas += parseFloat((despesa.valor || '0').toString().replace(/\./g, '').replace(',', '.')) || 0;
                }
            });
            return firebase.firestore().collection('transferencias')
                .where('userId', '==', uid)
                .get();
        })
        .then(snapshot => {
            snapshot.forEach(doc => {
                const transf = doc.data();
                if (isDataNoMesSelecionado(transf.data, mesAnterior, anoAnterior)) {
                    const valor = parseFloat((transf.valor || '0').toString().replace(/\./g, '').replace(',', '.')) || 0;
                    if (transf.tipo === 'entrada') {
                        totalTransfEntrada += valor;
                    } else if (transf.tipo === 'saida') {
                        totalTransfSaida += valor;
                    }
                }
            });
            const saldoAnteriorFinal = saldoAnterior + totalReceitas + totalTransfEntrada - totalDespesas - totalTransfSaida;
            const indicadorEl = document.querySelector('.indicador-saldo span:last-child');
            if (indicadorEl) {
                let variacao = 0;
                if (saldoAnteriorFinal !== 0) {
                    variacao = ((saldoAtual - saldoAnteriorFinal) / Math.abs(saldoAnteriorFinal)) * 100;
                }
                indicadorEl.textContent = `${variacao.toFixed(0)}% vs mês anterior`;
            }
        });
}

// UX: Toast para feedback rápido
function mostrarToast(mensagem, cor = "#21C25E") {
    let toast = document.getElementById('toast-ux');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-ux';
        toast.style = "position:fixed;bottom:32px;left:50%;transform:translateX(-50%);background:"+cor+";color:#fff;padding:14px 32px;border-radius:24px;font-family:'Poppins',sans-serif;font-size:1rem;z-index:99999;box-shadow:0 4px 16px rgba(0,0,0,0.13);opacity:0;transition:opacity 0.4s;";
        document.body.appendChild(toast);
    }
    toast.textContent = mensagem;
    toast.style.opacity = 1;
    setTimeout(() => { toast.style.opacity = 0; }, 2200);
}

// Função para calcular e exibir o valor total das receitas
function calcularValorTotalReceitas(uid) {
    firebase.firestore().collection('receitas')
        .where('userId', '==', uid)
        .get()
        .then(snapshot => {
            let total = 0;
            snapshot.forEach(doc => {
                const receita = doc.data();
                if (receita.recebido !== false) {
                    let valor = receita.valor;
                    if (typeof valor === 'string') {
                        valor = valor.replace(/[^\d,.-]/g, '').replace(',', '.');
                        valor = parseFloat(valor) || 0;
                    } else {
                        valor = Number(valor) || 0;
                    }
                    total += valor;
                }
            });
            const el = document.querySelectorAll('.valor-receitas');
            el.forEach(e => e.textContent = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
        });
}

// Função para calcular e exibir o valor total das despesas
function calcularValorTotalDespesas(uid) {
    firebase.firestore().collection('despesas')
        .where('userId', '==', uid)
        .get()
        .then(snapshot => {
            let total = 0;
            snapshot.forEach(doc => {
                const despesa = doc.data();
                if (despesa.pago !== false) {
                    let valor = despesa.valor;
                    if (typeof valor === 'string') {
                        valor = valor.replace(/[^\d,.-]/g, '').replace(',', '.');
                        valor = parseFloat(valor) || 0;
                    } else {
                        valor = Number(valor) || 0;
                    }
                    total += valor;
                }
            });
            const el = document.querySelectorAll('.valor-despesas');
            el.forEach(e => e.textContent = total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }));
        });
}

// ATENÇÃO: Para resolver os erros de permissão do Firestore, você precisa ajustar as regras de segurança do Firestore no console do Firebase.
// Siga o passo a passo abaixo:

/*
1. Acesse o console do Firebase: https://console.firebase.google.com/
2. No menu lateral, clique em "Firestore Database" e depois na aba "Regras".
3. Para desenvolvimento, use temporariamente as regras abaixo para permitir acesso apenas a usuários autenticados:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}

4. Clique em "Publicar" para salvar as regras.

5. Para produção, utilize regras mais restritivas, por exemplo:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /contas/{contaId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    match /receitas/{receitaId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    match /despesas/{despesaId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    match /cartoes/{cartaoId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    match /transferencias/{transfId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}

6. Clique em "Publicar" novamente.

IMPORTANTE: Nunca deixe as regras abertas (allow read, write: if true) em produção!
*/

// JavaScript para os botões de ação radiais
document.addEventListener('DOMContentLoaded', function() {
    const botaoAcaoPrincipal = document.getElementById('botao-acao-principal');
    const acoesSecundarias = document.getElementById('acoes-secundarias');
    const acoesRadiaisOverlay = document.getElementById('acoes-radiais-overlay');
    
    if (botaoAcaoPrincipal && acoesSecundarias && acoesRadiaisOverlay) {
        let acoesAbertas = false;
        
        // Função para abrir/fechar as ações
        function toggleAcoes() {
            acoesAbertas = !acoesAbertas;
            
            if (acoesAbertas) {
                botaoAcaoPrincipal.classList.add('ativo');
                acoesSecundarias.classList.add('ativo');
                acoesRadiaisOverlay.classList.add('ativo');
            } else {
                botaoAcaoPrincipal.classList.remove('ativo');
                acoesSecundarias.classList.remove('ativo');
                acoesRadiaisOverlay.classList.remove('ativo');
            }
        }
        
        // Evento do botão principal
        botaoAcaoPrincipal.addEventListener('click', toggleAcoes);
        
        // Evento do overlay para fechar
        acoesRadiaisOverlay.addEventListener('click', function() {
            if (acoesAbertas) {
                toggleAcoes();
            }
        });
        
        // Fechar com ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && acoesAbertas) {
                toggleAcoes();
            }
        });
    }
});