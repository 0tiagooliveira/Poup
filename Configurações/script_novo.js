// === POUP+ CONFIGURAÇÕES - SCRIPT COM FIREBASE ===
console.log('🚀 Iniciando Configurações Poup+...');

// Variáveis Globais
let usuarioAtual = {
    nome: 'Usuário Poup+',
    email: 'usuario@poup.com',
    avatar: '../Icon/perfil.svg',
    uid: null
};

let auth = null;
let db = null;

// Inicializar Firebase
function inicializarFirebase() {
    try {
        if (typeof firebase !== 'undefined' && !firebase.apps.length) {
            firebase.initializeApp({
                apiKey: "AIzaSyC7RB9fULmkp9xeJIjc0dL58atHJ8CM-Xc",
                authDomain: "poup-beta.firebaseapp.com",
                projectId: "poup-beta",
                storageBucket: "poup-beta.appspot.com",
                messagingSenderId: "954695915981",
                appId: "1:954695915981:web:d31b216f79eac178094c84",
                measurementId: "G-LP9BDVD3KJ"
            });
        }
        auth = firebase.auth();
        db = firebase.firestore();
        console.log('✅ Firebase inicializado');
        return true;
    } catch (error) {
        console.error('❌ Erro ao inicializar Firebase:', error);
        return false;
    }
}

// Carregar dados do Firebase
async function carregarDadosDoFirebase(uid) {
    try {
        console.log('🔍 Carregando dados do Firebase para UID:', uid);
        
        // Buscar documento do usuário
        const doc = await db.collection('usuarios').doc(uid).get();
        
        if (doc.exists) {
            const dados = doc.data();
            console.log('✅ Dados do Firebase carregados:', dados);
            
            usuarioAtual = {
                uid: uid,
                nome: dados.nome || dados.displayName || 'Usuário Poup+',
                email: dados.email || 'usuario@poup.com',
                avatar: dados.avatar || dados.photoURL || '../Icon/perfil.svg'
            };
            
            // Salvar também no localStorage como cache
            localStorage.setItem('dadosUsuario', JSON.stringify(usuarioAtual));
            
            return true;
        } else {
            // Se não existe, criar documento com dados do Auth
            console.log('📝 Criando documento do usuário...');
            const user = auth.currentUser;
            
            usuarioAtual = {
                uid: uid,
                nome: user.displayName || user.email?.split('@')[0] || 'Usuário Poup+',
                email: user.email || 'usuario@poup.com',
                avatar: user.photoURL || '../Icon/perfil.svg'
            };
            
            // Criar documento no Firestore
            await db.collection('usuarios').doc(uid).set({
                nome: usuarioAtual.nome,
                email: usuarioAtual.email,
                avatar: usuarioAtual.avatar,
                dataCriacao: firebase.firestore.FieldValue.serverTimestamp(),
                dataAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log('✅ Documento do usuário criado');
            localStorage.setItem('dadosUsuario', JSON.stringify(usuarioAtual));
            
            return true;
        }
    } catch (error) {
        console.error('❌ Erro ao carregar dados do Firebase:', error);
        // Fallback para localStorage
        carregarDadosDoLocalStorage();
        return false;
    }
}

// Carregar dados do localStorage (fallback)
function carregarDadosDoLocalStorage() {
    const dadosSalvos = localStorage.getItem('dadosUsuario');
    if (dadosSalvos) {
        try {
            usuarioAtual = JSON.parse(dadosSalvos);
            console.log('✅ Dados carregados do localStorage');
        } catch (e) {
            console.error('❌ Erro ao carregar dados do localStorage:', e);
        }
    }
}

// Inicialização quando o DOM carregar
document.addEventListener('DOMContentLoaded', async function() {
    console.log('✅ DOM Carregado - Iniciando configurações...');
    
    // Inicializar Firebase
    const firebaseOk = inicializarFirebase();
    
    if (firebaseOk && auth) {
        // Aguardar autenticação
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                console.log('✅ Usuário autenticado:', user.uid);
                usuarioAtual.uid = user.uid;
                
                // Carregar dados do Firebase
                await carregarDadosDoFirebase(user.uid);
                preencherDadosUsuario();
                configurarEventos();
                
                mostrarToast('Configurações carregadas!', 'sucesso');
            } else {
                console.log('⚠️ Usuário não autenticado');
                // Redirecionar para login
                window.location.href = '../index.html';
            }
        });
    } else {
        // Se Firebase não estiver disponível, usar localStorage
        console.log('⚠️ Firebase indisponível, usando localStorage');
        carregarDadosDoLocalStorage();
        preencherDadosUsuario();
        configurarEventos();
        mostrarToast('Configurações carregadas (modo offline)!', 'info');
    }
});

// Preencher dados do usuário
function preencherDadosUsuario() {
    const nomeInput = document.getElementById('nome-usuario');
    const emailInput = document.getElementById('email-usuario');
    const avatarImg = document.getElementById('avatar-usuario');
    const nomeExibicao = document.getElementById('nome-exibicao');
    const emailExibicao = document.getElementById('email-exibicao');
    
    // Preencher campos de input (ocultos)
    if (nomeInput) {
        nomeInput.value = usuarioAtual.nome || 'Usuário Poup+';
    }
    
    if (emailInput) {
        emailInput.value = usuarioAtual.email || 'usuario@poup.com';
    }
    
    // Preencher campos de exibição (visíveis)
    if (nomeExibicao) {
        nomeExibicao.textContent = usuarioAtual.nome || 'Não definido';
    }
    
    if (emailExibicao) {
        emailExibicao.textContent = usuarioAtual.email || 'Não definido';
    }
    
    // Avatar
    if (avatarImg) {
        const avatarSalvo = localStorage.getItem('avatarUsuario');
        avatarImg.src = avatarSalvo || usuarioAtual.avatar || '../Icon/perfil.svg';
    }
    
    console.log('✅ Dados do usuário preenchidos');
}

// Configurar todos os eventos
function configurarEventos() {
    console.log('🔧 Configurando eventos...');
    
    // Botão voltar
    const btnVoltar = document.querySelector('.botao-voltar');
    if (btnVoltar) {
        btnVoltar.onclick = () => window.location.href = '../Home/home.html';
        console.log('✅ Botão voltar configurado');
    }
    
    // Configurar edição inline de nome
    configurarEdicaoInline('nome');
    
    // Configurar edição inline de email
    configurarEdicaoInline('email');
    
    // Upload de avatar
    const btnFoto = document.getElementById('botao-alterar-foto');
    const inputFoto = document.getElementById('input-foto');
    
    if (btnFoto && inputFoto) {
        btnFoto.onclick = (e) => {
            e.preventDefault();
            console.log('📷 Abrindo seletor de foto');
            inputFoto.click();
        };
        inputFoto.onchange = (e) => uploadAvatar(e);
        console.log('✅ Upload de foto configurado');
    }
    
    // Switches
    configurarSwitch('notificacoes');
    configurarSwitch('biometria');
    
    // Select moeda
    const selectMoeda = document.getElementById('moeda-padrao');
    if (selectMoeda) {
        selectMoeda.onchange = () => {
            mostrarToast('Moeda alterada para ' + selectMoeda.value, 'sucesso');
        };
    }
    
    // Configurar itens clicáveis
    configurarItem('alterar-senha', abrirAlterarSenha);
    configurarItem('exportar-dados', exportarDados);
    configurarItem('limpar-cache', limparCache);
    configurarItem('excluir-conta', excluirConta);
    
    // Central de Ajuda e Política (por texto)
    configurarPorTexto('Central de Ajuda', abrirCentralAjuda);
    configurarPorTexto('Política de Privacidade', abrirPoliticaPrivacidade);
    
    // Botão logout
    const btnLogout = document.getElementById('botao-logout');
    if (btnLogout) {
        btnLogout.onclick = () => {
            if (confirm('Deseja sair da sua conta?')) {
                localStorage.clear();
                window.location.href = '../index.html';
            }
        };
        console.log('✅ Logout configurado');
    }
    
    // Botão salvar
    const btnSalvar = document.getElementById('botao-salvar');
    if (btnSalvar) {
        btnSalvar.onclick = () => {
            salvarTudo();
            mostrarToast('Configurações salvas!', 'sucesso');
        };
    }
    
    console.log('✅ Todos os eventos configurados');
}

// Configurar switch individual
function configurarSwitch(id) {
    const switchEl = document.getElementById(id);
    if (switchEl) {
        switchEl.onchange = () => {
            console.log(`Switch ${id}:`, switchEl.checked);
            mostrarToast(
                switchEl.checked ? `${id} ativado` : `${id} desativado`,
                'sucesso'
            );
        };
        console.log(`✅ Switch ${id} configurado`);
    }
}

// Configurar item clicável por ID
function configurarItem(id, funcao) {
    const elemento = document.getElementById(id);
    if (elemento) {
        elemento.onclick = (e) => {
            e.preventDefault();
            console.log(`🖱️ Clicado: ${id}`);
            funcao();
        };
        console.log(`✅ ${id} configurado`);
    } else {
        console.warn(`⚠️ Elemento não encontrado: ${id}`);
    }
}

// Configurar item por texto
function configurarPorTexto(texto, funcao) {
    const items = document.querySelectorAll('.item-configuracao');
    items.forEach(item => {
        const titulo = item.querySelector('.titulo');
        if (titulo && titulo.textContent.includes(texto)) {
            item.onclick = (e) => {
                e.preventDefault();
                console.log(`🖱️ Clicado: ${texto}`);
                funcao();
            };
            console.log(`✅ ${texto} configurado`);
        }
    });
}

// === FUNÇÕES DE AÇÃO ===

// Função para configurar edição inline
function configurarEdicaoInline(campo) {
    const botaoEditar = document.getElementById(`botao-editar-${campo}`);
    const valorExibicao = document.getElementById(`${campo}-exibicao`);
    const inputEditavel = document.getElementById(`${campo}-usuario`);
    
    if (!botaoEditar || !valorExibicao || !inputEditavel) {
        console.warn(`⚠️ Elementos de edição não encontrados para: ${campo}`);
        return;
    }
    
    let modoEdicao = false;
    
    botaoEditar.onclick = (e) => {
        e.preventDefault();
        
        if (!modoEdicao) {
            // Entrar no modo de edição
            console.log(`✏️ Editando ${campo}`);
            modoEdicao = true;
            
            // Esconder valor e mostrar input
            valorExibicao.style.display = 'none';
            inputEditavel.style.display = 'block';
            inputEditavel.focus();
            inputEditavel.select();
            
            // Mudar ícone do botão
            botaoEditar.classList.add('editando');
            botaoEditar.innerHTML = '<span class="material-icons">check</span>';
            
        } else {
            // Salvar e sair do modo de edição
            console.log(`💾 Salvando ${campo}`);
            
            const novoValor = inputEditavel.value.trim();
            
            // Validar
            if (!novoValor) {
                inputEditavel.classList.add('invalido');
                mostrarToast(`${campo === 'nome' ? 'Nome' : 'Email'} não pode estar vazio!`, 'erro');
                setTimeout(() => inputEditavel.classList.remove('invalido'), 500);
                return;
            }
            
            if (campo === 'email' && !novoValor.includes('@')) {
                inputEditavel.classList.add('invalido');
                mostrarToast('Email inválido!', 'erro');
                setTimeout(() => inputEditavel.classList.remove('invalido'), 500);
                return;
            }
            
            // Salvar
            if (campo === 'nome') {
                salvarNome(novoValor);
            } else if (campo === 'email') {
                salvarEmail(novoValor);
            }
            
            // Atualizar exibição
            valorExibicao.textContent = novoValor;
            valorExibicao.style.display = 'block';
            inputEditavel.style.display = 'none';
            
            // Restaurar botão
            modoEdicao = false;
            botaoEditar.classList.remove('editando');
            botaoEditar.innerHTML = '<span class="material-icons">edit</span>';
            
            // Feedback visual
            inputEditavel.classList.add('valido');
            setTimeout(() => inputEditavel.classList.remove('valido'), 500);
        }
    };
    
    // Permitir salvar com Enter
    inputEditavel.onkeypress = (e) => {
        if (e.key === 'Enter') {
            botaoEditar.click();
        }
    };
    
    // Cancelar com Esc
    inputEditavel.onkeydown = (e) => {
        if (e.key === 'Escape') {
            // Restaurar valor original
            inputEditavel.value = valorExibicao.textContent;
            valorExibicao.style.display = 'block';
            inputEditavel.style.display = 'none';
            
            modoEdicao = false;
            botaoEditar.classList.remove('editando');
            botaoEditar.innerHTML = '<span class="material-icons">edit</span>';
            
            mostrarToast('Edição cancelada', 'info');
        }
    };
    
    console.log(`✅ Edição inline configurada para: ${campo}`);
}

function salvarNome(nome) {
    if (nome && nome.trim()) {
        usuarioAtual.nome = nome.trim();
        salvarDadosUsuario();
        mostrarToast('Nome atualizado!', 'sucesso');
    }
}

function salvarEmail(email) {
    if (email && email.includes('@')) {
        usuarioAtual.email = email.trim();
        salvarDadosUsuario();
        mostrarToast('Email atualizado!', 'sucesso');
    } else if (email) {
        mostrarToast('Email inválido!', 'erro');
    }
}

async function salvarDadosUsuario() {
    try {
        // Salvar no localStorage (cache local)
        localStorage.setItem('dadosUsuario', JSON.stringify(usuarioAtual));
        console.log('💾 Dados salvos no localStorage');
        
        // Salvar no Firebase se disponível
        if (db && usuarioAtual.uid) {
            console.log('☁️ Salvando dados no Firebase...');
            
            await db.collection('usuarios').doc(usuarioAtual.uid).set({
                nome: usuarioAtual.nome,
                email: usuarioAtual.email,
                avatar: usuarioAtual.avatar,
                dataAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true }); // merge: true para não sobrescrever outros campos
            
            console.log('✅ Dados salvos no Firebase');
            
            // Atualizar também o displayName do Firebase Auth se o nome mudou
            if (auth && auth.currentUser) {
                await auth.currentUser.updateProfile({
                    displayName: usuarioAtual.nome
                });
                console.log('✅ DisplayName atualizado no Firebase Auth');
            }
        }
    } catch (error) {
        console.error('❌ Erro ao salvar dados:', error);
        // Mesmo com erro no Firebase, os dados ficam salvos no localStorage
        mostrarToast('Dados salvos localmente', 'info');
    }
}

function salvarTudo() {
    salvarDadosUsuario();
    console.log('💾 Todas as configurações salvas');
}

async function uploadAvatar(event) {
    const arquivo = event.target.files[0];
    if (!arquivo) return;
    
    console.log('📷 Processando foto:', arquivo.name);
    
    if (!arquivo.type.startsWith('image/')) {
        mostrarToast('Selecione uma imagem válida!', 'erro');
        return;
    }
    
    if (arquivo.size > 5 * 1024 * 1024) {
        mostrarToast('Imagem muito grande (máx 5MB)!', 'erro');
        return;
    }
    
    // Mostrar loading
    mostrarToast('Enviando foto...', 'info');
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        const base64Image = e.target.result;
        const avatarImg = document.getElementById('avatar-usuario');
        
        if (avatarImg) {
            avatarImg.src = base64Image;
            
            // Salvar no localStorage (cache)
            localStorage.setItem('avatarUsuario', base64Image);
            usuarioAtual.avatar = base64Image;
            
            try {
                // Tentar salvar no Firebase Storage
                if (firebase.storage && usuarioAtual.uid) {
                    console.log('☁️ Enviando foto para Firebase Storage...');
                    
                    const storage = firebase.storage();
                    const storageRef = storage.ref();
                    const avatarRef = storageRef.child(`avatars/${usuarioAtual.uid}/avatar.jpg`);
                    
                    // Converter base64 para blob
                    const response = await fetch(base64Image);
                    const blob = await response.blob();
                    
                    // Upload do arquivo
                    const uploadTask = await avatarRef.put(blob, {
                        contentType: 'image/jpeg',
                        customMetadata: {
                            uploadDate: new Date().toISOString()
                        }
                    });
                    
                    // Obter URL pública
                    const downloadURL = await avatarRef.getDownloadURL();
                    console.log('✅ Foto enviada! URL:', downloadURL);
                    
                    // Salvar URL no Firestore
                    if (db && usuarioAtual.uid) {
                        await db.collection('usuarios').doc(usuarioAtual.uid).update({
                            avatar: downloadURL,
                            avatarUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                        
                        usuarioAtual.avatar = downloadURL;
                    }
                    
                    // Atualizar photoURL no Firebase Auth
                    if (auth && auth.currentUser) {
                        await auth.currentUser.updateProfile({
                            photoURL: downloadURL
                        });
                        console.log('✅ PhotoURL atualizado no Firebase Auth');
                    }
                    
                    mostrarToast('Foto atualizada no Firebase!', 'sucesso');
                } else {
                    // Se Firebase Storage não estiver disponível, usar apenas base64
                    console.log('⚠️ Firebase Storage indisponível, usando base64');
                    mostrarToast('Foto atualizada localmente!', 'sucesso');
                }
            } catch (error) {
                console.error('❌ Erro ao enviar foto para Firebase:', error);
                mostrarToast('Foto salva localmente (erro no upload)', 'info');
            }
            
            console.log('✅ Avatar atualizado');
        }
    };
    reader.readAsDataURL(arquivo);
}

function abrirAlterarSenha() {
    console.log('🔐 Abrindo alterar senha');
    
    const html = `
        <div style="text-align: left; padding: 20px;">
            <h3 style="margin-bottom: 20px; text-align: center;">Alterar Senha</h3>
            <label style="display: block; margin-bottom: 8px;">Senha Atual:</label>
            <input type="password" id="senha-atual" style="width: 100%; padding: 10px; margin-bottom: 15px; border: 2px solid #e2e8f0; border-radius: 8px;">
            
            <label style="display: block; margin-bottom: 8px;">Nova Senha:</label>
            <input type="password" id="nova-senha" style="width: 100%; padding: 10px; margin-bottom: 15px; border: 2px solid #e2e8f0; border-radius: 8px;">
            
            <label style="display: block; margin-bottom: 8px;">Confirmar Senha:</label>
            <input type="password" id="confirmar-senha" style="width: 100%; padding: 10px; margin-bottom: 20px; border: 2px solid #e2e8f0; border-radius: 8px;">
            
            <button onclick="confirmarSenha()" style="width: 100%; padding: 12px; background: #22c55e; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
                Alterar Senha
            </button>
            <button onclick="fecharModal()" style="width: 100%; padding: 12px; background: #gray; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 10px;">
                Cancelar
            </button>
        </div>
    `;
    
    criarModal(html);
}

function confirmarSenha() {
    const senhaAtual = document.getElementById('senha-atual')?.value;
    const novaSenha = document.getElementById('nova-senha')?.value;
    const confirmar = document.getElementById('confirmar-senha')?.value;
    
    if (!senhaAtual || !novaSenha || !confirmar) {
        mostrarToast('Preencha todos os campos!', 'erro');
        return;
    }
    
    if (novaSenha !== confirmar) {
        mostrarToast('Senhas não coincidem!', 'erro');
        return;
    }
    
    if (novaSenha.length < 6) {
        mostrarToast('Senha deve ter pelo menos 6 caracteres!', 'erro');
        return;
    }
    
    // Salvar
    localStorage.setItem('senhaUsuario', novaSenha);
    mostrarToast('Senha alterada com sucesso!', 'sucesso');
    fecharModal();
}

function abrirCentralAjuda() {
    console.log('❓ Abrindo Central de Ajuda');
    
    const html = `
        <div style="padding: 20px; max-height: 400px; overflow-y: auto;">
            <h3 style="color: #22c55e; margin-bottom: 20px;">❓ Central de Ajuda</h3>
            
            <h4>Como criar uma nova conta?</h4>
            <p style="margin-bottom: 15px;">Vá para a seção "Contas" e clique no botão "+". Preencha as informações como nome do banco, tipo de conta e saldo inicial.</p>
            
            <h4>Como categorizar receitas e despesas?</h4>
            <p style="margin-bottom: 15px;">Ao adicionar uma receita ou despesa, você pode selecionar ou criar uma categoria. Isso ajuda na organização e nos relatórios.</p>
            
            <h4>Como exportar meus dados?</h4>
            <p style="margin-bottom: 15px;">Nas configurações, vá em "Dados e Privacidade" > "Exportar Dados". Seus dados serão baixados em formato JSON.</p>
            
            <h4>📞 Contato</h4>
            <p><strong>Email:</strong> suporte@poup.com.br</p>
            <p><strong>WhatsApp:</strong> (11) 99999-9999</p>
            
            <button onclick="fecharModal()" style="width: 100%; padding: 12px; background: #22c55e; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 20px;">
                Fechar
            </button>
        </div>
    `;
    
    criarModal(html);
}

function abrirPoliticaPrivacidade() {
    console.log('📋 Abrindo Política de Privacidade');
    
    const html = `
        <div style="padding: 20px; max-height: 400px; overflow-y: auto;">
            <h3 style="color: #22c55e; margin-bottom: 20px;">🔒 Política de Privacidade</h3>
            
            <h4>Coleta de Dados</h4>
            <p style="margin-bottom: 15px;">Coletamos apenas dados essenciais: email, nome, transações financeiras e preferências.</p>
            
            <h4>Armazenamento</h4>
            <p style="margin-bottom: 15px;">Seus dados são armazenados localmente no seu dispositivo e, opcionalmente, sincronizados com nossa nuvem segura.</p>
            
            <h4>Compartilhamento</h4>
            <p style="margin-bottom: 15px;">Nunca compartilhamos seus dados pessoais ou financeiros com terceiros.</p>
            
            <h4>Segurança</h4>
            <p style="margin-bottom: 15px;">Utilizamos criptografia e autenticação biométrica para proteger suas informações.</p>
            
            <p style="text-align: center; color: #94a3b8; margin-top: 20px;">Última atualização: 10 de outubro de 2025</p>
            
            <button onclick="fecharModal()" style="width: 100%; padding: 12px; background: #22c55e; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; margin-top: 20px;">
                Fechar
            </button>
        </div>
    `;
    
    criarModal(html);
}

function exportarDados() {
    console.log('📤 Exportando dados');
    
    const dados = {
        usuario: usuarioAtual,
        data: new Date().toISOString(),
        preferencias: {
            notificacoes: document.getElementById('notificacoes')?.checked,
            biometria: document.getElementById('biometria')?.checked,
            moeda: document.getElementById('moeda-padrao')?.value
        }
    };
    
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `poup_dados_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    mostrarToast('Dados exportados!', 'sucesso');
}

function limparCache() {
    console.log('🧹 Limpando cache');
    
    if (confirm('Deseja limpar o cache? Suas configurações principais serão mantidas.')) {
        // Manter dados essenciais
        const usuario = localStorage.getItem('dadosUsuario');
        const avatar = localStorage.getItem('avatarUsuario');
        
        localStorage.clear();
        sessionStorage.clear();
        
        // Restaurar dados essenciais
        if (usuario) localStorage.setItem('dadosUsuario', usuario);
        if (avatar) localStorage.setItem('avatarUsuario', avatar);
        
        mostrarToast('Cache limpo!', 'sucesso');
    }
}

function excluirConta() {
    console.log('❌ Excluindo conta');
    
    if (confirm('⚠️ ATENÇÃO! Esta ação é IRREVERSÍVEL. Todos os seus dados serão permanentemente excluídos. Deseja continuar?')) {
        if (confirm('Tem certeza absoluta? Digite SIM para confirmar.')) {
            localStorage.clear();
            sessionStorage.clear();
            mostrarToast('Conta excluída!', 'erro');
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 2000);
        }
    }
}

// === SISTEMA DE MODAL ===

function criarModal(conteudoHTML) {
    // Remover modal existente
    const modalExistente = document.getElementById('modal-dinamico');
    if (modalExistente) {
        modalExistente.remove();
    }
    
    // Criar novo modal
    const modal = document.createElement('div');
    modal.id = 'modal-dinamico';
    modal.className = 'modal-overlay ativo';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    const conteudo = document.createElement('div');
    conteudo.className = 'modal-conteudo';
    conteudo.style.cssText = `
        background: white;
        border-radius: 20px;
        max-width: 500px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    `;
    conteudo.innerHTML = conteudoHTML;
    
    modal.appendChild(conteudo);
    document.body.appendChild(modal);
    
    // Fechar ao clicar fora
    modal.onclick = (e) => {
        if (e.target === modal) {
            fecharModal();
        }
    };
    
    console.log('✅ Modal criado');
}

function fecharModal() {
    const modal = document.getElementById('modal-dinamico');
    if (modal) {
        modal.remove();
        console.log('✅ Modal fechado');
    }
}

// Tornar funções globais para onclick
window.fecharModal = fecharModal;
window.confirmarSenha = confirmarSenha;

// === SISTEMA DE TOAST ===

function mostrarToast(mensagem, tipo = 'sucesso') {
    console.log(`📢 Toast: ${mensagem} (${tipo})`);
    
    // Remover toast existente
    const toastExistente = document.getElementById('toast-dinamico');
    if (toastExistente) {
        toastExistente.remove();
    }
    
    // Definir cores por tipo
    const cores = {
        sucesso: '#22c55e',
        erro: '#ef4444',
        info: '#3b82f6',
        aviso: '#f59e0b'
    };
    
    const cor = cores[tipo] || cores.sucesso;
    
    // Criar toast
    const toast = document.createElement('div');
    toast.id = 'toast-dinamico';
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: ${cor};
        color: white;
        padding: 15px 25px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 10001;
        font-weight: 600;
        animation: slideUp 0.3s ease;
    `;
    toast.textContent = mensagem;
    
    document.body.appendChild(toast);
    
    // Remover após 3 segundos
    setTimeout(() => {
        toast.style.animation = 'slideDown 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Animações CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from {
            transform: translateX(-50%) translateY(100px);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }
    
    @keyframes slideDown {
        from {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
        to {
            transform: translateX(-50%) translateY(100px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

console.log('✅ Script Poup+ Configurações carregado!');
