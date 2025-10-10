// Função auxiliar para mostrar mensagens
function mostrarPopupMensagem(mensagem) {
    alert(mensagem);
}

// Função para carregar dados da receita existente
function carregarReceitaExistente(receitaId) {
    console.log('Carregando receita existente com ID:', receitaId);
    
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            firebase.firestore().collection('receitas').doc(receitaId).get()
                .then(doc => {
                    if (doc.exists) {
                        const receitaOriginal = doc.data();
                        console.log('Receita carregada:', receitaOriginal);
                        preencherFormulario(receitaOriginal);
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
            // Garantir que o valor seja um número para formatação correta
            const valorNumerico = typeof receita.valor === 'string' ? 
                parseFloat(receita.valor.replace(/[^0-9,.-]/g, '').replace(',', '.')) : 
                receita.valor;
            valorReceita.textContent = formatarMoeda(valorNumerico);
        }
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
            opcaoSelecionadaCategoria.innerHTML = `<span>${receita.categoria}</span>`;
        }
    }
    
    // Preencher carteira
    if (receita.carteira) {
        const opcaoSelecionadaCarteira = document.querySelector('.seletor-carteira .opcao-selecionada');
        if (opcaoSelecionadaCarteira) {
            let nomeCarteira = receita.carteira;
            if (typeof receita.carteira === 'object') {
                nomeCarteira = receita.carteira.nome || receita.carteira.banco || receita.carteira.id || 'Conta';
            }
            opcaoSelecionadaCarteira.innerHTML = `<span>${nomeCarteira}</span>`;
        }
        window.contaSelecionada = receita.carteira;
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
                    mostrarPopupMensagem('Receita excluída com sucesso!');
                    setTimeout(() => {
                        window.location.href = '../Lista-de-receitas/Lista-de-receitas.html';
                    }, 1500);
                })
                .catch(error => {
                    console.error('Erro ao excluir receita:', error);
                    mostrarPopupMensagem('Erro ao excluir receita. Tente novamente.');
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
            window.contaSelecionada = conta;
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
            
            if (contas.length > 0) {
                carregarContasNoSeletor(contas);
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
        mostrarPopupMensagem('Por favor, insira um valor para a receita.');
        return;
    }
    
    if (!inputDescricao || !inputDescricao.value.trim()) {
        mostrarPopupMensagem('Por favor, insira uma descrição para a receita.');
        return;
    }
    
    // Coletar dados do formulário
    const checkboxRecebido = document.getElementById('recebido');
    const dataSelecionada = document.getElementById('data-selecionada');
    const opcaoCategoria = document.querySelector('.seletor-categoria .opcao-selecionada span');
    
    const receitaAtualizada = {
        valor: valorReceita.textContent.replace('R$ ', ''),
        recebido: checkboxRecebido ? checkboxRecebido.checked : true,
        data: dataSelecionada ? dataSelecionada.textContent : new Date().toLocaleDateString('pt-BR'),
        descricao: inputDescricao.value.trim(),
        categoria: opcaoCategoria ? opcaoCategoria.textContent : 'Sem categoria',
        carteira: window.contaSelecionada || 'Sem carteira',
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
                    mostrarPopupMensagem('Receita atualizada com sucesso!');
                    setTimeout(() => {
                        window.location.href = '../Lista-de-receitas/Lista-de-receitas.html';
                    }, 1500);
                })
                .catch(error => {
                    console.error('Erro ao atualizar receita:', error);
                    mostrarPopupMensagem('Erro ao atualizar receita. Tente novamente.');
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
    const botaoExcluir = document.querySelector('.botao-secundario');
    const botaoSalvar = document.querySelector('.botao-primario');
    const popupConfirmacao = document.getElementById('popup-confirmacao');
    const popupCancelar = document.getElementById('popup-cancelar');
    const popupConfirmarExclusao = document.getElementById('popup-confirmar-exclusao');
    
    if (botaoExcluir) {
        botaoExcluir.addEventListener('click', function() {
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
