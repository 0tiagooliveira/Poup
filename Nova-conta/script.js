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
        botaoFecharModalTipos: document.getElementById('fechar-modal-tipos'),
        inputNomeConta:
            document.getElementById('descricao-conta') ||
            document.getElementById('nome-conta') ||
            document.querySelector('input#nome-conta') ||
            document.querySelector('input[name="nome-conta"]') ||
            document.querySelector('input[placeholder*="nome" i]') ||
            document.querySelector('input[type="text"]'),
        inputSaldo:
            document.getElementById('saldo-valor') || // <h2 id="saldo-valor">R$ 4,00</h2>
            document.querySelector('.saldo-container h2') ||
            document.getElementById('saldo-conta') ||
            document.querySelector('input#saldo-conta') ||
            document.querySelector('input[name="saldo-conta"]') ||
            document.querySelector('input[placeholder*="saldo" i]') ||
            document.querySelector('input[placeholder*="limite" i]') ||
            document.querySelector('input[type="number"]')
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

    // Salvar conta bancária no Firebase
    const auth = firebase.auth();
    const db   = firebase.firestore();

    function salvarConta(user) { // A função agora recebe o usuário como parâmetro
        console.log('Iniciando processo de salvar conta');
        
        // Verificar se o Firebase está disponível
        if (typeof firebase === 'undefined' || !firebase.auth || !firebase.firestore) {
            console.error('Firebase não está disponível');
            mostrarPopup('Erro: Sistema de autenticação não disponível.');
            return;
        }

        // A verificação do usuário agora é feita antes de chamar a função
        if (!user) {
            console.error("Usuário não autenticado, não é possível salvar.");
            mostrarPopup('Você não está logado. Faça login para salvar.');
            return;
        }

        const descricao = elementos.campoDescricao.value.trim();
        const incluirSoma = document.getElementById('incluir-soma') ? document.getElementById('incluir-soma').checked : false;
        const notificacaoRapida = document.getElementById('notificacao-rapida') ? document.getElementById('notificacao-rapida').checked : false;
        
        if (!descricao) {
            mostrarPopup('Por favor, insira uma descrição para a conta.');
            return;
        }
        
        // Verificação defensiva dos campos
        // Debug: mostrar os campos encontrados
        console.log('inputNomeConta:', elementos.inputNomeConta);
        console.log('inputSaldo:', elementos.inputSaldo);

        if (!elementos.inputNomeConta || !elementos.inputSaldo) {
            alert('Campos obrigatórios não encontrados no formulário. Confira se existe um input com id="descricao-conta" para o nome e um valor exibido como saldo.');
            // Exibe todos os inputs para facilitar debug
            console.log('Todos os inputs na página:', Array.from(document.querySelectorAll('input')).map(i => ({id: i.id, name: i.name, placeholder: i.placeholder, type: i.type})));
            return;
        }

        // Obtenção dos valores com fallback seguro
        const nomeConta = elementos.inputNomeConta.value ? elementos.inputNomeConta.value.trim() : '';
        let saldoConta = '';

        // Sempre extraia o saldo como texto, trate para float
        if (elementos.inputSaldo.value !== undefined && elementos.inputSaldo.value !== "") {
            saldoConta = elementos.inputSaldo.value;
        } else if (elementos.inputSaldo.textContent) {
            saldoConta = elementos.inputSaldo.textContent;
        } else {
            saldoConta = '0';
        }

        // Normaliza o saldo para float (aceita "R$ 1.234,56", "1234,56", "1234.56", etc)
        saldoConta = saldoConta
            .replace(/\s/g, '')         // remove espaços
            .replace('R$', '')          // remove R$
            .replace(/\./g, '')         // remove pontos de milhar
            .replace(',', '.');         // troca vírgula por ponto

        let saldoFloat = parseFloat(saldoConta);
        if (isNaN(saldoFloat)) saldoFloat = 0;

        // Corrigir campos obrigatórios para não enviar undefined ao Firebase
        const tipoConta = estado.tipoContaSelecionado || 'Conta corrente';
        const iconeConta = estado.bancoSelecionado?.icone || '🏦';
        const corConta = estado.bancoSelecionado?.cor || '#ccc';

        const novaConta = {
            nome: nomeConta,
            saldo: saldoFloat,
            tipo: tipoConta,
            icone: iconeConta,
            cor: corConta,
            userId: user.uid, // Usa o ID do usuário passado como parâmetro
            criadoEm: firebase.firestore.FieldValue.serverTimestamp()
        };

        console.log('Dados da conta a ser salva no Firebase:', novaConta);

        db.collection('contas').add(novaConta) // Corrigido para 'contas' para corresponder às regras
            .then((docRef) => {
                console.log('Conta salva no Firestore:', novaConta, 'ID:', docRef.id);
                mostrarPopup('Conta salva com sucesso!', () => {
                    window.location.href = '../Contas/contas.html'; // Redirecionado para a lista de contas
                });
                // Salvar também no localStorage com o ID do Firestore
                novaConta.id = docRef.id;
                let contas = JSON.parse(localStorage.getItem('contasBancarias')) || [];
                contas.push(novaConta);
                localStorage.setItem('contasBancarias', JSON.stringify(contas));
            })
            .catch(error => {
                console.error('Erro ao salvar conta:', error);
                mostrarPopup('Erro ao salvar conta. Tente novamente.');
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
        // A linha abaixo que adicionava o evento de salvar será removida daqui
        // e movida para dentro do verificador de autenticação.
        // elementos.botaoSalvar.addEventListener('click', salvarConta);

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
        
        // Desabilita o botão salvar inicialmente
        if (elementos.botaoSalvar) {
            elementos.botaoSalvar.disabled = true;
            elementos.botaoSalvar.textContent = 'Aguarde...';
        }

        // Verifica o estado de autenticação
        auth.onAuthStateChanged(user => {
            if (user) {
                console.log("Usuário autenticado:", user.uid);
                if (elementos.botaoSalvar) {
                    elementos.botaoSalvar.disabled = false;
                    elementos.botaoSalvar.textContent = 'Salvar';
                    // Adiciona o evento de clique APENAS quando o usuário está logado
                    elementos.botaoSalvar.addEventListener('click', () => salvarConta(user));
                }
            } else {
                console.warn("Nenhum usuário autenticado.");
                if (elementos.botaoSalvar) {
                    elementos.botaoSalvar.textContent = 'Faça login para salvar';
                }
            }
        });

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