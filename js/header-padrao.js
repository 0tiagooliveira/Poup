/* ===== FUNCIONALIDADES COMUNS DO CABEÇALHO ===== */

// Função para alternar dropdown
function toggleDropdown() {
    const dropdown = document.getElementById('dropdown-menu');
    const titulo = document.querySelector('.titulo-pagina');
    
    if (!dropdown) return;
    
    const isOpen = dropdown.style.display === 'block';
    
    if (isOpen) {
        fecharDropdown();
    } else {
        abrirDropdown();
    }
}

// Função para abrir dropdown
function abrirDropdown() {
    const dropdown = document.getElementById('dropdown-menu');
    const titulo = document.querySelector('.titulo-pagina');
    
    if (!dropdown) return;
    
    dropdown.style.display = 'block';
    titulo?.classList.add('open');
    
    // Criar overlay para fechar ao clicar fora
    criarOverlayDropdown();
}

// Função para fechar dropdown
function fecharDropdown() {
    const dropdown = document.getElementById('dropdown-menu');
    const titulo = document.querySelector('.titulo-pagina');
    
    if (!dropdown) return;
    
    dropdown.style.display = 'none';
    titulo?.classList.remove('open');
    
    // Remover overlay
    removerOverlayDropdown();
}

// Criar overlay para fechar dropdown
function criarOverlayDropdown() {
    let overlay = document.getElementById('dropdown-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'dropdown-overlay';
        overlay.className = 'dropdown-overlay';
        overlay.addEventListener('click', fecharDropdown);
        document.body.appendChild(overlay);
    }
}

// Remover overlay
function removerOverlayDropdown() {
    const overlay = document.getElementById('dropdown-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// Função para navegar para outras páginas
function navegarPara(url) {
    fecharDropdown();
    setTimeout(() => {
        window.location.href = url;
    }, 100);
}

// Fechar dropdown ao pressionar ESC
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        fecharDropdown();
    }
});

// Prevenir que cliques no dropdown fechem o menu
document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('dropdown-menu');
    const titulo = document.querySelector('.titulo-pagina');
    
    if (dropdown && titulo) {
        if (!titulo.contains(e.target) && !dropdown.contains(e.target)) {
            fecharDropdown();
        }
    }
});

// Navegação de mês
let mesAtual = new Date().getMonth();
let anoAtual = new Date().getFullYear();

function atualizarMesDisplay() {
    const meses = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    
    const mesDisplay = document.getElementById('mes-atual') || document.querySelector('.mes-atual');
    if (mesDisplay) {
        mesDisplay.textContent = `${meses[mesAtual]} ${anoAtual}`;
    }
}

function proximoMes() {
    mesAtual++;
    if (mesAtual > 11) {
        mesAtual = 0;
        anoAtual++;
    }
    atualizarMesDisplay();
    
    // Disparar evento personalizado para que outras partes da aplicação possam reagir
    window.dispatchEvent(new CustomEvent('mesAlterado', {
        detail: { mes: mesAtual, ano: anoAtual }
    }));
}

function mesAnterior() {
    mesAtual--;
    if (mesAtual < 0) {
        mesAtual = 11;
        anoAtual--;
    }
    atualizarMesDisplay();
    
    // Disparar evento personalizado
    window.dispatchEvent(new CustomEvent('mesAlterado', {
        detail: { mes: mesAtual, ano: anoAtual }
    }));
}

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Sistema de cabeçalho padronizado carregado');
    
    // Configurar navegação de mês se existir
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    
    if (prevBtn) prevBtn.addEventListener('click', mesAnterior);
    if (nextBtn) nextBtn.addEventListener('click', proximoMes);
    
    // Atualizar display do mês
    atualizarMesDisplay();
});

// Expor funções globalmente para compatibilidade
window.toggleDropdown = toggleDropdown;
window.navegarPara = navegarPara;
window.proximoMes = proximoMes;
window.mesAnterior = mesAnterior;