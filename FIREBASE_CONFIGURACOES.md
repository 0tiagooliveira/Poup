# 🔥 Integração Firebase - Configurações do Usuário

## ✅ Implementação Completa

### 🎯 O que foi feito:

A página de Configurações agora está **totalmente integrada com Firebase**:
- ☁️ Firebase Firestore (banco de dados)
- 🔐 Firebase Auth (autenticação)
- 📦 Firebase Storage (armazenamento de imagens)

---

## 📊 Estrutura de Dados

### **Firebase Firestore**

#### Coleção: `usuarios`
```javascript
usuarios/
  └─ {uid}/                    // ID único do usuário
      ├─ nome: "João Silva"
      ├─ email: "joao@poup.com"
      ├─ avatar: "https://firebasestorage.googleapis.com/..."
      ├─ dataCriacao: Timestamp
      └─ dataAtualizacao: Timestamp
```

### **Firebase Storage**

#### Estrutura de Arquivos:
```
avatars/
  └─ {uid}/
      └─ avatar.jpg          // Foto de perfil do usuário
```

### **Firebase Auth**

#### Perfil do Usuário:
```javascript
{
  uid: "abc123...",
  email: "joao@poup.com",
  displayName: "João Silva",
  photoURL: "https://firebasestorage.googleapis.com/..."
}
```

---

## 🔄 Fluxo de Dados

### **1. Carregar Dados (Ao abrir Configurações)**

```
1. Usuário abre Configurações
        ↓
2. Firebase Auth verifica autenticação
        ↓
3. Busca documento em Firestore: usuarios/{uid}
        ↓
4. Se existe → Carrega dados
   Se não existe → Cria documento novo
        ↓
5. Salva cache no localStorage
        ↓
6. Preenche campos na interface
```

**Código:**
```javascript
async function carregarDadosDoFirebase(uid) {
    const doc = await db.collection('usuarios').doc(uid).get();
    
    if (doc.exists) {
        const dados = doc.data();
        usuarioAtual = {
            uid: uid,
            nome: dados.nome,
            email: dados.email,
            avatar: dados.avatar
        };
    } else {
        // Criar documento novo
        await db.collection('usuarios').doc(uid).set({
            nome: 'Usuário Poup+',
            email: auth.currentUser.email,
            avatar: '../Icon/perfil.svg',
            dataCriacao: firebase.firestore.FieldValue.serverTimestamp()
        });
    }
}
```

---

### **2. Salvar Nome ou Email**

```
1. Usuário edita campo
        ↓
2. Clica em salvar (✓)
        ↓
3. Validação (não vazio, email com @)
        ↓
4. Salva no localStorage (cache)
        ↓
5. Salva no Firestore (nuvem)
        ↓
6. Atualiza displayName no Firebase Auth
        ↓
7. Toast de confirmação
```

**Código:**
```javascript
async function salvarDadosUsuario() {
    // Cache local
    localStorage.setItem('dadosUsuario', JSON.stringify(usuarioAtual));
    
    // Firebase Firestore
    await db.collection('usuarios').doc(usuarioAtual.uid).set({
        nome: usuarioAtual.nome,
        email: usuarioAtual.email,
        avatar: usuarioAtual.avatar,
        dataAtualizacao: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    // Firebase Auth
    await auth.currentUser.updateProfile({
        displayName: usuarioAtual.nome
    });
}
```

---

### **3. Upload de Avatar**

```
1. Usuário seleciona foto
        ↓
2. Validação (tipo, tamanho)
        ↓
3. Converte para Base64
        ↓
4. Salva no localStorage (cache)
        ↓
5. Envia para Firebase Storage
        ↓
6. Obtém URL pública
        ↓
7. Salva URL no Firestore
        ↓
8. Atualiza photoURL no Firebase Auth
        ↓
9. Toast de confirmação
```

**Código:**
```javascript
async function uploadAvatar(event) {
    const arquivo = event.target.files[0];
    
    // Converter para base64
    const reader = new FileReader();
    reader.onload = async (e) => {
        const base64Image = e.target.result;
        
        // Cache local
        localStorage.setItem('avatarUsuario', base64Image);
        
        // Firebase Storage
        const storage = firebase.storage();
        const avatarRef = storage.ref(`avatars/${usuarioAtual.uid}/avatar.jpg`);
        
        const response = await fetch(base64Image);
        const blob = await response.blob();
        await avatarRef.put(blob);
        
        // URL pública
        const downloadURL = await avatarRef.getDownloadURL();
        
        // Firestore
        await db.collection('usuarios').doc(usuarioAtual.uid).update({
            avatar: downloadURL
        });
        
        // Firebase Auth
        await auth.currentUser.updateProfile({
            photoURL: downloadURL
        });
    };
    reader.readAsDataURL(arquivo);
}
```

---

## 🔒 Regras de Segurança do Firestore

Adicione estas regras no Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Coleção de usuários
    match /usuarios/{userId} {
      // Permitir leitura e escrita apenas para o próprio usuário
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 🔒 Regras de Segurança do Storage

Adicione estas regras no Firebase Console:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Avatares dos usuários
    match /avatars/{userId}/{fileName} {
      // Permitir leitura pública (para mostrar avatar)
      allow read: if true;
      
      // Permitir escrita apenas para o próprio usuário
      allow write: if request.auth != null && request.auth.uid == userId
        && request.resource.size < 5 * 1024 * 1024  // Máx 5MB
        && request.resource.contentType.matches('image/.*');  // Apenas imagens
    }
  }
}
```

---

## 🔄 Sincronização

### **Como funciona:**

1. **Dados sempre atualizados:**
   - ✅ Carrega do Firebase ao abrir
   - ✅ Salva no Firebase ao editar
   - ✅ Cache local (localStorage) para offline

2. **Fallback offline:**
   - ✅ Se Firebase estiver indisponível
   - ✅ Usa dados do localStorage
   - ✅ Sincroniza quando voltar online

3. **Sincronização automática:**
   - ✅ Firestore (banco de dados)
   - ✅ Auth (perfil de autenticação)
   - ✅ Storage (imagem de avatar)

---

## 📱 Fluxo Completo

```
┌─────────────────────────────────────┐
│     CONFIGURAÇÕES (Frontend)        │
│                                     │
│  1. Usuário edita nome/email/foto   │
│  2. Clica em salvar                 │
│  3. Validação local                 │
└─────────────┬───────────────────────┘
              │
              ↓
┌─────────────────────────────────────┐
│     localStorage (Cache Local)      │
│                                     │
│  • dadosUsuario                     │
│  • avatarUsuario                    │
└─────────────┬───────────────────────┘
              │
              ↓
┌─────────────────────────────────────┐
│     Firebase Firestore (Nuvem)      │
│                                     │
│  usuarios/{uid}                     │
│    ├─ nome                          │
│    ├─ email                         │
│    └─ avatar (URL)                  │
└─────────────┬───────────────────────┘
              │
              ↓
┌─────────────────────────────────────┐
│     Firebase Storage (Nuvem)        │
│                                     │
│  avatars/{uid}/avatar.jpg           │
└─────────────┬───────────────────────┘
              │
              ↓
┌─────────────────────────────────────┐
│     Firebase Auth (Autenticação)    │
│                                     │
│  • displayName = nome               │
│  • photoURL = avatar URL            │
└─────────────────────────────────────┘
```

---

## 🎯 Benefícios

✅ **Sincronização em tempo real** - Dados sempre atualizados  
✅ **Multi-dispositivo** - Acesse de qualquer lugar  
✅ **Backup automático** - Dados na nuvem  
✅ **Offline-first** - Funciona sem internet (usa cache)  
✅ **Segurança** - Regras do Firebase protegem os dados  
✅ **Performance** - Cache local para carregamento rápido  
✅ **Escalabilidade** - Firebase suporta milhões de usuários  

---

## 🔍 Debug

### **Console do navegador (F12):**

```javascript
// Ver dados locais
console.log('localStorage:', localStorage.getItem('dadosUsuario'));

// Ver usuário autenticado
console.log('Firebase Auth:', firebase.auth().currentUser);

// Ver documento no Firestore
firebase.firestore()
  .collection('usuarios')
  .doc(firebase.auth().currentUser.uid)
  .get()
  .then(doc => console.log('Firestore:', doc.data()));

// Ver avatar no Storage
firebase.storage()
  .ref(`avatars/${firebase.auth().currentUser.uid}/avatar.jpg`)
  .getDownloadURL()
  .then(url => console.log('Avatar URL:', url));
```

---

## 🚀 Como Testar

1. **Abra Configurações:**
   ```
   http://127.0.0.1:5500/Configurações/Configuracoes.html
   ```

2. **Verifique o console (F12):**
   ```
   ✅ Firebase inicializado
   ✅ Usuário autenticado: abc123...
   🔍 Carregando dados do Firebase para UID: abc123...
   ✅ Dados do Firebase carregados
   💾 Dados salvos no localStorage
   ```

3. **Edite o nome:**
   - Clique no ✏️
   - Digite novo nome
   - Clique no ✓
   - Veja no console:
     ```
     💾 Dados salvos no localStorage
     ☁️ Salvando dados no Firebase...
     ✅ Dados salvos no Firebase
     ✅ DisplayName atualizado no Firebase Auth
     ```

4. **Verifique no Firebase Console:**
   - Firestore → usuarios → {seu_uid}
   - Veja os dados atualizados!

---

## 🎉 Pronto!

Agora suas Configurações estão **100% integradas com Firebase**! 

**Funcionalidades:**
- ☁️ Dados salvos na nuvem
- 🔄 Sincronização automática
- 💾 Cache local para performance
- 🔐 Segurança com regras do Firebase
- 📱 Funciona em qualquer dispositivo

**Teste agora e veja a mágica acontecer!** 🚀💚
