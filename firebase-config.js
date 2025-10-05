// Configuração Firebase centralizada
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyC7RB9fULmkp9xeJIjc0dL58atHJ8CM-Xc",
    authDomain: "poup-beta.firebaseapp.com",
    projectId: "poup-beta",
    storageBucket: "poup-beta.appspot.com",
    messagingSenderId: "954695915981",
    appId: "1:954695915981:web:d31b216f79eac178094c84"
};

// Inicializar Firebase se ainda não foi inicializado
if (!firebase.apps.length) {
    firebase.initializeApp(FIREBASE_CONFIG);
}

// Exportar referências para uso global
window.db = firebase.firestore();
window.auth = firebase.auth();