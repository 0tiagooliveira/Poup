// Função utilitária para formatar valores em R$
function formatarValor(valor) {
    return valor.toLocaleString('pt-BR', { 
        style: 'currency', 
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}

// Remover dados de exemplo, usar apenas dados reais do localStorage
// Receitas e despesas são carregadas do localStorage
function obterTransacoes() {
    let receitas = [];
    let despesas = [];
    try {
        // Receitas do localStorage antigo
        receitas = JSON.parse(localStorage.getItem('receitas')) || [];
    } catch (e) {
        receitas = [];
    }
    try {
        // Despesas do localStorage antigo
        despesas = JSON.parse(localStorage.getItem('despesas')) || [];
    } catch (e) {
        despesas = [];
    }
    // Receitas e despesas do localStorage novo (transacoes)
    try {
        const transacoes = JSON.parse(localStorage.getItem('transacoes')) || [];
        const receitasTransacoes = transacoes.filter(t => t.tipo === 'receita');
        const despesasTransacoes = transacoes.filter(t => t.tipo === 'despesa');
        receitas = [...receitasTransacoes, ...receitas];
        despesas = [...despesasTransacoes, ...despesas];
    } catch (e) {
        // ignora se não houver transacoes
    }
    // Normalizar receitas
    const receitasFormatadas = receitas.map(r => ({
        data: r.data && r.data.length === 10 ? r.data.split('/').reverse().join('-') : r.data, // 'dd/mm/yyyy' -> 'yyyy-mm-dd'
        tipo: 'receita',
        nome: r.descricao || r.categoria || 'Receita',
        categoria: r.categoria || '',
        valor: parseFloat((r.valor || '0').replace('R$ ', '').replace(/\./g, '').replace(',', '.')),
        icone: 'payments'
    }));
    // Normalizar despesas
    const despesasFormatadas = despesas.map(d => ({
        data: d.data && d.data.length === 10 ? d.data.split('/').reverse().join('-') : d.data,
        tipo: 'despesa',
        nome: d.descricao || d.categoria || 'Despesa',
        categoria: d.categoria || '',
        valor: parseFloat((d.valor || '0').replace('R$ ', '').replace(/\./g, '').replace(',', '.')),
        icone: 'shopping_cart'
    }));
    return [...receitasFormatadas, ...despesasFormatadas];
}

const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function criarSeletorMes() {
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    let html = '<div class="transacoes-mes-selector">';
    html += '<button id="mes-anterior" class="botao-voltar"><span class="material-icons-round">chevron_left</span></button>';
    html += '<select id="seletor-mes">';
    meses.forEach((mes, i) => {
        html += `<option value="${i}" ${i === mesAtual ? 'selected' : ''}>${mes}</option>`;
    });
    html += '</select>';
    html += '<button id="mes-proximo" class="botao-voltar"><span class="material-icons-round">chevron_right</span></button>';
    html += '</div>';
    return html;
}

function criarResumo(saldo, balanco) {
    return `<div class="transacoes-resumo-container">
        <div class="transacoes-card-resumo">
            <span class="titulo-resumo">Saldo atual</span>
            <span class="valor-resumo" id="saldo-atual">${formatarValor(saldo)}</span>
        </div>
        <div class="transacoes-card-resumo">
            <span class="titulo-resumo">Balanço mensal</span>
            <span class="valor-resumo" id="balanco-mensal">${formatarValor(balanco)}</span>
        </div>
    </div>`;
}

function agruparTransacoesPorDia(transacoes) {
    const agrupadas = {};
    transacoes.forEach(t => {
        if (!agrupadas[t.data]) agrupadas[t.data] = [];
        agrupadas[t.data].push(t);
    });
    return agrupadas;
}

function formatarDataExtenso(data) {
    const dataObj = new Date(data);
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    return dataObj.toLocaleDateString('pt-BR', options);
}

function criarListaTransacoes(transacoes) {
    if (!transacoes.length) {
        return '<div class="sem-transacoes"><span class="material-icons-round">receipt</span><p>Nenhuma transação encontrada neste mês</p></div>';
    }
    
    const agrupadas = agruparTransacoesPorDia(transacoes);
    let html = '<div class="transacoes-lista-dia">';
    
    Object.keys(agrupadas).sort((a, b) => b.localeCompare(a)).forEach(data => {
        const dataFormatada = formatarDataExtenso(data);
        html += `<div class="transacoes-dia">
            <div class="transacoes-dia-titulo">${dataFormatada.charAt(0).toUpperCase() + dataFormatada.slice(1)}</div>
            <div class="transacoes-itens">`;
            
        agrupadas[data].forEach(t => {
            // Adiciona classe 'despesa' para cor vermelha
            html += `<div class="transacao-item ${t.tipo}${t.tipo === 'despesa' ? ' despesa-vermelha' : ''}">
                <div class="transacao-icone${t.tipo === 'despesa' ? ' despesa-vermelha' : ''}">
                    <span class="material-icons-round">${t.icone}</span>
                </div>
                <div class="transacao-info">
                    <span class="transacao-nome">${t.nome}</span>
                    <span class="transacao-categoria">${t.categoria}</span>
                </div>
                <span class="transacao-valor${t.tipo === 'despesa' ? ' despesa-vermelha' : ''}">${t.tipo === 'despesa' ? '-' : ''}${formatarValor(t.valor)}</span>
            </div>`;
        });
        
        html += '</div></div>';
    });
    
    html += '</div>';
    return html;
}

function atualizarTelaTransacoes() {
    // Filtros de mês
    const seletorMes = document.getElementById('seletor-mes');
    const mesSelecionado = seletorMes ? parseInt(seletorMes.value) : (new Date()).getMonth();
    const todasTransacoes = obterTransacoes();

    // Log todas as transações carregadas
    console.log('Todas as transações carregadas:', todasTransacoes);

    const transacoesFiltradas = todasTransacoes.filter(t => {
        const dataObj = new Date(t.data);
        return dataObj.getMonth() === mesSelecionado;
    });

    // Log transações filtradas do mês selecionado
    console.log(`Transações do mês (${mesSelecionado}):`, transacoesFiltradas);

    // Calculo de saldo atual e balanço mensal
    let saldo = 0;
    let balanco = 0;
    todasTransacoes.forEach(t => {
        if (t.tipo === 'receita') saldo += t.valor;
        else saldo -= t.valor;
    });
    transacoesFiltradas.forEach(t => {
        if (t.tipo === 'receita') balanco += t.valor;
        else balanco -= t.valor;
    });

    document.getElementById('transacoes-resumo').innerHTML = criarResumo(saldo, balanco);
    document.getElementById('transacoes-lista').innerHTML = criarListaTransacoes(transacoesFiltradas);
}

// Evento para voltar
function configurarBotaoVoltar() {
    const botaoVoltar = document.querySelector('.cabecalho .botao-voltar');
    if (botaoVoltar) {
        botaoVoltar.addEventListener('click', () => {
            // Simula voltar para a página anterior
            console.log('Voltar para a página anterior');
        });
    }
}

// Evento para nova transação
function configurarBotaoNovaTransacao() {
    const botaoNovaTransacao = document.getElementById('botao-nova-transacao');
    if (botaoNovaTransacao) {
        botaoNovaTransacao.addEventListener('click', () => {
            // Simula abrir formulário para nova transação
            console.log('Abrir formulário de nova transação');
        });
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    // Insere seletor de mês
    document.getElementById('transacoes-mes').innerHTML = criarSeletorMes();
    
    // Insere containers de resumo e lista
    document.getElementById('transacoes-resumo').innerHTML = criarResumo(0, 0);
    document.getElementById('transacoes-lista').innerHTML = criarListaTransacoes([]);
    
    // Atualiza a tela com os dados
    atualizarTelaTransacoes();
    
    // Configura eventos
    configurarBotaoVoltar();
    configurarBotaoNovaTransacao();
    
    // Eventos de mudança de mês
    document.getElementById('seletor-mes').addEventListener('change', atualizarTelaTransacoes);
    
    document.getElementById('mes-anterior').addEventListener('click', function() {
        const seletor = document.getElementById('seletor-mes');
        if (seletor.selectedIndex > 0) {
            seletor.selectedIndex--;
            seletor.dispatchEvent(new Event('change'));
        }
    });
    
    document.getElementById('mes-proximo').addEventListener('click', function() {
        const seletor = document.getElementById('seletor-mes');
        if (seletor.selectedIndex < meses.length - 1) {
            seletor.selectedIndex++;
            seletor.dispatchEvent(new Event('change'));
        }
    });
});