// 1. Select DOM elements
const dessertsGrid = document.querySelector(".desserts__grid");
const cartTitle = document.querySelector(".cart__title");
const cartEmpty = document.querySelector(".cart__empty");
const cartContent = document.querySelector(".cart__content");
const cartList = document.querySelector(".cart__list");
const cartTotalPrice = document.querySelector(".cart__total-price");
const checkoutBtn = document.querySelector(".cart__checkout-btn");

// Modal DOM elements
const modal = document.querySelector(".modal");
const modalList = document.querySelector(".modal__list");
const modalTotalPrice = document.querySelector(".modal__total-price");
const startNewOrderBtn = document.querySelector(".modal__start-btn");

// Track added items in an array and store fetched data globally
let cart = [];
let currentDessertsData = [];

// 2. Fetch the dessert data
async function getDesserts() {
  try {
    const response = await fetch("data.json");

    if (!response.ok) {
      throw new Error("Could not fetch data.json");
    }

    currentDessertsData = await response.json();
    displayDesserts(currentDessertsData);
  } catch (error) {
    console.error("Error loading desserts:", error);
  }
}

// 3. Render dessert cards to the grid
function displayDesserts(desserts) {
  dessertsGrid.innerHTML = "";

  desserts.forEach((dessert) => {
    const card = document.createElement("li");
    card.classList.add("dessert-card");
    card.dataset.name = dessert.name;

    // Check if item already exists in the cart to determine button state
    const cartItem = cart.find(item => item.name === dessert.name);
    const quantity = cartItem ? cartItem.quantity : 0;
    const isSelected = quantity > 0;

    card.innerHTML = `
        <div class="dessert-card__image-container">
            <picture class="dessert-card__picture ${isSelected ? 'selected' : ''}">
                <source media="(min-width: 90.25rem)" srcset="${dessert.image.desktop}">
                <source media="(min-width: 48rem)" srcset="${dessert.image.tablet}">
                <img class="dessert-card__img" src="${dessert.image.mobile}" alt="${dessert.name}">
            </picture>
            
            ${isSelected ? `
                <div class="dessert-card__quantity-control">
                    <button class="dessert-card__qty-btn decrement" aria-label="Decrease quantity">
                        <svg class="dessert-card__qty-icon" xmlns="http://www.w3.org/2000/svg" width="10" height="2" fill="none" viewBox="0 0 10 2">
                            <path fill="currentColor" d="M0 .375h10v1.25H0V.375Z"/>
                        </svg>
                    </button>
                    <span class="dessert-card__qty-value">${quantity}</span>
                    <button class="dessert-card__qty-btn increment" aria-label="Increase quantity">
                        <svg class="dessert-card__qty-icon" xmlns="http://www.w3.org/2000/svg" width="10" height="10" fill="none" viewBox="0 0 10 10">
                            <path fill="currentColor" d="M10 4.375H5.625V0h-1.25v4.375H0v1.25h4.375V10h1.25V5.625H10v-1.25Z"/>
                        </svg>
                    </button>
                </div>
            ` : `
                <button class="dessert-card__action-btn">
                    <img src="assets/images/icon-add-to-cart.svg" alt=""> Add to Cart
                </button>
            `}
        </div>
        <div class="dessert-card__content">
            <span class="dessert-card__category">${dessert.category}</span>
            <h2 class="dessert-card__name">${dessert.name}</h2>
            <p class="dessert-card__price">$${dessert.price.toFixed(2)}</p>
        </div>
    `;

    // Event listeners based on selection state
    if (isSelected) {
      card.querySelector(".decrement").addEventListener("click", () => {
        updateQuantity(dessert, -1);
      });
      card.querySelector(".increment").addEventListener("click", () => {
        updateQuantity(dessert, 1);
      });
    } else {
      card.querySelector(".dessert-card__action-btn").addEventListener("click", () => {
        addToCart(dessert);
      });
    }

    dessertsGrid.appendChild(card);
  });
}

// 4. Cart Management & Quantity Functions
function addToCart(dessert) {
  // Save current focus info before re-rendering
  const activeEl = document.activeElement;
  const cardName = activeEl?.closest('.dessert-card')?.dataset.name;

  const existingItem = cart.find(item => item.name === dessert.name);

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      name: dessert.name,
      price: dessert.price,
      quantity: 1
    });
  }

  updateCartUI();
  displayDesserts(currentDessertsData);

  // Restore focus to the increment button that replaced the Add to Cart button
  if (cardName) {
    const targetCard = Array.from(dessertsGrid.children).find(c => c.dataset.name === cardName);
    const targetBtn = targetCard?.querySelector('.increment');
    targetBtn?.focus();
  }
}

function updateQuantity(dessert, change) {
  // Save current focus info (increment or decrement button)
  const activeEl = document.activeElement;
  const cardName = activeEl?.closest('.dessert-card')?.dataset.name;
  const isIncrement = activeEl?.classList.contains('increment');
  const isDecrement = activeEl?.classList.contains('decrement');

  const existingItem = cart.find(item => item.name === dessert.name);

  if (existingItem) {
    existingItem.quantity += change;

    // If quantity drops to 0 or below, remove item from cart entirely
    if (existingItem.quantity <= 0) {
      cart = cart.filter(item => item.name !== dessert.name);
    }
  }

  updateCartUI();
  displayDesserts(currentDessertsData);

  // Restore focus to the exact same button (or fallback to Add to Cart if item was removed)
  if (cardName) {
    const targetCard = Array.from(dessertsGrid.children).find(c => c.dataset.name === cardName);
    if (targetCard) {
      let targetBtn = null;
      if (isIncrement) targetBtn = targetCard.querySelector('.increment');
      else if (isDecrement) targetBtn = targetCard.querySelector('.decrement');
      else targetBtn = targetCard.querySelector('.dessert-card__action-btn');
      
      targetBtn?.focus();
    }
  }
}

function removeFromCart(dessertName) {
  cart = cart.filter(item => item.name !== dessertName);
  updateCartUI();
  displayDesserts(currentDessertsData);
}

function updateCartUI() {
  // Calculate total item count for the title badge
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartTitle.textContent = `Your Cart (${totalItems})`;

  // Toggle between empty and filled cart states
  if (cart.length === 0) {
    cartEmpty.hidden = false;
    cartContent.hidden = true;
    return;
  }

  cartEmpty.hidden = true;
    cartContent.hidden = false;

  // Clear and rebuild the dynamic cart items list
  cartList.innerHTML = "";
  let orderTotal = 0;

  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    orderTotal += itemTotal;

    const li = document.createElement("li");
    li.classList.add("cart__item");
    li.innerHTML = `
        <div class="cart__item-info">
            <span class="cart__item-title">${item.name}</span>
            <div class="cart__item-details">
                <span class="cart__item-quantity">${item.quantity}x</span>
                <span class="cart__item-price">@ $${item.price.toFixed(2)}</span>
                <span class="cart__item-total">$${itemTotal.toFixed(2)}</span>
            </div>
        </div>
        <button class="cart__item-remove" aria-label="Remove item">
            <img src="assets/images/icon-remove-item.svg" alt="Remove item">
        </button>
    `;

    // Listen for remove clicks on individual items
    li.querySelector(".cart__item-remove").addEventListener("click", () => {
      removeFromCart(item.name);
    });

    cartList.appendChild(li);
  });

  // Update order total price text
  cartTotalPrice.textContent = `$${orderTotal.toFixed(2)}`;
}

// 5. Modal Handling & Checkout Events
checkoutBtn.addEventListener("click", () => {
  openOrderConfirmationModal();
});

startNewOrderBtn.addEventListener("click", () => {
  cart = [];
  modal.close();
  updateCartUI();
  displayDesserts(currentDessertsData);
  
  // Return focus back to checkout button when starting a new order
  checkoutBtn.focus();
});

// Close modal when clicking outside of it (on the backdrop)
modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    modal.close();
    checkoutBtn.focus();
  }
});

function openOrderConfirmationModal() {
  modalList.innerHTML = "";
  let orderTotal = 0;

  cart.forEach(item => {
    const dessertData = currentDessertsData.find(d => d.name === item.name);
    const thumbnail = dessertData ? dessertData.image.thumbnail : "";
    const itemTotal = item.price * item.quantity;
    orderTotal += itemTotal;

    const li = document.createElement("li");
    li.classList.add("modal__item");
    li.innerHTML = `
        <div class="modal__item-left">
            <img class="modal__item-img" src="${thumbnail}" alt="${item.name}">
            <div class="modal__item-info">
                <span class="modal__item-name">${item.name}</span>
                <div class="modal__item-details">
                    <span class="modal__item-quantity">${item.quantity}x</span>
                    <span class="modal__item-price">@ $${item.price.toFixed(2)}</span>
                </div>
            </div>
        </div>
        <span class="modal__item-total">$${itemTotal.toFixed(2)}</span>
    `;
    modalList.appendChild(li);
  });

  modalTotalPrice.textContent = `$${orderTotal.toFixed(2)}`;
  modal.showModal();
  
  // Trap/shift focus immediately inside the opened modal
  startNewOrderBtn.focus();
}

// --- Keyboard Navigation: Up/Down for quantity, Left/Right to move between focusable items ---
document.addEventListener('keydown', (event) => {
    const activeElement = document.activeElement;
    
    // 1. Up and Down arrows adjust quantity if focus is on a quantity button
    if (activeElement.classList.contains('dessert-card__qty-btn')) {
        const card = activeElement.closest('.dessert-card');
        const incrementBtn = card.querySelector('.increment');
        const decrementBtn = card.querySelector('.decrement');

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            incrementBtn?.click();
            return;
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            decrementBtn?.click();
            return;
        }
    }

    // 2. Left and Right arrows move focus to the previous or next focusable element on the page
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        // Query all interactive/focusable elements in the document
        const focusableElements = Array.from(document.querySelectorAll(
            'button:not([disabled]), [tabindex="0"]:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]'
        ));
        
        const currentIndex = focusableElements.indexOf(activeElement);
        
        if (currentIndex !== -1) {
            event.preventDefault();
            const nextIndex = event.key === 'ArrowRight'
                ? (currentIndex + 1) % focusableElements.length
                : (currentIndex - 1 + focusableElements.length) % focusableElements.length;
            
            focusableElements[nextIndex]?.focus();
        }
    }
});

// Initialize the app
getDesserts();
