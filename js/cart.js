const Cart = {

    getCart() {
        const cartString = localStorage.getItem('auto_cart');
        return cartString ? JSON.parse(cartString) : [];
    },


    saveCart(cart) {
        localStorage.setItem('auto_cart', JSON.stringify(cart));
        this.updateCounter(); 
    },


    isInCart(id) {
        return this.getCart().some(item => item.id === id);
    },


    remove(id) {
        let cart = this.getCart();
        cart = cart.filter(item => item.id !== id);
        this.saveCart(cart);
        
        if (typeof initCartPage === 'function') {
            initCartPage();
        }
    },


    add(product, type = 'part') {
        const cart = this.getCart();
        
        if (this.isInCart(product.id)) {
            return false; 
        }

        cart.push({
            id: product.id,
            type: type,
            name: product.name,
            price: product.price,
            image: product.images?.[0] || 'img/no-photo.png',
            sku: product.sku || product.id.slice(0, 8)
        });

        this.saveCart(cart);
        return true; 
    },


    clear() {
        localStorage.removeItem('auto_cart');
        this.updateCounter();
        

        if (typeof initCartPage === 'function') {
            initCartPage();
        }
    },


    updateCounter() {
        const cart = this.getCart();
        const count = cart.length;
        
        document.querySelectorAll('.cart-counter').forEach(el => {
            el.textContent = count;

            count > 0 ? el.classList.remove('is-hidden') : el.classList.add('is-hidden'); 
        });
    },


    init() {
        this.updateCounter();
    }
};

document.addEventListener('DOMContentLoaded', () => Cart.init());