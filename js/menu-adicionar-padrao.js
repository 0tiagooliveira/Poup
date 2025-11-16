// JavaScript para menu adicionar padronizado
function criarMenuAdicionar() {
    const currentPath = window.location.pathname.toLowerCase();
    const currentHref = window.location.href.toLowerCase();
    
    // Menu específico para página de despesas de cartão
    if (currentPath.includes('lista-de-despesas-cartao') || currentPath.includes('despesas-cartao') || currentHref.includes('despesas-cartao')) {
        return `
            <div class="menu-adicionar" id="menu-adicionar" style="display: none;">
                <div class="menu-opcao" onclick="window.location.href='../Nova-Despesa-Cartão/Nova-Despesa-Cartão.html'">
                    <div class="opcao-icone" style="background: #FF4444;">
                        <span class="material-icons-round">shopping_cart</span>
                    </div>
                    <span>Nova Compra</span>
                </div>
                <div class="menu-opcao" onclick="window.location.href='../Nova-Receita/Nova-Receita.html'">
                    <div class="opcao-icone" style="background: #21C25E;">
                        <span class="material-icons-round">trending_up</span>
                    </div>
                    <span>Nova Receita</span>
                </div>
                <div class="menu-opcao" onclick="window.location.href='../Nova-Despesa/Nova-Despesa.html'">
                    <div class="opcao-icone" style="background: #FF4444;">
                        <span class="material-icons-round">trending_down</span>
                    </div>
                    <span>Nova Despesa</span>
                </div>
                <div class="menu-opcao" onclick="alert('Transferência em breve!')">
                    <div class="opcao-icone" style="background: #FF9800;">
                        <span class="material-icons-round">swap_horiz</span>
                    </div>
                    <span>Transferência</span>
                </div>
            </div>
        `;
    }
    
    // Menu específico para página de cartões
    else if (currentPath.includes('lista-de-cartoes') || currentPath.includes('cartoes') || currentHref.includes('cartoes')) {
        return `
            <div class="menu-adicionar" id="menu-adicionar" style="display: none;">
                <div class="menu-opcao" onclick="window.location.href='../Novo Cartão/Novo Cartão.html'">
                    <div class="opcao-icone" style="background: #2196F3;">
                        <span class="material-icons-round">add_card</span>
                    </div>
                    <span>Novo Cartão</span>
                </div>
                <div class="menu-opcao" onclick="window.location.href='../Nova-Despesa-Cartão/Nova-Despesa-Cartão.html'">
                    <div class="opcao-icone" style="background: #FF4444;">
                        <span class="material-icons-round">shopping_cart</span>
                    </div>
                    <span>Compra no Cartão</span>
                </div>
                <div class="menu-opcao" onclick="alert('Pagamento de fatura em breve!')">
                    <div class="opcao-icone" style="background: #21C25E;">
                        <span class="material-icons-round">payment</span>
                    </div>
                    <span>Pagar Fatura</span>
                </div>
                <div class="menu-opcao" onclick="alert('Consulta de limite em breve!')">
                    <div class="opcao-icone" style="background: #FF9800;">
                        <span class="material-icons-round">account_balance_wallet</span>
                    </div>
                    <span>Consultar Limite</span>
                </div>
            </div>
        `;
    }
    
    // Menu específico para página de gráficos
    else if (currentPath.includes('gráficos') || currentPath.includes('graficos') || currentHref.includes('gráficos')) {
        return `
            <div class="menu-adicionar" id="menu-adicionar" style="display: none;">
                <div class="menu-opcao" onclick="window.location.href='../Nova-Receita/Nova-Receita.html'">
                    <div class="opcao-icone" style="background: #21C25E;">
                        <span class="material-icons-round">trending_up</span>
                    </div>
                    <span>Nova Receita</span>
                </div>
                <div class="menu-opcao" onclick="window.location.href='../Nova-Despesa/Nova-Despesa.html'">
                    <div class="opcao-icone" style="background: #FF4444;">
                        <span class="material-icons-round">trending_down</span>
                    </div>
                    <span>Nova Despesa</span>
                </div>
                <div class="menu-opcao" onclick="window.location.href='../Nova-Despesa-Cartão/Nova-Despesa-Cartão.html'">
                    <div class="opcao-icone" style="background: #2196F3;">
                        <span class="material-icons-round">credit_card</span>
                    </div>
                    <span>Cartão de Crédito</span>
                </div>
                <div class="menu-opcao" onclick="alert('Transferência em breve!')">
                    <div class="opcao-icone" style="background: #FF9800;">
                        <span class="material-icons-round">swap_horiz</span>
                    </div>
                    <span>Transferência</span>
                </div>
            </div>
        `;
    }
    
    // Menu padrão para outras páginas (Home, Transações, etc.)
    else {
        return `
            <div class="menu-adicionar" id="menu-adicionar" style="display: none;">
                <div class="menu-opcao" onclick="window.location.href='../Nova-Receita/Nova-Receita.html'">
                    <div class="opcao-icone" style="background: #21C25E;">
                        <span class="material-icons-round">trending_up</span>
                    </div>
                    <span>Nova Receita</span>
                </div>
                <div class="menu-opcao" onclick="window.location.href='../Nova-Despesa/Nova-Despesa.html'">
                    <div class="opcao-icone" style="background: #FF4444;">
                        <span class="material-icons-round">trending_down</span>
                    </div>
                    <span>Nova Despesa</span>
                </div>
                <div class="menu-opcao" onclick="window.location.href='../Nova-Despesa-Cartão/Nova-Despesa-Cartão.html'">
                    <div class="opcao-icone" style="background: #2196F3;">
                        <span class="material-icons-round">credit_card</span>
                    </div>
                    <span>Cartão de Crédito</span>
                </div>
                <div class="menu-opcao" onclick="alert('Transferência em breve!')">
                    <div class="opcao-icone" style="background: #FF9800;">
                        <span class="material-icons-round">swap_horiz</span>
                    </div>
                    <span>Transferência</span>
                </div>
            </div>
        `;
    }
}

// Adicionar menu automaticamente se não existir
document.addEventListener('DOMContentLoaded', function() {
    // Aguardar um pouco para garantir que outros scripts carregaram
    setTimeout(() => {
        initializeMenuAdicionar();
    }, 500);
});

function initializeMenuAdicionar() {
    console.log('🔧 [Menu Adicionar] Inicializando...', {
        path: window.location.pathname,
        href: window.location.href
    });
    
    // Verificar se já existe um menu-adicionar
    if (!document.getElementById('menu-adicionar') && !document.getElementById('menu-adicionar-home')) {
        const body = document.body;
        const menuHTML = criarMenuAdicionar();
        body.insertAdjacentHTML('beforeend', menuHTML);
        console.log('✅ [Menu Adicionar] Menu HTML criado');
    }
    
    // Aguardar um momento para garantir que o DOM foi atualizado
    setTimeout(() => {
        // Configurar funcionalidade do botão adicionar
        const botaoAdicionar = document.getElementById('botao-adicionar-menu') || 
                              document.getElementById('botao-adicionar-home') ||
                              document.querySelector('.botao-adicionar-menu');
        const menuAdicionar = document.getElementById('menu-adicionar') || 
                             document.getElementById('menu-adicionar-home');
        
        console.log('🔍 [Menu Adicionar] Elementos encontrados:', {
            botao: !!botaoAdicionar,
            menu: !!menuAdicionar,
            botaoId: botaoAdicionar?.id,
            menuId: menuAdicionar?.id
        });
        
        if (botaoAdicionar && menuAdicionar) {
            // Remover listeners existentes clonando o elemento
            const novoBotao = botaoAdicionar.cloneNode(true);
            botaoAdicionar.parentNode.replaceChild(novoBotao, botaoAdicionar);
            
            // Adicionar novo listener
            novoBotao.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('🔘 [Menu Adicionar] Botão clicado');
                const isVisible = menuAdicionar.style.display === 'block';
                menuAdicionar.style.display = isVisible ? 'none' : 'block';
                console.log('📋 [Menu Adicionar] Menu visibility:', menuAdicionar.style.display);
            });

            // Fechar menu ao clicar fora
            document.addEventListener('click', (e) => {
                if (!novoBotao.contains(e.target) && !menuAdicionar.contains(e.target)) {
                    menuAdicionar.style.display = 'none';
                }
            });
            
            console.log('✅ [Menu Adicionar] Event listeners adicionados');
        } else {
            console.error('❌ [Menu Adicionar] Elementos não encontrados');
        }
    }, 100);
}