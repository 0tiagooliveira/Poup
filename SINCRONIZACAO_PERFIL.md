# 🔄 Sincronização de Perfil - Poup+

## ✅ Como funciona

A foto de perfil e o nome do usuário configurados em **Configurações** agora aparecem automaticamente na página **Home**.

---

## 📦 Dados Salvos no localStorage

### 1. **Nome e Email**
```javascript
localStorage.setItem('dadosUsuario', JSON.stringify({
    nome: 'Nome do Usuário',
    email: 'email@exemplo.com',
    avatar: '../Icon/perfil.svg'
}));
```

### 2. **Avatar (Foto de Perfil)**
```javascript
localStorage.setItem('avatarUsuario', 'data:image/jpeg;base64,...');
```

---

## 🔧 Como Funciona

### **Na Página de Configurações:**

1. **Editar Nome:**
   - Digite o nome no campo "Nome"
   - Pressione Enter ou clique fora do campo
   - ✅ Nome salvo automaticamente

2. **Alterar Foto:**
   - Clique no botão da câmera no avatar
   - Selecione uma imagem (máx 5MB)
   - ✅ Foto convertida para Base64 e salva

### **Na Página Home:**

Quando a página Home carregar:

1. ✅ Busca `dadosUsuario` no localStorage
2. ✅ Atualiza o elemento `.nome-usuario` com o nome salvo
3. ✅ Busca `avatarUsuario` no localStorage
4. ✅ Substitui o ícone padrão pela imagem salva
5. ✅ Aplica estilos para foto redonda (border-radius: 50%)

---

## 📝 Código Implementado

### **Home/script.js**

```javascript
// Função para carregar dados do perfil
function carregarDadosPerfilHome(nomeElement) {
    try {
        // Carregar nome
        const dadosUsuario = localStorage.getItem('dadosUsuario');
        if (dadosUsuario) {
            const dados = JSON.parse(dadosUsuario);
            if (nomeElement && dados.nome) {
                nomeElement.textContent = dados.nome;
            }
        }
        
        // Carregar avatar
        const avatarSalvo = localStorage.getItem('avatarUsuario');
        const avatarContainer = document.querySelector('.avatar-usuario');
        
        if (avatarContainer && avatarSalvo) {
            // Remove ícone padrão
            const iconePadrao = avatarContainer.querySelector('.material-icons-round');
            if (iconePadrao) {
                iconePadrao.remove();
            }
            
            // Adiciona imagem
            let avatarImg = avatarContainer.querySelector('img');
            if (!avatarImg) {
                avatarImg = document.createElement('img');
                avatarImg.style.width = '100%';
                avatarImg.style.height = '100%';
                avatarImg.style.objectFit = 'cover';
                avatarImg.style.borderRadius = '50%';
                avatarContainer.appendChild(avatarImg);
            }
            avatarImg.src = avatarSalvo;
        }
    } catch (error) {
        console.error('Erro ao carregar dados do perfil:', error);
    }
}
```

### **Configurações/script_novo.js**

```javascript
// Salvar nome
function salvarNome(nome) {
    if (nome && nome.trim()) {
        usuarioAtual.nome = nome.trim();
        localStorage.setItem('dadosUsuario', JSON.stringify(usuarioAtual));
        mostrarToast('Nome atualizado!', 'sucesso');
    }
}

// Salvar avatar
function uploadAvatar(event) {
    const arquivo = event.target.files[0];
    if (!arquivo) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const avatarImg = document.getElementById('avatar-usuario');
        if (avatarImg) {
            avatarImg.src = e.target.result;
            localStorage.setItem('avatarUsuario', e.target.result);
            mostrarToast('Foto atualizada!', 'sucesso');
        }
    };
    reader.readAsDataURL(arquivo);
}
```

---

## 🎯 Como Testar

1. **Abra a página de Configurações**
2. **Altere o nome** no campo "Nome"
3. **Clique no botão da câmera** e selecione uma foto
4. **Volte para a Home**
5. ✅ **O nome e a foto devem aparecer atualizados!**

---

## 🔍 Debug

Para verificar se os dados foram salvos, abra o **Console (F12)** e digite:

```javascript
// Ver dados salvos
console.log('Nome:', JSON.parse(localStorage.getItem('dadosUsuario')));
console.log('Avatar:', localStorage.getItem('avatarUsuario'));

// Limpar dados (se necessário)
localStorage.removeItem('dadosUsuario');
localStorage.removeItem('avatarUsuario');
```

---

## 🚀 Funcionalidades Implementadas

✅ Nome do usuário sincronizado entre Configurações e Home  
✅ Avatar sincronizado entre Configurações e Home  
✅ Foto salva em Base64 no localStorage  
✅ Substituição automática do ícone padrão pela foto  
✅ Estilo redondo (border-radius: 50%)  
✅ Validação de tamanho (máx 5MB)  
✅ Validação de tipo (apenas imagens)  
✅ Toast de feedback visual  
✅ Console logs para debug  

---

## ⚠️ Limitações

- **localStorage** tem limite de ~5-10MB (suficiente para fotos comprimidas)
- **Base64** aumenta o tamanho da imagem em ~33%
- **Recomendação:** Use fotos com menos de 1MB para melhor performance

---

## 📱 Compatibilidade

✅ Chrome/Edge  
✅ Firefox  
✅ Safari  
✅ Opera  
✅ Navegadores móveis  

---

## 🎨 Estrutura HTML

### **Home (home.html)**
```html
<div class="usuario-info" id="avatar-usuario-btn">
    <div class="avatar-usuario">
        <!-- Ícone padrão (será substituído pela foto) -->
        <span class="material-icons-round">account_circle</span>
    </div>
    <div class="usuario-saudacao">
        <p class="saudacao">Bem-vindo de volta,</p>
        <!-- Nome do usuário aparece aqui -->
        <p class="nome-usuario">Usuário</p>
    </div>
</div>
```

### **Configurações (Configuracoes.html)**
```html
<div class="campo-avatar">
    <img id="avatar-usuario" src="../Icon/perfil.svg" alt="Avatar">
    <button id="botao-alterar-foto">
        <span class="material-icons-round">photo_camera</span>
    </button>
</div>
<input type="file" id="input-foto" accept="image/*" hidden>

<input type="text" id="nome-usuario" placeholder="Seu nome">
```

---

## 🎉 Pronto!

Agora sua foto de perfil e nome são sincronizados automaticamente entre **Configurações** e **Home**! 🚀

---

**Desenvolvido para Poup+ 💚**
