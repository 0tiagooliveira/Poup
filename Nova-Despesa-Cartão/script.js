// Cache de elementos DOM para evitar consultas repetidas (global)
let elementos = {};

// Estado da aplicação (global)
let estado = {};

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado - Iniciando aplicação...');
    
    // Inicializar elementos DOM
    elementos = {
        botaoVoltar: document.querySelector('.botao-voltar'),
        secaoValor: document.getElementById('secao-valor'),
    valorDespesa: document.getElementById('valor-despesa'),
    checkboxPago: document.getElementById('pago'),
        campoData: document.getElementById('campo-data'),
        dataSelecionada: document.getElementById('data-selecionada'),
        calendario: document.getElementById('calendario'),
        inputDescricao: document.getElementById('descricao'),
        seletorCategoria: document.getElementById('seletor-categoria'),
        opcaoSelecionadaCategoria: document.querySelector('.seletor-categoria .opcao-selecionada'),
        opcoesCategoria: document.querySelector('.seletor-categoria .opcoes-categoria'),
        seletorCarteira: document.getElementById('seletor-carteira'),
        opcaoSelecionadaCarteira: document.querySelector('.seletor-carteira .opcao-selecionada'),
        opcoesCarteira: document.querySelector('.seletor-carteira .opcoes-carteira'),
        inputAnexo: document.getElementById('anexo'),
        botaoAnexo: document.getElementById('botao-anexo'),
        nomeArquivo: document.getElementById('nome-arquivo'),
        botaoSalvar: document.getElementById('botao-salvar'),
        calculadoraContainer: document.getElementById('calculadora-container'),
        calculadoraDisplay: document.getElementById('calculadora-display'),
        calculadoraBotoes: document.querySelector('.calculadora-botoes'),
        botaoApagar: document.getElementById('botao-apagar'),
        btnCancelarCalculadora: document.querySelector('.btn-cancelar-calculadora'),
        btnConfirmarCalculadora: document.querySelector('.btn-confirmar-calculadora'),
        modalCategoria: document.getElementById('modal-categoria'),
        galeriaIcones: document.getElementById('galeria-icones'),
        nomeCategoriaInput: document.getElementById('nome-categoria'),
        corCategoriaInput: document.getElementById('cor-categoria'),
        iconeSelecionadoPreview: document.getElementById('icone-selecionado-preview'),
        salvarCategoriaBtn: document.getElementById('salvar-categoria'),
        cancelarCategoriaBtn: document.getElementById('cancelar-categoria'),
        popupMensagem: document.getElementById('popup-mensagem'),
        popupTexto: document.getElementById('popup-texto'),
        popupBotao: document.getElementById('popup-botao'),
        toggleRepetir: document.getElementById('toggle-repetir'),
        camposRepetir: document.getElementById('campos-repetir')
    };

    // Inicializar estado da aplicação
    estado = {
        valorAtual: '0',
        digitandoValor: false,
        dataSelecionada: new Date(),
        categoriaSelecionada: null,
        carteiraSelecionada: null,
        iconeSelecionado: 'restaurant',
        corCategoriaSelecionada: null, // Adicionar cor da categoria
        eventListeners: new Map() // Cache para event listeners
    };

    // Categorias padrão com lazy loading
    const categoriasPadrao = [
        { nome: 'Alimentação', icone: 'restaurant' },
        { nome: 'Transporte', icone: 'directions_car' },
        { nome: 'Moradia', icone: 'home' },
        { nome: 'Mercado', icone: 'shopping_cart' },
        { nome: 'Compras', icone: 'local_mall' },
        { nome: 'Saúde', icone: 'local_hospital' },
        { nome: 'Educação', icone: 'school' },
        { nome: 'Lazer', icone: 'sports_soccer' },
        { nome: 'Viagem', icone: 'flight' },
        { nome: 'Assinaturas', icone: 'subscriptions' },
        { nome: 'Cartão de Crédito', icone: 'credit_card' },
        { nome: 'Impostos', icone: 'paid' },
        { nome: 'Presentes', icone: 'emoji_events' },
        { nome: 'Pets', icone: 'pets' },
        { nome: 'Manutenção', icone: 'build' },
        { nome: 'Telefonia/Internet', icone: 'phone_iphone' },
        { nome: 'Energia', icone: 'bolt' },
        { nome: 'Água', icone: 'water_drop' },
        { nome: 'Gás', icone: 'local_fire_department' },
        { nome: 'Bem-estar', icone: 'self_improvement' },
        { nome: 'Empréstimos', icone: 'attach_money' },
        { nome: 'Transporte Público', icone: 'directions_bus' },
        { nome: 'Táxi/App', icone: 'local_taxi' },
        { nome: 'Poupança', icone: 'savings' },
        { nome: 'Café/Lanches', icone: 'emoji_food_beverage' },
        { nome: 'Adicionar categoria', icone: 'add' }
    ];

    // Função otimizada para adicionar event listeners
    function addEventListenerOnce(element, event, handler, key) {
        if (!element || estado.eventListeners.has(key)) return;
        
        element.addEventListener(event, handler);
        estado.eventListeners.set(key, { element, event, handler });
    }

    // Inicialização otimizada
    function inicializar() {
        console.log('Inicializando aplicação...');
        configurarEventos();
        atualizarDataSelecionada();
        
        // Carregamento lazy de dados pesados
        requestIdleCallback(() => {
            carregarCarteiras();
            carregarCategorias();
        });
        
        console.log('Aplicação inicializada com sucesso');
    }

    // Configurar eventos otimizado
    function configurarEventos() {
        console.log('Configurando eventos...');
        
        // Botão voltar
        addEventListenerOnce(elementos.botaoVoltar, 'click', function() {
            console.log('Botão voltar clicado');
            window.history.back();
        }, 'botao-voltar');

        // Calculadora com debounce
        let calculadoraTimeout;
        addEventListenerOnce(elementos.secaoValor, 'click', function() {
            clearTimeout(calculadoraTimeout);
            calculadoraTimeout = setTimeout(abrirCalculadora, 100);
        }, 'secao-valor');
        
        addEventListenerOnce(elementos.calculadoraContainer, 'click', function(e) {
            if (e.target === elementos.calculadoraContainer) {
                console.log('Clicou fora da calculadora - fechando');
                fecharCalculadora();
            }
        }, 'calculadora-container');
        
        // Event delegation para botões da calculadora
        addEventListenerOnce(elementos.calculadoraBotoes, 'click', function(e) {
            if (e.target.tagName === 'BUTTON') {
                const valor = e.target.textContent.trim();
                console.log(`Botão da calculadora pressionado: ${valor}`);
                
                if (valor.match(/[0-9]/)) {
                    adicionarNumero(valor);
                } else if (valor === ',') {
                    adicionarNumero('.');
                } else if (valor === '=') {
                    confirmarCalculadora();
                }
            }
        }, 'calculadora-botoes');
        
        addEventListenerOnce(elementos.botaoApagar, 'click', apagarInput, 'botao-apagar');
        addEventListenerOnce(elementos.btnCancelarCalculadora, 'click', cancelarCalculadora, 'btn-cancelar');
        addEventListenerOnce(elementos.btnConfirmarCalculadora, 'click', confirmarCalculadora, 'btn-confirmar');

        // Calendário otimizado
        addEventListenerOnce(elementos.campoData, 'click', function(e) {
            e.stopPropagation();
            console.log('Abrindo calendário');
            elementos.calendario.classList.add('mostrar');
        }, 'campo-data');
        
        // Lazy render do calendário
        renderizarCalendario();
        
        // Event delegation para clicks globais
        addEventListenerOnce(document, 'click', function(e) {
            // Fechar calendário
            if (!elementos.calendario.contains(e.target) && e.target !== elementos.campoData) {
                elementos.calendario.classList.remove('mostrar');
            }
            
            // Fechar seletores
            if (!elementos.seletorCategoria.contains(e.target)) {
                elementos.opcoesCategoria.classList.remove('mostrar');
            }
        }, 'document-clicks');

        // Categorias
        addEventListenerOnce(elementos.opcaoSelecionadaCategoria, 'click', function(e) {
            e.stopPropagation();
            console.log('Abrindo seletor de categorias');
            elementos.opcoesCategoria.classList.toggle('mostrar');
        }, 'opcao-categoria');

        // Carteiras
        addEventListenerOnce(elementos.opcaoSelecionadaCarteira, 'click', function(e) {
            e.stopPropagation();
            console.log('Abrindo seletor de carteiras');
            elementos.opcoesCarteira.classList.toggle('mostrar');
        }, 'opcao-carteira');

        // Anexo
        addEventListenerOnce(elementos.botaoAnexo, 'click', function() {
            console.log('Abrindo seletor de arquivos');
            elementos.inputAnexo.click();
        }, 'botao-anexo');
        
        addEventListenerOnce(elementos.inputAnexo, 'change', function() {
            if (this.files && this.files[0]) {
                console.log('Arquivo selecionado:', this.files[0].name);
                elementos.nomeArquivo.textContent = this.files[0].name;
            }
        }, 'input-anexo');

    // Salvar despesa
    addEventListenerOnce(elementos.botaoSalvar, 'click', salvarDespesa, 'botao-salvar');

        // Modal de categoria
        if (elementos.salvarCategoriaBtn) {
            addEventListenerOnce(elementos.salvarCategoriaBtn, 'click', salvarCategoriaPersonalizada, 'salvar-categoria');
        }
        if (elementos.cancelarCategoriaBtn) {
            addEventListenerOnce(elementos.cancelarCategoriaBtn, 'click', fecharModalCategoria, 'cancelar-categoria');
        }
        if (elementos.corCategoriaInput) {
            addEventListenerOnce(elementos.corCategoriaInput, 'input', atualizarCorPreview, 'cor-categoria');
        }

        // Toggle de repetição
        addEventListenerOnce(elementos.toggleRepetir, 'change', function() {
            console.log('Toggle de repetição alterado:', this.checked);
            elementos.camposRepetir.style.display = this.checked ? 'block' : 'none';
        }, 'toggle-repetir');

        // Configurar eventos de categoria personalizada
        configurarEventosCategoriaPersonalizada();
    }

    // Função otimizada para configurar eventos de categoria personalizada
    function configurarEventosCategoriaPersonalizada() {
    // Em versão de despesa não há select tradicional 'categoria-receita'; usamos seletor custom.
    const selectCategoria = null;
        const popupCriarCategoria = document.getElementById('popup-criar-categoria');
        const btnCancelar = document.getElementById('popup-criar-categoria-cancelar');
        const btnSalvar = document.getElementById('popup-criar-categoria-salvar');
        const inputNome = document.getElementById('nova-categoria-nome');
        const selectIcone = document.getElementById('nova-categoria-icone');

        if (selectCategoria) {
            addEventListenerOnce(selectCategoria, 'change', function() {
                if (this.value === 'criar-categoria') {
                    popupCriarCategoria.style.display = 'flex';
                    inputNome.value = '';
                    selectIcone.value = 'category';
                }
            }, 'select-categoria');
        }
        
        if (btnCancelar) {
            addEventListenerOnce(btnCancelar, 'click', function() {
                popupCriarCategoria.style.display = 'none';
                if (selectCategoria) selectCategoria.value = '-';
            }, 'btn-cancelar-categoria');
        }
        
        if (btnSalvar) {
            addEventListenerOnce(btnSalvar, 'click', function() {
                const nome = inputNome.value.trim();
                const icone = selectIcone.value;
                if (!nome) {
                    inputNome.style.borderColor = '#ef233c';
                    inputNome.focus();
                    return;
                }
                
                // Adiciona nova categoria de forma otimizada
                const option = document.createElement('option');
                option.value = nome;
                option.textContent = nome;
                option.setAttribute('data-icone', icone);
                selectCategoria.appendChild(option);
                selectCategoria.value = nome;
                popupCriarCategoria.style.display = 'none';
            }, 'btn-salvar-categoria');
        }
    }

    // Função de salvar despesa consolidada e otimizada
    function salvarDespesa() {
        console.log('Iniciando processo de salvar despesa...');
        
        // Validação com early return
        const validacoes = [
            { condicao: elementos.valorDespesa.textContent === 'R$ 0,00', mensagem: 'Por favor, insira um valor para a despesa.' },
            { condicao: !elementos.inputDescricao.value.trim(), mensagem: 'Por favor, insira uma descrição para a despesa.' },
            { condicao: !estado.categoriaSelecionada, mensagem: 'Por favor, selecione uma categoria.' },
            { condicao: !estado.carteiraSelecionada, mensagem: 'Por favor, selecione uma conta.' }
        ];

        for (const validacao of validacoes) {
            if (validacao.condicao) {
                console.log('Validação falhou:', validacao.mensagem);
                mostrarPopup(validacao.mensagem);
                return;
            }
        }

        // Coleta dados de forma otimizada
        const quantidadeRepeticoes = parseInt(document.getElementById('quantidade-repeticoes')?.value) || 1;
        const repetir = quantidadeRepeticoes > 1; // Se quantidade > 1, é repetição
        const despesaFixa = document.getElementById('toggle-despesa-fixa')?.checked || false;
        
        // IMPORTANTE: campo 'carteira' armazena somente o ID da conta para permitir agregação rápida na Home
        const novaDespesa = {
            valor: elementos.valorDespesa.textContent,
            pago: elementos.checkboxPago ? elementos.checkboxPago.checked : false,
            data: elementos.dataSelecionada.textContent,
            descricao: elementos.inputDescricao.value.trim(),
            categoria: estado.categoriaSelecionada,
            iconeCategoria: estado.iconeSelecionado, // Adicionar ícone da categoria
            corCategoria: estado.corCategoriaSelecionada || '#D32F2F', // Adicionar cor da categoria
            carteira: estado.carteiraSelecionada,
            tipo: 'cartao', // Marcar como despesa de cartão
            anexo: elementos.inputAnexo.files.length > 0 ? elementos.inputAnexo.files[0].name : null,
            repetir: repetir,
            quantidadeRepeticoes: repetir ? document.getElementById('quantidade-repeticoes')?.value : null,
            frequenciaRepeticoes: repetir ? document.getElementById('frequencia-repeticoes')?.value : null,
            despesaFixa: despesaFixa,
            timestamp: Date.now()
        };

        console.log('📝 Nova despesa com ícone e cor:', {
            categoria: novaDespesa.categoria,
            iconeCategoria: novaDespesa.iconeCategoria,
            corCategoria: novaDespesa.corCategoria
        });

        // Preparar numeração se for repetida ou fixa
        let despesaComNumeracao = { ...novaDespesa };
        
        if (repetir || despesaFixa) {
            // Se for repetida ou fixa, primeiro vamos preparar a numeração
            const totalRepeticoes = repetir ? parseInt(document.getElementById('quantidade-repeticoes')?.value) || 1 : 12;
            despesaComNumeracao.descricao = `${novaDespesa.descricao} 1/${totalRepeticoes}`;
            despesaComNumeracao.numeroSequencia = 1;
            despesaComNumeracao.totalSequencia = totalRepeticoes;
        }

        // Salvar despesa principal (original) com numeração
        Promise.all([
            salvarLocalStorage(despesaComNumeracao),
            salvarFirestore(despesaComNumeracao)
        ]).then(() => {
            // Gerar despesas futuras se for fixa ou repetida
            return gerarDespesasFuturas(despesaComNumeracao);
        }).then(() => {
            const mensagem = (novaDespesa.despesaFixa || novaDespesa.repetir) 
                ? 'Despesa salva com sucesso! Despesas futuras foram geradas automaticamente.'
                : 'Despesa salva com sucesso!';

            mostrarPopup(mensagem, () => {
                limparFormulario();
                window.location.href = "../Lista-de-despesas-cartao/Lista-de-despesas-cartao.html";
            });
        }).catch(error => {
            console.error('Erro ao salvar:', error);
            mostrarPopup('Ocorreu um erro ao salvar a despesa.');
        });
    }

    // Função otimizada para salvar no localStorage
    function salvarLocalStorage(despesa) {
        return new Promise((resolve) => {
            try {
                let despesas = JSON.parse(localStorage.getItem('despesas') || '[]');
                despesas.push(despesa);
                localStorage.setItem('despesas', JSON.stringify(despesas));
                console.log('Despesa salva no localStorage');
                resolve();
            } catch (e) {
                console.error('Erro ao salvar no localStorage:', e);
                resolve(); // Não falha se localStorage der erro
            }
        });
    }

    // Função otimizada para salvar no Firestore
    function salvarFirestore(despesa) {
        return new Promise((resolve, reject) => {
            if (!firebase?.auth || !firebase?.firestore) {
                resolve(); // Firebase não disponível
                return;
            }

            const user = firebase.auth().currentUser;
            if (!user) {
                resolve(); // Usuário não logado
                return;
            }

            const despesaFirestore = { ...despesa, userId: user.uid };
            firebase.firestore().collection('despesas-cartao').add(despesaFirestore)
                .then((docRef) => {
                    console.log('Despesa salva no Firestore!');
                    const despesaComId = { ...despesaFirestore, id: docRef.id };
                    if (typeof window.criarNotificacaoNovaDespesa === 'function') {
                        window.criarNotificacaoNovaDespesa(despesaComId).catch(err => {
                            console.error('Erro ao criar notificação de despesa:', err);
                        });
                    }
                    resolve();
                })
                .catch(reject);
        });
    }

    // Função para gerar despesas futuras automaticamente
    function gerarDespesasFuturas(despesaBase) {
        return new Promise((resolve, reject) => {
            try {
                // Verificar se é despesa fixa ou repetida
                if (!despesaBase.despesaFixa && !despesaBase.repetir) {
                    resolve(); // Não é fixa nem repetida
                    return;
                }

                const despesasFuturas = [];
                const dataBase = new Date(converterDataParaISO(despesaBase.data));
                
                // Determinar quantidade e frequência para gerar
                let totalParaGerar = 12; // Padrão: 12 meses para despesas fixas
                let frequencia = 'meses';
                
                if (despesaBase.repetir && despesaBase.quantidadeRepeticoes) {
                    totalParaGerar = parseInt(despesaBase.quantidadeRepeticoes);
                    frequencia = despesaBase.frequenciaRepeticoes || 'meses';
                }

                console.log(`Gerando ${totalParaGerar} despesas futuras com frequência ${frequencia}...`);

                // Preparar descrição original removendo qualquer numeração existente
                const descricaoOriginal = despesaBase.descricao.replace(/ \d+\/\d+$/, '');

                // Gerar despesas para os próximos períodos
                for (let i = 1; i < totalParaGerar; i++) {
                    const novaData = new Date(dataBase);
                    
                    // Ajustar data baseado na frequência
                    switch (frequencia) {
                        case 'dias':
                            novaData.setDate(dataBase.getDate() + i);
                            break;
                        case 'semanas':
                            novaData.setDate(dataBase.getDate() + (i * 7));
                            break;
                        case 'meses':
                        default:
                            novaData.setMonth(dataBase.getMonth() + i);
                            // Ajustar para o último dia do mês se necessário
                            if (novaData.getDate() !== dataBase.getDate()) {
                                novaData.setDate(0); // Vai para o último dia do mês anterior
                                novaData.setMonth(novaData.getMonth() + 1);
                            }
                            break;
                        case 'anos':
                            novaData.setFullYear(dataBase.getFullYear() + i);
                            break;
                    }

                    const despesaFutura = {
                        ...despesaBase,
                        descricao: `${descricaoOriginal} ${i + 1}/${totalParaGerar}`, // Numeração sequencial
                        data: formatarDataParaExibicao(novaData),
                        pago: false, // Despesas futuras começam como não pagas
                        timestamp: Date.now() + i, // Timestamp único
                        origem: 'automatica', // Marcar como gerada automaticamente
                        despesaOrigem: despesaBase.timestamp, // Referência à despesa original
                        numeroSequencia: i + 1,
                        totalSequencia: totalParaGerar
                    };

                    despesasFuturas.push(despesaFutura);
                }

                // Salvar todas as despesas futuras
                const promessas = despesasFuturas.map(despesa => {
                    return Promise.all([
                        salvarDespesaFuturaLocalStorage(despesa),
                        salvarDespesaFuturaFirestore(despesa)
                    ]);
                });

                Promise.all(promessas)
                    .then(() => {
                        console.log(`${despesasFuturas.length} despesas futuras criadas com numeração`);
                        resolve();
                    })
                    .catch(reject);

            } catch (error) {
                console.error('Erro ao gerar despesas futuras:', error);
                reject(error);
            }
        });
    }

    // Função auxiliar para salvar despesa futura no localStorage
    function salvarDespesaFuturaLocalStorage(despesa) {
        return new Promise((resolve) => {
            try {
                let despesas = JSON.parse(localStorage.getItem('despesas') || '[]');

                // Verificar duplicatas usando descrição completa (com numeração) e timestamp de origem
                const existeDespesa = despesas.some(r => 
                    r.descricao === despesa.descricao &&
                    r.categoria === despesa.categoria &&
                    r.despesaOrigem === despesa.despesaOrigem &&
                    r.numeroSequencia === despesa.numeroSequencia
                );

                if (!existeDespesa) {
                    despesas.push(despesa);
                    localStorage.setItem('despesas', JSON.stringify(despesas));
                    console.log(`Despesa futura salva: ${despesa.descricao} para ${despesa.data}`);
                }
                
                resolve();
            } catch (e) {
                console.error('Erro ao salvar despesa futura no localStorage:', e);
                resolve(); // Não falha se localStorage der erro
            }
        });
    }

    // Função auxiliar para salvar despesa futura no Firestore
    function salvarDespesaFuturaFirestore(despesa) {
        return new Promise((resolve, reject) => {
            if (!firebase?.auth || !firebase?.firestore) {
                resolve(); // Firebase não disponível
                return;
            }

            const user = firebase.auth().currentUser;
            if (!user) {
                resolve(); // Usuário não logado
                return;
            }

            // Verificar duplicatas usando descrição completa, despesaOrigem e numeroSequencia
            firebase.firestore().collection('despesas-cartao')
                .where('userId', '==', user.uid)
                .where('descricao', '==', despesa.descricao)
                .where('despesaOrigem', '==', despesa.despesaOrigem)
                .where('numeroSequencia', '==', despesa.numeroSequencia)
                .get()
                .then(snapshot => {
                    if (snapshot.empty) {
                        // Não existe duplicata, salvar a despesa
                        const despesaFirestore = { ...despesa, userId: user.uid };
                        return firebase.firestore().collection('despesas-cartao').add(despesaFirestore);
                    } else {
                        console.log(`Despesa duplicada detectada: ${despesa.descricao}`);
                        return Promise.resolve();
                    }
                })
                .then(() => {
                    console.log(`Despesa futura salva no Firestore: ${despesa.descricao} para ${despesa.data}`);
                    resolve();
                })
                .catch(reject);
        });
    }

    // Funções auxiliares para conversão de datas
    function converterDataParaISO(dataString) {
        // Converte "DD/MM/AAAA" para "AAAA-MM-DD"
        const partes = dataString.split('/');
        return `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
    }

    function formatarDataParaExibicao(data) {
        // Converte Date para "DD/MM/AAAA"
        const dia = data.getDate().toString().padStart(2, '0');
        const mes = (data.getMonth() + 1).toString().padStart(2, '0');
        const ano = data.getFullYear();
        return `${dia}/${mes}/${ano}`;
    }

    function limparFormulario() {
    elementos.valorDespesa.textContent = 'R$ 0,00';
    
    if (elementos.checkboxPago) {
        elementos.checkboxPago.checked = true;
    }
    
    elementos.inputDescricao.value = '';
    elementos.opcaoSelecionadaCategoria.innerHTML = '<span>Selecione uma categoria</span>';
    elementos.opcaoSelecionadaCarteira.innerHTML = '<span>Selecione uma conta</span>';
    elementos.nomeArquivo.textContent = '';
    elementos.inputAnexo.value = '';
    
    if (elementos.toggleRepetir) {
        elementos.toggleRepetir.checked = false;
    }
    if (elementos.camposRepetir) {
        elementos.camposRepetir.style.display = 'none';
    }
    
    estado.categoriaSelecionada = null;
    estado.carteiraSelecionada = null;
    estado.dataSelecionada = new Date();
    
    atualizarDataSelecionada();
    }

    // Funções da calculadora otimizadas
    function abrirCalculadora() {
        // Abrindo calculadora
        elementos.calculadoraContainer.style.display = 'block';
    const valorTexto = elementos.valorDespesa.textContent.replace('R$ ', '').replace(/\./g, '').replace(',', '.');
        estado.valorAtual = valorTexto || '0';
        elementos.calculadoraDisplay.value = formatarValor(estado.valorAtual);
        estado.digitandoValor = false;
    }

    function fecharCalculadora() {
        // Fechando calculadora
        elementos.calculadoraContainer.style.display = 'none';
    }

    function cancelarCalculadora() {
        // Cancelando calculadora
        fecharCalculadora();
    }

    function confirmarCalculadora() {
        const valorFormatado = formatarMoeda(estado.valorAtual);
        // Valor confirmado na calculadora
    elementos.valorDespesa.textContent = `R$ ${valorFormatado}`;
        fecharCalculadora();
    }

    function adicionarNumero(numero) {
        if (!estado.digitandoValor) {
            estado.valorAtual = '0';
            estado.digitandoValor = true;
        }
        
        if (estado.valorAtual === '0' && numero !== '.') {
            estado.valorAtual = numero;
        } else {
            if (estado.valorAtual.includes('.') && estado.valorAtual.split('.')[1].length >= 2) {
                // Limite de casas decimais atingido
                return;
            }
            estado.valorAtual += numero;
        }
        
    // Atualização valor atual
        elementos.calculadoraDisplay.value = formatarValor(estado.valorAtual);
    }

    function apagarInput() {
        if (estado.valorAtual.length > 1) {
            estado.valorAtual = estado.valorAtual.slice(0, -1);
        } else {
            estado.valorAtual = '0';
            estado.digitandoValor = false;
        }
    // Backspace valor
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

    // Função de calendário otimizada com fragments
    function renderizarCalendario() {
        console.log('Renderizando calendário...');
        const ano = estado.dataSelecionada.getFullYear();
        const mes = estado.dataSelecionada.getMonth();

        const primeiroDiaMes = new Date(ano, mes, 1);
        const ultimoDiaMes = new Date(ano, mes + 1, 0);
        const diasNoMes = ultimoDiaMes.getDate();
        const primeiroDiaSemana = primeiroDiaMes.getDay();

        const nomesMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        const nomesDias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        // Usar DocumentFragment para melhor performance
        const fragment = document.createDocumentFragment();
        
        const cabecalho = document.createElement('div');
        cabecalho.className = 'cabecalho-calendario';
        cabecalho.innerHTML = `
            <button class="botao-mes" id="mes-anterior">&lt;</button>
            <h3>${nomesMeses[mes]} ${ano}</h3>
            <button class="botao-mes" id="proximo-mes">&gt;</button>
        `;
        fragment.appendChild(cabecalho);

        const diasSemana = document.createElement('div');
        diasSemana.className = 'dias-semana';
        nomesDias.forEach(dia => {
            const divDia = document.createElement('div');
            divDia.textContent = dia;
            diasSemana.appendChild(divDia);
        });
        fragment.appendChild(diasSemana);

        const diasCalendario = document.createElement('div');
        diasCalendario.className = 'dias-calendario';

        // Dias vazios no início
        for (let i = 0; i < primeiroDiaSemana; i++) {
            const divVazio = document.createElement('div');
            divVazio.className = 'dia-calendario outro-mes';
            diasCalendario.appendChild(divVazio);
        }

        // Dias do mês em lote
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        for (let dia = 1; dia <= diasNoMes; dia++) {
            const dataAtual = new Date(ano, mes, dia);
            const divDia = document.createElement('div');
            
            const classeSelecionado = dataAtual.getTime() === estado.dataSelecionada.getTime() ? 'selecionado' : '';
            const classeHoje = dataAtual.getTime() === hoje.getTime() ? 'hoje' : '';
            
            divDia.className = `dia-calendario ${classeSelecionado} ${classeHoje}`;
            divDia.setAttribute('data-dia', dia);
            divDia.textContent = dia;
            
            diasCalendario.appendChild(divDia);
        }

        fragment.appendChild(diasCalendario);
        elementos.calendario.innerHTML = '';
        elementos.calendario.appendChild(fragment);

        // Event listeners otimizados
        configurarEventosCalendario(ano, mes);
    }

    function configurarEventosCalendario(ano, mes) {
        // Event delegation para botões de mês
        const mesAnterior = document.getElementById('mes-anterior');
        const proximoMes = document.getElementById('proximo-mes');
        
        if (mesAnterior) {
            mesAnterior.addEventListener('click', () => {
                console.log('Mês anterior selecionado');
                estado.dataSelecionada.setMonth(estado.dataSelecionada.getMonth() - 1);
                renderizarCalendario();
            });
        }

        if (proximoMes) {
            proximoMes.addEventListener('click', () => {
                console.log('Próximo mês selecionado');
                estado.dataSelecionada.setMonth(estado.dataSelecionada.getMonth() + 1);
                renderizarCalendario();
            });
        }

        // Event delegation para dias
        const diasCalendario = elementos.calendario.querySelector('.dias-calendario');
        if (diasCalendario) {
            diasCalendario.addEventListener('click', function(e) {
                const diaElement = e.target.closest('.dia-calendario[data-dia]');
                if (diaElement) {
                    e.stopPropagation();
                    const diaSelecionado = parseInt(diaElement.getAttribute('data-dia'));
                    console.log(`Dia selecionado: ${diaSelecionado}`);
                    estado.dataSelecionada = new Date(ano, mes, diaSelecionado);
                    atualizarDataSelecionada();
                    elementos.calendario.classList.remove('mostrar');
                }
            });
        }
    }

    function atualizarDataSelecionada() {
        const dia = String(estado.dataSelecionada.getDate()).padStart(2, '0');
        const mes = String(estado.dataSelecionada.getMonth() + 1).padStart(2, '0');
        const ano = estado.dataSelecionada.getFullYear();
        const dataFormatada = `${dia}/${mes}/${ano}`;
        console.log('Data selecionada atualizada:', dataFormatada);
        elementos.dataSelecionada.textContent = dataFormatada;
    }

    // Função para exibir popups otimizada
    function mostrarPopup(mensagem, callback) {
        elementos.popupTexto.textContent = mensagem;
        elementos.popupMensagem.style.display = 'flex';
        
        // Remove listener anterior se existir
        const oldHandler = estado.eventListeners.get('popup-botao');
        if (oldHandler) {
            oldHandler.element.removeEventListener(oldHandler.event, oldHandler.handler);
        }
        
        const handler = function() {
            elementos.popupMensagem.style.display = 'none';
            if (callback) callback();
        };
        
        elementos.popupBotao.addEventListener('click', handler);
        estado.eventListeners.set('popup-botao', { element: elementos.popupBotao, event: 'click', handler });
    }

    // Carregamento otimizado de categorias com chunks
    function carregarCategorias() {
        const seletorCategoria = elementos.opcoesCategoria;
        if (!seletorCategoria) return;
        
        seletorCategoria.innerHTML = '';

        // Processar categorias em chunks para evitar bloqueio da UI
        function processarChunk(startIndex = 0, chunkSize = 5) {
            const endIndex = Math.min(startIndex + chunkSize, categoriasPadrao.length);
            
            for (let i = startIndex; i < endIndex; i++) {
                const categoria = categoriasPadrao[i];
                const opcao = criarOpcaoCategoria(categoria);
                seletorCategoria.appendChild(opcao);
            }
            
            if (endIndex < categoriasPadrao.length) {
                requestIdleCallback(() => processarChunk(endIndex, chunkSize));
            }
        }
        
        processarChunk();
    }

    function criarOpcaoCategoria(categoria) {
        const opcao = document.createElement('div');
        opcao.classList.add('opcao-categoria');
        opcao.setAttribute('data-value', categoria.nome.toLowerCase().replace(/\s+/g, '-'));
        opcao.innerHTML = `
            <span class="material-symbols-outlined">${categoria.icone}</span>
            <span>${categoria.nome}</span>
        `;
        
        if (categoria.nome === 'Adicionar categoria') {
            opcao.style.color = '#21c25e';
            opcao.style.fontWeight = '600';
            opcao.addEventListener('click', function() {
                if (elementos.modalCategoria) {
                    elementos.modalCategoria.style.display = 'flex';
                    elementos.nomeCategoriaInput.value = '';
                    elementos.corCategoriaInput.value = '#21c25e';
                    if (elementos.iconeSelecionadoPreview) {
                        elementos.iconeSelecionadoPreview.innerHTML = '<span class="material-symbols-outlined" style="color:#21c25e;">category</span>';
                    }
                }
                elementos.opcoesCategoria.classList.remove('mostrar');
            });
        } else {
            opcao.addEventListener('click', function() {
                const selecionada = elementos.opcaoSelecionadaCategoria;
                selecionada.innerHTML = `
                    <span class="material-symbols-outlined">${categoria.icone}</span>
                    <span>${categoria.nome}</span>
                `;
                estado.categoriaSelecionada = categoria.nome;
                estado.iconeSelecionado = categoria.icone;
                estado.corCategoriaSelecionada = categoria.cor || '#D32F2F'; // Salvar cor da categoria
                console.log('Categoria selecionada:', {
                    nome: categoria.nome,
                    icone: categoria.icone,
                    cor: categoria.cor || '#D32F2F'
                });
                elementos.opcoesCategoria.classList.remove('mostrar');
            });
        }
        
        return opcao;
    }

    // Carregamento otimizado de carteiras
    function carregarCarteiras() {
        console.log('Carregando carteiras...');
        const opcoesCarteira = elementos.opcoesCarteira;
        if (!opcoesCarteira) return;
        
        opcoesCarteira.innerHTML = '';

        // Verificar se há usuário autenticado no Firebase
        if (typeof firebase !== 'undefined' && firebase.auth) {
            const user = firebase.auth().currentUser;
            if (user) {
                console.log('Usuário autenticado encontrado, buscando cartões no Firebase...');
                buscarCartoesUsuario(user.uid);
                return;
            }
        }

        // Fallback para localStorage se não houver Firebase ou usuário
        let carteiras = [];
        try {
            carteiras = JSON.parse(localStorage.getItem('contasBancarias') || '[]');
            console.log(`Carteiras encontradas no localStorage: ${carteiras.length}`);
        } catch (e) {
            console.error('Erro ao carregar contas do localStorage:', e);
        }

        if (carteiras.length === 0) {
            const opcaoCrear = document.createElement('div');
            opcaoCrear.className = 'opcao-carteira';
            opcaoCrear.id = 'criar-nova-carteira';
            opcaoCrear.innerHTML = `
                <span class="icone-carteira">➕</span>
                <div class="detalhes-carteira">
                    <span class="nome-carteira">Criar nova conta</span>
                </div>
            `;
            opcaoCrear.addEventListener('click', function() {
                console.log('Redirecionando para criar nova conta');
                window.location.href = "../Nova-conta/Nova-conta.html";
            });
            opcoesCarteira.appendChild(opcaoCrear);
        } else {
            // Processar carteiras em chunks
            function processarCarteiras(startIndex = 0, chunkSize = 3) {
                const endIndex = Math.min(startIndex + chunkSize, carteiras.length);
                
                for (let i = startIndex; i < endIndex; i++) {
                    const carteira = carteiras[i];
                    if (carteira?.id) {
                        const opcao = criarOpcaoCarteira(carteira);
                        opcoesCarteira.appendChild(opcao);
                    }
                }
                
                if (endIndex < carteiras.length) {
                    requestIdleCallback(() => processarCarteiras(endIndex, chunkSize));
                }
            }
            
            processarCarteiras();
        }
    }

    function criarOpcaoCarteira(carteira) {
        const nomeCarteira = carteira.nome || carteira.descricao || carteira.banco || carteira.nomeConta || 'Conta sem nome';
        const tipoCarteira = carteira.tipo || carteira.codigoBanco || 'Conta';
        const iconeCarteira = carteira.iconeBanco || '🏦';
        const saldoCarteira = carteira.saldo ? parseFloat(carteira.saldo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '';

        const opcao = document.createElement('div');
        opcao.classList.add('opcao-carteira');
        opcao.setAttribute('data-value', carteira.id);
        opcao.innerHTML = `
            <span class="icone-carteira">${iconeCarteira}</span>
            <div class="detalhes-carteira">
                <span class="nome-carteira">${nomeCarteira}</span>
                <span>${tipoCarteira}</span>
            </div>
            <span class="saldo-carteira">${saldoCarteira}</span>
        `;
        
        opcao.addEventListener('click', function() {
            console.log(`Carteira selecionada: ${nomeCarteira}`);
            estado.carteiraSelecionada = carteira.id;
            elementos.opcaoSelecionadaCarteira.innerHTML = `
                <span class="icone-carteira">${iconeCarteira}</span>
                <span>${nomeCarteira}</span>
            `;
            elementos.opcoesCarteira.classList.remove('mostrar');
        });
        
        return opcao;
    }

    // Funções para modal de categoria otimizadas
    function salvarCategoriaPersonalizada() {
        const nome = elementos.nomeCategoriaInput?.value.trim();
        const cor = elementos.corCategoriaInput?.value;
        
        if (!nome || nome.length < 2) {
            const erroElement = document.getElementById('erro-nome-categoria');
            if (erroElement) erroElement.style.display = 'block';
            elementos.nomeCategoriaInput?.focus();
            return;
        }
        
        const erroElement = document.getElementById('erro-nome-categoria');
        if (erroElement) erroElement.style.display = 'none';

        const iconeSpan = elementos.iconeSelecionadoPreview?.querySelector('.material-symbols-outlined');
        const icone = iconeSpan ? iconeSpan.textContent : 'category';

        // Adiciona nova categoria de forma otimizada
        const opcao = criarOpcaoCategoria({ nome, icone, cor });
        opcao.querySelector('.material-symbols-outlined').style.color = cor;
        
        const addCategoriaOpcao = elementos.opcoesCategoria.querySelector('[data-value="adicionar-categoria"]');
        if (addCategoriaOpcao) {
            elementos.opcoesCategoria.insertBefore(opcao, addCategoriaOpcao);
        } else {
            elementos.opcoesCategoria.appendChild(opcao);
        }

        fecharModalCategoria();
    }

    function fecharModalCategoria() {
        if (elementos.modalCategoria) {
            elementos.modalCategoria.style.display = 'none';
        }
    }

    function atualizarCorPreview() {
        const cor = elementos.corCategoriaInput?.value;
        if (!cor) return;
        
        const iconeSpan = elementos.iconeSelecionadoPreview?.querySelector('.material-symbols-outlined');
        if (iconeSpan) {
            iconeSpan.style.color = cor;
        }
        
        const corPreview = document.getElementById('cor-preview');
        if (corPreview) {
            corPreview.style.backgroundColor = cor;
        }
    }

    // Funções globais otimizadas
    window.gerenciarToggles = function(tipo) {
        const toggleRepetir = document.getElementById('toggle-repetir');
        const toggleDespesaFixa = document.getElementById('toggle-despesa-fixa');
        const camposRepetir = document.getElementById('campos-repetir');

        if (!toggleRepetir || !toggleDespesaFixa || !camposRepetir) return;

        if (tipo === 'repetir') {
            if (toggleRepetir.checked) {
                toggleDespesaFixa.checked = false;
                camposRepetir.style.display = 'block';
            } else {
                camposRepetir.style.display = 'none';
            }
        } else if (tipo === 'fixa') {
            if (toggleDespesaFixa.checked) {
                toggleRepetir.checked = false;
                camposRepetir.style.display = 'none';
            }
        }
    };

    window.alterarQuantidade = function(delta) {
        const inputQuantidade = document.getElementById('quantidade-repeticoes');
        if (!inputQuantidade) return;
        
        const novaQuantidade = Math.max(1, parseInt(inputQuantidade.value || 1, 10) + delta);
        inputQuantidade.value = novaQuantidade;
    };

    // Limpeza de memória ao sair da página
    window.addEventListener('beforeunload', function() {
        // Remove todos os event listeners registrados
        estado.eventListeners.forEach(({ element, event, handler }) => {
            element?.removeEventListener(event, handler);
        });
        estado.eventListeners.clear();
    });

    // Inicializar aplicação
    inicializar();

    // Verificação de autenticação Firebase otimizada
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged(user => {
            const botaoSalvar = elementos.botaoSalvar;
            if (!botaoSalvar) return;
            
            if (user) {
                console.log('Usuário autenticado:', user.uid);
                botaoSalvar.disabled = false;
                botaoSalvar.textContent = 'Salvar Despesa';
                
                // Carregar cartões do usuário autenticado
                buscarCartoesUsuario(user.uid);
            } else {
                console.warn('Nenhum usuário autenticado.');
                botaoSalvar.textContent = 'Faça login para salvar';
                botaoSalvar.style.backgroundColor = '#ccc';
                
                // Fallback para localStorage se não autenticado
                carregarCarteiras();
            }
        });
    } else {
        console.warn('Firebase não disponível, usando dados locais');
        // Se Firebase não estiver disponível, usar localStorage
        carregarCarteiras();
    }
});

// Função otimizada para galeria de ícones com lazy loading
function abrirGaleriaIcones(iconePreview) {
    let modal = document.getElementById('modal-galeria-icones');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-galeria-icones';
        modal.className = 'modal';
        modal.style.display = 'none';
        
        // Criar estrutura básica
        const modalConteudo = document.createElement('div');
        modalConteudo.className = 'modal-conteudo';
        modalConteudo.style.cssText = 'max-width:400px;width:96vw;max-height:80vh;overflow-y:auto;';
        
        const titulo = document.createElement('h3');
        titulo.textContent = 'Escolha um ícone';
        modalConteudo.appendChild(titulo);
        
        const galeria = document.createElement('div');
        galeria.id = 'galeria-icones';
        galeria.className = 'galeria-icones';
        galeria.style.gridTemplateColumns = 'repeat(4, 1fr)';
        modalConteudo.appendChild(galeria);
        
        modal.appendChild(modalConteudo);
        document.body.appendChild(modal);
        
        // Carregar ícones de forma lazy
        carregarIconesLazy(galeria, iconePreview, modal);
    }
    
    modal.style.display = 'flex';
    
    // Event listener para fechar modal
    modal.onclick = function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// Carregamento lazy dos ícones
function carregarIconesLazy(galeria, iconePreview, modal) {
    const icones = [
        'paid', 'attach_money', 'currency_exchange', 'wallet', 'savings', 'atm',
        'account_balance', 'credit_card', 'account_balance_wallet', 'receipt_long',
        'request_quote', 'payment', 'cancel', 'balance', 'history', 'trending_up',
        'trending_down', 'pie_chart', 'bar_chart', 'bar_chart_4_bars', 'query_stats',
        'percent', 'account_tree', 'monetization_on', 'money_off', 'universal_currency_alt',
        'currency_bitcoin', 'receipt', 'add_card', 'payments', 'price_check',
        'redeem', 'trending_flat', 'euro_symbol', 'currency_franc', 'currency_pound',
        'currency_ruble', 'currency_yen', 'donut_large', 'donut_small', 'dataset'
    ];
    
    // Carregar ícones em chunks
    function carregarChunk(startIndex = 0, chunkSize = 8) {
        const endIndex = Math.min(startIndex + chunkSize, icones.length);
        const fragment = document.createDocumentFragment();
        
        for (let i = startIndex; i < endIndex; i++) {
            const icone = icones[i];
            const item = document.createElement('div');
            item.className = 'icone-item';
            item.innerHTML = `<span class="material-symbols-outlined">${icone}</span>`;
            
            item.onclick = function() {
                iconePreview.innerHTML = `<span class="material-symbols-outlined" style="color: #21c25e;">${icone}</span>`;
                modal.style.display = 'none';
            };
            
            fragment.appendChild(item);
        }
        
        galeria.appendChild(fragment);
        
        if (endIndex < icones.length) {
            requestIdleCallback(() => carregarChunk(endIndex, chunkSize));
        }
    }
    
    carregarChunk();
}

// Função para popular os cartões no seletor com SVG do banco dentro de um círculo
function carregarCartoesNoSeletor(cartoes) {
    console.log('Carregando cartões no seletor...', cartoes);
    const opcoesCarteira = elementos.opcoesCarteira;
    const opcaoSelecionada = elementos.opcaoSelecionadaCarteira;
    
    if (!opcoesCarteira || !opcaoSelecionada) {
        console.error('Elementos do seletor de carteira não encontrados');
        return;
    }
    
    opcoesCarteira.innerHTML = '';
    
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
    
    cartoes.forEach(cartao => {
        // Determinar o ícone do banco do cartão
        let iconeUrl = cartao.icone;
        if (!iconeUrl && cartao.banco && bancosIcones[cartao.banco]) {
            iconeUrl = bancosIcones[cartao.banco];
        }
        if (!iconeUrl) {
            iconeUrl = '../Icon/credit-card.svg'; // Ícone padrão para cartão
        }
        
        const corFundo = cartao.cor || '#2196F3';
        const nomeCartao = cartao.nome || cartao.apelido || 'Cartão';
        const bancoCartao = cartao.banco || 'Cartão de Crédito';

        const div = document.createElement('div');
        div.className = 'opcao-carteira';
        div.setAttribute('data-id', cartao.id);
        div.setAttribute('data-icone', iconeUrl);
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
                <img src="${iconeUrl}" alt="${cartao.banco || 'Banco'}" style="width:22px;height:22px;object-fit:contain;">
            </span>
            <div class="detalhes-carteira">
                <span class="nome-carteira">${nomeCartao}</span>
                <span>${bancoCartao}</span>
            </div>
        `;
        
        div.addEventListener('click', function() {
            console.log(`Cartão selecionado: ${nomeCartao} (${cartao.id})`);
            estado.carteiraSelecionada = cartao.id;
            
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
                    <img src="${iconeUrl}" alt="${cartao.banco || 'Banco'}" style="width:22px;height:22px;object-fit:contain;">
                </span>
                <span>${nomeCartao}</span>
            `;
            opcoesCarteira.classList.remove('mostrar');
        });
        opcoesCarteira.appendChild(div);
    });
    
    // Adicionar opção para criar novo cartão
    const opcaoCrear = document.createElement('div');
    opcaoCrear.className = 'opcao-carteira';
    opcaoCrear.id = 'criar-nova-carteira';
    opcaoCrear.innerHTML = `
        <span class="icone-carteira">➕</span>
        <div class="detalhes-carteira">
            <span class="nome-carteira">Criar novo cartão</span>
        </div>
    `;
    opcaoCrear.addEventListener('click', function() {
        console.log('Redirecionando para criar novo cartão');
        window.location.href = "../Novo Cartão/Novo Cartão.html";
    });
    opcoesCarteira.appendChild(opcaoCrear);
}

// Função para buscar cartões do usuário:
function buscarCartoesUsuario(uid) {
    console.log('Buscando cartões do usuário no Firebase...', uid);
    firebase.firestore().collection('cartoes')
        .where('userId', '==', uid)
        .get()
        .then(snapshot => {
            const cartoes = [];
            snapshot.forEach(doc => {
                cartoes.push({ id: doc.id, ...doc.data() });
            });
            console.log(`Cartões encontrados no Firebase: ${cartoes.length}`, cartoes);
            
            if (cartoes.length === 0) {
                // Se não há cartões, mostrar opção para criar
                mostrarOpcaoCriarCartao();
            } else {
                carregarCartoesNoSeletor(cartoes);
            }
        })
        .catch(error => {
            console.error('Erro ao buscar cartões no Firebase:', error);
            // Fallback para criar cartão em caso de erro
            mostrarOpcaoCriarCartao();
        });
}

function mostrarOpcaoCriarCartao() {
    const opcoesCarteira = elementos.opcoesCarteira;
    if (!opcoesCarteira) {
        console.error('Elemento opcoesCarteira não encontrado');
        return;
    }
    
    opcoesCarteira.innerHTML = '';
    const opcaoCrear = document.createElement('div');
    opcaoCrear.className = 'opcao-carteira';
    opcaoCrear.id = 'criar-nova-carteira';
    opcaoCrear.innerHTML = `
        <span class="icone-carteira">➕</span>
        <div class="detalhes-carteira">
            <span class="nome-carteira">Criar nova conta</span>
            <span>Você ainda não tem contas cadastradas</span>
        </div>
    `;
    opcaoCrear.addEventListener('click', function() {
        console.log('Redirecionando para criar nova conta');
        window.location.href = "../Nova-conta/Nova-conta.html";
    });
    opcoesCarteira.appendChild(opcaoCrear);
}

// === FUNÇÕES DO MODAL DE REPETIÇÃO ===
let quantidadeRepetir = 1;
let periodoRepetir = 'meses';
let periodoTextoRepetir = 'Mensal';

function abrirModalRepetir() {
    const modal = document.getElementById('modal-repetir');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('quantidade-repeticoes-modal').value = quantidadeRepetir;
        document.getElementById('periodo-texto').textContent = periodoTextoRepetir;
    }
}

function fecharModalRepetir() {
    const modal = document.getElementById('modal-repetir');
    if (modal) {
        modal.style.display = 'none';
        const dropdown = document.getElementById('periodo-dropdown');
        if (dropdown) dropdown.style.display = 'none';
    }
}

function alterarQuantidadeModal(delta) {
    const input = document.getElementById('quantidade-repeticoes-modal');
    let valor = parseInt(input.value) || 1;
    valor += delta;
    if (valor < 1) valor = 1;
    input.value = valor;
    quantidadeRepetir = valor;
}

function togglePeriodoDropdown() {
    const dropdown = document.getElementById('periodo-dropdown');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
}

function selecionarPeriodo(texto, valor) {
    periodoTextoRepetir = texto;
    periodoRepetir = valor;
    document.getElementById('periodo-texto').textContent = texto;
    document.getElementById('periodo-dropdown').style.display = 'none';
}

function confirmarRepetir() {
    document.getElementById('quantidade-repeticoes').value = quantidadeRepetir;
    document.getElementById('frequencia-repeticoes').value = periodoRepetir;
    
    const textoRepeticoes = document.getElementById('texto-repeticoes');
    if (textoRepeticoes) {
        if (quantidadeRepetir > 1) {
            textoRepeticoes.textContent = `${quantidadeRepetir}x - ${periodoTextoRepetir}`;
            
            // Desativar despesa fixa se repetir estiver ativo
            const toggleDespesaFixa = document.getElementById('toggle-despesa-fixa');
            if (toggleDespesaFixa) {
                toggleDespesaFixa.checked = false;
            }
        } else {
            textoRepeticoes.textContent = '';
        }
    }
    
    console.log(`Repetição configurada: ${quantidadeRepetir}x ${periodoTextoRepetir}`);
    
    fecharModalRepetir();
}

// Event listener para fechar modal ao clicar fora
document.addEventListener('DOMContentLoaded', function() {
    const modalOverlay = document.getElementById('modal-repetir');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                fecharModalRepetir();
            }
        });
    }
});


// Função para carregar cartões
function carregarCartoes() {
    const seletorCartao = document.getElementById('seletor-cartao');
    const opcoesCartao = seletorCartao.querySelector('.opcoes-cartao');

    if (!opcoesCartao) return;

    opcoesCartao.innerHTML = '';

    const cartoes = [
        { id: '1', nome: 'Cartão Visa', bandeira: 'visa' },
        { id: '2', nome: 'Cartão MasterCard', bandeira: 'mastercard' },
        { id: '3', nome: 'Cartão Elo', bandeira: 'elo' }
    ];

    cartoes.forEach(cartao => {
        const opcao = document.createElement('div');
        opcao.className = 'opcao-cartao';
        opcao.setAttribute('data-id', cartao.id);
        opcao.innerHTML = `
            <span class="material-icons">credit_card</span>
            <span>${cartao.nome}</span>
        `;

        opcao.addEventListener('click', function() {
            const opcaoSelecionada = seletorCartao.querySelector('.opcao-selecionada');
            opcaoSelecionada.innerHTML = `
                <span class="material-icons">credit_card</span>
                <span>${cartao.nome}</span>
            `;
            opcoesCartao.classList.remove('mostrar');
        });

        opcoesCartao.appendChild(opcao);
    });

    seletorCartao.querySelector('.opcao-selecionada').addEventListener('click', function() {
        opcoesCartao.classList.toggle('mostrar');
    });

}