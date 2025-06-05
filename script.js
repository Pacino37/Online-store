// Replace with your actual Stripe public key
const stripe = Stripe("pk_test_51RWMZ0Qqk6nCKA6s7vfs81QCZTGJTbMft8fttS09StP3TymTUNtEkEgfTK8octPO1qxmn7OwE42H0xDGinr06bZJ00MLIsuHwQ");

const products = [
  { id: 1, name: "Product A", price: 5000, description: "A cool product", image: "https://via.placeholder.com/150" },
  { id: 2, name: "Product B", price: 8000, description: "Another item", image: "https://via.placeholder.com/150" }
];

let cart = [];
let elements, cardElement;

document.addEventListener('DOMContentLoaded', () => {
  const productGrid = document.getElementById("product-grid");
  const cartItems = document.getElementById("cart-items");
  const cartTotal = document.getElementById("cart-total");
  const paymentMessage = document.getElementById("payment-message");

  function renderProducts() {
    products.forEach(p => {
      const card = document.createElement('div');
      card.innerHTML = `
        <img src="${p.image}" width="100" />
        <h3>${p.name}</h3>
        <p>${p.description}</p>
        <p>$${(p.price / 100).toFixed(2)}</p>
        <button>Add to Cart</button>
      `;
      card.querySelector('button').onclick = () => {
        const existing = cart.find(i => i.id === p.id);
        if (existing) {
          existing.quantity++;
        } else {
          cart.push({ ...p, quantity: 1 });
        }
        updateCart();
      };
      productGrid.appendChild(card);
    });
  }

  function updateCart() {
    cartItems.innerHTML = "";
    let total = 0;
    cart.forEach(item => {
      const row = document.createElement("div");
      total += item.price * item.quantity;
      row.innerHTML = `
        ${item.name} - $${(item.price / 100).toFixed(2)} x ${item.quantity}
        <button onclick="removeItem(${item.id})">Remove</button>
      `;
      cartItems.appendChild(row);
    });
    cartTotal.textContent = (total / 100).toFixed(2);
  }

  window.removeItem = (id) => {
    cart = cart.filter(i => i.id !== id);
    updateCart();
  };

  async function setupStripe() {
    elements = stripe.elements();
    cardElement = elements.create("card");
    cardElement.mount("#payment-form");
  }

  document.getElementById("checkout-btn").addEventListener("click", async () => {
    const amount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    if (amount === 0) {
      alert("Cart is empty.");
      return;
    }

    const res = await fetch("http://localhost:4242/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount })
    });

    const data = await res.json();
    const clientSecret = data.clientSecret;

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardElement }
    });

    if (result.error) {
      paymentMessage.textContent = result.error.message;
      paymentMessage.style.color = "red";
    } else if (result.paymentIntent.status === "succeeded") {
      paymentMessage.textContent = "Payment successful!";
      paymentMessage.style.color = "green";
      cart = [];
      updateCart();
    }
  });

  renderProducts();
  updateCart();
  setupStripe();
});
