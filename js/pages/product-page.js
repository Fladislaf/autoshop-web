let currentImages = [];
let currentIndex = 0;

async function initProductPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    const productType = urlParams.get('type') || 'part';

    if (!productId) {
        window.location.href = 'zapchasti.html';
        return;
    }

    let product = null;


    if (productType === 'tire') {
        product = await API.getTireById(productId);
    } else if (productType === 'wheel') {
        product = await API.getWheelById(productId);
    } else {
        product = await API.getProductFullData(productId);
    }

    if (!product) {
        document.querySelector('.product-title').textContent = 'Товар не найден';
        return;
    }

    currentImages = product.images || [];


    document.querySelector('.product-title').textContent = product.name;

    const priceBox = document.querySelector('.buy-box__price');
    if (priceBox) priceBox.textContent = `${product.price.toLocaleString()} ₽`;

    const descBox = document.querySelector('.seller-comment p');
    if (descBox) descBox.textContent = product.description || 'Описание отсутствует.';

    const stockElement = document.querySelector('.buy-box__stock strong');
    if (stockElement) {
        stockElement.textContent = product.in_stock ? 'Есть в наличии' : 'Нет в наличии';
        stockElement.classList.toggle('buy-box__stock--in', product.in_stock); stockElement.classList.toggle('buy-box__stock--out', !product.in_stock);
    }
    const badgeEl = document.querySelector('.buy-box__stock .product-card__badge');
    if (badgeEl && typeof UI !== 'undefined') {
        const badgeStyle = UI.getBadgeStyle(product.condition);
        badgeEl.textContent = badgeStyle.text;
        badgeEl.className = `product-card__badge ${badgeStyle.class}`;
    }


    renderGallery();
    setupModalEvents();


    const applicabilityList = product.part_applicability || [];
    const firstCar = applicabilityList[0] || null;


    renderBreadcrumbs(product, firstCar, productType);

    if (productType === 'part') {
        renderSpecsTable(product, firstCar, productType);
        renderApplicability(applicabilityList);
    } else {

        const allTabs = document.querySelectorAll('.tab-btn');
        allTabs.forEach(btn => {

            if (btn.textContent.trim().toLowerCase().includes('применимость')) {
                btn.classList.add('is-hidden');


                const targetId = btn.getAttribute('data-tab');
                if (targetId) {
                    const contentEl = document.getElementById(targetId);
                    if (contentEl) contentEl.classList.add('is-hidden');
                }
            }
        });

        renderSpecsTable(product, null, productType);
    }


    const addToCartBtn = document.getElementById('addToCartBtn');

    if (addToCartBtn) {

        if (!product.in_stock) {
            addToCartBtn.outerHTML = `
                <div class="product-out-of-stock">
                    ❌ Нет в наличии
                </div>
            `;
        } else {

            const showSuccessState = () => {
                addToCartBtn.outerHTML = `
                    <div class="cart-added-msg">
                        <span class="cart-added-icon">✓</span>
                        <span class="cart-added-text">Товар добавлен <a href="korzina.html" class="cart-added-link">в корзину</a></span>
                    </div>
                `;
            };

            if (Cart.isInCart(product.id)) {
                showSuccessState();
            } else {
                addToCartBtn.onclick = () => {
                    const isAdded = Cart.add(product, productType);
                    if (isAdded) {
                        showSuccessState();
                    }
                };
            }
        }
    }
}


function renderSpecsTable(product, firstCar, productType = 'part') {
    const specsTable = document.querySelector('.specs-table');
    if (!specsTable) return;

    let specs = [];


    const getConditionText = (cond) => {
        if (cond === 'new') return 'Новый';
        if (cond === 'used') return 'Б/У';
        if (cond === 'contract') return 'Контрактный';
        return cond || '—';
    };



    if (productType === 'tire') {
        specs = [
            { label: 'Артикул (SKU)', value: product.sku || product.id.slice(0, 8) },
            { label: 'Номер комплекта', value: product.set_number },
            { label: 'В комплекте', value: product.pieces_in_set ? `${product.pieces_in_set} шт.` : '1 шт.' },
            { label: 'Ширина шины', value: product.tire_width },
            { label: 'Высота профиля', value: product.tire_profile },
            { label: 'Диаметр', value: product.tire_diameter },
            { label: 'Производитель', value: product.manufacturer },
            { label: 'Сезон', value: product.tire_season },
            { label: 'Год производства', value: product.manufacture_year },
            { label: 'Состояние', value: getConditionText(product.condition) }
        ];
    }

    else if (productType === 'wheel') {
        specs = [
            { label: 'Артикул (SKU)', value: product.sku || product.id.slice(0, 8) },
            { label: 'Номер комплекта', value: product.set_number },
            { label: 'В комплекте', value: product.pieces_in_set ? `${product.pieces_in_set} шт.` : '1 шт.' },
            { label: 'Ширина диска', value: product.wheel_width },
            { label: 'Сверловка', value: product.wheel_bolt_pattern },
            { label: 'Вылет ET', value: product.wheel_offset_et },
            { label: 'Диаметр ц.о. DIA', value: product.wheel_cb_dia },
            { label: 'Диаметр диска', value: product.wheel_diameter },
            { label: 'Производитель', value: product.manufacturer },
            { label: 'Состояние', value: getConditionText(product.condition) }
        ];
    }

    else {

        const brandName = firstCar?.generations?.models?.brands?.name || '—';
        const modelName = firstCar?.generations?.models?.name || '—';
        const bodyCode = firstCar?.generations?.body_codes || '—';
        const engineName = firstCar?.engines?.name || '—';

        specs = [
            { label: 'Артикул (SKU)', value: product.sku || product.id.slice(0, 8) },
            { label: 'В комплекте', value: product.pieces_in_set ? `${product.pieces_in_set} шт.` : '1 шт.' },
            { label: 'Марка', value: brandName },
            { label: 'Модель', value: modelName },
            { label: 'Кузов', value: bodyCode },
            { label: 'Двигатель', value: engineName },
            { label: 'Год производства', value: product.manufacture_year || '—' },
            { label: 'Номер по производителю', value: product.oem_number || '—' },
            { label: 'Производитель', value: product.manufacturer || '—' },
            { label: 'Состояние', value: getConditionText(product.condition) }
        ];
    }



    specsTable.innerHTML = specs
        .filter(spec => spec.value !== null && spec.value !== undefined && spec.value !== '')
        .map(spec => `
            <div class="spec-row">
                <div class="spec-label">${spec.label}</div>
                <div class="spec-value">${spec.value}</div>
            </div>
        `).join('');
}


function renderApplicability(applicabilityList) {
    const tabApp = document.getElementById('tab-app');
    if (!tabApp) return;

    if (applicabilityList.length === 0) {
        tabApp.innerHTML = '<p class="tab-empty-msg">Нет данных о применимости.</p>';
        return;
    }


    const mainBrand = applicabilityList[0]?.generations?.models?.brands?.name || 'Автомобиль';


    let html = `<div class="app-brand-tag">${mainBrand}</div><div class="app-list">`;

    applicabilityList.forEach(item => {
        const gen = item.generations;
        const modelName = gen?.models?.name || 'Неизвестно';
        const genName = gen?.name || '';
        const genYears = gen?.years ? `, ${gen.years}` : '';
        const bodyCodes = gen?.body_codes || '';
        const engineName = item.engines?.name || '';

        html += `
            <div class="app-item">
                <div class="app-item__main">
                    <strong>${modelName}</strong> 
                    <span class="app-item__gen">/ ${genName}${genYears} ${bodyCodes ? `(${bodyCodes})` : ''}</span>
                </div>
                <div class="app-item__details">
                    ${bodyCodes ? `<span class="app-badge-outline">${bodyCodes}</span>` : '<div></div>'}
                    ${engineName ? `<span class="app-badge-yellow">${engineName}</span>` : ''}
                </div>
            </div>
        `;
    });

    html += `</div>`;
    tabApp.innerHTML = html;
}


function renderGallery() {
    const mainImg = document.getElementById('mainImage');
    const thumbsContainer = document.querySelector('.gallery-thumbs');
    if (!mainImg || !thumbsContainer) return;

    if (currentImages.length === 0) {
        mainImg.src = 'https://placehold.jp/dedede/888888/800x600.png?text=Нет+фото';
        thumbsContainer.innerHTML = '';
        return;
    }



    mainImg.src = currentImages[0];
    mainImg.dataset.index = 0;


    mainImg.addEventListener('click', () => {
        const indexToOpen = parseInt(mainImg.dataset.index) || 0;
        openModal(indexToOpen);
    });


    thumbsContainer.innerHTML = currentImages.map((img, idx) => `
        <img src="${img}" class="thumb-img ${idx === 0 ? 'is-active' : ''}" data-index="${idx}">
    `).join('');


    thumbsContainer.querySelectorAll('.thumb-img').forEach(thumb => {
        thumb.addEventListener('click', function () {
            const newIndex = this.dataset.index;


            mainImg.src = this.src;
            mainImg.dataset.index = newIndex;


            thumbsContainer.querySelectorAll('.thumb-img').forEach(t => t.classList.remove('is-active'));
            this.classList.add('is-active');
        });
    });
}



function openModal(index) {
    currentIndex = index;
    const modal = document.getElementById('galleryModal');
    updateModalContent();
    modal.classList.add('is-open');
    document.body.classList.add('body-no-scroll');
}

function updateModalContent() {
    const modalImg = document.getElementById('galleryModalImg');
    const modalThumbs = document.getElementById('galleryModalThumbs');

    if (!modalImg || currentImages.length === 0) return;

    modalImg.src = currentImages[currentIndex];

    modalThumbs.innerHTML = currentImages.map((img, idx) => `
        <img src="${img}" class="modal-thumb ${idx === currentIndex ? 'is-active' : ''}" 
             onclick="changeModalIndex(${idx})">
    `).join('');
}

function changeModalIndex(index) {
    currentIndex = index;
    updateModalContent();
}

function setupModalEvents() {
    const modal = document.getElementById('galleryModal');
    const closeBtn = document.getElementById('galleryModalClose');
    const prevBtn = document.getElementById('galleryNavPrev');
    const nextBtn = document.getElementById('galleryNavNext');

    if (!modal) return;

    closeBtn.onclick = () => {
        modal.classList.remove('is-open');
        document.body.classList.remove('body-no-scroll');
    };

    prevBtn.onclick = (e) => {
        e.stopPropagation();
        currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
        updateModalContent();
    };

    nextBtn.onclick = (e) => {
        e.stopPropagation();
        currentIndex = (currentIndex + 1) % currentImages.length;
        updateModalContent();
    };


    modal.onclick = (e) => {
        if (e.target === modal) closeBtn.onclick();
    };
}



function renderBreadcrumbs(product, firstCar, productType = 'part') {
    const breadcrumbsContainer = document.querySelector('.breadcrumbs');
    if (!breadcrumbsContainer) return;


    let html = `<a href="index.html" class="breadcrumb-link">Главная</a> <span class="breadcrumb-sep">/</span> `;

    if (productType === 'tire') {
        html += `<a href="shiny.html" class="breadcrumb-link">Шины и диски</a> <span class="breadcrumb-sep">/</span> `;
        html += `<a href="shiny.html" class="breadcrumb-link">Шины</a> <span class="breadcrumb-sep">/</span> `;
        html += `<span class="breadcrumb-current">${product.name}</span>`;
    }
    else if (productType === 'wheel') {
        html += `<a href="diski.html" class="breadcrumb-link">Шины и диски</a> <span class="breadcrumb-sep">/</span> `;
        html += `<a href="diski.html" class="breadcrumb-link">Диски</a> <span class="breadcrumb-sep">/</span> `;
        html += `<span class="breadcrumb-current">${product.name}</span>`;
    }
    else {
        html += `<a href="zapchasti.html" class="breadcrumb-link">Автозапчасти</a> <span class="breadcrumb-sep">/</span> `;


        if (firstCar && firstCar.generations && firstCar.generations.models) {
            const brandName = firstCar.generations.models.brands?.name;
            const modelName = firstCar.generations.models?.name;


            const brandId = firstCar.generations.models.brands?.id || firstCar.generations.models.brand_id;
            const modelId = firstCar.generations.models?.id || firstCar.generations.model_id;


            if (brandName && brandId) {
                html += `<a href="zapchasti.html?make=${brandId}" class="breadcrumb-link">${brandName}</a> <span class="breadcrumb-sep">/</span> `;
            }


            if (modelName && brandId && modelId) {
                html += `<a href="zapchasti.html?make=${brandId}&model=${modelId}" class="breadcrumb-link">${modelName}</a> <span class="breadcrumb-sep">/</span> `;
            }
        }

        html += `<span class="breadcrumb-current">${product.name}</span>`;
    }

    breadcrumbsContainer.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', initProductPage);