document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado - Iniciando aplicação de Despesa...');
    
    // Elementos do DOM
    const elementos = {
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
        camposRepetir: document.getElementById('campos-repetir'),
        toggleDespesaFixa: document.getElementById('toggle-despesa-fixa')
    };

    // Estado da aplicação
    const estado = {
        valorAtual: '0',
        digitandoValor: false,
        dataSelecionada: new Date(),
        categoriaSelecionada: null,
        carteiraSelecionada: null,
        iconeSelecionado: 'shopping_cart'
    };

    // Inicialização
    function inicializar() {
        console.log('Inicializando aplicação...');
        configurarEventos();
        atualizarDataSelecionada();
        carregarCarteiras();
        carregarCategorias();

        // Verifica o estado de autenticação do Firebase
        firebase.auth().onAuthStateChanged(user => {
            if (user) {
                // Usuário está logado
                console.log('Usuário autenticado:', user.uid);
                if (elementos.botaoSalvar) {
                    elementos.botaoSalvar.disabled = false;
                    elementos.botaoSalvar.textContent = 'Salvar Despesa';
                }
            } else {
                // Usuário não está logado
                console.warn('Nenhum usuário autenticado.');
                if (elementos.botaoSalvar) {
                    elementos.botaoSalvar.disabled = true;
                    elementos.botaoSalvar.textContent = 'Faça login para salvar';
                    elementos.botaoSalvar.style.backgroundColor = '#ccc'; // Indica que está desabilitado
                }
            }
        });

        console.log('Aplicação inicializada com sucesso');
    }

    // Configurar eventos
    function configurarEventos() {
        console.log('Configurando eventos...');
        
        // Botão voltar
        elementos.botaoVoltar.addEventListener('click', function() {
            console.log('Botão voltar clicado');
            window.history.back();
        });

        // Calculadora
        elementos.secaoValor.addEventListener('click', abrirCalculadora);
        elementos.calculadoraContainer.addEventListener('click', function(e) {
            if (e.target === elementos.calculadoraContainer) {
                console.log('Clicou fora da calculadora - fechando');
                fecharCalculadora();
            }
        });
        
        elementos.calculadoraBotoes.addEventListener('click', function(e) {
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
        elementos.campoData.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('Abrindo calendário');
            elementos.calendario.classList.add('mostrar');
        });
        
        renderizarCalendario();
        
        document.addEventListener('click', function(e) {
            if (!elementos.calendario.contains(e.target) && e.target !== elementos.campoData) {
                elementos.calendario.classList.remove('mostrar');
            }
        });

        // Categorias
        elementos.opcaoSelecionadaCategoria.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('Abrindo seletor de categorias');
            elementos.opcoesCategoria.classList.toggle('mostrar');
        });
        
        document.addEventListener('click', function(e) {
            if (!elementos.seletorCategoria.contains(e.target)) {
                elementos.opcoesCategoria.classList.remove('mostrar');
            }
        });

        // Carteiras
        elementos.opcaoSelecionadaCarteira.addEventListener('click', function(e) {
            e.stopPropagation();
            console.log('Abrindo seletor de carteiras');
            elementos.opcoesCarteira.classList.toggle('mostrar');
        });

        // Anexo
        elementos.botaoAnexo.addEventListener('click', function() {
            console.log('Abrindo seletor de arquivos');
            elementos.inputAnexo.click();
        });
        
        elementos.inputAnexo.addEventListener('change', function() {
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
        elementos.toggleRepetir.addEventListener('change', function() {
            console.log('Toggle de repetição alterado:', this.checked);
            elementos.camposRepetir.style.display = this.checked ? 'block' : 'none';
        });

        // Ícone selecionado - abrir galeria
        const iconePreview = document.getElementById('icone-selecionado-preview');
        if (iconePreview) {
            iconePreview.addEventListener('click', function() {
                abrirGaleriaIcones(iconePreview);
            });
        }
    }

    // Função para salvar a despesa no Firestore
    function salvarDespesa() {
        const auth = firebase.auth();
        const db = firebase.firestore();
        const user = auth.currentUser;

        if (!user) {
            mostrarPopup('Você precisa estar logado para salvar uma despesa.');
            return;
        }

        const descricao = elementos.inputDescricao.value.trim();
        if (!descricao) {
            mostrarPopup('Por favor, insira uma descrição para a despesa.');
            return;
        }
        if (estado.valorAtual === '0' || elementos.valorDespesa.textContent === 'R$ 0,00') {
            mostrarPopup('Por favor, insira um valor para a despesa.');
            return;
        }
        if (!estado.categoriaSelecionada) {
            mostrarPopup('Por favor, selecione uma categoria.');
            return;
        }
        if (!estado.carteiraSelecionada) {
            mostrarPopup('Por favor, selecione uma conta/carteira.');
            return;
        }

        const novaDespesa = {
            userId: user.uid,
            valor: elementos.valorDespesa.textContent,
            descricao: descricao,
            pago: elementos.checkboxPago.checked,
            data: elementos.dataSelecionada.textContent,
            categoria: estado.categoriaSelecionada,
            carteira: estado.carteiraSelecionada,
            repetir: elementos.toggleRepetir.checked,
            quantidadeRepeticoes: elementos.toggleRepetir.checked ? document.getElementById('quantidade-repeticoes').value : null,
            frequenciaRepeticoes: elementos.toggleRepetir.checked ? document.getElementById('frequencia-repeticoes').value : null,
            despesaFixa: elementos.toggleDespesaFixa.checked,
            criadoEm: firebase.firestore.FieldValue.serverTimestamp()
        };

        db.collection('despesas').add(novaDespesa)
            .then(docRef => {
                console.log('Despesa salva com sucesso no Firestore com ID: ', docRef.id);
                window.location.href = '../Lista-de-despesas/Lista-de-despesas.html';
            })
            .catch(error => {
                console.error('Erro ao salvar despesa: ', error);
                mostrarPopup('Ocorreu um erro ao salvar a despesa.');
            });
    }

    // Funções da calculadora
    function abrirCalculadora() {
        console.log('Abrindo calculadora...');
        elementos.calculadoraContainer.style.display = 'block';
        estado.valorAtual = elementos.valorDespesa.textContent.replace('R$ ', '').replace(/\./g, '').replace(',', '.');
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
        const valorFormatado = formatarMoeda(estado.valorAtual);
        console.log('Valor confirmado na calculadora:', valorFormatado);
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
            dia.addEventListener('click', function(e) {
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

    // Função para exibir popups
    function mostrarPopup(mensagem, callback) {
        elementos.popupTexto.textContent = mensagem;
        elementos.popupMensagem.style.display = 'flex';
        elementos.popupBotao.onclick = function() {
            elementos.popupMensagem.style.display = 'none';
            if (callback) callback();
        };
    }

    // Funções para categorias
    // Categorias padrão com ícones
    const categoriasPadrao = [
        { nome: 'Moradia', icone: 'home' },
        { nome: 'Alimentação', icone: 'restaurant' },
        { nome: 'Transporte', icone: 'directions_car' },
        { nome: 'Saúde', icone: 'local_hospital' },
        { nome: 'Educação', icone: 'school' },
        { nome: 'Lazer', icone: 'sports_esports' },
        { nome: 'Compras', icone: 'shopping_bag' },
        { nome: 'Contas', icone: 'receipt_long' },
        { nome: 'Impostos', icone: 'account_balance' },
        { nome: 'Viagens', icone: 'flight' },
        { nome: 'Cuidados Pessoais', icone: 'content_cut' },
        { nome: 'Assinaturas', icone: 'subscriptions' },
        { nome: 'Dívidas', icone: 'credit_score' },
        { nome: 'Investimentos', icone: 'trending_up' },
        { nome: 'Doações', icone: 'volunteer_activism' },
        { nome: 'Família/Filhos', icone: 'family_restroom' },
        { nome: 'Animais de Estimação', icone: 'pets' },
        { nome: 'Reparos/Manutenção', icone: 'build' },
        { nome: 'Presentes', icone: 'card_giftcard' },
        { nome: 'Outros', icone: 'more_horiz' }
    ];

    // Função para carregar categorias no seletor
    function carregarCategorias() {
        const seletorCategoria = document.getElementById('seletor-categoria').querySelector('.opcoes-categoria');
        seletorCategoria.innerHTML = ''; // Limpar categorias existentes

        categoriasPadrao.forEach(categoria => {
            const opcao = document.createElement('div');
            opcao.classList.add('opcao-categoria');
            opcao.setAttribute('data-value', categoria.nome.toLowerCase().replace(/\s+/g, '-'));
            // Usa material-symbols-outlined para todos os ícones
            opcao.innerHTML = `
                <span class="material-symbols-outlined">${categoria.icone}</span>
                <span>${categoria.nome}</span>
            `;
            opcao.addEventListener('click', function () {
                const selecionada = document.querySelector('.seletor-categoria .opcao-selecionada');
                selecionada.innerHTML = `
                    <span class="material-symbols-outlined">${categoria.icone}</span>
                    <span>${categoria.nome}</span>
                `;
                estado.categoriaSelecionada = categoria.nome;
                estado.iconeSelecionado = categoria.icone;
                elementos.opcoesCategoria.classList.remove('mostrar');
            });
            seletorCategoria.appendChild(opcao);
        });

        // Adicionar opção "Criar nova categoria"
        const opcaoCriar = document.createElement('div');
        opcaoCriar.classList.add('opcao-categoria');
        opcaoCriar.innerHTML = `
            <span class="material-symbols-outlined">add_circle</span>
            <span>Criar nova categoria</span>
        `;
        opcaoCriar.addEventListener('click', abrirModalCategoria);
        seletorCategoria.appendChild(opcaoCriar);
    }

    // Inicializar categorias ao carregar a página
    document.addEventListener('DOMContentLoaded', function () {
        carregarCategorias();
    });

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
            document.getElementById('criar-nova-carteira').addEventListener('click', function() {
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
                    opcao.addEventListener('click', function() {
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
        
        // Validação dos campos
        if (elementos.valorDespesa.textContent === 'R$ 0,00') {
            console.log('Valor não informado');
            mostrarPopup('Por favor, insira um valor para a despesa');
            return;
        }

        if (!elementos.inputDescricao.value.trim()) {
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
        const repetir = elementos.toggleRepetir.checked;
        const despesaFixa = document.getElementById('toggle-despesa-fixa').checked;
        const quantidadeRepeticoes = repetir ? document.getElementById('quantidade-repeticoes').value : null;
        const frequenciaRepeticoes = repetir ? document.getElementById('frequencia-repeticoes').value : null;

        // Criar objeto com os dados da despesa
        const novaDespesa = {
            valor: elementos.valorDespesa.textContent,
            pago: elementos.checkboxPago.checked,
            data: elementos.dataSelecionada.textContent,
            descricao: elementos.inputDescricao.value,
            categoria: estado.categoriaSelecionada,
            carteira: estado.carteiraSelecionada,
            anexo: elementos.inputAnexo.files.length > 0 ? elementos.inputAnexo.files[0].name : null,
            repetir: repetir,
            quantidadeRepeticoes: quantidadeRepeticoes,
            frequenciaRepeticoes: frequenciaRepeticoes,
            despesaFixa: despesaFixa
        };

        console.log('Nova despesa a ser salva:', novaDespesa);

        // Salvar em JSON no localStorage
        let despesas = [];
        try {
            despesas = JSON.parse(localStorage.getItem('despesas')) || [];
        } catch (e) {
            despesas = [];
        }
        despesas.push(novaDespesa);
        localStorage.setItem('despesas', JSON.stringify(despesas));
        console.log('Despesa salva com sucesso no localStorage');

        // Salvar no Firestore
        if (firebase && firebase.auth && firebase.firestore) {
            const user = firebase.auth().currentUser;
            if (user) {
                const despesaFirestore = {
                    ...novaDespesa,
                    userId: user.uid
                };
                firebase.firestore().collection('despesas').add(despesaFirestore)
                    .then(() => {
                        console.log('Despesa salva no Firestore!');
                    })
                    .catch((error) => {
                        console.error('Erro ao salvar despesa no Firestore:', error);
                    });
            }
        }

        mostrarPopup('Despesa salva com sucesso!', () => {
             window.location.href = "../Lista-de-despesas/Lista-de-despesas.html";
        });

        // Limpar formulário
        elementos.valorDespesa.textContent = 'R$ 0,00';
        elementos.checkboxPago.checked = true;
        elementos.inputDescricao.value = '';
        elementos.opcaoSelecionadaCategoria.innerHTML = '<span>Selecione uma categoria</span>';
        elementos.opcaoSelecionadaCarteira.innerHTML = '<span>Selecione uma conta</span>';
        elementos.nomeArquivo.textContent = '';
        elementos.inputAnexo.value = '';
        elementos.toggleRepetir.checked = false;
        elementos.camposRepetir.style.display = 'none';
        estado.categoriaSelecionada = null;
        estado.carteiraSelecionada = null;

        // Resetar data para hoje
        estado.dataSelecionada = new Date();
        atualizarDataSelecionada();

        // Redirecionar para Lista de despesas.html após salvar e fechar popup
        elementos.popupBotao.onclick = function() {
            console.log('Popup fechado');
            elementos.popupMensagem.style.display = 'none';
            window.location.href = "../Lista-de-despesas/Lista-de-despesas.html";
        };
    }

    // Função para mostrar popup
    function mostrarPopup(mensagem) {
        console.log('Mostrando popup:', mensagem);
        elementos.popupTexto.textContent = mensagem;
        elementos.popupMensagem.style.display = 'flex';
        elementos.popupBotao.onclick = function() {
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

        popupBotao.onclick = function() {
            popup.style.display = 'none';
            if (callback) callback();
        };
    }

    // Torne gerenciarToggles global
    window.gerenciarToggles = function(tipo) {
        const toggleRepetir = document.getElementById('toggle-repetir');
        const toggleDespesaFixa = document.getElementById('toggle-despesa-fixa');
        const camposRepetir = document.getElementById('campos-repetir');

        if (tipo === 'repetir') {
            if (toggleRepetir.checked) {
                toggleDespesaFixa.checked = false; // Desativa Despesa Fixa
                camposRepetir.style.display = 'block'; // Exibe campos de Repetir
            } else {
                camposRepetir.style.display = 'none'; // Oculta campos de Repetir
            }
        } else if (tipo === 'fixa') {
            if (toggleDespesaFixa.checked) {
                toggleRepetir.checked = false; // Desativa Repetir
                camposRepetir.style.display = 'none'; // Oculta campos de Repetir
            }
        }
    };

    // Torne alterarQuantidade global
    window.alterarQuantidade = function(delta) {
        const inputQuantidade = document.getElementById('quantidade-repeticoes');
        const novaQuantidade = Math.max(1, parseInt(inputQuantidade.value || 1, 10) + delta);
        inputQuantidade.value = novaQuantidade;
    };

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
    galeria.querySelectorAll('.icone-item').forEach(function(item) {
        item.onclick = function() {
            const span = item.querySelector('.material-symbols-outlined');
            if (span) {
                iconePreview.innerHTML = `<span class="material-symbols-outlined" style="color: #D32F2F;">${span.textContent}</span>`;
            }
            modal.style.display = 'none';
        };
    });

    // Fecha o modal ao clicar fora do conteúdo
    modal.onclick = function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// Função para abrir modal de categoria
function abrirModalCategoria() {
    const modal = document.getElementById('modal-categoria');
    const opcoesCategoria = document.querySelector('.seletor-categoria .opcoes-categoria');
    if (modal) {
        modal.style.display = 'flex';
    }
    if (opcoesCategoria) {
        opcoesCategoria.classList.remove('mostrar');
    }
}

// Adicione uma função vazia para evitar o erro ReferenceError
function salvarCategoriaPersonalizada() {
    // Função de stub para evitar erro. Implemente a lógica conforme necessário.
    console.log('Função salvarCategoriaPersonalizada chamada (stub).');
}

// Adicione uma função vazia para evitar o erro ReferenceError
function fecharModalCategoria() {
    const modal = document.getElementById('modal-categoria');
    if (modal) {
        modal.style.display = 'none';
    }
    console.log('Função fecharModalCategoria chamada.');
}

// Adicione uma função vazia para evitar o erro ReferenceError
function atualizarCorPreview() {
    // Função de stub para evitar erro. Implemente a lógica conforme necessário.
    console.log('Função atualizarCorPreview chamada (stub).');
}