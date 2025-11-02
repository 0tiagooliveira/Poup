// JavaScript para menu inferior padronizado
document.addEventListener('DOMContentLoaded', function() {
    // Configurar menu adicionar
    const botaoAdicionarMenu = document.getElementById('botao-adicionar-menu');
    const menuAdicionar = document.getElementById('menu-adicionar');
    
    if (botaoAdicionarMenu && menuAdicionar) {
        botaoAdicionarMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = menuAdicionar.style.display === 'block';
            menuAdicionar.style.display = isVisible ? 'none' : 'block';
        });

        // Fechar menu ao clicar fora
        document.addEventListener('click', (e) => {
            if (!botaoAdicionarMenu.contains(e.target) && !menuAdicionar.contains(e.target)) {
                menuAdicionar.style.display = 'none';
            }
        });
    }

    // Destacar item ativo baseado na URL atual
    function destacarItemAtivo() {
        const currentPath = window.location.pathname;
        const items = document.querySelectorAll('.item-navegacao');
        
        items.forEach(item => {
            item.classList.remove('ativo');
            const href = item.getAttribute('href');
            if (href && currentPath.includes(href.split('/').pop().split('.')[0])) {
                item.classList.add('ativo');
            }
        });
        
        // Destacar Home se estiver na página inicial
        if (currentPath.includes('home.html') || currentPath.includes('Home')) {
            const homeItem = document.querySelector('a[href*="home.html"]');
            if (homeItem) {
                homeItem.classList.add('ativo');
            }
        }
    }
    
    destacarItemAtivo();
});

// Função para navegar para páginas
function navegarPara(url) {
    window.location.href = url;
}