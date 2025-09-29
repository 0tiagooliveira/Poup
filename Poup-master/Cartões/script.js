'use strict';

// Firebase config alinhado (usa o já carregado em outras páginas)
(function init(){
  if (typeof firebase === 'undefined') return;
  if (!firebase.apps.length) {
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
})();

const auth = firebase.auth();
const db = firebase.firestore();

function getQueryParam(name){
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

function renderCartoes(cartoes){
  const lista = document.getElementById('lista-cartoes');
  const vazio = document.getElementById('estado-vazio');
  lista.innerHTML='';
  if (!cartoes.length){
    vazio.style.display='';
    lista.style.display='none';
    return;
  }
  vazio.style.display='none';
  lista.style.display='grid';

  const focusId = getQueryParam('focus');

  cartoes.forEach(c=>{
    const nome = c?.institution?.nome || c?.institution?.descricao || 'Cartão';
    const bandeira = c?.brand || {};
    const logo = bandeira.type==='image' && bandeira.icon ? `../Icon/${bandeira.icon.split('/').pop()}` : null;

  const a = document.createElement('a');
  a.href = '#';
    a.className='item-cartao';
    a.style.outline = c.id===focusId ? '2px solid var(--cor-primaria)' : 'none';

    a.innerHTML = `
      <div class="item-esq">
        <div class="item-logo">${logo?`<img src="${logo}" alt="${bandeira.name||''}">`:`<span class="material-icons-round">credit_card</span>`}</div>
        <div>
          <div class="item-nome">${bandeira.name?`${bandeira.name.toUpperCase()} `:''}${nome}</div>
          <div class="badge-status">Fatura aberta</div>
        </div>
      </div>
      <span class="material-icons-round" style="color:#98a2b3;">chevron_right</span>
    `;
    lista.appendChild(a);
  });
}

function carregar(){
  auth.onAuthStateChanged(async user=>{
    if(!user){
      window.location.href = `../index.html?returnTo=${encodeURIComponent(window.location.pathname+window.location.search)}`;
      return;
    }
  const snap = await db.collection('cartoes').where('userId','==',user.uid).get();
    const cartoes = snap.docs.map(d=>({id:d.id,...d.data()}));
    renderCartoes(cartoes);
  });
}

document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('voltar-home')?.addEventListener('click',()=>{
    window.location.href = '../Home/home.html';
  });
  carregar();
});
