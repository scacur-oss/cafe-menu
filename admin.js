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

const ordersList = document.getElementById("ordersList");

const ordersQuery = query(
    collection(db, "orders"),
    orderBy("createdAt", "desc")
);

onSnapshot(ordersQuery, (snapshot) => {
    ordersList.innerHTML = "";

    if (snapshot.empty) {
        ordersList.innerHTML = `<p class="empty-order">Henüz sipariş yok.</p>`;
        return;
    }

    snapshot.forEach((docSnap) => {
        const order = docSnap.data();
        const orderId = docSnap.id;

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
        <button onclick="updateOrderStatus('${orderId}', 'Hazırlanıyor')" class="prepare-btn">
          Hazırlanıyor
        </button>

        <button onclick="updateOrderStatus('${orderId}', 'Teslim Edildi')" class="done-btn">
          Teslim Edildi
        </button>

        <button onclick="deleteOrder('${orderId}')" class="delete-order-btn">
          Sil
        </button>
      </div>
    `;

        ordersList.appendChild(card);
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

window.updateOrderStatus = updateOrderStatus;
window.deleteOrder = deleteOrder;