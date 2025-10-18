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
        valorReceita: document.getElementById('valor-receita'),
        checkboxRecebido: document.getElementById('recebido'),
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
        iconeSelecionado: 'paid',
        corCategoriaSelecionada: null, // Adicionar cor da categoria
        eventListeners: new Map() // Cache para event listeners
    };

    // Categorias padrão com lazy loading
    const categoriasPadrao = [
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

        // Salvar receita
        addEventListenerOnce(elementos.botaoSalvar, 'click', salvarReceita, 'botao-salvar');

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

        // Toggle de repetição (se existir)
        if (elementos.toggleRepetir) {
            addEventListenerOnce(elementos.toggleRepetir, 'change', function() {
                console.log('Toggle de repetição alterado:', this.checked);
                elementos.camposRepetir.style.display = this.checked ? 'block' : 'none';
            }, 'toggle-repetir');
        }

        // Configurar eventos de categoria personalizada
        configurarEventosCategoriaPersonalizada();
    }

    // Função otimizada para configurar eventos de categoria personalizada
    function configurarEventosCategoriaPersonalizada() {
        const selectCategoria = document.getElementById('categoria-receita');
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

    // Função de salvar receita consolidada e otimizada
    function salvarReceita() {
        console.log('Iniciando processo de salvar receita...');
        
        // Validação com early return
        const validacoes = [
            { condicao: elementos.valorReceita.textContent === 'R$ 0,00', mensagem: 'Por favor, insira um valor para a receita.' },
            { condicao: !elementos.inputDescricao.value.trim(), mensagem: 'Por favor, insira uma descrição para a receita.' },
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
        const repetir = elementos.toggleRepetir?.checked || false;
        const receitaFixa = document.getElementById('toggle-receita-fixa')?.checked || false;
        
        // IMPORTANTE: campo 'carteira' armazena somente o ID da conta para permitir agregação rápida na Home
        const novaReceita = {
            valor: elementos.valorReceita.textContent,
            recebido: elementos.checkboxRecebido.checked,
            data: elementos.dataSelecionada.textContent,
            descricao: elementos.inputDescricao.value.trim(),
            categoria: estado.categoriaSelecionada,
            iconeCategoria: estado.iconeSelecionado, // Adicionar ícone da categoria
            corCategoria: estado.corCategoriaSelecionada || '#21C25E', // Adicionar cor da categoria
            carteira: estado.carteiraSelecionada,
            anexo: elementos.inputAnexo.files.length > 0 ? elementos.inputAnexo.files[0].name : null,
            repetir: repetir,
            quantidadeRepeticoes: repetir ? document.getElementById('quantidade-repeticoes')?.value : null,
            frequenciaRepeticoes: repetir ? document.getElementById('frequencia-repeticoes')?.value : null,
            receitaFixa: receitaFixa,
            timestamp: Date.now()
        };

        console.log('📝 Nova receita com ícone e cor:', {
            categoria: novaReceita.categoria,
            iconeCategoria: novaReceita.iconeCategoria,
            corCategoria: novaReceita.corCategoria
        });

    // Preparando persistência da nova receita (log detalhado removido)

        // Salvar em lote para melhor performance
        Promise.all([
            salvarLocalStorage(novaReceita),
            salvarFirestore(novaReceita)
        ]).then(() => {
            // Gerar receitas futuras se for fixa ou repetida
            return gerarReceitasFuturas(novaReceita);
        }).then(() => {
            const mensagem = (novaReceita.receitaFixa || novaReceita.repetir) 
                ? 'Receita salva com sucesso! Receitas futuras foram geradas automaticamente.'
                : 'Receita salva com sucesso!';
            
            // Criar notificação se a função estiver disponível
            console.log('🔔 Verificando sistema de notificações...');
            console.log('🔔 window.criarNotificacaoNovaReceita existe?', typeof window.criarNotificacaoNovaReceita);
            console.log('🔔 Dados da receita para notificação:', novaReceita);
            
            if (typeof window.criarNotificacaoNovaReceita === 'function') {
                console.log('✅ Chamando criarNotificacaoNovaReceita...');
                window.criarNotificacaoNovaReceita(novaReceita).then(() => {
                    console.log('✅ Notificação criada com sucesso!');
                }).catch(err => {
                    console.error('❌ Erro ao criar notificação:', err);
                });
            } else {
                console.warn('⚠️ Função criarNotificacaoNovaReceita não está disponível');
            }
            
            mostrarPopup(mensagem, () => {
                limparFormulario();
                window.location.href = "../Lista-de-despesas/Lista-de-despesas.html";
            });
        }).catch(error => {
            console.error('Erro ao salvar:', error);
            mostrarPopup('Ocorreu um erro ao salvar a receita.');
        });
    }

    // Função otimizada para salvar no localStorage
    function salvarLocalStorage(receita) {
        return new Promise((resolve) => {
            try {
                let receitas = JSON.parse(localStorage.getItem('receitas') || '[]');
                receitas.push(receita);
                localStorage.setItem('receitas', JSON.stringify(receitas));
                console.log('Receita salva no localStorage');
                resolve();
            } catch (e) {
                console.error('Erro ao salvar no localStorage:', e);
                resolve(); // Não falha se localStorage der erro
            }
        });
    }

    // Função otimizada para salvar no Firestore
    function salvarFirestore(receita) {
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

            const receitaFirestore = { ...receita, userId: user.uid };
            firebase.firestore().collection('receitas').add(receitaFirestore)
                .then((docRef) => {
                    console.log('Receita salva no Firestore!');
                    
                    // Criar notificação de nova receita
                    const receitaComId = { ...receitaFirestore, id: docRef.id };
                    if (typeof window.criarNotificacaoNovaReceita === 'function') {
                        window.criarNotificacaoNovaReceita(receitaComId).catch(err => {
                            console.error('Erro ao criar notificação de receita:', err);
                        });
                    }
                    
                    resolve();
                })
                .catch(reject);
        });
    }

    // Função para gerar receitas futuras automaticamente
    function gerarReceitasFuturas(receitaBase) {
        return new Promise((resolve, reject) => {
            try {
                // Verificar se é receita fixa ou repetida
                if (!receitaBase.receitaFixa && !receitaBase.repetir) {
                    resolve(); // Não é fixa nem repetida
                    return;
                }

                const receitasFuturas = [];
                const dataBase = new Date(converterDataParaISO(receitaBase.data));
                
                // Determinar quantidade de meses para gerar
                let mesesParaGerar = 12; // Padrão: 12 meses para receitas fixas
                
                if (receitaBase.repetir && receitaBase.quantidadeRepeticoes) {
                    const quantidade = parseInt(receitaBase.quantidadeRepeticoes);
                    const frequencia = receitaBase.frequenciaRepeticoes || 'mensal';
                    
                    if (frequencia === 'mensal') {
                        mesesParaGerar = quantidade;
                    } else if (frequencia === 'anual') {
                        mesesParaGerar = quantidade * 12;
                    }
                }

                console.log(`Gerando ${mesesParaGerar} receitas futuras...`);

                // Gerar receitas para os próximos meses
                for (let i = 1; i <= mesesParaGerar; i++) {
                    const novaData = new Date(dataBase);
                    novaData.setMonth(dataBase.getMonth() + i);
                    
                    // Ajustar para o último dia do mês se necessário
                    if (novaData.getDate() !== dataBase.getDate()) {
                        novaData.setDate(0); // Vai para o último dia do mês anterior
                        novaData.setMonth(novaData.getMonth() + 1);
                    }

                    // Adicionar numeração sequencial à descrição
                    const numeroSequencial = String(i).padStart(2, '0');
                    const descricaoComNumero = `${receitaBase.descricao} ${numeroSequencial}`;

                    const receitaFutura = {
                        ...receitaBase,
                        data: formatarDataParaExibicao(novaData),
                        descricao: descricaoComNumero, // Descrição com numeração
                        recebido: false, // Receitas futuras sempre começam como não recebidas
                        timestamp: Date.now() + i, // Timestamp único
                        origem: 'automatica', // Marcar como gerada automaticamente
                        receitaOrigem: receitaBase.timestamp // Referência à receita original
                    };

                    receitasFuturas.push(receitaFutura);
                }

                // Salvar todas as receitas futuras
                const promessas = receitasFuturas.map(receita => {
                    return Promise.all([
                        salvarReceitaFuturaLocalStorage(receita),
                        salvarReceitaFuturaFirestore(receita)
                    ]);
                });

                Promise.all(promessas)
                    .then(() => {
                        // Quantidade de receitas futuras criadas
                        resolve();
                    })
                    .catch(reject);

            } catch (error) {
                console.error('Erro ao gerar receitas futuras:', error);
                reject(error);
            }
        });
    }

    // Função auxiliar para salvar receita futura no localStorage
    function salvarReceitaFuturaLocalStorage(receita) {
        return new Promise((resolve) => {
            try {
                let receitas = JSON.parse(localStorage.getItem('receitas') || '[]');
                
                // Para receitas automáticas (com numeração), sempre salvar
                // Verificar duplicata só para receitas manuais
                if (receita.origem === 'automatica') {
                    receitas.push(receita);
                    localStorage.setItem('receitas', JSON.stringify(receitas));
                } else {
                    // Verificar se já existe receita para este mês (só para receitas manuais)
                    const mesAno = receita.data.substring(3); // MM/AAAA
                    const existeReceita = receitas.some(r => 
                        r.data.substring(3) === mesAno && 
                        r.descricao === receita.descricao &&
                        r.categoria === receita.categoria
                    );

                    if (!existeReceita) {
                        receitas.push(receita);
                        localStorage.setItem('receitas', JSON.stringify(receitas));
                    }
                }
                
                resolve();
            } catch (e) {
                console.error('Erro ao salvar receita futura no localStorage:', e);
                resolve(); // Não falha se localStorage der erro
            }
        });
    }

    // Função auxiliar para salvar receita futura no Firestore
    function salvarReceitaFuturaFirestore(receita) {
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

            // Verificar se já existe receita para este mês no Firestore
            const mesAno = receita.data.substring(3); // MM/AAAA
            
            firebase.firestore().collection('receitas')
                .where('userId', '==', user.uid)
                .where('categoria', '==', receita.categoria)
                .get()
                .then(snapshot => {
                    // Para receitas automáticas (com numeração), sempre salvar
                    if (receita.origem === 'automatica') {
                        const receitaFirestore = { ...receita, userId: user.uid };
                        return firebase.firestore().collection('receitas').add(receitaFirestore);
                    }
                    
                    // Para receitas manuais, verificar duplicata
                    const mesAno = receita.data.substring(3); // MM/AAAA
                    const existeReceita = snapshot.docs.some(doc => {
                        const data = doc.data().data;
                        const docDescricao = doc.data().descricao || '';
                        return data && data.substring(3) === mesAno && docDescricao === receita.descricao;
                    });

                    if (!existeReceita) {
                        const receitaFirestore = { ...receita, userId: user.uid };
                        return firebase.firestore().collection('receitas').add(receitaFirestore);
                    } else {
                        return Promise.resolve();
                    }
                })
                .then(() => {
                    // Receita futura salva no Firestore
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

    // Função otimizada para limpar formulário
    function limparFormulario() {
        elementos.valorReceita.textContent = 'R$ 0,00';
        elementos.checkboxRecebido.checked = true;
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
        const valorTexto = elementos.valorReceita.textContent.replace('R$ ', '').replace(/\./g, '').replace(',', '.');
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
        elementos.valorReceita.textContent = `R$ ${valorFormatado}`;
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
        
    // Atualizando valor em edição
        elementos.calculadoraDisplay.value = formatarValor(estado.valorAtual);
    }

    function apagarInput() {
        if (estado.valorAtual.length > 1) {
            estado.valorAtual = estado.valorAtual.slice(0, -1);
        } else {
            estado.valorAtual = '0';
            estado.digitandoValor = false;
        }
    // Backspace no valor atual
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
                estado.corCategoriaSelecionada = categoria.cor || '#21C25E'; // Salvar cor da categoria
                console.log('Categoria selecionada:', {
                    nome: categoria.nome,
                    icone: categoria.icone,
                    cor: categoria.cor || '#21C25E'
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
                console.log('Usuário autenticado encontrado, buscando contas no Firebase...');
                buscarContasUsuario(user.uid);
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
                botaoSalvar.textContent = 'Salvar Receita';
                
                // Carregar contas do usuário autenticado
                buscarContasUsuario(user.uid);
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

// Função para popular as contas no seletor com SVG do banco dentro de um círculo
function carregarContasNoSeletor(contas) {
    console.log('Carregando contas no seletor...', contas);
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
    
    contas.forEach(conta => {
        // Determinar o ícone a usar
        let iconeUrl = conta.icone;
        if (!iconeUrl && conta.banco && bancosIcones[conta.banco]) {
            iconeUrl = bancosIcones[conta.banco];
        }
        if (!iconeUrl) {
            iconeUrl = '../Icon/conta-corrente-banco.svg'; // Ícone padrão
        }
        
        const corFundo = conta.cor || '#e8f5ee';
        const nomeConta = conta.nome || conta.descricao || conta.banco || 'Conta';
        const tipoConta = conta.tipo || 'Conta bancária';

        const div = document.createElement('div');
        div.className = 'opcao-carteira';
        div.setAttribute('data-id', conta.id);
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
                <img src="${iconeUrl}" alt="${conta.banco || 'Banco'}" style="width:22px;height:22px;object-fit:contain;">
            </span>
            <div class="detalhes-carteira">
                <span class="nome-carteira">${nomeConta}</span>
                <span>${tipoConta}</span>
            </div>
        `;
        
        div.addEventListener('click', function() {
            console.log(`Conta selecionada: ${nomeConta} (${conta.id})`);
            estado.carteiraSelecionada = conta.id;
            
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
                    <img src="${iconeUrl}" alt="${conta.banco || 'Banco'}" style="width:22px;height:22px;object-fit:contain;">
                </span>
                <span>${nomeConta}</span>
            `;
            opcoesCarteira.classList.remove('mostrar');
        });
        opcoesCarteira.appendChild(div);
    });
    
    // Adicionar opção para criar nova conta
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
}

// Exemplo de uso após autenticação do usuário:
function buscarContasUsuario(uid) {
    console.log('Buscando contas do usuário no Firebase...', uid);
    firebase.firestore().collection('contas')
        .where('userId', '==', uid)
        .get()
        .then(snapshot => {
            const contas = [];
            snapshot.forEach(doc => {
                contas.push({ id: doc.id, ...doc.data() });
            });
            console.log(`Contas encontradas no Firebase: ${contas.length}`, contas);
            
            if (contas.length === 0) {
                // Se não há contas, mostrar opção para criar
                mostrarOpcaoCriarConta();
            } else {
                carregarContasNoSeletor(contas);
            }
        })
        .catch(error => {
            console.error('Erro ao buscar contas no Firebase:', error);
            // Fallback para criar conta em caso de erro
            mostrarOpcaoCriarConta();
        });
}

function mostrarOpcaoCriarConta() {
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

// === CONTROLE DO MODAL DE REPETIÇÃO ===
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
    }
    const dropdown = document.getElementById('periodo-dropdown');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
}

function alterarQuantidadeModal(delta) {
    quantidadeRepetir = Math.max(1, quantidadeRepetir + delta);
    document.getElementById('quantidade-repeticoes-modal').value = quantidadeRepetir;
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
    togglePeriodoDropdown();
}

function confirmarRepetir() {
    document.getElementById('quantidade-repeticoes').value = quantidadeRepetir;
    document.getElementById('frequencia-repeticoes').value = periodoRepetir;
    
    const textoRepeticoes = document.getElementById('texto-repeticoes');
    if (textoRepeticoes) {
        if (quantidadeRepetir > 1) {
            textoRepeticoes.textContent = `${quantidadeRepetir}x - ${periodoTextoRepetir}`;
        } else {
            textoRepeticoes.textContent = '';
        }
    }
    
    fecharModalRepetir();
}

// Event listener para fechar modal ao clicar fora
document.addEventListener('click', function(e) {
    const modal = document.getElementById('modal-repetir');
    if (modal && e.target === modal) {
        fecharModalRepetir();
    }
});