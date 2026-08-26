import { initializeApp } from
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import { getAuth } from
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import { getFirestore } from
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import { getStorage } from
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-storage.js";


const firebaseConfig = {

    apiKey: "AIzaSyCYnZe6pwnoNAg356WbCQELWlPqHwW2jbU",

    authDomain:
        "intelligentsurveynavigation.firebaseapp.com",

    projectId:
        "intelligentsurveynavigation",

    storageBucket:
        "intelligentsurveynavigation.firebasestorage.app",

    messagingSenderId:
        "687888922222",

    appId:
        "1:687888922222:web:7d9b07dc89f5b16c0c187f",

    measurementId:
        "G-FBTYSD4M8S"
};


// Initialize Firebase

const app =
    initializeApp(firebaseConfig);


// Firebase Authentication

const auth =
    getAuth(app);


// Firestore Database

const db =
    getFirestore(app);


// Firebase Storage

const storage =
    getStorage(app);


// Export

export {
    app,
    auth,
    db,
    storage
};