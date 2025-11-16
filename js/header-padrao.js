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
    
    // Não criar overlay, pois temos event listeners globais que cuidam do fechamento
}

// Função para fechar dropdown
function fecharDropdown() {
    const dropdown = document.getElementById('dropdown-menu');
    const titulo = document.querySelector('.titulo-pagina');
    
    if (!dropdown) return;
    
    dropdown.style.display = 'none';
    titulo?.classList.remove('open');
    
    // Remover overlay se existir
    removerOverlayDropdown();
}

// Não usar overlay - deixar event listeners globais cuidarem do fechamento
function criarOverlayDropdown() {
    // Função mantida para compatibilidade, mas não faz nada
}

// Remover overlay se existir (para limpeza)
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

// Fechar dropdown ao clicar fora
document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('dropdown-menu');
    const titulo = document.querySelector('.titulo-pagina');
    
    if (dropdown && titulo) {
        // Debug: log do clique
        console.log('Clique detectado em:', e.target);
        
        // Se clicou em um link do dropdown, permitir navegação
        const dropdownItem = e.target.closest('.dropdown-item');
        if (dropdownItem) {
            console.log('Clique em item do dropdown:', dropdownItem);
            // Não fechar imediatamente - deixar o navegador processar o link
            setTimeout(() => fecharDropdown(), 100);
            return;
        }
        
        // Se clicou fora do título e do dropdown, fechar
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
    
    // Configurar cliques nos itens do dropdown
    setTimeout(() => {
        const dropdownItems = document.querySelectorAll('.dropdown-item');
        dropdownItems.forEach(item => {
            item.addEventListener('click', function(e) {
                console.log('Clique direto no item:', this.href);
                e.stopPropagation();
                fecharDropdown();
                if (this.href) {
                    window.location.href = this.href;
                }
            });
        });
    }, 500);
});

// Expor funções globalmente para compatibilidade
window.toggleDropdown = toggleDropdown;
window.navegarPara = navegarPara;
window.proximoMes = proximoMes;
window.mesAnterior = mesAnterior;