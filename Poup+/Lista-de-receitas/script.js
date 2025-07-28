document.addEventListener('DOMContentLoaded', function() {
    console.log('Página Minhas Receitas carregada');

    const db = firebase.firestore();
    const receitasList = document.getElementById('receitas-list');
    const botaoNovaReceita = document.getElementById('botao-nova-receita');

    // Log para depuração
    console.log('firebase.auth().currentUser fora do callback:', firebase.auth().currentUser);

    // Botão Nova Receita
    if (botaoNovaReceita) {
        botaoNovaReceita.addEventListener('click', function() {
            window.location.href = '../Nova-Receita/Nova-Receita.html';
        });
    }

    // Sempre aguarde o callback do Firebase
    firebase.auth().onAuthStateChanged(function(user) {
        console.log('onAuthStateChanged user:', user);
        if (user) {
            console.log("Usuário autenticado:", user.uid);
            carregarReceitasDoUsuario(user.uid);
        } else {
            console.log("Nenhum usuário logado.");
            // Opcional: mostrar um aviso discreto, mas não bloquear a tela
        }
    });

    // Função para buscar e exibir receitas do usuário
    function carregarReceitasDoUsuario(userId) {
        db.collection('receitas')
            .where('userId', '==', userId)
            // Remova o orderBy para evitar erro de índice
            .get()
            .then(querySnapshot => {
                const receitas = [];
                querySnapshot.forEach(doc => {
                    receitas.push({ id: doc.id, ...doc.data() });
                });

                receitasList.innerHTML = '';

                if (receitas.length === 0) {
                    receitasList.innerHTML = `
                        <div style="text-align: center; padding: 40px; color: #666;">
                            <span class="material-icons-round" style="font-size: 48px; margin-bottom: 16px;">receipt_long</span>
                            <p>Você ainda não registrou uma receita.</p>
                            <p style="font-size: 0.9rem; margin-top: 8px;">Clique no botão "Nova receita" para começar.</p>
                        </div>
                    `;
                    return;
                }

                receitas.forEach((receita) => {
                    const nome = receita.descricao || 'Receita sem nome';
                    const conta = receita.conta || receita.carteira || 'Conta não especificada';
                    const categoria = receita.categoria || 'Outros';
                    const data = receita.data || 'Data não especificada';
                    const valor = receita.valor ? parseFloat(receita.valor.replace('R$ ', '').replace(/\./g, '').replace(',', '.')) : 0;
                    const valorFormatado = valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 });

                    const receitaItem = document.createElement('div');
                    receitaItem.className = 'receita-item';
                    receitaItem.innerHTML = `
                        <div class="receita-info">
                            <span class="receita-nome">${nome}</span>
                            <span class="receita-detalhes">Conta: ${conta} • ${categoria} • ${data}</span>
                        </div>
                        <div class="receita-valor">+ R$ ${valorFormatado}</div>
                    `;
                    receitasList.appendChild(receitaItem);
                });
            })
            .catch(error => {
                console.error('Erro ao buscar receitas:', error);
                if (receitasList) {
                    receitasList.innerHTML = '<p style="color:#ef233c;font-weight:600;">Erro ao carregar receitas.</p>';
                }
            });
    }
});