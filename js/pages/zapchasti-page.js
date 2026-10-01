let currentPage = 1;
const ITEMS_PER_PAGE = 12;
let totalItemsCount = 0;
let currentFilters = {};
let isInitialized = false;

async function initCatalogPage() {
    if (isInitialized) return;
    isInitialized = true;

    const urlParams = new URLSearchParams(window.location.search);
    currentFilters = {
        makeId: urlParams.get('make'),
        modelId: urlParams.get('model'),
        genId: urlParams.get('gen'),
        engineId: urlParams.get('engine'),
        categoryId: urlParams.get('category'),
        sortOrder: urlParams.get('sort') || 'cheap',
        searchQuery: urlParams.get('q')
    };

    const carActivePanel = document.getElementById('carActivePanel');
    const mobileCarPanel = document.getElementById('mobileCarPanel');
    const catalogTitlesBlock = document.getElementById('catalogTitlesBlock');
    const textSearchPanel = document.getElementById('textSearchPanel');

    const pageTextInput = document.getElementById('pageTextInput');
    const btnPageTextSearch = document.getElementById('btnPageTextSearch');

    if (currentFilters.searchQuery) {

        if (carActivePanel) carActivePanel.classList.add('is-hidden');
        if (mobileCarPanel) mobileCarPanel.classList.add('is-hidden');
        if (catalogTitlesBlock) catalogTitlesBlock.classList.add('is-hidden');

        if (textSearchPanel) textSearchPanel.classList.remove('is-hidden');
        if (pageTextInput) pageTextInput.value = currentFilters.searchQuery;

        const doLocalSearch = () => {
            const query = pageTextInput.value.trim();
            if (query) window.location.href = `zapchasti.html?q=${encodeURIComponent(query)}`;
        };
        if (btnPageTextSearch) btnPageTextSearch.addEventListener('click', doLocalSearch);
        if (pageTextInput) pageTextInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') doLocalSearch();
        });

    } else {

        if (textSearchPanel) textSearchPanel.classList.add('is-hidden');

        const carInfo = await API.getCarInfo(currentFilters.makeId, currentFilters.modelId, currentFilters.genId, currentFilters.engineId);
        updateCatalogHeaders(carInfo);
    }


    const sortSelect = document.querySelector('.sort-select');
    if (sortSelect) {
        sortSelect.value = currentFilters.sortOrder;
        sortSelect.addEventListener('change', (e) => {
            urlParams.set('sort', e.target.value);
            window.location.search = urlParams.toString();
        });
    }


    const categoryIdsList = await API.getAvailableCategoryIds(
        currentFilters.makeId, currentFilters.modelId, currentFilters.genId, currentFilters.engineId, currentFilters.searchQuery
    );
    const allCategories = await API.getCategories();

    const categoryCounts = {};
    categoryIdsList.forEach(id => {
        if (id) categoryCounts[id] = (categoryCounts[id] || 0) + 1;
    });

    const activeCategories = allCategories
        .filter(cat => categoryCounts[cat.id])
        .map(cat => ({ ...cat, count: categoryCounts[cat.id] }));

    renderCategories(activeCategories, currentFilters.categoryId, urlParams);


    const categorySearchInput = document.querySelector('.category-search__input');
    const categoryList = document.querySelector('.category-list');
    if (categorySearchInput && categoryList) {
        categorySearchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            const items = categoryList.querySelectorAll('.category-list__item');
            items.forEach(li => {
                if (li.textContent.includes('Все категории')) return;
                const text = li.textContent.toLowerCase();
                text.includes(query) ? li.classList.remove('is-filter-hidden') : li.classList.add('is-filter-hidden');
            });
        });
    }


    const grid = document.querySelector('.catalog-grid');
    if (grid) grid.innerHTML = '';

    const totalCount = currentFilters.categoryId
        ? (categoryCounts[currentFilters.categoryId] || 0)
        : categoryIdsList.length;
        totalItemsCount = totalCount;

    if (currentFilters.searchQuery && textSearchPanel) {
        let countDisplay = document.getElementById('textSearchCount');
        if (!countDisplay) {
            countDisplay = document.createElement('div');
            countDisplay.id = 'textSearchCount';
            countDisplay.classList.add('filter-count-muted');
            textSearchPanel.appendChild(countDisplay);
        }
        countDisplay.textContent = `Найдено ${totalCount} товаров`;
    } else {
        const countElement = document.querySelector('.catalog-count');
        if (countElement) countElement.textContent = `Найдено ${totalCount} товара`;
    }



    await loadCatalogPage(currentPage);
}





async function loadCatalogPage(page) {
    currentPage = page;
    const grid = document.querySelector('.catalog-grid');
    if (!grid) return;


    grid.innerHTML = '<div class="catalog-loading">⏳ Загрузка товаров...</div>';


    if (page > 1) {
        window.scrollTo({ top: document.querySelector('.catalog-layout').offsetTop - 20, behavior: 'smooth' });
    }


    const parts = await API.getFilteredParts(
        currentFilters.makeId, currentFilters.modelId, currentFilters.genId,
        currentFilters.categoryId, currentFilters.sortOrder, currentFilters.engineId,
        currentPage, ITEMS_PER_PAGE, currentFilters.searchQuery
    );


    grid.innerHTML = '';
    appendPartsToGrid(parts);
    

    renderPagination();
}

function renderPagination() {

    const oldPagination = document.getElementById('catalogPagination');
    if (oldPagination) oldPagination.remove();


    const totalPages = Math.ceil(totalItemsCount / ITEMS_PER_PAGE);
    

    if (totalPages <= 1) return; 

    const grid = document.querySelector('.catalog-grid');
    

    let html = '<div id="catalogPagination" class="catalog-pagination">';
    
    for (let i = 1; i <= totalPages; i++) {
        const isActive = i === currentPage;

        html += `<button onclick="loadCatalogPage(${i})" class="pagination-btn${isActive ? ' is-active' : ''}">${i}</button>`;
    }
    
    html += '</div>';
    grid.insertAdjacentHTML('beforeend', html);
}

function appendPartsToGrid(parts) {
    const grid = document.querySelector('.catalog-grid');
    if (!grid) return;

    if (parts.length === 0) {
        grid.innerHTML = '<p class="catalog-empty">Товаров не найдено.</p>';
        return;
    }

    parts.forEach(item => {
        let badge = { text: '', color: '', bg: '' };
        if (typeof UI !== 'undefined') badge = UI.getBadgeStyle(item.condition);

        const imageUrl = item.images?.[0] || 'https://placehold.jp/dedede/888888/800x600.png?text=Нет+фото';
        const stockText = item.in_stock ? 'Есть в наличии' : 'Под заказ';

        const cardHTML = `
            <a href="product.html?id=${item.id}" class="product-card">
                <div class="product-card__img-wrapper">
                    <img src="${imageUrl}" alt="${item.name}" class="product-card__img">
                </div>
                <div class="product-card__info">
                    <div class="product-card__price-row">
                        <span class="product-card__price">${item.price.toLocaleString()} ₽</span>
                        ${badge.text ? `<span class="product-card__badge ${badge.class}">${badge.text}</span>` : ''}
                    </div>
                    <h3 class="product-card__title">${item.name}</h3>
                    <div class="product-card__stock">На складе: <strong>${stockText}</strong></div>
                </div>
            </a>
        `;
        grid.insertAdjacentHTML('beforeend', cardHTML);
    });
}





function updateCatalogHeaders(carInfo) {
    const textMake = carInfo.makeName || 'Все марки';
    const textModel = carInfo.modelName ? ` / ${carInfo.modelName}` : '';
    const textGen = carInfo.genName ? ` / ${carInfo.genName}` : '';
    const fullPath = `${textMake}${textModel}${textGen}`;

    const breadcrumbs = document.querySelector('.catalog-header__text .breadcrumbs');
    if (breadcrumbs) breadcrumbs.textContent = `Автозапчасти / Запчасти ${fullPath.replace(/\//g, ' / ')}`;

    const h1 = document.querySelector('.catalog-title');
    if (h1) {
        if (!carInfo.makeName) h1.innerHTML = 'Запчасти для всех автомобилей';
        else h1.innerHTML = `Запчасти для ${textMake} ${carInfo.modelName || ''}<br>${carInfo.genName || ''}`;
    }

    const activePanelBreadcrumbs = document.querySelector('.car-active-panel__breadcrumbs');
    if (activePanelBreadcrumbs) {
        activePanelBreadcrumbs.innerHTML = `
            <a href="#">${textMake}</a> 
            ${carInfo.modelName ? `<span class="separator">/</span> <a href="#">${carInfo.modelName}</a>` : ''}
            ${carInfo.genName ? `<span class="separator">/</span> <a href="#">${carInfo.genName}</a>` : ''}
        `;
    }

    const mobileTitle = document.querySelector('.mobile-car-card__title');
    if (mobileTitle) mobileTitle.innerHTML = `<strong>${textMake}</strong> ${carInfo.modelName ? `<span class="sep">/</span> <strong>${carInfo.modelName}</strong>` : ''}`;

    const mobileGen = document.querySelector('.mobile-car-card__gen strong');
    if (mobileGen) mobileGen.textContent = carInfo.genName || 'Поколение не выбрано';
}


function renderCatalogGrid(parts) {
    const grid = document.querySelector('.catalog-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (parts.length === 0) {
        grid.innerHTML = '<p class="catalog-empty">Товаров для данного автомобиля не найдено.</p>';
        return;
    }

    parts.forEach(item => {
        let badge = { text: '', color: '', bg: '' };
        if (typeof UI !== 'undefined') badge = UI.getBadgeStyle(item.condition);

        const imageUrl = item.images?.[0] || 'trigger-error.jpg';
        const stockText = item.in_stock ? 'Есть в наличии' : 'Под заказ';

        const cardHTML = `
            <a href="product.html?id=${item.id}" class="product-card">
                <div class="product-card__img-wrapper">
                    <img src="${imageUrl}" alt="${item.name}" class="product-card__img">
                </div>
                <div class="product-card__info">
                    <div class="product-card__price-row">
                        <span class="product-card__price">${item.price.toLocaleString()} ₽</span>
                        ${badge.text ? `<span class="product-card__badge ${badge.class}">${badge.text}</span>` : ''}
                    </div>
                    <h3 class="product-card__title">${item.name}</h3>
                    <div class="product-card__stock">На складе: <strong>${stockText}</strong></div>
                </div>
            </a>
        `;
        grid.insertAdjacentHTML('beforeend', cardHTML);
    });
}


function renderCategories(categories, activeCategoryId, urlParams) {
    const list = document.querySelector('.category-list');
    if (!list) return;
    list.innerHTML = '';

    const allParams = new URLSearchParams(urlParams);
    allParams.delete('category');
    const allUrl = `zapchasti.html${allParams.toString() ? '?' + allParams.toString() : ''}`;

    list.innerHTML += `
        <li class="category-list__item">
            <a href="${allUrl}" class="category-link${!activeCategoryId ? ' is-active' : ''}">
                Все категории
            </a>
        </li>
    `;

    categories.forEach(cat => {
        const params = new URLSearchParams(urlParams);
        params.set('category', cat.id);
        const url = `zapchasti.html?${params.toString()}`;
        const isActive = activeCategoryId === String(cat.id);


        list.innerHTML += `
            <li class="category-list__item">
                <a href="${url}" class="category-link${isActive ? ' is-active' : ''}">
                    ${cat.name} <span class="category-count">${cat.count}</span>
                </a>
            </li>
        `;
    });
}

document.addEventListener('DOMContentLoaded', initCatalogPage);






let modalState = {
    makeId: null, makeName: null,
    modelId: null, modelName: null,
    genId: null, genName: null,
    engineId: null, engineName: null
};

async function initDesktopCarModal() {
    const makeList = document.getElementById('modalMakeList');
    const modelList = document.getElementById('modalModelList');
    const genList = document.getElementById('modalGenList');
    const engineList = document.getElementById('modalEngineList');
    const applyBtn = document.getElementById('btnApplyCarChange');
    const resetBtn = document.getElementById('btnResetModalCar');

    if (!makeList || !applyBtn) return;

    const urlParams = new URLSearchParams(window.location.search);
    modalState.makeId = urlParams.get('make');
    modalState.modelId = urlParams.get('model');
    modalState.genId = urlParams.get('gen');
    modalState.engineId = urlParams.get('engine');


    const carInfo = await API.getCarInfo(modalState.makeId, modalState.modelId, modalState.genId, modalState.engineId);
    modalState.makeName = carInfo.makeName;
    modalState.modelName = carInfo.modelName;
    modalState.genName = carInfo.genName;
    modalState.engineName = carInfo.engineName;

    updateDesktopBreadcrumbs();

    const brands = await API.getBrands();
    renderModalList(makeList, brands, 'make', modalState.makeId);

    if (modalState.makeId) {
        document.getElementById('modalModelList').innerHTML = '<li class="modal-list-placeholder">Загрузка...</li>';
        const models = await API.getModelsByBrand(modalState.makeId);
        renderModalList(document.getElementById('modalModelList'), models, 'model', modalState.modelId);

        if (modalState.modelId) {
            document.getElementById('modalGenList').innerHTML = '<li class="modal-list-placeholder">Загрузка...</li>';
            const gens = await API.getGenerationsByModel(modalState.modelId);
            renderModalList(document.getElementById('modalGenList'), gens, 'gen', modalState.genId);



            if (modalState.genId) {
                document.getElementById('modalEngineList').innerHTML = '<li class="modal-list-placeholder modal-list-placeholder--pad">Загрузка...</li>';

                const engines = await API.getEnginesByGen(modalState.genId);
                renderModalList(document.getElementById('modalEngineList'), engines, 'engine', modalState.engineId);
            }
        }
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            modalState = { makeId: null, makeName: null, modelId: null, modelName: null, genId: null, genName: null, engineId: null, engineName: null };
            makeList.querySelectorAll('li').forEach(el => el.classList.remove('is-selected'));
            modelList.innerHTML = '';
            genList.innerHTML = '';
            engineList.innerHTML = '';
            updateDesktopBreadcrumbs();
        });
    }

    applyBtn.addEventListener('click', () => {
        const params = new URLSearchParams(window.location.search);

        if (modalState.makeId) params.set('make', modalState.makeId); else params.delete('make');
        if (modalState.modelId) params.set('model', modalState.modelId); else params.delete('model');
        if (modalState.genId) params.set('gen', modalState.genId); else params.delete('gen');
        if (modalState.engineId) params.set('engine', modalState.engineId); else params.delete('engine');

        window.location.href = `zapchasti.html?${params.toString()}`;
    })


    const columns = document.querySelectorAll('.car-col');
    columns.forEach(col => {
        const searchInput = col.querySelector('.car-col__search');
        const list = col.querySelector('.car-col__list');

        if (searchInput && list) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase().trim();
                const items = list.querySelectorAll('li');

                items.forEach(li => {

                    if (li.textContent.includes('Загрузка')) return;

                    const text = li.textContent.toLowerCase();

                    text.includes(query) ? li.classList.remove('is-filter-hidden') : li.classList.add('is-filter-hidden');
                });
            });
        }
    });
}


function updateDesktopBreadcrumbs() {
    const breadcrumbs = document.getElementById('modalDesktopBreadcrumbs');
    if (!breadcrumbs) return;

    let html = `<span class="car-icon-mini">🚗</span>`;

    if (modalState.makeName) html += `<span class="active">${modalState.makeName}</span> <span class="sep">/</span>`;
    if (modalState.modelName) html += `<span class="active">${modalState.modelName}</span> <span class="sep">/</span>`;
    if (modalState.genName) html += `<span class="active">${modalState.genName}</span> <span class="sep">/</span>`;
    if (modalState.engineName) html += `<span class="active">${modalState.engineName}</span> <span class="sep">/</span>`;


    if (!modalState.makeId) html += `<span class="current">Выберите марку</span>`;
    else if (!modalState.modelId) html += `<span class="current">Выберите модель</span>`;
    else if (!modalState.genId) html += `<span class="current">Выберите кузов/поколение</span>`;
    else if (!modalState.engineId) html += `<span class="current">Выберите двигатель (опционально)</span>`;
    else html += `<span class="current">Автомобиль полностью выбран</span>`;

    breadcrumbs.innerHTML = html;
}


function renderModalList(container, items, type, activeId = null) {
    container.innerHTML = '';

    if (items.length === 0) {
        container.innerHTML = '<li class="modal-list-placeholder">Нет данных</li>';
        return;
    }

    items.forEach(item => {
        const li = document.createElement('li');

        if (type === 'gen') {
            li.innerHTML = `${item.name}<br><small>${item.years || ''} ${item.body_codes ? '(' + item.body_codes + ')' : ''}</small>`;
        } else if (type === 'engine') {
            li.innerHTML = `${item.name} <span class="fuel-icon">⛽</span>`;
        } else {
            li.textContent = item.name;
        }

        if (String(item.id) === String(activeId)) {
            li.classList.add('is-selected');
        }

        li.addEventListener('click', async () => {
            container.querySelectorAll('li').forEach(el => el.classList.remove('is-selected'));
            li.classList.add('is-selected');

            if (type === 'make') {
                modalState.makeId = item.id; modalState.makeName = item.name;
                modalState.modelId = null; modalState.modelName = null;
                modalState.genId = null; modalState.genName = null;
                modalState.engineId = null; modalState.engineName = null;

                document.getElementById('modalModelList').innerHTML = '<li class="modal-list-placeholder">Загрузка...</li>';
                document.getElementById('modalGenList').innerHTML = '';
                document.getElementById('modalEngineList').innerHTML = '';

                const models = await API.getModelsByBrand(item.id);
                renderModalList(document.getElementById('modalModelList'), models, 'model');
            }
            else if (type === 'model') {
                modalState.modelId = item.id; modalState.modelName = item.name;
                modalState.genId = null; modalState.genName = null;
                modalState.engineId = null; modalState.engineName = null;

                document.getElementById('modalGenList').innerHTML = '<li class="modal-list-placeholder">Загрузка...</li>';
                document.getElementById('modalEngineList').innerHTML = '';

                const gens = await API.getGenerationsByModel(item.id);
                renderModalList(document.getElementById('modalGenList'), gens, 'gen');
            }

            else if (type === 'gen') {
                modalState.genId = item.id;
                modalState.genName = item.name;
                modalState.engineId = null;
                modalState.engineName = null;

                document.getElementById('modalEngineList').innerHTML = '<li class="modal-list-placeholder modal-list-placeholder--pad">Загрузка двигателей...</li>';


                const engines = await API.getEnginesByGen(item.id);
                renderModalList(document.getElementById('modalEngineList'), engines, 'engine');
            }
            else if (type === 'engine') {
                modalState.engineId = item.id; modalState.engineName = item.name;
            }

            updateDesktopBreadcrumbs();
        });

        container.appendChild(li);
    });
}

document.addEventListener('DOMContentLoaded', initDesktopCarModal);






let mobileModalState = {
    makeId: null, makeName: null,
    modelId: null, modelName: null,
    genId: null, genName: null,
    engineId: null, engineName: null,
    step: 'make'
};

async function initMobileCarModal() {
    const listContainer = document.getElementById('mobileModalList');
    const stepsContainer = document.getElementById('mobileModalSteps');
    const applyBtn = document.getElementById('btnApplyMobileCarChange');

    const btnChangeCarMobile = document.getElementById('btnChangeCarMobile');
    const btnRefineBodyMobile = document.getElementById('btnRefineBodyMobile');
    const btnSelectEngineMobile = document.getElementById('btnSelectEngineMobile');

    if (!listContainer || !stepsContainer || !applyBtn) return;

    const prepareMobileModal = async () => {
        const urlParams = new URLSearchParams(window.location.search);
        mobileModalState.makeId = urlParams.get('make');
        mobileModalState.modelId = urlParams.get('model');
        mobileModalState.genId = urlParams.get('gen');
        mobileModalState.engineId = urlParams.get('engine');

        const carInfo = await API.getCarInfo(mobileModalState.makeId, mobileModalState.modelId, mobileModalState.genId, mobileModalState.engineId);
        mobileModalState.makeName = carInfo.makeName;
        mobileModalState.modelName = carInfo.modelName;
        mobileModalState.genName = carInfo.genName;
        mobileModalState.engineName = carInfo.engineName;

        if (!mobileModalState.makeId) mobileModalState.step = 'make';
        else if (!mobileModalState.modelId) mobileModalState.step = 'model';
        else if (!mobileModalState.genId) mobileModalState.step = 'gen';
        else mobileModalState.step = 'engine';

        renderMobileStep();
    };

    if (btnChangeCarMobile) btnChangeCarMobile.addEventListener('click', prepareMobileModal);
    if (btnRefineBodyMobile) btnRefineBodyMobile.addEventListener('click', prepareMobileModal);
    if (btnSelectEngineMobile) btnSelectEngineMobile.addEventListener('click', prepareMobileModal);

    applyBtn.addEventListener('click', () => {
        const params = new URLSearchParams(window.location.search);
        if (mobileModalState.makeId) params.set('make', mobileModalState.makeId); else params.delete('make');
        if (mobileModalState.modelId) params.set('model', mobileModalState.modelId); else params.delete('model');
        if (mobileModalState.genId) params.set('gen', mobileModalState.genId); else params.delete('gen');
        if (mobileModalState.engineId) params.set('engine', mobileModalState.engineId); else params.delete('engine');

        window.location.href = `zapchasti.html?${params.toString()}`;
    });

    async function renderMobileStep() {
        stepsContainer.innerHTML = '';
        listContainer.innerHTML = '<li class="modal-list-empty">Загрузка...</li>';

        if (mobileModalState.step === 'make') {
            stepsContainer.innerHTML = `<div class="mm-current-step">Выберите марку</div>`;
            const brands = await API.getBrands();
            renderMobileList(brands, 'make');
        }
        else if (mobileModalState.step === 'model') {
            stepsContainer.innerHTML = `
                <div class="mm-step"><span>${mobileModalState.makeName}</span> <button class="mm-btn-change" onclick="changeMobileStep('make')">Изменить</button></div>
                <div class="mm-current-step">Выберите модель</div>
            `;
            const models = await API.getModelsByBrand(mobileModalState.makeId);
            renderMobileList(models, 'model');
        }
        else if (mobileModalState.step === 'gen') {
            stepsContainer.innerHTML = `
                <div class="mm-step"><span>${mobileModalState.makeName}</span> <button class="mm-btn-change" onclick="changeMobileStep('make')">Изменить</button></div>
                <div class="mm-step"><span>${mobileModalState.modelName}</span> <button class="mm-btn-change" onclick="changeMobileStep('model')">Изменить</button></div>
                <div class="mm-current-step">Выберите поколение</div>
            `;
            const gens = await API.getGenerationsByModel(mobileModalState.modelId);
            renderMobileList(gens, 'gen');
        }
        else if (mobileModalState.step === 'engine') {
            stepsContainer.innerHTML = `
                <div class="mm-step"><span>${mobileModalState.makeName}</span> <button class="mm-btn-change" onclick="changeMobileStep('make')">Изменить</button></div>
                <div class="mm-step"><span>${mobileModalState.modelName}</span> <button class="mm-btn-change" onclick="changeMobileStep('model')">Изменить</button></div>
                <div class="mm-step"><span>${mobileModalState.genName}</span> <button class="mm-btn-change" onclick="changeMobileStep('gen')">Изменить</button></div>
                <div class="mm-current-step">Выберите двигатель</div>
            `;
            const engines = await API.getEnginesByGen(mobileModalState.genId);
            renderMobileList(engines, 'engine');
        }
    }

    window.changeMobileStep = (step) => {
        mobileModalState.step = step;
        if (step === 'make') { mobileModalState.makeId = null; mobileModalState.modelId = null; mobileModalState.genId = null; mobileModalState.engineId = null; }
        if (step === 'model') { mobileModalState.modelId = null; mobileModalState.genId = null; mobileModalState.engineId = null; }
        if (step === 'gen') { mobileModalState.genId = null; mobileModalState.engineId = null; }
        renderMobileStep();
    };

    function renderMobileList(items, type) {
        listContainer.innerHTML = '';
        if (items.length === 0) {
            listContainer.innerHTML = '<li class="modal-list-muted">Нет данных</li>';
            return;
        }

        items.forEach(item => {
            const li = document.createElement('li');

            let isActive = false;
            if (type === 'make' && String(item.id) === String(mobileModalState.makeId)) isActive = true;
            if (type === 'model' && String(item.id) === String(mobileModalState.modelId)) isActive = true;
            if (type === 'gen' && String(item.id) === String(mobileModalState.genId)) isActive = true;
            if (type === 'engine' && String(item.id) === String(mobileModalState.engineId)) isActive = true;

            const textClass = isActive ? ' car-list-item__text--active' : '';

            if (type === 'gen') li.innerHTML = `<span class="car-list-item__text${textClass}">${item.name} <small class="car-list-years">${item.years || ''}</small></span>`;
            else if (type === 'engine') li.innerHTML = `<span class="car-list-item__text${textClass}">${item.name} <span class="fuel-icon">⛽</span></span>`;
            else li.innerHTML = `<span class="car-list-item__text${textClass}">${item.name}</span>`;

            li.addEventListener('click', () => {
                if (type === 'make') {
                    mobileModalState.makeId = item.id; mobileModalState.makeName = item.name;
                    mobileModalState.step = 'model';
                } else if (type === 'model') {
                    mobileModalState.modelId = item.id; mobileModalState.modelName = item.name;
                    mobileModalState.step = 'gen';
                } else if (type === 'gen') {
                    mobileModalState.genId = item.id; mobileModalState.genName = item.name;
                    mobileModalState.step = 'engine';
                } else if (type === 'engine') {
                    mobileModalState.engineId = item.id; mobileModalState.engineName = item.name;
                }
                renderMobileStep();
            });

            listContainer.appendChild(li);
        });
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


                const genName = firstCar.generations?.name || firstCar.generations?.years;


                const brandId = firstCar.generations.models.brands?.id || firstCar.generations.models.brand_id;
                const modelId = firstCar.generations.models?.id || firstCar.generations.model_id;


                const genId = firstCar.generations?.id;


                if (brandName && brandId) {
                    html += `<a href="zapchasti.html?make=${brandId}" class="breadcrumb-link">${brandName}</a> <span class="breadcrumb-sep">/</span> `;
                }


                if (modelName && brandId && modelId) {
                    html += `<a href="zapchasti.html?make=${brandId}&model=${modelId}" class="breadcrumb-link">${modelName}</a> <span class="breadcrumb-sep">/</span> `;
                }


                if (genName && brandId && modelId && genId) {
                    html += `<a href="zapchasti.html?make=${brandId}&model=${modelId}&gen=${genId}" class="breadcrumb-link">${genName}</a> <span class="breadcrumb-sep">/</span> `;
                }
            }

            html += `<span class="breadcrumb-current">${product.name}</span>`;
        }

        breadcrumbsContainer.innerHTML = html;
    }
}

document.addEventListener('DOMContentLoaded', initMobileCarModal);