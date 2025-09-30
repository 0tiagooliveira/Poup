// --- FIREBASE CONFIG E INICIALIZAÇÃO ---
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getFirestore, doc, updateDoc, deleteDoc, collection, getDocs } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-storage.js';

const firebaseConfig = {
    apiKey: "AIzaSyBBjLr2DGJ0FuH9MBQGhTa5_2lOmwxFkGI",
    authDomain: "poup-8b8f7.firebaseapp.com",
    projectId: "poup-8b8f7",
    storageBucket: "poup-8b8f7.appspot.com",
    messagingSenderId: "150878508946",
    appId: "1:150878508946:web:5a2adfdab80a2f24d5aac8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- VARIÁVEIS GLOBAIS ---
let usuarioAtual = null;
let preferencesData = {};

// --- DADOS DOS BANCOS E MOEDAS ---
const bancos = {
    'nubank': 'Nubank',
    'itau': 'Itaú',
    'bradesco': 'Bradesco',
    'banco-do-brasil': 'Banco do Brasil',
    'caixa': 'Caixa Econômica',
    'santander': 'Santander',
    'picpay': 'PicPay',
    'outros': 'Outros'
};

const moedas = {
    'BRL': 'Real (R$)',
    'USD': 'Dólar ($)',
    'EUR': 'Euro (€)',
    'GBP': 'Libra (£)'
};

// --- INICIALIZAÇÃO DA PÁGINA ---
document.addEventListener('DOMContentLoaded', function() {
    verificarAutenticacao();
    inicializarEventListeners();
    carregarPreferenciasUsuario();
});

// --- VERIFICAÇÃO DE AUTENTICAÇÃO ---
function verificarAutenticacao() {
    auth.onAuthStateChanged((user) => {
        if (user) {
            usuarioAtual = user;
            preencherDadosUsuario();
        } else {
            window.location.href = '../index.html';
        }
    });
}

// --- PREENCHER DADOS DO USUÁRIO ---
function preencherDadosUsuario() {
    if (!usuarioAtual) return;

    const nomeInput = document.getElementById('input-nome');
    const emailInput = document.getElementById('input-email');
    const avatarImg = document.getElementById('avatar-usuario');

    if (nomeInput) {
        nomeInput.value = usuarioAtual.displayName || 'Usuário';
    }
    
    if (emailInput) {
        emailInput.value = usuarioAtual.email || '';
    }
    
    if (avatarImg) {
        avatarImg.src = usuarioAtual.photoURL || '../Icon/perfil.svg';
    }

    // Carregar preferências salvas
    carregarPreferencias();
}

// --- CARREGAR PREFERÊNCIAS DO USUÁRIO ---
async function carregarPreferencias() {
    try {
        const preferenciasRef = doc(db, 'preferencias', usuarioAtual.uid);
        const preferenciasDoc = await getDoc(preferenciasRef);
        
        if (preferenciasDoc.exists()) {
            preferencesData = preferenciasDoc.data();
            aplicarPreferencias();
        } else {
            // Definir preferências padrão
            preferencesData = {
                notificacoes: true,
                modoEscuro: false,
                moeda: 'BRL',
                biometria: false,
                somaTelaInicial: true,
                adicaoRapida: false
            };
            await salvarPreferencias();
        }
    } catch (error) {
        console.error('Erro ao carregar preferências:', error);
        mostrarToast('Erro ao carregar preferências', 'erro');
    }
}

// --- APLICAR PREFERÊNCIAS NA INTERFACE ---
function aplicarPreferencias() {
    const switchNotificacoes = document.getElementById('switch-notificacoes');
    const switchModoEscuro = document.getElementById('switch-modo-escuro');
    const selectMoeda = document.getElementById('select-moeda');
    const switchBiometria = document.getElementById('switch-biometria');
    const switchSomaInicial = document.getElementById('switch-soma-inicial');
    const switchAdicaoRapida = document.getElementById('switch-adicao-rapida');

    if (switchNotificacoes) switchNotificacoes.checked = preferencesData.notificacoes;
    if (switchModoEscuro) switchModoEscuro.checked = preferencesData.modoEscuro;
    if (selectMoeda) selectMoeda.value = preferencesData.moeda;
    if (switchBiometria) switchBiometria.checked = preferencesData.biometria;
    if (switchSomaInicial) switchSomaInicial.checked = preferencesData.somaTelaInicial;
    if (switchAdicaoRapida) switchAdicaoRapida.checked = preferencesData.adicaoRapida;

    // Aplicar modo escuro se ativado
    if (preferencesData.modoEscuro) {
        aplicarModoEscuro();
    }
}

// --- SALVAR PREFERÊNCIAS ---
async function salvarPreferencias() {
    try {
        const preferenciasRef = doc(db, 'preferencias', usuarioAtual.uid);
        await setDoc(preferenciasRef, preferencesData);
        mostrarToast('Preferências salvas com sucesso', 'sucesso');
    } catch (error) {
        console.error('Erro ao salvar preferências:', error);
        mostrarToast('Erro ao salvar preferências', 'erro');
    }
}

// --- INICIALIZAR EVENT LISTENERS ---
function inicializarEventListeners() {
    // Botão voltar
    const botaoVoltar = document.getElementById('botao-voltar');
    if (botaoVoltar) {
        botaoVoltar.addEventListener('click', () => {
            window.location.href = '../Home/home.html';
        });
    }

    // Upload de avatar
    const botaoAlterarFoto = document.getElementById('botao-alterar-foto');
    const inputFoto = document.getElementById('input-foto');
    
    if (botaoAlterarFoto && inputFoto) {
        botaoAlterarFoto.addEventListener('click', () => inputFoto.click());
        inputFoto.addEventListener('change', handleUploadAvatar);
    }

    // Editar nome
    const btnEditarNome = document.getElementById('btn-editar-nome');
    if (btnEditarNome) {
        btnEditarNome.addEventListener('click', editarNome);
    }

    // Alterar senha
    const btnAlterarSenha = document.getElementById('btn-alterar-senha');
    if (btnAlterarSenha) {
        btnAlterarSenha.addEventListener('click', abrirModalAlterarSenha);
    }

    // Switches de preferências
    const switches = [
        'switch-notificacoes',
        'switch-modo-escuro', 
        'switch-biometria',
        'switch-soma-inicial',
        'switch-adicao-rapida'
    ];

    switches.forEach(switchId => {
        const switchElement = document.getElementById(switchId);
        if (switchElement) {
            switchElement.addEventListener('change', handlePreferenceChange);
        }
    });

    // Select de moeda
    const selectMoeda = document.getElementById('select-moeda');
    if (selectMoeda) {
        selectMoeda.addEventListener('change', handlePreferenceChange);
    }

    // Ações de dados
    const btnExportarDados = document.getElementById('btn-exportar-dados');
    const btnLimparCache = document.getElementById('btn-limpar-cache');
    const btnExcluirConta = document.getElementById('btn-excluir-conta');

    if (btnExportarDados) btnExportarDados.addEventListener('click', exportarDados);
    if (btnLimparCache) btnLimparCache.addEventListener('click', limparCache);
    if (btnExcluirConta) btnExcluirConta.addEventListener('click', abrirModalExcluirConta);

    // Botão logout
    const botaoLogout = document.getElementById('botao-logout');
    if (botaoLogout) {
        botaoLogout.addEventListener('click', abrirModalLogout);
    }

    // Modal controls
    const modalOverlays = document.querySelectorAll('.modal-overlay');
    modalOverlays.forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                fecharModal(overlay.id);
            }
        });
    });

    const modalCloses = document.querySelectorAll('.modal-close');
    modalCloses.forEach(close => {
        close.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal-overlay');
            fecharModal(modal.id);
        });
    });

    // Botões de confirmação dos modais
    const btnConfirmarSenha = document.getElementById('btn-confirmar-senha');
    const btnConfirmarLogout = document.getElementById('btn-confirmar-logout');
    const btnConfirmarExclusao = document.getElementById('btn-confirmar-exclusao');

    if (btnConfirmarSenha) btnConfirmarSenha.addEventListener('click', confirmarAlteracaoSenha);
    if (btnConfirmarLogout) btnConfirmarLogout.addEventListener('click', confirmarLogout);
    if (btnConfirmarExclusao) btnConfirmarExclusao.addEventListener('click', confirmarExclusaoConta);
}

// --- UPLOAD DE AVATAR ---
async function handleUploadAvatar(event) {
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

    try {
        mostrarToast('Enviando foto...', 'sucesso');
        
        const avatarRef = ref(storage, `avatars/${usuarioAtual.uid}`);
        await uploadBytes(avatarRef, arquivo);
        const downloadURL = await getDownloadURL(avatarRef);
        
        // Atualizar perfil do usuário
        await updateProfile(usuarioAtual, {
            photoURL: downloadURL
        });

        // Atualizar imagem na interface
        const avatarImg = document.getElementById('avatar-usuario');
        if (avatarImg) {
            avatarImg.src = downloadURL;
        }

        mostrarToast('Foto atualizada com sucesso!', 'sucesso');
    } catch (error) {
        console.error('Erro ao fazer upload da foto:', error);
        mostrarToast('Erro ao atualizar foto', 'erro');
    }
}

// --- EDITAR NOME ---
async function editarNome() {
    const inputNome = document.getElementById('input-nome');
    const btnEditar = document.getElementById('btn-editar-nome');
    
    if (inputNome.readOnly) {
        // Habilitar edição
        inputNome.readOnly = false;
        inputNome.focus();
        btnEditar.innerHTML = '<span class="material-icons">check</span>';
        btnEditar.title = 'Salvar nome';
    } else {
        // Salvar alteração
        const novoNome = inputNome.value.trim();
        
        if (!novoNome) {
            mostrarToast('Nome não pode estar vazio', 'erro');
            return;
        }

        try {
            await updateProfile(usuarioAtual, {
                displayName: novoNome
            });

            inputNome.readOnly = true;
            btnEditar.innerHTML = '<span class="material-icons">edit</span>';
            btnEditar.title = 'Editar nome';
            
            mostrarToast('Nome atualizado com sucesso!', 'sucesso');
        } catch (error) {
            console.error('Erro ao atualizar nome:', error);
            mostrarToast('Erro ao atualizar nome', 'erro');
        }
    }
}

// --- MODAIS DE SENHA ---
function abrirModalAlterarSenha() {
    const modal = document.getElementById('modal-alterar-senha');
    if (modal) {
        modal.classList.add('ativo');
        
        // Limpar campos
        document.getElementById('senha-atual').value = '';
        document.getElementById('nova-senha').value = '';
        document.getElementById('confirmar-senha').value = '';
    }
}

async function confirmarAlteracaoSenha() {
    const senhaAtual = document.getElementById('senha-atual').value;
    const novaSenha = document.getElementById('nova-senha').value;
    const confirmarSenha = document.getElementById('confirmar-senha').value;

    // Validações
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
        mostrarToast('Preencha todos os campos', 'erro');
        return;
    }

    if (novaSenha !== confirmarSenha) {
        mostrarToast('Senhas não coincidem', 'erro');
        return;
    }

    if (novaSenha.length < 6) {
        mostrarToast('Nova senha deve ter pelo menos 6 caracteres', 'erro');
        return;
    }

    try {
        // Reautenticar usuário
        const credential = EmailAuthProvider.credential(usuarioAtual.email, senhaAtual);
        await reauthenticateWithCredential(usuarioAtual, credential);

        // Atualizar senha
        await updatePassword(usuarioAtual, novaSenha);

        fecharModal('modal-alterar-senha');
        mostrarToast('Senha alterada com sucesso!', 'sucesso');
    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        
        if (error.code === 'auth/wrong-password') {
            mostrarToast('Senha atual incorreta', 'erro');
        } else {
            mostrarToast('Erro ao alterar senha', 'erro');
        }
    }
}

// --- MANIPULAR MUDANÇAS DE PREFERÊNCIAS ---
function handlePreferenceChange(event) {
    const elemento = event.target;
    const preferencia = elemento.id.replace('switch-', '').replace('select-', '');
    
    let valor;
    if (elemento.type === 'checkbox') {
        valor = elemento.checked;
    } else {
        valor = elemento.value;
    }

    // Mapear IDs para chaves de preferência
    const mapeamento = {
        'notificacoes': 'notificacoes',
        'modo-escuro': 'modoEscuro',
        'biometria': 'biometria',
        'soma-inicial': 'somaTelaInicial',
        'adicao-rapida': 'adicaoRapida',
        'moeda': 'moeda'
    };

    const chave = mapeamento[preferencia];
    if (chave) {
        preferencesData[chave] = valor;
        
        // Aplicar mudanças específicas
        if (chave === 'modoEscuro') {
            if (valor) {
                aplicarModoEscuro();
            } else {
                removerModoEscuro();
            }
        }
        
        salvarPreferencias();
    }
}

// --- MODO ESCURO ---
function aplicarModoEscuro() {
    document.documentElement.style.setProperty('--cor-fundo-app', '#1e293b');
    document.documentElement.style.setProperty('--cor-fundo-conteudo', '#334155');
    document.documentElement.style.setProperty('--cor-texto-principal', '#f1f5f9');
    document.documentElement.style.setProperty('--cor-texto-secundario', '#cbd5e1');
    document.documentElement.style.setProperty('--cor-borda', '#475569');
}

function removerModoEscuro() {
    document.documentElement.style.setProperty('--cor-fundo-app', '#f8fafc');
    document.documentElement.style.setProperty('--cor-fundo-conteudo', '#ffffff');
    document.documentElement.style.setProperty('--cor-texto-principal', '#1e293b');
    document.documentElement.style.setProperty('--cor-texto-secundario', '#64748b');
    document.documentElement.style.setProperty('--cor-borda', '#e2e8f0');
}

// --- EXPORTAR DADOS ---
async function exportarDados() {
    try {
        mostrarToast('Preparando exportação...', 'sucesso');

        const dadosUsuario = {
            usuario: {
                nome: usuarioAtual.displayName,
                email: usuarioAtual.email,
                dataExportacao: new Date().toISOString()
            },
            preferencias: preferencesData
        };

        // Buscar dados de contas
        const contasRef = collection(db, 'contas');
        const contasSnapshot = await getDocs(contasRef);
        dadosUsuario.contas = [];
        
        contasSnapshot.forEach((doc) => {
            if (doc.data().usuarioId === usuarioAtual.uid) {
                dadosUsuario.contas.push({
                    id: doc.id,
                    ...doc.data()
                });
            }
        });

        // Buscar receitas
        const receitasRef = collection(db, 'receitas');
        const receitasSnapshot = await getDocs(receitasRef);
        dadosUsuario.receitas = [];
        
        receitasSnapshot.forEach((doc) => {
            if (doc.data().usuarioId === usuarioAtual.uid) {
                dadosUsuario.receitas.push({
                    id: doc.id,
                    ...doc.data()
                });
            }
        });

        // Buscar despesas
        const despesasRef = collection(db, 'despesas');
        const despesasSnapshot = await getDocs(despesasRef);
        dadosUsuario.despesas = [];
        
        despesasSnapshot.forEach((doc) => {
            if (doc.data().usuarioId === usuarioAtual.uid) {
                dadosUsuario.despesas.push({
                    id: doc.id,
                    ...doc.data()
                });
            }
        });

        // Criar e baixar arquivo
        const dataStr = JSON.stringify(dadosUsuario, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `poup_dados_${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        mostrarToast('Dados exportados com sucesso!', 'sucesso');
    } catch (error) {
        console.error('Erro ao exportar dados:', error);
        mostrarToast('Erro ao exportar dados', 'erro');
    }
}

// --- LIMPAR CACHE ---
function limparCache() {
    try {
        // Limpar localStorage
        localStorage.clear();
        
        // Limpar sessionStorage
        sessionStorage.clear();
        
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

// --- MODAL DE EXCLUSÃO DE CONTA ---
function abrirModalExcluirConta() {
    const modal = document.getElementById('modal-excluir-conta');
    if (modal) {
        modal.classList.add('ativo');
    }
}

async function confirmarExclusaoConta() {
    try {
        // Deletar dados do usuário
        const colecoes = ['contas', 'receitas', 'despesas', 'preferencias'];
        
        for (const colecao of colecoes) {
            const ref = collection(db, colecao);
            const snapshot = await getDocs(ref);
            
            const deletePromises = [];
            snapshot.forEach((docSnapshot) => {
                if (docSnapshot.data().usuarioId === usuarioAtual.uid) {
                    deletePromises.push(deleteDoc(doc(db, colecao, docSnapshot.id)));
                }
            });
            
            await Promise.all(deletePromises);
        }

        // Deletar conta do usuário
        await usuarioAtual.delete();

        mostrarToast('Conta excluída com sucesso', 'sucesso');
        
        setTimeout(() => {
            window.location.href = '../index.html';
        }, 2000);
        
    } catch (error) {
        console.error('Erro ao excluir conta:', error);
        mostrarToast('Erro ao excluir conta. Tente fazer login novamente.', 'erro');
        fecharModal('modal-excluir-conta');
    }
}

// --- MODAL DE LOGOUT ---
function abrirModalLogout() {
    const modal = document.getElementById('modal-logout');
    if (modal) {
        modal.classList.add('ativo');
    }
}

async function confirmarLogout() {
    try {
        await auth.signOut();
        window.location.href = '../index.html';
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
        mostrarToast('Erro ao fazer logout', 'erro');
    }
}

// --- CONTROLE DE MODAIS ---
function fecharModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('ativo');
    }
}

// --- SISTEMA DE TOAST ---
function mostrarToast(mensagem, tipo = 'sucesso') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = document.getElementById('toast-icon');
    
    if (!toast || !toastMessage || !toastIcon) return;

    // Configurar ícone e classe baseado no tipo
    toast.className = `toast ${tipo}`;
    
    switch (tipo) {
        case 'sucesso':
            toastIcon.textContent = 'check_circle';
            break;
        case 'erro':
            toastIcon.textContent = 'error';
            break;
        case 'aviso':
            toastIcon.textContent = 'warning';
            break;
        default:
            toastIcon.textContent = 'info';
    }
    
    toastMessage.textContent = mensagem;
    
    // Mostrar toast
    toast.classList.add('ativo');
    
    // Esconder após 3 segundos
    setTimeout(() => {
        toast.classList.remove('ativo');
    }, 3000);
}

// --- CARREGAR PREFERÊNCIAS DO USUÁRIO (FUNÇÃO AUXILIAR) ---
function carregarPreferenciasUsuario() {
    // Aplicar preferências salvas no localStorage como fallback
    const preferenciasSalvas = localStorage.getItem('preferenciasUsuario');
    if (preferenciasSalvas) {
        try {
            const preferencias = JSON.parse(preferenciasSalvas);
            if (preferencias.modoEscuro) {
                aplicarModoEscuro();
            }
        } catch (error) {
            console.error('Erro ao carregar preferências do localStorage:', error);
        }
    }
}

// --- SALVAR PREFERÊNCIAS NO LOCALSTORAGE ---
function salvarPreferenciasLocal() {
    localStorage.setItem('preferenciasUsuario', JSON.stringify(preferencesData));
}