import { db } from "./firebase.js";

import {
    collection,
    query,
    orderBy,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const ADMIN_PASSWORD = "1234";

const loginScreen = document.getElementById("loginScreen");
const loginBtn = document.getElementById("loginBtn");
const passwordInput = document.getElementById("adminPassword");
const loginError = document.getElementById("loginError");
const ordersList = document.getElementById("ordersList");
const requestsList = document.getElementById("requestsList");

if (loginBtn) {
    loginBtn.addEventListener("click", () => {
        if (passwordInput.value.trim() === ADMIN_PASSWORD) {
            localStorage.setItem("adminLogin", "true");

            if (loginScreen) {
                loginScreen.style.display = "none";
                loginScreen.remove();
            }
        } else {
            loginError.innerText = "Şifre hatalı!";
        }
    });
}

if (passwordInput) {
    passwordInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            loginBtn.click();
        }
    });
}

if (localStorage.getItem("adminLogin") === "true") {
    if (loginScreen) {
        loginScreen.style.display = "none";
        loginScreen.remove();
    }
}

let firstLoad = true;
let lastOrderCount = 0;

const notificationSound = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");

const ordersQuery = query(
    collection(db, "orders"),
    orderBy("createdAt", "desc")
);

onSnapshot(ordersQuery, (snapshot) => {
    ordersList.innerHTML = "";

    if (!firstLoad && snapshot.size > lastOrderCount) {
        notificationSound.play().catch(() => {
            console.log("Ses için ekrana bir kez dokunmak gerekebilir.");
        });

        alert("Yeni sipariş geldi!");
    }

    lastOrderCount = snapshot.size;
    firstLoad = false;

    if (snapshot.empty) {
        ordersList.innerHTML = `<p class="empty-order">Henüz sipariş yok.</p>`;
        return;
    }

    snapshot.forEach((docSnap) => {
        const order = docSnap.data();
        const orderId = docSnap.id;
        if (order.status === "Teslim Edildi") {
            return;
        }

        let itemsHtml = "";

        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                itemsHtml += `
                    <li>
                        ${item.qty} adet ${item.name}
                        <span>${item.price * item.qty} TL</span>
                    </li>
                `;
            });
        }

        const card = document.createElement("div");
        card.className = "order-card";

        card.innerHTML = `
            <div class="order-top">
                <h2>Masa ${order.masa}</h2>
                <span class="status">${order.status || "Yeni Sipariş"}</span>
            </div>

            <ul class="order-items">
                ${itemsHtml}
            </ul>

            <div class="order-total">
                Toplam: ${order.total || 0} TL
            </div>

            <div class="order-buttons">
                <button class="prepare-btn" data-id="${orderId}" data-status="Hazırlanıyor">
                    Hazırlanıyor
                </button>

                <button class="waiting-btn" data-id="${orderId}" data-status="Beklemede">
                    Beklemede
                </button>

                <button class="done-btn" data-id="${orderId}" data-status="Teslim Edildi">
                    Teslim Edildi
                </button>

                
            </div>
        `;

        ordersList.appendChild(card);
    });

    document.querySelectorAll(".prepare-btn, .waiting-btn, .done-btn").forEach(button => {
        button.addEventListener("click", async () => {
            await updateOrderStatus(button.dataset.id, button.dataset.status);
        });
    });

    document.querySelectorAll(".delete-order-btn").forEach(button => {
        button.addEventListener("click", async () => {
            await deleteOrder(button.dataset.id);
        });
    });
});

async function updateOrderStatus(orderId, status) {
    const orderRef = doc(db, "orders", orderId);

    await updateDoc(orderRef, {
        status: status
    });
}

async function deleteOrder(orderId) {
    const confirmDelete = confirm("Bu siparişi silmek istiyor musunuz?");
    if (!confirmDelete) return;

    const orderRef = doc(db, "orders", orderId);
    await deleteDoc(orderRef);
}

const requestsQuery = query(
    collection(db, "requests"),
    orderBy("createdAt", "desc")
);

onSnapshot(requestsQuery, (snapshot) => {
    requestsList.innerHTML = "";

    if (snapshot.empty) {
        requestsList.innerHTML = `<p class="empty-order">Henüz istek yok.</p>`;
        return;
    }

    snapshot.forEach((docSnap) => {
        const request = docSnap.data();
        const requestId = docSnap.id;

        const card = document.createElement("div");
        card.className = "request-card";

        card.innerHTML = `
            <div>
                <h3>Masa ${request.masa}</h3>
                <p>${request.type}</p>
                <small>${request.status || "Yeni İstek"}</small>
            </div>

            <button class="delete-request-btn" data-id="${requestId}">
                Tamamlandı
            </button>
        `;

        requestsList.appendChild(card);
    });

    document.querySelectorAll(".delete-request-btn").forEach(button => {
        button.addEventListener("click", async () => {
            await deleteRequest(button.dataset.id);
        });
    });
});

async function deleteRequest(requestId) {
    const confirmDelete = confirm("Bu isteği tamamlandı olarak silmek istiyor musunuz?");
    if (!confirmDelete) return;

    const requestRef = doc(db, "requests", requestId);
    await deleteDoc(requestRef);
}