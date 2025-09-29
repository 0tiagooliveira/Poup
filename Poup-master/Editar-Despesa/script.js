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
        background: ${tipo === 'success' ? '#dc2626' : tipo === 'error' ? '#ef4444' : '#3b82f6'};
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

// Variáveis globais
let despesaOriginal = null;
let despesaId = null;
let valorAtual = 0;
let dataSelecionada = new Date();
let categoriaSelecionada = null;
let contaSelecionada = null;

// Função para carregar dados da despesa existente
function carregarDespesaExistente(despesaId) {
    console.log('Carregando despesa existente com ID:', despesaId);
    
    if (!verificarFirebase()) {
        mostrarPopupMensagem('Modo desenvolvimento: usando dados fictícios');
        return;
    }
    
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            firebase.firestore().collection('despesas').doc(despesaId).get()
                .then(doc => {
                    if (doc.exists) {
                        despesaOriginal = doc.data();
                        console.log('Despesa carregada:', despesaOriginal);
                        preencherFormulario(despesaOriginal);
                    } else {
                        mostrarPopupMensagem('Despesa não encontrada. Redirecionando...');
                        setTimeout(() => {
                            window.location.href = '../Lista-de-despesas/Lista-de-despesas.html';
                        }, 2000);
                    }
                })
                .catch(error => {
                    console.error('Erro ao carregar despesa:', error);
                    mostrarPopupMensagem('Erro ao carregar despesa', 'error');
                });
        } else {
            mostrarPopupMensagem('Usuário não autenticado', 'error');
        }
    });
}

// Função para preencher o formulário com os dados da despesa
function preencherFormulario(despesa) {
    // Preencher valor
    if (despesa.valor) {
        valorAtual = typeof despesa.valor === 'string' ? 
            parseFloat(despesa.valor.replace('R$', '').replace('.', '').replace(',', '.')) : 
            despesa.valor;
        atualizarExibicaoValor();
    }
    
    // Preencher checkbox pago
    const pagoCheckbox = document.getElementById('pago');
    if (pagoCheckbox) {
        pagoCheckbox.checked = despesa.pago === true;
    }
    
    // Preencher data
    if (despesa.data) {
        const data = despesa.data.toDate ? despesa.data.toDate() : new Date(despesa.data);
        dataSelecionada = data;
        atualizarExibicaoData();
    }
    
    // Preencher descrição
    const descricaoInput = document.getElementById('descricao');
    if (descricaoInput) {
        descricaoInput.value = despesa.descricao || '';
    }
    
    // Preencher categoria
    if (despesa.categoria) {
        categoriaSelecionada = despesa.categoria;
        atualizarExibicaoCategoria();
    }
    
    // Preencher conta
    if (despesa.conta) {
        contaSelecionada = despesa.conta;
        atualizarExibicaoConta();
    }
    
    // Preencher toggles
    const toggleRepetir = document.getElementById('toggle-repetir');
    const toggleDespesaFixa = document.getElementById('toggle-despesa-fixa');
    
    if (toggleRepetir && despesa.repetir) {
        toggleRepetir.checked = true;
        mostrarCamposRepetir();
    }
    
    if (toggleDespesaFixa && despesa.fixa) {
        toggleDespesaFixa.checked = true;
    }
}

// Função para atualizar exibição do valor
function atualizarExibicaoValor() {
    const valorDespesaEl = document.getElementById('valor-despesa');
    if (valorDespesaEl) {
        valorDespesaEl.textContent = formatarMoeda(valorAtual);
    }
}

// Função para formatar moeda
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(valor);
}

// Função para atualizar exibição da data
function atualizarExibicaoData() {
    const dataSelecionadaEl = document.getElementById('data-selecionada');
    if (dataSelecionadaEl) {
        dataSelecionadaEl.textContent = dataSelecionada.toLocaleDateString('pt-BR');
    }
}

// Função para atualizar exibição da categoria
function atualizarExibicaoCategoria() {
    const opcaoSelecionada = document.querySelector('#seletor-categoria .opcao-selecionada');
    if (opcaoSelecionada && categoriaSelecionada) {
        opcaoSelecionada.innerHTML = `
            <span class="material-icons-round">${categoriaSelecionada.icone || 'category'}</span>
            <span>${categoriaSelecionada.nome || categoriaSelecionada}</span>
        `;
    }
}

// Função para atualizar exibição da conta
function atualizarExibicaoConta() {
    const opcaoSelecionada = document.querySelector('#seletor-carteira .opcao-selecionada');
    if (opcaoSelecionada && contaSelecionada) {
        opcaoSelecionada.innerHTML = `
            <span id="icone-conta-selecionada" class="material-icons-round">${contaSelecionada.icone || 'account_balance'}</span>
            <span>${contaSelecionada.nome || contaSelecionada}</span>
        `;
    }
}

// Função para salvar alterações
async function salvarAlteracoes() {
    if (!verificarFirebase()) {
        mostrarPopupMensagem('Modo desenvolvimento: alterações simuladas', 'success');
        return;
    }
    
    if (!despesaId || !despesaOriginal) {
        mostrarPopupMensagem('Erro: despesa não carregada', 'error');
        return;
    }
    
    const descricao = document.getElementById('descricao').value.trim();
    if (!descricao) {
        mostrarPopupMensagem('Por favor, preencha a descrição', 'error');
        return;
    }
    
    if (valorAtual <= 0) {
        mostrarPopupMensagem('Por favor, defina um valor válido', 'error');
        return;
    }
    
    const despesaAtualizada = {
        ...despesaOriginal,
        valor: valorAtual,
        descricao: descricao,
        data: dataSelecionada,
        pago: document.getElementById('pago').checked,
        categoria: categoriaSelecionada,
        conta: contaSelecionada,
        repetir: document.getElementById('toggle-repetir')?.checked || false,
        fixa: document.getElementById('toggle-despesa-fixa')?.checked || false,
        dataAtualizacao: new Date()
    };
    
    try {
        await firebase.firestore().collection('despesas').doc(despesaId).update(despesaAtualizada);
        mostrarPopupMensagem('Despesa atualizada com sucesso!', 'success');
        
        setTimeout(() => {
            window.location.href = '../Lista-de-despesas/Lista-de-despesas.html';
        }, 1500);
    } catch (error) {
        console.error('Erro ao atualizar despesa:', error);
        mostrarPopupMensagem('Erro ao salvar alterações', 'error');
    }
}

// Função para excluir despesa
async function excluirDespesa() {
    if (!verificarFirebase()) {
        mostrarPopupMensagem('Modo desenvolvimento: exclusão simulada', 'success');
        return;
    }
    
    if (!despesaId) {
        mostrarPopupMensagem('Erro: despesa não identificada', 'error');
        return;
    }
    
    try {
        await firebase.firestore().collection('despesas').doc(despesaId).delete();
        mostrarPopupMensagem('Despesa excluída com sucesso!', 'success');
        
        setTimeout(() => {
            window.location.href = '../Lista-de-despesas/Lista-de-despesas.html';
        }, 1500);
    } catch (error) {
        console.error('Erro ao excluir despesa:', error);
        mostrarPopupMensagem('Erro ao excluir despesa', 'error');
    }
}

// Função para mostrar/ocultar campos de repetição
function mostrarCamposRepetir() {
    const camposRepetir = document.getElementById('campos-repetir');
    const toggleRepetir = document.getElementById('toggle-repetir');
    
    if (camposRepetir) {
        camposRepetir.style.display = toggleRepetir.checked ? 'block' : 'none';
    }
}

// Função para gerenciar toggles
function gerenciarToggles(tipo) {
    if (tipo === 'repetir') {
        mostrarCamposRepetir();
    }
}

// Função para alterar quantidade de repetições
function alterarQuantidade(delta) {
    const quantidadeInput = document.getElementById('quantidade-repeticoes');
    if (quantidadeInput) {
        const valorAtual = parseInt(quantidadeInput.value) || 1;
        const novoValor = Math.max(1, valorAtual + delta);
        quantidadeInput.value = novoValor;
    }
}

// Função para abrir calculadora
function abrirCalculadora() {
    const calculadoraContainer = document.getElementById('calculadora-container');
    if (calculadoraContainer) {
        calculadoraContainer.style.display = 'block';
        const display = document.getElementById('calculadora-display');
        if (display) {
            display.value = valorAtual.toString();
        }
    }
}

// Função para fechar calculadora
function fecharCalculadora() {
    const calculadoraContainer = document.getElementById('calculadora-container');
    if (calculadoraContainer) {
        calculadoraContainer.style.display = 'none';
    }
}

// Função para confirmar valor da calculadora
function confirmarValorCalculadora() {
    const display = document.getElementById('calculadora-display');
    if (display) {
        const novoValor = parseFloat(display.value.replace(',', '.')) || 0;
        if (novoValor > 0) {
            valorAtual = novoValor;
            atualizarExibicaoValor();
        }
    }
    fecharCalculadora();
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Obter ID da despesa da URL ou localStorage
    const urlParams = new URLSearchParams(window.location.search);
    despesaId = urlParams.get('id');
    
    if (!despesaId) {
        const despesaParaEditar = localStorage.getItem('despesaParaEditar');
        if (despesaParaEditar) {
            const despesa = JSON.parse(despesaParaEditar);
            despesaId = despesa.id;
            localStorage.removeItem('despesaParaEditar');
        }
    }
    
    if (despesaId) {
        carregarDespesaExistente(despesaId);
    } else {
        mostrarPopupMensagem('ID da despesa não encontrado', 'error');
        setTimeout(() => {
            window.location.href = '../Lista-de-despesas/Lista-de-despesas.html';
        }, 2000);
    }
    
    // Event listener para o botão salvar
    const botaoSalvar = document.getElementById('botao-salvar');
    if (botaoSalvar) {
        botaoSalvar.addEventListener('click', salvarAlteracoes);
    }
    
    // Event listener para o botão excluir
    const botaoExcluir = document.querySelector('.botao-excluir-topo');
    if (botaoExcluir) {
        botaoExcluir.addEventListener('click', () => {
            const popup = document.getElementById('popup-confirmacao');
            if (popup) {
                popup.style.display = 'flex';
            }
        });
    }
    
    // Event listeners para popup de confirmação de exclusão
    const popupCancelar = document.getElementById('popup-cancelar');
    const popupConfirmar = document.getElementById('popup-confirmar-exclusao');
    
    if (popupCancelar) {
        popupCancelar.addEventListener('click', () => {
            const popup = document.getElementById('popup-confirmacao');
            if (popup) {
                popup.style.display = 'none';
            }
        });
    }
    
    if (popupConfirmar) {
        popupConfirmar.addEventListener('click', () => {
            const popup = document.getElementById('popup-confirmacao');
            if (popup) {
                popup.style.display = 'none';
            }
            excluirDespesa();
        });
    }
    
    // Event listener para valor (abrir calculadora)
    const secaoValor = document.getElementById('secao-valor');
    if (secaoValor) {
        secaoValor.addEventListener('click', abrirCalculadora);
    }
    
    // Event listeners para calculadora
    const btnCancelarCalc = document.querySelector('.btn-cancelar-calculadora');
    const btnConfirmarCalc = document.querySelector('.btn-confirmar-calculadora');
    
    if (btnCancelarCalc) {
        btnCancelarCalc.addEventListener('click', fecharCalculadora);
    }
    
    if (btnConfirmarCalc) {
        btnConfirmarCalc.addEventListener('click', confirmarValorCalculadora);
    }
    
    // Event listener para campo de data
    const campoData = document.getElementById('campo-data');
    if (campoData) {
        campoData.addEventListener('click', () => {
            // Implementar calendário se necessário
            console.log('Abrir calendário');
        });
    }
    
    // Event listeners para seletores
    const seletorCategoria = document.getElementById('seletor-categoria');
    const seletorCarteira = document.getElementById('seletor-carteira');
    
    if (seletorCategoria) {
        seletorCategoria.addEventListener('click', () => {
            console.log('Abrir seletor de categoria');
        });
    }
    
    if (seletorCarteira) {
        seletorCarteira.addEventListener('click', () => {
            console.log('Abrir seletor de carteira');
        });
    }
    
    // Event listener para toggle de repetir
    const toggleRepetir = document.getElementById('toggle-repetir');
    if (toggleRepetir) {
        toggleRepetir.addEventListener('change', () => {
            gerenciarToggles('repetir');
        });
    }
    
    // Inicializar exibições
    atualizarExibicaoValor();
    atualizarExibicaoData();
    
    console.log('Editar-Despesa script carregado');
});

// Implementação básica da calculadora
document.addEventListener('DOMContentLoaded', function() {
    const calculadoraBotoes = document.querySelectorAll('.calculadora-botoes button:not(.btn-cancelar-calculadora):not(.btn-confirmar-calculadora)');
    const display = document.getElementById('calculadora-display');
    const botaoApagar = document.getElementById('botao-apagar');
    
    calculadoraBotoes.forEach(botao => {
        botao.addEventListener('click', () => {
            const valor = botao.textContent;
            
            if (valor === '=') {
                try {
                    const resultado = eval(display.value.replace(',', '.'));
                    display.value = resultado.toString().replace('.', ',');
                } catch (error) {
                    display.value = 'Erro';
                }
            } else if (valor === ',') {
                if (!display.value.includes(',')) {
                    display.value += ',';
                }
            } else if (['+', '-', '*', '/'].includes(valor)) {
                const ultimoChar = display.value.slice(-1);
                if (!['+', '-', '*', '/'].includes(ultimoChar)) {
                    display.value += valor;
                }
            } else {
                if (display.value === '0' || display.value === 'Erro') {
                    display.value = valor;
                } else {
                    display.value += valor;
                }
            }
        });
    });
    
    if (botaoApagar) {
        botaoApagar.addEventListener('click', () => {
            if (display.value.length > 1) {
                display.value = display.value.slice(0, -1);
            } else {
                display.value = '0';
            }
        });
    }
});
