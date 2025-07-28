// NÃO inicialize o Firebase aqui! Ele já está inicializado no home.html.
// --- DEBUG: Firebase inicialização ---
console.log('--- DEBUG INÍCIO HOME ---');
console.log('firebase.apps:', firebase.apps);
console.log('firebase.auth().currentUser:', firebase.auth().currentUser);

// Verifique se a configuração do Firebase está igual à da index.html
if (!firebase.apps.length) {
    console.log('Firebase não inicializado na Home.'); // Isso não deveria acontecer
} else {
    console.log('Firebase já estava inicializado na Home.');
}

// Verifique cookies e localStorage
console.log('localStorage:', window.localStorage);
console.log('document.cookie:', document.cookie);

document.addEventListener('DOMContentLoaded', function() {
    console.log('Página Home carregada. Verificando autenticação...');

    const auth = firebase.auth();
    const db = firebase.firestore();

    const loadingOverlay = document.getElementById('loading-overlay');
    const containerApp = document.querySelector('.container-app');

    auth.onAuthStateChanged(function(user) {
        console.log("Resultado do onAuthStateChanged:", user);
        if (user) {
            console.log('Usuário autenticado:', user.uid);
            if(loadingOverlay) loadingOverlay.style.display = 'none';
            if(containerApp) containerApp.style.display = 'block';
            inicializarComponentes(user);
        } else {
            console.log('Usuário não autenticado. Permanece na página Home.');
            console.log('firebase.auth().currentUser dentro do onAuthStateChanged:', firebase.auth().currentUser);
            // Feedback visual usando popup
            if (typeof mostrarPopup === 'function') {
                mostrarPopup('Você não está autenticado. Faça login para acessar seus dados.');
            } else {
                alert('Você não está autenticado. Faça login para acessar seus dados.');
            }
            if(loadingOverlay) loadingOverlay.style.display = 'none';
            if(containerApp) containerApp.style.display = 'none';
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

        carregarContas(userId);
        carregarCartoes(userId);
        carregarReceitas(userId);
        carregarDespesas(userId);
        carregarReceitasPorCategoria(userId);
        carregarDespesasPorCategoria(userId);
        calcularSaldoTotal(userId);
    }

    // Buscar contas
    function carregarContas(userId) {
        firebase.firestore().collection('contas')
            .where('userId', '==', userId)
            .get()
            .then(snapshot => {
                // Atualize o DOM com as contas
                console.log('Contas:', snapshot.docs.map(doc => doc.data()));
                // ...atualize container-contas-home...
            });
    }

    // Buscar cartões de crédito
    function carregarCartoes(userId) {
        firebase.firestore().collection('cartoes')
            .where('userId', '==', userId)
            .get()
            .then(snapshot => {
                console.log('Cartões de crédito:', snapshot.docs.map(doc => doc.data()));
                // ...atualize DOM...
            });
    }

    // Buscar receitas
    function carregarReceitas(userId) {
        firebase.firestore().collection('receitas')
            .where('userId', '==', userId)
            .get()
            .then(snapshot => {
                const receitas = snapshot.docs.map(doc => doc.data());
                console.log('Receitas do usuário:', userId, receitas);

                // Atualize o valor total das receitas
                const totalReceitas = receitas.reduce((sum, r) => sum + (Number(r.valor) || 0), 0);
                const receitasEl = document.querySelector('.valor-receitas');
                if (receitasEl) receitasEl.textContent = `R$ ${totalReceitas.toLocaleString('pt-BR', {minimumFractionDigits:2})}`;

                // Exiba as receitas em uma lista na tela
                const container = document.getElementById('container-receitas-home');
                if (container) {
                    if (receitas.length === 0) {
                        container.innerHTML = '<p>Nenhuma receita encontrada.</p>';
                    } else {
                        container.innerHTML = receitas.map(r => `
                            <div class="receita-item">
                                <strong>${r.categoria || 'Sem categoria'}</strong> - 
                                ${r.descricao || ''} 
                                <span style="float:right;">R$ ${Number(r.valor).toLocaleString('pt-BR', {minimumFractionDigits:2})}</span>
                            </div>
                        `).join('');
                    }
                }
            })
            .catch(error => {
                console.error('Erro ao buscar receitas:', error);
                // Feedback visual se necessário
                const container = document.getElementById('container-receitas-home');
                if (container) container.innerHTML = '<p>Erro ao carregar receitas.</p>';
            });
    }

    // Buscar despesas
    function carregarDespesas(userId) {
        firebase.firestore().collection('despesas')
            .where('userId', '==', userId)
            .get()
            .then(snapshot => {
                console.log('Despesas:', snapshot.docs.map(doc => doc.data()));
                // ...atualize DOM...
            });
    }

    // Seleciona o mês atual ao carregar
    const seletorMes = document.querySelector('.seletor-mes');
    if (seletorMes) {
        const hoje = new Date();
        seletorMes.selectedIndex = hoje.getMonth();
    }
});

// Função para receitas por categoria com gráfico
function carregarReceitasPorCategoria(userId) {
    firebase.firestore().collection('receitas')
        .where('userId', '==', userId)
        .get()
        .then(snapshot => {
            const receitas = snapshot.docs.map(doc => doc.data());
            // Filtra pelo mês atual
            const hoje = new Date();
            const mesAtual = hoje.getMonth() + 1;
            const anoAtual = hoje.getFullYear();
            const receitasMes = receitas.filter(r => {
                if (!r.data) return false;
                const [dia, mes, ano] = r.data.split('/');
                return Number(mes) === mesAtual && Number(ano) === anoAtual;
            });

            // Agrupa por categoria
            const categorias = {};
            receitasMes.forEach(r => {
                const cat = r.categoria || 'Sem categoria';
                categorias[cat] = (categorias[cat] || 0) + (Number(r.valor) || 0);
            });

            // Dados para o gráfico
            const labels = Object.keys(categorias);
            const valores = Object.values(categorias);

            // Atualiza gráfico se houver dados
            const graficoEl = document.getElementById('grafico-receitas-categoria');
            if (graficoEl && labels.length > 0) {
                graficoEl.style.display = 'block';
                new Chart(graficoEl, {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: valores,
                            backgroundColor: [
                                '#21C25E', '#FFB800', '#FF5A5F', '#007AFF', '#A259FF', '#FF7A00'
                            ]
                        }]
                    },
                    options: {
                        responsive: true,
                        legend: { display: false }
                    }
                });
                document.getElementById('cartao-estado-ativo-receitas').style.display = 'block';
                document.getElementById('cartao-estado-vazio-receitas').style.display = 'none';
                // Atualiza total
                const total = valores.reduce((a, b) => a + b, 0);
                const totalEl = document.getElementById('valor-total-receitas');
                if (totalEl) totalEl.textContent = `R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits:2})}`;
            } else {
                document.getElementById('cartao-estado-ativo-receitas').style.display = 'none';
                document.getElementById('cartao-estado-vazio-receitas').style.display = 'block';
            }
        });
}

// Função para despesas por categoria com gráfico
function carregarDespesasPorCategoria(userId) {
    firebase.firestore().collection('despesas')
        .where('userId', '==', userId)
        .get()
        .then(snapshot => {
            const despesas = snapshot.docs.map(doc => doc.data());
            // Filtra pelo mês atual
            const hoje = new Date();
            const mesAtual = hoje.getMonth() + 1;
            const anoAtual = hoje.getFullYear();
            const despesasMes = despesas.filter(d => {
                if (!d.data) return false;
                const [dia, mes, ano] = d.data.split('/');
                return Number(mes) === mesAtual && Number(ano) === anoAtual;
            });

            // Agrupa por categoria
            const categorias = {};
            despesasMes.forEach(d => {
                const cat = d.categoria || 'Sem categoria';
                categorias[cat] = (categorias[cat] || 0) + (Number(d.valor) || 0);
            });

            // Dados para o gráfico
            const labels = Object.keys(categorias);
            const valores = Object.values(categorias);

            // Atualiza gráfico se houver dados
            const graficoEl = document.getElementById('grafico-despesas-categoria');
            if (graficoEl && labels.length > 0) {
                graficoEl.style.display = 'block';
                new Chart(graficoEl, {
                    type: 'doughnut',
                    data: {
                        labels: labels,
                        datasets: [{
                            data: valores,
                            backgroundColor: [
                                '#FF5A5F', '#FFB800', '#21C25E', '#007AFF', '#A259FF', '#FF7A00'
                            ]
                        }]
                    },
                    options: {
                        responsive: true,
                        legend: { display: false }
                    }
                });
                document.getElementById('cartao-estado-ativo-categorias').style.display = 'block';
                document.getElementById('cartao-estado-vazio-categorias').style.display = 'none';
                // Atualiza total
                const total = valores.reduce((a, b) => a + b, 0);
                const totalEl = document.getElementById('valor-total-despesas');
                if (totalEl) totalEl.textContent = `R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits:2})}`;
            } else {
                document.getElementById('cartao-estado-ativo-categorias').style.display = 'none';
                document.getElementById('cartao-estado-vazio-categorias').style.display = 'block';
            }
        });
}

// Calcular saldo total
function calcularSaldoTotal(userId) {
    Promise.all([
        firebase.firestore().collection('receitas').where('userId', '==', userId).get(),
        firebase.firestore().collection('despesas').where('userId', '==', userId).get()
    ]).then(([receitasSnap, despesasSnap]) => {
        const receitas = receitasSnap.docs.map(doc => doc.data());
        const despesas = despesasSnap.docs.map(doc => doc.data());
        const totalReceitas = receitas.reduce((sum, r) => sum + (Number(r.valor) || 0), 0);
        const totalDespesas = despesas.reduce((sum, d) => sum + (Number(d.valor) || 0), 0);
        const saldo = totalReceitas - totalDespesas;
        console.log('Saldo total:', saldo);

        // Atualize o DOM
        const saldoEl = document.querySelector('.valor-saldo');
        if (saldoEl) saldoEl.textContent = `R$ ${saldo.toLocaleString('pt-BR', {minimumFractionDigits:2})}`;
    });
}
console.log('--- DEBUG FIM HOME ---');