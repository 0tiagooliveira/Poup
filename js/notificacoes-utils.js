// ===== UTILITÁRIOS DE NOTIFICAÇÕES GLOBAIS =====
// Este arquivo pode ser incluído em qualquer página para usar o sistema de notificações da Home

// Função para verificar se o sistema de notificações está disponível
function verificarSistemaNotificacoes() {
    return typeof window !== 'undefined' && 
           window.parent && 
           window.parent.notificacoesManager && 
           typeof window.parent.notificacoesManager.criarNotificacao === 'function';
}

// Função para criar notificação de nova conta
window.criarNotificacaoNovaConta = async function(conta) {
    try {
        // Se estamos na Home, usar o sistema local
        if (window.notificacoesManager) {
            await window.notificacoesManager.criarNotificacao({
                tipo: 'conta_criada',
                titulo: 'Nova conta adicionada',
                mensagem: `A conta "${conta.nome || conta.banco || 'Nova conta'}" foi criada com sucesso!`,
                icone: 'account_balance',
                dados: { contaId: conta.id }
            });
        }
        // Se estamos em outra página, tentar usar o sistema da Home
        else if (verificarSistemaNotificacoes()) {
            await window.parent.notificacoesManager.criarNotificacao({
                tipo: 'conta_criada',
                titulo: 'Nova conta adicionada',
                mensagem: `A conta "${conta.nome || conta.banco || 'Nova conta'}" foi criada com sucesso!`,
                icone: 'account_balance',
                dados: { contaId: conta.id }
            });
        }
        // Fallback para localStorage para ser processado depois
        else {
            const notificacoesPendentes = JSON.parse(localStorage.getItem('notificacoesPendentes') || '[]');
            notificacoesPendentes.push({
                tipo: 'conta_criada',
                titulo: 'Nova conta adicionada',
                mensagem: `A conta "${conta.nome || conta.banco || 'Nova conta'}" foi criada com sucesso!`,
                icone: 'account_balance',
                dados: { contaId: conta.id },
                timestamp: Date.now()
            });
            localStorage.setItem('notificacoesPendentes', JSON.stringify(notificacoesPendentes));
        }
    } catch (error) {
        console.error('Erro ao criar notificação de nova conta:', error);
    }
};

// Função para criar notificação de nova receita
window.criarNotificacaoNovaReceita = async function(receita) {
    try {
        const valor = receita.valor || 0;
        const formatCurrency = (val) => {
            const num = typeof val === 'number' ? val : parseFloat(val) || 0;
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(num);
        };
        
        const notificacao = {
            tipo: 'receita_criada',
            titulo: 'Nova receita adicionada',
            mensagem: `Receita "${receita.descricao || 'Nova receita'}" de ${formatCurrency(valor)} foi criada!`,
            icone: 'trending_up',
            dados: { receitaId: receita.id }
        };

        // Se estamos na Home, usar o sistema local
        if (window.notificacoesManager) {
            await window.notificacoesManager.criarNotificacao(notificacao);
        }
        // Se estamos em outra página, tentar usar o sistema da Home
        else if (verificarSistemaNotificacoes()) {
            await window.parent.notificacoesManager.criarNotificacao(notificacao);
        }
        // Fallback para localStorage
        else {
            const notificacoesPendentes = JSON.parse(localStorage.getItem('notificacoesPendentes') || '[]');
            notificacoesPendentes.push({
                ...notificacao,
                timestamp: Date.now()
            });
            localStorage.setItem('notificacoesPendentes', JSON.stringify(notificacoesPendentes));
        }
    } catch (error) {
        console.error('Erro ao criar notificação de nova receita:', error);
    }
};

// Função para criar notificação de nova despesa
window.criarNotificacaoNovaDespesa = async function(despesa) {
    try {
        const valor = despesa.valor || 0;
        const formatCurrency = (val) => {
            const num = typeof val === 'number' ? val : parseFloat(val) || 0;
            return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            }).format(num);
        };
        
        const notificacao = {
            tipo: 'despesa_criada',
            titulo: 'Nova despesa adicionada',
            mensagem: `Despesa "${despesa.descricao || 'Nova despesa'}" de ${formatCurrency(valor)} foi criada!`,
            icone: 'trending_down',
            dados: { despesaId: despesa.id }
        };

        // Se estamos na Home, usar o sistema local
        if (window.notificacoesManager) {
            await window.notificacoesManager.criarNotificacao(notificacao);
        }
        // Se estamos em outra página, tentar usar o sistema da Home
        else if (verificarSistemaNotificacoes()) {
            await window.parent.notificacoesManager.criarNotificacao(notificacao);
        }
        // Fallback para localStorage
        else {
            const notificacoesPendentes = JSON.parse(localStorage.getItem('notificacoesPendentes') || '[]');
            notificacoesPendentes.push({
                ...notificacao,
                timestamp: Date.now()
            });
            localStorage.setItem('notificacoesPendentes', JSON.stringify(notificacoesPendentes));
        }
    } catch (error) {
        console.error('Erro ao criar notificação de nova despesa:', error);
    }
};

// Função para processar notificações pendentes (chamar na Home)
window.processarNotificacoesPendentes = async function() {
    try {
        const notificacoesPendentes = JSON.parse(localStorage.getItem('notificacoesPendentes') || '[]');
        
        if (notificacoesPendentes.length > 0 && window.notificacoesManager) {
            for (const notificacao of notificacoesPendentes) {
                // Criar notificação se foi criada nos últimos 5 minutos
                if (Date.now() - notificacao.timestamp < 5 * 60 * 1000) {
                    const { timestamp, ...dadosNotificacao } = notificacao;
                    await window.notificacoesManager.criarNotificacao(dadosNotificacao);
                }
            }
            
            // Limpar notificações pendentes
            localStorage.removeItem('notificacoesPendentes');
        }
    } catch (error) {
        console.error('Erro ao processar notificações pendentes:', error);
    }
};