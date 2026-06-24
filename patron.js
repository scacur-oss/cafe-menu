import { db, storage } from "./firebase.js";

import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const PATRON_PASSWORD = "1234";

const loginBox = document.getElementById("loginBox");
const panel = document.getElementById("panel");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");

const totalRevenue = document.getElementById("totalRevenue");
const totalOrders = document.getElementById("totalOrders");
const totalProducts = document.getElementById("totalProducts");

const addProductBtn = document.getElementById("addProductBtn");
const productsList = document.getElementById("productsList");
const requestsList = document.getElementById("requestsList");

loginBtn.addEventListener("click", () => {
    const password = document.getElementById("patronPassword").value;

    if (password === PATRON_PASSWORD) {
        localStorage.setItem("patronLogin", "true");
        showPanel();
    } else {
        alert("Şifre yanlış");
    }
});

logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("patronLogin");
    location.reload();
});

if (localStorage.getItem("patronLogin") === "true") {
    showPanel();
}

function showPanel() {
    loginBox.classList.add("hidden");
    panel.classList.remove("hidden");
    listenProducts();
    listenOrders();
    listenRequests();
}

addProductBtn.addEventListener("click", async () => {
    const name = document.getElementById("productName").value.trim();
    const price = Number(document.getElementById("productPrice").value);
    const category = document.getElementById("productCategory").value;
    const desc = document.getElementById("productDesc").value.trim();
    const imageFile = document.getElementById("productImage").files[0];

    if (!name || !price || !category) {
        alert("Ürün adı, fiyat ve kategori zorunlu");
        return;
    }

    addProductBtn.disabled = true;
    addProductBtn.innerText = "Yükleniyor...";

    try {
        let imageUrl = "";

        if (imageFile) {
            const resizedImage = await resizeImage(imageFile, 800, 800);
            const imageRef = ref(storage, `products/${Date.now()}-${imageFile.name}`);
            await uploadBytes(imageRef, resizedImage);
            imageUrl = await getDownloadURL(imageRef);
        }

        await addDoc(collection(db, "products"), {
            name,
            price,
            category,
            desc,
            imageUrl,
            active: true,
            createdAt: serverTimestamp()
        });

        document.getElementById("productName").value = "";
        document.getElementById("productPrice").value = "";
        document.getElementById("productDesc").value = "";
        document.getElementById("productImage").value = "";

        alert("Ürün eklendi");
    } catch (error) {
        console.error(error);
        alert("Ürün eklenirken hata oluştu");
    }

    addProductBtn.disabled = false;
    addProductBtn.innerText = "Ürün Ekle";
});

function listenProducts() {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));

    onSnapshot(q, (snapshot) => {
        productsList.innerHTML = "";
        totalProducts.innerText = snapshot.size;

        snapshot.forEach((item) => {
            const product = item.data();

            productsList.innerHTML += `
        <div class="product-card">
          ${product.imageUrl ? `<img src="${product.imageUrl}">` : ""}
          <h3>${product.name}</h3>
          <p>${product.category}</p>
          <p>${product.desc || ""}</p>
          <strong>${product.price} TL</strong>
          <button class="delete-btn" onclick="deleteProduct('${item.id}')">Sil</button>
        </div>
      `;
        });
    });
}

window.deleteProduct = async function (id) {
    if (!confirm("Bu ürünü silmek istiyor musun?")) return;

    await deleteDoc(doc(db, "products", id));
};

function listenOrders() {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    onSnapshot(q, (snapshot) => {
        let todayRevenue = 0;
        let todayOrders = 0;

        const now = new Date();

        snapshot.forEach((item) => {
            const order = item.data();

            if (!order.createdAt || !order.total) return;

            const orderDate = order.createdAt.toDate();

            const sameDay =
                orderDate.getDate() === now.getDate() &&
                orderDate.getMonth() === now.getMonth() &&
                orderDate.getFullYear() === now.getFullYear();

            if (sameDay) {
                todayRevenue += Number(order.total);
                todayOrders++;
            }
        });

        totalRevenue.innerText = `${todayRevenue.toLocaleString("tr-TR")} TL`;
        totalOrders.innerText = todayOrders;
    });
}

function listenRequests() {
    const q = query(collection(db, "requests"), orderBy("createdAt", "desc"));

    onSnapshot(q, (snapshot) => {
        requestsList.innerHTML = "";

        snapshot.forEach((item) => {
            const req = item.data();

            requestsList.innerHTML += `
        <div class="request-card">
          <h3>Masa ${req.table || "-"}</h3>
          <p>${req.type || "Servis isteği"}</p>
        </div>
      `;
        });
    });
}

function resizeImage(file, maxWidth, maxHeight) {
    return new Promise((resolve) => {
        const img = new Image();
        const reader = new FileReader();

        reader.onload = (e) => {
            img.src = e.target.result;
        };

        img.onload = () => {
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height = height * (maxWidth / width);
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = width * (maxHeight / height);
                    height = maxHeight;
                }
            }

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    resolve(blob);
                },
                "image/jpeg",
                0.75
            );
        };

        reader.readAsDataURL(file);
    });
}