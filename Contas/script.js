document.addEventListener('DOMContentLoaded', function() {
    console.log('Página Minhas Contas carregada');

    const contasList = document.getElementById('contas-list');
    const popupConfirmacao = document.getElementById('popup-confirmacao');
    const popupCancelar = document.getElementById('popup-cancelar');
    const popupExcluir = document.getElementById('popup-excluir');
    const totalContasEl = document.getElementById('total-contas');
    const totalContasVinculadasEl = document.getElementById('total-contas-vinculadas');
    let contaSelecionada = null;

    // Event Listeners
    document.getElementById('botao-nova-conta').addEventListener('click', function() {
        console.log('Botão "Nova Conta" clicado');
        window.location.href = '../Nova-conta/Nova-conta.html';
    });

    function obterContas() {
        console.log('Obtendo contas do localStorage...');
        let contas = [];
        try {
            contas = JSON.parse(localStorage.getItem('contasBancarias')) || [];
            console.log(`Contas carregadas: ${contas.length}`, contas);
        } catch (e) {
            console.error('Erro ao carregar contas do localStorage:', e);
            contas = [];
        }
        return contas;
    }

    function calcularTotais(contas) {
        console.log('Calculando totais das contas...');
        let totalContas = 0;
        let totalVinculadas = contas.length;

        contas.forEach(conta => {
            const saldo = conta.saldo ? parseFloat(conta.saldo.replace('R$ ', '').replace(/\./g, '').replace(',', '.')) : 0;
            totalContas += saldo;
        });

        totalContasEl.textContent = `R$ ${totalContas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        totalContasVinculadasEl.textContent = totalVinculadas;
        console.log(`Total em contas: R$ ${totalContas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
        console.log(`Total de contas vinculadas: ${totalVinculadas}`);
    }

    function carregarContas() {
        console.log('Carregando contas...');
        const contas = obterContas();
        contasList.innerHTML = '';
        
        if (contas.length === 0) {
            console.log('Nenhuma conta cadastrada.');
            contasList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <span class="material-icons-round" style="font-size: 48px; margin-bottom: 16px;">account_balance</span>
                    <p>Nenhuma conta cadastrada ainda.</p>
                    <p style="font-size: 0.9rem; margin-top: 8px;">Clique em "Nova Conta" para começar.</p>
                </div>
            `;
            calcularTotais([]);
            return;
        }
        
        contas.forEach((conta, index) => {
            console.log(`Carregando conta ${index + 1}:`, conta);
            const nome = conta.descricao || 'Conta sem nome';
            const tipo = conta.tipo || 'Tipo não especificado';
            const saldo = conta.saldo ? conta.saldo.replace('R$ ', '').replace(/\./g, '').replace(',', '.') : '0.00';
            const saldoFormatado = parseFloat(saldo).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            const icone = 'account_balance';
    
            const contaItem = document.createElement('div');
            contaItem.className = 'conta-item';
            contaItem.innerHTML = `
                <div class="conta-icone">
                    <span class="material-icons-round">${icone}</span>
                </div>
                <div class="conta-info">
                    <span class="conta-nome">${nome}</span>
                    <span class="conta-detalhes">Tipo: ${tipo}</span>
                </div>
                <div class="conta-acoes">
                    <span class="conta-saldo">R$ ${saldoFormatado}</span>
                    <button class="botao-excluir" onclick="confirmarExclusao(${index})">
                        <span class="material-icons-round">delete</span>
                    </button>
                </div>
            `;
            contasList.appendChild(contaItem);
        });
        
        calcularTotais(contas);
    }

    function confirmarExclusao(index) {
        console.log(`Conta selecionada para exclusão: Índice ${index}`);
        contaSelecionada = index;
        popupConfirmacao.style.display = 'flex';
    }

    // Tornar função global
    window.confirmarExclusao = confirmarExclusao;

    popupCancelar.addEventListener('click', function () {
        console.log('Exclusão cancelada.');
        contaSelecionada = null;
        popupConfirmacao.style.display = 'none';
    });

    popupExcluir.addEventListener('click', function () {
        if (contaSelecionada !== null) {
            console.log(`Excluindo conta de índice ${contaSelecionada}...`);
            let contas = obterContas();
            if (contaSelecionada >= 0 && contaSelecionada < contas.length) {
                contas.splice(contaSelecionada, 1);
                localStorage.setItem('contasBancarias', JSON.stringify(contas));
                console.log('Conta excluída com sucesso.');
                carregarContas();
            }
        }
        contaSelecionada = null;
        popupConfirmacao.style.display = 'none';
    });

    // Inicializar carregamento de contas
    carregarContas();
});

document.addEventListener('DOMContentLoaded', () => {
    const listaContasEl = document.getElementById('lista-contas');
    const botaoNovaConta = document.getElementById('botao-nova-conta');

    if (!firebase || !firebase.auth || !firebase.firestore) {
        console.error('Firebase não está configurado corretamente.');
        listaContasEl.innerHTML = '<p>Erro de configuração. Tente novamente mais tarde.</p>';
        return;
    }

    const auth = firebase.auth();
    const db = firebase.firestore();

    auth.onAuthStateChanged(user => {
        if (user) {
            console.log('Usuário autenticado, carregando contas...');
            carregarContas(user.uid);
        } else {
            console.log('Nenhum usuário logado.');
            listaContasEl.innerHTML = '<p>Faça login para ver suas contas.</p>';
        }
    });

    function carregarContas(uid) {
        listaContasEl.innerHTML = '<p>Carregando...</p>';

        db.collection('contas').where('userId', '==', uid).orderBy('criadoEm', 'desc').get()
            .then(snapshot => {
                if (snapshot.empty) {
                    listaContasEl.innerHTML = '<p>Nenhuma conta cadastrada ainda.</p>';
                    return;
                }

                listaContasEl.innerHTML = ''; // Limpa a lista antes de renderizar
                const contas = [];
                snapshot.forEach(doc => {
                    contas.push({ id: doc.id, ...doc.data() });
                });
                renderizarContas(contas);
            })
            .catch(error => {
                console.error('Erro ao buscar contas:', error);
                listaContasEl.innerHTML = '<p>Ocorreu um erro ao carregar suas contas.</p>';
            });
    }

    function renderizarContas(contas) {
        contas.forEach(conta => {
            const saldoFormatado = (conta.saldo || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            const contaItem = document.createElement('div');
            contaItem.className = 'conta-item';
            contaItem.innerHTML = `
                <div class="conta-icone" style="background-color: ${conta.cor || '#ccc'};">
                    <span>${conta.icone || '?'}</span>
                </div>
                <div class="conta-info">
                    <span class="conta-nome">${conta.nome || 'Sem nome'}</span>
                    <span class="conta-tipo">${conta.tipo || 'Não especificado'}</span>
                </div>
                <div class="conta-saldo">
                    <span>${saldoFormatado}</span>
                </div>
            `;
            listaContasEl.appendChild(contaItem);
        });
    }

    if (botaoNovaConta) {
        botaoNovaConta.addEventListener('click', () => {
            window.location.href = '../Nova-conta/Nova-conta.html';
        });
    }
});