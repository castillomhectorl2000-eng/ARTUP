let allProducts = [];
let cart = [];
let currentSlide = 0;
let slideInterval;

// Elementos comunes
const cartBtn = document.getElementById('cart-btn');
const closeCartBtn = document.getElementById('close-cart');
const cartDrawer = document.getElementById('cart-drawer');
const cartItemsContainer = document.getElementById('cart-items');
const cartCount = document.getElementById('cart-count');
const cartTotalPrice = document.getElementById('cart-total-price');
const checkoutWhatsappBtn = document.getElementById('checkout-whatsapp');
const toast = document.getElementById('toast');

// 1. Lógica del Carrusel (Solo corre si existe en la página de inicio)
const slides = document.querySelectorAll('.slide');
if (slides.length > 0) {
    const prevSlideBtn = document.getElementById('prev-slide');
    const nextSlideBtn = document.getElementById('next-slide');

    function showSlide(index) {
        slides.forEach(slide => slide.classList.remove('active'));
        currentSlide = (index + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
    }

    function nextSlide() { showSlide(currentSlide + 1); }
    function prevSlide() { showSlide(currentSlide - 1); }

    function startSliderTimer() {
        slideInterval = setInterval(nextSlide, 5000);
    }

    nextSlideBtn.addEventListener('click', () => { nextSlide(); resetTimer(); });
    prevSlideBtn.addEventListener('click', () => { prevSlide(); resetTimer(); });

    function resetTimer() {
        clearInterval(slideInterval);
        startSliderTimer();
    }
    startSliderTimer();
}

// 2. Carga general de productos desde productos.txt
async function loadProducts() {
    try {
        const response = await fetch('productos.txt');
        const textData = await response.text();
        const lines = textData.split('\n').filter(line => line.trim() !== '');

        allProducts = lines.map((line, index) => {
            const [name, price, collection, imageName] = line.split('|').map(item => item.trim());
            return {
                id: index + 1,
                name: name,
                price: parseFloat(price),
                collection: collection,
                image: `imagenes/${imageName}`
            };
        });

        // Detectar en qué página estamos y renderizar lo correspondiente
        if (document.getElementById('recommendations-grid')) {
            renderRandomRecommendations();
        }

        if (document.getElementById('product-grid')) {
            populateCollectionOptions();
            applyFiltersAndSort();
        }

    } catch (error) {
        console.error("Error al cargar productos.txt:", error);
    }
}

// 3. Renderizar Recomendaciones Aleatorias en el Index
function renderRandomRecommendations() {
    const recGrid = document.getElementById('recommendations-grid');
    recGrid.innerHTML = '';
    
    // Tomar 3 productos de forma aleatoria
    const shuffled = [...allProducts].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);

    selected.forEach(product => {
        recGrid.appendChild(createProductCard(product));
    });
}

// 4. Filtrar y Ordenar en la Página de Catálogo
const collectionFilter = document.getElementById('collection-filter');
const priceSort = document.getElementById('price-sort');

if (collectionFilter && priceSort) {
    collectionFilter.addEventListener('change', applyFiltersAndSort);
    priceSort.addEventListener('change', applyFiltersAndSort);
}

function populateCollectionOptions() {
    if (!collectionFilter) return;
    const collections = [...new Set(allProducts.map(p => p.collection))];
    collections.forEach(col => {
        const option = document.createElement('option');
        option.value = col;
        option.textContent = col;
        collectionFilter.appendChild(option);
    });
}

function applyFiltersAndSort() {
    let filtered = [...allProducts];

    if (collectionFilter && collectionFilter.value !== 'todas') {
        filtered = filtered.filter(p => p.collection === collectionFilter.value);
    }

    if (priceSort) {
        const sortOrder = priceSort.value;
        if (sortOrder === 'asc') {
            filtered.sort((a, b) => a.price - b.price);
        } else if (sortOrder === 'desc') {
            filtered.sort((a, b) => b.price - a.price);
        }
    }

    renderCatalogGrid(filtered);
}

function renderCatalogGrid(productsToRender) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (productsToRender.length === 0) {
        grid.innerHTML = '<p class="empty-cart-msg">No se encontraron productos.</p>';
        return;
    }

    productsToRender.forEach(product => {
        grid.appendChild(createProductCard(product));
    });
}

// Helper para crear tarjetas de producto
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="product-image" onerror="this.src='https://via.placeholder.com/300x350/121212/ffffff?text=Artup'">
        <div class="product-info">
            <span class="product-tag">${product.collection}</span>
            <h3 class="product-title">${product.name}</h3>
            <p class="product-price">$${product.price.toFixed(2)}</p>
            <button class="btn-add" onclick="addToCart(${product.id})">Añadir al Carrito</button>
        </div>
    `;
    return card;
}

// 5. Gestión del Carrito
function addToCart(productId) {
    const product = allProducts.find(p => p.id === productId);
    const existing = cart.find(item => item.id === productId);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    updateCartUI();
    showToast();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCartUI();
}

function updateCartUI() {
    cartCount.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart-msg">El carrito está vacío.</p>';
        cartTotalPrice.textContent = '$0.00';
        return;
    }

    cartItemsContainer.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        total += item.price * item.quantity;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div>
                <h4>${item.name}</h4>
                <small>$${item.price.toFixed(2)} x ${item.quantity}</small>
            </div>
            <button class="remove-item" onclick="removeFromCart(${item.id})">✕</button>
        `;
        cartItemsContainer.appendChild(div);
    });

    cartTotalPrice.textContent = `$${total.toFixed(2)}`;
}

function showToast() {
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

if (cartBtn) cartBtn.addEventListener('click', () => cartDrawer.classList.add('open'));
if (closeCartBtn) closeCartBtn.addEventListener('click', () => cartDrawer.classList.remove('open'));

if (checkoutWhatsappBtn) {
    checkoutWhatsappBtn.addEventListener('click', () => {
        if (cart.length === 0) return;
        let msg = "Hola Artup, deseo hacer este pedido:%0A%0A";
        let total = 0;
        cart.forEach(i => {
            msg += `- ${i.name} (x${i.quantity}): $${(i.price * i.quantity).toFixed(2)}%0A`;
            total += i.price * i.quantity;
        });
        msg += `%0A*Total a pagar: $${total.toFixed(2)}*`;
        window.open(`https://wa.me/5804245082212?text=${msg}`, '_blank');
    });
}

// Inicializar cargando datos
loadProducts();