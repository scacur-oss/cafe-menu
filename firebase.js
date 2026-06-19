import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp
}
    from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBNfY2I6LHyWcCHLcvg5NvBEkOSrvfqRgM",
    authDomain: "cafe-menu-e3491.firebaseapp.com",
    projectId: "cafe-menu-e3491",
    storageBucket: "cafe-menu-e3491.firebasestorage.app",
    messagingSenderId: "216661905972",
    appId: "1:216661905972:web:ca371393b3285a1d75f061"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export async function createOrder(orderData) {
    return await addDoc(
        collection(db, "orders"),
        {
            ...orderData,
            createdAt: serverTimestamp(),
            status: "Yeni Sipariş"
        }
    );
}