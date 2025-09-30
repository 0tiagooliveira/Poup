// Cache de elementos DOM para evitar consultas repetidas (global)
let elementos = {};

// Estado da aplicação (global)
let estado = {};

document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 Inicializando aplicação Novo Cartão...');

    // Inicializar elementos do DOM
    elementos = {
        botaoVoltar: document.querySelector('.botao-voltar'),
        cartao: document.getElementById('cartao'),
        cartaoFrente: document.querySelector('.cartao-frente'),
        cartaoVerso: document.querySelector('.cartao-verso'),
        bandeiraVisual: document.getElementById('bandeira-visual'),
        numeroCartaoVisual: document.getElementById('numero-cartao-visual'),
        nomeCartaoVisual: document.getElementById('nome-cartao-visual'),
        validadeCartaoVisual: document.getElementById('validade-cartao-visual'),
        cvvCartaoVisual: document.getElementById('cvv-cartao-visual'),
        secaoLimite: document.getElementById('secao-limite'),
        valorLimite: document.getElementById('valor-limite'),
        inputNumeroCartao: document.getElementById('numero-cartao'),
        inputNomeCartao: document.getElementById('nome-cartao'),
        inputValidadeMes: document.getElementById('validade-mes'),
        inputValidadeAno: document.getElementById('validade-ano'),
        inputCvvCartao: document.getElementById('cvv-cartao'),
        botaoVerCvv: document.getElementById('ver-cvv'),
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
        popupMensagem: document.getElementById('popup-mensagem'),
        popupTexto: document.getElementById('popup-texto'),
        popupBotao: document.getElementById('popup-botao'),
        modalFechar: document.querySelector('.modal-fechar'),
        modalTitulo: document.querySelector('.modal-titulo'),
        botaoAnterior: document.getElementById('botao-anterior'),
        botaoProximo: document.getElementById('botao-proximo'),
        etapas: document.querySelectorAll('.etapa'),
        etapasFormulario: document.querySelectorAll('.etapa-formulario'),
        linhasProgresso: document.querySelectorAll('.linha-progresso')
    };

    console.log('📋 Elementos carregados:', {
        botaoVoltar: !!elementos.botaoVoltar,
        secaoLimite: !!elementos.secaoLimite,
        valorLimite: !!elementos.valorLimite,
        inputNomeCartao: !!elementos.inputNomeCartao,
        seletorBandeira: !!elementos.seletorBandeira,
    });

    // Inicializar estado da aplicação
    estado = {
        valorLimite: '0',
        bandeiraSelecionada: null,
        contaSelecionada: null,
        diaFechamento: null,
        diaVencimento: null,
        cvvVisivel: false,
        cartaoVirado: false,
        etapaAtual: 1,
        totalEtapas: 3
    };

    console.log('🎯 Estado inicial:', estado);

    // Inicialização
    function inicializar() {
        console.log('🚀 Inicializando aplicação Novo Cartão...');
        
        try {
            configurarEventos();
            carregarContas();
            gerarOpcoesDias();
            console.log('✅ Aplicação inicializada com sucesso!');
        } catch (error) {
            console.error('❌ Erro durante a inicialização:', error);
        }
    }

    // Configurar eventos
    function configurarEventos() {
        console.log('🔧 Configurando eventos...');
        
        // Botão voltar
        if (elementos.botaoVoltar) {
            console.log('🔙 Configurando botão voltar');
            elementos.botaoVoltar.addEventListener('click', function() {
                console.log('🔙 Botão voltar clicado');
                window.history.back();
            });
        }

        // Flip do cartão ao clicar
        if (elementos.cartao) {
            console.log('💳 Configurando flip do cartão');
            elementos.cartao.addEventListener('click', function() {
                console.log('💳 Cartão clicado - estado atual:', estado.cartaoVirado);
                estado.cartaoVirado = !estado.cartaoVirado;
                if (estado.cartaoVirado) {
                    elementos.cartao.classList.add('flip');
                    elementos.cartao.classList.remove('flip-back');
                    console.log('💳 Cartão virado para frente');
                } else {
                    elementos.cartao.classList.add('flip-back');
                    elementos.cartao.classList.remove('flip');
                    console.log('💳 Cartão virado para trás');
                }
            });
        }

        // Mostrar/ocultar CVV
        if (elementos.botaoVerCvv) {
            elementos.botaoVerCvv.addEventListener('mousedown', function() {
                estado.cvvVisivel = true;
                atualizarCvvVisual();
            });

            elementos.botaoVerCvv.addEventListener('mouseup', function() {
                estado.cvvVisivel = false;
                atualizarCvvVisual();
            });

            elementos.botaoVerCvv.addEventListener('mouseleave', function() {
                estado.cvvVisivel = false;
                atualizarCvvVisual();
            });
        }

        // Atualizar número do cartão visual
        if (elementos.inputNumeroCartao) {
            elementos.inputNumeroCartao.addEventListener('input', function(e) {
                let valor = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
                valor = valor.replace(/(\d{4})/g, '$1 ').trim();
                e.target.value = valor;
                if (elementos.numeroCartaoVisual) {
                    elementos.numeroCartaoVisual.textContent = valor || '•••• •••• •••• ••••';
                }
            });
        }

        // Atualizar nome do cartão visual
        if (elementos.inputNomeCartao) {
            elementos.inputNomeCartao.addEventListener('input', function(e) {
                if (elementos.nomeCartaoVisual) {
                    elementos.nomeCartaoVisual.textContent = e.target.value.toUpperCase() || 'SEU NOME AQUI';
                }
            });
        }

        // Atualizar validade do cartão visual
        if (elementos.inputValidadeMes) {
            elementos.inputValidadeMes.addEventListener('input', function(e) {
                let valor = e.target.value.replace(/\D/g, '').substring(0, 2);
                e.target.value = valor;
                atualizarValidadeVisual();
            });
        }

        if (elementos.inputValidadeAno) {
            elementos.inputValidadeAno.addEventListener('input', function(e) {
                let valor = e.target.value.replace(/\D/g, '').substring(0, 2);
                e.target.value = valor;
                atualizarValidadeVisual();
            });
        }

        // Atualizar CVV do cartão visual
        if (elementos.inputCvvCartao) {
            elementos.inputCvvCartao.addEventListener('input', function(e) {
                let valor = e.target.value.replace(/\D/g, '').substring(0, 3);
                e.target.value = valor;
                atualizarCvvVisual();
            });
        }

        // Fechar calculadora ao clicar fora
        if (elementos.calculadoraContainer) {
            elementos.calculadoraContainer.addEventListener('click', function(e) {
                if (e.target === elementos.calculadoraContainer) {
                    fecharCalculadora();
                }
            });
        }

        // Eventos do seletor de bandeira
        if (elementos.opcaoSelecionadaBandeira) {
            elementos.opcaoSelecionadaBandeira.addEventListener('click', function(e) {
                e.stopPropagation();
                if (elementos.opcoesBandeira) {
                    elementos.opcoesBandeira.classList.toggle('mostrar');
                }
            });
        }

        if (elementos.opcoesBandeira) {
            elementos.opcoesBandeira.addEventListener('click', function(e) {
                const opcao = e.target.closest('.opcao-bandeira');
                if (opcao) {
                    estado.bandeiraSelecionada = opcao.getAttribute('data-value');
                    elementos.opcaoSelecionadaBandeira.innerHTML = opcao.innerHTML;
                    elementos.opcoesBandeira.classList.remove('mostrar');
                    atualizarBandeiraVisual();
                }
            });
        }

        // Eventos do seletor de conta
        if (elementos.opcaoSelecionadaConta) {
            elementos.opcaoSelecionadaConta.addEventListener('click', function(e) {
                e.stopPropagation();
                if (elementos.opcoesConta) {
                    elementos.opcoesConta.classList.toggle('mostrar');
                }
            });
        }

        if (elementos.opcoesConta) {
            elementos.opcoesConta.addEventListener('click', function(e) {
                const opcao = e.target.closest('.opcao-conta');
                if (opcao) {
                    if (opcao.classList.contains('opcao-nova-conta')) {
                        mostrarPopup('Redirecionando para tela de nova conta...');
                    } else {
                        estado.contaSelecionada = opcao.getAttribute('data-value');
                        elementos.opcaoSelecionadaConta.innerHTML = opcao.innerHTML;
                        elementos.opcoesConta.classList.remove('mostrar');
                    }
                }
            });
        }

        // Eventos do seletor de fechamento
        if (elementos.opcaoSelecionadaFechamento) {
            elementos.opcaoSelecionadaFechamento.addEventListener('click', function(e) {
                e.stopPropagation();
                if (elementos.opcoesFechamento) {
                    elementos.opcoesFechamento.classList.toggle('mostrar');
                }
            });
        }

        if (elementos.opcoesFechamento) {
            elementos.opcoesFechamento.addEventListener('click', function(e) {
                const opcao = e.target.closest('.opcao-dia');
                if (opcao) {
                    estado.diaFechamento = opcao.getAttribute('data-value');
                    elementos.opcaoSelecionadaFechamento.innerHTML = `<span>Dia ${opcao.textContent}</span>`;
                    elementos.opcoesFechamento.classList.remove('mostrar');
                }
            });
        }

        // Eventos do seletor de vencimento
        if (elementos.opcaoSelecionadaVencimento) {
            elementos.opcaoSelecionadaVencimento.addEventListener('click', function(e) {
                e.stopPropagation();
                if (elementos.opcoesVencimento) {
                    elementos.opcoesVencimento.classList.toggle('mostrar');
                }
            });
        }

        if (elementos.opcoesVencimento) {
            elementos.opcoesVencimento.addEventListener('click', function(e) {
                const opcao = e.target.closest('.opcao-dia');
                if (opcao) {
                    estado.diaVencimento = opcao.getAttribute('data-value');
                    elementos.opcaoSelecionadaVencimento.innerHTML = `<span>Dia ${opcao.textContent}</span>`;
                    elementos.opcoesVencimento.classList.remove('mostrar');
                }
            });
        }

        // Navegação entre etapas
        if (elementos.botaoProximo) {
            console.log('▶️ Configurando botão próximo');
            elementos.botaoProximo.addEventListener('click', function() {
                console.log('▶️ Botão próximo clicado - etapa atual:', estado.etapaAtual);
                proximaEtapa();
            });
        }
        
        if (elementos.botaoAnterior) {
            console.log('◀️ Configurando botão anterior');
            elementos.botaoAnterior.addEventListener('click', function() {
                console.log('◀️ Botão anterior clicado - etapa atual:', estado.etapaAtual);
                etapaAnterior();
            });
        }

        // Evento do botão salvar
        if (elementos.botaoSalvar) {
            console.log('💾 Configurando botão salvar');
            elementos.botaoSalvar.addEventListener('click', function() {
                console.log('💾 Botão salvar clicado');
                salvarCartao();
            });
        }

        // Configurar eventos do popup
        configurarEventosPopup();

        // Fechar dropdowns ao clicar fora
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.seletor-bandeira') && !e.target.closest('.seletor-conta') && !e.target.closest('.seletor-dia')) {
                document.querySelectorAll('.opcoes-bandeira, .opcoes-conta, .opcoes-dia').forEach(function(drop) {
                    drop.classList.remove('mostrar');
                });
            }
        });

        // Acessibilidade: abrir dropdowns com Enter
        document.querySelectorAll('.opcao-selecionada').forEach(function(el) {
            el.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const next = el.nextElementSibling;
                    if (next && (next.classList.contains('opcoes-bandeira') || next.classList.contains('opcoes-conta') || next.classList.contains('opcoes-dia'))) {
                        next.classList.toggle('mostrar');
                    }
                }
            });
        });

        // Abrir calculadora ao clicar no limite
        if (elementos.secaoLimite) {
            elementos.secaoLimite.addEventListener('click', function() {
                abrirCalculadora();
            });
        }
        // Também permite abrir ao clicar diretamente no input
        if (elementos.valorLimite) {
            elementos.valorLimite.addEventListener('click', function() {
                abrirCalculadora();
            });
        }

        // Calculadora: eventos dos botões
        if (elementos.calculadoraBotoes) {
            elementos.calculadoraBotoes.addEventListener('click', function(e) {
                if (e.target.tagName === 'BUTTON') {
                    const botao = e.target;
                    const valor = botao.textContent.trim();

                    if (valor.match(/^[0-9]$/) || valor === '00') {
                        adicionarNumero(valor);
                    } else if (valor === ',' || valor === '.') {
                        adicionarNumero(',');
                    } else if (botao.classList.contains('apagar') || botao.id === 'botao-apagar') {
                        apagarInput();
                    } else if (botao.classList.contains('btn-cancelar-calculadora')) {
                        cancelarCalculadora();
                    } else if (botao.classList.contains('btn-confirmar-calculadora')) {
                        confirmarCalculadora();
                    }
                    // Os botões de operação (+, -, *, /, =) não fazem nada
                }
            });
        }
    }

    function configurarEventosPopup() {
        console.log('🚨 Configurando eventos do popup...');
        
        // Fechar popup pelo X
        if (elementos.modalFechar) {
            console.log('❌ Configurando botão fechar modal (X)');
            elementos.modalFechar.addEventListener('click', function() {
                console.log('❌ Botão fechar modal (X) clicado');
                fecharPopup();
            });
        } else {
            console.warn('⚠️ Elemento modalFechar não encontrado');
        }

        // Fechar popup pelo botão OK
        if (elementos.popupBotao) {
            console.log('✅ Configurando botão OK do popup');
            elementos.popupBotao.addEventListener('click', function() {
                console.log('✅ Botão OK do popup clicado');
                fecharPopup();
            });
        } else {
            console.warn('⚠️ Elemento popupBotao não encontrado');
        }

        // Fechar popup clicando fora
        if (elementos.popupMensagem) {
            console.log('🎯 Configurando click fora do popup');
            elementos.popupMensagem.addEventListener('click', function(e) {
                if (e.target === elementos.popupMensagem) {
                    console.log('🎯 Clicou fora do popup - fechando');
                    fecharPopup();
                }
            });
        }

        // Fechar popup com ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && elementos.popupMensagem && elementos.popupMensagem.style.display === 'flex') {
                console.log('⌨️ Tecla ESC pressionada - fechando popup');
                fecharPopup();
            }
        });
    }

    function fecharPopup() {
        if (elementos.popupMensagem) {
            elementos.popupMensagem.style.display = 'none';
            elementos.popupMensagem.classList.remove('mostrar');
            console.log('✅ Popup fechado');
        }
    }

    function proximaEtapa() {
        console.log(`▶️ Tentando ir para próxima etapa - atual: ${estado.etapaAtual}`);
        
        if (!validarEtapaAtual()) {
            console.log('❌ Validação da etapa atual falhou');
            return;
        }

        if (estado.etapaAtual < estado.totalEtapas) {
            estado.etapaAtual++;
            console.log(`✅ Avançando para etapa ${estado.etapaAtual}`);
            atualizarEtapa();
            if (estado.etapaAtual === estado.totalEtapas) {
                console.log('📋 Chegou na última etapa - atualizando resumo');
                atualizarResumo();
            }
        } else {
            console.log('⚠️ Já está na última etapa');
        }
    }

    function etapaAnterior() {
        console.log(`◀️ Voltando para etapa anterior - atual: ${estado.etapaAtual}`);
        
        if (estado.etapaAtual > 1) {
            estado.etapaAtual--;
            console.log(`✅ Voltando para etapa ${estado.etapaAtual}`);
            atualizarEtapa();
        } else {
            console.log('⚠️ Já está na primeira etapa');
        }
    }

    function atualizarEtapa() {
        console.log(`🔄 Atualizando interface para etapa ${estado.etapaAtual}`);

        // Atualizar indicador de progresso
        elementos.etapas.forEach((etapa, index) => {
            const numeroEtapa = index + 1;
            etapa.classList.remove('etapa-ativa', 'etapa-concluida');
            
            if (numeroEtapa === estado.etapaAtual) {
                etapa.classList.add('etapa-ativa');
                console.log(`✅ Etapa ${numeroEtapa} marcada como ativa`);
            } else if (numeroEtapa < estado.etapaAtual) {
                etapa.classList.add('etapa-concluida');
                console.log(`✅ Etapa ${numeroEtapa} marcada como concluída`);
            }
        });

        // Atualizar linhas de progresso
        elementos.linhasProgresso.forEach((linha, index) => {
            if (index < estado.etapaAtual - 1) {
                linha.classList.add('ativa');
            } else {
                linha.classList.remove('ativa');
            }
        });

        // Mostrar/ocultar etapas do formulário
        elementos.etapasFormulario.forEach((etapa, index) => {
            const numeroEtapa = index + 1;
            if (numeroEtapa === estado.etapaAtual) {
                etapa.classList.add('etapa-ativa');
            } else {
                etapa.classList.remove('etapa-ativa');
            }
        });

        // Atualizar botões
        if (elementos.botaoAnterior) {
            if (estado.etapaAtual === 1) {
                elementos.botaoAnterior.style.display = 'none';
            } else {
                elementos.botaoAnterior.style.display = 'flex';
            }
        }

        if (elementos.botaoProximo && elementos.botaoSalvar) {
            if (estado.etapaAtual === estado.totalEtapas) {
                elementos.botaoProximo.style.display = 'none';
                elementos.botaoSalvar.style.display = 'flex';
            } else {
                elementos.botaoProximo.style.display = 'flex';
                elementos.botaoSalvar.style.display = 'none';
            }
        }
    }

    function validarEtapaAtual() {
        console.log(`🔍 Validando etapa ${estado.etapaAtual}...`);
        
        switch (estado.etapaAtual) {
            case 1:
                console.log('🔍 Validando etapa 1 - Dados do cartão');
                
                if (!elementos.inputNomeCartao || !elementos.inputNomeCartao.value.trim()) {
                    console.log('❌ Nome do cartão não informado');
                    mostrarModal('Atenção', 'Por favor, insira um nome para o cartão');
                    return false;
                }
                console.log('✅ Nome do cartão validado:', elementos.inputNomeCartao.value);
                
                if (!estado.bandeiraSelecionada) {
                    console.log('❌ Bandeira não selecionada');
                    mostrarModal('Atenção', 'Por favor, selecione a bandeira do cartão');
                    return false;
                }
                console.log('✅ Bandeira selecionada:', estado.bandeiraSelecionada);
                break;
                
            case 2:
                console.log('🔍 Validando etapa 2 - Configurações');
                
                if (!estado.contaSelecionada) {
                    console.log('❌ Conta não selecionada');
                    mostrarModal('Atenção', 'Por favor, selecione uma conta vinculada');
                    return false;
                }
                console.log('✅ Conta selecionada:', estado.contaSelecionada);
                
                if (!elementos.valorLimite || elementos.valorLimite.value === 'R$ 0,00' || !elementos.valorLimite.value) {
                    console.log('❌ Limite não informado');
                    mostrarModal('Atenção', 'Por favor, insira o limite do cartão');
                    return false;
                }
                console.log('✅ Limite validado:', elementos.valorLimite.value);
                break;
        }
        
        console.log(`✅ Etapa ${estado.etapaAtual} validada com sucesso`);
        return true;
    }

    // Carregar contas
    function carregarContas() {
        const contas = JSON.parse(localStorage.getItem('contasBancarias')) || [];
        console.log(`📂 Contas carregadas (${contas.length}):`, contas);
        
        elementos.opcoesConta.innerHTML = '';
        
        contas.forEach(conta => {
            const opcao = document.createElement('div');
            opcao.className = 'opcao-conta';
            opcao.setAttribute('data-value', conta.id);
            opcao.innerHTML = `
                <span class="material-icons icone-conta">${conta.icone}</span>
                <span>${conta.nome}</span>
            `;
            elementos.opcoesConta.appendChild(opcao);
        });
        
        const opcaoNovaConta = document.createElement('div');
        opcaoNovaConta.className = 'opcao-conta opcao-nova-conta';
        opcaoNovaConta.setAttribute('data-value', 'nova');
        opcaoNovaConta.innerHTML = `
            <span class="material-icons icone-conta">add</span>
            <span>Criar nova conta</span>
        `;
        elementos.opcoesConta.appendChild(opcaoNovaConta);
    }

    // Gerar opções de dias (1-31)
    function gerarOpcoesDias() {
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
    }

    // Funções da calculadora
    function abrirCalculadora() {
        if (!elementos.calculadoraContainer) {
            console.error('Elemento calculadoraContainer não encontrado');
            return;
        }

        elementos.calculadoraContainer.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        setTimeout(() => {
            elementos.calculadoraContainer.classList.add('mostrar');
        }, 10);

        let valorAtual = elementos.valorLimite?.value.replace('R$ ', '').replace(/\./g, '').replace(',', '.') || '0';
        if (isNaN(parseFloat(valorAtual))) valorAtual = '0';
        estado.valorLimite = valorAtual === '0,00' ? '0' : valorAtual;
        atualizarDisplayCalculadora();
        estado.digitandoValor = false;

        document.addEventListener('keydown', handleEscapeKey);
    }

    function fecharCalculadora() {
        if (!elementos.calculadoraContainer) {
            console.error('Elemento calculadoraContainer não encontrado');
            return;
        }

        elementos.calculadoraContainer.classList.remove('mostrar');
        document.body.style.overflow = '';

        setTimeout(() => {
            elementos.calculadoraContainer.style.display = 'none';
        }, 300);

        document.removeEventListener('keydown', handleEscapeKey);
    }

    function handleEscapeKey(e) {
        if (e.key === 'Escape') {
            cancelarCalculadora();
        }
    }

    function cancelarCalculadora() {
        fecharCalculadora();
    }

    function confirmarCalculadora() {
        let valorNumerico = parseFloat(estado.valorLimite);
        if (isNaN(valorNumerico) || valorNumerico < 0) {
            estado.valorLimite = '0';
        }
        const valorFormatado = `R$ ${formatarMoeda(estado.valorLimite)}`;
        elementos.valorLimite.value = valorFormatado;

        elementos.calculadoraDisplay.style.background = '#dcfce7';
        elementos.calculadoraDisplay.style.borderColor = '#22c55e';

        setTimeout(() => {
            fecharCalculadora();
            setTimeout(() => {
                elementos.calculadoraDisplay.style.background = '';
                elementos.calculadoraDisplay.style.borderColor = '';
            }, 300);
        }, 500);
    }

    function adicionarNumero(numero) {
        // Aceita apenas números e vírgula
        if (!estado.digitandoValor) {
            estado.valorLimite = '0';
            estado.digitandoValor = true;
        }

        if (numero === '00') {
            if (estado.valorLimite === '0') return;
            estado.valorLimite += '00';
        } else if (numero === ',' || numero === '.') {
            // Adiciona vírgula apenas se não houver
            if (!estado.valorLimite.includes(',')) {
                estado.valorLimite += ',';
            }
        } else {
            if (estado.valorLimite === '0' && numero !== ',' && numero !== '.') {
                estado.valorLimite = numero;
            } else {
                // Limita casas decimais a 2
                if (estado.valorLimite.includes(',')) {
                    const parts = estado.valorLimite.split(',');
                    if (parts[1] && parts[1].length >= 2) return;
                }
                estado.valorLimite += numero;
            }
        }
        atualizarDisplayCalculadora();
    }

    function apagarInput() {
        if (estado.valorLimite.length > 1) {
            estado.valorLimite = estado.valorLimite.slice(0, -1);
        } else {
            estado.valorLimite = '0';
            estado.digitandoValor = false;
        }
        atualizarDisplayCalculadora();
    }

    function atualizarDisplayCalculadora() {
        // Exibe o valor com vírgula como separador decimal
        let valor = estado.valorLimite.replace('.', ',');
        if (valor === '' || valor === '0') valor = '0,00';
        elementos.calculadoraDisplay.value = `R$ ${formatarMoeda(valor)}`;
        elementos.calculadoraDisplay.style.transform = 'scale(1.02)';
        setTimeout(() => {
            elementos.calculadoraDisplay.style.transform = 'scale(1)';
        }, 100);
    }

    function formatarMoeda(valor) {
        // Aceita vírgula como separador decimal
        let numero = parseFloat(valor.replace(',', '.')) || 0;
        return numero.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // Função para mostrar popup
    function mostrarPopup(mensagem) {
        console.log('🚨 Exibindo popup simples:', mensagem);
        
        if (!elementos.popupTexto || !elementos.popupMensagem) {
            console.error('❌ Elementos do popup não encontrados:', {
                popupTexto: !!elementos.popupTexto,
                popupMensagem: !!elementos.popupMensagem
            });
            alert(mensagem); // Fallback
            return;
        }
        
        elementos.popupTexto.textContent = mensagem;
        elementos.popupMensagem.style.display = 'flex';
        elementos.popupMensagem.classList.add('mostrar');
        
        console.log('✅ Popup exibido com sucesso');
    }

    // Função para mostrar modal
    function mostrarModal(titulo, mensagem) {
        console.log('🚨 Exibindo modal:', { titulo, mensagem });
        
        if (!elementos.popupMensagem || !elementos.modalTitulo || !elementos.popupTexto) {
            console.error('❌ Elementos do modal não encontrados:', {
                popupMensagem: !!elementos.popupMensagem,
                modalTitulo: !!elementos.modalTitulo,
                popupTexto: !!elementos.popupTexto
            });
            alert(`${titulo}: ${mensagem}`); // Fallback
            return;
        }
        
        elementos.modalTitulo.textContent = titulo;
        elementos.popupTexto.textContent = mensagem;
        elementos.popupMensagem.style.display = 'flex';
        elementos.popupMensagem.classList.add('mostrar');
        
        console.log('✅ Modal exibido com sucesso');
    }

    // Função para salvar o cartão
    function salvarCartao() {
        console.log('💾 Salvando cartão...');
        const novoCartao = {
            id: Date.now().toString(),
            numero: elementos.inputNumeroCartao.value.replace(/\s/g, ''),
            nome: elementos.inputNomeCartao.value,
            validade: `${elementos.inputValidadeMes.value}/${elementos.inputValidadeAno.value}`,
            cvv: elementos.inputCvvCartao.value,
            bandeira: estado.bandeiraSelecionada,
            limite: elementos.valorLimite.value,
            conta: estado.contaSelecionada,
            diaFechamento: estado.diaFechamento,
            diaVencimento: estado.diaVencimento,
            dataCriacao: new Date().toISOString()
        };
        console.log('🎯 Novo cartão criado:', novoCartao);

        let cartoes = JSON.parse(localStorage.getItem('cartoesCredito')) || [];
        cartoes.push(novoCartao);
        localStorage.setItem('cartoesCredito', JSON.stringify(cartoes));
        console.log(`✅ Cartão salvo com sucesso! Total de cartões: ${cartoes.length}`);
    }

    // Inicializar a aplicação
    inicializar();
});