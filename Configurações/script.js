// --- VARIÁVEIS GLOBAIS ---
let usuarioAtual = null;
let preferencesData = {
    notificacoes: true,
    modoEscuro: false,
    moeda: 'BRL',
    biometria: false
};

// --- INICIALIZAÇÃO DA PÁGINA ---
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Inicializando página de configurações...');
    verificarAutenticacao();
    inicializarEventListeners();
    carregarPreferenciasLocal();
    adicionarAnimacoes();
});

// --- VERIFICAÇÃO DE AUTENTICAÇÃO ---
function verificarAutenticacao() {
    // Verificar se o Firebase está disponível
    if (typeof firebase !== 'undefined' && firebase.auth) {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                usuarioAtual = user;
                preencherDadosUsuario();
                console.log('✅ Usuário autenticado:', user.email);
            } else {
                console.log('❌ Usuário não autenticado, redirecionando...');
                window.location.href = '../Home/home.html';
            }
        });
    } else {
        console.log('⚠️ Firebase não disponível, usando dados locais');
        // Usar dados salvos localmente
        const dadosUsuario = localStorage.getItem('dadosUsuario');
        if (dadosUsuario) {
            try {
                usuarioAtual = JSON.parse(dadosUsuario);
                preencherDadosUsuario();
            } catch (error) {
                console.error('Erro ao carregar dados do usuário:', error);
            }
        }
    }
}

// --- PREENCHER DADOS DO USUÁRIO ---
function preencherDadosUsuario() {
    if (!usuarioAtual) return;

    const nomeInput = document.getElementById('nome-usuario');
    const emailInput = document.getElementById('email-usuario');
    const avatarImg = document.getElementById('avatar-usuario');

    if (nomeInput) {
        nomeInput.value = usuarioAtual.displayName || usuarioAtual.nome || 'Usuário Poup+';
    }
    
    if (emailInput) {
        emailInput.value = usuarioAtual.email || 'usuario@poup.com';
    }
    
    if (avatarImg) {
        avatarImg.src = usuarioAtual.photoURL || '../Icon/perfil.svg';
    }

    console.log('👤 Dados do usuário preenchidos');
}

// --- INICIALIZAR EVENT LISTENERS ---
function inicializarEventListeners() {
    console.log('🎛️ Inicializando event listeners...');
    
    // Botão voltar com animação
    const botaoVoltar = document.querySelector('.botao-voltar');
    if (botaoVoltar) {
        botaoVoltar.addEventListener('click', (e) => {
            e.preventDefault();
            animarSaida();
            setTimeout(() => {
                window.location.href = '../Home/home.html';
            }, 300);
        });
    }

    // Upload de avatar
    const botaoAlterarFoto = document.getElementById('botao-alterar-foto');
    const inputFoto = document.getElementById('input-foto');
    
    if (botaoAlterarFoto && inputFoto) {
        botaoAlterarFoto.addEventListener('click', () => {
            inputFoto.click();
            adicionarEfeitoClick(botaoAlterarFoto);
        });
        inputFoto.addEventListener('change', handleUploadAvatar);
    }

    // Switches de preferências com animações
    const switches = [
        'notificacoes',
        'modo-escuro', 
        'biometria'
    ];

    switches.forEach(switchId => {
        const switchElement = document.getElementById(switchId);
        if (switchElement) {
            switchElement.addEventListener('change', (e) => {
                handlePreferenceChange(e);
                adicionarEfeitoSwitch(switchElement);
            });
        }
    });

    // Select de moeda
    const selectMoeda = document.getElementById('moeda-padrao');
    if (selectMoeda) {
        selectMoeda.addEventListener('change', handlePreferenceChange);
    }

    // Itens clicáveis
    const itemsClicaveis = document.querySelectorAll('.item-configuracao.clickable');
    itemsClicaveis.forEach(item => {
        item.addEventListener('click', (e) => {
            const id = item.id;
            adicionarEfeitoClick(item);
            
            setTimeout(() => {
                switch(id) {
                    case 'alterar-senha':
                        abrirModalAlterarSenha();
                        break;
                    case 'exportar-dados':
                        exportarDados();
                        break;
                    case 'limpar-cache':
                        limparCache();
                        break;
                    case 'excluir-conta':
                        abrirModalExcluirConta();
                        break;
                }
            }, 150);
        });
    });

    // Botão logout
    const botaoLogout = document.getElementById('botao-logout');
    if (botaoLogout) {
        botaoLogout.addEventListener('click', (e) => {
            e.preventDefault();
            adicionarEfeitoClick(botaoLogout);
            setTimeout(() => {
                abrirModalLogout();
            }, 150);
        });
    }

    // Botão salvar
    const botaoSalvar = document.getElementById('botao-salvar');
    if (botaoSalvar) {
        botaoSalvar.addEventListener('click', () => {
            salvarTodasPreferencias();
            adicionarEfeitoClick(botaoSalvar);
        });
    }

    // Event listeners para modais
    setupModalEventListeners();
    
    console.log('✅ Event listeners configurados');
}

// --- CONFIGURAR EVENT LISTENERS DOS MODAIS ---
function setupModalEventListeners() {
    // Modal overlay clicks
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            fecharModal(e.target);
        }
    });

    // Modal close buttons
    const modalCloses = document.querySelectorAll('.modal-close');
    modalCloses.forEach(close => {
        close.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal-overlay');
            fecharModal(modal);
        });
    });

    // Botões de cancelar
    const botoesCancelar = document.querySelectorAll('.botao-secundario');
    botoesCancelar.forEach(botao => {
        botao.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal-overlay');
            fecharModal(modal);
        });
    });

    // Escape key para fechar modais
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modalAtivo = document.querySelector('.modal-overlay.ativo');
            if (modalAtivo) {
                fecharModal(modalAtivo);
            }
        }
    });
}

// --- UPLOAD DE AVATAR ---
function handleUploadAvatar(event) {
    const arquivo = event.target.files[0];
    if (!arquivo) return;

    // Validar tipo de arquivo
    if (!arquivo.type.startsWith('image/')) {
        mostrarToast('Por favor, selecione uma imagem válida', 'erro');
        return;
    }

    // Validar tamanho (máximo 5MB)
    if (arquivo.size > 5 * 1024 * 1024) {
        mostrarToast('A imagem deve ter no máximo 5MB', 'erro');
        return;
    }

    // Simular upload (em uma implementação real, seria enviado para o servidor)
    mostrarToast('Atualizando foto...', 'sucesso');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const avatarImg = document.getElementById('avatar-usuario');
        if (avatarImg) {
            avatarImg.src = e.target.result;
            
            // Salvar no localStorage
            localStorage.setItem('avatarUsuario', e.target.result);
            
            // Animação de sucesso
            avatarImg.style.transform = 'scale(1.1)';
            setTimeout(() => {
                avatarImg.style.transform = 'scale(1)';
            }, 200);
            
            mostrarToast('Foto atualizada com sucesso!', 'sucesso');
        }
    };
    reader.readAsDataURL(arquivo);
}

// --- MANIPULAR MUDANÇAS DE PREFERÊNCIAS ---
function handlePreferenceChange(event) {
    const elemento = event.target;
    const preferencia = elemento.id.replace('-', '');
    
    let valor;
    if (elemento.type === 'checkbox') {
        valor = elemento.checked;
    } else {
        valor = elemento.value;
    }

    // Mapear IDs para chaves de preferência
    const mapeamento = {
        'notificacoes': 'notificacoes',
        'modoescuro': 'modoEscuro',
        'biometria': 'biometria',
        'moedapadrao': 'moeda'
    };

    const chave = mapeamento[preferencia];
    if (chave) {
        preferencesData[chave] = valor;
        
        // Aplicar mudanças específicas
        if (chave === 'modoEscuro') {
            if (valor) {
                aplicarModoEscuro();
                mostrarToast('Modo escuro ativado', 'sucesso');
            } else {
                removerModoEscuro();
                mostrarToast('Modo claro ativado', 'sucesso');
            }
        }
        
        if (chave === 'notificacoes') {
            mostrarToast(valor ? 'Notificações ativadas' : 'Notificações desativadas', 'sucesso');
        }
        
        if (chave === 'moeda') {
            mostrarToast(`Moeda alterada para ${valor}`, 'sucesso');
        }
        
        salvarPreferenciasLocal();
        console.log('⚙️ Preferência atualizada:', chave, valor);
    }
}

// --- MODO ESCURO ---
function aplicarModoEscuro() {
    document.documentElement.setAttribute('data-theme', 'dark');
    const body = document.body;
    body.style.transition = 'background 0.3s ease, color 0.3s ease';
    
    // Animar a transição
    setTimeout(() => {
        body.style.transition = '';
    }, 300);
}

function removerModoEscuro() {
    document.documentElement.removeAttribute('data-theme');
    const body = document.body;
    body.style.transition = 'background 0.3s ease, color 0.3s ease';
    
    setTimeout(() => {
        body.style.transition = '';
    }, 300);
}

// --- MODAIS ---
function abrirModalAlterarSenha() {
    criarModalDinamico(
        'Alterar Senha',
        `<div style="text-align: left;">
            <p style="margin-bottom: 20px; text-align: center;">Para sua segurança, confirme sua identidade antes de alterar a senha.</p>
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Senha Atual:</label>
            <input type="password" id="senha-atual" style="width: 100%; padding: 12px; border: 2px solid var(--cor-borda); border-radius: 12px; margin-bottom: 16px;">
            
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Nova Senha:</label>
            <input type="password" id="nova-senha" style="width: 100%; padding: 12px; border: 2px solid var(--cor-borda); border-radius: 12px; margin-bottom: 16px;">
            
            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Confirmar Nova Senha:</label>
            <input type="password" id="confirmar-senha" style="width: 100%; padding: 12px; border: 2px solid var(--cor-borda); border-radius: 12px;">
        </div>`,
        'Alterar Senha',
        confirmarAlteracaoSenha
    );
}

function abrirModalLogout() {
    criarModalDinamico(
        'Sair da Conta',
        'Tem certeza que deseja sair da sua conta? Você precisará fazer login novamente para acessar seus dados.',
        'Sair da Conta',
        confirmarLogout
    );
}

function abrirModalExcluirConta() {
    criarModalDinamico(
        'Excluir Conta',
        '<div style="text-align: center;"><span style="font-size: 48px; color: var(--cor-erro);">⚠️</span><br><br>Esta ação é <strong>irreversível</strong>!<br><br>Todos os seus dados, incluindo contas, receitas, despesas e configurações serão <strong>permanentemente excluídos</strong>.<br><br>Tem certeza absoluta?</div>',
        'Excluir Permanentemente',
        confirmarExclusaoConta,
        true
    );
}

function criarModalDinamico(titulo, conteudo, textoBotao, funcaoConfirmar, perigoso = false) {
    // Remover modal existente se houver
    const modalExistente = document.getElementById('modal-dinamico');
    if (modalExistente) {
        modalExistente.remove();
    }

    const modal = document.createElement('div');
    modal.id = 'modal-dinamico';
    modal.className = 'modal-overlay';
    
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3>${titulo}</h3>
                <button class="modal-close">
                    <span class="material-icons">close</span>
                </button>
            </div>
            <div class="modal-body">
                ${conteudo}
            </div>
            <div class="modal-footer">
                <button class="botao-secundario">Cancelar</button>
                <button class="botao-primario ${perigoso ? 'perigoso' : ''}" id="btn-confirmar-dinamico">${textoBotao}</button>
            </div>
        </div>
    `;

    if (perigoso) {
        modal.querySelector('.botao-primario').style.background = 'linear-gradient(135deg, var(--cor-erro) 0%, #dc2626 100%)';
    }

    document.body.appendChild(modal);

    // Event listeners
    modal.querySelector('.modal-close').addEventListener('click', () => fecharModal(modal));
    modal.querySelector('.botao-secundario').addEventListener('click', () => fecharModal(modal));
    modal.querySelector('#btn-confirmar-dinamico').addEventListener('click', () => {
        if (funcaoConfirmar) {
            funcaoConfirmar();
        }
        fecharModal(modal);
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            fecharModal(modal);
        }
    });

    // Mostrar modal
    setTimeout(() => {
        modal.classList.add('ativo');
    }, 10);
}

function fecharModal(modal) {
    if (modal) {
        modal.classList.remove('ativo');
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
        }, 300);
    }
}

// --- FUNÇÕES DE CONFIRMAÇÃO ---
function confirmarAlteracaoSenha() {
    const senhaAtual = document.getElementById('senha-atual')?.value;
    const novaSenha = document.getElementById('nova-senha')?.value;
    const confirmarSenha = document.getElementById('confirmar-senha')?.value;

    if (!senhaAtual || !novaSenha || !confirmarSenha) {
        mostrarToast('Preencha todos os campos', 'erro');
        return false;
    }

    if (novaSenha !== confirmarSenha) {
        mostrarToast('Senhas não coincidem', 'erro');
        return false;
    }

    if (novaSenha.length < 6) {
        mostrarToast('Nova senha deve ter pelo menos 6 caracteres', 'erro');
        return false;
    }

    // Simular alteração de senha
    mostrarToast('Senha alterada com sucesso!', 'sucesso');
    return true;
}

function confirmarLogout() {
    // Simular logout
    mostrarToast('Fazendo logout...', 'sucesso');
    setTimeout(() => {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            firebase.auth().signOut().then(() => {
                window.location.href = '../index.html';
            }).catch((error) => {
                console.error('Erro ao fazer logout:', error);
                window.location.href = '../index.html';
            });
        } else {
            window.location.href = '../index.html';
        }
    }, 1000);
}

function confirmarExclusaoConta() {
    mostrarToast('Processando exclusão da conta...', 'erro');
    
    // Simular exclusão
    setTimeout(() => {
        localStorage.clear();
        sessionStorage.clear();
        mostrarToast('Conta excluída com sucesso', 'sucesso');
        
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 2000);
    }, 2000);
}

// --- AÇÕES DE DADOS ---
function exportarDados() {
    mostrarToast('Preparando exportação...', 'sucesso');

    const dadosUsuario = {
        usuario: {
            nome: usuarioAtual?.displayName || 'Usuário',
            email: usuarioAtual?.email || 'usuario@poup.com',
            dataExportacao: new Date().toISOString()
        },
        preferencias: preferencesData,
        configuracoes: {
            versao: '1.0.0',
            plataforma: 'Web'
        }
    };

    // Criar e baixar arquivo
    const dataStr = JSON.stringify(dadosUsuario, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `poup_dados_${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    mostrarToast('Dados exportados com sucesso!', 'sucesso');
}

function limparCache() {
    try {
        // Manter dados essenciais do usuário
        const dadosEssenciais = {
            dadosUsuario: localStorage.getItem('dadosUsuario'),
            preferenciasUsuario: localStorage.getItem('preferenciasUsuario'),
            avatarUsuario: localStorage.getItem('avatarUsuario')
        };

        // Limpar localStorage
        localStorage.clear();
        sessionStorage.clear();

        // Restaurar dados essenciais
        Object.keys(dadosEssenciais).forEach(key => {
            if (dadosEssenciais[key]) {
                localStorage.setItem(key, dadosEssenciais[key]);
            }
        });

        // Tentar limpar cache do navegador
        if ('caches' in window) {
            caches.keys().then(names => {
                names.forEach(name => {
                    caches.delete(name);
                });
            });
        }

        mostrarToast('Cache limpo com sucesso!', 'sucesso');
    } catch (error) {
        console.error('Erro ao limpar cache:', error);
        mostrarToast('Erro ao limpar cache', 'erro');
    }
}

// --- SALVAR PREFERÊNCIAS ---
function salvarTodasPreferencias() {
    salvarPreferenciasLocal();
    mostrarToast('Configurações salvas com sucesso!', 'sucesso');
    
    // Efeito visual no botão
    const botaoSalvar = document.getElementById('botao-salvar');
    if (botaoSalvar) {
        const icone = botaoSalvar.querySelector('.material-icons');
        if (icone) {
            icone.textContent = 'check';
            setTimeout(() => {
                icone.textContent = 'save';
            }, 2000);
        }
    }
}

function salvarPreferenciasLocal() {
    localStorage.setItem('preferenciasUsuario', JSON.stringify(preferencesData));
    console.log('💾 Preferências salvas:', preferencesData);
}

function carregarPreferenciasLocal() {
    const preferenciasSalvas = localStorage.getItem('preferenciasUsuario');
    if (preferenciasSalvas) {
        try {
            preferencesData = { ...preferencesData, ...JSON.parse(preferenciasSalvas) };
            aplicarPreferenciasInterface();
            console.log('📂 Preferências carregadas:', preferencesData);
        } catch (error) {
            console.error('Erro ao carregar preferências:', error);
        }
    }
}

function aplicarPreferenciasInterface() {
    const switchNotificacoes = document.getElementById('notificacoes');
    const switchModoEscuro = document.getElementById('modo-escuro');
    const selectMoeda = document.getElementById('moeda-padrao');
    const switchBiometria = document.getElementById('biometria');

    if (switchNotificacoes) switchNotificacoes.checked = preferencesData.notificacoes;
    if (switchModoEscuro) switchModoEscuro.checked = preferencesData.modoEscuro;
    if (selectMoeda) selectMoeda.value = preferencesData.moeda;
    if (switchBiometria) switchBiometria.checked = preferencesData.biometria;

    // Aplicar modo escuro se ativado
    if (preferencesData.modoEscuro) {
        aplicarModoEscuro();
    }
}

// --- SISTEMA DE TOAST APRIMORADO ---
function mostrarToast(mensagem, tipo = 'sucesso') {
    // Remover toast existente
    const toastExistente = document.getElementById('toast-dinamico');
    if (toastExistente) {
        toastExistente.remove();
    }

    const toast = document.createElement('div');
    toast.id = 'toast-dinamico';
    toast.className = `toast ${tipo}`;
    
    let icone;
    switch (tipo) {
        case 'sucesso':
            icone = 'check_circle';
            break;
        case 'erro':
            icone = 'error';
            break;
        case 'aviso':
            icone = 'warning';
            break;
        default:
            icone = 'info';
    }
    
    toast.innerHTML = `
        <span class="material-icons">${icone}</span>
        <span>${mensagem}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Mostrar com animação
    setTimeout(() => {
        toast.classList.add('ativo');
    }, 10);
    
    // Esconder após 3 segundos
    setTimeout(() => {
        toast.classList.remove('ativo');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
    
    console.log(`📢 Toast: ${mensagem} (${tipo})`);
}

// --- ANIMAÇÕES E EFEITOS ---
function adicionarAnimacoes() {
    // Adicionar delay de animação às seções
    const secoes = document.querySelectorAll('.secao-configuracao');
    secoes.forEach((secao, index) => {
        secao.style.animationDelay = `${index * 0.1}s`;
    });

    // Efeito de entrada
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
}

function animarSaida() {
    document.body.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    document.body.style.opacity = '0';
    document.body.style.transform = 'translateX(-20px)';
}

function adicionarEfeitoClick(elemento) {
    elemento.style.transform = 'scale(0.95)';
    elemento.style.transition = 'transform 0.15s ease';
    
    setTimeout(() => {
        elemento.style.transform = 'scale(1)';
    }, 150);
}

function adicionarEfeitoSwitch(switchElement) {
    const slider = switchElement.nextElementSibling;
    if (slider) {
        slider.style.transform = 'scale(1.05)';
        setTimeout(() => {
            slider.style.transform = 'scale(1)';
        }, 200);
    }
}

// --- SUPORTE A TECLADO ---
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + S para salvar
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        salvarTodasPreferencias();
    }
    
    // Esc para voltar
    if (e.key === 'Escape' && !document.querySelector('.modal-overlay.ativo')) {
        window.location.href = '../Home/home.html';
    }
});

console.log('🎨 Sistema de configurações carregado com sucesso!');