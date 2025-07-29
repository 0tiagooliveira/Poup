document.addEventListener('DOMContentLoaded', function() {
    console.log('Aplicativo iniciado');

    // Bancos disponíveis
    const bancosDisponiveis = [
        { nome: 'Nubank', codigo: '260', cor: '#820AD1', icone: 'Nu' },
        { nome: 'Banco do Brasil', codigo: '001', cor: '#FFA500', icone: 'BB' },
        { nome: 'Bradesco', codigo: '237', cor: '#CC092F', icone: 'Br' },
        { nome: 'Itaú', codigo: '341', cor: '#EC7000', icone: 'It' },
        { nome: 'Santander', codigo: '033', cor: '#EC0000', icone: 'St' },
        { nome: 'Caixa', codigo: '104', cor: '#0060A9', icone: 'Cx' }
    ];

    // Tipos de conta disponíveis
    const tiposConta = [
        { nome: 'Conta corrente', icone: 'account_balance' },
        { nome: 'Conta salário', icone: 'payments' },
        { nome: 'Conta poupança', icone: 'savings' },
        { nome: 'Carteira', icone: 'wallet' },
        { nome: 'Investimentos', icone: 'trending_up' },
        { nome: 'Outros', icone: 'more_horiz' }
    ];

    // Armazenamento de contas
    let contasSalvas = JSON.parse(localStorage.getItem('contasBancarias')) || [];
    console.log('Contas carregadas do localStorage:', contasSalvas);

    // Elementos do DOM
    const elementos = {
        bancoSelecionado: document.querySelector('.banco-selecionado'),
        modalBancos: document.getElementById('modal-bancos'),
        listaBancos: document.querySelector('.lista-bancos'),
        botaoFecharModal: document.getElementById('fechar-modal'),
        botaoSalvar: document.getElementById('salvar-conta'),
        campoDescricao: document.getElementById('descricao-conta'),
        tipoContaContainer: document.getElementById('tipo-conta-container'),
        tipoContaTexto: document.getElementById('tipo-conta-texto'),
        botaoAdicionar: document.getElementById('botao-adicionar'),
        saldoContainer: document.querySelector('.saldo-container'),
        saldoValor: document.querySelector('.saldo-container h2'),
        calculadoraContainer: document.getElementById('calculadora-container'),
        calculadoraDisplay: document.getElementById('calculadora-display'),
        calculadoraBotoes: document.querySelector('.calculadora-botoes'),
        botaoApagar: document.querySelector('.apagar'),
        botaoCancelar: document.querySelector('.btn-cancelar-calculadora'),
        botaoConfirmar: document.querySelector('.btn-confirmar-calculadora'),
        modalTiposConta: document.getElementById('modal-tipos-conta'),
        listaTiposConta: document.querySelector('.lista-tipos-conta'),
        botaoFecharModalTipos: document.getElementById('fechar-modal-tipos')
    };

    console.log('Elementos do DOM carregados:', elementos);

    // Estado da aplicação
    let estado = {
        valorAtual: '0',
        digitandoValor: false,
        bancoSelecionado: { nome: 'Nubank', codigo: '260', cor: '#820AD1', icone: 'Nu' },
        tipoContaSelecionado: 'Conta corrente',
        contaEditando: null
    };

    // Funções da calculadora
    function abrirCalculadora() {
        console.log('Abrindo calculadora');
        elementos.calculadoraContainer.style.display = 'block';
        estado.valorAtual = elementos.saldoValor.textContent.replace('R$ ', '').replace(/\./g, '').replace(',', '.');
        elementos.calculadoraDisplay.value = formatarValor(estado.valorAtual);
        estado.digitandoValor = false;
    }

    function fecharCalculadora() {
        console.log('Fechando calculadora');
        elementos.calculadoraContainer.style.display = 'none';
    }

    function cancelarCalculadora() {
        console.log('Calculadora cancelada');
        fecharCalculadora();
    }

    function confirmarCalculadora() {
        console.log('Confirmando valor da calculadora:', estado.valorAtual);
        const valorFormatado = formatarMoeda(estado.valorAtual);
        elementos.saldoValor.textContent = `R$ ${valorFormatado}`;
        fecharCalculadora();
    }

    function adicionarNumero(numero) {
        console.log('Adicionando número:', numero);
        if (!estado.digitandoValor) {
            estado.valorAtual = '0';
            estado.digitandoValor = true;
        }
        
        if (estado.valorAtual === '0' && numero !== '.') {
            estado.valorAtual = numero;
        } else {
            if (estado.valorAtual.includes('.') && estado.valorAtual.split('.')[1].length >= 2) {
                console.log('Limite de casas decimais atingido');
                return;
            }
            estado.valorAtual += numero;
        }
        
        elementos.calculadoraDisplay.value = formatarValor(estado.valorAtual);
    }

    function adicionarOperacao(operacao) {
        console.log('Adicionando operação:', operacao);
        if (operacao === '.') {
            if (!estado.valorAtual.includes('.')) {
                estado.valorAtual += '.';
                estado.digitandoValor = true;
            }
        }
        elementos.calculadoraDisplay.value = formatarValor(estado.valorAtual);
    }

    function apagarInput() {
        console.log('Apagando input');
        if (estado.valorAtual.length > 1) {
            estado.valorAtual = estado.valorAtual.slice(0, -1);
        } else {
            estado.valorAtual = '0';
            estado.digitandoValor = false;
        }
        elementos.calculadoraDisplay.value = formatarValor(estado.valorAtual);
    }

    function formatarValor(valor) {
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

    // Configurar eventos da calculadora
    function configurarCalculadora() {
        console.log('Configurando calculadora');
        
        elementos.calculadoraBotoes.addEventListener('click', function(e) {
            if (e.target.tagName === 'BUTTON') {
                const valor = e.target.textContent;
                
                if (valor.match(/[0-9]/)) {
                    adicionarNumero(valor);
                } else if (valor === ',') {
                    adicionarOperacao('.');
                } else if (valor === '=') {
                    confirmarCalculadora();
                }
            }
        });

        elementos.botaoApagar.addEventListener('click', apagarInput);
        elementos.botaoCancelar.addEventListener('click', cancelarCalculadora);
        elementos.botaoConfirmar.addEventListener('click', confirmarCalculadora);
    }

    // Modal para seleção de tipo de conta
    function configurarTipoConta() {
        console.log('Configurando seleção de tipo de conta');
        
        if (!elementos.tipoContaContainer) {
            console.error('Elemento tipoContaContainer não encontrado');
            return;
        }

        // Preencher lista de tipos de conta
        elementos.listaTiposConta.innerHTML = '';
        tiposConta.forEach(tipo => {
            const item = document.createElement('div');
            item.className = 'item-banco';
            item.innerHTML = `
                <span class="material-icons">${tipo.icone}</span>
                <div class="info-banco">
                    <h3>${tipo.nome}</h3>
                </div>
            `;
            item.addEventListener('click', () => {
                console.log('Tipo de conta selecionado:', tipo.nome);
                elementos.tipoContaTexto.textContent = tipo.nome;
                estado.tipoContaSelecionado = tipo.nome;
                fecharModalTiposConta();
            });
            elementos.listaTiposConta.appendChild(item);
        });

        // Configurar eventos
        elementos.tipoContaContainer.addEventListener('click', abrirModalTiposConta);
        elementos.botaoFecharModalTipos.addEventListener('click', fecharModalTiposConta);
        elementos.modalTiposConta.addEventListener('click', (e) => {
            if (e.target === elementos.modalTiposConta) {
                fecharModalTiposConta();
            }
        });
    }

    function abrirModalTiposConta() {
        console.log('Abrindo modal de tipos de conta');
        elementos.modalTiposConta.style.display = 'flex';
    }

    function fecharModalTiposConta() {
        console.log('Fechando modal de tipos de conta');
        elementos.modalTiposConta.style.display = 'none';
    }

    // Preencher lista de bancos no modal
    function preencherListaBancos() {
        console.log('Preenchendo lista de bancos');
        elementos.listaBancos.innerHTML = '';
        bancosDisponiveis.forEach(banco => {
            const itemBanco = document.createElement('div');
            itemBanco.className = 'item-banco';
            itemBanco.innerHTML = `
                <div class="icone-banco" style="background-color: ${banco.cor}">${banco.icone}</div>
                <div class="info-banco">
                    <h3>${banco.nome}</h3>
                    <p>Banco ${banco.codigo}</p>
                </div>
            `;
            itemBanco.addEventListener('click', () => selecionarBanco(banco));
            elementos.listaBancos.appendChild(itemBanco);
        });
    }

    // Selecionar um banco
    function selecionarBanco(banco) {
        console.log('Banco selecionado:', banco.nome);
        const iconeBanco = document.querySelector('.icone-banco');
        const infoBanco = document.querySelector('.info-banco');
        
        iconeBanco.style.backgroundColor = banco.cor;
        iconeBanco.textContent = banco.icone;
        
        infoBanco.innerHTML = `
            <h3>${banco.nome}</h3>
            <p>Banco ${banco.codigo}</p>
        `;
        
        estado.bancoSelecionado = banco;
        fecharModalBancos();
    }

    // Abrir modal de bancos
    function abrirModalBancos() {
        console.log('Abrindo modal de bancos');
        elementos.modalBancos.style.display = 'flex';
    }

    // Fechar modal de bancos
    function fecharModalBancos() {
        console.log('Fechando modal de bancos');
        elementos.modalBancos.style.display = 'none';
    }

    // Função para mostrar popup customizado
    function mostrarPopup(mensagem, callback) {
        const popup = document.getElementById('popup-mensagem');
        const popupTexto = document.getElementById('popup-texto');
        const popupBotao = document.getElementById('popup-botao');
        popupTexto.textContent = mensagem;
        popup.style.display = 'flex';
        popupBotao.onclick = function() {
            popup.style.display = 'none';
            if (callback) callback();
        };
    }

    // Salvar conta bancária no Firestore
    function salvarConta() {
        console.log('Iniciando processo de salvar conta');
        
        const auth = firebase.auth();
        const db = firebase.firestore();
        const user = auth.currentUser;

        if (!user) {
            mostrarPopup('Você precisa estar logado para salvar uma conta.');
            return;
        }

        const descricao = elementos.campoDescricao.value.trim();
        const incluirSoma = document.getElementById('incluir-soma').checked;
        const notificacaoRapida = document.getElementById('notificacao-rapida').checked;
        
        if (!descricao) {
            mostrarPopup('Por favor, insira uma descrição para a conta.');
            return;
        }
        
        const dadosConta = {
            userId: user.uid, // Associa a conta ao usuário logado
            banco: estado.bancoSelecionado.nome,
            codigoBanco: estado.bancoSelecionado.codigo,
            corBanco: estado.bancoSelecionado.cor,
            iconeBanco: estado.bancoSelecionado.icone,
            descricao: descricao,
            tipo: estado.tipoContaSelecionado,
            saldo: elementos.saldoValor.textContent.replace('R$ ', ''),
            incluirSoma: incluirSoma,
            notificacaoRapida: notificacaoRapida,
            dataCriacao: new Date().toISOString()
        };
        
        console.log('Dados da conta a ser salva:', dadosConta);
        
        db.collection('contasBancarias').add(dadosConta)
            .then((docRef) => {
                console.log('Conta salva com sucesso no Firestore com ID: ', docRef.id);
                mostrarPopup(`Conta "${descricao}" salva com sucesso!`, function() {
                    window.location.href = "../Home/home.html";
                });
            })
            .catch((error) => {
                console.error("Erro ao salvar conta: ", error);
                mostrarPopup('Ocorreu um erro ao salvar a conta.');
            });
    }

    function resetarFormulario() {
        elementos.campoDescricao.value = '';
        document.getElementById('incluir-soma').checked = false;
        document.getElementById('notificacao-rapida').checked = false;
        elementos.saldoValor.textContent = 'R$ 0,00';
        
        // Resetar estado
        estado.valorAtual = '0';
        estado.digitandoValor = false;
    }

    // Navegar entre páginas
    function navegarPara(pagina) {
        console.log(`Navegando para: ${pagina}`);
        document.querySelectorAll('.item-navegacao').forEach(item => {
            item.classList.remove('ativo');
            if (item.dataset.pagina === pagina) {
                item.classList.add('ativo');
            }
        });
    }

    // Configurar eventos
    function configurarEventos() {
        console.log('Configurando eventos');
        
        elementos.bancoSelecionado.addEventListener('click', abrirModalBancos);
        elementos.botaoFecharModal.addEventListener('click', fecharModalBancos);
        elementos.modalBancos.addEventListener('click', (e) => {
            if (e.target === elementos.modalBancos) {
                fecharModalBancos();
            }
        });
        elementos.botaoSalvar.addEventListener('click', salvarConta);

        // Adiciona o event listener somente se o elemento existir
        if (elementos.botaoAdicionar) {
            elementos.botaoAdicionar.addEventListener('click', () => {
                console.log('Botão adicionar clicado');
            });
        }

        elementos.saldoContainer.addEventListener('click', abrirCalculadora);
        elementos.saldoValor.addEventListener('click', abrirCalculadora);

        document.querySelectorAll('.item-navegacao').forEach(item => {
            item.addEventListener('click', function() {
                navegarPara(this.dataset.pagina);
            });
        });

        // Botão voltar redireciona para a página de contas
        const botaoVoltar = document.querySelector('.botao-voltar');
        if (botaoVoltar) {
            botaoVoltar.addEventListener('click', function() {
                window.location.href = "./Contas/contas.html";
            });
        }
    }

    // Inicialização
    function inicializar() {
        console.log('Inicializando aplicativo');
        
        preencherListaBancos();
        configurarEventos();
        configurarCalculadora();
        configurarTipoConta();
        navegarPara('principal');
        
        // Ajustar altura do conteúdo principal
        const cabecalho = document.querySelector('.cabecalho');
        const saldoContainer = document.querySelector('.saldo-container');
        const navegacaoInferior = document.querySelector('.navegacao-inferior');
        const conteudoPrincipal = document.querySelector('.conteudo-principal');
        
        // Só calcula altura se todos os elementos existem
        if (cabecalho && saldoContainer && navegacaoInferior && conteudoPrincipal) {
            const alturaDisponivel = window.innerHeight - 
                                    cabecalho.offsetHeight - 
                                    saldoContainer.offsetHeight - 
                                    navegacaoInferior.offsetHeight;
            conteudoPrincipal.style.maxHeight = `${alturaDisponivel}px`;
        } else {
            console.warn('Algum elemento para cálculo de altura não foi encontrado:', {
                cabecalho, saldoContainer, navegacaoInferior, conteudoPrincipal
            });
        }
        
        console.log('Aplicativo inicializado com sucesso');
    }

    inicializar();
});