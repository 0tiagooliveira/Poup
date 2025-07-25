document.addEventListener('DOMContentLoaded', function() {
    // Alternar entre abas
    const tabs = document.querySelectorAll('.tab');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remover classe active de todas as abas
            tabs.forEach(t => t.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            // Adicionar classe active à aba clicada
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Alternar visibilidade da senha
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            
            // Alternar ícone
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    });

    // Verificar se é Android para esconder botão Apple
    const isAndroid = /Android/i.test(navigator.userAgent);
    if (isAndroid) {
        document.body.classList.add('android');
    }

    // Formulário de Criar Conta
    const formCriarConta = document.getElementById('form-criar-conta');
    if (formCriarConta) {
        formCriarConta.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email-criar').value;
            const senha = document.getElementById('senha-criar').value;
            
            // Aqui você pode adicionar a lógica para criar conta
            console.log('Criar conta:', email, senha);
            alert('Conta criada com sucesso!');
        });
    }

    // Formulário de Login
    const formLogin = document.getElementById('form-login');
    if (formLogin) {
        formLogin.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('email-login').value;
            const senha = document.getElementById('senha-login').value;
            
            // Aqui você pode adicionar a lógica para login
            console.log('Login:', email, senha);
            alert('Login realizado com sucesso!');
        });
    }

    // Botões de login social
    const btnGoogle = document.querySelector('.btn-social.google');
    if (btnGoogle) {
        btnGoogle.addEventListener('click', function() {
            // Lógica para login com Google
            console.log('Login com Google');
            alert('Redirecionando para login com Google');
        });
    }

    const btnApple = document.getElementById('btn-apple');
    if (btnApple) {
        btnApple.addEventListener('click', function() {
            // Lógica para login com Apple
            console.log('Login com Apple');
            alert('Redirecionando para login com Apple');
        });
    }

    const btnAppleLogin = document.getElementById('btn-apple-login');
    if (btnAppleLogin) {
        btnAppleLogin.addEventListener('click', function() {
            // Lógica para login com Apple
            console.log('Login com Apple');
            alert('Redirecionando para login com Apple');
        });
    }

    // Botão de esqueceu a senha
    const btnEsqueceuSenha = document.querySelector('.btn-link');
    if (btnEsqueceuSenha) {
        btnEsqueceuSenha.addEventListener('click', function() {
            // Lógica para recuperar senha
            console.log('Esqueceu a senha');
            alert('Redirecionando para recuperação de senha');
        });
    }
});