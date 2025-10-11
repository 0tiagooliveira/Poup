// --- VARIÁVEIS GLOBAIS ---
let usuarioAtual = null;
let preferencesData = {
    notificacoes: true,
    moeda: 'BRL',
    biometria: false
};

// --- INICIALIZAÇÃO DA PÁGINA ---
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Inicializando página de configurações...');
    
    // Teste básico de funcionamento
    console.log('🧪 Testando console.log - funcionando!');
    
    verificarAutenticacao();
    inicializarEventListeners();
    carregarPreferenciasLocal();
    adicionarAnimacoes();
    
    // Criar backup automático
    setTimeout(() => {
        criarBackupLocal();
    }, 2000);
    
    // Verificar integridade dos dados
    verificarIntegridadeDados();
    
    // Teste de funcionalidade após 1 segundo
    setTimeout(() => {
        testarFuncionalidades();
    }, 1000);
});

// --- TESTE DE FUNCIONALIDADES ---
function testarFuncionalidades() {
    console.log('🧪 Testando funcionalidades...');
    
    // Teste básico primeiro
    console.log('🧪 JavaScript funcionando!');
    
    // Teste do toast
    try {
        mostrarToast('Sistema carregado com sucesso!', 'sucesso');
        console.log('✅ Toast funcionando');
    } catch (error) {
        console.error('❌ Erro no toast:', error);
        alert('Toast não está funcionando: ' + error.message);
    }
    
    // Teste dos elementos DOM
    const elementos = {
        'notificacoes': document.getElementById('notificacoes'),
        'biometria': document.getElementById('biometria'),
        'moeda-padrao': document.getElementById('moeda-padrao'),
        'exportar-dados': document.getElementById('exportar-dados'),
        'limpar-cache': document.getElementById('limpar-cache'),
        'excluir-conta': document.getElementById('excluir-conta')
    };
    
    Object.entries(elementos).forEach(([nome, elemento]) => {
        console.log(`🔍 ${nome}:`, elemento ? '✅ Encontrado' : '❌ Não encontrado');
    });
    
    // Contar itens clicáveis
    const clicaveis = document.querySelectorAll('.item-configuracao.clickable');
    console.log(`🖱️ Total de itens clicáveis encontrados: ${clicaveis.length}`);
    
    clicaveis.forEach((item, index) => {
        const id = item.id || 'sem-id';
        const icone = item.querySelector('.material-icons')?.textContent?.trim() || 'sem-ícone';
        console.log(`   ${index + 1}. ID: "${id}", Ícone: "${icone}"`);
    });
    
    // Adicionar um teste de clique manual
    setTimeout(() => {
        console.log('🔧 Adicionando testes manuais...');
        
        // Adicionar botões de teste temporários
        const botaoTesteAjuda = document.createElement('button');
        botaoTesteAjuda.textContent = 'TESTE: Abrir Ajuda';
        botaoTesteAjuda.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 9999; background: red; color: white; padding: 10px;';
        botaoTesteAjuda.onclick = () => {
            console.log('🧪 Teste manual: Abrindo ajuda');
            abrirCentralAjuda();
        };
        document.body.appendChild(botaoTesteAjuda);
        
        const botaoTestePolitica = document.createElement('button');
        botaoTestePolitica.textContent = 'TESTE: Abrir Política';
        botaoTestePolitica.style.cssText = 'position: fixed; top: 60px; right: 10px; z-index: 9999; background: blue; color: white; padding: 10px;';
        botaoTestePolitica.onclick = () => {
            console.log('🧪 Teste manual: Abrindo política');
            abrirPoliticaPrivacidade();
        };
        document.body.appendChild(botaoTestePolitica);
        
        const botaoTesteSenha = document.createElement('button');
        botaoTesteSenha.textContent = 'TESTE: Alterar Senha';
        botaoTesteSenha.style.cssText = 'position: fixed; top: 110px; right: 10px; z-index: 9999; background: green; color: white; padding: 10px;';
        botaoTesteSenha.onclick = () => {
            console.log('🧪 Teste manual: Abrindo alterar senha');
            abrirModalAlterarSenha();
        };
        document.body.appendChild(botaoTesteSenha);
        
        // Marcar elementos para identificação
        const primeiroItem = document.querySelector('.item-configuracao.clickable');
        if (primeiroItem) {
            primeiroItem.style.border = '2px solid red';
            primeiroItem.title = 'TESTE: Clique aqui para testar';
            console.log('🔴 Primeiro item marcado em vermelho para teste');
        }
        
        console.log('🧪 Botões de teste adicionados no canto superior direito');
    }, 2000);
}

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
    console.log('👤 Preenchendo dados do usuário...');
    
    // Criar usuário padrão se não existir
    if (!usuarioAtual) {
        usuarioAtual = {
            displayName: 'Usuário Poup+',
            nome: 'Usuário Poup+',
            email: 'usuario@poup.com'
        };
        console.log('👤 Usuário padrão criado');
    }

    const nomeInput = document.getElementById('nome-usuario');
    const emailInput = document.getElementById('email-usuario');
    const avatarImg = document.getElementById('avatar-usuario');

    if (nomeInput) {
        nomeInput.value = usuarioAtual.displayName || usuarioAtual.nome || 'Usuário Poup+';
        nomeInput.readOnly = false; // Permitir edição
        
        // Salvar alterações do nome quando o campo perde o foco
        nomeInput.addEventListener('blur', () => {
            const novoNome = nomeInput.value.trim();
            if (novoNome && novoNome !== (usuarioAtual.displayName || usuarioAtual.nome)) {
                salvarNomeUsuario(novoNome);
            }
        });
        
        // Também salvar quando pressionar Enter
        nomeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.target.blur(); // Dispara o evento blur
            }
        });
        
        console.log('✅ Campo nome configurado:', nomeInput.value);
    } else {
        console.log('❌ Campo nome não encontrado');
    }
    
    if (emailInput) {
        emailInput.value = usuarioAtual.email || 'usuario@poup.com';
        emailInput.readOnly = false; // Permitir edição do email também
        
        // Salvar alterações do email
        emailInput.addEventListener('blur', () => {
            const novoEmail = emailInput.value.trim();
            if (novoEmail && novoEmail !== usuarioAtual.email && isValidEmail(novoEmail)) {
                salvarEmailUsuario(novoEmail);
            } else if (novoEmail && !isValidEmail(novoEmail)) {
                mostrarToast('Email inválido', 'erro');
                emailInput.value = usuarioAtual.email; // Restaurar email anterior
            }
        });
        
        console.log('✅ Campo email configurado:', emailInput.value);
    } else {
        console.log('❌ Campo email não encontrado');
    }
    
    if (avatarImg) {
        // Tentar carregar avatar salvo localmente primeiro
        const avatarSalvo = localStorage.getItem('avatarUsuario');
        if (avatarSalvo) {
            avatarImg.src = avatarSalvo;
        } else {
            avatarImg.src = usuarioAtual.photoURL || '../Icon/perfil.svg';
        }
        
        // Adicionar fallback para caso a imagem não carregue
        avatarImg.onerror = function() {
            this.src = '../Icon/perfil.svg';
        };
        
        console.log('✅ Avatar configurado');
    } else {
        console.log('❌ Avatar não encontrado');
    }

    console.log('👤 Dados do usuário preenchidos');
}

// --- VALIDAR EMAIL ---
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// --- SALVAR EMAIL DO USUÁRIO ---
function salvarEmailUsuario(novoEmail) {
    if (!isValidEmail(novoEmail)) {
        mostrarToast('Email inválido', 'erro');
        return;
    }
    
    // Atualizar dados do usuário
    if (usuarioAtual) {
        usuarioAtual.email = novoEmail;
    }
    
    // Salvar no localStorage
    const dadosUsuario = JSON.parse(localStorage.getItem('dadosUsuario') || '{}');
    dadosUsuario.email = novoEmail;
    localStorage.setItem('dadosUsuario', JSON.stringify(dadosUsuario));
    
    mostrarToast('Email atualizado com sucesso!', 'sucesso');
    console.log('📧 Email do usuário atualizado:', novoEmail);
}

// --- SALVAR NOME DO USUÁRIO ---
function salvarNomeUsuario(novoNome) {
    if (!novoNome.trim()) return;
    
    // Atualizar dados do usuário
    if (usuarioAtual) {
        usuarioAtual.displayName = novoNome;
        usuarioAtual.nome = novoNome;
    }
    
    // Salvar no localStorage
    const dadosUsuario = JSON.parse(localStorage.getItem('dadosUsuario') || '{}');
    dadosUsuario.nome = novoNome;
    dadosUsuario.displayName = novoNome;
    localStorage.setItem('dadosUsuario', JSON.stringify(dadosUsuario));
    
    mostrarToast('Nome atualizado com sucesso!', 'sucesso');
    console.log('📝 Nome do usuário atualizado:', novoNome);
}

// --- INICIALIZAR EVENT LISTENERS ---
function inicializarEventListeners() {
    console.log('🎛️ Inicializando event listeners...');
    
    // Teste básico - adicionar um clique simples primeiro
    document.body.addEventListener('click', (e) => {
        console.log('🖱️ Clique detectado em:', e.target.tagName, e.target.className, e.target.id);
    });
    
    // Botão voltar com animação
    const botaoVoltar = document.querySelector('.botao-voltar');
    if (botaoVoltar) {
        botaoVoltar.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🔙 Botão voltar clicado');
            window.location.href = '../Home/home.html';
        });
        console.log('✅ Botão voltar configurado');
    } else {
        console.log('❌ Botão voltar não encontrado');
    }

    // Upload de avatar
    const botaoAlterarFoto = document.getElementById('botao-alterar-foto');
    const inputFoto = document.getElementById('input-foto');
    
    console.log('📷 Botão alterar foto:', botaoAlterarFoto ? '✅ Encontrado' : '❌ Não encontrado');
    console.log('📷 Input foto:', inputFoto ? '✅ Encontrado' : '❌ Não encontrado');
    
    if (botaoAlterarFoto && inputFoto) {
        botaoAlterarFoto.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('📷 Botão alterar foto clicado');
            inputFoto.click();
        });
        
        inputFoto.addEventListener('change', (e) => {
            console.log('📷 Arquivo selecionado');
            handleUploadAvatar(e);
        });
        console.log('✅ Upload de avatar configurado');
    } else {
        console.log('❌ Elementos de upload não encontrados');
        
        // Tentar criar os elementos se não existirem
        if (!inputFoto) {
            const input = document.createElement('input');
            input.type = 'file';
            input.id = 'input-foto';
            input.accept = 'image/*';
            input.style.display = 'none';
            document.body.appendChild(input);
            
            if (botaoAlterarFoto) {
                botaoAlterarFoto.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('📷 Botão alterar foto clicado (elemento criado)');
                    input.click();
                });
                
                input.addEventListener('change', handleUploadAvatar);
                console.log('✅ Input de foto criado e configurado');
            }
        }
    }

    // Configurar switches individualmente
    configurarSwitch('notificacoes');
    configurarSwitch('biometria');
    
    // Select de moeda
    configurarSelectMoeda();
    
    // Configurar itens clicáveis individualmente
    configurarItensClicaveis();
    
    // Botão logout
    const botaoLogout = document.getElementById('botao-logout');
    if (botaoLogout) {
        botaoLogout.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('🚪 Botão logout clicado');
            abrirModalLogout();
        });
        console.log('✅ Botão logout configurado');
    } else {
        console.log('❌ Botão logout não encontrado');
    }

    // Botão salvar
    const botaoSalvar = document.getElementById('botao-salvar');
    if (botaoSalvar) {
        botaoSalvar.addEventListener('click', () => {
            console.log('💾 Botão salvar clicado');
            salvarTodasPreferencias();
        });
        console.log('✅ Botão salvar configurado');
    } else {
        console.log('❌ Botão salvar não encontrado');
    }

    // Event listeners para modais
    setupModalEventListeners();
    
    // Verificar se todas as funções essenciais estão disponíveis
    verificarFuncoesEssenciais();
    
    console.log('✅ Event listeners configurados');
}

// --- CONFIGURAR SWITCH INDIVIDUAL ---
function configurarSwitch(id) {
    const switchElement = document.getElementById(id);
    console.log(`🔄 Configurando switch ${id}:`, switchElement ? '✅ Encontrado' : '❌ Não encontrado');
    
    if (switchElement) {
        switchElement.addEventListener('change', (e) => {
            console.log(`🔄 Switch ${id} alterado para:`, e.target.checked);
            
            try {
                if (id === 'biometria') {
                    handleBiometriaChange(e);
                } else {
                    handlePreferenceChange(e);
                }
                
                // Efeito visual simplificado
                const slider = switchElement.nextElementSibling;
                if (slider) {
                    slider.style.transform = 'scale(1.05)';
                    setTimeout(() => {
                        slider.style.transform = 'scale(1)';
                    }, 200);
                }
            } catch (error) {
                console.error(`❌ Erro ao processar switch ${id}:`, error);
                mostrarToast('Erro ao alterar configuração', 'erro');
            }
        });
        console.log(`✅ Switch ${id} configurado`);
    }
}

// --- CONFIGURAR SELECT DE MOEDA ---
function configurarSelectMoeda() {
    const selectMoeda = document.getElementById('moeda-padrao');
    console.log('💰 Configurando select moeda:', selectMoeda ? '✅ Encontrado' : '❌ Não encontrado');
    
    if (selectMoeda) {
        selectMoeda.addEventListener('change', (e) => {
            console.log('💰 Moeda alterada para:', e.target.value);
            try {
                handlePreferenceChange(e);
            } catch (error) {
                console.error('❌ Erro ao alterar moeda:', error);
                mostrarToast('Erro ao alterar moeda', 'erro');
            }
        });
        console.log('✅ Select moeda configurado');
    }
}

// --- CONFIGURAR ITENS CLICÁVEIS ---
function configurarItensClicaveis() {
    // Configurar cada item individualmente para maior controle
    
    // Alterar senha
    const alterarSenha = document.getElementById('alterar-senha');
    if (alterarSenha) {
        alterarSenha.addEventListener('click', (e) => {
            console.log('� Alterar senha clicado');
            try {
                abrirModalAlterarSenha();
            } catch (error) {
                console.error('❌ Erro ao abrir modal alterar senha:', error);
                mostrarToast('Erro ao abrir configuração de senha', 'erro');
            }
        });
        console.log('✅ Alterar senha configurado');
    }
    
    // Exportar dados
    const exportarDadosElement = document.getElementById('exportar-dados');
    if (exportarDadosElement) {
        exportarDadosElement.addEventListener('click', (e) => {
            console.log('📤 Exportar dados clicado');
            try {
                exportarDados();
            } catch (error) {
                console.error('❌ Erro ao exportar dados:', error);
                mostrarToast('Erro ao exportar dados', 'erro');
            }
        });
        console.log('✅ Exportar dados configurado');
    }
    
    // Limpar cache
    const limparCacheElement = document.getElementById('limpar-cache');
    if (limparCacheElement) {
        limparCacheElement.addEventListener('click', (e) => {
            console.log('🧹 Limpar cache clicado');
            try {
                limparCache();
            } catch (error) {
                console.error('❌ Erro ao limpar cache:', error);
                mostrarToast('Erro ao limpar cache', 'erro');
            }
        });
        console.log('✅ Limpar cache configurado');
    }
    
    // Excluir conta
    const excluirConta = document.getElementById('excluir-conta');
    if (excluirConta) {
        excluirConta.addEventListener('click', (e) => {
            console.log('❌ Excluir conta clicado');
            try {
                abrirModalExcluirConta();
            } catch (error) {
                console.error('❌ Erro ao abrir modal excluir conta:', error);
                mostrarToast('Erro ao abrir exclusão de conta', 'erro');
            }
        });
        console.log('✅ Excluir conta configurado');
    }
    
    // Central de Ajuda e Política de Privacidade (sem ID)
    console.log('🔍 Configurando itens sem ID...');
    const todosItens = document.querySelectorAll('.item-configuracao.clickable');
    console.log(`📋 Total de itens clicáveis: ${todosItens.length}`);
    
    todosItens.forEach((item, index) => {
        const id = item.id;
        const icone = item.querySelector('.material-icons');
        const textoIcone = icone ? icone.textContent.trim() : 'sem-ícone';
        
        console.log(`   ${index + 1}. ID: "${id || 'sem-id'}", Ícone: "${textoIcone}"`);
        
        if (!id) {
            if (textoIcone === 'help') {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('❓ Central de ajuda clicado');
                    try {
                        abrirCentralAjuda();
                    } catch (error) {
                        console.error('❌ Erro ao abrir central de ajuda:', error);
                        mostrarToast('Erro ao abrir central de ajuda', 'erro');
                    }
                });
                console.log('✅ Central de ajuda configurado');
            } else if (textoIcone === 'policy') {
                item.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('📋 Política de privacidade clicado');
                    try {
                        abrirPoliticaPrivacidade();
                    } catch (error) {
                        console.error('❌ Erro ao abrir política de privacidade:', error);
                        mostrarToast('Erro ao abrir política de privacidade', 'erro');
                    }
                });
                console.log('✅ Política de privacidade configurado');
            }
        }
    });
    
    // Método alternativo - configurar por título
    const ajudaItem = Array.from(todosItens).find(item => {
        const titulo = item.querySelector('.titulo');
        return titulo && titulo.textContent.includes('Central de Ajuda');
    });
    
    if (ajudaItem && !ajudaItem.hasAttribute('data-configurado')) {
        ajudaItem.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('❓ Central de ajuda clicado (por título)');
            abrirCentralAjuda();
        });
        ajudaItem.setAttribute('data-configurado', 'true');
        console.log('✅ Central de ajuda configurado (método alternativo)');
    }
    
    const politicaItem = Array.from(todosItens).find(item => {
        const titulo = item.querySelector('.titulo');
        return titulo && titulo.textContent.includes('Política de Privacidade');
    });
    
    if (politicaItem && !politicaItem.hasAttribute('data-configurado')) {
        politicaItem.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('📋 Política de privacidade clicado (por título)');
            abrirPoliticaPrivacidade();
        });
        politicaItem.setAttribute('data-configurado', 'true');
        console.log('✅ Política de privacidade configurado (método alternativo)');
    }
}

// --- VERIFICAÇÃO DE FUNÇÕES ESSENCIAIS ---
function verificarFuncoesEssenciais() {
    const funcoes = [
        'mostrarToast', 'adicionarEfeitoClick', 'abrirCentralAjuda', 
        'abrirPoliticaPrivacidade', 'exportarDados', 'limparCache',
        'abrirModalAlterarSenha', 'abrirModalExcluirConta', 'handlePreferenceChange',
        'handleBiometriaChange'
    ];
    
    const faltando = [];
    funcoes.forEach(nome => {
        if (typeof window[nome] !== 'function') {
            faltando.push(nome);
        }
    });
    
    if (faltando.length > 0) {
        console.error('❌ Funções não encontradas:', faltando);
    } else {
        console.log('✅ Todas as funções essenciais estão disponíveis');
    }
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
    console.log('📷 Iniciando upload de avatar...');
    
    const arquivo = event.target.files[0];
    if (!arquivo) {
        console.log('❌ Nenhum arquivo selecionado');
        return;
    }

    console.log('📷 Arquivo selecionado:', arquivo.name, arquivo.type, arquivo.size);

    // Validar tipo de arquivo
    if (!arquivo.type.startsWith('image/')) {
        mostrarToast('Por favor, selecione uma imagem válida', 'erro');
        console.log('❌ Tipo de arquivo inválido');
        return;
    }

    // Validar tamanho (máximo 5MB)
    if (arquivo.size > 5 * 1024 * 1024) {
        mostrarToast('A imagem deve ter no máximo 5MB', 'erro');
        console.log('❌ Arquivo muito grande');
        return;
    }

    // Mostrar preview e salvar
    mostrarToast('Atualizando foto...', 'sucesso');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        console.log('📷 Arquivo lido com sucesso');
        
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
            console.log('✅ Avatar atualizado');
        } else {
            console.log('❌ Elemento avatar não encontrado');
            mostrarToast('Erro ao atualizar foto', 'erro');
        }
    };
    
    reader.onerror = function() {
        console.log('❌ Erro ao ler arquivo');
        mostrarToast('Erro ao processar imagem', 'erro');
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
        'biometria': 'biometria',
        'moedapadrao': 'moeda'
    };

    const chave = mapeamento[preferencia];
    if (chave) {
        preferencesData[chave] = valor;
        
        // Aplicar mudanças específicas
        if (chave === 'notificacoes') {
            if (valor) {
                solicitarPermissaoNotificacao();
            } else {
                mostrarToast('Notificações desativadas', 'sucesso');
            }
        }
        
        if (chave === 'moeda') {
            mostrarToast(`Moeda alterada para ${valor}`, 'sucesso');
        }
        
        salvarPreferenciasLocal();
        console.log('⚙️ Preferência atualizada:', chave, valor);
    }
}

// --- AUTENTICAÇÃO BIOMÉTRICA ---
async function handleBiometriaChange(event) {
    const switchBiometria = event.target;
    const isActivating = switchBiometria.checked;

    if (isActivating) {
        // Verificar se WebAuthn está disponível
        if (!window.PublicKeyCredential) {
            mostrarToast('Autenticação biométrica não suportada neste navegador', 'erro');
            switchBiometria.checked = false;
            return;
        }

        try {
            // Verificar se há métodos biométricos disponíveis
            const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
            
            if (!isAvailable) {
                mostrarToast('Nenhum método biométrico disponível neste dispositivo', 'aviso');
                switchBiometria.checked = false;
                return;
            }

            // Solicitar configuração da biometria
            await configurarBiometria();
            preferencesData.biometria = true;
            salvarPreferenciasLocal();
            mostrarToast('Autenticação biométrica ativada com sucesso!', 'sucesso');
            
        } catch (error) {
            console.error('Erro ao configurar biometria:', error);
            mostrarToast('Erro ao configurar autenticação biométrica', 'erro');
            switchBiometria.checked = false;
        }
    } else {
        // Desativar biometria
        preferencesData.biometria = false;
        salvarPreferenciasLocal();
        localStorage.removeItem('credencialBiometrica');
        mostrarToast('Autenticação biométrica desativada', 'sucesso');
    }
}

async function configurarBiometria() {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const publicKeyCredentialCreationOptions = {
        challenge: challenge,
        rp: {
            name: "Poup+",
            id: window.location.hostname,
        },
        user: {
            id: new TextEncoder().encode(usuarioAtual?.email || 'usuario@poup.com'),
            name: usuarioAtual?.email || 'usuario@poup.com',
            displayName: usuarioAtual?.displayName || 'Usuário Poup+',
        },
        pubKeyCredParams: [{alg: -7, type: "public-key"}],
        authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
        },
        timeout: 60000,
        attestation: "direct"
    };

    const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
    });

    // Salvar a credencial para futuras autenticações
    localStorage.setItem('credencialBiometrica', JSON.stringify({
        id: credential.id,
        rawId: Array.from(new Uint8Array(credential.rawId)),
        type: credential.type
    }));

    return credential;
}

async function verificarBiometria() {
    const credencialSalva = localStorage.getItem('credencialBiometrica');
    if (!credencialSalva) {
        throw new Error('Nenhuma credencial biométrica configurada');
    }

    const credencial = JSON.parse(credencialSalva);
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const publicKeyCredentialRequestOptions = {
        challenge: challenge,
        allowCredentials: [{
            id: new Uint8Array(credencial.rawId),
            type: 'public-key',
        }],
        timeout: 60000,
        userVerification: "required"
    };

    return await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
    });
}

// --- SISTEMA DE NOTIFICAÇÕES APRIMORADO ---
async function solicitarPermissaoNotificacao() {
    if (!("Notification" in window)) {
        mostrarToast('Notificações não suportadas neste navegador', 'aviso');
        return;
    }

    if (Notification.permission === "granted") {
        mostrarToast('Notificações já estão ativadas', 'sucesso');
        return;
    }

    if (Notification.permission === "denied") {
        mostrarToast('Notificações foram negadas. Ative nas configurações do navegador', 'aviso');
        return;
    }

    try {
        const permission = await Notification.requestPermission();
        
        if (permission === "granted") {
            mostrarToast('Notificações ativadas com sucesso!', 'sucesso');
            
            // Enviar notificação de teste
            new Notification("Poup+ Configurações", {
                body: "Notificações ativadas com sucesso! Você receberá lembretes importantes.",
                icon: "../Icon/LogoPoup.svg",
                badge: "../Icon/LogoPoup.svg",
                tag: "test-notification"
            });
        } else {
            mostrarToast('Permissão de notificação negada', 'aviso');
            document.getElementById('notificacoes').checked = false;
        }
    } catch (error) {
        console.error('Erro ao solicitar permissão de notificação:', error);
        mostrarToast('Erro ao configurar notificações', 'erro');
        document.getElementById('notificacoes').checked = false;
    }
}

// --- MODAIS ---
function abrirModalAlterarSenha() {
    console.log('🔐 Abrindo modal de alterar senha...');
    
    try {
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
        console.log('✅ Modal de alterar senha criado');
    } catch (error) {
        console.error('❌ Erro ao criar modal:', error);
        mostrarToast('Erro ao abrir janela de alteração de senha', 'erro');
    }
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

// --- CENTRAL DE AJUDA ---
function abrirCentralAjuda() {
    console.log('❓ Abrindo central de ajuda...');
    
    try {
        const conteudoAjuda = `
            <div style="text-align: left; max-height: 400px; overflow-y: auto;">
                <h4 style="color: var(--cor-primaria); margin-bottom: 16px;">❓ Perguntas Frequentes</h4>
                
                <div style="margin-bottom: 20px;">
                    <h5 style="margin-bottom: 8px;">Como criar uma nova conta?</h5>
                    <p style="font-size: 14px; color: var(--cor-texto-secundario); margin-bottom: 12px;">
                        Vá para a seção "Contas" e clique no botão "+". Preencha as informações como nome do banco, 
                        tipo de conta e saldo inicial.
                    </p>
                </div>

                <div style="margin-bottom: 20px;">
                    <h5 style="margin-bottom: 8px;">Como categorizar receitas e despesas?</h5>
                    <p style="font-size: 14px; color: var(--cor-texto-secundario); margin-bottom: 12px;">
                        Ao adicionar uma receita ou despesa, você pode selecionar ou criar uma categoria. 
                        Isso ajuda na organização e nos relatórios.
                    </p>
                </div>

                <div style="margin-bottom: 20px;">
                    <h5 style="margin-bottom: 8px;">Como exportar meus dados?</h5>
                    <p style="font-size: 14px; color: var(--cor-texto-secundario); margin-bottom: 12px;">
                        Nas configurações, vá em "Dados e Privacidade" > "Exportar Dados". 
                        Seus dados serão baixados em formato JSON.
                    </p>
                </div>

                <div style="margin-bottom: 20px;">
                    <h5 style="margin-bottom: 8px;">Posso usar o app offline?</h5>
                    <p style="font-size: 14px; color: var(--cor-texto-secundario); margin-bottom: 12px;">
                        Sim! O Poup+ funciona offline. Seus dados são sincronizados quando você se conecta à internet.
                    </p>
                </div>

                <div style="margin-bottom: 20px;">
                    <h5 style="margin-bottom: 8px;">Como ativar as notificações?</h5>
                    <p style="font-size: 14px; color: var(--cor-texto-secundario); margin-bottom: 12px;">
                        Vá em Configurações > Aplicativo > Notificações e ative o switch. 
                        O navegador solicitará permissão.
                    </p>
                </div>

                <hr style="margin: 20px 0; border: none; height: 1px; background: var(--cor-borda);">
                
                <h4 style="color: var(--cor-primaria); margin-bottom: 16px;">📞 Contato</h4>
                <p style="font-size: 14px; margin-bottom: 8px;">
                    <strong>Email:</strong> suporte@poup.com.br
                </p>
                <p style="font-size: 14px; margin-bottom: 8px;">
                    <strong>WhatsApp:</strong> (11) 99999-9999
                </p>
                <p style="font-size: 14px;">
                    <strong>Horário:</strong> Segunda à Sexta, 9h às 18h
                </p>
            </div>
        `;

        criarModalDinamico(
            'Central de Ajuda',
            conteudoAjuda,
            'Fechar',
            null,
            false
        );
        console.log('✅ Central de ajuda aberta');
    } catch (error) {
        console.error('❌ Erro ao abrir central de ajuda:', error);
        mostrarToast('Erro ao abrir central de ajuda', 'erro');
    }
}

// --- POLÍTICA DE PRIVACIDADE ---
function abrirPoliticaPrivacidade() {
    console.log('📋 Abrindo política de privacidade...');
    
    try {
        const conteudoPolitica = `
            <div style="text-align: left; max-height: 400px; overflow-y: auto;">
                <h4 style="color: var(--cor-primaria); margin-bottom: 16px;">🔒 Nossa Política de Privacidade</h4>
                
                <div style="margin-bottom: 20px;">
                    <h5 style="margin-bottom: 8px;">Coleta de Dados</h5>
                    <p style="font-size: 14px; color: var(--cor-texto-secundario); margin-bottom: 12px;">
                        Coletamos apenas dados essenciais para o funcionamento do app: email, nome, 
                        transações financeiras e preferências de configuração.
                    </p>
                </div>

                <div style="margin-bottom: 20px;">
                    <h5 style="margin-bottom: 8px;">Armazenamento</h5>
                    <p style="font-size: 14px; color: var(--cor-texto-secundario); margin-bottom: 12px;">
                        Seus dados são armazenados localmente no seu dispositivo e, opcionalmente, 
                        sincronizados com nossa nuvem segura usando criptografia.
                    </p>
                </div>

                <div style="margin-bottom: 20px;">
                    <h5 style="margin-bottom: 8px;">Compartilhamento</h5>
                    <p style="font-size: 14px; color: var(--cor-texto-secundario); margin-bottom: 12px;">
                        Nunca compartilhamos seus dados pessoais ou financeiros com terceiros. 
                        Seus dados são exclusivamente seus.
                    </p>
                </div>

                <div style="margin-bottom: 20px;">
                    <h5 style="margin-bottom: 8px;">Segurança</h5>
                    <p style="font-size: 14px; color: var(--cor-texto-secundario); margin-bottom: 12px;">
                        Utilizamos criptografia AES-256, autenticação biométrica e outras medidas 
                        de segurança para proteger suas informações.
                    </p>
                </div>

                <div style="margin-bottom: 20px;">
                    <h5 style="margin-bottom: 8px;">Seus Direitos</h5>
                    <p style="font-size: 14px; color: var(--cor-texto-secundario); margin-bottom: 12px;">
                        Você pode a qualquer momento: exportar seus dados, limpar cache, 
                        ou excluir permanentemente sua conta.
                    </p>
                </div>

                <div style="margin-bottom: 20px;">
                    <h5 style="margin-bottom: 8px;">Cookies</h5>
                    <p style="font-size: 14px; color: var(--cor-texto-secundario); margin-bottom: 12px;">
                        Utilizamos apenas cookies essenciais para funcionamento da sessão. 
                        Não usamos cookies de rastreamento.
                    </p>
                </div>

                <hr style="margin: 20px 0; border: none; height: 1px; background: var(--cor-borda);">
                
                <p style="font-size: 12px; color: var(--cor-texto-terciario); text-align: center;">
                    Última atualização: 10 de outubro de 2025<br>
                    Versão 1.0 da Política de Privacidade
                </p>
            </div>
        `;

        criarModalDinamico(
            'Política de Privacidade',
            conteudoPolitica,
            'Fechar',
            null,
            false
        );
        console.log('✅ Política de privacidade aberta');
    } catch (error) {
        console.error('❌ Erro ao abrir política de privacidade:', error);
        mostrarToast('Erro ao abrir política de privacidade', 'erro');
    }
}
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

    // Validação da senha atual
    if (!validarSenhaAtual(senhaAtual)) {
        mostrarToast('Senha atual incorreta', 'erro');
        return false;
    }

    // Verificar se a nova senha é diferente da atual
    if (senhaAtual === novaSenha) {
        mostrarToast('A nova senha deve ser diferente da atual', 'aviso');
        return false;
    }

    // Validar força da nova senha
    const forcaSenha = calcularForcaSenha(novaSenha);
    if (forcaSenha < 3) {
        mostrarToast('Senha muito fraca. Use letras, números e símbolos', 'aviso');
        return false;
    }

    // Simular alteração de senha com delay realista
    mostrarToast('Alterando senha...', 'sucesso');
    
    setTimeout(() => {
        // Atualizar senha no localStorage (simulação)
        const dadosUsuario = JSON.parse(localStorage.getItem('dadosUsuario') || '{}');
        dadosUsuario.senhaHash = gerarHashSenha(novaSenha);
        localStorage.setItem('dadosUsuario', JSON.stringify(dadosUsuario));
        
        mostrarToast('Senha alterada com sucesso!', 'sucesso');
    }, 1500);

    return true;
}

// --- VALIDAÇÃO DE SENHA ---
function validarSenhaAtual(senhaInformada) {
    // Simular validação de senha
    // Em um app real, isso seria feito no backend de forma segura
    const dadosUsuario = JSON.parse(localStorage.getItem('dadosUsuario') || '{}');
    
    // Se não há senha salva, aceitar qualquer senha para primeira configuração
    if (!dadosUsuario.senhaHash) {
        // Salvar a senha atual como hash para futuras validações
        dadosUsuario.senhaHash = gerarHashSenha(senhaInformada);
        localStorage.setItem('dadosUsuario', JSON.stringify(dadosUsuario));
        return true;
    }
    
    // Comparar hash da senha informada com a salva
    const hashInformado = gerarHashSenha(senhaInformada);
    return hashInformado === dadosUsuario.senhaHash;
}

function gerarHashSenha(senha) {
    // Simulação simples de hash (em produção usar bcrypt ou similar)
    let hash = 0;
    if (senha.length === 0) return hash;
    for (let i = 0; i < senha.length; i++) {
        const char = senha.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Converter para 32bit integer
    }
    return hash.toString();
}

function calcularForcaSenha(senha) {
    let forca = 0;
    
    // Comprimento
    if (senha.length >= 8) forca++;
    if (senha.length >= 12) forca++;
    
    // Caracteres diferentes
    if (/[a-z]/.test(senha)) forca++;
    if (/[A-Z]/.test(senha)) forca++;
    if (/[0-9]/.test(senha)) forca++;
    if (/[^A-Za-z0-9]/.test(senha)) forca++;
    
    return Math.min(forca, 5);
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
    try {
        const dadosParaSalvar = {
            ...preferencesData,
            ultimaAtualizacao: new Date().toISOString(),
            versao: '1.0.0'
        };
        
        localStorage.setItem('preferenciasUsuario', JSON.stringify(dadosParaSalvar));
        console.log('💾 Preferências salvas:', preferencesData);
        
        // Tentar sincronizar com nuvem se disponível
        sincronizarComNuvem();
        
    } catch (error) {
        console.error('Erro ao salvar preferências:', error);
        mostrarToast('Erro ao salvar configurações', 'erro');
    }
}

// --- SINCRONIZAÇÃO COM NUVEM ---
function sincronizarComNuvem() {
    // Simular sincronização com Firebase ou outro serviço
    if (typeof firebase !== 'undefined' && firebase.auth && usuarioAtual) {
        try {
            // Em uma implementação real, salvaria no Firestore
            console.log('☁️ Simulando sincronização com nuvem...');
            
            // Mostrar indicador de sincronização
            const botaoSalvar = document.getElementById('botao-salvar');
            if (botaoSalvar) {
                const icone = botaoSalvar.querySelector('.material-icons');
                if (icone) {
                    icone.textContent = 'cloud_upload';
                    setTimeout(() => {
                        icone.textContent = 'cloud_done';
                        setTimeout(() => {
                            icone.textContent = 'save';
                        }, 2000);
                    }, 1000);
                }
            }
            
        } catch (error) {
            console.error('Erro na sincronização:', error);
        }
    }
}

// --- BACKUP AUTOMÁTICO ---
function criarBackupLocal() {
    const backup = {
        usuario: usuarioAtual,
        preferencias: preferencesData,
        configuracoes: {
            versaoApp: '1.0.0',
            dataBackup: new Date().toISOString(),
            dispositivo: navigator.userAgent
        }
    };
    
    localStorage.setItem('backupConfiguracao', JSON.stringify(backup));
    console.log('📦 Backup local criado');
}

// --- RESTAURAR BACKUP ---
function restaurarBackup() {
    try {
        const backup = localStorage.getItem('backupConfiguracao');
        if (backup) {
            const dadosBackup = JSON.parse(backup);
            
            if (dadosBackup.preferencias) {
                preferencesData = { ...preferencesData, ...dadosBackup.preferencias };
                aplicarPreferenciasInterface();
                salvarPreferenciasLocal();
                mostrarToast('Configurações restauradas do backup', 'sucesso');
            }
        }
    } catch (error) {
        console.error('Erro ao restaurar backup:', error);
        mostrarToast('Erro ao restaurar backup', 'erro');
    }
}

function carregarPreferenciasLocal() {
    const preferenciasSalvas = localStorage.getItem('preferenciasUsuario');
    if (preferenciasSalvas) {
        try {
            const preferenciasCarregadas = JSON.parse(preferenciasSalvas);
            preferencesData = { ...preferencesData, ...preferenciasCarregadas };
            aplicarPreferenciasInterface();
            console.log('📂 Preferências carregadas:', preferencesData);
        } catch (error) {
            console.error('Erro ao carregar preferências:', error);
            mostrarToast('Erro ao carregar preferências salvas', 'aviso');
        }
    } else {
        // Carregar preferências do sistema/navegador se disponível
        carregarPreferenciasDoSistema();
    }
}

function carregarPreferenciasDoSistema() {
    // Detectar idioma/região para moeda
    const locale = navigator.language || navigator.userLanguage;
    if (locale.startsWith('en-US')) {
        preferencesData.moeda = 'USD';
    } else if (locale.startsWith('en-GB') || locale.startsWith('fr') || locale.startsWith('de')) {
        preferencesData.moeda = 'EUR';
    } else {
        preferencesData.moeda = 'BRL'; // Padrão Brasil
    }
    
    aplicarPreferenciasInterface();
    console.log('🌐 Preferências do sistema aplicadas:', preferencesData);
}

function aplicarPreferenciasInterface() {
    const switchNotificacoes = document.getElementById('notificacoes');
    const selectMoeda = document.getElementById('moeda-padrao');
    const switchBiometria = document.getElementById('biometria');

    // Aplicar valores salvos aos controles
    if (switchNotificacoes) {
        switchNotificacoes.checked = preferencesData.notificacoes;
        // Verificar se as notificações estão realmente habilitadas no navegador
        if (preferencesData.notificacoes && "Notification" in window) {
            if (Notification.permission !== "granted") {
                // Se as notificações estão marcadas como ativas mas não há permissão, desativar
                preferencesData.notificacoes = false;
                switchNotificacoes.checked = false;
            }
        }
    }
    
    if (selectMoeda) {
        selectMoeda.value = preferencesData.moeda;
        // Adicionar event listener para mudanças
        selectMoeda.addEventListener('change', (e) => {
            preferencesData.moeda = e.target.value;
            salvarPreferenciasLocal();
            mostrarToast(`Moeda alterada para ${e.target.value}`, 'sucesso');
        });
    }
    
    if (switchBiometria) {
        switchBiometria.checked = preferencesData.biometria;
        // Verificar se a biometria ainda está disponível
        if (preferencesData.biometria && window.PublicKeyCredential) {
            PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(available => {
                if (!available) {
                    preferencesData.biometria = false;
                    switchBiometria.checked = false;
                    salvarPreferenciasLocal();
                }
            });
        }
    }

    console.log('🎨 Preferências aplicadas à interface');
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

// --- VERIFICAÇÃO DE INTEGRIDADE ---
function verificarIntegridadeDados() {
    const dadosUsuario = localStorage.getItem('dadosUsuario');
    const preferenciasUsuario = localStorage.getItem('preferenciasUsuario');
    
    let problemas = [];
    
    // Verificar dados do usuário
    if (dadosUsuario) {
        try {
            const dados = JSON.parse(dadosUsuario);
            if (!dados.email && !dados.nome) {
                problemas.push('Dados do usuário incompletos');
            }
        } catch (error) {
            problemas.push('Dados do usuário corrompidos');
        }
    }
    
    // Verificar preferências
    if (preferenciasUsuario) {
        try {
            const prefs = JSON.parse(preferenciasUsuario);
            if (typeof prefs.notificacoes !== 'boolean') {
                preferencesData.notificacoes = true;
                problemas.push('Preferência de notificações corrigida');
            }
            if (!['BRL', 'USD', 'EUR'].includes(prefs.moeda)) {
                preferencesData.moeda = 'BRL';
                problemas.push('Moeda padrão corrigida');
            }
        } catch (error) {
            problemas.push('Preferências corrompidas - usando padrões');
            preferencesData = {
                notificacoes: true,
                moeda: 'BRL',
                biometria: false
            };
        }
    }
    
    // Verificar tamanho do localStorage
    const storageSize = new Blob(Object.values(localStorage)).size;
    if (storageSize > 5 * 1024 * 1024) { // 5MB
        problemas.push('Armazenamento local ocupando muito espaço');
    }
    
    if (problemas.length > 0) {
        console.warn('⚠️ Problemas encontrados:', problemas);
        if (problemas.some(p => p.includes('corrompido'))) {
            mostrarToast('Alguns dados foram corrigidos automaticamente', 'aviso');
            salvarPreferenciasLocal();
        }
    } else {
        console.log('✅ Integridade dos dados verificada');
    }
}

console.log('🎨 Sistema de configurações carregado com sucesso!');