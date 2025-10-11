// INÍCIO: Firebase Auth
let firebaseApp, auth, db;
(function initFirebase() {
    if (typeof firebase !== "undefined") {
        if (!firebase.apps.length) {
            firebaseApp = firebase.initializeApp({
                apiKey: "AIzaSyC7RB9fULmkp9xeJIjc0dL58atHJ8CM-Xc",
                authDomain: "poup-beta.firebaseapp.com",
                projectId: "poup-beta",
                storageBucket: "poup-beta.appspot.com",
                messagingSenderId: "954695915981",
                appId: "1:954695915981:web:d31b216f79eac178094c84",
                measurementId: "G-LP9BDVD3KJ"
            });
        } else {
            firebaseApp = firebase.app();
        }
        auth = firebase.auth();
        db = firebase.firestore();
    } else {
        console.error("Firebase não carregado.");
    }
})();
// FIM: Firebase Auth

// Funções globais para popups
function abrirPopup(id) {
    const popup = document.getElementById(id);
    if (popup) {
        popup.style.display = 'flex';
        popup.style.position = 'fixed';
        popup.style.top = '0';
        popup.style.left = '0';
        popup.style.width = '100%';
        popup.style.height = '100%';
        popup.style.zIndex = '9999';
        popup.style.justifyContent = 'center';
        popup.style.alignItems = 'center';
        popup.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        
        setTimeout(() => {
            popup.classList.add('show');
        }, 10);
    }
}

function fecharPopup(popupId) {
    const popup = document.getElementById(popupId);
    if (popup) {
        popup.classList.remove('show');
        setTimeout(() => popup.style.display = 'none', 200);
    }
}

function mostrarLoading(buttonId, show) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    
    const btnText = button.querySelector('.btn-text');
    const loading = button.querySelector('.popup-loading');
    
    button.disabled = show;
    
    if (btnText && loading) {
        if (show) {
            btnText.style.display = 'none';
            loading.style.display = 'flex';
        } else {
            btnText.style.display = 'block';
            loading.style.display = 'none';
        }
    }
}

// Funções para mostrar notificações
function mostrarNotificacao(tipo, titulo, mensagem, callback = null) {
    const popup = document.getElementById('popup-notificacao');
    const icone = document.getElementById('popup-notificacao-icon');
    const tituloEl = document.getElementById('popup-notificacao-titulo');
    const textoEl = document.getElementById('popup-notificacao-texto');
    
    if (!popup || !icone || !tituloEl || !textoEl) {
        alert(titulo + '\n\n' + mensagem);
        if (callback) callback();
        return;
    }
    
    // Remover classes anteriores
    icone.className = 'popup-icon';
    
    // Configurar ícone e cor baseado no tipo
    switch(tipo) {
        case 'sucesso':
            icone.classList.add('success');
            icone.innerHTML = '<i class="fas fa-check-circle"></i>';
            break;
        case 'erro':
            icone.classList.add('error');
            icone.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
            break;
        case 'warning':
            icone.classList.add('warning');
            icone.innerHTML = '<i class="fas fa-exclamation-triangle"></i>';
            break;
        case 'info':
        default:
            icone.classList.add('info');
            icone.innerHTML = '<i class="fas fa-info-circle"></i>';
            break;
    }
    
    tituloEl.textContent = titulo;
    textoEl.textContent = mensagem;
    
    // Configurar callback se fornecido
    const btnOk = popup.querySelector('.botao-popup.primario');
    if (btnOk) {
        btnOk.onclick = function() {
            fecharPopup('popup-notificacao');
            if (callback) callback();
        };
    }
    
    abrirPopup('popup-notificacao');
}

function mostrarSucesso(titulo, mensagem, callback = null) {
    mostrarNotificacao('sucesso', titulo, mensagem, callback);
}

function mostrarErro(titulo, mensagem, callback = null) {
    mostrarNotificacao('erro', titulo, mensagem, callback);
}

function mostrarWarning(titulo, mensagem, callback = null) {
    mostrarNotificacao('warning', titulo, mensagem, callback);
}

// Variáveis globais
let configuracoes = {
    modoEscuro: false,
    notificacoes: true,
    moeda: 'BRL'
};

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = '../index.html';
            return;
        }
        
        // Carregar dados do usuário
        carregarDadosUsuario(user);
        carregarConfiguracoes();
    });
    
    // Event listeners para toggles
    document.getElementById('toggle-dark-mode').addEventListener('change', function() {
        configuracoes.modoEscuro = this.checked;
        salvarConfiguracoes();
        aplicarModoEscuro();
    });
    
    document.getElementById('toggle-notifications').addEventListener('change', function() {
        configuracoes.notificacoes = this.checked;
        salvarConfiguracoes();
    });
    
    // Event listeners para seleção de moeda
    document.querySelectorAll('.moeda-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.moeda-option').forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Event listener para confirmação de exclusão
    document.getElementById('confirmar-exclusao').addEventListener('input', function() {
        const button = document.getElementById('btn-excluir-conta');
        button.disabled = this.value.trim().toUpperCase() !== 'EXCLUIR';
    });
    
    // Fechar popup clicando fora
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('popup-overlay')) {
            fecharPopup(e.target.id);
        }
    });
});

function carregarDadosUsuario(user) {
    // Preencher dados do perfil
    document.getElementById('nome-perfil').value = user.displayName || '';
    document.getElementById('email-perfil').value = user.email || '';
}

function carregarConfiguracoes() {
    // Carregar configurações do localStorage
    const configSalvas = localStorage.getItem('poup_configuracoes');
    if (configSalvas) {
        configuracoes = { ...configuracoes, ...JSON.parse(configSalvas) };
    }
    
    // Aplicar configurações na interface
    document.getElementById('toggle-dark-mode').checked = configuracoes.modoEscuro;
    document.getElementById('toggle-notifications').checked = configuracoes.notificacoes;
    
    // Aplicar modo escuro se ativado
    aplicarModoEscuro();
    
    // Atualizar moeda selecionada
    atualizarMoedaSelecionada();
}

function salvarConfiguracoes() {
    localStorage.setItem('poup_configuracoes', JSON.stringify(configuracoes));
}

function aplicarModoEscuro() {
    if (configuracoes.modoEscuro) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
}

function atualizarMoedaSelecionada() {
    const moedaTextos = {
        'BRL': 'Real Brasileiro (R$)',
        'USD': 'Dólar Americano ($)',
        'EUR': 'Euro (€)'
    };
    
    document.getElementById('moeda-atual').textContent = moedaTextos[configuracoes.moeda] || 'Real Brasileiro (R$)';
    
    // Marcar opção ativa no popup
    document.querySelectorAll('.moeda-option').forEach(option => {
        option.classList.remove('active');
        if (option.dataset.moeda === configuracoes.moeda) {
            option.classList.add('active');
        }
    });
}

function salvarPerfil() {
    const nome = document.getElementById('nome-perfil').value.trim();
    
    if (!nome) {
        mostrarWarning('Nome Obrigatório', 'Por favor, digite seu nome.');
        return;
    }
    
    mostrarLoading('btn-salvar-perfil', true);
    
    const user = auth.currentUser;
    
    user.updateProfile({
        displayName: nome
    }).then(() => {
        // Salvar no Firestore também
        return db.collection('users').doc(user.uid).update({
            name: nome,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
    }).then(() => {
        mostrarLoading('btn-salvar-perfil', false);
        fecharPopup('popup-editar-perfil');
        mostrarSucesso('Perfil Atualizado', 'Suas informações foram atualizadas com sucesso!');
    }).catch(error => {
        console.error('Erro ao atualizar perfil:', error);
        mostrarLoading('btn-salvar-perfil', false);
        mostrarErro('Erro', 'Não foi possível atualizar o perfil. Tente novamente.');
    });
}

function alterarSenha() {
    const senhaAtual = document.getElementById('senha-atual').value;
    const novaSenha = document.getElementById('nova-senha').value;
    const confirmarSenha = document.getElementById('confirmar-senha').value;
    
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
        mostrarWarning('Campos Obrigatórios', 'Por favor, preencha todos os campos.');
        return;
    }
    
    if (novaSenha.length < 6) {
        mostrarWarning('Senha Inválida', 'A nova senha deve ter pelo menos 6 caracteres.');
        return;
    }
    
    if (novaSenha !== confirmarSenha) {
        mostrarWarning('Senhas Diferentes', 'A confirmação da senha não confere.');
        return;
    }
    
    mostrarLoading('btn-alterar-senha', true);
    
    const user = auth.currentUser;
    const credential = firebase.auth.EmailAuthProvider.credential(user.email, senhaAtual);
    
    // Reautenticar o usuário
    user.reauthenticateWithCredential(credential).then(() => {
        // Atualizar senha
        return user.updatePassword(novaSenha);
    }).then(() => {
        mostrarLoading('btn-alterar-senha', false);
        fecharPopup('popup-alterar-senha');
        
        // Limpar campos
        document.getElementById('senha-atual').value = '';
        document.getElementById('nova-senha').value = '';
        document.getElementById('confirmar-senha').value = '';
        
        mostrarSucesso('Senha Alterada', 'Sua senha foi alterada com sucesso!');
    }).catch(error => {
        console.error('Erro ao alterar senha:', error);
        mostrarLoading('btn-alterar-senha', false);
        
        let errorMessage = 'Não foi possível alterar a senha.';
        
        switch(error.code) {
            case 'auth/wrong-password':
                errorMessage = 'Senha atual incorreta.';
                break;
            case 'auth/weak-password':
                errorMessage = 'A nova senha é muito fraca.';
                break;
            case 'auth/requires-recent-login':
                errorMessage = 'Por segurança, faça login novamente antes de alterar a senha.';
                break;
            default:
                errorMessage = 'Erro inesperado. Tente novamente.';
        }
        
        mostrarErro('Erro', errorMessage);
    });
}

function salvarMoeda() {
    const moedaSelecionada = document.querySelector('.moeda-option.active');
    if (moedaSelecionada) {
        configuracoes.moeda = moedaSelecionada.dataset.moeda;
        salvarConfiguracoes();
        atualizarMoedaSelecionada();
        fecharPopup('popup-moeda');
        mostrarSucesso('Moeda Atualizada', 'A moeda padrão foi alterada com sucesso!');
    }
}

function exportarDados() {
    const exportContas = document.getElementById('export-contas').checked;
    const exportTransacoes = document.getElementById('export-transacoes').checked;
    const exportCategorias = document.getElementById('export-categorias').checked;
    
    if (!exportContas && !exportTransacoes && !exportCategorias) {
        mostrarWarning('Seleção Obrigatória', 'Selecione pelo menos um tipo de dado para exportar.');
        return;
    }
    
    mostrarLoading('btn-exportar', true);
    
    const user = auth.currentUser;
    const dadosExport = {
        usuario: {
            nome: user.displayName,
            email: user.email,
            dataExportacao: new Date().toISOString()
        },
        dados: {}
    };
    
    // Simular coleta de dados (em um app real, viria do Firestore)
    if (exportContas) {
        dadosExport.dados.contas = [
            { id: 1, nome: 'Conta Corrente', banco: 'Banco do Brasil', saldo: 1500.00 },
            { id: 2, nome: 'Poupança', banco: 'Caixa', saldo: 5000.00 }
        ];
    }
    
    if (exportTransacoes) {
        dadosExport.dados.transacoes = [
            { id: 1, descricao: 'Salário', valor: 3000.00, data: '2025-10-01', tipo: 'receita' },
            { id: 2, descricao: 'Mercado', valor: -250.00, data: '2025-10-02', tipo: 'despesa' }
        ];
    }
    
    if (exportCategorias) {
        dadosExport.dados.categorias = [
            { id: 1, nome: 'Alimentação', cor: '#FF6B6B' },
            { id: 2, nome: 'Transporte', cor: '#4ECDC4' }
        ];
    }
    
    // Criar e baixar arquivo JSON
    setTimeout(() => {
        const blob = new Blob([JSON.stringify(dadosExport, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `poup_dados_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        mostrarLoading('btn-exportar', false);
        fecharPopup('popup-exportar-dados');
        mostrarSucesso('Dados Exportados', 'Seus dados foram exportados com sucesso!');
    }, 2000); // Simular tempo de processamento
}

function excluirConta() {
    const confirmacao = document.getElementById('confirmar-exclusao').value.trim().toUpperCase();
    
    if (confirmacao !== 'EXCLUIR') {
        mostrarWarning('Confirmação Necessária', 'Digite "EXCLUIR" para confirmar a exclusão da conta.');
        return;
    }
    
    mostrarLoading('btn-excluir-conta', true);
    
    const user = auth.currentUser;
    
    // Excluir dados do Firestore primeiro
    db.collection('users').doc(user.uid).delete().then(() => {
        // Excluir conta do usuário
        return user.delete();
    }).then(() => {
        // Limpar localStorage
        localStorage.clear();
        
        mostrarSucesso('Conta Excluída', 'Sua conta foi excluída com sucesso.', () => {
            window.location.href = '../index.html';
        });
    }).catch(error => {
        console.error('Erro ao excluir conta:', error);
        mostrarLoading('btn-excluir-conta', false);
        
        let errorMessage = 'Não foi possível excluir a conta.';
        
        switch(error.code) {
            case 'auth/requires-recent-login':
                errorMessage = 'Por segurança, faça login novamente antes de excluir a conta.';
                break;
            default:
                errorMessage = 'Erro inesperado. Tente novamente.';
        }
        
        mostrarErro('Erro', errorMessage);
    });
}

function fazerLogout() {
    mostrarNotificacao('info', 'Sair da Conta', 'Tem certeza que deseja sair?', () => {
        auth.signOut().then(() => {
            window.location.href = '../index.html';
        }).catch(error => {
            console.error('Erro ao fazer logout:', error);
            mostrarErro('Erro', 'Não foi possível sair da conta.');
        });
    });
}