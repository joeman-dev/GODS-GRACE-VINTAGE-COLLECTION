
/* =====================================================
   GOD'S GRACE VINTAGE COLLECTION
   STAGE 3 — ADVANCED SHOPPING CART
   Currency: Ghana Cedis (GH₵)
   Delivery: Fixed GH₵35
   Discount: GG10 = 10% off
===================================================== */



/* =====================================================
   1. PRODUCT DATABASE
   Supabase-connected catalogue with local fallback
===================================================== */

const fallbackProducts = [
  {
    id: 1,
    name: "GG Signature Tee — Black",
    category: "t-shirts",
    price: 180,
    image: "assets/tee-black.svg",
    tag: "BESTSELLER",
    description: "A signature everyday piece.",
    color: "Black",
    colors: ["Black"],
    sizes: ["S", "M", "L", "XL", "XXL"]
  },
  {
    id: 2,
    name: "Vintage Classic Tee — Cream",
    category: "t-shirts",
    price: 175,
    image: "assets/tee-cream.svg",
    tag: "NEW",
    description: "Clean vintage-inspired styling.",
    color: "Cream",
    colors: ["Cream"],
    sizes: ["S", "M", "L", "XL", "XXL"]
  },
  {
    id: 3,
    name: "Premium Gold Tee",
    category: "t-shirts",
    price: 195,
    image: "assets/tee-gold.svg",
    tag: "SIGNATURE",
    description: "A bold look with a golden touch.",
    color: "Gold",
    colors: ["Gold"],
    sizes: ["S", "M", "L", "XL", "XXL"]
  },
  {
    id: 4,
    name: "GG Classic Hoodie — Black",
    category: "hoodies",
    price: 320,
    image: "assets/hoodie-black.svg",
    tag: "POPULAR",
    description: "Comfort and timeless streetwear.",
    color: "Black",
    colors: ["Black"],
    sizes: ["S", "M", "L", "XL", "XXL"]
  },
  {
    id: 5,
    name: "GG Signature Cap",
    category: "accessories",
    price: 120,
    image: "assets/cap-black.svg",
    tag: "ESSENTIAL",
    description: "Complete your everyday look.",
    color: "Black",
    colors: ["Black"],
    sizes: []
  },
  {
    id: 6,
    name: "Vintage Everyday Tote",
    category: "accessories",
    price: 95,
    image: "assets/tote-cream.svg",
    tag: "NEW",
    description: "Simple, practical and stylish.",
    color: "Cream",
    colors: ["Cream"],
    sizes: []
  }
];

// The website initially uses the fallback catalogue.
let products = [...fallbackProducts];


/* =====================================================
   1A. LOAD PRODUCTS FROM SUPABASE
===================================================== */

async function loadProductsFromSupabase() {

  console.log("GG VINTAGE: Loading products from Supabase...");

  if (!window.ggSupabase) {
    console.warn("Supabase unavailable. Using local products.");
    return;
  }

  try {

    const { data, error } = await window.ggSupabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("id", { ascending: true });

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      console.warn("No active products found. Using fallback catalogue.");
      return;
    }

    const productTags = {
      1: "BESTSELLER",
      2: "NEW",
      3: "SIGNATURE",
      4: "POPULAR",
      5: "ESSENTIAL",
      6: "NEW"
    };

    products = data.map((item) => {

      const productColor = item.color || "Black";

      return {
        id: Number(item.id),
        name: item.name,
        category: item.category,
        price: Number(item.price),
        image: item.image_path,
        tag: productTags[item.id] || "GG COLLECTION",
        description: item.description || "",
        color: productColor,
        colors: [productColor],
        sizes: Array.isArray(item.sizes) ? item.sizes : [],
        stock: Number(item.stock || 0)
      };

    });

    // Restore cart against the updated database products.
    cart = loadCart();

    // Refresh the shop and shopping cart.
    renderProducts();
    renderCart();

    console.log("SUCCESS: GG Vintage products loaded from Supabase.");
    console.log("Products displayed:", products.length);

  } catch (error) {

    console.error(
      "SUPABASE PRODUCT ERROR:",
      error.message
    );

    console.warn("Continuing with local fallback products.");

  }

}


/* 2. STORE SETTINGS */

const STORE = {
  deliveryFee: 35,
  discountCode: "GG10",
  discountPercentage: 10,
  storageKey: "ggvintage-cart"
};


/* 3. DOM HELPER */

const $ = (id) => document.getElementById(id);


/* 4. WEBSITE STATE */

let activeFilter = "all";
let cart = [];
let toastTimeout;

let selectedProduct = null;
let selectedSize = "";
let selectedColor = "";
let selectedQuantity = 1;
let lastProductTrigger = null;

let appliedDiscount = false;


/* 5. CURRENCY FORMATTER */

function money(amount) {
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: 2
  })
    .format(amount)
    .replace("GHS", "GH₵");
}


/* 6. HTML ESCAPING */

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    const characters = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };

    return characters[character];
  });
}


/* 7. CART ITEM IDENTIFICATION */

function cartKey(item) {
  return `${item.id}::${item.size || ""}::${item.color || ""}`;
}


/* 8. LOAD SAVED CART */

function loadCart() {
  try {
    const savedCart = JSON.parse(
      localStorage.getItem(STORE.storageKey) || "[]"
    );

    if (!Array.isArray(savedCart)) return [];

    const combined = new Map();

    savedCart.forEach((savedItem) => {
      const product = products.find(
        (item) => item.id === Number(savedItem.id)
      );

      const quantity = Number(savedItem.qty);

      if (
        !product ||
        !Number.isSafeInteger(quantity) ||
        quantity <= 0
      ) {
        return;
      }

      let size = savedItem.size || "";

      if (product.sizes.length > 0) {
        if (!product.sizes.includes(size)) {
          size = "M";
        }
      } else {
        size = "";
      }

      let color = savedItem.color || product.color;

      if (!product.colors.includes(color)) {
        color = product.color;
      }

      const restoredItem = {
        ...product,
        size,
        color,
        qty: 0
      };

      const key = cartKey(restoredItem);
      const existing = combined.get(key);

      const oldQuantity = existing ? existing.qty : 0;

      combined.set(key, {
        ...restoredItem,
        qty: Math.min(oldQuantity + quantity, 99)
      });
    });

    return Array.from(combined.values());

  } catch (error) {
    console.warn("Could not load saved cart.", error);
    return [];
  }
}


/* 9. SAVE CART */

function saveCart() {
  try {
    localStorage.setItem(
      STORE.storageKey,
      JSON.stringify(
        cart.map((item) => ({
          id: item.id,
          qty: item.qty,
          size: item.size,
          color: item.color
        }))
      )
    );

  } catch (error) {
    showToast("Your cart could not be saved on this device.");
  }

  renderCart();
}


/* 10. CALCULATE CART TOTALS */

function calculateTotals() {
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.qty,
    0
  );

  const discount = appliedDiscount
    ? subtotal * STORE.discountPercentage / 100
    : 0;

  const delivery = cart.length > 0
    ? STORE.deliveryFee
    : 0;

  const total = Math.max(
    0,
    subtotal - discount + delivery
  );

  return {
    subtotal,
    discount,
    delivery,
    total
  };
}


/* 11. CREATE STAGE 3 CONTROLS */

function createStage3Controls() {
  const checkoutButton = $("checkoutButton");
  const checkoutSubtotal = $("checkoutSubtotal");

  if (!checkoutButton || !checkoutSubtotal) return;

  // Cart controls

  if (!$("stage3CartTools")) {
    const cartTools = document.createElement("section");

    cartTools.id = "stage3CartTools";
    cartTools.className = "stage3-cart-tools";

    cartTools.innerHTML = `
      <div class="stage3-discount">

        <h4>Have a discount code?</h4>

        <div class="stage3-discount-input">

          <input
            type="text"
            id="discountCodeInput"
            placeholder="Enter promo code"
            aria-label="Discount code"
            autocomplete="off"
          >

          <button
            type="button"
            id="applyDiscountButton"
          >
            APPLY
          </button>

        </div>

        <p id="discountMessage" aria-live="polite"></p>

      </div>

      <div class="stage3-total-breakdown">

        <div class="stage3-total-row">
          <span>Subtotal</span>
          <strong id="stage3Subtotal">GH₵0.00</strong>
        </div>

        <div class="stage3-total-row">
          <span>Discount</span>
          <strong id="stage3Discount">GH₵0.00</strong>
        </div>

        <div class="stage3-total-row">
          <span>Delivery</span>
          <strong id="stage3Delivery">GH₵0.00</strong>
        </div>

        <div class="stage3-total-row stage3-grand-total">
          <span>Total</span>
          <strong id="stage3GrandTotal">GH₵0.00</strong>
        </div>

      </div>

      <button
        type="button"
        id="clearCartButton"
        class="clear-cart-button"
      >
        CLEAR ENTIRE BAG
      </button>
    `;

    checkoutButton.parentElement.insertBefore(
      cartTools,
      checkoutButton
    );
  }

  // Checkout breakdown

  if (!$("stage3CheckoutBreakdown")) {
    const checkoutBreakdown = document.createElement("div");

    checkoutBreakdown.id = "stage3CheckoutBreakdown";
    checkoutBreakdown.className = "stage3-checkout-breakdown";

    checkoutBreakdown.innerHTML = `
      <div class="stage3-total-row">
        <span>Subtotal</span>
        <strong id="checkoutProductSubtotal">GH₵0.00</strong>
      </div>

      <div class="stage3-total-row">
        <span>Discount</span>
        <strong id="checkoutDiscount">GH₵0.00</strong>
      </div>

      <div class="stage3-total-row">
        <span>Delivery</span>
        <strong id="checkoutDelivery">GH₵0.00</strong>
      </div>

      <div class="stage3-total-row stage3-grand-total">
        <span>Order Total</span>
        <strong id="checkoutFinalTotal">GH₵0.00</strong>
      </div>
    `;

    checkoutSubtotal.parentElement.insertAdjacentElement(
      "afterend",
      checkoutBreakdown
    );
  }
}


/* 12. DISPLAY PRODUCTS */

function renderProducts() {
  const productGrid = $("productGrid");
  const searchInput = $("searchInput");

  if (!productGrid || !searchInput) return;

  const searchTerm = searchInput.value.trim().toLowerCase();

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      activeFilter === "all" ||
      product.category === activeFilter;

    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm) ||
      product.description.toLowerCase().includes(searchTerm) ||
      product.category.toLowerCase().includes(searchTerm) ||
      product.color.toLowerCase().includes(searchTerm);

    return matchesCategory && matchesSearch;
  });

  if (filteredProducts.length === 0) {
    productGrid.innerHTML = `
      <div class="empty-products">
        <h3>No products found.</h3>
        <p>Try another search or choose a different category.</p>
      </div>
    `;
    return;
  }

  productGrid.innerHTML = filteredProducts.map((product) => `
    <article class="product-card">

      <div class="product-image">

        <img
          src="${escapeHTML(product.image)}"
          alt="${escapeHTML(product.name)}"
          loading="lazy"
        >

        <span class="product-tag">
          ${escapeHTML(product.tag)}
        </span>

      </div>

      <div class="product-info">

        <p class="product-category">
          ${escapeHTML(product.category.replace("-", " "))}
        </p>

        <h3 class="product-name">
          ${escapeHTML(product.name)}
        </h3>

        <p class="product-description">
          ${escapeHTML(product.description)}
        </p>

        <div class="product-bottom">

          <span class="product-price">
            ${money(product.price)}
          </span>

          <button
            class="view-details"
            type="button"
            data-view="${product.id}"
          >
            VIEW DETAILS
          </button>

        </div>

      </div>

    </article>
  `).join("");
}


/* 13. OPEN PRODUCT DETAILS */

function openProductDetails(productId, trigger = null) {
  const product = products.find(
    (item) => item.id === Number(productId)
  );

  if (!product) return;

  selectedProduct = product;
  selectedSize = product.sizes.length > 0 ? "M" : "";
  selectedColor = product.color;
  selectedQuantity = 1;
  lastProductTrigger = trigger;

  $("detailImage").src = product.image;
  $("detailImage").alt = product.name;

  $("detailCategory").textContent =
    product.category.replace("-", " ");

  $("detailName").textContent = product.name;
  $("detailPrice").textContent = money(product.price);
  $("detailDescription").textContent = product.description;

  const sizeSection = $("sizeSection");

  if (product.sizes.length > 0) {
    sizeSection.hidden = false;

    $("sizeOptions").innerHTML = product.sizes.map((size) => `
      <button
        class="size-option ${size === selectedSize ? "selected" : ""}"
        type="button"
        data-size="${size}"
        aria-pressed="${size === selectedSize}"
      >
        ${size}
      </button>
    `).join("");

  } else {
    sizeSection.hidden = true;
    $("sizeOptions").innerHTML = "";
  }

  $("colorOptions").innerHTML = product.colors.map((color) => `
    <button
      class="color-option ${color === selectedColor ? "selected" : ""}"
      type="button"
      data-color="${escapeHTML(color)}"
      aria-pressed="${color === selectedColor}"
    >
      <span class="color-swatch"></span>
      ${escapeHTML(color)}
    </button>
  `).join("");

  const colorMap = {
    Black: "#111111",
    Cream: "#eee5d5",
    Gold: "#c6a15b"
  };

  $("colorOptions").querySelectorAll(".color-option").forEach((button) => {
    const swatch = button.querySelector(".color-swatch");

    if (swatch) {
      swatch.style.backgroundColor =
        colorMap[button.dataset.color] || "#cccccc";
    }
  });

  $("detailQuantity").value = selectedQuantity;

  $("cartDrawer").classList.remove("open");
  $("checkoutModal").classList.remove("open");

  $("productModal").classList.add("open");

  updatePanelAccessibility();

  $("closeProductModal").focus();
}


/* 14. CLOSE PRODUCT DETAILS */

function closeProductDetails() {
  $("productModal").classList.remove("open");

  updatePanelAccessibility();

  selectedProduct = null;

  if (lastProductTrigger && document.contains(lastProductTrigger)) {
    lastProductTrigger.focus();
  }

  lastProductTrigger = null;
}


/* 15. SIZE SELECTION */

$("sizeOptions").addEventListener("click", (event) => {
  const button = event.target.closest("[data-size]");

  if (!button || !selectedProduct) return;

  selectedSize = button.dataset.size;

  $("sizeOptions").querySelectorAll("[data-size]").forEach((option) => {
    const selected = option.dataset.size === selectedSize;

    option.classList.toggle("selected", selected);
    option.setAttribute("aria-pressed", String(selected));
  });
});


/* 16. COLOUR SELECTION */

$("colorOptions").addEventListener("click", (event) => {
  const button = event.target.closest("[data-color]");

  if (!button || !selectedProduct) return;

  selectedColor = button.dataset.color;

  $("colorOptions").querySelectorAll("[data-color]").forEach((option) => {
    const selected = option.dataset.color === selectedColor;

    option.classList.toggle("selected", selected);
    option.setAttribute("aria-pressed", String(selected));
  });
});


/* 17. PRODUCT QUANTITY CONTROLS */

$("detailQtyMinus").addEventListener("click", () => {
  selectedQuantity = Math.max(1, selectedQuantity - 1);

  $("detailQuantity").value = selectedQuantity;
});

$("detailQtyPlus").addEventListener("click", () => {
  selectedQuantity = Math.min(99, selectedQuantity + 1);

  $("detailQuantity").value = selectedQuantity;
});

$("detailQuantity").addEventListener("change", () => {
  const entered = Number($("detailQuantity").value);

  selectedQuantity = Number.isFinite(entered)
    ? Math.min(99, Math.max(1, Math.floor(entered)))
    : 1;

  $("detailQuantity").value = selectedQuantity;
});


/* 18. ADD SELECTED PRODUCT */

function addSelectedProductToCart() {
  if (!selectedProduct) return;

  if (
    selectedProduct.sizes.length > 0 &&
    !selectedProduct.sizes.includes(selectedSize)
  ) {
    showToast("Please select a valid size.");
    return;
  }

  if (!selectedProduct.colors.includes(selectedColor)) {
    showToast("Please select a valid colour.");
    return;
  }

  addToCart(
    selectedProduct.id,
    selectedSize,
    selectedColor,
    selectedQuantity
  );

  closeProductDetails();
}

$("detailAddToCart").addEventListener(
  "click",
  addSelectedProductToCart
);


/* 19. DISPLAY SHOPPING CART */

function renderCart() {
  const totalItems = cart.reduce(
    (sum, item) => sum + item.qty,
    0
  );

  const totals = calculateTotals();

  $("cartCount").textContent = totalItems;
  $("cartSubtotal").textContent = money(totals.total);
  $("checkoutSubtotal").textContent = money(totals.total);

  $("cartItems").innerHTML = cart.length

    ? cart.map((item) => {
        const key = encodeURIComponent(cartKey(item));

        const sizeOptions = item.sizes.length > 0
          ? item.sizes.map((size) => `
              <option
                value="${size}"
                ${size === item.size ? "selected" : ""}
              >${size}</option>
            `).join("")
          : "";

        const colorOptions = item.colors.map((color) => `
          <option
            value="${escapeHTML(color)}"
            ${color === item.color ? "selected" : ""}
          >${escapeHTML(color)}</option>
        `).join("");

        return `
          <div class="cart-item">

            <img
              class="cart-item-image"
              src="${escapeHTML(item.image)}"
              alt="${escapeHTML(item.name)}"
            >

            <div class="cart-item-details">

              <h4>${escapeHTML(item.name)}</h4>

              <p class="cart-item-price">
                ${money(item.price)}
              </p>

              <div class="cart-item-variant">

                ${
                  item.sizes.length > 0
                    ? `
                      <label>
                        Size:
                        <select
                          data-edit-size="${key}"
                          aria-label="Change size for ${escapeHTML(item.name)}"
                        >
                          ${sizeOptions}
                        </select>
                      </label>
                    `
                    : "<span>One size</span>"
                }

                <label>
                  Colour:
                  <select
                    data-edit-color="${key}"
                    aria-label="Change colour for ${escapeHTML(item.name)}"
                  >
                    ${colorOptions}
                  </select>
                </label>

              </div>

              <div class="cart-item-actions">

                <div class="cart-quantity">

                  <button
                    type="button"
                    data-qty="${key}"
                    data-change="-1"
                    aria-label="Decrease quantity"
                  >−</button>

                  <span>${item.qty}</span>

                  <button
                    type="button"
                    data-qty="${key}"
                    data-change="1"
                    aria-label="Increase quantity"
                  >+</button>

                </div>

                <button
                  class="remove-item"
                  type="button"
                  data-remove="${key}"
                >
                  REMOVE
                </button>

              </div>

            </div>

          </div>
        `;
      }).join("")

    : `
      <div class="cart-empty">
        <h3>Your bag is waiting.</h3>
        <p>Explore the collection and add your favourite pieces.</p>
      </div>
    `;

  $("checkoutButton").disabled = cart.length === 0;

  updatePriceDisplays();
}


/* 20. ADD PRODUCT TO CART */

function addToCart(productId, size = "", color = "", quantity = 1) {
  const product = products.find(
    (item) => item.id === Number(productId)
  );

  if (!product) return;

  if (product.sizes.length > 0 && !product.sizes.includes(size)) {
    showToast("Please select a valid size.");
    return;
  }

  if (product.sizes.length === 0) {
    size = "";
  }

  if (!product.colors.includes(color)) {
    color = product.color;
  }

  quantity = Math.floor(Number(quantity));

  if (!Number.isFinite(quantity) || quantity < 1) {
    quantity = 1;
  }

  quantity = Math.min(quantity, 99);

  const newItem = {
    ...product,
    size,
    color,
    qty: 0
  };

  const key = cartKey(newItem);

  const existing = cart.find(
    (item) => cartKey(item) === key
  );

  if (existing) {
    if (existing.qty + quantity > 99) {
      showToast("Maximum quantity reached.");
      return;
    }

    existing.qty += quantity;

  } else {
    cart.push({
      ...newItem,
      qty: quantity
    });
  }

  saveCart();

  showToast(`${product.name} added to your bag.`);
}


/* 21. UPDATE CART QUANTITY */

function updateQuantity(itemKey, change) {
  const item = cart.find(
    (product) => cartKey(product) === itemKey
  );

  if (!item) return;

  const newQuantity = item.qty + Number(change);

  if (newQuantity <= 0) {
    removeFromCart(itemKey);
    return;
  }

  if (newQuantity > 99) {
    showToast("Maximum quantity reached.");
    return;
  }

  item.qty = newQuantity;

  saveCart();
}


/* 22. REMOVE PRODUCT */

function removeFromCart(itemKey) {
  const item = cart.find(
    (product) => cartKey(product) === itemKey
  );

  cart = cart.filter(
    (product) => cartKey(product) !== itemKey
  );

  if (cart.length === 0) {
    appliedDiscount = false;
  }

  saveCart();

  if (item) {
    showToast(`${item.name} removed from your bag.`);
  }
}


/* 23. EDIT PRODUCT SIZE OR COLOUR */

function editCartVariant(oldKey, newSize, newColor) {
  const item = cart.find(
    (product) => cartKey(product) === oldKey
  );

  if (!item) return;

  const validSize = item.sizes.length === 0
    ? ""
    : item.sizes.includes(newSize)
      ? newSize
      : item.size;

  const validColor = item.colors.includes(newColor)
    ? newColor
    : item.color;

  const updatedItem = {
    ...item,
    size: validSize,
    color: validColor
  };

  const newKey = cartKey(updatedItem);

  if (newKey !== oldKey) {
    const duplicate = cart.find(
      (product) => cartKey(product) === newKey
    );

    if (duplicate && duplicate !== item) {
      if (duplicate.qty + item.qty > 99) {
        showToast("Maximum quantity reached for this variant.");
        renderCart();
        return;
      }

      duplicate.qty += item.qty;

      cart = cart.filter((product) => product !== item);

    } else {
      item.size = validSize;
      item.color = validColor;
    }
  }

  saveCart();

  showToast("Cart item updated.");
}


/* 24. CLEAR ENTIRE CART */

function clearCart() {
  if (cart.length === 0) {
    showToast("Your shopping bag is already empty.");
    return;
  }

  const confirmed = window.confirm(
    "Are you sure you want to remove every item from your shopping bag?"
  );

  if (!confirmed) return;

  cart = [];
  appliedDiscount = false;

  const input = $("discountCodeInput");
  const message = $("discountMessage");

  if (input) input.value = "";
  if (message) message.textContent = "";

  saveCart();

  showToast("Your shopping bag has been cleared.");
}


/* 25. APPLY DISCOUNT CODE */

function applyDiscountCode() {
  const input = $("discountCodeInput");
  const message = $("discountMessage");

  if (cart.length === 0) {
    message.textContent = "Add products before applying a discount.";
    return;
  }

  const enteredCode = input.value.trim().toUpperCase();

  if (!enteredCode) {
    message.textContent = "Please enter a discount code.";
    return;
  }

  if (enteredCode === STORE.discountCode) {
    if (appliedDiscount) {
      message.textContent = "GG10 is already applied.";
      return;
    }

    appliedDiscount = true;

    message.textContent = "GG10 applied! You saved 10%.";

    message.style.color = "green";

    renderCart();

    showToast("Your 10% discount has been applied.");

  } else {
    appliedDiscount = false;

    message.textContent = "Invalid discount code. Please try again.";

    message.style.color = "red";

    renderCart();
  }
}


/* 26. UPDATE PRICE DISPLAYS */

function updatePriceDisplays() {
  const totals = calculateTotals();

  const displayValues = {
    stage3Subtotal: totals.subtotal,
    stage3Discount: totals.discount,
    stage3Delivery: totals.delivery,
    stage3GrandTotal: totals.total,

    checkoutProductSubtotal: totals.subtotal,
    checkoutDiscount: totals.discount,
    checkoutDelivery: totals.delivery,
    checkoutFinalTotal: totals.total
  };

  Object.entries(displayValues).forEach(([id, value]) => {
    if ($(id)) {
      $(id).textContent = money(value);
    }
  });

  // The original subtotal positions now show the final payable total.

  $("cartSubtotal").textContent = money(totals.total);
  $("checkoutSubtotal").textContent = money(totals.total);

  const discountMessage = $("discountMessage");

  if (discountMessage && appliedDiscount) {
    discountMessage.textContent = "GG10 applied! You saved 10%.";
    discountMessage.style.color = "green";
  }
}


/* 27. TOAST NOTIFICATION */

function showToast(message) {
  const toast = $("toast");

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimeout);

  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}


/* 28. PANEL ACCESSIBILITY */

function updatePanelAccessibility() {
  const cartOpen = $("cartDrawer").classList.contains("open");
  const checkoutOpen = $("checkoutModal").classList.contains("open");
  const productOpen = $("productModal").classList.contains("open");

  const panels = [
    ["cartDrawer", cartOpen],
    ["checkoutModal", checkoutOpen],
    ["productModal", productOpen]
  ];

  panels.forEach(([id, isOpen]) => {
    const panel = $(id);

    panel.setAttribute("aria-hidden", String(!isOpen));
    panel.inert = !isOpen;
  });

  const anyPanelOpen =
    cartOpen || checkoutOpen || productOpen;

  document.body.classList.toggle(
    "panel-open",
    anyPanelOpen
  );

  $("overlay").classList.toggle(
    "active",
    anyPanelOpen
  );
}


/* 29. OPEN CART */

function openCart() {
  $("productModal").classList.remove("open");
  $("checkoutModal").classList.remove("open");

  $("cartDrawer").classList.add("open");

  updatePanelAccessibility();

  $("closeCart").focus();
}


/* 30. OPEN CHECKOUT */

function openCheckout() {
  if (cart.length === 0) {
    showToast("Your shopping bag is empty.");
    return;
  }

  $("productModal").classList.remove("open");
  $("cartDrawer").classList.remove("open");

  $("checkoutModal").classList.add("open");

  updatePriceDisplays();
  updatePanelAccessibility();

  $("closeCheckout").focus();
}


/* 31. CLOSE ALL PANELS */

function closePanels() {
  $("cartDrawer").classList.remove("open");
  $("checkoutModal").classList.remove("open");
  $("productModal").classList.remove("open");

  selectedProduct = null;

  updatePanelAccessibility();
}


/* 32. CATEGORY FILTERS */

$("filters").addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");

  if (!button) return;

  activeFilter = button.dataset.filter;

  document.querySelectorAll(".filter").forEach((filter) => {
    filter.classList.remove("active");
  });

  button.classList.add("active");

  renderProducts();
});


/* 33. PRODUCT SEARCH */

$("searchInput").addEventListener("input", renderProducts);


/* 34. PRODUCT DETAILS EVENTS */

$("productGrid").addEventListener("click", (event) => {
  const button = event.target.closest("[data-view]");

  if (!button) return;

  openProductDetails(button.dataset.view, button);
});


/* 35. CART EVENTS */

$("cartItems").addEventListener("click", (event) => {
  const quantityButton = event.target.closest("[data-qty]");
  const removeButton = event.target.closest("[data-remove]");

  if (quantityButton) {
    let key;

    try {
      key = decodeURIComponent(quantityButton.dataset.qty);
    } catch {
      return;
    }

    updateQuantity(
      key,
      Number(quantityButton.dataset.change)
    );

    return;
  }

  if (removeButton) {
    let key;

    try {
      key = decodeURIComponent(removeButton.dataset.remove);
    } catch {
      return;
    }

    removeFromCart(key);
  }
});


/* 36. CART VARIANT EDITING EVENTS */

$("cartItems").addEventListener("change", (event) => {
  const sizeSelect = event.target.closest("[data-edit-size]");
  const colorSelect = event.target.closest("[data-edit-color]");

  if (!sizeSelect && !colorSelect) return;

  const control = sizeSelect || colorSelect;

  let key;

  try {
    key = decodeURIComponent(
      sizeSelect
        ? sizeSelect.dataset.editSize
        : colorSelect.dataset.editColor
    );
  } catch {
    return;
  }

  const item = cart.find(
    (product) => cartKey(product) === key
  );

  if (!item) return;

  const newSize = sizeSelect
    ? sizeSelect.value
    : item.size;

  const newColor = colorSelect
    ? colorSelect.value
    : item.color;

  editCartVariant(key, newSize, newColor);
});


/* 37. DISCOUNT AND CLEAR CART EVENTS */
/* CREATE STAGE 3 CONTROLS BEFORE CONNECTING THEIR EVENTS */

createStage3Controls();
$("applyDiscountButton").addEventListener(
  "click",
  applyDiscountCode
);

$("discountCodeInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    applyDiscountCode();
  }
});

$("clearCartButton").addEventListener(
  "click",
  clearCart
);


/* 38. PRODUCT DETAILS BUTTONS */

/*$("detailAddToCart").addEventListener(
  "click",
  addSelectedProductToCart
);*/


/* 39. PANEL BUTTONS */

$("openCart").addEventListener("click", openCart);

$("closeCart").addEventListener("click", closePanels);

$("continueShopping").addEventListener("click", closePanels);

$("checkoutButton").addEventListener("click", openCheckout);

$("closeCheckout").addEventListener("click", closePanels);

$("closeProductModal").addEventListener(
  "click",
  closeProductDetails
);

$("overlay").addEventListener("click", closePanels);


/* 40. MOBILE NAVIGATION */

$("menuToggle").addEventListener("click", () => {
  const nav = $("mainNav");

  const isOpen = nav.classList.toggle("active");

  $("menuToggle").setAttribute(
    "aria-expanded",
    String(isOpen)
  );

  $("menuToggle").setAttribute(
    "aria-label",
    isOpen ? "Close navigation" : "Open navigation"
  );

  $("menuToggle").textContent = isOpen ? "×" : "☰";
});


document.querySelectorAll(".main-nav a").forEach((link) => {
  link.addEventListener("click", () => {
    $("mainNav").classList.remove("active");

    $("menuToggle").setAttribute("aria-expanded", "false");
    $("menuToggle").setAttribute("aria-label", "Open navigation");

    $("menuToggle").textContent = "☰";

    document.querySelectorAll(".main-nav a").forEach((navLink) => {
      navLink.classList.remove("active");
    });

    link.classList.add("active");
  });
});


/* 41. ESCAPE KEY */

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closePanels();

    $("mainNav").classList.remove("active");

    $("menuToggle").setAttribute("aria-expanded", "false");
    $("menuToggle").setAttribute("aria-label", "Open navigation");

    $("menuToggle").textContent = "☰";
  }
});


/* 42. DEMO CHECKOUT */


/* =====================================================
   STAGE 4 — PROFESSIONAL DEMO ORDER CONFIRMATION
===================================================== */


/* 1. CREATE ORDER CONFIRMATION WINDOW */

function showOrderConfirmation(order) {

  // Create the confirmation window if it does not exist.

  let dialog = $("orderConfirmationDialog");

  if (!dialog) {
    dialog = document.createElement("dialog");

    dialog.id = "orderConfirmationDialog";
    dialog.className = "order-confirmation-dialog";

    document.body.appendChild(dialog);

    const confirmationStyles = document.createElement("style");

    confirmationStyles.id = "orderConfirmationStyles";

    confirmationStyles.textContent = `
      .order-confirmation-dialog {
        width: min(92%, 540px);
        max-width: 540px;
        max-height: 85vh;
        overflow-y: auto;
        padding: 0;
        border: 1px solid #d6a329;
        border-radius: 12px;
        background: #fffdf7;
        color: #171511;
        box-shadow: 0 20px 60px rgba(0,0,0,.3);
      }

      .order-confirmation-dialog::backdrop {
        background: rgba(0,0,0,.75);
        backdrop-filter: blur(3px);
      }

      .confirmation-content {
        padding: 30px;
        text-align: center;
      }

      .confirmation-icon {
        width: 65px;
        height: 65px;
        display: grid;
        place-items: center;
        margin: 0 auto 18px;
        border-radius: 50%;
        background: #f5e9c8;
        color: #9b721b;
        font-size: 32px;
      }

      .confirmation-content h2 {
        margin-bottom: 10px;
        font-size: 25px;
      }

      .confirmation-reference {
        margin: 20px 0;
        padding: 15px;
        background: #f5f0e4;
        border-radius: 8px;
      }

      .confirmation-reference strong {
        display: block;
        margin-top: 6px;
        color: #9b721b;
        font-size: 20px;
        letter-spacing: 1px;
      }

      .confirmation-details {
        margin: 20px 0;
        padding: 18px;
        background: #fff;
        border: 1px solid #e8e0d0;
        border-radius: 8px;
        text-align: left;
      }

      .confirmation-details p {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        margin: 10px 0;
      }

      .confirmation-items {
        margin-top: 16px;
        padding-top: 12px;
        border-top: 1px solid #e8e0d0;
      }

      .confirmation-item {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        margin: 10px 0;
        font-size: 14px;
      }

      .confirmation-warning {
        margin: 18px 0;
        padding: 14px;
        background: #fff3d8;
        border-left: 4px solid #d6a329;
        border-radius: 5px;
        font-size: 13px;
        line-height: 1.6;
        text-align: left;
      }

      .confirmation-close {
        width: 100%;
        padding: 14px;
        border: none;
        border-radius: 6px;
        background: #171511;
        color: #fff;
        font-weight: bold;
        cursor: pointer;
      }

      .confirmation-close:hover {
        background: #9b721b;
      }

      @media (max-width: 480px) {
        .confirmation-content {
          padding: 20px;
        }
      }
    `;

    document.head.appendChild(confirmationStyles);
  }

  // Prepare the ordered products.

  const itemHTML = order.items.map((item) => `
    <div class="confirmation-item">
      <span>
        ${escapeHTML(item.name)}
        (${escapeHTML(item.size)})
        × ${item.quantity}
      </span>

      <strong>${money(item.total)}</strong>
    </div>
  `).join("");

  // Display confirmation details.

  dialog.innerHTML = `
    <div class="confirmation-content">

      <div class="confirmation-icon">✓</div>

      <h2>Thank You, ${escapeHTML(order.name)}!</h2>

      <p>Your demo order summary has been prepared.</p>

      <div class="confirmation-reference">

        <span>DEMO ORDER REFERENCE</span>

        <strong>${escapeHTML(order.orderNumber)}</strong>

      </div>

      <div class="confirmation-details">

        <p>
          <span>Customer</span>
          <strong>${escapeHTML(order.name)}</strong>
        </p>

        <p>
          <span>Payment</span>
          <strong>Cash on Delivery</strong>
        </p>

        <p>
          <span>Order Total</span>
          <strong>${money(order.total)}</strong>
        </p>

        <div class="confirmation-items">

          <strong>ORDER ITEMS</strong>

          ${itemHTML}

        </div>

      </div>

      <div class="confirmation-warning">

        <strong>Important — Demo Order</strong>

        <p>
          This is a demonstration only. Your order details
          have been generated on this device, but they have
          not been sent to GOD'S GRACE Vintage Collection.
          No actual order has been placed and no payment
          has been collected.
        </p>

      </div>

      <button
        type="button"
        class="confirmation-close"
        id="closeOrderConfirmation"
      >
        CONTINUE SHOPPING
      </button>

    </div>
  `;

  // Close confirmation window.

  $("closeOrderConfirmation").addEventListener("click", () => {
    dialog.close();
  });

  // Display the confirmation window.

  if (!dialog.open) {
    dialog.showModal();
  }

}


/* 2. DEMO CHECKOUT */

$("checkoutForm").addEventListener("submit", (event) => {

  event.preventDefault();

  if (cart.length === 0) {
    showToast("Your shopping bag is empty.");
    closePanels();
    return;
  }

  const form = event.currentTarget;

  if (!form.reportValidity()) return;

  const formData = new FormData(form);

  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const payment = String(formData.get("payment") || "");

  // Calculate the final order amount.

  const totals = calculateTotals();

  // Generate a demo reference number.

  const orderNumber =
    "GG-" + Date.now().toString().slice(-8);

  // Take a snapshot of the products before clearing the cart.

  const orderItems = cart.map((item) => ({
    name: item.name,
    size: item.size || "One size",
    color: item.color,
    price: item.price,
    quantity: item.qty,
    total: item.price * item.qty
  }));

  // Prepare order summary.

  const orderSummary = `
GOD'S GRACE (GG) VINTAGE COLLECTION
====================================

DEMO ORDER SUMMARY

Order Reference: ${orderNumber}

CUSTOMER INFORMATION
------------------------------------
Name: ${name}
Phone: ${phone}
Email: ${email || "Not provided"}
Delivery Address: ${address}

PAYMENT PREFERENCE
------------------------------------
${payment}

ORDER ITEMS
------------------------------------
${orderItems.map((item) => `
${item.name}
Size: ${item.size}
Colour: ${item.color}
Quantity: ${item.quantity}
Unit Price: ${money(item.price)}
Item Total: ${money(item.total)}
`).join("\n")}

------------------------------------
PRICE BREAKDOWN

Product Subtotal: ${money(totals.subtotal)}
Discount: -${money(totals.discount)}
Delivery Fee: ${money(totals.delivery)}

FINAL ORDER TOTAL: ${money(totals.total)}

====================================

DEMO ONLY

This document is an order summary generated
on this device. No order has been transmitted.
No payment has been collected.

GOD'S GRACE VINTAGE COLLECTION
Your Style. Your Identity. Your Statement.
  `.trim();

  // Generate the downloadable order summary.

  const blob = new Blob(
    [orderSummary],
    { type: "text/plain;charset=utf-8" }
  );

  const downloadUrl = URL.createObjectURL(blob);

  const downloadLink = document.createElement("a");

  downloadLink.href = downloadUrl;

  downloadLink.download =
    `${orderNumber}-GG-Order-Summary.txt`;

  document.body.appendChild(downloadLink);

  downloadLink.click();

  downloadLink.remove();

  // Release the temporary download URL.

  setTimeout(() => {
    URL.revokeObjectURL(downloadUrl);
  }, 1000);

  // Clear cart and discount.

  cart = [];
  appliedDiscount = false;

  saveCart();

  if ($("discountCodeInput")) {
    $("discountCodeInput").value = "";
  }

  if ($("discountMessage")) {
    $("discountMessage").textContent = "";
  }

  // Reset checkout form.

  form.reset();

  // Close checkout panels.

  closePanels();

  // Display professional order confirmation.

  showOrderConfirmation({
    orderNumber,
    name,
    phone,
    email,
    address,
    payment,
    items: orderItems,
    total: totals.total
  });

});



/* 43. AUTOMATIC COPYRIGHT YEAR */

$("year").textContent = new Date().getFullYear();



/* 44. INITIALISE WEBSITE */

cart = loadCart();

renderProducts();

renderCart();

updatePanelAccessibility();

console.log(
  "GOD'S GRACE Vintage Collection — Stage 5 loaded successfully."
);

// Retrieve the latest product catalogue.
loadProductsFromSupabase();
