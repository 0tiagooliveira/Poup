// ===== UTILITÁRIOS DE NOTIFICAÇÕES GLOBAIS =====
// Este arquivo pode ser incluído em qualquer página para usar o sistema de notificações da Home

// Verificar se Firebase já foi inicializado
if (typeof firebase === 'undefined') {
    console.error('❌ Firebase não está carregado! Certifique-se de incluir os scripts do Firebase antes deste arquivo.');
}

// Verificar se Firebase já foi inicializado pela página
if (firebase && !firebase.apps.length) {
    console.warn('⚠️ Firebase não foi inicializado pela página. Inicializando agora...');
    // Configuração do Firebase (mesma que usamos em todo o app)
    const notifFirebaseConfig = {
        apiKey: "AIzaSyC7RB9fULmkp9xeJIjc0dL58atHJ8CM-Xc",
        authDomain: "poup-beta.firebaseapp.com",
        projectId: "poup-beta",
        storageBucket: "poup-beta.appspot.com",
        messagingSenderId: "954695915981",
        appId: "1:954695915981:web:d31b216f79eac178094c84"
    };
    firebase.initializeApp(notifFirebaseConfig);
}

// Usar instâncias existentes ou criar novas (sem redeclarar)
const notifDb = firebase.firestore();
const notifAuth = firebase.auth();
            // Função para salvar notificação diretamente no Firestore
async function salvarNotificacaoFirestore(notificacao) {
    try {
        const user = notifAuth.currentUser;
        if (!user) {
            console.warn('⚠️ Usuário não autenticado, salvando no localStorage');
            return false;
        }

        const notificacaoData = {
            ...notificacao,
            userId: user.uid,
            lida: false,
            criadoEm: firebase.firestore.FieldValue.serverTimestamp()
        };

        const docRef = await notifDb.collection('notificacoes').add(notificacaoData);
        console.log('✅ Notificação salva no Firestore:', docRef.id);
        return true;
    } catch (error) {
        console.error('❌ Erro ao salvar notificação no Firestore:', error);
        return false;
    }
}

// Função para verificar se o sistema de notificações está disponível
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
        
        // Tentar salvar diretamente no Firestore
        const salvouFirestore = await salvarNotificacaoFirestore(notificacaoData);
        
        if (salvouFirestore) {
            console.log('✅ Notificação salva no Firestore');
            return;
        }
        
        // Se não conseguiu salvar no Firestore, tentar sistema da Home
        if (window.notificacoesManager) {
            console.log('🏠 Criando notificação diretamente na Home');
            await window.notificacoesManager.criarNotificacao(notificacaoData);
        }
        else if (verificarSistemaNotificacoes()) {
            console.log('🔗 Tentando usar sistema da Home parent');
            await window.parent.notificacoesManager.criarNotificacao(notificacaoData);
        }
        // Fallback para localStorage
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
            icone: receita.icone || receita.categoria?.icone || 'trending_up',
            cor: '#4CAF50', // Verde para receitas
            valor: valor,
            dados: { receitaId: receita.id }
        };
        
        console.log('📢 [notificacoes-utils] Objeto da notificação:', notificacao);

        // Tentar salvar diretamente no Firestore
        const salvouFirestore = await salvarNotificacaoFirestore(notificacao);
        
        if (salvouFirestore) {
            console.log('✅ [notificacoes-utils] Notificação salva no Firestore');
            return;
        }

        // Se não conseguiu salvar no Firestore, tentar sistema da Home
        if (window.notificacoesManager) {
            console.log('✅ [notificacoes-utils] Usando notificacoesManager local (estamos na Home)');
            await window.notificacoesManager.criarNotificacao(notificacao);
            console.log('✅ [notificacoes-utils] Notificação criada com sucesso!');
        }
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
    console.log('💸 Criando notificação de nova despesa:', despesa);
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
            icone: despesa.icone || despesa.categoria?.icone || 'trending_down',
            cor: '#D32F2F', // Vermelho para despesas
            valor: valor,
            dados: { despesaId: despesa.id }
        };

        // Tentar salvar diretamente no Firestore
        const salvouFirestore = await salvarNotificacaoFirestore(notificacao);
        
        if (salvouFirestore) {
            console.log('✅ Notificação salva no Firestore');
            return;
        }

        // Se não conseguiu salvar no Firestore, tentar sistema da Home
        if (window.notificacoesManager) {
            await window.notificacoesManager.criarNotificacao(notificacao);
        }
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
        console.error('❌ Erro ao criar notificação de nova despesa:', error);
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
        // Primeiro verificar se temos um usuário autenticado
        const user = notifAuth.currentUser;
        if (!user) {
            console.log('❌ Usuário não autenticado');
            return;
        }

        console.log(`👤 Processando notificações individuais pendentes`);
        

        // Processar notificações pendentes do localStorage (se houver)
        const notificacoesPendentes = JSON.parse(localStorage.getItem('notificacoesPendentes') || '[]');
        console.log('📱 LocalStorage notificacoesPendentes:', localStorage.getItem('notificacoesPendentes'));
        console.log('📋 Notificações pendentes encontradas:', notificacoesPendentes.length);
        
        if (notificacoesPendentes.length > 0) {
            console.log('🔄 Processando notificações pendentes do localStorage...');
            
            for (const notificacao of notificacoesPendentes) {
                if (window.notificacoesManager) {
                    await window.notificacoesManager.criarNotificacao(notificacao);
                }
            }
            
            // Limpar localStorage após processar
            localStorage.removeItem('notificacoesPendentes');
            console.log('✅ Notificações pendentes processadas e localStorage limpo');
        } else {
            console.log('📭 Nenhuma notificação pendente encontrada');
        }
        
    } catch (error) {
        console.error('❌ Erro ao processar notificações:', error);
    }
};