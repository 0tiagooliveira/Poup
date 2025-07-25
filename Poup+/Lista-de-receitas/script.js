document.addEventListener('DOMContentLoaded', function() {
    console.log('Página Minhas Receitas carregada');

    const receitasList = document.getElementById('receitas-list');
    const popupConfirmacao = document.getElementById('popup-confirmacao');
    const popupCancelar = document.getElementById('popup-cancelar');
    const popupExcluir = document.getElementById('popup-excluir');
    const totalRecebidoEl = document.getElementById('total-recebido');
    const aReceberEl = document.getElementById('a-receber');
    let receitaSelecionada = null;

    // Event Listeners
    document.getElementById('botao-nova-receita').addEventListener('click', function() {
        window.location.href = '../Nova-Receita/Nova-Receita.html';
    });

    function obterTransacoes() {
        let receitas = [];
        try {
            const transacoes = JSON.parse(localStorage.getItem('transacoes')) || [];
            const receitasTransacoes = transacoes.filter(t => t.tipo === 'receita');
            const receitasAntigas = JSON.parse(localStorage.getItem('receitas')) || [];
            receitas = [...receitasTransacoes, ...receitasAntigas];
        } catch (e) {
            receitas = [];
        }
        return { receitas };
    }

    function calcularTotais(receitas) {
        let totalRecebido = 0;
        let aReceber = 0;
        receitas.forEach(receita => {
            const valor = receita.valor ? parseFloat(receita.valor.replace('R$ ', '').replace(/\./g, '').replace(',', '.')) : 0;
            if (receita.recebido) {
                totalRecebido += valor;
            } else {
                aReceber += valor;
            }
        });
        totalRecebidoEl.textContent = `R$ ${totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        aReceberEl.textContent = `R$ ${aReceber.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }

    // Categorias padrão com ícones
    const categoriasPadrao = [
        { nome: 'Salário', icone: 'attach_money' },
        { nome: 'Freelance', icone: 'work' },
        { nome: 'Bônus', icone: 'card_giftcard' },
        { nome: 'Comissões', icone: 'trending_up' },
        { nome: 'Aluguel Recebido', icone: 'home' },
        { nome: 'Investimentos', icone: 'show_chart' },
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
        { nome: 'Rendimentos de Direitos Autorais', icone: 'library_books' }
    ];

    // Função para carregar categorias padrão no localStorage, se ainda não existirem
    function carregarCategoriasPadrao() {
        let categoriasExistentes = JSON.parse(localStorage.getItem('categoriasReceitas')) || [];
        if (categoriasExistentes.length === 0) {
            localStorage.setItem('categoriasReceitas', JSON.stringify(categoriasPadrao));
            console.log('Categorias padrão de receitas carregadas no localStorage.');
        }
    }

    // Atualize a função carregarTransacoes para usar as categorias padrão
    function carregarTransacoes() {
        const { receitas } = obterTransacoes();
        receitasList.innerHTML = '';

        if (receitas.length === 0) {
            receitasList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <span class="material-icons-round" style="font-size: 48px; margin-bottom: 16px;">receipt_long</span>
                    <p>Nenhuma receita cadastrada ainda.</p>
                    <p style="font-size: 0.9rem; margin-top: 8px;">Clique em "Nova Receita" para começar.</p>
                </div>
            `;
            calcularTotais([]);
            return;
        }

        const categoriasComIcones = JSON.parse(localStorage.getItem('categoriasReceitas')) || categoriasPadrao;

        receitas.forEach((receita, index) => {
            const nome = receita.descricao || 'Receita sem nome';
            const conta = receita.conta || receita.carteira || 'Conta não especificada';
            const categoria = receita.categoria || 'Outros';
            const data = receita.data || 'Data não especificada';
            const valor = receita.valor ? receita.valor.replace('R$ ', '').replace(/\./g, '').replace(',', '.') : '0.00';
            const valorFormatado = parseFloat(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            const categoriaEncontrada = categoriasComIcones.find(cat => cat.nome === categoria);
            const icone = categoriaEncontrada ? categoriaEncontrada.icone : 'paid';

            const receitaItem = document.createElement('div');
            receitaItem.className = 'receita-item';
            receitaItem.innerHTML = `
                <div class="receita-icone">
                    <span class="material-icons-round">${icone}</span>
                </div>
                <div class="receita-info">
                    <span class="receita-nome">${nome}</span>
                    <span class="receita-detalhes">Conta: ${conta} • ${categoria} • ${data}</span>
                </div>
                <div class="receita-acoes">
                    <span class="receita-valor">+ R$ ${valorFormatado}</span>
                    <button class="botao-excluir" onclick="confirmarExclusao(${index})">
                        <span class="material-icons-round">delete</span>
                    </button>
                </div>
            `;
            receitasList.appendChild(receitaItem);
        });

        calcularTotais(receitas);
    }

    function confirmarExclusao(index) {
        receitaSelecionada = index;
        popupConfirmacao.style.display = 'flex';
        console.log(`Receita selecionada para exclusão: Index ${index}`);
    }

    // Tornar função global
    window.confirmarExclusao = confirmarExclusao;

    popupCancelar.addEventListener('click', function () {
        receitaSelecionada = null;
        popupConfirmacao.style.display = 'none';
        console.log('Exclusão cancelada');
    });

    popupExcluir.addEventListener('click', function () {
        if (receitaSelecionada !== null) {
            // Buscar nas transações unificadas primeiro
            let transacoes = JSON.parse(localStorage.getItem('transacoes')) || [];
            const receitasTransacoes = transacoes.filter(t => t.tipo === 'receita');
            
            // Buscar no localStorage antigo de receitas
            let receitasAntigas = JSON.parse(localStorage.getItem('receitas')) || [];
            
            const todasReceitas = [...receitasTransacoes, ...receitasAntigas];
            
            if (receitaSelecionada >= 0 && receitaSelecionada < todasReceitas.length) {
                const receitaParaExcluir = todasReceitas[receitaSelecionada];
                
                // Se a receita tem ID (nova estrutura), remover das transações
                if (receitaParaExcluir.id) {
                    transacoes = transacoes.filter(t => t.id !== receitaParaExcluir.id);
                    localStorage.setItem('transacoes', JSON.stringify(transacoes));
                } else {
                    // Se não tem ID (estrutura antiga), remover do localStorage de receitas
                    const indexNaListaAntiga = receitasAntigas.findIndex(r => 
                        r.descricao === receitaParaExcluir.descricao && 
                        r.valor === receitaParaExcluir.valor && 
                        r.data === receitaParaExcluir.data
                    );
                    if (indexNaListaAntiga !== -1) {
                        receitasAntigas.splice(indexNaListaAntiga, 1);
                        localStorage.setItem('receitas', JSON.stringify(receitasAntigas));
                    }
                }
                
                carregarTransacoes();
                console.log(`Receita de índice ${receitaSelecionada} excluída`);
            }
        }
        receitaSelecionada = null;
        popupConfirmacao.style.display = 'none';
    });

    // Inicializar categorias padrão e carregar receitas
    carregarCategoriasPadrao();
    carregarTransacoes();
});