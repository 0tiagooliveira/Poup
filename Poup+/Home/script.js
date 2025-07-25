document.addEventListener('DOMContentLoaded', function() {
    console.log('Página Home carregada. Verificando autenticação...');

    const auth = firebase.auth();
    const db = firebase.firestore();

    const loadingOverlay = document.getElementById('loading-overlay');
    const containerApp = document.querySelector('.container-app');

    // PONTO DE ENTRADA PRINCIPAL DA PÁGINA
    // Nada acontece antes que esta função dê uma resposta.
    auth.onAuthStateChanged(function(user) {
        if (user) {
            // RESPOSTA: Sim, o usuário está logado.
            console.log("Usuário autenticado:", user.uid);
            
            // Agora podemos mostrar o aplicativo e esconder o "Carregando..."
            if(loadingOverlay) loadingOverlay.style.display = 'none';
            if(containerApp) containerApp.style.display = 'block';
            
            // E então, inicializamos todos os componentes da página.
            inicializarComponentes(user);

        } else {
            // RESPOSTA: Não, o usuário não está logado.
            console.log("Nenhum usuário logado, redirecionando para o login.");
            window.location.href = '../index.html';
        }
    });

    // Esta função só é chamada DEPOIS que o login é confirmado.
    function inicializarComponentes(user) {
        console.log('Inicializando componentes para o usuário:', user.uid);

        // Mapeamento dos elementos do DOM
        const elementos = {
            avatarUsuarioBtn: document.getElementById('avatar-usuario-btn'),
            menuUsuario: document.getElementById('menu-usuario'),
            sairBtn: document.getElementById('sair-btn'),
            nomeUsuario: document.querySelector('.nome-usuario'),
            // Adicione outros elementos da home aqui
        };

        // Atualiza o nome do usuário no cabeçalho
        if (elementos.nomeUsuario) {
            elementos.nomeUsuario.textContent = user.displayName || user.email;
        }

        // Configura todos os eventos de clique da página
        configurarEventos(elementos);

        // Carrega os dados do Firestore para este usuário
        carregarDadosDaHome(user.uid);
    }

    function configurarEventos(elementos) {
        console.log('Configurando eventos de clique...');

        // Eventos do Menu do Usuário
        if (elementos.avatarUsuarioBtn) {
            elementos.avatarUsuarioBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                if (elementos.menuUsuario) {
                    elementos.menuUsuario.classList.toggle('mostrar');
                }
            });
        }

        if (elementos.sairBtn) {
            elementos.sairBtn.addEventListener('click', function(e) {
                e.preventDefault();
                auth.signOut().then(() => {
                    console.log('Usuário deslogado com sucesso.');
                    window.location.href = '../index.html';
                });
            });
        }

        // Lógica para fechar o menu se clicar fora dele
        document.addEventListener('click', function(e) {
            if (elementos.menuUsuario && !elementos.menuUsuario.contains(e.target) && !elementos.avatarUsuarioBtn.contains(e.target)) {
                elementos.menuUsuario.classList.remove('mostrar');
            }
        });

        // Adicione aqui outros listeners, como os dos filtros dos gráficos
    }

    function carregarDadosDaHome(userId) {
        console.log(`Buscando dados da home para o usuário: ${userId}`);
        
        // Aqui você chamará as funções para carregar os dados do Firestore,
        // passando o userId para filtrar os resultados.
        // Exemplo:
        // carregarContas(userId);
        // carregarGraficoReceitas(userId);
        // carregarGraficoDespesas(userId);
        // atualizarSaldoTotal(userId);
        carregarContas(userId);
    }

    // Carregar contas do Firestore
    function carregarContas(userId) {
        const containerContas = document.getElementById('container-contas-home');
        const cartaoVazio = document.getElementById('cartao-estado-vazio-contas');

        if (!containerContas || !cartaoVazio) return;

        db.collection('contasBancarias').where('userId', '==', userId).get().then(querySnapshot => {
            containerContas.innerHTML = ''; // Limpa o container
            
            if (querySnapshot.empty) {
                cartaoVazio.style.display = 'block';
            } else {
                cartaoVazio.style.display = 'none';
                const cartaoAtivas = document.createElement('div');
                cartaoAtivas.className = 'cartao-estado-ativas';

                querySnapshot.forEach(doc => {
                    const conta = { id: doc.id, ...doc.data() };
                    const nomeConta = conta.descricao || 'Conta sem nome';
                    const tipoConta = conta.tipo || '';
                    const saldoConta = conta.saldo ? 'R$ ' + conta.saldo : 'R$ 0,00';
                    let iconeHtml = `<span class="icone-conta-custom" style="background-color:${conta.corBanco || '#ccc'}">${conta.iconeBanco || '?'}</span>`;

                    const contaDiv = document.createElement('div');
                    contaDiv.className = 'conta-home-card';
                    contaDiv.setAttribute('data-id', conta.id);
                    contaDiv.innerHTML = `
                        ${iconeHtml}
                        <div class="conta-info">
                            <span class="conta-nome">${nomeConta}</span>
                            <span class="conta-tipo">${tipoConta}</span>
                        </div>
                        <span class="conta-saldo">${saldoConta}</span>
                        <button class="btn-excluir-conta" title="Excluir conta">
                            <span class="material-icons-round">delete</span>
                        </button>
                    `;
                    contaDiv.querySelector('.btn-excluir-conta').onclick = (e) => {
                        e.stopPropagation();
                        mostrarPopupExcluirConta(conta.id, nomeConta, userId);
                    };
                    cartaoAtivas.appendChild(contaDiv);
                });

                // Botão "Adicionar nova conta"
                const divCentral = document.createElement('div');
                divCentral.style.cssText = "display:flex; justify-content:center; align-items:center; margin-top:24px;";
                divCentral.innerHTML = `<a href="../Nova-conta/Nova-conta.html" class="botao-primario">Adicionar nova conta</a>`;
                cartaoAtivas.appendChild(divCentral);

                containerContas.appendChild(cartaoAtivas);
            }
        }).catch(error => {
            console.error("Erro ao carregar contas: ", error);
        });
    }

    function mostrarPopupExcluirConta(id, nomeConta, userId) {
        const popup = document.getElementById('popup-excluir-conta-custom');
        const msg = document.getElementById('popup-excluir-conta-msg');
        const btnSim = document.getElementById('popup-excluir-conta-sim');
        const btnNao = document.getElementById('popup-excluir-conta-nao');

        if (!popup || !msg || !btnSim || !btnNao) return;

        msg.textContent = `Você tem certeza que quer excluir "${nomeConta}"?`;
        popup.style.display = 'flex';

        btnSim.onclick = () => {
            excluirConta(id, userId);
            popup.style.display = 'none';
        };
        btnNao.onclick = () => {
            popup.style.display = 'none';
        };
    }

    function excluirConta(id, userId) {
        db.collection('contasBancarias').doc(id).delete().then(() => {
            console.log("Conta excluída com sucesso!");
            carregarContas(userId); // Recarrega a lista de contas
        }).catch((error) => {
            console.error("Erro ao excluir conta: ", error);
        });
    }
});