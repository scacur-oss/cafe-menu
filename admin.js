import { db, createProduct } from "./firebase.js";

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
const todayRevenueEl = document.getElementById("todayRevenue");
const totalOrdersEl = document.getElementById("totalOrders");
const activeOrdersEl = document.getElementById("activeOrders");
const completedOrdersEl = document.getElementById("completedOrders");
const requestsList = document.getElementById("requestsList");
const productName = document.getElementById("productName");
const productCategory = document.getElementById("productCategory");
const productDesc = document.getElementById("productDesc");
const productPrice = document.getElementById("productPrice");
const productImage = document.getElementById("productImage");
const addProductBtn = document.getElementById("addProductBtn");

loginBtn.addEventListener("click", () => {


    if (passwordInput.value.trim() === ADMIN_PASSWORD) {
        localStorage.setItem("adminLogin", "true");

        loginScreen.style.display = "none";
        loginScreen.remove();

    } else {
        loginError.innerText = "Şifre hatalı!";
    }
});

passwordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        loginBtn.click();
    }
});

if (localStorage.getItem("adminLogin") === "true") {
    loginScreen.style.display = "none";
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

    let todayRevenue = 0;
    let totalOrders = 0;
    let activeOrders = 0;
    let completedOrders = 0;

    const today = new Date();
    const todayDate = today.toDateString();
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
        todayRevenueEl.innerText = `0 TL`;
        totalOrdersEl.innerText = 0;
        activeOrdersEl.innerText = 0;
        completedOrdersEl.innerText = 0;
        return;
    }

    snapshot.forEach((docSnap) => {
        const order = docSnap.data();
        const orderId = docSnap.id;
        if (order.hiddenFromWaiter === true) {
            return;
        }
        totalOrders++;

        if (order.status === "Teslim Edildi") {
            completedOrders++;
        } else {
            activeOrders++;
        }

        if (order.createdAt && order.createdAt.toDate) {
            const orderDate = order.createdAt.toDate();

            if (orderDate.toDateString() === todayDate) {
                todayRevenue += Number(order.total || 0);
            }
        }

        let itemsHtml = "";

        order.items.forEach(item => {
            itemsHtml += `
        <li>
          ${item.qty} adet ${item.name}
          <span>${item.price * item.qty} TL</span>
        </li>
      `;
        });

        const card = document.createElement("div");
        card.className = "order-card";

        card.innerHTML = `
      <div class="order-top">
        <h2>Masa ${order.masa}</h2>
        <span class="status">${order.status}</span>
      </div>

      <ul class="order-items">
        ${itemsHtml}
      </ul>

      <div class="order-total">
        Toplam: ${order.total} TL
      </div>

      <div class="order-buttons">
        <button class="prepare-btn" data-id="${orderId}" data-status="Hazırlanıyor">
          Hazırlanıyor
        </button>

        <button class="done-btn" data-id="${orderId}" data-status="Teslim Edildi">
          Teslim Edildi
        </button>

        <button class="delete-order-btn" data-id="${orderId}">
          Sil
        </button>
      </div>
    `;

        ordersList.appendChild(card);
    });
    if (todayRevenueEl) todayRevenueEl.innerText = `${todayRevenue} TL`;
    if (totalOrdersEl) totalOrdersEl.innerText = totalOrders;
    if (activeOrdersEl) activeOrdersEl.innerText = activeOrders;
    if (completedOrdersEl) completedOrdersEl.innerText = completedOrders;

    document.querySelectorAll(".prepare-btn, .done-btn").forEach(button => {
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
    try {
        const orderRef = doc(db, "orders", orderId);

        await updateDoc(orderRef, {
            status: status
        });

        console.log("Sipariş durumu güncellendi:", status);
    } catch (err) {
        console.error("Durum güncelleme hatası:", err);
        alert("Durum güncellenemedi.");
    }
}

async function deleteOrder(orderId) {
    const confirmDelete = confirm("Bu siparişi garson panelinden temizlemek istiyor musunuz?");
    if (!confirmDelete) return;

    try {
        const orderRef = doc(db, "orders", orderId);

        await updateDoc(orderRef, {
            hiddenFromWaiter: true
        });

        console.log("Sipariş garson panelinden gizlendi:", orderId);
    } catch (err) {
        console.error("Sipariş gizleme hatası:", err);
        alert("Sipariş panelden temizlenemedi.");
    }
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
        <small>${request.status}</small>
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

addProductBtn.addEventListener("click", async () => {
    if (
        productName.value.trim() === "" ||
        productDesc.value.trim() === "" ||
        productPrice.value.trim() === "" ||
        productImage.value.trim() === ""
    ) {
        alert("Lütfen tüm ürün bilgilerini doldurun.");
        return;
    }

    try {
        await createProduct({
            name: productName.value.trim(),
            category: productCategory.value,
            desc: productDesc.value.trim(),
            price: Number(productPrice.value),
            image: productImage.value.trim()
        });

        alert("Ürün başarıyla eklendi.");

        productName.value = "";
        productDesc.value = "";
        productPrice.value = "";
        productImage.value = "";

    } catch (err) {
        console.error(err);
        alert("Ürün eklenirken hata oluştu.");
    }
});