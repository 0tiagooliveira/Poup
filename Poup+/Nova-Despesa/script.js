document.addEventListener('DOMContentLoaded', function () {
    console.log('DOM carregado - Iniciando aplicação...');

    // Elementos do DOM
    const elementos = {
        botaoVoltar: document.querySelector('.botao-voltar'),
        secaoValor: document.getElementById('secao-valor'),
        valorDespesa: document.getElementById('valor-despesa') ||
            document.getElementById('valordespesa') ||
            document.querySelector('#secao-valor .valor-display') ||
            document.querySelector('.valor-despesa') ||
            document.querySelector('.valor-display') ||
            document.querySelector('[data-valor]') ||
            document.querySelector('#secao-valor span') ||
            document.querySelector('#secao-valor div'),
        checkboxPago: document.getElementById('pago') || document.getElementById('recebido'),
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

    // Estado da aplicação
    const estado = {
        valorAtual: '0',
        digitandoValor: false,
        dataSelecionada: new Date(),
        categoriaSelecionada: null,
        carteiraSelecionada: null,
        iconeSelecionado: 'paid'
    };

    // Adicionar função de debug para identificar elementos
    function debugElementos() {
        console.log('=== DEBUG ELEMENTOS ===');
        console.log('secaoValor:', elementos.secaoValor);
        console.log('valorDespesa:', elementos.valorDespesa);
        if (elementos.secaoValor) {
            console.log('Conteúdo da seção valor:', elementos.secaoValor.innerHTML);
            console.log('Elementos filhos:', elementos.secaoValor.children);

            // Verificar se há elementos duplicados
            const valoresExistentes = elementos.secaoValor.querySelectorAll('[id*="valor"], .valor-display, span, div');
            console.log('Elementos de valor encontrados:', valoresExistentes.length);
            valoresExistentes.forEach((el, i) => {
                console.log(`Elemento ${i}:`, el.tagName, el.id, el.className, el.textContent);
            });
        }
        console.log('Todos os elementos com "valor":', document.querySelectorAll('[id*="valor"], [class*="valor"]'));
        console.log('=======================');
    }

    // Inicialização
    function inicializar() {
        console.log('Inicializando aplicação...');
        debugElementos(); // Debug para identificar elementos
        limparValoresDuplicados(); // Limpar duplicatas
        configurarEventos();
        atualizarDataSelecionada();
        carregarCarteiras();
        carregarCategorias();
        console.log('Aplicação inicializada com sucesso');
    }

    // Configurar eventos
    function configurarEventos() {
        console.log('Configurando eventos...');

        // Botão voltar
        elementos.botaoVoltar.addEventListener('click', function () {
            console.log('Botão voltar clicado');
            window.history.back();
        });

        // Calculadora
        elementos.secaoValor.addEventListener('click', abrirCalculadora);
        elementos.calculadoraContainer.addEventListener('click', function (e) {
            if (e.target === elementos.calculadoraContainer) {
                console.log('Clicou fora da calculadora - fechando');
                fecharCalculadora();
            }
        });

        elementos.calculadoraBotoes.addEventListener('click', function (e) {
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
        });

        elementos.botaoApagar.addEventListener('click', apagarInput);
        elementos.btnCancelarCalculadora.addEventListener('click', cancelarCalculadora);
        elementos.btnConfirmarCalculadora.addEventListener('click', confirmarCalculadora);

        // Calendário
        elementos.campoData.addEventListener('click', function (e) {
            e.stopPropagation();
            console.log('Abrindo calendário');
            elementos.calendario.classList.add('mostrar');
        });

        renderizarCalendario();

        document.addEventListener('click', function (e) {
            if (!elementos.calendario.contains(e.target) && e.target !== elementos.campoData) {
                elementos.calendario.classList.remove('mostrar');
            }
        });

        // Categorias
        elementos.opcaoSelecionadaCategoria.addEventListener('click', function (e) {
            e.stopPropagation();
            console.log('Abrindo seletor de categorias');
            elementos.opcoesCategoria.classList.toggle('mostrar');
        });

        document.addEventListener('click', function (e) {
            if (!elementos.seletorCategoria.contains(e.target)) {
                elementos.opcoesCategoria.classList.remove('mostrar');
            }
        });

        // Carteiras
        elementos.opcaoSelecionadaCarteira.addEventListener('click', function (e) {
            e.stopPropagation();
            console.log('Abrindo seletor de carteiras');
            elementos.opcoesCarteira.classList.toggle('mostrar');
        });

        // Anexo
        elementos.botaoAnexo.addEventListener('click', function () {
            console.log('Abrindo seletor de arquivos');
            elementos.inputAnexo.click();
        });

        elementos.inputAnexo.addEventListener('change', function () {
            if (this.files && this.files[0]) {
                console.log('Arquivo selecionado:', this.files[0].name);
                elementos.nomeArquivo.textContent = this.files[0].name;
            }
        });

        // Salvar despesa
        elementos.botaoSalvar.addEventListener('click', salvarDespesa);

        // Modal de categoria
        elementos.salvarCategoriaBtn.addEventListener('click', salvarCategoriaPersonalizada);
        elementos.cancelarCategoriaBtn.addEventListener('click', fecharModalCategoria);
        elementos.corCategoriaInput.addEventListener('input', atualizarCorPreview);

        // Toggle de repetição
        elementos.toggleRepetir.addEventListener('change', function () {
            console.log('Toggle de repetição alterado:', this.checked);
            elementos.camposRepetir.style.display = this.checked ? 'block' : 'none';
        });

        // Ícone selecionado - abrir galeria
        const iconePreview = document.getElementById('icone-selecionado-preview');
        if (iconePreview) {
            iconePreview.addEventListener('click', function () {
                abrirGaleriaIcones(iconePreview);
            });
        }
    }

    // Funções da calculadora
    function abrirCalculadora() {
        console.log('Abrindo calculadora...');

        // Procurar elemento de valor dinamicamente se não foi encontrado
        if (!elementos.valorDespesa) {
            console.log('Tentando encontrar elemento de valor dinamicamente...');
            elementos.valorDespesa = document.getElementById('valor-despesa') ||
                document.getElementById('valordespesa') ||
                document.querySelector('#secao-valor .valor-display') ||
                document.querySelector('.valor-despesa') ||
                document.querySelector('.valor-display') ||
                document.querySelector('[data-valor]') ||
                document.querySelector('#secao-valor h2') ||
                document.querySelector('#secao-valor span');
        }

        if (!elementos.valorDespesa) {
            console.error('Elemento valor-despesa não encontrado');
            console.log('Elementos disponíveis na seção valor:');
            if (elementos.secaoValor) {
                console.log(elementos.secaoValor.innerHTML);

                // Recriar a estrutura HTML correta da seção valor
                elementos.secaoValor.innerHTML = `
                    <p>Valor da Despesa</p>
                    <h2 id="valor-despesa">R$ 0,00</h2>
                `;

                // Buscar o elemento h2 recém-criado
                elementos.valorDespesa = elementos.secaoValor.querySelector('h2');
                console.log('Elemento valor-despesa criado dinamicamente com estrutura HTML correta');
            } else {
                console.error('Seção valor também não encontrada');
                return;
            }
        }

        elementos.calculadoraContainer.style.display = 'block';
        const valorTexto = elementos.valorDespesa.textContent || 'R$ 0,00';
        estado.valorAtual = valorTexto.replace('R$ ', '').replace(/\./g, '').replace(',', '.');

        if (elementos.calculadoraDisplay) {
            elementos.calculadoraDisplay.value = formatarValor(estado.valorAtual);
        }
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
        // Verificar novamente se o elemento existe
        if (!elementos.valorDespesa) {
            elementos.valorDespesa = document.getElementById('valor-despesa') ||
                document.getElementById('valordespesa') ||
                document.querySelector('#secao-valor .valor-display') ||
                document.querySelector('.valor-despesa') ||
                document.querySelector('.valor-display') ||
                document.querySelector('[data-valor]') ||
                document.querySelector('#secao-valor span') ||
                document.querySelector('#secao-valor div');
        }

        if (!elementos.valorDespesa) {
            console.error('Elemento valor-despesa não encontrado para confirmação');
            return;
        }

        const valorFormatado = formatarMoeda(estado.valorAtual);
        console.log('Valor confirmado na calculadora:', valorFormatado);

        // Limpar qualquer valor duplicado antes de definir o novo
        const valoresExistentes = elementos.secaoValor.querySelectorAll('[id*="valor"], .valor-display, span, div');
        valoresExistentes.forEach((elemento, index) => {
            if (index > 0 && elemento.textContent.includes('R$')) {
                elemento.remove();
            }
        });

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
                console.log('Limite de casas decimais atingido');
                return;
            }
            estado.valorAtual += numero;
        }

        console.log('Valor atual:', estado.valorAtual);
        elementos.calculadoraDisplay.value = formatarValor(estado.valorAtual);
    }

    function apagarInput() {
        if (estado.valorAtual.length > 1) {
            estado.valorAtual = estado.valorAtual.slice(0, -1);
        } else {
            estado.valorAtual = '0';
            estado.digitandoValor = false;
        }
        console.log('Apagando valor - novo valor:', estado.valorAtual);
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

    // Funções do calendário
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

        let html = `
            <div class="cabecalho-calendario">
                <button class="botao-mes" id="mes-anterior">&lt;</button>
                <h3>${nomesMeses[mes]} ${ano}</h3>
                <button class="botao-mes" id="proximo-mes">&gt;</button>
            </div>
            <div class="dias-semana">
        `;

        for (let dia of nomesDias) {
            html += `<div>${dia}</div>`;
        }

        html += `</div><div class="dias-calendario">`;

        // Dias vazios no início
        for (let i = 0; i < primeiroDiaSemana; i++) {
            html += `<div class="dia-calendario outro-mes"></div>`;
        }

        // Dias do mês
        for (let dia = 1; dia <= diasNoMes; dia++) {
            const dataAtual = new Date(ano, mes, dia);
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);

            const classeSelecionado = dataAtual.getTime() === estado.dataSelecionada.getTime() ? 'selecionado' : '';
            const classeHoje = dataAtual.getTime() === hoje.getTime() ? 'hoje' : '';

            html += `<div class="dia-calendario ${classeSelecionado} ${classeHoje}" data-dia="${dia}">${dia}</div>`;
        }

        html += `</div>`;
        elementos.calendario.innerHTML = html;

        // Eventos para os botões de mês
        document.getElementById('mes-anterior').addEventListener('click', () => {
            console.log('Mês anterior selecionado');
            estado.dataSelecionada.setMonth(estado.dataSelecionada.getMonth() - 1);
            renderizarCalendario();
        });

        document.getElementById('proximo-mes').addEventListener('click', () => {
            console.log('Próximo mês selecionado');
            estado.dataSelecionada.setMonth(estado.dataSelecionada.getMonth() + 1);
            renderizarCalendario();
        });

        // Eventos para os dias
        document.querySelectorAll('.dias-calendario .dia-calendario[data-dia]').forEach(dia => {
            dia.addEventListener('click', function (e) {
                e.stopPropagation();
                const diaSelecionado = parseInt(this.getAttribute('data-dia'));
                console.log(`Dia selecionado: ${diaSelecionado}`);
                estado.dataSelecionada = new Date(ano, mes, diaSelecionado);
                atualizarDataSelecionada();
                elementos.calendario.classList.remove('mostrar');
            });
        });
    }

    function atualizarDataSelecionada() {
        const dia = String(estado.dataSelecionada.getDate()).padStart(2, '0');
        const mes = String(estado.dataSelecionada.getMonth() + 1).padStart(2, '0');
        const ano = estado.dataSelecionada.getFullYear();
        const dataFormatada = `${dia}/${mes}/${ano}`;
        console.log('Data selecionada atualizada:', dataFormatada);
        elementos.dataSelecionada.textContent = dataFormatada;
    }

    // Funções para categorias
    function carregarCategorias() {
        console.log('Carregando categorias...');
        const opcoesCategoria = elementos.opcoesCategoria;
        opcoesCategoria.innerHTML = '';

        // Categorias padrão para despesas
        const categoriasPadrao = [
            { nome: 'Restaurante', icone: 'restaurant' },
            { nome: 'Padaria', icone: 'bakery_dining' },
            { nome: 'Delivery', icone: 'delivery_dining' },
            { nome: 'Estacionamento', icone: 'local_parking' },
            { nome: 'Pedágio', icone: 'toll' },
            { nome: 'Transporte por App', icone: 'directions_car' },
            { nome: 'Transporte Público', icone: 'directions_bus' },
            { nome: 'Condomínio', icone: 'apartment' },
            { nome: 'Manutenção Residencial', icone: 'build' },
            { nome: 'Móveis e Decoração', icone: 'chair' },
            { nome: 'Produtos de Limpeza', icone: 'cleaning_services' },
            { nome: 'Plano de Saúde', icone: 'medical_services' },
            { nome: 'Psicólogo', icone: 'psychology' },
            { nome: 'Exames', icone: 'science' },
            { nome: 'Óculos', icone: 'visibility' },
            { nome: 'Cuidados com Crianças', icone: 'child_friendly' },
            { nome: 'Escola', icone: 'school' },
            { nome: 'Creche', icone: 'child_care' },
            { nome: 'Cuidados com Idosos', icone: 'elderly' },
            { nome: 'Presentes', icone: 'card_giftcard' },
            { nome: 'Mesada', icone: 'payments' },
            { nome: 'Ingressos', icone: 'confirmation_number' },
            { nome: 'Passeios', icone: 'hiking' },
            { nome: 'Hospedagem', icone: 'hotel' },
            { nome: 'Veterinário', icone: 'pets' },
            { nome: 'Banho e Tosa', icone: 'shower' },
            { nome: 'Pet Shop', icone: 'store' },
            { nome: 'Plataforma de Cursos', icone: 'computer' },
            { nome: 'Software', icone: 'code' },
            { nome: 'Cloud', icone: 'cloud' },
            { nome: 'Licenciamento de Veículo', icone: 'directions_car' },
            { nome: 'Material de Escritório', icone: 'edit' },
            { nome: 'Cursos', icone: 'menu_book' },
            { nome: 'Treinamentos', icone: 'fitness_center' },
            { nome: 'Coworking', icone: 'workspaces' },
            { nome: 'Juros', icone: 'percent' },
            { nome: 'Tarifa Bancária', icone: 'account_balance' },
            { nome: 'Anuidade de Cartão', icone: 'credit_card' },
            { nome: 'Taxas de Serviço', icone: 'request_quote' }
        ];

        categoriasPadrao.forEach(categoria => {
            const opcao = document.createElement('div');
            opcao.classList.add('opcao-categoria');
            opcao.setAttribute('data-value', categoria.nome.toLowerCase());
            opcao.innerHTML = `<span class="material-symbols-outlined">${categoria.icone}</span> <span>${categoria.nome}</span>`;
            opcao.addEventListener('click', function () {
                console.log(`Categoria selecionada: ${categoria.nome}`);
                estado.categoriaSelecionada = categoria.nome.toLowerCase();
                elementos.opcaoSelecionadaCategoria.innerHTML = this.innerHTML;
                opcoesCategoria.classList.remove('mostrar');
            });
            opcoesCategoria.appendChild(opcao);
        });

        // Categorias personalizadas
        const categoriasPersonalizadas = JSON.parse(localStorage.getItem('userCustomCategories')) || [];
        console.log(`Categorias personalizadas encontradas: ${categoriasPersonalizadas.length}`);

        categoriasPersonalizadas.forEach(categoria => {
            const opcao = document.createElement('div');
            opcao.classList.add('opcao-categoria');
            opcao.setAttribute('data-value', categoria.nome.toLowerCase());
            opcao.innerHTML = `<span class="material-symbols-outlined" style="color: ${categoria.cor};">${categoria.icone}</span> <span>${categoria.nome}</span>`;
            opcao.addEventListener('click', function () {
                console.log(`Categoria personalizada selecionada: ${categoria.nome}`);
                estado.categoriaSelecionada = categoria.nome.toLowerCase();
                elementos.opcaoSelecionadaCategoria.innerHTML = this.innerHTML;
                opcoesCategoria.classList.remove('mostrar');
            });
            opcoesCategoria.appendChild(opcao);
        });

        // Opção para criar nova categoria
        const criarCategoriaOpcao = document.createElement('div');
        criarCategoriaOpcao.classList.add('opcao-categoria');
        criarCategoriaOpcao.setAttribute('data-value', 'outros');
        criarCategoriaOpcao.innerHTML = `<span class="material-symbols-outlined">add</span> <span>Criar Categoria</span>`;
        criarCategoriaOpcao.addEventListener('click', function () {
            console.log('Abrindo modal para criar nova categoria');
            abrirModalCategoria();
            carregarGaleriaIcones();
        });
        opcoesCategoria.appendChild(criarCategoriaOpcao);
    }

    function abrirModalCategoria() {
        console.log('Abrindo modal de categoria');
        elementos.modalCategoria.style.display = 'flex';
        elementos.nomeCategoriaInput.value = '';
        elementos.corCategoriaInput.value = '#21C25E';
        estado.iconeSelecionado = 'paid';
        if (elementos.iconeSelecionadoPreview) {
            elementos.iconeSelecionadoPreview.innerHTML = `<span class="material-symbols-outlined" style="color: ${elementos.corCategoriaInput.value};">${estado.iconeSelecionado}</span>`;
        } else {
            console.error('Elemento iconeSelecionadoPreview não encontrado.');
        }
    }

    function fecharModalCategoria() {
        console.log('Fechando modal de categoria');
        elementos.modalCategoria.style.display = 'none';
    }

    function carregarGaleriaIcones() {
        console.log('Carregando galeria de ícones...');
        elementos.galeriaIcones.innerHTML = '';

        const icones = [
            'paid', 'attach_money', 'currency_exchange',
            'wallet', 'savings', 'atm', 'account_balance', 'credit_card', 'account_balance_wallet',
            'receipt_long', 'request_quote', 'payment', 'cancel', 'balance',
            'history', 'trending_up', 'trending_down', 'pie_chart', 'bar_chart', 'bar_chart_4_bars',
            'query_stats', 'percent', 'account_tree', 'monetization_on', 'money_off',
            'universal_currency_alt', 'currency_bitcoin', 'receipt', 'add_card', 'payments', 'price_check', 'redeem', 'savings',
            'trending_flat', 'euro_symbol', 'currency_franc', 'currency_pound', 'currency_ruble',
            'currency_yen', 'donut_large', 'donut_small', 'dataset', 'data_thresholding',
            'contactless', 'calculate', 'description', 'barcode_scanner', 'qr_code_scanner',
            'account_circle', 'group', 'groups', 'person', 'supervisor_account',
            'work', 'business_center', 'domain', 'business', 'insert_chart', 'insert_chart_outlined', 'leaderboard', 'insights',
            'fact_check', 'task_alt', 'done_all', 'check_circle', 'verified',
            'gavel', 'handshake', 'lightbulb', 'note', 'note_alt',
            'important_devices', 'developer_mode', 'cloud', 'cloud_done', 'cloud_download',
            'cloud_sync', 'cloud_upload', 'folder', 'folder_open', 'folder_zip'
        ];

        icones.forEach(iconName => {
            const div = document.createElement('div');
            div.classList.add('icone-item');
            div.innerHTML = `<span class="material-symbols-outlined">${iconName}</span>`;
            div.addEventListener('click', function () {
                console.log(`Ícone selecionado: ${iconName}`);
                estado.iconeSelecionado = iconName;
                elementos.iconeSelecionadoPreview.innerHTML = `<span class="material-symbols-outlined" style="color: ${elementos.corCategoriaInput.value};">${iconName}</span>`;
            });
            elementos.galeriaIcones.appendChild(div);
        });
    }

    function atualizarCorPreview() {
        const cor = elementos.corCategoriaInput.value;
        console.log('Cor selecionada:', cor);
        elementos.iconeSelecionadoPreview.innerHTML = `<span class="material-symbols-outlined" style="color: ${cor};">${estado.iconeSelecionado}</span>`;
    }

    function salvarCategoriaPersonalizada() {
        const nomeCategoria = elementos.nomeCategoriaInput.value.trim();
        console.log('Tentando salvar categoria:', nomeCategoria);

        if (!nomeCategoria || nomeCategoria.length < 2) {
            console.log('Nome de categoria inválido');
            mostrarPopup('Por favor, insira um nome válido para a categoria (mínimo 2 caracteres).');
            return;
        }

        // Verificar se já existe
        const categoriasExistentes = [...document.querySelectorAll('.opcao-categoria')].map(opcao =>
            opcao.textContent.trim().replace('Criar Categoria', '').trim()
        );

        if (categoriasExistentes.includes(nomeCategoria)) {
            console.log('Categoria já existe:', nomeCategoria);
            mostrarPopup('Já existe uma categoria com esse nome.');
            return;
        }

        // Criar nova categoria
        const novaCategoria = {
            nome: nomeCategoria,
            icone: estado.iconeSelecionado,
            cor: elementos.corCategoriaInput.value
        };

        // Salvar no localStorage
        let categoriasPersonalizadas = JSON.parse(localStorage.getItem('userCustomCategories')) || [];
        categoriasPersonalizadas.push(novaCategoria);
        localStorage.setItem('userCustomCategories', JSON.stringify(categoriasPersonalizadas));
        console.log('Categoria salva no localStorage:', novaCategoria);

        // Atualizar a lista de categorias
        carregarCategorias();

        // Selecionar a nova categoria
        estado.categoriaSelecionada = nomeCategoria.toLowerCase();
        elementos.opcaoSelecionadaCategoria.innerHTML = `<span class="material-symbols-outlined" style="color: ${novaCategoria.cor};">${novaCategoria.icone}</span> <span>${novaCategoria.nome}</span>`;

        // Fechar o modal
        fecharModalCategoria();
    }

    // Funções para carteiras
    function carregarCarteiras() {
        console.log('Carregando carteiras...');
        const opcoesCarteira = elementos.opcoesCarteira;
        opcoesCarteira.innerHTML = '';

        let carteiras = [];
        try {
            carteiras = JSON.parse(localStorage.getItem('contasBancarias')) || [];
            console.log(`Carteiras encontradas: ${carteiras.length}`);
        } catch (e) {
            console.error('Erro ao carregar contas:', e);
        }

        if (carteiras.length === 0) {
            console.log('Nenhuma carteira encontrada - mostrando opção para criar');
            opcoesCarteira.innerHTML = `
                <div class="opcao-carteira" id="criar-nova-carteira">
                    <span class="icone-carteira">➕</span>
                    <div class="detalhes-carteira">
                        <span class="nome-carteira">Criar nova conta</span>
                    </div>
                </div>
            `;
            document.getElementById('criar-nova-carteira').addEventListener('click', function () {
                console.log('Redirecionando para criar nova conta');
                window.location.href = "../Nova-conta/Nova-conta.html";
            });
        } else {
            carteiras.forEach(carteira => {
                if (carteira && carteira.id) {
                    // Use o campo correto para o nome da conta
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
                    opcao.addEventListener('click', function () {
                        console.log(`Carteira selecionada: ${nomeCarteira}`);
                        estado.carteiraSelecionada = carteira.id;
                        elementos.opcaoSelecionadaCarteira.innerHTML = `
                            <span class="icone-carteira">${iconeCarteira}</span>
                            <span>${nomeCarteira}</span>
                        `;
                        opcoesCarteira.classList.remove('mostrar');
                    });
                    opcoesCarteira.appendChild(opcao);
                }
            });
        }
    }

    // Função para salvar a despesa
    function salvarDespesa() {
        console.log('Iniciando processo de salvar despesa...');

        // Verificar elemento de valor novamente
        if (!elementos.valorDespesa) {
            elementos.valorDespesa = document.getElementById('valor-despesa') ||
                document.getElementById('valordespesa') ||
                document.querySelector('#secao-valor .valor-display') ||
                document.querySelector('.valor-despesa') ||
                document.querySelector('.valor-display') ||
                document.querySelector('[data-valor]') ||
                document.querySelector('#secao-valor span') ||
                document.querySelector('#secao-valor div');
        }

        // Validação dos campos
        if (!elementos.valorDespesa || elementos.valorDespesa.textContent === 'R$ 0,00') {
            console.log('Valor não informado');
            mostrarPopup('Por favor, insira um valor para a despesa');
            return;
        }

        if (!elementos.inputDescricao || !elementos.inputDescricao.value.trim()) {
            console.log('Descrição não informada');
            mostrarPopup('Por favor, insira uma descrição para a despesa');
            return;
        }

        if (!estado.categoriaSelecionada) {
            console.log('Categoria não selecionada');
            mostrarPopup('Por favor, selecione uma categoria');
            return;
        }

        if (!estado.carteiraSelecionada) {
            console.log('Carteira não selecionada');
            mostrarPopup('Por favor, selecione uma conta');
            return;
        }

        // Obtenha os campos de repetição e despesa fixa
        const repetir = elementos.toggleRepetir ? elementos.toggleRepetir.checked : false;
        const despesaFixa = document.getElementById('toggle-despesa-fixa') ? document.getElementById('toggle-despesa-fixa').checked : false;
        const quantidadeRepeticoes = repetir ? (document.getElementById('quantidade-repeticoes')?.value || null) : null;
        const frequenciaRepeticoes = repetir ? (document.getElementById('frequencia-repeticoes')?.value || null) : null;

        // Criar objeto com os dados da despesa
        const novaDespesa = {
            id: Date.now().toString(),
            tipo: 'despesa',
            valor: elementos.valorDespesa.textContent,
            pago: elementos.checkboxPago ? elementos.checkboxPago.checked : false,
            data: elementos.dataSelecionada ? elementos.dataSelecionada.textContent : new Date().toLocaleDateString('pt-BR'),
            descricao: elementos.inputDescricao.value,
            categoria: estado.categoriaSelecionada,
            conta: estado.carteiraSelecionada,
            anexo: elementos.inputAnexo && elementos.inputAnexo.files.length > 0 ? elementos.inputAnexo.files[0].name : null,
            repetir: repetir,
            quantidadeRepeticoes: quantidadeRepeticoes,
            frequenciaRepeticoes: frequenciaRepeticoes,
            despesaFixa: despesaFixa,
            dataCriacao: new Date().toISOString()
        };

        console.log('Nova despesa a ser salva:', novaDespesa);

        // Salvar em JSON no localStorage
        let transacoes = [];
        try {
            transacoes = JSON.parse(localStorage.getItem('transacoes')) || [];
        } catch (e) {
            transacoes = [];
        }
        transacoes.push(novaDespesa);
        localStorage.setItem('transacoes', JSON.stringify(transacoes));
        console.log('Despesa salva com sucesso no localStorage');

        mostrarPopup('Despesa salva com sucesso!');

        // Limpar formulário
        if (elementos.valorDespesa) elementos.valorDespesa.textContent = 'R$ 0,00';
        if (elementos.checkboxPago) elementos.checkboxPago.checked = false;
        if (elementos.inputDescricao) elementos.inputDescricao.value = '';
        if (elementos.opcaoSelecionadaCategoria) elementos.opcaoSelecionadaCategoria.innerHTML = '<span>Selecione uma categoria</span>';
        if (elementos.opcaoSelecionadaCarteira) elementos.opcaoSelecionadaCarteira.innerHTML = '<span>Selecione uma conta</span>';
        if (elementos.nomeArquivo) elementos.nomeArquivo.textContent = '';
        if (elementos.inputAnexo) elementos.inputAnexo.value = '';
        if (elementos.toggleRepetir) {
            elementos.toggleRepetir.checked = false;
            if (elementos.camposRepetir) elementos.camposRepetir.style.display = 'none';
        }
        estado.categoriaSelecionada = null;
        estado.carteiraSelecionada = null;

        // Resetar data para hoje
        estado.dataSelecionada = new Date();
        atualizarDataSelecionada();

        // Redirecionar para Lista de despesas.html após salvar e fechar popup
        if (elementos.popupBotao) {
            elementos.popupBotao.onclick = function () {
                console.log('Popup fechado');
                if (elementos.popupMensagem) elementos.popupMensagem.style.display = 'none';
                window.location.href = "../Lista-de-despesas/Lista-de-despesas.html";
            };
        }
    }

    // Função para mostrar popup
    function mostrarPopup(mensagem) {
        console.log('Mostrando popup:', mensagem);
        elementos.popupTexto.textContent = mensagem;
        elementos.popupMensagem.style.display = 'flex';
        elementos.popupBotao.onclick = function () {
            console.log('Popup fechado');
            elementos.popupMensagem.style.display = 'none';
        };
    }

    // Seção relevante: 393-428
    // Certifique-se de que ao abrir o popup, o foco vá para o botão salvar/cancelar
    function mostrarPopupMensagem(texto, callback) {
        const popup = document.getElementById('popup-mensagem');
        const popupTexto = document.getElementById('popup-texto');
        const popupBotao = document.getElementById('popup-botao');
        popupTexto.textContent = texto;
        popup.style.display = 'flex';
        popupBotao.focus(); // Garante que o botão fique visível e acessível

        // Adiciona rolagem ao popup se necessário
        popup.querySelector('div').style.overflowY = 'auto';
        popup.querySelector('div').style.maxHeight = '80vh';

        popupBotao.onclick = function () {
            popup.style.display = 'none';
            if (callback) callback();
        };
    }

    // Torne gerenciarToggles global
    window.gerenciarToggles = function (tipo) {
        const toggleRepetir = document.getElementById('toggle-repetir');
        const toggleDespesaFixa = document.getElementById('toggle-despesa-fixa');
        const camposRepetir = document.getElementById('campos-repetir');

        if (tipo === 'repetir') {
            if (toggleRepetir.checked) {
                if (toggleDespesaFixa) toggleDespesaFixa.checked = false; // Desativa Despesa Fixa
                camposRepetir.style.display = 'block'; // Exibe campos de Repetir
            } else {
                camposRepetir.style.display = 'none'; // Oculta campos de Repetir
            }
        } else if (tipo === 'fixa') {
            if (toggleDespesaFixa && toggleDespesaFixa.checked) {
                toggleRepetir.checked = false; // Desativa Repetir
                camposRepetir.style.display = 'none'; // Oculta campos de Repetir
            }
        }
    };

    // Torne alterarQuantidade global
    window.alterarQuantidade = function (delta) {
        const inputQuantidade = document.getElementById('quantidade-repeticoes');
        const novaQuantidade = Math.max(1, parseInt(inputQuantidade.value || 1, 10) + delta);
        inputQuantidade.value = novaQuantidade;
    };

    // Função para limpar valores duplicados na inicialização
    function limparValoresDuplicados() {
        if (elementos.secaoValor) {
            // Verificar se a estrutura está correta
            const paragrafo = elementos.secaoValor.querySelector('p');
            const titulo = elementos.secaoValor.querySelector('h2');

            // Se não tem a estrutura correta, recriar
            if (!paragrafo || !titulo) {
                console.log('Recriando estrutura da seção valor...');
                elementos.secaoValor.innerHTML = `
                    <p>Valor da Despesa</p>
                    <h2 id="valor-despesa">R$ 0,00</h2>
                `;
                elementos.valorDespesa = elementos.secaoValor.querySelector('h2');
            } else {
                // Se tem a estrutura, apenas garantir que o elemento está referenciado
                elementos.valorDespesa = titulo;
            }
        }
    }

    // Inicializar a aplicação
    inicializar();
});

// Função para abrir a galeria de ícones
function abrirGaleriaIcones(iconePreview) {
    // Cria o modal se não existir
    let modal = document.getElementById('modal-galeria-icones');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'modal-galeria-icones';
        modal.className = 'modal';
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="modal-conteudo" style="max-width:400px;width:96vw;max-height:80vh;overflow-y:auto;">
                <h3>Escolha um ícone</h3>
                <div id="galeria-icones" class="galeria-icones" style="grid-template-columns: repeat(4, 1fr);">
                    <div class="icone-item"><span class="material-symbols-outlined">paid</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">attach_money</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">currency_exchange</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">wallet</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">savings</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">atm</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">account_balance</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">credit_card</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">account_balance_wallet</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">receipt_long</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">request_quote</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">payment</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">cancel</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">balance</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">history</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">trending_up</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">trending_down</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">pie_chart</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">bar_chart</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">bar_chart_4_bars</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">query_stats</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">percent</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">account_tree</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">monetization_on</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">money_off</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">universal_currency_alt</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">currency_bitcoin</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">receipt</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">add_card</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">payments</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">price_check</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">redeem</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">savings</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">trending_flat</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">euro_symbol</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">currency_franc</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">currency_pound</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">currency_ruble</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">currency_yen</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">donut_large</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">donut_small</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">dataset</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">data_thresholding</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">contactless</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">calculate</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">description</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">barcode_scanner</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">qr_code_scanner</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">account_circle</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">group</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">groups</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">person</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">supervisor_account</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">work</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">business_center</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">domain</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">business</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">insert_chart</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">insert_chart_outlined</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">leaderboard</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">insights</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">fact_check</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">task_alt</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">done_all</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">check_circle</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">verified</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">gavel</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">handshake</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">lightbulb</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">note</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">note_alt</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">important_devices</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">developer_mode</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">cloud</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">cloud_done</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">cloud_download</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">cloud_sync</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">cloud_upload</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">folder</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">folder_open</span></div>
                    <div class="icone-item"><span class="material-symbols-outlined">folder_zip</span></div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    modal.style.display = 'flex';

    // Adiciona evento para seleção de ícone
    const galeria = modal.querySelector('#galeria-icones');
    galeria.querySelectorAll('.icone-item').forEach(function (item) {
        item.onclick = function () {
            const span = item.querySelector('.material-symbols-outlined');
            if (span) {
                iconePreview.innerHTML = `<span class="material-symbols-outlined" style="color: #21c25e;">${span.textContent}</span>`;
            }
            modal.style.display = 'none';
        };
    });

    // Fecha o modal ao clicar fora do conteúdo
    modal.onclick = function (e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// Exemplo de estrutura para popup de nova categoria
let categoriaSelecionada = {
    icone: null,
    cor: null
};

// Evento de seleção de ícone
document.querySelectorAll('.icone-categoria-opcao').forEach(function (opcao) {
    opcao.addEventListener('click', function () {
        categoriaSelecionada.icone = opcao.getAttribute('data-icone');
        categoriaSelecionada.cor = document.getElementById('input-cor-categoria').value;
        // Atualiza visualização do ícone no popup (apenas no preview, não no seletor principal)
        atualizarIconeCategoriaPopup();
    });
});

// Evento de troca de cor
document.getElementById('input-cor-categoria').addEventListener('input', function (e) {
    categoriaSelecionada.cor = e.target.value;
    atualizarIconeCategoriaPopup();
});

// Função para atualizar o ícone no popup com a cor escolhida
function atualizarIconeCategoriaPopup() {
    const visualIcone = document.getElementById('icone-categoria-visual');
    if (visualIcone && categoriaSelecionada.icone) {
        visualIcone.className = 'material-symbols-outlined';
        visualIcone.textContent = categoriaSelecionada.icone;
        visualIcone.style.color = categoriaSelecionada.cor || '#333';
    }
}