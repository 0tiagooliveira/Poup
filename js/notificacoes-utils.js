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
    console.log('💰 Criando notificação de nova conta:', conta);
    try {
        const notificacaoData = {
            tipo: 'conta_criada',
            titulo: 'Nova conta adicionada',
            mensagem: `A conta "${conta.nome || conta.banco || 'Nova conta'}" foi criada com sucesso!`,
            icone: 'account_balance',
            dados: { contaId: conta.id }
        };
        
        console.log('📝 Dados da notificação:', notificacaoData);
        
        // Se estamos na Home, usar o sistema local
        if (window.notificacoesManager) {
            console.log('🏠 Criando notificação diretamente na Home');
            await window.notificacoesManager.criarNotificacao(notificacaoData);
        }
        // Se estamos em outra página, tentar usar o sistema da Home
        else if (verificarSistemaNotificacoes()) {
            console.log('🔗 Tentando usar sistema da Home parent');
            await window.parent.notificacoesManager.criarNotificacao(notificacaoData);
        }
        // Fallback para localStorage para ser processado depois
        else {
            console.log('💾 Salvando no localStorage como pendente');
            const notificacoesPendentes = JSON.parse(localStorage.getItem('notificacoesPendentes') || '[]');
            const notificacaoPendente = {
                ...notificacaoData,
                timestamp: Date.now()
            };
            notificacoesPendentes.push(notificacaoPendente);
            localStorage.setItem('notificacoesPendentes', JSON.stringify(notificacoesPendentes));
            console.log('💾 Notificação salva no localStorage:', notificacaoPendente);
        }
    } catch (error) {
        console.error('❌ Erro ao criar notificação de nova conta:', error);
    }
};

// Função para criar notificação de nova receita
window.criarNotificacaoNovaReceita = async function(receita) {
    console.log('📢 [notificacoes-utils] criarNotificacaoNovaReceita chamada');
    console.log('📢 [notificacoes-utils] Dados da receita:', receita);
    console.log('📢 [notificacoes-utils] window.notificacoesManager existe?', !!window.notificacoesManager);
    console.log('📢 [notificacoes-utils] window.parent.notificacoesManager existe?', !!(window.parent && window.parent.notificacoesManager));
    
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
        
        console.log('📢 [notificacoes-utils] Objeto da notificação:', notificacao);

        // Se estamos na Home, usar o sistema local
        if (window.notificacoesManager) {
            console.log('✅ [notificacoes-utils] Usando notificacoesManager local (estamos na Home)');
            await window.notificacoesManager.criarNotificacao(notificacao);
            console.log('✅ [notificacoes-utils] Notificação criada com sucesso!');
        }
        // Se estamos em outra página, tentar usar o sistema da Home
        else if (verificarSistemaNotificacoes()) {
            console.log('🔗 [notificacoes-utils] Usando notificacoesManager do parent');
            await window.parent.notificacoesManager.criarNotificacao(notificacao);
            console.log('✅ [notificacoes-utils] Notificação criada no parent com sucesso!');
        }
        // Fallback para localStorage
        else {
            console.log('💾 [notificacoes-utils] Salvando notificação pendente no localStorage');
            const notificacoesPendentes = JSON.parse(localStorage.getItem('notificacoesPendentes') || '[]');
            notificacoesPendentes.push({
                ...notificacao,
                timestamp: Date.now()
            });
            localStorage.setItem('notificacoesPendentes', JSON.stringify(notificacoesPendentes));
            console.log('💾 [notificacoes-utils] Notificação salva no localStorage:', notificacoesPendentes);
        }
    } catch (error) {
        console.error('❌ [notificacoes-utils] Erro ao criar notificação de nova receita:', error);
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

// Função para criar notificação de novo cartão
window.criarNotificacaoNovoCartao = async function(cartao) {
    try {
        const notificacao = {
            tipo: 'cartao_criado',
            titulo: 'Novo cartão adicionado',
            mensagem: `Cartão "${cartao.nome || cartao.banco || 'Novo cartão'}" foi criado com sucesso!`,
            icone: 'credit_card',
            dados: { cartaoId: cartao.id }
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
        console.error('Erro ao criar notificação de novo cartão:', error);
    }
};

// Função para criar notificação de receita excluída
window.criarNotificacaoReceitaExcluida = async function(receita) {
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
            tipo: 'receita_excluida',
            titulo: 'Receita excluída',
            mensagem: `Receita "${receita.descricao || 'Receita'}" de ${formatCurrency(valor)} foi excluída!`,
            icone: 'delete',
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
        console.error('Erro ao criar notificação de receita excluída:', error);
    }
};

// Função para criar notificação de despesa excluída
window.criarNotificacaoDespesaExcluida = async function(despesa) {
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
            tipo: 'despesa_excluida',
            titulo: 'Despesa excluída',
            mensagem: `Despesa "${despesa.descricao || 'Despesa'}" de ${formatCurrency(valor)} foi excluída!`,
            icone: 'delete',
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
        console.error('Erro ao criar notificação de despesa excluída:', error);
    }
};

// Função para processar notificações pendentes (chamar na Home)
window.processarNotificacoesPendentes = async function() {
    console.log('🔄 Processando notificações pendentes...');
    try {
        const notificacoesPendentesString = localStorage.getItem('notificacoesPendentes');
        console.log('📱 LocalStorage notificacoesPendentes:', notificacoesPendentesString);
        
        const notificacoesPendentes = JSON.parse(notificacoesPendentesString || '[]');
        console.log('📋 Notificações pendentes encontradas:', notificacoesPendentes.length);
        
        if (notificacoesPendentes.length > 0) {
            console.log('📌 Notificações Manager disponível:', !!window.notificacoesManager);
            
            if (window.notificacoesManager) {
                for (const notificacao of notificacoesPendentes) {
                    console.log('⏰ Processando notificação:', notificacao);
                    
                    // Criar notificação se foi criada nos últimos 5 minutos
                    if (Date.now() - notificacao.timestamp < 5 * 60 * 1000) {
                        const { timestamp, ...dadosNotificacao } = notificacao;
                        console.log('✅ Criando notificação:', dadosNotificacao);
                        await window.notificacoesManager.criarNotificacao(dadosNotificacao);
                    } else {
                        console.log('⏳ Notificação muito antiga, ignorando:', notificacao);
                    }
                }
                
                // Limpar notificações pendentes
                localStorage.removeItem('notificacoesPendentes');
                console.log('🗑️ Notificações pendentes removidas do localStorage');
            } else {
                console.log('❌ Notificações Manager não disponível');
            }
        } else {
            console.log('📭 Nenhuma notificação pendente encontrada');
        }
    } catch (error) {
        console.error('❌ Erro ao processar notificações pendentes:', error);
    }
};