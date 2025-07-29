document.addEventListener('DOMContentLoaded', function() {
    console.log('Página Minhas Despesas carregada');

    // Firebase
    if (typeof firebase === "undefined" || !firebase.firestore) {
        console.error('Firebase não está disponível!');
        return;
    }
    const db = firebase.firestore();
    const auth = firebase.auth();

    const despesasListEl = document.getElementById('despesas-list');
    const totalGastoEl = document.getElementById('total-gasto');
    const aPagarEl = document.getElementById('a-pagar');

    function salvarDespesaFirebase(despesa, userId) {
        // Validação de categoria
        const categoriaInvalida = !despesa.categoria ||
            despesa.categoria === '-' ||
            despesa.categoria === 'Selecione uma categoria' ||
            despesa.categoria === 'category';

        // Validação de conta/carteira
        const contaInvalida = !despesa.carteira ||
            despesa.carteira === '-' ||
            despesa.carteira === 'Selecione uma conta';

        // Validação de descrição
        const descricaoInvalida = !despesa.descricao || despesa.descricao.trim().length < 2;

        // Validação de valor
        let valor = despesa.valor;
        if (typeof valor === 'string') {
            valor = valor.replace(/[^\d,.-]/g, '').replace(',', '.');
            valor = parseFloat(valor) || 0;
        } else {
            valor = Number(valor) || 0;
        }
        const valorInvalido = valor <= 0;

        if (categoriaInvalida) {
            mostrarPopupMensagem('Selecione uma categoria válida para a despesa.');
            return;
        }
        if (contaInvalida) {
            mostrarPopupMensagem('Selecione uma conta válida para a despesa.');
            return;
        }
        if (descricaoInvalida) {
            mostrarPopupMensagem('Preencha a descrição da despesa.');
            return;
        }
        if (valorInvalido) {
            mostrarPopupMensagem('Informe um valor maior que zero para a despesa.');
            return;
        }
        if (!userId) {
            console.error('[Firebase] Usuário não autenticado ao salvar despesa.');
            return;
        }

        // Monta objeto limpo para salvar
        const despesaParaSalvar = {
            categoria: despesa.categoria,
            carteira: despesa.carteira,
            valor: valor,
            descricao: despesa.descricao ? despesa.descricao.trim() : '',
            data: despesa.data,
            pago: despesa.pago !== false,
            tipo: 'despesa',
            userId: userId
        };

        firebase.firestore().collection('despesas').add(despesaParaSalvar)
            .then(() => {
                mostrarPopupMensagem('Despesa salva com sucesso!');
                setTimeout(() => {
                    window.location.href = '../Lista-de-despesas/Lista-de-despesas.html';
                }, 1200);
            })
            .catch(error => {
                console.error('[Firebase] Erro ao salvar despesa:', error);
                mostrarPopupMensagem('Erro ao salvar despesa.');
            });
    }

    function carregarDespesasFirebase(uid) {
        const despesasListEl = document.getElementById('despesas-list');
        if (!despesasListEl) return;
        despesasListEl.innerHTML = '<p style="text-align:center; color:#888; margin-top:32px;">Carregando despesas...</p>';
        console.log(`[Firebase] Buscando despesas para o usuário: ${uid}`);

        const db = firebase.firestore();
        // 1. Carregar todas as contas do usuário para mapear id -> nome
        db.collection('contas')
            .where('userId', '==', uid)
            .get()
            .then(contasSnap => {
                const contasMap = {};
                contasSnap.forEach(doc => {
                    const conta = doc.data();
                    contasMap[doc.id] = conta.nome || conta.descricao || doc.id;
                });

                // 2. Buscar despesas
                return db.collection('despesas')
                    .where('userId', '==', uid)
                    .get()
                    .then(snapshot => {
                        let despesas = [];
                        snapshot.forEach(doc => {
                            const despesa = doc.data();
                            despesa.id = doc.id;
                            despesas.push(despesa);
                        });

                        // Ordenação manual por data
                        despesas.sort((a, b) => {
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

                        renderizarDespesas(despesas, contasMap);
                    });
            })
            .catch(error => {
                despesasListEl.innerHTML = '<p style="color:#ef233c; text-align:center;">Erro ao carregar despesas.</p>';
                console.error('[Firebase] Erro ao buscar despesas/contas do Firestore:', error);
            });
    }

    // Função para salvar despesa no Firestore ao cadastrar nova despesa
    function salvarDespesaNoFirestore(despesa) {
        if (firebase && firebase.auth && firebase.firestore) {
            const user = firebase.auth().currentUser;
            if (user) {
                // Validação de categoria
                const categoriaInvalida = !despesa.categoria ||
                    despesa.categoria === '-' ||
                    despesa.categoria === 'Selecione uma categoria' ||
                    despesa.categoria === 'category';

                // Validação de valor
                let valor = despesa.valor;
                if (typeof valor === 'string') {
                    valor = valor.replace(/\./g, '').replace(',', '.');
                    valor = parseFloat(valor) || 0;
                } else {
                    valor = Number(valor) || 0;
                }
                const valorInvalido = valor <= 0;

                if (categoriaInvalida) {
                    mostrarPopupMensagem('Selecione uma categoria válida para a despesa.');
                    return;
                }
                if (valorInvalido) {
                    mostrarPopupMensagem('Informe um valor maior que zero para a despesa.');
                    return;
                }
                const despesaFirestore = {
                    ...despesa,
                    userId: user.uid
                };
                firebase.firestore().collection('despesas').add(despesaFirestore)
                    .then(() => {
                        console.log('[Firebase] Despesa salva no Firestore!');
                    })
                    .catch((error) => {
                        console.error('[Firebase] Erro ao salvar despesa:', error);
                    });
            } else {
                console.warn('[Firebase] Usuário não autenticado ao salvar despesa no Firestore.');
            }
        }
    }

    function renderizarDespesas(despesas, contasMap = {}) {
        const despesasListEl = document.getElementById('despesas-list');
        if (!despesasListEl) return;
        despesasListEl.innerHTML = '';
        console.log('[Render] Renderizando despesas...');

        if (!despesas || despesas.length === 0) {
            console.log('[Render] Nenhuma despesa encontrada.');
            despesasListEl.innerHTML = '<p style="text-align:center; color:#888; margin-top:32px;">Nenhuma despesa cadastrada.</p>';
            document.getElementById('total-gasto').textContent = 'R$ 0,00';
            document.getElementById('a-pagar').textContent = 'R$ 0,00';
            return;
        }

        let totalGasto = 0;
        let aPagar = 0;

        despesas.forEach(despesa => {
            // Conversão do valor
            let valor = despesa.valor;
            if (typeof valor === 'string') {
                valor = valor.replace(/[^\d,.-]/g, '').replace(',', '.');
                valor = parseFloat(valor) || 0;
            } else {
                valor = Number(valor) || 0;
            }

            // Categoria
            let categoria = despesa.categoria && despesa.categoria !== 'Selecione uma categoria'
                ? despesa.categoria
                : '<span style="color:#ef233c;font-weight:bold;">(Sem categoria)</span>';

            // Conta/carteira: se for id, mostra nome amigável
            let carteira = despesa.carteira;
            if (carteira && contasMap[carteira]) {
                carteira = contasMap[carteira];
            } else if (!carteira || carteira === 'Selecione uma conta') {
                carteira = '<span style="color:#ef233c;font-weight:bold;">(Sem conta)</span>';
            }

            const pago = despesa.pago !== false;
            if (pago) totalGasto += valor;
            else aPagar += valor;

            // Não renderiza despesas "sem categoria" e "sem conta" e valor 0
            if (
                (categoria.includes('(Sem categoria)') || carteira.includes('(Sem conta)')) &&
                (!despesa.descricao || despesa.descricao === '-' || despesa.descricao.trim() === '') &&
                valor === 0
            ) {
                return; // ignora lixo
            }

            const div = document.createElement('div');
            div.className = 'despesa-item';
            const iconeCategoria = obterIconePorCategoria(despesa.categoria);
            div.innerHTML = `
                <div class="despesa-icone">
                    <span class="material-icons-round">${iconeCategoria}</span>
                </div>
                <div class="despesa-info">
                    <span class="despesa-nome">${categoria}</span>
                    <div class="despesa-detalhes">
                        <span>${despesa.descricao ? despesa.descricao : '-'}</span>
                        <span class="despesa-data">${despesa.data || ''}</span>
                        <span style="color:#21C25E;font-weight:500;">${carteira}</span>
                    </div>
                </div>
                <span class="despesa-valor">${valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                <div class="despesa-acoes">
                    <button class="botao-editar" title="Editar" data-id="${despesa.id}">
                        <span class="material-icons-round">edit</span>
                    </button>
                    <button class="botao-excluir" title="Excluir" data-id="${despesa.id}">
                        <span class="material-icons-round">delete</span>
                    </button>
                </div>
            `;
            despesasListEl.appendChild(div);
        });

        document.getElementById('total-gasto').textContent = totalGasto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        document.getElementById('a-pagar').textContent = aPagar.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        // Eventos dos botões de editar/excluir
        document.querySelectorAll('.botao-editar').forEach(btn => {
            btn.onclick = function() {
                const id = this.getAttribute('data-id');
                window.location.href = `../Nova-Despesa/Nova-Despesa.html?id=${id}`;
            };
        });
        document.querySelectorAll('.botao-excluir').forEach(btn => {
            btn.onclick = function() {
                const id = this.getAttribute('data-id');
                mostrarPopupExcluirDespesa(id);
            };
        });
    }

    // Popup de confirmação de exclusão
    let despesaParaExcluirId = null;
    function mostrarPopupExcluirDespesa(id) {
        despesaParaExcluirId = id;
        document.getElementById('popup-confirmacao').style.display = 'flex';
    }
    document.getElementById('popup-cancelar').onclick = function() {
        document.getElementById('popup-confirmacao').style.display = 'none';
        despesaParaExcluirId = null;
    };
    document.getElementById('popup-excluir').onclick = function() {
        if (despesaParaExcluirId) {
            excluirDespesaFirebase(despesaParaExcluirId);
        }
        document.getElementById('popup-confirmacao').style.display = 'none';
        despesaParaExcluirId = null;
    };

    // Função para excluir despesa do Firestore
    function excluirDespesaFirebase(id) {
        if (!id) return;
        firebase.firestore().collection('despesas').doc(id).delete()
            .then(() => {
                carregarDespesasFirebase(firebase.auth().currentUser.uid);
            })
            .catch(err => {
                alert('Erro ao excluir despesa.');
            });
    }

    function obterIconePorCategoria(categoria) {
        const icones = {
            'cleaning_services': 'cleaning_services',
            'medical_services': 'medical_services',
            'psychology': 'psychology',
            'science': 'science',
            'visibility': 'visibility',
            'child_friendly': 'child_friendly'
        };
        return icones[categoria] || 'category';
    }

    function carregarDespesas() {
        const despesasListEl = document.getElementById('despesas-list');
        if (!despesasListEl) return;

        // Busca todas as transações e filtra apenas despesas
        const transacoes = JSON.parse(localStorage.getItem('transacoes')) || [];
        const despesas = transacoes.filter(t => t.tipo === 'despesa');

        despesasListEl.innerHTML = '';

        if (despesas.length === 0) {
            despesasListEl.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <span class="material-icons-round" style="font-size: 48px; margin-bottom: 16px;">receipt_long</span>
                    <p>Nenhuma despesa cadastrada ainda.</p>
                    <p style="font-size: 0.9rem; margin-top: 8px;">Clique em "Nova Despesa" para começar.</p>
                </div>
            `;
            return;
        }

        despesas.forEach(despesa => {
            const despesaItem = document.createElement('div');
            despesaItem.className = 'despesa-item';
            despesaItem.innerHTML = `
                <span class="material-icons-round">attach_money</span>
                <div class="despesa-detalhes">
                    <span class="despesa-descricao">${despesa.descricao || 'Despesa sem descrição'}</span>
                    <span class="despesa-valor">${despesa.valor || 'R$ 0,00'}</span>
                </div>
            `;
            despesasListEl.appendChild(despesaItem);
        });
    }

    auth.onAuthStateChanged(user => {
        if (user) {
            console.log('Usuário logado:', user.uid);
            carregarDespesasFirebase(user.uid);
        } else {
            console.log('Nenhum usuário logado.');
            despesasListEl.innerHTML = `<div style="text-align: center; padding: 40px; color: #666;">Por favor, faça login para ver suas despesas.</div>`;
            totalGastoEl.textContent = 'R$ 0,00';
            aPagarEl.textContent = 'R$ 0,00';
        }
    });

    // Chame carregarDespesas() no DOMContentLoaded
    document.addEventListener('DOMContentLoaded', carregarDespesas);

    document.getElementById('botao-nova-despesa').addEventListener('click', () => {
        window.location.href = '../Nova-Despesa/Nova-Despesa.html';
    });
});

// Adicione a função mostrarPopupMensagem se não existir:
function mostrarPopupMensagem(mensagem) {
    let popup = document.querySelector('.popup-mensagem');
    let texto = document.querySelector('.popup-texto');
    if (popup && texto) {
        texto.textContent = mensagem;
        popup.style.display = 'flex';
        popup.querySelector('.popup-botao').onclick = () => {
            popup.style.display = 'none';
        };
        setTimeout(() => {
            popup.style.display = 'none';
        }, 1200);
    }
}