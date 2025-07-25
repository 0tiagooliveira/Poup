document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const elementos = {
        botaoVoltar: document.querySelector('.botao-voltar'),
        secaoLimite: document.getElementById('secao-limite'),
        valorLimite: document.getElementById('valor-limite'),
        inputNomeCartao: document.getElementById('nome-cartao'),
        seletorBandeira: document.getElementById('seletor-bandeira'),
        opcaoSelecionadaBandeira: document.querySelector('.seletor-bandeira .opcao-selecionada'),
        opcoesBandeira: document.querySelector('.seletor-bandeira .opcoes-bandeira'),
        seletorConta: document.getElementById('seletor-conta'),
        opcaoSelecionadaConta: document.querySelector('.seletor-conta .opcao-selecionada'),
        opcoesConta: document.querySelector('.seletor-conta .opcoes-conta'),
        seletorFechamento: document.getElementById('seletor-fechamento'),
        opcaoSelecionadaFechamento: document.querySelector('#seletor-fechamento .opcao-selecionada'),
        opcoesFechamento: document.querySelector('#seletor-fechamento .opcoes-dia'),
        seletorVencimento: document.getElementById('seletor-vencimento'),
        opcaoSelecionadaVencimento: document.querySelector('#seletor-vencimento .opcao-selecionada'),
        opcoesVencimento: document.querySelector('#seletor-vencimento .opcoes-dia'),
        botaoSalvar: document.getElementById('botao-salvar'),
        calculadoraContainer: document.getElementById('calculadora-container'),
        calculadoraDisplay: document.getElementById('calculadora-display'),
        calculadoraBotoes: document.querySelector('.calculadora-botoes'),
        botaoApagar: document.getElementById('botao-apagar'),
        btnCancelarCalculadora: document.querySelector('.btn-cancelar-calculadora'),
        btnConfirmarCalculadora: document.querySelector('.btn-confirmar-calculadora'),
        modalConfirmacao: document.querySelector('.modal'),
        modalTitulo: document.getElementById('modal-titulo'),
        modalMensagem: document.getElementById('modal-mensagem'),
        modalBotaoConfirmar: document.querySelector('.botao-modal'),
        modalBotaoCancelar: document.querySelector('.botao-modal-secundario'),
        gerenciarContas: document.getElementById('gerenciar-contas'),
        adicionarConta: document.getElementById('adicionar-conta')
    };

    // Estado da aplicação
    const estado = {
        valorLimite: '0',
        digitandoValor: false,
        bandeiraSelecionada: null,
        contaSelecionada: null,
        diaFechamento: null,
        diaVencimento: null,
        contaParaExcluir: null
    };

    // Estado da aplicação - adicionar variáveis para gráfico de receitas
    let graficoInstance = null;
    let graficoReceitasInstance = null;
    let filtroAtual = 'atual';
    let filtroReceitaAtual = 'atual';

    // Inicialização
    function inicializar() {
        console.log('Inicializando aplicação Novo Cartão...');
        console.log('Elementos carregados:', elementos);
        configurarEventos();

        inicializarSeletorMes();

        if (document.getElementById('container-contas-home')) {
            carregarContas();
        }

        // Carregar receitas/despesas nos cartões principais
        atualizarValoresReceitasDespesas();

        if (document.querySelector('#seletor-fechamento .opcoes-dia') || document.querySelector('#seletor-vencimento .opcoes-dia')) {
            gerarOpcoesDias();
        }

        mostrarLocalStorage();
        
        // Inicializar gráfico de despesas por categoria
        inicializarGraficoCategorias();
        
        // Inicializar gráfico de receitas por categoria
        inicializarGraficoReceitas();
        
        console.log('Aplicação inicializada com sucesso');
    }

    // Configurar eventos
    function configurarEventos() {
        console.log('Configurando eventos...');
        // Botão voltar
        if (elementos.botaoVoltar) {
            elementos.botaoVoltar.addEventListener('click', function() {
                window.history.back();
            });
        }

        // Seção limite (calculadora)
        if (elementos.secaoLimite) {
            elementos.secaoLimite.addEventListener('click', abrirCalculadora);
        }

        // Calculadora
        if (elementos.calculadoraContainer) {
            elementos.calculadoraContainer.addEventListener('click', function(e) {
                if (e.target === elementos.calculadoraContainer) {
                    fecharCalculadora();
                }
            });
        }

        // Eventos da calculadora
        if (elementos.calculadoraBotoes) {
            elementos.calculadoraBotoes.addEventListener('click', function(e) {
                if (e.target.tagName === 'BUTTON') {
                    const valor = e.target.textContent.trim();
                    if (valor.match(/[0-9]/)) {
                        adicionarNumero(valor);
                    } else if (valor === ',') {
                        adicionarNumero('.');
                    } else if (valor === '=' || e.target.classList.contains('tecla-igual')) {
                        confirmarCalculadora();
                    }
                }
            });
        }

        if (elementos.botaoApagar) {
            elementos.botaoApagar.addEventListener('click', apagarInput);
        }

        if (elementos.btnCancelarCalculadora) {
            elementos.btnCancelarCalculadora.addEventListener('click', cancelarCalculadora);
        }

        if (elementos.btnConfirmarCalculadora) {
            elementos.btnConfirmarCalculadora.addEventListener('click', confirmarCalculadora);
        }

        // Seletor de bandeira
        if (elementos.opcaoSelecionadaBandeira && elementos.opcoesBandeira) {
            elementos.opcaoSelecionadaBandeira.addEventListener('click', function(e) {
                e.stopPropagation();
                elementos.opcoesBandeira.classList.toggle('mostrar');
            });

            elementos.opcoesBandeira.addEventListener('click', function(e) {
                const opcao = e.target.closest('.opcao-bandeira');
                if (opcao) {
                    estado.bandeiraSelecionada = opcao.getAttribute('data-value');
                    elementos.opcaoSelecionadaBandeira.innerHTML = opcao.innerHTML;
                    elementos.opcoesBandeira.classList.remove('mostrar');
                }
            });
        }

        // Seletor de conta
        if (elementos.opcaoSelecionadaConta && elementos.opcoesConta) {
            elementos.opcaoSelecionadaConta.addEventListener('click', function(e) {
                e.stopPropagation();
                elementos.opcoesConta.classList.toggle('mostrar');
            });

            elementos.opcoesConta.addEventListener('click', function(e) {
                const opcao = e.target.closest('.opcao-conta');
                if (opcao) {
                    if (opcao.classList.contains('opcao-nova-conta')) {
                        mostrarModal('Nova Conta', 'Redirecionando para tela de nova conta...');
                    } else {
                        estado.contaSelecionada = opcao.getAttribute('data-value');
                        elementos.opcaoSelecionadaConta.innerHTML = opcao.innerHTML;
                        elementos.opcoesConta.classList.remove('mostrar');
                    }
                }
            });
        }

        // Seletor de fechamento
        if (elementos.opcaoSelecionadaFechamento && elementos.opcoesFechamento) {
            elementos.opcaoSelecionadaFechamento.addEventListener('click', function(e) {
                e.stopPropagation();
                elementos.opcoesFechamento.classList.toggle('mostrar');
            });

            elementos.opcoesFechamento.addEventListener('click', function(e) {
                const opcao = e.target.closest('.opcao-dia');
                if (opcao) {
                    estado.diaFechamento = opcao.getAttribute('data-value');
                    elementos.opcaoSelecionadaFechamento.innerHTML = `<span>Dia ${opcao.textContent}</span>`;
                    elementos.opcoesFechamento.classList.remove('mostrar');
                }
            });
        }

        // Seletor de vencimento
        if (elementos.opcaoSelecionadaVencimento && elementos.opcoesVencimento) {
            elementos.opcaoSelecionadaVencimento.addEventListener('click', function(e) {
                e.stopPropagation();
                elementos.opcoesVencimento.classList.toggle('mostrar');
            });

            elementos.opcoesVencimento.addEventListener('click', function(e) {
                const opcao = e.target.closest('.opcao-dia');
                if (opcao) {
                    estado.diaVencimento = opcao.getAttribute('data-value');
                    elementos.opcaoSelecionadaVencimento.innerHTML = `<span>Dia ${opcao.textContent}</span>`;
                    elementos.opcoesVencimento.classList.remove('mostrar');
                }
            });
        }

        // Botão salvar
        if (elementos.botaoSalvar) {
            elementos.botaoSalvar.addEventListener('click', salvarCartao);
        }

        // Gerenciar contas
        if (elementos.gerenciarContas) {
            elementos.gerenciarContas.addEventListener('click', function() {
                mostrarModal('Gerenciar Contas', 'Funcionalidade de gerenciamento de contas em breve!');
            });
        }

        // Adicionar conta
        if (elementos.adicionarConta) {
            elementos.adicionarConta.addEventListener('click', function() {
                mostrarModal('Nova Conta', 'Redirecionando para tela de nova conta...');
            });
        }

        // Filtros de categoria (despesas)
        const botoesFiltro = document.querySelectorAll('.botao-filtro');
        botoesFiltro.forEach(botao => {
            botao.addEventListener('click', function() {
                botoesFiltro.forEach(b => b.classList.remove('ativo'));
                this.classList.add('ativo');
                filtroAtual = this.getAttribute('data-filtro');
                atualizarGraficoCategorias();
            });
        });

        // Filtros de receitas por categoria
        const botoesFiltroReceita = document.querySelectorAll('.botao-filtro-receita');
        botoesFiltroReceita.forEach(botao => {
            botao.addEventListener('click', function() {
                botoesFiltroReceita.forEach(b => b.classList.remove('ativo'));
                this.classList.add('ativo');
                filtroReceitaAtual = this.getAttribute('data-filtro');
                atualizarGraficoReceitas();
            });
        });
        
        // Fechar dropdowns ao clicar fora
        document.addEventListener('click', function() {
            document.querySelectorAll('.opcoes-bandeira, .opcoes-conta, .opcoes-dia').forEach(function(drop) {
                drop.classList.remove('mostrar');
            });
        });

        // Acessibilidade: abrir dropdowns com Enter
        document.querySelectorAll('.opcao-selecionada').forEach(function(el) {
            el.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const next = el.nextElementSibling;
                    if (next && next.classList.contains('opcoes-bandeira')) next.classList.toggle('mostrar');
                    if (next && next.classList.contains('opcoes-conta')) next.classList.toggle('mostrar');
                    if (next && next.classList.contains('opcoes-dia')) next.classList.toggle('mostrar');
                }
            });
        });

        // Modal de confirmação
        if (elementos.modalBotaoConfirmar) {
            elementos.modalBotaoConfirmar.addEventListener('click', function() {
                elementos.modalConfirmacao.classList.remove('mostrar');
            });
        }

        if (elementos.modalBotaoCancelar) {
            elementos.modalBotaoCancelar.addEventListener('click', function() {
                elementos.modalConfirmacao.classList.remove('mostrar');
            });
        }

        // Listener para mudanças no localStorage (quando receitas/despesas forem alteradas em outras páginas)
        window.addEventListener('storage', function(e) {
            if (e.key === 'receitas' || e.key === 'despesas' || e.key === 'contasBancarias') {
                console.log('Mudança detectada no localStorage:', e.key);
                atualizarValoresReceitasDespesas();
                if (e.key === 'contasBancarias') {
                    carregarContas();
                }
            }
        });

        // Listener para foco na janela (quando voltar de outra página)
        window.addEventListener('focus', function() {
            console.log('Janela em foco - atualizando valores');
            atualizarValoresReceitasDespesas();
            if (document.getElementById('container-contas-home')) {
                carregarContas();
            }
        });

        // Contas - redirecionar ao clicar em uma conta
        const contas = document.querySelectorAll('.conta-item'); // Supondo que as contas tenham a classe 'conta-item'

        contas.forEach(conta => {
            conta.addEventListener('click', function() {
                console.log(`Conta clicada: ${conta.dataset.id}`); // Supondo que cada conta tenha um atributo data-id
                window.location.href = '../Contas/contas.html';
            });
        });

        // Selecionar todas as contas na seção de contas
        const contasHomeCards = document.querySelectorAll('#container-contas-home .cartao-estado-ativas');

        if (contasHomeCards.length === 0) {
            console.warn('Nenhuma conta encontrada na seção de contas.');
        }

        contasHomeCards.forEach(conta => {
            conta.addEventListener('click', function() {
                console.log(`Conta clicada: ${conta.dataset.id || 'sem ID'}`);
                window.location.href = '../Contas/contas.html';
            });
        });

        console.log('Eventos de clique configurados para os elementos na seção de contas.');
    }

    // Carregar contas do localStorage
    function carregarContas() {
        const containerContas = document.getElementById('container-contas-home');
        const cartaoVazio = document.getElementById('cartao-estado-vazio-contas');

        let contas = [];
        try {
            contas = JSON.parse(localStorage.getItem('contasBancarias')) || [];
        } catch {
            contas = [];
        }

        containerContas.innerHTML = '';

        if (contas.length > 0) {
            if (cartaoVazio) cartaoVazio.style.display = 'none';

            const cartaoAtivas = document.createElement('div');
            cartaoAtivas.className = 'cartao-estado-ativas';

            contas.forEach(conta => {
                const nomeConta = conta.nome || conta.nomeConta || conta.descricao || conta.banco || 'Conta sem nome';
                const tipoConta = conta.tipo || conta.codigoBanco || '';
                const saldoConta = conta.saldo ? 'R$ ' + conta.saldo : '';
                let iconeHtml = '';
                if (conta.iconeBanco && conta.iconeBanco.length <= 3) {
                    iconeHtml = `<span class="icone-conta-custom">${conta.iconeBanco}</span>`;
                } else {
                    iconeHtml = `<span class="material-icons-round">${conta.iconeBanco || 'account_balance'}</span>`;
                }

                const contaDiv = document.createElement('div');
                contaDiv.className = 'conta-home-card';
                contaDiv.setAttribute('onclick', "window.location.href='../Contas/contas.html'"); // Adiciona o redirecionamento
                contaDiv.innerHTML = `
                    ${iconeHtml}
                    <div class="conta-info">
                        <span class="conta-nome">${nomeConta}</span>
                        <span class="conta-tipo">${tipoConta}</span>
                    </div>
                    <span class="conta-saldo">${saldoConta}</span>
                    <button class="btn-excluir-conta" title="Excluir conta" data-id="${conta.id}">
                        <span class="material-icons-round">delete</span>
                    </button>
                `;
                contaDiv.querySelector('.btn-excluir-conta').onclick = function(e) {
                    e.stopPropagation();
                    mostrarPopupExcluirConta(conta.id, nomeConta);
                };
                cartaoAtivas.appendChild(contaDiv);
            });

            // Botão centralizado igual ao de "Adicionar cartão"
            const divCentral = document.createElement('div');
            divCentral.style.display = "flex";
            divCentral.style.justifyContent = "center";
            divCentral.style.alignItems = "center";
            divCentral.style.marginTop = "24px";
            divCentral.innerHTML = `
                <a href="../Nova-conta/Nova-conta.html" class="botao-primario">Adicionar nova conta</a>
            `;
            cartaoAtivas.appendChild(divCentral);

            containerContas.appendChild(cartaoAtivas);
        } else {
            if (cartaoVazio) cartaoVazio.style.display = '';
        }

        console.log('Contas carregadas:', contas);
        mostrarLocalStorage();
        
        // Atualizar saldo total quando as contas forem carregadas
        atualizarValoresReceitasDespesas();
    }

    // Função para mostrar popup customizado de exclusão
    function mostrarPopupExcluirConta(id, nomeConta) {
        const popup = document.getElementById('popup-excluir-conta-custom');
        const msg = document.getElementById('popup-excluir-conta-msg');
        const btnSim = document.getElementById('popup-excluir-conta-sim');
        const btnNao = document.getElementById('popup-excluir-conta-nao');

        if (!popup || !msg || !btnSim || !btnNao) return;

        msg.textContent = `Você tem certeza que quer excluir "${nomeConta}"?`;
        popup.style.display = 'flex';

        // Remove listeners antigos
        btnSim.onclick = null;
        btnNao.onclick = null;

        btnSim.onclick = function() {
            excluirConta(id);
            popup.style.display = 'none';
        };
        btnNao.onclick = function() {
            popup.style.display = 'none';
        };
    }

    // Função para excluir a conta do localStorage
    function excluirConta(id) {
        let contas = [];
        try {
            contas = JSON.parse(localStorage.getItem('contasBancarias')) || [];
        } catch {
            contas = [];
        }
        contas = contas.filter(conta => conta.id !== id);
        localStorage.setItem('contasBancarias', JSON.stringify(contas));
        carregarContas();
    }

    // Confirmar exclusão de conta
    function confirmarExclusaoConta() {
        if (!estado.contaParaExcluir) return;

        // Simular exclusão (na implementação real, você removeria do localStorage)
        console.log(`Conta excluída: ${estado.contaParaExcluir}`);
        mostrarModal('Sucesso', 'Conta excluída com sucesso!');
        
        // Recarregar contas
        carregarContas();
        estado.contaParaExcluir = null;
        console.log('Exclusão confirmada para conta:', estado.contaParaExcluir);
        mostrarLocalStorage();
    }

    // Gerar opções de dias (1-31)
    function gerarOpcoesDias() {
        // Verifique se os elementos existem antes de usar
        if (!elementos.opcoesFechamento) {
            console.error('elementos.opcoesFechamento não encontrado. Verifique se o seletor "#seletor-fechamento .opcoes-dia" existe no HTML.');
            return;
        }
        if (!elementos.opcoesVencimento) {
            console.error('elementos.opcoesVencimento não encontrado. Verifique se o seletor "#seletor-vencimento .opcoes-dia" existe no HTML.');
            return;
        }

        elementos.opcoesFechamento.innerHTML = '';
        elementos.opcoesVencimento.innerHTML = '';
        
        for (let dia = 1; dia <= 31; dia++) {
            const opcaoFechamento = document.createElement('div');
            opcaoFechamento.className = 'opcao-dia';
            opcaoFechamento.setAttribute('data-value', dia);
            opcaoFechamento.textContent = dia;
            elementos.opcoesFechamento.appendChild(opcaoFechamento);

            const opcaoVencimento = document.createElement('div');
            opcaoVencimento.className = 'opcao-dia';
            opcaoVencimento.setAttribute('data-value', dia);
            opcaoVencimento.textContent = dia;
            elementos.opcoesVencimento.appendChild(opcaoVencimento);
        }
        console.log('Opções de dias geradas para fechamento e vencimento.');
    }

    // Funções da calculadora
    function abrirCalculadora() {
        elementos.calculadoraContainer.style.display = 'block';
        estado.valorLimite = elementos.valorLimite.textContent.replace('R$ ', '').replace(/\./g, '').replace(',', '.');
        elementos.calculadoraDisplay.value = formatarValor(estado.valorLimite);
        estado.digitandoValor = false;
        console.log('Abrindo calculadora. Valor atual:', estado.valorLimite);
    }

    function fecharCalculadora() {
        elementos.calculadoraContainer.style.display = 'none';
        console.log('Fechando calculadora.');
    }

    function cancelarCalculadora() {
        fecharCalculadora();
        console.log('Cancelando calculadora.');
    }

    function confirmarCalculadora() {
        const valorFormatado = formatarMoeda(estado.valorLimite);
        elementos.valorLimite.textContent = `R$ ${valorFormatado}`;
        fecharCalculadora();
        console.log('Confirmando valor na calculadora:', estado.valorLimite);
    }

    function adicionarNumero(numero) {
        if (!estado.digitandoValor) {
            estado.valorLimite = '0';
            estado.digitandoValor = true;
        }
        if (estado.valorLimite === '0' && numero !== '.') {
            estado.valorLimite = numero;
        } else {
            if (estado.valorLimite.includes('.') && estado.valorLimite.split('.')[1].length >= 2) {
                return;
            }
            estado.valorLimite += numero;
        }
        elementos.calculadoraDisplay.value = formatarValor(estado.valorLimite);
        console.log('Número adicionado:', numero, 'Valor atual:', estado.valorLimite);
    }

    function apagarInput() {
        if (estado.valorLimite.length > 1) {
            estado.valorLimite = estado.valorLimite.slice(0, -1);
        } else {
            estado.valorLimite = '0';
            estado.digitandoValor = false;
        }
        elementos.calculadoraDisplay.value = formatarValor(estado.valorLimite);
        console.log('Apagando input. Valor atual:', estado.valorLimite);
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

    // Mostrar modal
    function mostrarModal(titulo, mensagem) {
        if (elementos.modalTitulo && elementos.modalMensagem) {
            elementos.modalTitulo.textContent = titulo;
            elementos.modalMensagem.textContent = mensagem;
            elementos.modalConfirmacao.classList.add('mostrar');
            console.log('Modal exibido:', titulo, mensagem);
        }
    }

    // Mostrar modal de confirmação
    function mostrarModalConfirmacao(titulo, mensagem, callbackConfirmar) {
        if (elementos.modalTitulo && elementos.modalMensagem) {
            elementos.modalTitulo.textContent = titulo;
            elementos.modalMensagem.textContent = mensagem;
            
            // Configurar botão de confirmação
            elementos.modalBotaoConfirmar.onclick = function() {
                elementos.modalConfirmacao.classList.remove('mostrar');
                if (callbackConfirmar) callbackConfirmar();
            };
            
            elementos.modalConfirmacao.classList.add('mostrar');
            console.log('Modal de confirmação exibido:', titulo, mensagem);
        }
    }

    // Salvar cartão
    function salvarCartao() {
        // Validação dos campos
        if (elementos.valorLimite.textContent === 'R$ 0,00') {
            mostrarModal('Atenção', 'Por favor, insira o limite do cartão');
            return;
        }
        if (!elementos.inputNomeCartao.value.trim()) {
            mostrarModal('Atenção', 'Por favor, insira um nome para o cartão');
            return;
        }
        if (!estado.bandeiraSelecionada) {
            mostrarModal('Atenção', 'Por favor, selecione a bandeira do cartão');
            return;
        }
        if (!estado.contaSelecionada) {
            mostrarModal('Atenção', 'Por favor, selecione uma conta vinculada');
            return;
        }
        if (!estado.diaFechamento) {
            mostrarModal('Atenção', 'Por favor, selecione o dia de fechamento');
            return;
        }
        if (!estado.diaVencimento) {
            mostrarModal('Atenção', 'Por favor, selecione o dia de vencimento');
            return;
        }

        // Criar objeto com os dados do cartão
        const novoCartao = {
            nome: elementos.inputNomeCartao.value,
            limite: elementos.valorLimite.textContent,
            bandeira: estado.bandeiraSelecionada,
            conta: estado.contaSelecionada,
            diaFechamento: estado.diaFechamento,
            diaVencimento: estado.diaVencimento,
            dataCriacao: new Date().toISOString()
        };

        // Salvar no localStorage
        let cartoes = JSON.parse(localStorage.getItem('cartoesCredito')) || [];
        cartoes.push(novoCartao);
        localStorage.setItem('cartoesCredito', JSON.stringify(cartoes));

        // Feedback ao usuário
        mostrarModal('Sucesso', 'Cartão salvo com sucesso!');
        
        // Limpar formulário
        resetarFormulario();
        console.log('Salvando cartão...', {
            nome: elementos.inputNomeCartao.value,
            limite: elementos.valorLimite.textContent,
            bandeira: estado.bandeiraSelecionada,
            conta: estado.contaSelecionada,
            diaFechamento: estado.diaFechamento,
            diaVencimento: estado.diaVencimento
        });
        mostrarLocalStorage();
    }

    // Resetar formulário
    function resetarFormulario() {
        elementos.valorLimite.textContent = 'R$ 0,00';
        elementos.inputNomeCartao.value = '';
        elementos.opcaoSelecionadaBandeira.innerHTML = '<span>Selecione a bandeira</span>';
        elementos.opcaoSelecionadaConta.innerHTML = '<span>Selecione uma conta</span>';
        elementos.opcaoSelecionadaFechamento.innerHTML = '<span>Selecione</span>';
        elementos.opcaoSelecionadaVencimento.innerHTML = '<span>Selecione</span>';
        
        // Resetar estado
        estado.valorLimite = '0';
        estado.bandeiraSelecionada = null;
        estado.contaSelecionada = null;
        estado.diaFechamento = null;
        estado.diaVencimento = null;
        console.log('Formulário resetado.');
    }

    // Mostrar conteúdo do localStorage
    function mostrarLocalStorage() {
        console.log('Conteúdo atual do localStorage:');
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            try {
                const value = JSON.parse(localStorage.getItem(key));
                console.log(`  ${key}:`, value);
            } catch {
                console.log(`  ${key}:`, localStorage.getItem(key));
            }
        }
    }

    // Inicializar a aplicação
    inicializar();

    function carregarReceitasHome() {
        const container = document.getElementById('container-receitas-home');
        if (!container) return;

        let receitas = [];
        try {
            receitas = JSON.parse(localStorage.getItem('receitas')) || [];
        } catch {
            receitas = [];
        }

        container.innerHTML = '';

        if (receitas.length === 0) {
            container.innerHTML = `<div class="cartao-estado-vazio">
                <div class="icone-vazio"><span class="material-icons-round">receipt</span></div>
                <p>Nenhuma receita cadastrada</p>
                <a href="/Nova-Receita/Nova-Receita.html" class="botao-primario">Adicionar Receita</a>
            </div>`;
            return;
        }

        // Agrupar receitas por mês/ano
        const receitasPorMes = {};
        receitas.forEach(r => {
            // Considera receitas fixas para todos os meses após a data de início
            if (r.repetir && r.quantidadeRepeticoes && r.frequenciaRepeticoes) {
                // Adiciona receitas repetidas conforme a frequência e quantidade
                let dataBase = parseDataBR(r.data);
                for (let i = 0; i < Number(r.quantidadeRepeticoes); i++) {
                    let dataReceita = new Date(dataBase);
                    if (r.frequenciaRepeticoes === 'dias') dataReceita.setDate(dataBase.getDate() + i);
                    if (r.frequenciaRepeticoes === 'semanas') dataReceita.setDate(dataBase.getDate() + i * 7);
                    if (r.frequenciaRepeticoes === 'meses') dataReceita.setMonth(dataBase.getMonth() + i);
                    if (r.frequenciaRepeticoes === 'anos') dataReceita.setFullYear(dataBase.getFullYear() + i);

                    const chave = `${dataReceita.getMonth()}-${dataReceita.getFullYear()}`;
                    if (!receitasPorMes[chave]) receitasPorMes[chave] = [];
                    receitasPorMes[chave].push({ ...r, data: formatarDataBR(dataReceita) });
                }
            } else if (r['receitaFixa']) {
                // Receita fixa: aparece em todos os meses a partir da data
                let dataBase = parseDataBR(r.data);
                const hoje = new Date();
                for (let ano = dataBase.getFullYear(); ano <= hoje.getFullYear(); ano++) {
                    for (let mes = (ano === dataBase.getFullYear() ? dataBase.getMonth() : 0); mes <= (ano === hoje.getFullYear() ? hoje.getMonth() : 11); mes++) {
                        const dataReceita = new Date(ano, mes, dataBase.getDate());
                        const chave = `${mes}-${ano}`;
                        if (!receitasPorMes[chave]) receitasPorMes[chave] = [];
                        receitasPorMes[chave].push({ ...r, data: formatarDataBR(dataReceita) });
                    }
                }
            } else {
                // Receita normal
                const dataObj = parseDataBR(r.data);
                const chave = `${dataObj.getMonth()}-${dataObj.getFullYear()}`;
                if (!receitasPorMes[chave]) receitasPorMes[chave] = [];
                receitasPorMes[chave].push(r);
            }
        });

        // Mês selecionado
        const seletorMes = document.querySelector('.seletor-mes');
        let mesAtual = seletorMes ? seletorMes.selectedIndex : new Date().getMonth();
        let anoAtual = new Date().getFullYear();
        const chaveAtual = `${mesAtual}-${anoAtual}`;
        const receitasMes = receitasPorMes[chaveAtual] || [];

        if (receitasMes.length === 0) {
            container.innerHTML = `<div class="cartao-estado-vazio">
                <div class="icone-vazio"><span class="material-icons-round">receipt</span></div>
                <p>Nenhuma receita cadastrada neste mês</p>
                <a href="/Nova-Receita/Nova-Receita.html" class="botao-primario">Adicionar Receita</a>
            </div>`;
            return;
        }

        // Renderizar receitas
        const lista = document.createElement('div');
        lista.className = 'lista-receitas-home';
        receitasMes.forEach(r => {
            lista.innerHTML += `
                <div class="receita-home-card">
                    <div>
                        <span class="receita-valor">${r.valor}</span>
                        <span class="receita-descricao">${r.descricao}</span>
                    </div>
                    <div class="receita-data">${r.data}</div>
                </div>
            `;
        });
        container.appendChild(lista);
    }

    // Funções auxiliares para datas
    function parseDataBR(dataStr) {
        // dataStr formato: dd/mm/yyyy
        const [dia, mes, ano] = dataStr.split('/');
        return new Date(Number(ano), Number(mes) - 1, Number(dia));
    }
    function formatarDataBR(date) {
        const d = String(date.getDate()).padStart(2, '0');
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const y = date.getFullYear();
        return `${d}/${m}/${y}`;
    }

    // Atualize receitas/despesas ao trocar mês
    function inicializarSeletorMes() {
        const seletorMes = document.querySelector('.seletor-mes');
        const btnAnterior = document.querySelector('.botao-mes.anterior');
        const btnProximo = document.querySelector('.botao-mes.proximo');
        const meses = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];

        let mesAtual = new Date().getMonth();

        function atualizarMes() {
            if (seletorMes) {
                seletorMes.selectedIndex = mesAtual;
            }
            atualizarValoresReceitasDespesas();
            console.log('Mês selecionado:', meses[mesAtual]);
        }

        if (btnAnterior) {
            btnAnterior.addEventListener('click', function() {
                mesAtual = (mesAtual - 1 + 12) % 12;
                atualizarMes();
            });
        }
        if (btnProximo) {
            btnProximo.addEventListener('click', function() {
                mesAtual = (mesAtual + 1) % 12;
                atualizarMes();
            });
        }
        if (seletorMes) {
            seletorMes.addEventListener('change', function() {
                mesAtual = seletorMes.selectedIndex;
                atualizarMes();
            });
        }

        atualizarMes();
    }

    function atualizarValoresReceitasDespesas() {
        const seletorMes = document.querySelector('.seletor-mes');
        const valorReceitas = document.querySelector('.valor-receitas');
        const valorDespesas = document.querySelector('.valor-despesas');
        const valorSaldo = document.querySelector('.valor-saldo');
        let receitas = [];
        let despesas = [];
        let contas = [];
        try {
            receitas = JSON.parse(localStorage.getItem('receitas')) || [];
        } catch {}
        try {
            // Carrega despesas do localStorage antigo e novo
            const transacoes = JSON.parse(localStorage.getItem('transacoes')) || [];
            const despesasTransacoes = transacoes.filter(t => t.tipo === 'despesa');
            const despesasAntigas = JSON.parse(localStorage.getItem('despesas')) || [];
            despesas = [...despesasTransacoes, ...despesasAntigas];
        } catch {}
        try {
            contas = JSON.parse(localStorage.getItem('contasBancarias')) || [];
        } catch {}

        // Mês/ano selecionado
        let mesAtual = seletorMes ? seletorMes.selectedIndex : new Date().getMonth();
        let anoAtual = new Date().getFullYear();

        // Soma receitas do mês
        let totalReceitas = 0;
        receitas.forEach(r => {
            if (pertenceAoMesSelecionado(r, mesAtual, anoAtual)) {
                let valor = parseFloat((r.valor || '0').replace('R$', '').replace('.', '').replace(',', '.'));
                if (!isNaN(valor)) totalReceitas += valor;
            }
        });

        // Soma despesas do mês
        let totalDespesas = 0;
        despesas.forEach(d => {
            if (pertenceAoMesSelecionado(d, mesAtual, anoAtual)) {
                let valor = parseFloat((d.valor || '0').replace('R$', '').replace('.', '').replace(',', '.'));
                if (!isNaN(valor)) totalDespesas += valor;
            }
        });

        // Soma saldo das contas
        let totalSaldoContas = 0;
        contas.forEach(conta => {
            let saldo = parseFloat((conta.saldo || '0').replace('R$', '').replace('.', '').replace(',', '.'));
            if (!isNaN(saldo)) totalSaldoContas += saldo;
        });

        // Calcula saldo total: Receitas + Saldo das Contas - Despesas
        let saldoTotal = totalReceitas + totalSaldoContas - totalDespesas;

        // Atualiza os elementos na tela
        if (valorReceitas) valorReceitas.textContent = 'R$ ' + totalReceitas.toLocaleString('pt-BR', {minimumFractionDigits: 2});
        if (valorDespesas) valorDespesas.textContent = 'R$ ' + totalDespesas.toLocaleString('pt-BR', {minimumFractionDigits: 2});
        if (valorSaldo) valorSaldo.textContent = 'R$ ' + saldoTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2});

        // Atualizar gráfico de categorias (despesas)
        if (typeof atualizarGraficoCategorias === 'function') {
            atualizarGraficoCategorias();
        }

        // Atualizar gráfico de receitas
        if (typeof atualizarGraficoReceitas === 'function') {
            atualizarGraficoReceitas();
        }

        // Apenas log resumido
        console.log('Receitas:', totalReceitas, 'Despesas:', totalDespesas, 'Saldo:', saldoTotal);
    }

    // Função para verificar se a receita/despesa pertence ao mês selecionado
    function pertenceAoMesSelecionado(item, mes, ano) {
        // Suporte para receitas repetidas e fixas
        if (item.repetir && item.quantidadeRepeticoes && item.frequenciaRepeticoes) {
            let dataBase = parseDataBR(item.data);
            for (let i = 0; i < Number(item.quantidadeRepeticoes); i++) {
                let dataReceita = new Date(dataBase);
                if (item.frequenciaRepeticoes === 'dias') dataReceita.setDate(dataBase.getDate() + i);
                if (item.frequenciaRepeticoes === 'semanas') dataReceita.setDate(dataBase.getDate() + i * 7);
                if (item.frequenciaRepeticoes === 'meses') dataReceita.setMonth(dataBase.getMonth() + i);
                if (item.frequenciaRepeticoes === 'anos') dataReceita.setFullYear(dataBase.getFullYear() + i);
                if (dataReceita.getMonth() === mes && dataReceita.getFullYear() === ano) return true;
            }
            return false;
        } else if (item.receitaFixa) {
            let dataBase = parseDataBR(item.data);
            let data = new Date(ano, mes, dataBase.getDate());
            return data >= dataBase;
        } else {
            let dataObj = parseDataBR(item.data);
            return dataObj.getMonth() === mes && dataObj.getFullYear() === ano;
        }
    }

    function obterDespesasHome() {
        let todasDespesas = [];
        try {
            const transacoes = JSON.parse(localStorage.getItem('transacoes')) || [];
            const despesasTransacoes = transacoes.filter(t => t.tipo === 'despesa');
            const despesasAntigas = JSON.parse(localStorage.getItem('despesas')) || [];
            todasDespesas = [...despesasTransacoes, ...despesasAntigas];
        } catch (e) {
            // Apenas erro silencioso
        }
        return todasDespesas;
    }

    function calcularTotalDespesasMesHome() {
        const despesas = obterDespesasHome();
        const seletorMes = document.querySelector('.seletor-mes');
        let mesAtual = seletorMes ? seletorMes.selectedIndex : new Date().getMonth();
        let anoAtual = new Date().getFullYear();

        let totalMes = 0;
        despesas.forEach(despesa => {
            if (!despesa.data) return;
            let partes = despesa.data.includes('/') ? despesa.data.split('/') : despesa.data.split('-');
            let mes, ano;
            if (partes.length === 3) {
                if (despesa.data.includes('/')) {
                    mes = parseInt(partes[1], 10) - 1;
                    ano = parseInt(partes[2], 10);
                } else {
                    mes = parseInt(partes[1], 10) - 1;
                    ano = parseInt(partes[0], 10);
                }
                if (mes === mesAtual && ano === anoAtual) {
                    const valor = despesa.valor ? parseFloat(despesa.valor.replace('R$ ', '').replace(/\./g, '').replace(',', '.')) : 0;
                    totalMes += valor;
                }
            }
        });
        const valorDespesasEl = document.querySelector('.valor-despesas');
        if (valorDespesasEl) {
            valorDespesasEl.textContent = `R$ ${totalMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        }
        // Apenas log resumido
        console.log('Despesas do mês:', totalMes);
        return totalMes;
    }

    // Atualize ao trocar o mês
    function inicializarSeletorMesHome() {
        const seletorMes = document.querySelector('.seletor-mes');
        if (seletorMes) {
            seletorMes.addEventListener('change', function() {
                calcularTotalDespesasMesHome();
            });
        }
    }

    // Chame calcularTotalDespesasHome() ao carregar a página Home
    document.addEventListener('DOMContentLoaded', function() {
        calcularTotalDespesasHome();
    });

    // Inicializa o seletor de mês na Home
    inicializarSeletorMesHome();

    // Inicializar gráfico de despesas por categoria
    function inicializarGraficoCategorias() {
        atualizarGraficoCategorias();
    }

    // Atualizar gráfico de despesas por categoria
    function atualizarGraficoCategorias() {
        const containerDespesas = document.getElementById('container-despesas-categoria');
        const cartaoVazio = document.getElementById('cartao-estado-vazio-categorias');
        const cartaoAtivo = document.getElementById('cartao-estado-ativo-categorias');
        
        if (!containerDespesas) return;

        // Obter despesas do período selecionado
        const dadosCategorias = obterDespesasPorCategoria();
        
        // Limpar container
        containerDespesas.innerHTML = '';
        
        if (dadosCategorias.length === 0) {
            // Mostrar estado vazio
            containerDespesas.appendChild(cartaoVazio.cloneNode(true));
            containerDespesas.firstChild.style.display = '';
            containerDespesas.firstChild.id = '';
        } else {
            // Mostrar estado ativo com gráfico
            const cartaoAtivoClone = cartaoAtivo.cloneNode(true);
            cartaoAtivoClone.style.display = '';
            cartaoAtivoClone.id = '';
            containerDespesas.appendChild(cartaoAtivoClone);
            
            // Renderizar gráfico
            setTimeout(() => {
                renderizarGraficoCategoria(dadosCategorias);
                renderizarLegendaCategorias(dadosCategorias);
            }, 100);
        }
    }

    // Obter despesas por categoria baseado no filtro
    function obterDespesasPorCategoria() {
        let despesas = [];
        try {
            const transacoes = JSON.parse(localStorage.getItem('transacoes')) || [];
            const despesasTransacoes = transacoes.filter(t => t.tipo === 'despesa');
            const despesasAntigas = JSON.parse(localStorage.getItem('despesas')) || [];
            despesas = [...despesasTransacoes, ...despesasAntigas];
        } catch {
            despesas = [];
        }

        // Filtrar por período
        const hoje = new Date();
        let mesInicio, anoInicio, mesFim, anoFim;

        switch (filtroAtual) {
            case 'atual':
                mesInicio = mesFim = hoje.getMonth();
                anoInicio = anoFim = hoje.getFullYear();
                break;
            case 'anterior':
                const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
                mesInicio = mesFim = mesAnterior.getMonth();
                anoInicio = anoFim = mesAnterior.getFullYear();
                break;
            case 'todos':
                // Últimos 12 meses
                const inicioAno = new Date(hoje.getFullYear() - 1, hoje.getMonth(), 1);
                mesInicio = inicioAno.getMonth();
                anoInicio = inicioAno.getFullYear();
                mesFim = hoje.getMonth();
                anoFim = hoje.getFullYear();
                break;
        }

        // Filtrar despesas do período
        const despesasFiltradas = despesas.filter(despesa => {
            if (!despesa.data) return false;
            
            const dataObj = parseDataBR(despesa.data);
            const mesData = dataObj.getMonth();
            const anoData = dataObj.getFullYear();
            
            if (filtroAtual === 'todos') {
                return (anoData > anoInicio || (anoData === anoInicio && mesData >= mesInicio)) &&
                       (anoData < anoFim || (anoData === anoFim && mesData <= mesFim));
            } else {
                return mesData === mesInicio && anoData === anoInicio;
            }
        });

        // Agrupar por categoria
        const categorias = {};
        despesasFiltradas.forEach(despesa => {
            const categoria = despesa.categoria || 'outros';
            const valor = parseFloat((despesa.valor || '0').replace('R$', '').replace(/\./g, '').replace(',', '.'));
            
            if (!categorias[categoria]) {
                categorias[categoria] = {
                    nome: categoria,
                    valor: 0,
                    cor: obterCorCategoria(categoria)
                };
            }
            categorias[categoria].valor += valor;
        });

        // Converter para array e ordenar por valor
        const dadosCategorias = Object.values(categorias)
            .filter(cat => cat.valor > 0)
            .sort((a, b) => b.valor - a.valor);

        return dadosCategorias;
    }

    // Renderizar gráfico de rosca
    function renderizarGraficoCategoria(dados) {
        const canvas = document.querySelector('#container-despesas-categoria canvas');
        if (!canvas) return;

        if (graficoInstance) {
            graficoInstance.destroy();
        }

        const ctx = canvas.getContext('2d');
        const total = dados.reduce((sum, item) => sum + item.valor, 0);

        graficoInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: dados.map(item => capitalizeFirst(item.nome)),
                datasets: [{
                    data: dados.map(item => item.valor),
                    backgroundColor: dados.map(item => item.cor), // Usando as cores da paleta de despesas
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverBorderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const valor = context.parsed;
                                const porcentagem = ((valor / total) * 100).toFixed(1);
                                return `${context.label}: R$ ${valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})} (${porcentagem}%)`;
                            }
                        }
                    }
                },
                cutout: '65%',
                animation: { animateRotate: true, duration: 1000 }
            }
        });

        const valorTotalEl = document.querySelector('#container-despesas-categoria .valor-total');
        if (valorTotalEl) {
            valorTotalEl.textContent = `R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
        }
    }

    // Renderizar legenda das categorias
    function renderizarLegendaCategorias(dados) {
        const legendaContainer = document.querySelector('#container-despesas-categoria .legenda-categorias');
        if (!legendaContainer) return;

        const total = dados.reduce((sum, item) => sum + item.valor, 0);
        legendaContainer.innerHTML = '';

        dados.forEach(categoria => {
            // Normaliza para buscar ícone
            const key = categoria.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const icone = iconesDespesas[key] || iconesDespesas['outros'];
            const cor = categoria.cor;

            const porcentagem = ((categoria.valor / total) * 100).toFixed(1);

            const itemLegenda = document.createElement('div');
            itemLegenda.className = 'item-legenda';
            itemLegenda.innerHTML = `
                <div class="categoria-info">
                    <span class="material-icons-round" style="color:${cor};background:rgba(0,0,0,0.04);border-radius:50%;padding:2px;">${icone}</span>
                    <span class="nome-categoria">${capitalizeFirst(categoria.nome)}</span>
                </div>
                <div>
                    <span class="valor-categoria">R$ ${categoria.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                    <span class="porcentagem-categoria">${porcentagem}%</span>
                </div>
            `;
            legendaContainer.appendChild(itemLegenda);
        });
    }

    // Paleta de cores forte para despesas
    function obterCorCategoria(categoria) {
        const cores = {
            'alimentacao': '#E63946',      // Vermelho forte - alimentação
            'transporte': '#F4A261',       // Laranja forte - transporte
            'moradia': '#2A9D8F',          // Verde forte - moradia/casa
            'casa': '#2A9D8F',
            'saude': '#E76F51',            // Vermelho queimado - saúde
            'farmacia': '#E76F51',
            'educacao': '#264653',         // Azul petróleo - educação
            'lazer': '#E9C46A',            // Amarelo forte - lazer
            'compras': '#D62828',          // Vermelho vibrante - compras
            'supermercado': '#D62828',
            'outros': '#6A0572',           // Roxo escuro - outros
            'donativos': '#6A0572',
            'trabalho': '#1D3557',         // Azul escuro - trabalho
            'familia': '#F77F00',          // Laranja vibrante - família
            'contas': '#8D0801',           // Vermelho escuro - contas
            'cartao': '#8D0801',
            'vestuario': '#9A031E',        // Vermelho intenso - vestuário
            'empréstimo': '#9A031E',
            'viagem': '#023047',           // Azul profundo - viagem
            'internet': '#023047',
            'streaming': '#023047',
            'beleza': '#FF006E',           // Rosa neon - beleza
            'pets': '#06D6A0',             // Verde claro - pets
            'seguros': '#3D348B',          // Azul violeta escuro - seguros
            'gás': '#3D348B',
            'academia': '#FB8500',         // Laranja mais claro - academia
            'combustivel': '#FB8500',      // Laranja mais claro - combustível
            'impostos': '#8338EC',         // Roxo elétrico - impostos
            'multas': '#8338EC',
            'telefone': '#457B9D',         // Azul forte - telefone
            'agua': '#457B9D',
            'luz': '#E9C46A'               // Amarelo forte - luz
        };
        // Remover acentos e normalizar
        const key = categoria.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return cores[key] || cores['outros'];
    }

    // Paleta de cores para receitas
    function obterCorCategoriaReceita(categoria) {
        const cores = {
            'salario': '#06D6A0',              // Verde claro – crescimento
            'pro labore': '#06D6A0',
            'vendas': '#118AB2',               // Azul médio – profissional
            'venda de produtos': '#118AB2',
            'venda de serviços': '#118AB2',
            'servicos': '#118AB2',
            'reembolso': '#FFD166',            // Amarelo vibrante – retorno financeiro
            'reembolso medico': '#EF476F',     // Rosa avermelhada – destaque leve
            'investimentos': '#073B4C',        // Azul petróleo escuro – sólido
            'rendimentos de investimentos': '#073B4C',
            'restituicao de imposto': '#90BE6D', // Verde folha – retorno estatal
            'gov': '#90BE6D',
            'bonus': '#FFB703',                // Amarelo laranja – premiação
            'comissoes': '#FFB703',
            'rendimentos passivos': '#8AC926', // Verde limão – crescimento automático
            'dividendos': '#8AC926',
            'juros recebidos': '#8AC926',
            'outros ganhos': '#6A4C93',        // Roxo médio – neutro elegante
            'outros': '#6A4C93'
        };
        // Remover acentos e normalizar
        const key = categoria.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return cores[key] || cores['outros'];
    }

    // Capitalizar primeira letra
    function capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // Atualizar gráfico quando houver mudanças
    function atualizarValoresReceitasDespesas() {
        const seletorMes = document.querySelector('.seletor-mes');
        const valorReceitas = document.querySelector('.valor-receitas');
        const valorDespesas = document.querySelector('.valor-despesas');
        const valorSaldo = document.querySelector('.valor-saldo');
        let receitas = [];
        let despesas = [];
        let contas = [];
        try {
            receitas = JSON.parse(localStorage.getItem('receitas')) || [];
        } catch {}
        try {
            // Carrega despesas do localStorage antigo e novo
            const transacoes = JSON.parse(localStorage.getItem('transacoes')) || [];
            const despesasTransacoes = transacoes.filter(t => t.tipo === 'despesa');
            const despesasAntigas = JSON.parse(localStorage.getItem('despesas')) || [];
            despesas = [...despesasTransacoes, ...despesasAntigas];
        } catch {}
        try {
            contas = JSON.parse(localStorage.getItem('contasBancarias')) || [];
        } catch {}

        // Mês/ano selecionado
        let mesAtual = seletorMes ? seletorMes.selectedIndex : new Date().getMonth();
        let anoAtual = new Date().getFullYear();

        // Soma receitas do mês
        let totalReceitas = 0;
        receitas.forEach(r => {
            if (pertenceAoMesSelecionado(r, mesAtual, anoAtual)) {
                let valor = parseFloat((r.valor || '0').replace('R$', '').replace('.', '').replace(',', '.'));
                if (!isNaN(valor)) totalReceitas += valor;
            }
        });

        // Soma despesas do mês
        let totalDespesas = 0;
        despesas.forEach(d => {
            if (pertenceAoMesSelecionado(d, mesAtual, anoAtual)) {
                let valor = parseFloat((d.valor || '0').replace('R$', '').replace('.', '').replace(',', '.'));
                if (!isNaN(valor)) totalDespesas += valor;
            }
        });

        // Soma saldo das contas
        let totalSaldoContas = 0;
        contas.forEach(conta => {
            let saldo = parseFloat((conta.saldo || '0').replace('R$', '').replace('.', '').replace(',', '.'));
            if (!isNaN(saldo)) totalSaldoContas += saldo;
        });

        // Calcula saldo total: Receitas + Saldo das Contas - Despesas
        let saldoTotal = totalReceitas + totalSaldoContas - totalDespesas;

        // Atualiza os elementos na tela
        if (valorReceitas) valorReceitas.textContent = 'R$ ' + totalReceitas.toLocaleString('pt-BR', {minimumFractionDigits: 2});
        if (valorDespesas) valorDespesas.textContent = 'R$ ' + totalDespesas.toLocaleString('pt-BR', {minimumFractionDigits: 2});
        if (valorSaldo) valorSaldo.textContent = 'R$ ' + saldoTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2});

        // Atualizar gráfico de categorias (despesas)
        if (typeof atualizarGraficoCategorias === 'function') {
            atualizarGraficoCategorias();
        }

        // Atualizar gráfico de receitas
        if (typeof atualizarGraficoReceitas === 'function') {
            atualizarGraficoReceitas();
        }

        // Apenas log resumido
        console.log('Receitas:', totalReceitas, 'Despesas:', totalDespesas, 'Saldo:', saldoTotal);
    }

    // Inicializar gráfico de receitas por categoria
    function inicializarGraficoReceitas() {
        atualizarGraficoReceitas();
    }

    // Atualizar gráfico de receitas por categoria
    function atualizarGraficoReceitas() {
        const containerReceitas = document.getElementById('container-receitas-categoria');
        const cartaoVazio = document.getElementById('cartao-estado-vazio-receitas');
        const cartaoAtivo = document.getElementById('cartao-estado-ativo-receitas');
        
        if (!containerReceitas) return;

        // Obter receitas do período selecionado
        const dadosReceitas = obterReceitasPorCategoria();
        
        // Limpar container
        containerReceitas.innerHTML = '';
        
        if (dadosReceitas.length === 0) {
            // Mostrar estado vazio
            containerReceitas.appendChild(cartaoVazio.cloneNode(true));
            containerReceitas.firstChild.style.display = '';
            containerReceitas.firstChild.id = '';
        } else {
            // Mostrar estado ativo com gráfico
            const cartaoAtivoClone = cartaoAtivo.cloneNode(true);
            cartaoAtivoClone.style.display = '';
            cartaoAtivoClone.id = '';
            containerReceitas.appendChild(cartaoAtivoClone);
            
            // Renderizar gráfico
            setTimeout(() => {
                renderizarGraficoReceitas(dadosReceitas);
                renderizarLegendaReceitas(dadosReceitas);
            }, 100);
        }
    }

    // Obter receitas por categoria baseado no filtro
    function obterReceitasPorCategoria() {
        let receitas = [];
        try {
            receitas = JSON.parse(localStorage.getItem('receitas')) || [];
        } catch {
            receitas = [];
        }

        // Filtrar por período
        const hoje = new Date();
        let mesInicio, anoInicio, mesFim, anoFim;

        switch (filtroReceitaAtual) {
            case 'atual':
                mesInicio = mesFim = hoje.getMonth();
                anoInicio = anoFim = hoje.getFullYear();
                break;
            case 'anterior':
                const mesAnterior = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
                mesInicio = mesFim = mesAnterior.getMonth();
                anoInicio = anoFim = mesAnterior.getFullYear();
                break;
            case 'todos':
                // Últimos 12 meses
                const inicioAno = new Date(hoje.getFullYear() - 1, hoje.getMonth(), 1);
                mesInicio = inicioAno.getMonth();
                anoInicio = inicioAno.getFullYear();
                mesFim = hoje.getMonth();
                anoFim = hoje.getFullYear();
                break;
        }

        // Filtrar receitas do período
        const receitasFiltradas = receitas.filter(receita => {
            if (!receita.data) return false;
            
            const dataObj = parseDataBR(receita.data);
            const mesData = dataObj.getMonth();
            const anoData = dataObj.getFullYear();
            
            if (filtroReceitaAtual === 'todos') {
                return (anoData > anoInicio || (anoData === anoInicio && mesData >= mesInicio)) &&
                       (anoData < anoFim || (anoData === anoFim && mesData <= mesFim));
            } else {
                return mesData === mesInicio && anoData === anoInicio;
            }
        });

        // Agrupar por categoria
        const categorias = {};
        receitasFiltradas.forEach(receita => {
            const categoria = receita.categoria || 'outros';
            const valor = parseFloat((receita.valor || '0').replace('R$', '').replace(/\./g, '').replace(',', '.'));
            
            if (!categorias[categoria]) {
                categorias[categoria] = {
                    nome: categoria,
                    valor: 0,
                    cor: obterCorCategoriaReceita(categoria)
                };
            }
            categorias[categoria].valor += valor;
        });

        // Converter para array e ordenar por valor
        const dadosReceitas = Object.values(categorias)
            .filter(cat => cat.valor > 0)
            .sort((a, b) => b.valor - a.valor);

        return dadosReceitas;
    }

    // Renderizar gráfico de rosca para receitas
    function renderizarGraficoReceitas(dados) {
        const canvas = document.querySelector('#container-receitas-categoria canvas');
        if (!canvas) return;

        if (graficoReceitasInstance) {
            graficoReceitasInstance.destroy();
        }

        const ctx = canvas.getContext('2d');
        const total = dados.reduce((sum, item) => sum + item.valor, 0);

        graficoReceitasInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: dados.map(item => capitalizeFirst(item.nome)),
                datasets: [{
                    data: dados.map(item => item.valor),
                    backgroundColor: dados.map(item => item.cor), // Usando as cores da paleta de receitas
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverBorderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const valor = context.parsed;
                                const porcentagem = ((valor / total) * 100).toFixed(1);
                                return `${context.label}: R$ ${valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})} (${porcentagem}%)`;
                            }
                        }
                    }
                },
                cutout: '65%',
                animation: { animateRotate: true, duration: 1000 }
            }
        });

        const valorTotalEl = document.querySelector('#container-receitas-categoria .valor-total');
        if (valorTotalEl) {
            valorTotalEl.textContent = `R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
        }
    }

    // Renderizar legenda das receitas
    function renderizarLegendaReceitas(dados) {
        const legendaContainer = document.querySelector('#container-receitas-categoria .legenda-categorias');
        if (!legendaContainer) return;

        const total = dados.reduce((sum, item) => sum + item.valor, 0);
        legendaContainer.innerHTML = '';

        dados.forEach(categoria => {
            // Normaliza para buscar ícone
            const key = categoria.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            const icone = iconesReceitas[key] || iconesReceitas['outros'];
            const cor = categoria.cor;

            const porcentagem = ((categoria.valor / total) * 100).toFixed(1);

            const itemLegenda = document.createElement('div');
            itemLegenda.className = 'item-legenda';
            itemLegenda.innerHTML = `
                <div class="categoria-info">
                    <span class="material-icons-round" style="color:${cor};background:rgba(0,0,0,0.04);border-radius:50%;padding:2px;">${icone}</span>
                    <span class="nome-categoria">${capitalizeFirst(categoria.nome)}</span>
                </div>
                <div>
                    <span class="valor-categoria">R$ ${categoria.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                    <span class="porcentagem-categoria">${porcentagem}%</span>
                </div>
            `;
            legendaContainer.appendChild(itemLegenda);
        });
    }

    // Ícones padrão para despesas
    const iconesDespesas = {
        'alimentacao': 'restaurant',
        'transporte': 'directions_bus',
        'moradia': 'home',
        'casa': 'home',
        'saude': 'medical_services',
        'farmacia': 'local_pharmacy',
        'educacao': 'school',
        'lazer': 'sports_esports',
        'compras': 'shopping_cart',
        'supermercado': 'shopping_basket',
        'outros': 'category',
        'donativos': 'volunteer_activism',
        'trabalho': 'work',
        'familia': 'family_restroom',
        'contas': 'receipt_long',
        'cartao': 'credit_card',
        'vestuario': 'checkroom',
        'empréstimo': 'money_off',
        'viagem': 'flight',
        'internet': 'wifi',
        'streaming': 'tv',
        'beleza': 'spa',
        'pets': 'pets',
        'seguros': 'policy',
        'gás': 'local_gas_station',
        'academia': 'fitness_center',
        'combustivel': 'local_gas_station',
        'impostos': 'account_balance',
        'multas': 'gavel',
        'telefone': 'phone',
        'agua': 'water_drop',
        'luz': 'lightbulb'
    };

    // Ícones padrão para receitas
    const iconesReceitas = {
        'salario': 'attach_money',
        'pro labore': 'attach_money',
        'vendas': 'shopping_cart',
        'venda de produtos': 'shopping_cart',
        'venda de serviços': 'handshake',
        'servicos': 'handshake',
        'reembolso': 'receipt',
        'reembolso medico': 'medical_services',
        'investimentos': 'show_chart',
        'rendimentos de investimentos': 'show_chart',
        'restituicao de imposto': 'account_balance',
        'gov': 'account_balance',
        'bonus': 'card_giftcard',
        'comissoes': 'trending_up',
        'rendimentos passivos': 'savings',
        'dividendos': 'account_balance_wallet',
        'juros recebidos': 'percent',
        'outros ganhos': 'category',
        'outros': 'category'
    };
});