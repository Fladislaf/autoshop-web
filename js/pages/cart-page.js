async function initCartPage() {

    const cart = Cart.getCart();
    const cartList = document.querySelector('.cart-list');
    const cartLayout = document.querySelector('.cart-layout');
    
    if (!cartList) return;


    if (cart.length === 0) {
        if (cartLayout) {
            cartLayout.innerHTML = `
                <div class="cart-empty">
                    <h2 class="cart-empty__title">Ваша корзина пуста</h2>
                    <p class="cart-empty__text">Самое время добавить в неё что-нибудь!</p>
                    <a href="zapchasti.html" class="btn-primary cart-empty__btn">Перейти в каталог</a>
                </div>
            `;
        }
        return; 
    }


    cartList.innerHTML = '<div class="cart-loading">⏳ Сверяем наличие товаров на складе...</div>';

    const availableItems = [];
    const unavailableItems = [];


    await Promise.all(cart.map(async (item) => {
        let dbProduct = null;
        try {
            if (item.type === 'tire') dbProduct = await API.getTireById(item.id);
            else if (item.type === 'wheel') dbProduct = await API.getWheelById(item.id);
            else dbProduct = await API.getProductById(item.id); 


            if (dbProduct && dbProduct.in_stock) {
                availableItems.push(item);
            } else {
                unavailableItems.push(item);
            }
        } catch (e) {
            unavailableItems.push(item);
        }
    }));


    window.unavailableIdsForCart = unavailableItems.map(i => i.id);


    renderCartItems(availableItems, unavailableItems, cartList);


    updateCartSummary(availableItems);


    const submitBtn = document.querySelector('.checkout-form button[type="submit"]');
    if (submitBtn) {
        if (unavailableItems.length > 0) {
            submitBtn.disabled = true;
            submitBtn.classList.add('checkout-btn--disabled');
            submitBtn.textContent = 'Удалите раскупленные товары';
        } else if (availableItems.length === 0) {
            submitBtn.disabled = true;
        } else {
            submitBtn.disabled = false;
            submitBtn.classList.remove('checkout-btn--disabled');
            submitBtn.textContent = 'Оформить заказ';
        }
    }
}

function renderCartItems(availableItems, unavailableItems, cartList) {
    let html = '';


    if (availableItems.length > 0) {
        html += availableItems.map(item => {
            const imageUrl = item.image || 'img/no-photo.png';
            let productLink = `product.html?id=${item.id}`;
            if (item.type === 'tire') productLink += '&type=tire';
            if (item.type === 'wheel') productLink += '&type=wheel';

            return `
                <div class="cart-item">
                    <div class="cart-item__content">
                        <a href="${productLink}" target="_blank" class="cart-item__link">
                            <img src="${imageUrl}" alt="${item.name}" class="cart-item__img">
                        </a>
                        <div class="cart-item__info">
                            <a href="${productLink}" target="_blank" class="cart-item__title-link">
                                <h3 class="cart-item__title">${item.name}</h3>
                            </a>
                            <div class="cart-item__price-row">
                                <span class="cart-item__price">${item.price.toLocaleString()} ₽</span>
                            </div>
                            <div class="cart-item__stock">На складе: <strong class="cart-item__stock--yes">Есть в наличии</strong></div>
                        </div>
                    </div>
                    <button class="cart-item__remove" type="button" onclick="Cart.remove('${item.id}')">
                        <span class="remove-desktop">&times;</span>
                        <span class="remove-mobile">🗑️ Удалить</span>
                    </button>
                </div>
            `;
        }).join('');
    }


    if (unavailableItems.length > 0) {
        html += `
            <div class="cart-unavailable-block">
                <div class="cart-unavailable-header">
                    <h3 class="cart-unavailable-title">
                        <span class="cart-unavailable-icon">⚠️</span> Этих товаров уже нет в наличии
                    </h3>
                    <button type="button" onclick="removeUnavailableItems()" class="cart-unavailable-btn">Удалить все недоступные</button>
                </div>
        `;

        html += unavailableItems.map(item => {
            const imageUrl = item.image || 'img/no-photo.png';
            let productLink = `product.html?id=${item.id}`;
            if (item.type === 'tire') productLink += '&type=tire';
            if (item.type === 'wheel') productLink += '&type=wheel';

            return `
                <div class="cart-item cart-item--unavailable">
                    <div class="cart-item__content">
                        <a href="${productLink}" target="_blank" class="cart-item__link">
                            <img src="${imageUrl}" alt="${item.name}" class="cart-item__img cart-item__img--sold-out">
                        </a>
                        <div class="cart-item__info">
                            <a href="${productLink}" target="_blank" class="cart-item__title-link">
                                <h3 class="cart-item__title cart-item__title--sold-out">${item.name}</h3>
                            </a>
                            <div class="cart-item__price-row">
                                <span class="cart-item__price cart-item__price--sold-out">${item.price.toLocaleString()} ₽</span>
                            </div>
                            <div class="cart-item__stock cart-item__stock--sold-out"><strong>Раскуплено</strong> (кто-то успел забрать этот товар)</div>
                        </div>
                    </div>
                    <button class="cart-item__remove cart-item__remove--muted" type="button" onclick="Cart.remove('${item.id}')">
                        <span class="remove-desktop">&times;</span>
                    </button>
                </div>
            `;
        }).join('');
        
        html += `</div>`;
    }

    cartList.innerHTML = html;
}

function updateCartSummary(cart) {

    const totalCount = cart.length;
    const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);


    const summaryRow = document.querySelector('.cart-summary__row');
    const totalDisplay = document.querySelector('.cart-summary__total-price');


    const getWord = (n) => {
        if (n % 10 === 1 && n % 100 !== 11) return 'товар';
        if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 'товара';
        return 'товаров';
    };

    if (summaryRow) {
        summaryRow.innerHTML = `
            <span>${totalCount} ${getWord(totalCount)}</span>
            <span>${totalPrice.toLocaleString()} ₽</span>
        `;
    }

    if (totalDisplay) {
        totalDisplay.textContent = `${totalPrice.toLocaleString()} ₽`;
    }
}




const checkoutForm = document.querySelector('.checkout-form');
if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();


        const cart = Cart.getCart();
        if (cart.length === 0) {
            alert('Ваша корзина пуста!');
            return;
        }

        const submitBtn = checkoutForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Оформляем...';


        const privacyCheckbox = document.querySelector('.form-checkbox');
        if (privacyCheckbox && !privacyCheckbox.checked) {
            alert('Пожалуйста, подтвердите согласие на обработку персональных данных (поставьте галочку внизу формы).');
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
            return;
        }


        const deliveryType = document.querySelector('input[name="delivery"]:checked').value; 
        
        const fullName = document.getElementById('input-name').value.trim();
        const city = document.getElementById('input-city').value.trim();
        const phone = document.getElementById('input-phone').value.trim();
        const email = document.getElementById('input-email').value.trim();
        const comment = document.getElementById('input-comment').value.trim();


        if (!fullName || !phone || !email) {
            alert('Пожалуйста, заполните все обязательные поля (Ф.И.О., Телефон, E-mail).');
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
            return;
        }


        if (deliveryType === 'transport' && !city) {
            alert('Пожалуйста, укажите город для транспортной компании!');
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
            return;
        }


        const totalPrice = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);


        const orderData = {
            delivery_type: deliveryType,
            full_name: fullName,
            city: deliveryType === 'transport' ? city : null, 
            phone: phone,
            email: email,
            comment: comment || null,
            total_price: totalPrice
        };


        const response = await API.createOrder(orderData, cart);

        if (response.success) {

            const shortId = response.orderId.split('-')[0];
            

            Cart.clear(); 
            
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;


            window.location.href = `status.html?id=${shortId}`; 
        } else {
            alert('Произошла ошибка при оформлении заказа. Попробуйте позже.');
            console.error(response.error);
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });
}


window.removeUnavailableItems = function() {
    if (!window.unavailableIdsForCart || window.unavailableIdsForCart.length === 0) return;
    
    let cart = Cart.getCart();
    

    cart = cart.filter(item => !window.unavailableIdsForCart.includes(item.id));
    
    Cart.saveCart(cart);
    initCartPage();
};


document.addEventListener('DOMContentLoaded', initCartPage);