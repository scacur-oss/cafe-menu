import { db, createProduct, storage } from "./firebase.js";

import {
    collection,
    query,
    orderBy,
    onSnapshot,
    doc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

import {
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

const PATRON_PASSWORD = "9999";

const patronLoginScreen = document.getElementById("patronLoginScreen");
const patronLoginBtn = document.getElementById("patronLoginBtn");
const patronPassword = document.getElementById("patronPassword");
const patronLoginError = document.getElementById("patronLoginError");

const todayRevenueEl = document.getElementById("todayRevenue");
const totalOrdersEl = document.getElementById("totalOrders");
const activeOrdersEl = document.getElementById("activeOrders");
const completedOrdersEl = document.getElementById("completedOrders");

const productName = document.getElementById("productName");
const productCategory = document.getElementById("productCategory");
const productDesc = document.getElementById("productDesc");
const productPrice = document.getElementById("productPrice");
const productImageFile = document.getElementById("productImageFile");
const addProductBtn = document.getElementById("addProductBtn");

/* Patron giriş */
patronLoginBtn.addEventListener("click", () => {
    if (patronPassword.value.trim() === PATRON_PASSWORD) {
        localStorage.setItem("patronLogin", "true");
        patronLoginScreen.style.display = "none";
        patronLoginScreen.remove();
    } else {
        patronLoginError.innerText = "Şifre hatalı!";
    }
});

patronPassword.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        patronLoginBtn.click();
    }
});

if (localStorage.getItem("patronLogin") === "true") {
    patronLoginScreen.style.display = "none";
}

/* Ciro ve sipariş istatistikleri */
const ordersQuery = query(
    collection(db, "orders"),
    orderBy("createdAt", "desc")
);

onSnapshot(ordersQuery, (snapshot) => {
    let todayRevenue = 0;
    let totalOrders = 0;
    let activeOrders = 0;
    let completedOrders = 0;

    const today = new Date();
    const todayDate = today.toDateString();

    snapshot.forEach((docSnap) => {
        const order = docSnap.data();

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
    });

    todayRevenueEl.innerText = `${todayRevenue} TL`;
    totalOrdersEl.innerText = totalOrders;
    activeOrdersEl.innerText = activeOrders;
    completedOrdersEl.innerText = completedOrders;
});

/* Ürün ekleme ve resim yükleme */
addProductBtn.addEventListener("click", async () => {
    if (
        productName.value.trim() === "" ||
        productDesc.value.trim() === "" ||
        productPrice.value.trim() === "" ||
        productImageFile.files.length === 0
    ) {
        alert("Lütfen tüm ürün bilgilerini ve ürün resmini seçin.");
        return;
    }

    try {
        addProductBtn.disabled = true;
        addProductBtn.innerText = "Yükleniyor...";

        const file = productImageFile.files[0];

        const imageRef = ref(
            storage,
            `product-images/${Date.now()}-${file.name}`
        );

        await uploadBytes(imageRef, file);

        const imageUrl = await getDownloadURL(imageRef);

        await createProduct({
            name: productName.value.trim(),
            category: productCategory.value,
            desc: productDesc.value.trim(),
            price: Number(productPrice.value),
            image: imageUrl
        });

        alert("Ürün ve resmi başarıyla eklendi.");

        productName.value = "";
        productDesc.value = "";
        productPrice.value = "";
        productImageFile.value = "";

    } catch (err) {
        console.error(err);
        alert("Ürün eklenirken hata oluştu.");
    } finally {
        addProductBtn.disabled = false;
        addProductBtn.innerText = "Ürün Ekle";
    }
});

const productsManageList = document.getElementById("productsManageList");

const productsQuery = collection(db, "products");

onSnapshot(productsQuery, (snapshot) => {
    productsManageList.innerHTML = "";

    if (snapshot.empty) {
        productsManageList.innerHTML = "<p>Henüz ürün yok.</p>";
        return;
    }

    snapshot.forEach((docSnap) => {
        const product = docSnap.data();
        const productId = docSnap.id;

        const card = document.createElement("div");
        card.className = "product-manage-card";

        card.innerHTML = `
            <img src="${product.image}" style="width:90px;height:90px;object-fit:cover;border-radius:10px;">

            <input type="text" class="edit-name" value="${product.name || ""}">
            <input type="text" class="edit-desc" value="${product.desc || ""}">
            <input type="number" class="edit-price" value="${product.price || 0}">

            <select class="edit-category">
                <option value="kahvalti">Kahvaltı</option>
                <option value="aperatif">Aperatifler</option>
                <option value="anayemek">Ana Yemekler</option>
                <option value="tatli">Tatlılar</option>
                <option value="sicak">Sıcak İçecekler</option>
                <option value="soguk">Soğuk İçecekler</option>
                <option value="kahve">Kahveler</option>
                <option value="smoothie">Smoothie</option>
                <option value="nargile">Nargile</option>
            </select>

            <input type="file" class="edit-image" accept="image/*">

            <button class="save-product-btn">Kaydet</button>
            <button class="toggle-product-btn">
                ${product.active === false ? "Aktif Yap" : "Pasife Al"}
            </button>
        `;

        productsManageList.appendChild(card);

        const categorySelect = card.querySelector(".edit-category");
        categorySelect.value = product.category || "kahvalti";

        card.querySelector(".save-product-btn").addEventListener("click", async () => {
            const name = card.querySelector(".edit-name").value.trim();
            const desc = card.querySelector(".edit-desc").value.trim();
            const price = Number(card.querySelector(".edit-price").value);
            const category = card.querySelector(".edit-category").value;
            const imageFile = card.querySelector(".edit-image").files[0];

            if (!name || !desc || !price || !category) {
                alert("Lütfen ürün bilgilerini boş bırakmayın.");
                return;
            }

            try {
                const productRef = doc(db, "products", productId);

                const updateData = {
                    name: name,
                    desc: desc,
                    price: price,
                    category: category
                };

                if (imageFile) {
                    const imageRef = ref(
                        storage,
                        `product-images/${Date.now()}-${imageFile.name}`
                    );

                    await uploadBytes(imageRef, imageFile);
                    const imageUrl = await getDownloadURL(imageRef);

                    updateData.image = imageUrl;
                }

                await updateDoc(productRef, updateData);

                alert("Ürün güncellendi.");
            } catch (err) {
                console.error(err);
                alert("Ürün güncellenemedi.");
            }
        });

        card.querySelector(".toggle-product-btn").addEventListener("click", async () => {
            try {
                const productRef = doc(db, "products", productId);

                await updateDoc(productRef, {
                    active: product.active === false ? true : false
                });

                alert(product.active === false ? "Ürün aktif yapıldı." : "Ürün pasife alındı.");
            } catch (err) {
                console.error(err);
                alert("Ürün durumu değiştirilemedi.");
            }
        });
    });
});

