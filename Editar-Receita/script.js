// --- Variáveis globais auxiliares ---
let contasCache = {}; // id -> objeto conta
let receitaCarregadaGlobal = null; // guarda receita carregada para reprocessar conta depois
let tentativasAtualizarConta = 0;

// Função auxiliar para mostrar mensagens com toast elegante
function mostrarPopupMensagem(mensagem, tipo = 'info') {
    // Criar elemento do toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span class="material-icons toast-icon">
                ${tipo === 'success' ? 'check_circle' : tipo === 'error' ? 'error' : 'info'}
            </span>
            <span class="toast-message">${mensagem}</span>
        </div>
    `;
    
    // Adicionar estilos inline para garantir que funcione
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${tipo === 'success' ? '#22c55e' : tipo === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 12px;
        font-family: 'Inter', sans-serif;
        font-size: 14px;
        font-weight: 500;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    // Adicionar ao body
    document.body.appendChild(toast);
    
    // Remover após 3 segundos
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
    
    // Adicionar animações CSS se não existirem
    if (!document.querySelector('#toast-animations')) {
        const style = document.createElement('style');
        style.id = 'toast-animations';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Função auxiliar para verificar se o Firebase está disponível
function verificarFirebase() {
    if (typeof firebase === 'undefined') {
        console.warn('Firebase não está disponível');
        return false;
    }
    return true;
}

// Função para carregar dados da receita existente
function carregarReceitaExistente(receitaId) {
    console.log('Carregando receita existente com ID:', receitaId);
    
    if (!verificarFirebase()) {
        mostrarPopupMensagem('Modo desenvolvimento: usando dados fictícios');
        return;
    }
    
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            firebase.firestore().collection('receitas').doc(receitaId).get()
                .then(doc => {
                    if (doc.exists) {
                        const receitaOriginal = doc.data();
                        console.log('Receita carregada:', receitaOriginal);
                        receitaCarregadaGlobal = { id: receitaId, ...receitaOriginal };
                        preencherFormulario(receitaCarregadaGlobal);
                    } else {
                        mostrarPopupMensagem('Receita não encontrada. Redirecionando...');
                        setTimeout(() => {
                            window.location.href = '../Lista-de-receitas/Lista-de-receitas.html';
                        }, 2000);
                    }
                })
                .catch(error => {
                    console.error('Erro ao carregar receita:', error);
                    mostrarPopupMensagem('Erro ao carregar receita. Tente novamente.');
                });
        } else {
            // Usuário não autenticado, redirecionar para login
            setTimeout(() => {
                window.location.href = '../Login/Login.html';
            }, 1000);
        }
    });
}

// Função para preencher formulário com dados da receita
function preencherFormulario(receita) {
    console.log('Preenchendo formulário com dados da receita...');
    
    // Preencher valor
    if (receita.valor) {
        const valorReceita = document.getElementById('valor-receita');
        if (valorReceita) {
            // Função para converter valor brasileiro para número
            const parseValueToNumber = (value) => {
                if (typeof value === 'number') return value;
                if (!value) return 0;
                
                // Converter string para número respeitando formato brasileiro
                let cleanValue = value.toString().replace(/[^\d,.-]/g, '');
                
                // Se tem ponto E vírgula, ponto é separador de milhares
                if (cleanValue.includes('.') && cleanValue.includes(',')) {
                    cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
                }
                // Se tem apenas vírgula, é separador decimal
                else if (cleanValue.includes(',') && !cleanValue.includes('.')) {
                    cleanValue = cleanValue.replace(',', '.');
                }
                
                return parseFloat(cleanValue) || 0;
            };
            
            const valorNumerico = parseValueToNumber(receita.valor);
            valorReceita.textContent = `R$ ${formatarMoeda(valorNumerico)}`;
        }
        // Configurar calculadora para edição do valor
        configurarCalculadora();
    }
    
    // Preencher recebido
    const checkboxRecebido = document.getElementById('recebido');
    if (checkboxRecebido) {
        checkboxRecebido.checked = receita.recebido !== false;
    }
    
    // Preencher data
    const dataSelecionada = document.getElementById('data-selecionada');
    if (receita.data && dataSelecionada) {
        dataSelecionada.textContent = receita.data;
        // Configurar calendário para permitir mudança de data
        configurarCalendario();
    }
    
    // Preencher descrição
    const inputDescricao = document.getElementById('descricao');
    if (receita.descricao && inputDescricao) {
        inputDescricao.value = receita.descricao;
    }
    
    // Preencher categoria
    if (receita.categoria) {
        const opcaoSelecionadaCategoria = document.querySelector('.seletor-categoria .opcao-selecionada');
        if (opcaoSelecionadaCategoria) {
            // Determinar ícone baseado na categoria
            let iconeCategoria = 'paid'; // ícone padrão
            const categoriaLower = receita.categoria.toLowerCase();
            
            if (categoriaLower.includes('salário') || categoriaLower.includes('salario')) {
                iconeCategoria = 'attach_money';
            } else if (categoriaLower.includes('freelance')) {
                iconeCategoria = 'work';
            } else if (categoriaLower.includes('dividendos')) {
                iconeCategoria = 'account_balance_wallet';
            } else if (categoriaLower.includes('investimento')) {
                iconeCategoria = 'show_chart';
            } else if (categoriaLower.includes('bônus') || categoriaLower.includes('bonus')) {
                iconeCategoria = 'card_giftcard';
            }
            
            opcaoSelecionadaCategoria.innerHTML = `
                <span class="material-symbols-outlined">${iconeCategoria}</span>
                <span>${receita.categoria}</span>
            `;
        }
        // Configurar seletor de categoria
        configurarSeletorCategoria();
    }
    
    // Preencher carteira (conta) usando cache / busca assíncrona
    atualizarContaSelecionadaNaEdicao(receita);
    
    // Preencher configurações de receita fixa/repetitiva
    const toggleReceitaFixa = document.getElementById('toggle-receita-fixa');
    const toggleRepetir = document.getElementById('toggle-repetir');
    const camposRepetir = document.getElementById('campos-repetir');
    
    if (toggleReceitaFixa && toggleRepetir && camposRepetir) {
        // Verificar se é receita fixa
        if (receita.receitaFixa === true) {
            toggleReceitaFixa.checked = true;
            toggleRepetir.checked = false;
            camposRepetir.style.display = 'none';
        }
        // Verificar se é receita repetitiva (tem periodicidade)
        else if (receita.periodicidade || receita.repetir === true) {
            toggleRepetir.checked = true;
            toggleReceitaFixa.checked = false;
            camposRepetir.style.display = 'block';
            
            // Preencher campos de repetição
            if (receita.periodicidade) {
                const seletorPeriodicidade = document.getElementById('periodicidade');
                if (seletorPeriodicidade) {
                    seletorPeriodicidade.value = receita.periodicidade;
                }
            }
            
            if (receita.duracaoRepeticao) {
                const seletorDuracao = document.getElementById('duracao-repeticao');
                if (seletorDuracao) {
                    seletorDuracao.value = receita.duracaoRepeticao;
                }
            }
        }
        else {
            // Não é fixa nem repetitiva
            toggleReceitaFixa.checked = false;
            toggleRepetir.checked = false;
            camposRepetir.style.display = 'none';
        }
    }
}

// Estado da calculadora
let estadoCalculadora = {
    valorAtual: '0',
    digitandoValor: false
};

// Função para configurar calculadora
function configurarCalculadora() {
    const secaoValor = document.getElementById('secao-valor');
    const calculadoraContainer = document.getElementById('calculadora-container');
    
    if (secaoValor && calculadoraContainer) {
        // Remover event listeners anteriores
        const novaSecaoValor = secaoValor.cloneNode(true);
        secaoValor.parentNode.replaceChild(novaSecaoValor, secaoValor);
        
        novaSecaoValor.addEventListener('click', function() {
            console.log('Abrindo calculadora...');
            abrirCalculadora();
        });
        
        // Configurar botões da calculadora
        configurarBotoesCalculadora();
    }
}

// Função para abrir calculadora
function abrirCalculadora() {
    const calculadoraContainer = document.getElementById('calculadora-container');
    const valorReceita = document.getElementById('valor-receita');
    const calculadoraDisplay = document.getElementById('calculadora-display');
    
    if (calculadoraContainer && valorReceita && calculadoraDisplay) {
        calculadoraContainer.style.display = 'block';
        
        // Pegar valor atual e configurar display
        // Função para converter valor brasileiro para número corretamente
        const parseValueToNumber = (value) => {
            if (typeof value === 'number') return value;
            if (!value) return 0;
            
            let cleanValue = value.toString().replace(/[^\d,.-]/g, '');
            
            // Se tem ponto E vírgula, ponto é separador de milhares
            if (cleanValue.includes('.') && cleanValue.includes(',')) {
                cleanValue = cleanValue.replace(/\./g, '').replace(',', '.');
            }
            // Se tem apenas vírgula, é separador decimal
            else if (cleanValue.includes(',') && !cleanValue.includes('.')) {
                cleanValue = cleanValue.replace(',', '.');
            }
            
            return parseFloat(cleanValue) || 0;
        };
        
        const valorTexto = valorReceita.textContent.replace('R$ ', '');
        estadoCalculadora.valorAtual = parseValueToNumber(valorTexto).toString();
        calculadoraDisplay.value = formatarValorCalculadora(estadoCalculadora.valorAtual);
        estadoCalculadora.digitandoValor = false;
        
        // Fechar ao clicar fora
        calculadoraContainer.addEventListener('click', function(e) {
            if (e.target === calculadoraContainer) {
                fecharCalculadora();
            }
        });
    }
}

// Função para fechar calculadora
function fecharCalculadora() {
    const calculadoraContainer = document.getElementById('calculadora-container');
    if (calculadoraContainer) {
        calculadoraContainer.style.display = 'none';
    }
}

// Função para configurar botões da calculadora
function configurarBotoesCalculadora() {
    const calculadoraBotoes = document.querySelector('.calculadora-botoes');
    const botaoApagar = document.getElementById('botao-apagar');
    const btnCancelar = document.querySelector('.btn-cancelar-calculadora');
    const btnConfirmar = document.querySelector('.btn-confirmar-calculadora');
    
    // Event delegation para botões numéricos
    if (calculadoraBotoes) {
        calculadoraBotoes.addEventListener('click', function(e) {
            if (e.target.tagName === 'BUTTON') {
                const valor = e.target.textContent.trim();
                console.log(`Botão da calculadora pressionado: ${valor}`);
                
                if (valor.match(/[0-9]/)) {
                    adicionarNumeroCalculadora(valor);
                } else if (valor === ',') {
                    adicionarNumeroCalculadora('.');
                }
            }
        });
    }
    
    // Botão apagar
    if (botaoApagar) {
        botaoApagar.addEventListener('click', apagarCalculadora);
    }
    
    // Botão cancelar
    if (btnCancelar) {
        btnCancelar.addEventListener('click', cancelarCalculadora);
    }
    
    // Botão confirmar
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', confirmarCalculadora);
    }
}

// Função para adicionar número na calculadora
function adicionarNumeroCalculadora(numero) {
    const calculadoraDisplay = document.getElementById('calculadora-display');
    
    if (!estadoCalculadora.digitandoValor) {
        estadoCalculadora.valorAtual = '0';
        estadoCalculadora.digitandoValor = true;
    }
    
    if (estadoCalculadora.valorAtual === '0' && numero !== '.') {
        estadoCalculadora.valorAtual = numero;
    } else {
        // Limitar casas decimais
        if (estadoCalculadora.valorAtual.includes('.') && estadoCalculadora.valorAtual.split('.')[1].length >= 2) {
            console.log('Limite de casas decimais atingido');
            return;
        }
        estadoCalculadora.valorAtual += numero;
    }
    
    console.log('Valor atual calculadora:', estadoCalculadora.valorAtual);
    if (calculadoraDisplay) {
        calculadoraDisplay.value = formatarValorCalculadora(estadoCalculadora.valorAtual);
    }
}

// Função para apagar na calculadora
function apagarCalculadora() {
    const calculadoraDisplay = document.getElementById('calculadora-display');
    
    if (estadoCalculadora.valorAtual.length > 1) {
        estadoCalculadora.valorAtual = estadoCalculadora.valorAtual.slice(0, -1);
    } else {
        estadoCalculadora.valorAtual = '0';
        estadoCalculadora.digitandoValor = false;
    }
    
    console.log('Apagando valor - novo valor:', estadoCalculadora.valorAtual);
    if (calculadoraDisplay) {
        calculadoraDisplay.value = formatarValorCalculadora(estadoCalculadora.valorAtual);
    }
}

// Função para cancelar calculadora
function cancelarCalculadora() {
    console.log('Calculadora cancelada');
    fecharCalculadora();
}

// Função para confirmar calculadora
function confirmarCalculadora() {
    const valorReceita = document.getElementById('valor-receita');
    
    if (valorReceita) {
        const valorFormatado = formatarMoeda(parseFloat(estadoCalculadora.valorAtual));
        console.log('Valor confirmado na calculadora:', valorFormatado);
        valorReceita.textContent = `R$ ${valorFormatado}`;
    }
    
    fecharCalculadora();
}

// Função para formatar valor na calculadora
function formatarValorCalculadora(valor) {
    if (valor.includes('.')) {
        const partes = valor.split('.');
        return `${partes[0]},${partes[1].substring(0, 2)}`;
    }
    return valor.replace('.', ',');
}

// Função para configurar calendário
function configurarCalendario() {
    const campoData = document.getElementById('campo-data');
    const calendario = document.getElementById('calendario');
    const dataSelecionada = document.getElementById('data-selecionada');
    
    if (campoData && calendario) {
        // Remover event listeners anteriores
        const novoCampoData = campoData.cloneNode(true);
        campoData.parentNode.replaceChild(novoCampoData, campoData);
        
        novoCampoData.addEventListener('click', function(e) {
            e.stopPropagation();
            calendario.classList.add('mostrar');
            renderizarCalendario();
        });
        
        // Fechar calendário ao clicar fora
        document.addEventListener('click', function(e) {
            if (!calendario.contains(e.target) && e.target !== novoCampoData) {
                calendario.classList.remove('mostrar');
            }
        });
    }
}

// Função para renderizar calendário
function renderizarCalendario() {
    const calendario = document.getElementById('calendario');
    const dataSelecionada = document.getElementById('data-selecionada');
    
    if (!calendario || !dataSelecionada) return;
    
    const dataAtual = new Date();
    const ano = dataAtual.getFullYear();
    const mes = dataAtual.getMonth();
    
    const primeiroDiaMes = new Date(ano, mes, 1);
    const ultimoDiaMes = new Date(ano, mes + 1, 0);
    const diasNoMes = ultimoDiaMes.getDate();
    const primeiroDiaSemana = primeiroDiaMes.getDay();
    
    const nomesMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                       'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const nomesDias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    let html = `
        <div class="cabecalho-calendario">
            <button class="botao-mes" onclick="navegarMes(-1)">&lt;</button>
            <h3>${nomesMeses[mes]} ${ano}</h3>
            <button class="botao-mes" onclick="navegarMes(1)">&gt;</button>
        </div>
        <div class="dias-semana">
            ${nomesDias.map(dia => `<div>${dia}</div>`).join('')}
        </div>
        <div class="dias-calendario">
    `;
    
    // Dias vazios no início
    for (let i = 0; i < primeiroDiaSemana; i++) {
        html += '<div class="dia-calendario outro-mes"></div>';
    }
    
    // Dias do mês
    for (let dia = 1; dia <= diasNoMes; dia++) {
        const hoje = new Date();
        const ehHoje = dia === hoje.getDate() && mes === hoje.getMonth() && ano === hoje.getFullYear();
        const classeHoje = ehHoje ? 'hoje' : '';
        
        html += `<div class="dia-calendario ${classeHoje}" onclick="selecionarDia(${dia}, ${mes}, ${ano})">${dia}</div>`;
    }
    
    html += '</div>';
    calendario.innerHTML = html;
}

// Função para selecionar dia
function selecionarDia(dia, mes, ano) {
    const dataSelecionada = document.getElementById('data-selecionada');
    const calendario = document.getElementById('calendario');
    
    if (dataSelecionada) {
        const diaFormatado = String(dia).padStart(2, '0');
        const mesFormatado = String(mes + 1).padStart(2, '0');
        dataSelecionada.textContent = `${diaFormatado}/${mesFormatado}/${ano}`;
    }
    
    if (calendario) {
        calendario.classList.remove('mostrar');
    }
}

// Função para navegar entre meses
let mesAtual = new Date().getMonth();
let anoAtual = new Date().getFullYear();

function navegarMes(direcao) {
    mesAtual += direcao;
    if (mesAtual > 11) {
        mesAtual = 0;
        anoAtual++;
    } else if (mesAtual < 0) {
        mesAtual = 11;
        anoAtual--;
    }
    renderizarCalendarioNavegavel();
}

function renderizarCalendarioNavegavel() {
    const calendario = document.getElementById('calendario');
    if (!calendario) return;
    
    const primeiroDiaMes = new Date(anoAtual, mesAtual, 1);
    const ultimoDiaMes = new Date(anoAtual, mesAtual + 1, 0);
    const diasNoMes = ultimoDiaMes.getDate();
    const primeiroDiaSemana = primeiroDiaMes.getDay();
    
    const nomesMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                       'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const nomesDias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    
    let html = `
        <div class="cabecalho-calendario">
            <button class="botao-mes" onclick="navegarMes(-1)">&lt;</button>
            <h3>${nomesMeses[mesAtual]} ${anoAtual}</h3>
            <button class="botao-mes" onclick="navegarMes(1)">&gt;</button>
        </div>
        <div class="dias-semana">
            ${nomesDias.map(dia => `<div>${dia}</div>`).join('')}
        </div>
        <div class="dias-calendario">
    `;
    
    // Dias vazios no início
    for (let i = 0; i < primeiroDiaSemana; i++) {
        html += '<div class="dia-calendario outro-mes"></div>';
    }
    
    // Dias do mês
    for (let dia = 1; dia <= diasNoMes; dia++) {
        const hoje = new Date();
        const ehHoje = dia === hoje.getDate() && mesAtual === hoje.getMonth() && anoAtual === hoje.getFullYear();
        const classeHoje = ehHoje ? 'hoje' : '';
        
        html += `<div class="dia-calendario ${classeHoje}" onclick="selecionarDia(${dia}, ${mesAtual}, ${anoAtual})">${dia}</div>`;
    }
    
    html += '</div>';
    calendario.innerHTML = html;
}

// Função para configurar seletor de categoria
function configurarSeletorCategoria() {
    const seletorCategoria = document.querySelector('.seletor-categoria');
    const opcaoSelecionada = seletorCategoria?.querySelector('.opcao-selecionada');
    const opcoesCategoria = seletorCategoria?.querySelector('.opcoes-categoria');
    
    if (opcaoSelecionada && opcoesCategoria) {
        // Remover event listeners anteriores
        const novaOpcaoSelecionada = opcaoSelecionada.cloneNode(true);
        opcaoSelecionada.parentNode.replaceChild(novaOpcaoSelecionada, opcaoSelecionada);
        
        novaOpcaoSelecionada.addEventListener('click', function(e) {
            e.stopPropagation();
            opcoesCategoria.classList.toggle('mostrar');
            carregarCategoriasEdicao();
        });
        
        // Fechar ao clicar fora
        document.addEventListener('click', function(e) {
            if (!seletorCategoria.contains(e.target)) {
                opcoesCategoria.classList.remove('mostrar');
            }
        });
    }
}

// Função para carregar categorias na edição
function carregarCategoriasEdicao() {
    const opcoesCategoria = document.querySelector('.opcoes-categoria');
    if (!opcoesCategoria) return;
    
    const categorias = [
        { nome: 'Salário', icone: 'attach_money' },
        { nome: 'Freelance', icone: 'work' },
        { nome: 'Bônus', icone: 'card_giftcard' },
        { nome: 'Comissões', icone: 'trending_up' },
        { nome: 'Aluguel Recebido', icone: 'home' },
        { nome: 'Rendimentos de Investimentos', icone: 'show_chart' },
        { nome: 'Dividendos', icone: 'account_balance_wallet' },
        { nome: 'Juros Recebidos', icone: 'percent' },
        { nome: 'Cashback', icone: 'credit_card' },
        { nome: 'Venda de Produtos', icone: 'shopping_cart' },
        { nome: 'Venda de Serviços', icone: 'handshake' },
        { nome: 'Reembolso', icone: 'receipt' },
        { nome: 'Restituição de Imposto', icone: 'account_balance' },
        { nome: 'Premiações', icone: 'emoji_events' },
        { nome: 'Herança', icone: 'family_restroom' },
        { nome: 'Aposentadoria', icone: 'elderly' },
        { nome: 'Pensão', icone: 'child_care' },
        { nome: 'Doações Recebidas', icone: 'volunteer_activism' },
        { nome: 'Prêmios de Loteria', icone: 'casino' },
        { nome: 'Transferência de Terceiros', icone: 'swap_horiz' },
        { nome: 'Décimo Terceiro', icone: 'calendar_month' },
        { nome: 'Resgate de Aplicações', icone: 'savings' },
        { nome: 'Lucros de Empresa', icone: 'business' },
        { nome: 'Aluguel de Equipamentos', icone: 'construction' },
        { nome: 'Consultoria', icone: 'support_agent' },
        { nome: 'Parcerias', icone: 'group' },
        { nome: 'Royalties', icone: 'copyright' },
        { nome: 'Licenciamento', icone: 'verified' },
        { nome: 'Rendimentos de Direitos Autorais', icone: 'library_books' },
        { nome: 'Outras receitas', icone: 'paid' }
    ];
    
    opcoesCategoria.innerHTML = '';
    
    categorias.forEach(categoria => {
        const div = document.createElement('div');
        div.className = 'opcao-categoria';
        div.innerHTML = `
            <span class="material-symbols-outlined">${categoria.icone}</span>
            <span>${categoria.nome}</span>
        `;
        
        div.addEventListener('click', function() {
            const opcaoSelecionada = document.querySelector('.seletor-categoria .opcao-selecionada');
            if (opcaoSelecionada) {
                opcaoSelecionada.innerHTML = `
                    <span class="material-symbols-outlined">${categoria.icone}</span>
                    <span>${categoria.nome}</span>
                `;
            }
            opcoesCategoria.classList.remove('mostrar');
        });
        
        opcoesCategoria.appendChild(div);
    });
    
    // Adicionar opção para criar nova categoria
    const divCriarCategoria = document.createElement('div');
    divCriarCategoria.className = 'opcao-categoria criar-categoria';
    divCriarCategoria.innerHTML = `
        <span class="material-symbols-outlined">add</span>
        <span>Criar nova categoria</span>
    `;
    
    divCriarCategoria.addEventListener('click', function() {
        opcoesCategoria.classList.remove('mostrar');
        abrirModalCriarCategoria();
    });
    
    opcoesCategoria.appendChild(divCriarCategoria);
}

// Função para abrir modal de criar categoria
function abrirModalCriarCategoria() {
    // Criar modal se não existir
    let modalCategoria = document.getElementById('modal-criar-categoria');
    if (!modalCategoria) {
        modalCategoria = document.createElement('div');
        modalCategoria.id = 'modal-criar-categoria';
        modalCategoria.className = 'modal-overlay';
        modalCategoria.innerHTML = `
            <div class="modal-conteudo-categoria">
                <h3>Criar Nova Categoria</h3>
                <div class="campo-categoria">
                    <label>Nome da categoria:</label>
                    <input type="text" id="input-nome-categoria" placeholder="Digite o nome da categoria" maxlength="30">
                </div>
                <div class="campo-categoria">
                    <label>Escolha um ícone:</label>
                    <div class="icone-selecionado-preview" id="icone-preview-categoria">
                        <span class="material-symbols-outlined">category</span>
                    </div>
                    <div class="galeria-icones-categoria">
                        <span class="material-symbols-outlined icone-opcao" data-icone="paid">paid</span>
                        <span class="material-symbols-outlined icone-opcao" data-icone="attach_money">attach_money</span>
                        <span class="material-symbols-outlined icone-opcao" data-icone="work">work</span>
                        <span class="material-symbols-outlined icone-opcao" data-icone="business">business</span>
                        <span class="material-symbols-outlined icone-opcao" data-icone="trending_up">trending_up</span>
                        <span class="material-symbols-outlined icone-opcao" data-icone="show_chart">show_chart</span>
                        <span class="material-symbols-outlined icone-opcao" data-icone="account_balance">account_balance</span>
                        <span class="material-symbols-outlined icone-opcao" data-icone="savings">savings</span>
                        <span class="material-symbols-outlined icone-opcao" data-icone="home">home</span>
                        <span class="material-symbols-outlined icone-opcao" data-icone="card_giftcard">card_giftcard</span>
                        <span class="material-symbols-outlined icone-opcao" data-icone="emoji_events">emoji_events</span>
                        <span class="material-symbols-outlined icone-opcao" data-icone="casino">casino</span>
                    </div>
                </div>
                <div class="modal-botoes-categoria">
                    <button class="botao-cancelar-categoria">Cancelar</button>
                    <button class="botao-salvar-categoria">Salvar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modalCategoria);
        
        // Configurar eventos do modal
        configurarEventosModalCategoria(modalCategoria);
    }
    
    modalCategoria.style.display = 'flex';
    const inputNome = document.getElementById('input-nome-categoria');
    if (inputNome) {
        inputNome.focus();
    }
}

// Função para configurar eventos do modal de categoria
function configurarEventosModalCategoria(modal) {
    const inputNome = document.getElementById('input-nome-categoria');
    const iconePreview = document.getElementById('icone-preview-categoria');
    const galeriaIcones = document.querySelector('.galeria-icones-categoria');
    const botaoCancelar = document.querySelector('.botao-cancelar-categoria');
    const botaoSalvar = document.querySelector('.botao-salvar-categoria');
    
    let iconeSelecionado = 'category';
    
    // Seleção de ícone
    if (galeriaIcones) {
        galeriaIcones.addEventListener('click', function(e) {
            if (e.target.classList.contains('icone-opcao')) {
                // Remover seleção anterior
                galeriaIcones.querySelectorAll('.icone-opcao').forEach(icon => {
                    icon.classList.remove('selecionado');
                });
                
                // Adicionar seleção atual
                e.target.classList.add('selecionado');
                iconeSelecionado = e.target.getAttribute('data-icone');
                
                // Atualizar preview
                if (iconePreview) {
                    iconePreview.innerHTML = `<span class="material-symbols-outlined">${iconeSelecionado}</span>`;
                }
            }
        });
    }
    
    // Botão cancelar
    if (botaoCancelar) {
        botaoCancelar.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }
    
    // Botão salvar
    if (botaoSalvar) {
        botaoSalvar.addEventListener('click', function() {
            const nomeCategoria = inputNome ? inputNome.value.trim() : '';
            
            if (!nomeCategoria) {
                alert('Por favor, digite um nome para a categoria.');
                return;
            }
            
            // Adicionar nova categoria às opções
            adicionarNovaCategoria(nomeCategoria, iconeSelecionado);
            
            // Selecionar a categoria criada
            const opcaoSelecionada = document.querySelector('.seletor-categoria .opcao-selecionada');
            if (opcaoSelecionada) {
                opcaoSelecionada.innerHTML = `
                    <span class="material-symbols-outlined">${iconeSelecionado}</span>
                    <span>${nomeCategoria}</span>
                `;
            }
            
            modal.style.display = 'none';
        });
    }
    
    // Fechar ao clicar fora
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Função para adicionar nova categoria
function adicionarNovaCategoria(nome, icone) {
    const opcoesCategoria = document.querySelector('.opcoes-categoria');
    if (!opcoesCategoria) return;
    
    // Encontrar o botão "Criar nova categoria" para inserir antes dele
    const criarCategoriaBtn = opcoesCategoria.querySelector('.criar-categoria');
    
    const div = document.createElement('div');
    div.className = 'opcao-categoria categoria-personalizada';
    div.innerHTML = `
        <span class="material-symbols-outlined">${icone}</span>
        <span>${nome}</span>
    `;
    
    div.addEventListener('click', function() {
        const opcaoSelecionada = document.querySelector('.seletor-categoria .opcao-selecionada');
        if (opcaoSelecionada) {
            opcaoSelecionada.innerHTML = `
                <span class="material-symbols-outlined">${icone}</span>
                <span>${nome}</span>
            `;
        }
        opcoesCategoria.classList.remove('mostrar');
    });
    
    // Inserir antes do botão "Criar nova categoria"
    if (criarCategoriaBtn) {
        opcoesCategoria.insertBefore(div, criarCategoriaBtn);
    } else {
        opcoesCategoria.appendChild(div);
    }
}

// Função para configurar seletor de carteira
function configurarSeletorCarteira() {
    const seletorCarteira = document.querySelector('.seletor-carteira');
    const opcaoSelecionada = seletorCarteira?.querySelector('.opcao-selecionada');
    const opcoesCarteira = seletorCarteira?.querySelector('.opcoes-carteira');
    
    if (opcaoSelecionada && opcoesCarteira) {
        // Remover event listeners anteriores
        const novaOpcaoSelecionada = opcaoSelecionada.cloneNode(true);
        opcaoSelecionada.parentNode.replaceChild(novaOpcaoSelecionada, opcaoSelecionada);
        
        novaOpcaoSelecionada.addEventListener('click', function(e) {
            e.stopPropagation();
            opcoesCarteira.classList.toggle('mostrar');
        });
        
        // Fechar ao clicar fora
        document.addEventListener('click', function(e) {
            if (!seletorCarteira.contains(e.target)) {
                opcoesCarteira.classList.remove('mostrar');
            }
        });
    }
}

// Função para excluir receita
function excluirReceita(receitaId) {
    console.log('Excluindo receita com ID:', receitaId);
    
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            firebase.firestore().collection('receitas').doc(receitaId).delete()
                .then(() => {
                    console.log('Receita excluída com sucesso!');
                    mostrarPopupMensagem('Receita excluída com sucesso!', 'success');
                    setTimeout(() => {
                        window.location.href = '../Lista-de-receitas/Lista-de-receitas.html';
                    }, 1500);
                })
                .catch(error => {
                    console.error('Erro ao excluir receita:', error);
                    mostrarPopupMensagem('Erro ao excluir receita. Tente novamente.', 'error');
                });
        }
    });
}

// Função para formatar valor monetário
function formatarMoeda(valor) {
    if (valor === null || valor === undefined || isNaN(valor)) {
        return '0,00';
    }
    const numero = parseFloat(valor);
    return numero.toFixed(2).replace('.', ',').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
}

// Função para gerenciar toggles
function gerenciarToggles(tipo) {
    const toggleRepetir = document.getElementById('toggle-repetir');
    const toggleReceitaFixa = document.getElementById('toggle-receita-fixa');
    const camposRepetir = document.getElementById('campos-repetir');

    if (!toggleRepetir || !toggleReceitaFixa || !camposRepetir) return;

    if (tipo === 'repetir') {
        if (toggleRepetir.checked) {
            toggleReceitaFixa.checked = false;
            camposRepetir.style.display = 'block';
        } else {
            camposRepetir.style.display = 'none';
        }
    } else if (tipo === 'fixa') {
        if (toggleReceitaFixa.checked) {
            toggleRepetir.checked = false;
            camposRepetir.style.display = 'none';
        }
    }
}

// Função para alterar quantidade de repetições
function alterarQuantidade(delta) {
    const inputQuantidade = document.getElementById('quantidade-repeticoes');
    if (!inputQuantidade) return;
    
    const novaQuantidade = Math.max(1, parseInt(inputQuantidade.value || 1, 10) + delta);
    inputQuantidade.value = novaQuantidade;
}

// Função para carregar contas no seletor
function carregarContasNoSeletor(contas) {
    console.log('[Editar Receita] Carregando contas no seletor:', contas);
    
    const opcoesCarteira = document.querySelector('.opcoes-carteira');
    
    if (!opcoesCarteira) {
        console.error('[Editar Receita] Elemento opcoes-carteira não encontrado');
        return;
    }
    
    opcoesCarteira.innerHTML = '';
    
    contas.forEach((conta, index) => {
        console.log(`[Editar Receita] Processando conta ${index + 1}:`, conta);
        
        const svgIcon = conta.icone || '../Icon/banco-do-brasil.svg';
        const corFundo = conta.cor || '#e8f5ee';
        const nomeConta = conta.nome || conta.descricao || 'Conta sem nome';
        const bancoConta = conta.banco || 'Banco';

        const div = document.createElement('div');
        div.className = 'opcao-carteira';
        div.setAttribute('data-id', conta.id);
        div.innerHTML = `
            <span class="circulo-icone-conta" style="
                display:inline-flex;
                align-items:center;
                justify-content:center;
                width:36px;
                height:36px;
                border-radius:50%;
                background:${corFundo};
                margin-right:10px;
                ">
                <img src="${svgIcon}" alt="${bancoConta}" style="width:22px;height:22px;object-fit:contain;">
            </span>
            <span>${nomeConta}</span>
        `;
        
        div.addEventListener('click', function() {
            console.log('[Editar Receita] Conta selecionada:', conta);
            
            const opcaoSelecionada = document.querySelector('.seletor-carteira .opcao-selecionada');
            if (opcaoSelecionada) {
                opcaoSelecionada.innerHTML = `
                    <span class="circulo-icone-conta" style="
                        display:inline-flex;
                        align-items:center;
                        justify-content:center;
                        width:36px;
                        height:36px;
                        border-radius:50%;
                        background:${corFundo};
                        margin-right:10px;
                        ">
                        <img src="${svgIcon}" alt="${bancoConta}" style="width:22px;height:22px;object-fit:contain;">
                    </span>
                    <span>${nomeConta}</span>
                `;
            }
            
            opcoesCarteira.classList.remove('mostrar');
            window.contaSelecionada = conta.id; // salvar apenas ID para consistência
        });
        
        opcoesCarteira.appendChild(div);
    });
    
    console.log(`[Editar Receita] ${contas.length} contas adicionadas ao seletor`);
}

// Função para buscar contas do usuário
function buscarContasUsuario(uid) {
    console.log('[Editar Receita] Buscando contas para usuário:', uid);
    
    if (!firebase.firestore) {
        console.error('[Editar Receita] Firestore não disponível');
        return;
    }
    
    firebase.firestore().collection('contas')
        .where('userId', '==', uid)
        .get()
        .then(snapshot => {
            const contas = [];
            snapshot.forEach(doc => {
                const dadosConta = { id: doc.id, ...doc.data() };
                contas.push(dadosConta);
                console.log('[Editar Receita] Conta carregada:', dadosConta);
            });
            
            console.log('[Editar Receita] Total de contas carregadas:', contas.length);
            
            // Preenche cache
            contasCache = {};
            contas.forEach(c => { contasCache[c.id] = c; });

            if (contas.length > 0) {
                carregarContasNoSeletor(contas);
                // Após carregar contas, tentar novamente atualizar exibição se já temos receita
                if (receitaCarregadaGlobal) {
                    atualizarContaSelecionadaNaEdicao(receitaCarregadaGlobal, true);
                }
            } else {
                console.warn('[Editar Receita] Nenhuma conta encontrada');
                const opcoesCarteira = document.querySelector('.opcoes-carteira');
                if (opcoesCarteira) {
                    opcoesCarteira.innerHTML = `
                        <div class="opcao-carteira" style="text-align: center; padding: 20px; color: #666;">
                            <span class="material-icons" style="font-size: 2rem; margin-bottom: 8px; display: block;">account_balance</span>
                            <div>Nenhuma conta encontrada</div>
                            <small>Crie uma conta primeiro</small>
                        </div>
                    `;
                }
            }
        })
        .catch(error => {
            console.error('[Editar Receita] Erro ao buscar contas:', error);
        });
}

// Função principal para salvar receita (atualizar)
function salvarReceita(receitaId) {
    console.log('Iniciando processo de atualizar receita com ID:', receitaId);
    
    // Validações básicas
    const valorReceita = document.getElementById('valor-receita');
    const inputDescricao = document.getElementById('descricao');
    
    if (!valorReceita || valorReceita.textContent === 'R$ 0,00') {
        mostrarPopupMensagem('Por favor, insira um valor para a receita.', 'error');
        return;
    }
    
    if (!inputDescricao || !inputDescricao.value.trim()) {
        mostrarPopupMensagem('Por favor, insira uma descrição para a receita.', 'error');
        return;
    }
    
    // Coletar dados do formulário
    const checkboxRecebido = document.getElementById('recebido');
    const dataSelecionada = document.getElementById('data-selecionada');
    const opcaoCategoria = document.querySelector('.seletor-categoria .opcao-selecionada span:last-child');
    const opcaoCarteira = document.querySelector('.seletor-carteira .opcao-selecionada span:last-child');
    
    const contaParaSalvar = (typeof window.contaSelecionada === 'object' && window.contaSelecionada?.id)
        ? window.contaSelecionada.id
        : window.contaSelecionada; // ID ou string

    const receitaAtualizada = {
        valor: valorReceita.textContent, // Mantém "R$ " + valor formatado
        recebido: checkboxRecebido ? checkboxRecebido.checked : true,
        data: dataSelecionada ? dataSelecionada.textContent : new Date().toLocaleDateString('pt-BR'),
        descricao: inputDescricao.value.trim(),
        categoria: opcaoCategoria ? opcaoCategoria.textContent : 'Sem categoria',
        carteira: contaParaSalvar || 'Sem carteira',
        timestamp: Date.now()
    };

    console.log('Dados da receita atualizada:', receitaAtualizada);

    // Atualizar no Firestore
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            receitaAtualizada.userId = user.uid;
            
            firebase.firestore().collection('receitas').doc(receitaId).update(receitaAtualizada)
                .then(() => {
                    console.log('Receita atualizada no Firestore!');
                    mostrarPopupMensagem('Receita atualizada com sucesso!', 'success');
                    setTimeout(() => {
                        window.location.href = '../Lista-de-receitas/Lista-de-receitas.html';
                    }, 1500);
                })
                .catch(error => {
                    console.error('Erro ao atualizar receita:', error);
                    mostrarPopupMensagem('Erro ao atualizar receita. Tente novamente.', 'error');
                });
        } else {
            mostrarPopupMensagem('Usuário não autenticado. Faça login novamente.');
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado - Iniciando aplicação Editar Receita...');
    
    // Verificar se há ID da receita na URL
    const urlParams = new URLSearchParams(window.location.search);
    const receitaId = urlParams.get('id');
    
    if (!receitaId) {
        mostrarPopupMensagem('ID da receita não encontrado. Redirecionando...');
        setTimeout(() => {
            window.location.href = '../Lista-de-receitas/Lista-de-receitas.html';
        }, 2000);
        return;
    }
    
    console.log('ID da receita para editar:', receitaId);
    
    // Event listeners para botões
    const botaoExcluirTopo = document.querySelector('.botao-excluir-topo');
    const botaoSalvar = document.querySelector('.botao-primario');
    const popupConfirmacao = document.getElementById('popup-confirmacao');
    const popupCancelar = document.getElementById('popup-cancelar');
    const popupConfirmarExclusao = document.getElementById('popup-confirmar-exclusao');
    
    // Conectar botão de excluir do topo
    if (botaoExcluirTopo) {
        botaoExcluirTopo.addEventListener('click', function() {
            if (popupConfirmacao) {
                popupConfirmacao.style.display = 'flex';
            }
        });
    }
    
    if (popupCancelar) {
        popupCancelar.addEventListener('click', function() {
            if (popupConfirmacao) {
                popupConfirmacao.style.display = 'none';
            }
        });
    }
    
    if (popupConfirmarExclusao) {
        popupConfirmarExclusao.addEventListener('click', function() {
            if (popupConfirmacao) {
                popupConfirmacao.style.display = 'none';
            }
            excluirReceita(receitaId);
        });
    }
    
    if (botaoSalvar) {
        botaoSalvar.addEventListener('click', function() {
            salvarReceita(receitaId);
        });
    }
    
    // Verificar autenticação Firebase
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            console.log('[Editar Receita] Usuário autenticado:', user.uid);
            buscarContasUsuario(user.uid);
            carregarReceitaExistente(receitaId);
        } else {
            console.log('[Editar Receita] Usuário não autenticado, redirecionando...');
            window.location.href = '../Login/Login.html';
        }
    });
    
    // Configurar botão voltar
    const botaoVoltar = document.querySelector('.botao-voltar');
    if (botaoVoltar) {
        botaoVoltar.addEventListener('click', function() {
            window.location.href = '../Lista-de-receitas/Lista-de-receitas.html';
        });
    }
});

// Tornar funções disponíveis globalmente para o HTML
window.gerenciarToggles = gerenciarToggles;
window.alterarQuantidade = alterarQuantidade;
window.selecionarDia = selecionarDia;
window.navegarMes = navegarMes;
window.adicionarNumeroCalculadora = adicionarNumeroCalculadora;
window.apagarCalculadora = apagarCalculadora;
window.cancelarCalculadora = cancelarCalculadora;
window.confirmarCalculadora = confirmarCalculadora;

// --- Funções auxiliares novas ---
function atualizarContaSelecionadaNaEdicao(receita, forcar=false) {
    if (!receita || !receita.carteira) return;
    const el = document.querySelector('.seletor-carteira .opcao-selecionada');
    if (!el) return;

    // Caso já tenha sido desenhado corretamente e não esteja forçando, sair
    if (!forcar && el.dataset.renderOk === '1') return;

    if (typeof receita.carteira === 'object') {
        const c = receita.carteira;
        desenharContaSelecionada(el, c.icone, c.cor, c.nome || c.banco || 'Conta');
        window.contaSelecionada = c.id || c.nome;
        return;
    }

    // Se for string (ID ou nome solto)
    const idOuNome = receita.carteira;
    const contaObj = contasCache[idOuNome];
    if (contaObj) {
        desenharContaSelecionada(el, contaObj.icone, contaObj.cor, contaObj.nome || contaObj.banco || 'Conta');
        window.contaSelecionada = contaObj.id;
        el.dataset.renderOk = '1';
        return;
    }

    // Se não encontrou no cache ainda, tentar novamente algumas vezes
    if (tentativasAtualizarConta < 10) {
        tentativasAtualizarConta++;
        setTimeout(() => atualizarContaSelecionadaNaEdicao(receita), 250);
    } else {
        // Fallback: mostrar placeholder amigável sem expor ID cru
        desenharContaSelecionada(el, null, '#e2e8f0', 'Conta (carregando...)');
    }
}

function desenharContaSelecionada(container, iconeSvg, corFundo='#e8f5ee', nome='Conta') {
    const svgFinal = iconeSvg ? `<img src="${iconeSvg}" alt="${nome}" style="width:22px;height:22px;object-fit:contain;" />` : '<span class="material-symbols-outlined" style="font-size:18px;color:#666;">account_balance</span>';
    container.innerHTML = `
        <span class="circulo-icone-conta" style="
            display:inline-flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:${corFundo};margin-right:10px;">
            ${svgFinal}
        </span>
        <span>${nome}</span>
    `;
}
