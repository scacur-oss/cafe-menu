import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    getStorage
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyBNfY2I6LHyWcCHLcvg5NvBEkOSrvfqRgM",
    authDomain: "cafe-menu-e3491.firebaseapp.com",
    projectId: "cafe-menu-e3491",
    storageBucket: "cafe-menu-e3491.appspot.com",
    messagingSenderId: "216661905972",
    appId: "1:216661905972:web:ca371393b3285a1d75f061"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);

export async function createOrder(orderData) {
    return await addDoc(collection(db, "orders"), {
        ...orderData,
        createdAt: serverTimestamp(),
        status: "Yeni Sipariş"
    });
}

export async function createRequest(requestData) {
    return await addDoc(collection(db, "requests"), {
        ...requestData,
        createdAt: serverTimestamp(),
        status: "Yeni İstek"
    });
}

export async function createProduct(productData) {
    return await addDoc(collection(db, "products"), {
        ...productData,
        createdAt: serverTimestamp(),
        active: true
    });
}