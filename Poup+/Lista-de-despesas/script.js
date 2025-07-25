document.addEventListener('DOMContentLoaded', function() {
    console.log('Página Minhas Despesas carregada');

    const despesasList = document.getElementById('despesas-list');
    const popupConfirmacao = document.getElementById('popup-confirmacao');
    const popupCancelar = document.getElementById('popup-cancelar');
    const popupExcluir = document.getElementById('popup-excluir');
    const totalGastoEl = document.getElementById('total-gasto');
    const aPagarEl = document.getElementById('a-pagar');
    const filtroPeriodo = document.getElementById('filtro-periodo'); // Ensure this element exists
    const filtroCategoria = document.getElementById('filtro-categoria'); // Ensure this element exists
    let despesaSelecionada = null;
    let despesasCache = [];

    function obterDespesas() {
        try {
            // Buscar nas transações unificadas primeiro
            const transacoes = JSON.parse(localStorage.getItem('transacoes')) || [];
            const despesasTransacoes = transacoes.filter(t => t.tipo === 'despesa');
            // Buscar no localStorage antigo de despesas
            const despesasAntigas = JSON.parse(localStorage.getItem('despesas')) || [];
            // Combinar ambas as fontes
            const todasDespesas = [...despesasTransacoes, ...despesasAntigas];
            return todasDespesas;
        } catch (e) {
            return [];
        }
    }

    function calcularTotais(despesas) {
        let totalGasto = 0;
        let aPagar = 0;
        despesas.forEach(despesa => {
            const valor = despesa.valor ? parseFloat(despesa.valor.replace('R$ ', '').replace(/\./g, '').replace(',', '.')) : 0;
            if (despesa.pago) {
                totalGasto += valor;
            } else {
                aPagar += valor;
            }
        });
        totalGastoEl.textContent = `R$ ${totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        aPagarEl.textContent = `R$ ${aPagar.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }

    function obterIconePorCategoria(categoria) {
        const icones = {
            'alimentacao': 'restaurant',
            'alimentação': 'restaurant',
            'transporte': 'directions_car',
            'moradia': 'home',
            'saude': 'local_hospital',
            'saúde': 'local_hospital',
            'educacao': 'school',
            'educação': 'school',
            'lazer': 'sports_esports',
            'compras': 'shopping_cart',
            'outros': 'category'
        };
        return icones[categoria?.toLowerCase()] || 'category';
    }

    function filtrarDespesas(despesas) {
        let periodo = filtroPeriodo ? filtroPeriodo.value : 'mes';
        let categoria = filtroCategoria ? filtroCategoria.value : 'todas';

        // Filtro por categoria
        let filtradas = despesas;
        if (categoria && categoria !== 'todas') {
            filtradas = filtradas.filter(d => (d.categoria || '').toLowerCase() === categoria.toLowerCase());
        }

        // Filtro por período (apenas mês atual)
        if (periodo === 'mes') {
            const hoje = new Date();
            filtradas = filtradas.filter(d => {
                if (!d.data) return false;
                // Aceita formatos dd/mm/yyyy ou yyyy-mm-dd
                let partes = d.data.includes('/') ? d.data.split('/') : d.data.split('-');
                let mes, ano;
                if (partes.length === 3) {
                    if (d.data.includes('/')) {
                        mes = parseInt(partes[1], 10);
                        ano = parseInt(partes[2], 10);
                    } else {
                        mes = parseInt(partes[1], 10);
                        ano = parseInt(partes[0], 10);
                    }
                    return mes === (hoje.getMonth() + 1) && ano === hoje.getFullYear();
                }
                return false;
            });
        }
        // Outros filtros podem ser implementados aqui (hoje, semana, todos)
        return filtradas;
    }

    function calcularTotalDespesasMesAtual(despesas) {
        // Seletor de mês (se existir)
        const seletorMes = document.querySelector('.seletor-mes');
        let mesAtual = seletorMes ? seletorMes.selectedIndex : new Date().getMonth();
        let anoAtual = new Date().getFullYear();

        let totalMes = 0;
        despesas.forEach(despesa => {
            if (!despesa.data) return;
            let partes = despesa.data.includes('/') ? despesa.data.split('/') : despesa.data.split('-');
            let mes, ano;
            if (partes.length === 3) {
                if (despesa.data.includes('/')) {
                    mes = parseInt(partes[1], 10) - 1;
                    ano = parseInt(partes[2], 10);
                } else {
                    mes = parseInt(partes[1], 10) - 1;
                    ano = parseInt(partes[0], 10);
                }
                if (mes === mesAtual && ano === anoAtual) {
                    const valor = despesa.valor ? parseFloat(despesa.valor.replace('R$ ', '').replace(/\./g, '').replace(',', '.')) : 0;
                    totalMes += valor;
                }
            }
        });
        console.log('Total de despesas do mês:', totalMes);
        const totalMesEl = document.getElementById('total-gasto-mes');
        if (totalMesEl) {
            totalMesEl.textContent = `R$ ${totalMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
        }
        return totalMes;
    }

    function carregarDespesas() {
        const despesas = obterDespesas();
        despesasList.innerHTML = '';
        
        if (despesas.length === 0) {
            despesasList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #666;">
                    <span class="material-icons-round" style="font-size: 48px; margin-bottom: 16px;">receipt_long</span>
                    <p>Nenhuma despesa cadastrada ainda.</p>
                    <p style="font-size: 0.9rem; margin-top: 8px;">Clique em "Nova Despesa" para começar.</p>
                </div>
            `;
            calcularTotais([]);
            return;
        }
        
        despesas.forEach((despesa, index) => {
            const nome = despesa.descricao || 'Despesa sem nome';
            const conta = despesa.conta || despesa.carteira || 'Conta não especificada';
            const categoria = despesa.categoria || 'Categoria não especificada';
            const data = despesa.data || 'Data não especificada';
            const valor = despesa.valor ? despesa.valor.replace('R$ ', '').replace(/\./g, '').replace(',', '.') : '0.00';
            const valorFormatado = parseFloat(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
            const iconeCategoria = 'shopping_cart';

            const despesaItem = document.createElement('div');
            despesaItem.className = 'despesa-item';
            despesaItem.innerHTML = `
                <div class="despesa-icone">
                    <span class="material-icons-round">${iconeCategoria}</span>
                </div>
                <div class="despesa-info">
                    <span class="despesa-nome">${nome}</span>
                    <span class="despesa-detalhes">Conta: ${conta} • ${categoria} • ${data}</span>
                </div>
                <div class="despesa-acoes">
                    <span class="despesa-valor">- R$ ${valorFormatado}</span>
                    <button class="botao-excluir" onclick="confirmarExclusao(${index})">
                        <span class="material-icons-round">delete</span>
                    </button>
                </div>
            `;
            despesasList.appendChild(despesaItem);
        });

        calcularTotais(despesas);
    }

    function confirmarExclusao(index) {
        despesaSelecionada = index;
        popupConfirmacao.style.display = 'flex';
        console.log(`Despesa selecionada para exclusão: Index ${index}`);
    }

    // Tornar função global para ser acessível no HTML
    window.confirmarExclusao = confirmarExclusao;

    // Event listeners para o popup
    if (popupCancelar) {
        popupCancelar.addEventListener('click', function () {
            despesaSelecionada = null;
            popupConfirmacao.style.display = 'none';
        });
    }

    if (popupExcluir) {
        popupExcluir.addEventListener('click', function () {
            if (despesaSelecionada !== null) {
                // Buscar nas transações unificadas primeiro
                let transacoes = JSON.parse(localStorage.getItem('transacoes')) || [];
                const despesasTransacoes = transacoes.filter(t => t.tipo === 'despesa');
                
                // Buscar no localStorage antigo de despesas
                let despesasAntigas = JSON.parse(localStorage.getItem('despesas')) || [];
                
                const todasDespesas = [...despesasTransacoes, ...despesasAntigas];
                
                if (despesaSelecionada >= 0 && despesaSelecionada < todasDespesas.length) {
                    const despesaParaExcluir = todasDespesas[despesaSelecionada];
                    
                    // Se a despesa tem ID (nova estrutura), remover das transações
                    if (despesaParaExcluir.id) {
                        transacoes = transacoes.filter(t => t.id !== despesaParaExcluir.id);
                        localStorage.setItem('transacoes', JSON.stringify(transacoes));
                    } else {
                        // Se não tem ID (estrutura antiga), remover do localStorage de despesas
                        const indexNaListaAntiga = despesasAntigas.findIndex(d => 
                            d.descricao === despesaParaExcluir.descricao && 
                            d.valor === despesaParaExcluir.valor && 
                            d.data === despesaParaExcluir.data
                        );
                        if (indexNaListaAntiga !== -1) {
                            despesasAntigas.splice(indexNaListaAntiga, 1);
                            localStorage.setItem('despesas', JSON.stringify(despesasAntigas));
                        }
                    }
                    
                    carregarDespesas();
                    console.log(`Despesa de índice ${despesaSelecionada} excluída`);
                }
            }
            despesaSelecionada = null;
            popupConfirmacao.style.display = 'none';
        });
    }

    // Event listener para o botão Nova Despesa
    const botaoNovaDespesa = document.getElementById('botao-nova-despesa');
    if (botaoNovaDespesa) {
        botaoNovaDespesa.addEventListener('click', function () {
            console.log('Botão Nova Despesa clicado');
            window.location.href = '../Nova-Despesa/Nova-Despesa.html';
        });
    }

    // Filtros
    if (filtroPeriodo) {
        filtroPeriodo.addEventListener('change', function() {
            const despesasFiltradas = filtrarDespesas(despesasCache);
            exibirDespesas(despesasFiltradas);
        });
    } else {
        console.warn('Elemento filtroPeriodo não encontrado no DOM.');
    }

    if (filtroCategoria) {
        filtroCategoria.addEventListener('change', function() {
            const despesasFiltradas = filtrarDespesas(despesasCache);
            exibirDespesas(despesasFiltradas);
        });
    } else {
        console.warn('Elemento filtroCategoria não encontrado no DOM.');
    }

    // Inicializar carregamento de despesas
    carregarDespesas();

    /**
     * Exibe as despesas na lista com base nos filtros selecionados.
     */
    function exibirDespesas() {
        const filtroPeriodo = document.getElementById('filtro-periodo').value;
        const filtroCategoria = document.getElementById('filtro-categoria').value;
        const despesasList = document.getElementById('despesas-list');

        // Limpar a lista de despesas
        despesasList.innerHTML = '';

        // Obter despesas do localStorage
        let despesas = [];
        try {
            despesas = JSON.parse(localStorage.getItem('transacoes')) || [];
        } catch (e) {
            console.error('Erro ao carregar despesas:', e);
        }

        // Filtrar despesas por período e categoria
        const despesasFiltradas = despesas.filter(despesa => {
            if (despesa.tipo !== 'despesa') return false;

            // Filtrar por categoria
            if (filtroCategoria !== 'todas' && despesa.categoria !== filtroCategoria) return false;

            // Filtrar por período
            const dataDespesa = new Date(despesa.data.split('/').reverse().join('-'));
            const hoje = new Date();
            if (filtroPeriodo === 'hoje') {
                return dataDespesa.toDateString() === hoje.toDateString();
            } else if (filtroPeriodo === 'semana') {
                const inicioSemana = new Date(hoje.setDate(hoje.getDate() - hoje.getDay()));
                const fimSemana = new Date(inicioSemana);
                fimSemana.setDate(fimSemana.getDate() + 6);
                return dataDespesa >= inicioSemana && dataDespesa <= fimSemana;
            } else if (filtroPeriodo === 'mes') {
                return dataDespesa.getMonth() === hoje.getMonth() && dataDespesa.getFullYear() === hoje.getFullYear();
            } else if (filtroPeriodo !== 'todos') {
                const mesSelecionado = [
                    'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho',
                    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
                ].indexOf(filtroPeriodo);
                return dataDespesa.getMonth() === mesSelecionado;
            }

            return true;
        });

        // Renderizar despesas filtradas
        despesasFiltradas.forEach(despesa => {
            const despesaItem = document.createElement('div');
            despesaItem.className = 'despesa-item';
            despesaItem.innerHTML = `
                <span class="material-icons-round">${despesa.icone || 'category'}</span>
                <div class="despesa-detalhes">
                    <span class="despesa-descricao">${despesa.descricao}</span>
                    <span class="despesa-valor">${despesa.valor}</span>
                </div>
            `;
            despesasList.appendChild(despesaItem);
        });

        console.log('Despesas exibidas:', despesasFiltradas);
    }

    // Adicionar evento para filtros
    document.getElementById('filtro-periodo').addEventListener('change', exibirDespesas);
    document.getElementById('filtro-categoria').addEventListener('change', exibirDespesas);

    // Inicializar a exibição de despesas
    document.addEventListener('DOMContentLoaded', exibirDespesas);
});