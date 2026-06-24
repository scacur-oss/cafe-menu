import { createOrder, createRequest, db } from "./firebase.js";

import {
    doc,
    onSnapshot,
    collection,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";



const categories = [
    { id: "kahvalti", name: "Kahvaltı", icon: "fa-solid fa-egg" },
    { id: "aperatif", name: "Aperatifler", icon: "fa-solid fa-burger" },
    { id: "anayemek", name: "Ana Yemekler", icon: "fa-solid fa-utensils" },
    { id: "tatli", name: "Tatlılar", icon: "fa-solid fa-cake-candles" },
    { id: "sicak", name: "Sıcak İçecekler", icon: "fa-solid fa-mug-hot" },
    { id: "soguk", name: "Soğuk İçecekler", icon: "fa-solid fa-glass-water" },
    { id: "kahve", name: "Kahveler", icon: "fa-solid fa-coffee" },
    { id: "smoothie", name: "Smoothie", icon: "fa-solid fa-blender" },
    { id: "nargile", name: "Nargile", icon: "fa-solid fa-smoking" }
];

let products = [
    {
        id: 1,
        category: "kahvalti",
        name: "Serpme Kahvaltı",
        desc: "Peynir, zeytin, reçel, yumurta ve çay",
        price: 250,
        image: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=500"
    },
    {
        id: 2,
        category: "aperatif",
        name: "Kaşarlı Tost",
        desc: "Bol kaşarlı çıtır tost",
        price: 90,
        image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500"
    },
    {
        id: 3,
        category: "sicak",
        name: "Çay",
        desc: "Taze demlenmiş bardak çay",
        price: 25,
        image: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500"
    },
    {
        id: 4,
        category: "kahve",
        name: "Türk Kahvesi",
        desc: "Geleneksel Türk kahvesi",
        price: 70,
        image: "https://images.unsplash.com/photo-1578374173705-969cbe6f2d6b?w=500"
    },
    {
        id: 5,
        category: "soguk",
        name: "Soda",
        desc: "Soğuk maden suyu",
        price: 45,
        image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500"
    },
    {
        id: 6,
        category: "tatli",
        name: "Cheesecake",
        desc: "Frambuaz soslu cheesecake",
        price: 140,
        image: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=500"
    },
    {
        id: 7,
        category: "kahvalti",
        name: "Tabak Kahvaltı",
        desc: "Peynir, zeytin, domates, salatalık, yumurta",
        price: 160,
        image: "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=500"
    },
    {
        id: 8,
        category: "kahvalti",
        name: "Sosis Tabağı",
        desc: "Sıcak sosis, patates kızartması ve sos",
        price: 130,
        image: "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=500"
    },
    {
        id: 9,
        category: "kahvalti",
        name: "Menemen",
        desc: "Domates, biber ve yumurta ile hazırlanır",
        price: 120,
        image: "https://images.unsplash.com/photo-1604908177522-040d6d2a2f8d?w=500"
    },
    {
        id: 10,
        category: "kahvalti",
        name: "Sucuklu Yumurta",
        desc: "Tereyağında sucuklu yumurta",
        price: 145,
        image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500"
    },
    {
        id: 11,
        category: "kahvalti",
        name: "Omlet",
        desc: "Kaşarlı veya sade omlet seçeneği",
        price: 110,
        image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=500"
    },

];

let selectedCategory = "kahvalti";
let cart = [];
let quantities = {};

const masaNo = new URLSearchParams(window.location.search).get("masa") || "7";
document.getElementById("masaNo").innerText = masaNo;

function renderCategories() {
    const menu = document.getElementById("categoryMenu");
    menu.innerHTML = "";

    categories.forEach(cat => {
        const button = document.createElement("button");
        button.className = `category-btn ${cat.id === selectedCategory ? "active" : ""}`;
        button.innerHTML = `<i class="${cat.icon}"></i>${cat.name}`;

        button.onclick = () => {
            selectedCategory = cat.id;
            renderCategories();
            renderProducts();
        };

        menu.appendChild(button);
    });
}

function loadProductsFromFirebase() {
    const productsQuery = query(
        collection(db, "products"),
        orderBy("createdAt", "desc")
    );

    onSnapshot(productsQuery, (snapshot) => {
        const firebaseProducts = [];

        snapshot.forEach((docSnap) => {
            const product = docSnap.data();

            if (product.active === false) return;

            if (!product.name || !product.category || !product.price) {
                return;
            }

            firebaseProducts.push({
                id: docSnap.id,
                category: product.category.toLowerCase(),
                name: product.name,
                desc: product.desc || "",
                price: Number(product.price),
                image: product.imageUrl || product.image || ""
            });
        });

        if (firebaseProducts.length > 0) {
            products = firebaseProducts;
        }

        renderCategories();
        renderProducts();
    });
}

function renderProducts() {
    const list = document.getElementById("productList");
    list.innerHTML = "";

    const filtered = products.filter(item => item.category === selectedCategory);

    filtered.forEach(product => {

        if (!quantities[product.id]) {
            quantities[product.id] = 1;
        }

        const card = document.createElement("div");
        card.className = "product-card";

        card.innerHTML = `
            <img src="${product.image}" alt="${product.name}">

            <div class="product-info">

                <h3>${product.name}</h3>

                <p>${product.desc}</p>

                <div class="price">
                    ${product.price} TL
                </div>

                <div class="quantity">
                    <button onclick="decreaseQty('${product.id}')">-</button>

                    <span id="qty-${product.id}">
                        ${quantities[product.id]}
                    </span>

                    <button onclick="increaseQty('${product.id}')">+</button>
                </div>

                <button class="add-btn" onclick="addToCart('${product.id}')">
                    Sepete Ekle
                </button>

            </div>
        `;

        list.appendChild(card);
    });
}

function increaseQty(id) {
    quantities[id]++;
    document.getElementById(`qty-${id}`).innerText = quantities[id];
}

function decreaseQty(id) {
    if (quantities[id] > 1) {
        quantities[id]--;
        document.getElementById(`qty-${id}`).innerText = quantities[id];
    }
}

function addToCart(id) {
    const product = products.find(item => item.id === id);
    const qty = quantities[id];

    const existing = cart.find(item => item.id === id);

    if (existing) {
        existing.qty += qty;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            qty: qty
        });
    }

    quantities[id] = 1;
    renderProducts();
    updateCartCount();
}

function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.qty, 0);
    document.getElementById("cartCount").innerText = count;
}

function openCart() {
    document.getElementById("cartModal").style.display = "flex";
    renderCart();
}

function closeCart() {
    document.getElementById("cartModal").style.display = "none";
}

function renderCart() {
    const cartItems = document.getElementById("cartItems");
    const totalPrice = document.getElementById("totalPrice");

    cartItems.innerHTML = "";

    let total = 0;

    if (cart.length === 0) {
        cartItems.innerHTML = "<p>Sepetiniz boş.</p>";
    }

    cart.forEach(item => {
        total += item.price * item.qty;

        const div = document.createElement("div");
        div.className = "cart-item";

        div.innerHTML = `
      <div>
        <strong>${item.name}</strong><br>
        ${item.qty} adet x ${item.price} TL
      </div>

      <div class="cart-actions">
        <button onclick="decreaseCartItem('${item.id}')">-</button>

<span>${item.qty}</span>

<button onclick="increaseCartItem('${item.id}')">+</button>

<button class="delete-btn" onclick="removeFromCart('${item.id}')">
    <i class="fa-solid fa-trash"></i>
</button>
      </div>
    `;

        cartItems.appendChild(div);
    });

    totalPrice.innerText = `${total} TL`;
}


/*
  Telegram bildirimi için bu bölüm backend'e gönderir.
  send-order.php dosyası ayrıca hazırlanmalı.
*/

async function sendOrder() {
    if (masaNo === "-") {
        alert("Masa numarası bulunamadı.");
        return;
    }

    if (cart.length === 0) {
        alert("Sepetiniz boş.");
        return;
    }

    let total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

    try {
        const orderRef = await createOrder({
            masa: masaNo,
            total: total,
            items: [...cart]
        });

        trackOrderStatus(orderRef.id);

        alert("Siparişiniz garsona iletildi. Durumu ekrandan takip edebilirsiniz.");

        closeCart();

        cart = [];
        updateCartCount();
        renderCart();

    } catch (err) {
        console.error(err);
        alert("Sipariş gönderilemedi.");
    }
}

renderCategories();
loadProductsFromFirebase();

const slider = document.getElementById("categoryMenu");

let isDown = false;
let startX;
let scrollLeft;

slider.addEventListener("mousedown", (e) => {
    isDown = true;
    slider.classList.add("dragging");
    startX = e.pageX - slider.offsetLeft;
    scrollLeft = slider.scrollLeft;
});

slider.addEventListener("mouseleave", () => {
    isDown = false;
    slider.classList.remove("dragging");
});

slider.addEventListener("mouseup", () => {
    isDown = false;
    slider.classList.remove("dragging");
});

slider.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    e.preventDefault();

    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 1.5;
    slider.scrollLeft = scrollLeft - walk;
});

function increaseCartItem(id) {
    const item = cart.find(product => product.id === id);

    if (item) {
        item.qty++;
    }

    renderCart();
    updateCartCount();
}

function decreaseCartItem(id) {
    const item = cart.find(product => product.id === id);

    if (item) {
        item.qty--;

        if (item.qty <= 0) {
            cart = cart.filter(product => product.id !== id);
        }
    }

    renderCart();
    updateCartCount();
}

function removeFromCart(id) {
    cart = cart.filter(product => product.id !== id);

    renderCart();
    updateCartCount();
}

function clearCart() {
    if (cart.length === 0) {
        alert("Sepet zaten boş.");
        return;
    }

    const confirmClear = confirm("Sepeti tamamen boşaltmak istiyor musunuz?");

    if (confirmClear) {
        cart = [];
        renderCart();
        updateCartCount();
    }
}

window.openCart = openCart;
window.closeCart = closeCart;
window.clearCart = clearCart;
window.sendOrder = sendOrder;
window.addToCart = addToCart;
window.increaseQty = increaseQty;
window.decreaseQty = decreaseQty;
window.increaseCartItem = increaseCartItem;
window.decreaseCartItem = decreaseCartItem;
window.removeFromCart = removeFromCart;

async function sendRequest(type) {

    try {

        await createRequest({
            masa: masaNo,
            type: type
        });

        alert(type + " talebiniz garsona iletildi.");

    } catch (err) {

        console.error(err);

        alert("Talep gönderilemedi.");

    }
}

window.sendRequest = sendRequest;

function trackOrderStatus(orderId) {
    const statusBox = document.getElementById("orderStatusBox");
    const statusText = document.getElementById("orderStatusText");

    if (!statusBox || !statusText) {
        console.log("Durum kutusu HTML'de bulunamadı.");
        return;
    }

    statusBox.style.display = "block";
    statusBox.className = "order-status-box status-new";
    statusText.innerText = "🟠 Yeni Sipariş";

    const orderRef = doc(db, "orders", orderId);

    onSnapshot(orderRef, (docSnap) => {
        if (docSnap.exists()) {
            const order = docSnap.data();

            if (order.status === "Yeni Sipariş") {
                statusBox.className = "order-status-box status-new";
                statusText.innerText = "🟠 Yeni Sipariş";
            }

            if (order.status === "Hazırlanıyor") {
                statusBox.className = "order-status-box status-preparing";
                statusText.innerText = "🟡 Siparişiniz hazırlanıyor";
            }

            if (order.status === "Teslim Edildi") {
                statusBox.className = "order-status-box status-done";
                statusText.innerText = "🟢 Siparişiniz teslim edildi";
            }
        }
    });
}
