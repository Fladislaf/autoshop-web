let currentPage = 1;
const ITEMS_PER_PAGE = 12;
let totalItemsCount = 0;

let currentFilters = {
    diameters: [], widths: [], profiles: [], seasons: [], brands: [],
    sortOrder: 'cheap', searchQuery: null
};

async function initShinyPage() {
    const urlParams = new URLSearchParams(window.location.search);
    
    currentFilters.sortOrder = urlParams.get('sort') || 'cheap';
    currentFilters.searchQuery = urlParams.get('q');
    
    currentFilters.diameters = urlParams.get('dia') ? urlParams.get('dia').split(',') : [];
    currentFilters.widths = urlParams.get('w') ? urlParams.get('w').split(',') : [];
    currentFilters.profiles = urlParams.get('p') ? urlParams.get('p').split(',') : [];
    currentFilters.seasons = urlParams.get('season') ? urlParams.get('season').split(',') : [];
    currentFilters.brands = urlParams.get('brand') ? urlParams.get('brand').split(',') : [];


    const availableFilters = await API.getTireFilters();
    if (availableFilters) {
        renderDynamicFilters(availableFilters);
    }


    const resetBtn = document.getElementById('resetFiltersBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {

            const params = new URLSearchParams();
            if (currentFilters.searchQuery) params.set('q', currentFilters.searchQuery);
            window.location.href = `shiny.html?${params.toString()}`;
        });
    }


    const sortSelect = document.querySelector('.sort-select');
    if (sortSelect) {
        sortSelect.value = currentFilters.sortOrder;
        sortSelect.addEventListener('change', (e) => {
            urlParams.set('sort', e.target.value);
            window.location.search = urlParams.toString();
        });
    }

    const grid = document.querySelector('.catalog-grid');
    if (grid) grid.innerHTML = '';

    await loadCatalogPage(currentPage);
}



function renderDynamicFilters(data) {
    const createCheckboxes = (containerId, items, nameAttr, selectedArr) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = ''; 

        if (items.length === 0) {
            container.innerHTML = '<span class="filter-no-options">Нет доступных вариантов</span>';
            return;
        }

        items.forEach(val => {
            const isChecked = selectedArr.includes(String(val)) ? 'checked' : '';
            const html = `
                <label class="filter-checkbox">
                    <input type="checkbox" name="${nameAttr}" value="${val}" ${isChecked}> 
                    <span>${val}</span>
                </label>
            `;
            container.insertAdjacentHTML('beforeend', html);
        });
    };

    createCheckboxes('filterDiaList', data.diameters, 'dia', currentFilters.diameters);
    createCheckboxes('filterWidthList', data.widths, 'w', currentFilters.widths);
    createCheckboxes('filterProfileList', data.profiles, 'p', currentFilters.profiles);
    createCheckboxes('filterSeasonList', data.seasons, 'season', currentFilters.seasons);
    createCheckboxes('brandList', data.brands, 'brand', currentFilters.brands);



    document.querySelectorAll('details.filter-dropdown').forEach(details => {
        const hasChecked = details.querySelector('input[type="checkbox"]:checked');
        if (hasChecked) {
            details.setAttribute('open', '');
        }
    });

    const showMoreBtn = document.getElementById('showMoreBrandsBtn');
    const brandList = document.getElementById('brandList');
    
    if (showMoreBtn && brandList) {
        if (data.brands.length <= 5) {
            showMoreBtn.classList.add('is-hidden');
            brandList.classList.remove('is-collapsed');
        } else {
            showMoreBtn.classList.remove('is-hidden');
            if (currentFilters.brands.length > 0) {
                brandList.classList.remove('is-collapsed');
                showMoreBtn.textContent = 'Свернуть';
            }
            showMoreBtn.onclick = () => {
                brandList.classList.toggle('is-collapsed');
                showMoreBtn.textContent = brandList.classList.contains('is-collapsed') ? 'Показать все' : 'Свернуть';
            };
        }
    }

    const isAnyChecked = document.querySelectorAll('.catalog-sidebar input[type="checkbox"]:checked').length > 0;
    const filterActions = document.getElementById('filterActions');
    if (filterActions) {
        isAnyChecked ? filterActions.classList.remove('is-hidden') : filterActions.classList.add('is-hidden');
    }

    document.querySelectorAll('.catalog-sidebar input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', applyFiltersInstantly);
    });
}


function applyFiltersInstantly() {
    const params = new URLSearchParams(window.location.search);
    
    const setParam = (name, urlKey) => {
        const values = Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(cb => cb.value);
        if (values.length > 0) params.set(urlKey, values.join(','));
        else params.delete(urlKey);
    };

    setParam('dia', 'dia');
    setParam('w', 'w');
    setParam('p', 'p');
    setParam('season', 'season');
    setParam('brand', 'brand');


    window.location.href = `shiny.html?${params.toString()}`;
}




async function loadCatalogPage(page) {
    currentPage = page;
    const grid = document.querySelector('.catalog-grid');
    if (!grid) return;

    grid.insertAdjacentHTML('beforeend', `<div class="catalog-loading">⏳ Загрузка шин...</div>`);

    if (page > 1) {
        window.scrollTo({ top: document.querySelector('.catalog-layout').offsetTop - 20, behavior: 'smooth' });
    }

    const response = await API.getTires(currentFilters, currentFilters.sortOrder, currentPage, ITEMS_PER_PAGE);
    const tires = response.items;
    totalItemsCount = response.totalCount;

    const countElement = document.querySelector('.catalog-count');
    const h1 = document.querySelector('.catalog-title');
    const breadcrumbs = document.querySelector('.breadcrumbs');

    if (countElement) countElement.textContent = `Найдено ${totalItemsCount} товаров`;
    
    if (currentFilters.searchQuery) {
        if (h1) h1.textContent = `Поиск: «${currentFilters.searchQuery}»`;
        if (breadcrumbs) breadcrumbs.innerHTML = `<a href="shiny.html" class="breadcrumb-link">Шины и диски</a> <span class="breadcrumb-sep">/</span> Поиск`;
    } else {
        if (h1) h1.textContent = `Шины`;
        if (breadcrumbs) breadcrumbs.innerHTML = `Шины и диски <span class="breadcrumb-sep">/</span> Шины`;
    }

    grid.innerHTML = '';
    appendTiresToGrid(tires);
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

function appendTiresToGrid(tires) {
    const grid = document.querySelector('.catalog-grid');
    if (!grid) return;

    if (tires.length === 0 && currentPage === 1) {
        grid.innerHTML = '<p class="catalog-empty">Шины по заданным параметрам не найдены.</p>';
        return;
    }

    tires.forEach(item => {
        let badge = { text: '', color: '', bg: '' };
        if (typeof UI !== 'undefined' && item.condition) badge = UI.getBadgeStyle(item.condition);
        
        const imageUrl = item.images?.[0] || 'trigger-error.jpg'; 
        const stockText = item.in_stock ? 'Есть в наличии' : 'Под заказ';
        const subTitleText = item.manufacturer ? `<div class="product-card__manufacturer">${item.manufacturer}</div>` : '';

        const cardHTML = `
            <a href="product.html?id=${item.id}&type=tire" class="product-card">
                <div class="product-card__img-wrapper">
                    <img src="${imageUrl}" alt="${item.name}" class="product-card__img">
                </div>
                <div class="product-card__info">
                    <div class="product-card__price-row">
                        <span class="product-card__price">${item.price.toLocaleString()} ₽</span>
                        ${badge.text ? `<span class="product-card__badge ${badge.class}">${badge.text}</span>` : ''}
                    </div>
                    ${subTitleText}
                    <h3 class="product-card__title product-card__title--flush">${item.name}</h3>
                    <div class="product-card__stock">На складе: <strong>${stockText}</strong></div>
                </div>
            </a>
        `;
        grid.insertAdjacentHTML('beforeend', cardHTML);
    });
}

document.addEventListener('DOMContentLoaded', initShinyPage);