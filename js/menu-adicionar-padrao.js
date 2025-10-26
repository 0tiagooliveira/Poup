// JavaScript para menu adicionar padronizado
function criarMenuAdicionar() {
    return `
        <div class="menu-adicionar" id="menu-adicionar" style="display: none;">
            <div class="menu-opcao" onclick="window.location.href='../Nova-Receita/Nova-Receita.html'">
                <span class="material-icons-round" style="color: #21C25E;">trending_up</span>
                <span>Nova Receita</span>
            </div>
            <div class="menu-opcao" onclick="window.location.href='../Nova-Despesa/Nova-Despesa.html'">
                <span class="material-icons-round" style="color: #FF4444;">trending_down</span>
                <span>Nova Despesa</span>
            </div>
            <div class="menu-opcao" onclick="window.location.href='../Lista-de-cartoes/Lista-de-cartoes.html'">
                <span class="material-icons-round" style="color: #2196F3;">credit_card</span>
                <span>Cartão de Crédito</span>
            </div>
            <div class="menu-opcao" onclick="alert('Transferência em breve!')">
                <span class="material-icons-round" style="color: #FF9800;">swap_horiz</span>
                <span>Transferência</span>
            </div>
        </div>
    `;
}

// Adicionar menu automaticamente se não existir
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se já existe um menu-adicionar
    if (!document.getElementById('menu-adicionar') && !document.getElementById('menu-adicionar-home')) {
        const body = document.body;
        const menuHTML = criarMenuAdicionar();
        body.insertAdjacentHTML('beforeend', menuHTML);
    }
    
    // Configurar funcionalidade do botão adicionar
    const botaoAdicionar = document.getElementById('botao-adicionar-menu') || document.getElementById('botao-adicionar-home');
    const menuAdicionar = document.getElementById('menu-adicionar') || document.getElementById('menu-adicionar-home');
    
    if (botaoAdicionar && menuAdicionar) {
        botaoAdicionar.addEventListener('click', (e) => {
            e.stopPropagation();
            const isVisible = menuAdicionar.style.display === 'block';
            menuAdicionar.style.display = isVisible ? 'none' : 'block';
        });

        // Fechar menu ao clicar fora
        document.addEventListener('click', (e) => {
            if (!botaoAdicionar.contains(e.target) && !menuAdicionar.contains(e.target)) {
                menuAdicionar.style.display = 'none';
            }
        });
    }
});