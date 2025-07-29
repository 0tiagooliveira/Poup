document.addEventListener('DOMContentLoaded', function() {
    console.log('Página Minhas Receitas carregada');

    // Firebase
    if (typeof firebase === "undefined" || !firebase.firestore) {
        console.error('Firebase não está disponível!');
        return;
    }
    const db = firebase.firestore();
    const auth = firebase.auth();

    const receitasList = document.getElementById('receitas-list');
    const totalRecebidoEl = document.getElementById('total-recebido');
    const aReceberEl = document.getElementById('a-receber');

    function salvarReceitaFirebase(receita, userId) {
        // Validação de categoria
        const categoriaInvalida = !receita.categoria ||
            receita.categoria === '-' ||
            receita.categoria === 'Selecione uma categoria' ||
            receita.categoria === 'category';

        // Validação de conta/carteira
        const contaInvalida = !receita.carteira ||
            receita.carteira === '-' ||
            receita.carteira === 'Selecione uma conta';

        // Validação de descrição
        const descricaoInvalida = !receita.descricao || receita.descricao.trim().length < 2;

        // Validação de valor
        let valor = receita.valor;
        if (typeof valor === 'string') {
            valor = valor.replace(/[^\d,.-]/g, '').replace(',', '.');
            valor = parseFloat(valor) || 0;
        } else {
            valor = Number(valor) || 0;
        }
        const valorInvalido = valor <= 0;

        if (categoriaInvalida) {
            mostrarPopupMensagem('Selecione uma categoria válida para a receita.');
            return;
        }
        if (contaInvalida) {
            mostrarPopupMensagem('Selecione uma conta válida para a receita.');
            return;
        }
        if (descricaoInvalida) {
            mostrarPopupMensagem('Preencha a descrição da receita.');
            return;
        }
        if (valorInvalido) {
            mostrarPopupMensagem('Informe um valor maior que zero para a receita.');
            return;
        }
        if (!userId) {
            console.error('[Firebase] Usuário não autenticado ao salvar receita.');
            return;
        }

        // Monta objeto limpo para salvar
        const receitaParaSalvar = {
            categoria: receita.categoria,
            carteira: receita.carteira,
            valor: valor,
            descricao: receita.descricao ? receita.descricao.trim() : '',
            data: receita.data,
            recebido: receita.recebido !== false,
            tipo: 'receita',
            userId: userId
        };

        firebase.firestore().collection('receitas').add(receitaParaSalvar)
            .then(() => {
                mostrarPopupMensagem('Receita salva com sucesso!');
                setTimeout(() => {
                    window.location.href = '../Lista-de-receitas/Lista-de-receitas.html';
                }, 1200);
            })
            .catch(error => {
                console.error('[Firebase] Erro ao salvar receita:', error);
                mostrarPopupMensagem('Erro ao salvar receita.');
            });
    }

    function carregarReceitasFirebase(uid) {
        const receitasList = document.getElementById('receitas-list');
        if (!receitasList) return;
        receitasList.innerHTML = '<p style="text-align:center; color:#888; margin-top:32px;">Carregando receitas...</p>';
        console.log(`[Firebase] Buscando receitas para o usuário: ${uid}`);

        const db = firebase.firestore();
        db.collection('receitas')
            .where('userId', '==', uid)
            .get()
            .then(snapshot => {
                let receitas = [];
                console.log(`[Firebase] Query executada. Quantidade de documentos retornados: ${snapshot.size}`);
                snapshot.forEach(doc => {
                    const receita = doc.data();
                    receita.id = doc.id;
                    receitas.push(receita);
                    console.log(`[Firebase] Receita encontrada: id=${doc.id}, dados=`, receita);
                });

                // Ordenação manual por data
                receitas.sort((a, b) => {
                    function parseData(d) {
                        if (!d) return new Date(0);
                        if (typeof d === 'string' && d.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                            const [dia, mes, ano] = d.split('/');
                            return new Date(`${ano}-${mes}-${dia}`);
                        }
                        return new Date(d);
                    }
                    const dataA = parseData(a.data);
                    const dataB = parseData(b.data);
                    return dataB - dataA;
                });

                console.log(`[Firebase] Total de receitas após ordenação: ${receitas.length}`);
                renderizarReceitas(receitas);
            })
            .catch(error => {
                receitasList.innerHTML = '<p style="color:#ef233c; text-align:center;">Erro ao carregar receitas.</p>';
                console.error('[Firebase] Erro ao buscar receitas do Firestore:', error);
            });
    }

    function renderizarReceitas(receitas) {
        const receitasList = document.getElementById('receitas-list');
        if (!receitasList) return;
        receitasList.innerHTML = '';
        console.log('[Render] Renderizando receitas...');

        if (!receitas || receitas.length === 0) {
            console.log('[Render] Nenhuma receita encontrada.');
            receitasList.innerHTML = '<p style="text-align:center; color:#888; margin-top:32px;">Nenhuma receita cadastrada.</p>';
            document.getElementById('total-recebido').textContent = 'R$ 0,00';
            document.getElementById('a-receber').textContent = 'R$ 0,00';
            return;
        }

        let totalRecebido = 0;
        let aReceber = 0;

        receitas.forEach(receita => {
            // Conversão do valor
            let valor = receita.valor;
            if (typeof valor === 'string') {
                valor = valor.replace(/[^\d,.-]/g, '').replace(',', '.');
                valor = parseFloat(valor) || 0;
            } else {
                valor = Number(valor) || 0;
            }

            const recebido = receita.recebido !== false;
            if (recebido) totalRecebido += valor;
            else aReceber += valor;

            // Data amigável
            let data = receita.data;
            if (!data || data === '-') data = '';

            const div = document.createElement('div');
            div.className = 'receita-item';
            const iconeCategoria = obterIconePorCategoria(receita.categoria);
            div.innerHTML = `
                <div class="receita-icone">
                    <span class="material-icons-round">${iconeCategoria}</span>
                </div>
                <div class="receita-info">
                    <span class="receita-nome">${receita.categoria}</span>
                    <div class="receita-detalhes">
                        <span>${receita.descricao ? receita.descricao : '-'}</span>
                        <span class="receita-data">${data}</span>
                        <span style="color:#21C25E;font-weight:500;">${receita.carteira}</span>
                    </div>
                </div>
                <span class="receita-valor">${valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                <div class="receita-acoes">
                    <button class="botao-editar" title="Editar" data-id="${receita.id}">
                        <span class="material-icons-round">edit</span>
                    </button>
                    <button class="botao-excluir" title="Excluir" data-id="${receita.id}">
                        <span class="material-icons-round">delete</span>
                    </button>
                </div>
            `;
            receitasList.appendChild(div);
        });

        document.getElementById('total-recebido').textContent = totalRecebido.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('a-receber').textContent = aReceber.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        // Eventos dos botões de editar/excluir
        document.querySelectorAll('.botao-editar').forEach(btn => {
            btn.onclick = function() {
                const id = this.getAttribute('data-id');
                window.location.href = `../Nova-Receita/Nova-Receita.html?id=${id}`;
            };
        });
        document.querySelectorAll('.botao-excluir').forEach(btn => {
            btn.onclick = function() {
                const id = this.getAttribute('data-id');
                mostrarPopupExcluirReceita(id);
            };
        });
    }

    // Popup de confirmação de exclusão
    let receitaParaExcluirId = null;
    function mostrarPopupExcluirReceita(id) {
        receitaParaExcluirId = id;
        document.getElementById('popup-confirmacao').style.display = 'flex';
    }
    document.getElementById('popup-cancelar').onclick = function() {
        document.getElementById('popup-confirmacao').style.display = 'none';
        receitaParaExcluirId = null;
    };
    document.getElementById('popup-excluir').onclick = function() {
        if (receitaParaExcluirId) {
            excluirReceitaFirebase(receitaParaExcluirId);
        }
        document.getElementById('popup-confirmacao').style.display = 'none';
        receitaParaExcluirId = null;
    };

    // Função para excluir receita do Firestore
    function excluirReceitaFirebase(id) {
        if (!id) return;
        firebase.firestore().collection('receitas').doc(id).delete()
            .then(() => {
                carregarReceitasFirebase(firebase.auth().currentUser.uid);
            })
            .catch(err => {
                alert('Erro ao excluir receita.');
            });
    }

    function obterIconePorCategoria(categoria) {
        const icones = {
            'Salário': 'work',
            'Freelance': 'construction',
            'Investimentos': 'trending_up',
            'Presente': 'card_giftcard',
            'Outros': 'receipt_long'
        };
        return icones[categoria] || 'category';
    }

    function carregarReceitas() {
        const receitasList = document.getElementById('receitas-list');
        if (!receitasList) return;

        // Busca todas as transações e filtra apenas receitas
        const transacoes = JSON.parse(localStorage.getItem('transacoes')) || [];
        const receitas = transacoes.filter(t => t.tipo === 'receita');

        receitasList.innerHTML = '';

        if (receitas.length === 0) {
            receitasList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <span class="material-icons-round" style="font-size: 48px; margin-bottom: 16px;">receipt_long</span>
                    <p>Nenhuma receita cadastrada ainda.</p>
                    <p style="font-size: 0.9rem; margin-top: 8px;">Clique em "Nova Receita" para começar.</p>
                </div>
            `;
            return;
        }

        receitas.forEach(receita => {
            const receitaItem = document.createElement('div');
            receitaItem.className = 'receita-item';
            receitaItem.innerHTML = `
                <span class="material-icons-round">attach_money</span>
                <div class="receita-detalhes">
                    <span class="receita-descricao">${receita.descricao || 'Receita sem descrição'}</span>
                    <span class="receita-valor">${receita.valor || 'R$ 0,00'}</span>
                </div>
            `;
            receitasList.appendChild(receitaItem);
        });
    }

    // Função para salvar receita no Firestore ao cadastrar nova receita
    function salvarReceitaNoFirestore(receita) {
        if (firebase && firebase.auth && firebase.firestore) {
            const user = firebase.auth().currentUser;
            if (user) {
                // Validação de categoria
                const categoriaInvalida = !receita.categoria ||
                    receita.categoria === '-' ||
                    receita.categoria === 'Selecione uma categoria' ||
                    receita.categoria === 'category';

                if (categoriaInvalida) {
                    mostrarPopupMensagem('Selecione uma categoria válida para a receita.');
                    return;
                }
                const receitaFirestore = {
                    ...receita,
                    userId: user.uid
                };
                firebase.firestore().collection('receitas').add(receitaFirestore)
                    .then(() => {
                        mostrarPopupMensagem('Receita salva com sucesso!');
                        setTimeout(() => {
                            window.location.href = '../Lista-de-receitas/Lista-de-receitas.html';
                        }, 1200);
                    })
                    .catch((error) => {
                        console.error('[Firebase] Erro ao salvar receita no Firestore:', error);
                    });
            } else {
                console.warn('[Firebase] Usuário não autenticado ao salvar receita no Firestore.');
            }
        }
    }

    // Função para mostrar popup de mensagem amigável
    function mostrarPopupMensagem(mensagem) {
        let popup = document.querySelector('.popup-mensagem');
        let texto = document.querySelector('.popup-texto');
        if (popup && texto) {
            texto.textContent = mensagem;
            popup.style.display = 'flex';
            // Fecha automaticamente após 1s ou ao clicar em OK
            popup.querySelector('.popup-botao').onclick = () => {
                popup.style.display = 'none';
            };
            setTimeout(() => {
                popup.style.display = 'none';
            }, 1000);
        }
    }

    auth.onAuthStateChanged(user => {
        if (user) {
            console.log('Usuário logado:', user.uid);
            carregarReceitasFirebase(user.uid);
        } else {
            console.log('Nenhum usuário logado.');
            receitasList.innerHTML = `<div style="text-align: center; padding: 40px; color: #666;">Por favor, faça login para ver suas receitas.</div>`;
            totalRecebidoEl.textContent = 'R$ 0,00';
            aReceberEl.textContent = 'R$ 0,00';
        }
    });

    // Chame carregarReceitas() no DOMContentLoaded
    document.addEventListener('DOMContentLoaded', carregarReceitas);
});