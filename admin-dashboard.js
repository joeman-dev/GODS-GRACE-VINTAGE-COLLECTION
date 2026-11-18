
/* =========================================
   GOD'S GRACE VINTAGE COLLECTION
   ADMIN DASHBOARD — SUPABASE
========================================= */

var supabase = null;
let adminProducts = [];
let currentAdmin = null;

const $ = (id) => document.getElementById(id);

const productForm = $("productForm");
const productFormContainer = $("productFormContainer");
const productTableBody = $("productTableBody");
const dashboardMessage = $("dashboardMessage");

function showDashboardMessage(message, color = "#d6a329") {
    if (!dashboardMessage) return;

    dashboardMessage.textContent = message;
    dashboardMessage.style.color = color;
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[character]);
}

function formatMoney(value) {
    return new Intl.NumberFormat("en-GH", {
        style: "currency",
        currency: "GHS"
    }).format(Number(value) || 0).replace("GHS", "GH₵");
}

/* =========================================
   1. OPEN AND CLOSE PRODUCT FORM
========================================= */

function openAddProductForm() {
    if (!productForm || !productFormContainer) {
        showDashboardMessage("Product form elements are missing.", "#ff7777");
        return;
    }

    productForm.reset();

    $("productId").value = "";
    $("formTitle").textContent = "Add New Product";
    $("productActive").checked = true;

    productFormContainer.hidden = false;

    productFormContainer.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    $("productName").focus();
}

function closeProductForm() {
    if (!productForm || !productFormContainer) return;

    productForm.reset();
    productFormContainer.hidden = true;
}

/* =========================================
   2. VERIFY ADMINISTRATOR
========================================= */

async function verifyAdministrator() {
    try {
        const {
            data: { session },
            error
        } = await supabase.auth.getSession();

        if (error) throw error;

        if (!session) {
            window.location.replace("admin.html");
            return false;
        }

        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("user_id, full_name, role")
            .eq("user_id", session.user.id)
            .maybeSingle();

        if (profileError) throw profileError;

        if (!profile || profile.role !== "admin") {
            await supabase.auth.signOut();
            window.location.replace("admin.html");
            return false;
        }

        currentAdmin = profile;

        $("adminName").textContent =
            profile.full_name || "Administrator";

        return true;

    } catch (error) {
        showDashboardMessage(
            "Administrator verification failed: " + error.message,
            "#ff7777"
        );

        console.error("ADMIN VERIFICATION ERROR:", error);

        return false;
    }
}

/* =========================================
   3. LOAD PRODUCTS
========================================= */

async function loadAdminProducts() {
    showDashboardMessage("Loading products...");

    try {
        const { data, error } = await supabase
            .from("products")
            .select("*")
            .order("id", { ascending: true });

        if (error) throw error;

        adminProducts = data || [];

        renderAdminProducts();
        updateDashboardStats();

        showDashboardMessage("Products loaded successfully.");

    } catch (error) {
        showDashboardMessage(
            "Could not load products: " + error.message,
            "#ff7777"
        );

        console.error("PRODUCT LOADING ERROR:", error);
    }
}

/* =========================================
   4. DASHBOARD STATISTICS
========================================= */

function updateDashboardStats() {
    const total = adminProducts.length;

    const active = adminProducts.filter(
        product => product.is_active === true
    ).length;

    const stock = adminProducts.reduce(
        (sum, product) => sum + (Number(product.stock) || 0),
        0
    );

    $("totalProducts").textContent = total;
    $("activeProducts").textContent = active;
    $("totalStock").textContent = stock;
}

/* =========================================
   5. DISPLAY PRODUCTS
========================================= */

function renderAdminProducts() {
    if (!adminProducts.length) {
        productTableBody.innerHTML = `
            <tr>
                <td colspan="5">No products found.</td>
            </tr>
        `;
        return;
    }

    productTableBody.innerHTML = adminProducts.map(product => `
        <tr>
            <td>${escapeHTML(product.name)}</td>
            <td>${formatMoney(product.price)}</td>
            <td>${Number(product.stock) || 0}</td>
            <td>${product.is_active ? "Active" : "Inactive"}</td>
            <td>
                <button
                    type="button"
                    class="edit-product"
                    data-action="edit"
                    data-id="${Number(product.id)}">
                    Edit
                </button>

                <button
                    type="button"
                    class="delete-product"
                    data-action="delete"
                    data-id="${Number(product.id)}">
                    Delete
                </button>
            </td>
        </tr>
    `).join("");
}

/* =========================================
   6. SAVE PRODUCT
========================================= */

async function saveProduct(event) {
    event.preventDefault();

    const productId = $("productId").value;

    const price = Number($("productPrice").value);
    const stock = Number($("productStock").value);

    if (!Number.isFinite(price) || price <= 0) {
        showDashboardMessage("Enter a valid product price.", "#ff7777");
        return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
        showDashboardMessage(
            "Stock must be a whole number of zero or more.",
            "#ff7777"
        );
        return;
    }

    const product = {
        name: $("productName").value.trim(),
        category: $("productCategory").value,
        price,
        color: $("productColor").value.trim(),
        sizes: $("productSizes").value
            .split(",")
            .map(size => size.trim())
            .filter(Boolean),
        stock,
        image_path: $("productImage").value.trim(),
        description: $("productDescription").value.trim(),
        is_active: $("productActive").checked
    };

    if (!product.name || !product.color || !product.image_path) {
        showDashboardMessage(
            "Please complete all required product fields.",
            "#ff7777"
        );
        return;
    }

    const saveButton = $("saveProductButton");

    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    try {
        let result;

        if (productId) {
            result = await supabase
                .from("products")
                .update(product)
                .eq("id", Number(productId));
        } else {
            result = await supabase
                .from("products")
                .insert(product);
        }

        if (result.error) throw result.error;

        showDashboardMessage(
            productId
                ? "Product updated successfully."
                : "New product added successfully."
        );

        closeProductForm();

        await loadAdminProducts();

    } catch (error) {
        showDashboardMessage(
            "Product could not be saved: " + error.message,
            "#ff7777"
        );

        console.error("PRODUCT SAVE ERROR:", error);

    } finally {
        saveButton.disabled = false;
        saveButton.textContent = "Save Product";
    }
}

/* =========================================
   7. EDIT AND DELETE PRODUCTS
========================================= */

async function handleProductTableClick(event) {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const id = Number(button.dataset.id);

    const product = adminProducts.find(
        item => Number(item.id) === id
    );

    if (!product) return;

    if (button.dataset.action === "edit") {
        $("productId").value = product.id;
        $("productName").value = product.name;
        $("productCategory").value = product.category;
        $("productPrice").value = product.price;
        $("productColor").value = product.color || "";

        $("productSizes").value = Array.isArray(product.sizes)
            ? product.sizes.join(", ")
            : "";

        $("productStock").value = product.stock ?? 0;
        $("productImage").value = product.image_path || "";
        $("productDescription").value = product.description || "";
        $("productActive").checked = product.is_active === true;

        $("formTitle").textContent = "Edit Product";

        productFormContainer.hidden = false;

        productFormContainer.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

        $("productName").focus();
    }

    if (button.dataset.action === "delete") {
        const confirmed = confirm(
            `Are you sure you want to delete "${product.name}"?`
        );

        if (!confirmed) return;

        button.disabled = true;

        try {
            const { error } = await supabase
                .from("products")
                .delete()
                .eq("id", id);

            if (error) throw error;

            showDashboardMessage("Product deleted successfully.");

            await loadAdminProducts();

        } catch (error) {
            showDashboardMessage(
                "Could not delete product: " + error.message,
                "#ff7777"
            );

            console.error("PRODUCT DELETE ERROR:", error);

            button.disabled = false;
        }
    }
}

/* =========================================
   8. ADMIN LOGOUT
========================================= */

async function logoutAdministrator() {
    const button = $("adminLogoutButton");

    button.disabled = true;
    button.textContent = "Logging out...";

    try {
        const { error } = await supabase.auth.signOut();

        if (error) throw error;

        window.location.replace("admin.html");

    } catch (error) {
        showDashboardMessage(
            "Logout failed: " + error.message,
            "#ff7777"
        );

        button.disabled = false;
        button.textContent = "Logout";
    }
}

/* =========================================
   9. CONNECT BUTTONS
========================================= */

function connectDashboardButtons() {
    const addButton = $("addProductButton");
    const cancelButton = $("cancelProductButton");
    const logoutButton = $("adminLogoutButton");

    if (!addButton || !cancelButton || !logoutButton || !productForm) {
        console.error("GG VINTAGE: One or more dashboard elements are missing.");
        showDashboardMessage(
            "Dashboard buttons could not initialize. Check the HTML element IDs.",
            "#ff7777"
        );
        return false;
    }

    addButton.addEventListener("click", openAddProductForm);
    cancelButton.addEventListener("click", closeProductForm);
    logoutButton.addEventListener("click", logoutAdministrator);

    productForm.addEventListener("submit", saveProduct);
    productTableBody.addEventListener("click", handleProductTableClick);

    console.log("GG VINTAGE: Dashboard buttons connected successfully.");

    return true;
}

/* =========================================
   10. START DASHBOARD
========================================= */

async function startAdminDashboard() {
    console.log("GG VINTAGE: Starting administrator dashboard...");

    supabase = window.ggSupabase;

    if (!supabase) {
        showDashboardMessage(
            "Supabase is not ready. Check supabase.js and script loading order.",
            "#ff7777"
        );
        console.error("GG VINTAGE: Supabase client not found.");
        return;
    }

    if (!connectDashboardButtons()) return;

    const isAdmin = await verifyAdministrator();

    if (!isAdmin) return;

    await loadAdminProducts();

    console.log("GG VINTAGE: Administrator dashboard initialized.");
}

startAdminDashboard();
