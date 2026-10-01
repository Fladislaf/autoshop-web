async function initHomePage() {

    const productsContainer = document.getElementById('productsSlider'); 
    
    if (!productsContainer) return;


    const parts = await API.getLatestParts(12);

    if (parts.length === 0) {
        productsContainer.innerHTML = '<p class="tab-empty-msg">Товары скоро появятся...</p>';
        return;
    }


    productsContainer.innerHTML = '';



    parts.forEach(item => {
        const badge = UI.getBadgeStyle(item.condition);
        const imageUrl = (item.images && item.images[0]);
        const availability = item.in_stock ? 'Есть в наличии' : 'Под заказ';

        const cardHTML = `
            <a href="product.html?id=${item.id}" class="product-card">
                <div class="product-card__img-wrapper">
                    <img src="${item.images?.[0] || ''}" alt="${item.name}" class="product-card__img">
                </div>
                <div class="product-card__info">
                    <div class="product-card__price-row">
                        <span class="product-card__price">${item.price.toLocaleString()} ₽</span>
                        <span class="product-card__badge ${badge.class}">${badge.text}</span>
                    </div>
                    <h3 class="product-card__title">${item.name}</h3>
                    <div class="product-card__stock">На складе: <strong>${availability}</strong></div>
                </div>
            </a>
        `;
        productsContainer.insertAdjacentHTML('beforeend', cardHTML);
    });




}



const ui = {
    boxMake: document.getElementById('boxMake'),
    boxModel: document.getElementById('boxModel'),
    boxGen: document.getElementById('boxGen'),
    textMake: document.getElementById('textMake'),
    textModel: document.getElementById('textModel'),
    textGen: document.getElementById('textGen'),
    dropMake: document.getElementById('dropdownMake'),
    dropModel: document.getElementById('dropdownModel'),
    dropGen: document.getElementById('dropdownGen'),
    content: document.getElementById('searchContent'),
    searchInput: document.getElementById('carSearchInput')
};

let state = { 
    makeId: null, makeName: null, 
    modelId: null, modelName: null, 
    genId: null, genName: null 
};

if (ui.content) {


    function renderGrid(items, type) {
        ui.content.innerHTML = '';
        ui.searchInput.value = ''; 

        if (items.length === 0) {
            ui.content.innerHTML = '<div class="ui-loading">Нет данных</div>';
            return;
        }

        items.forEach(item => {
            const div = document.createElement('div');
            div.className = type === 'gen' ? 'search-item search-item-gen' : 'search-item';

            if (type === 'gen') {
                const bodyCode = item.body_codes ? `<small>${item.body_codes}</small>` : '';
                div.innerHTML = `<span>${item.name}</span> ${bodyCode}`;
            } else {
                div.textContent = item.name;
            }

            div.addEventListener('click', () => handleSelection(item, type));
            ui.content.appendChild(div);
        });
    }


    async function handleSelection(item, type) {
        if (type === 'make') {
            state.makeId = item.id;
            state.makeName = item.name;
            state.modelId = null; state.genId = null;

            ui.textMake.textContent = item.name;
            ui.textModel.textContent = 'Выберите модель';
            ui.textGen.textContent = 'Выберите поколение';

            setBoxState(ui.boxMake, 'completed');
            setBoxState(ui.boxModel, 'active');
            setBoxState(ui.boxGen, 'disabled');

            ui.content.innerHTML = '<div class="ui-loading">Загрузка моделей...</div>';
            const models = await API.getModelsByBrand(item.id);
            
            populateDropdown(ui.dropModel, models, 'model');
            renderGrid(models, 'model');
        }
        else if (type === 'model') {
            state.modelId = item.id;
            state.modelName = item.name;
            state.genId = null;

            ui.textModel.textContent = item.name;
            ui.textGen.textContent = 'Выберите поколение';

            setBoxState(ui.boxModel, 'completed');
            setBoxState(ui.boxGen, 'active');

            ui.content.innerHTML = '<div class="ui-loading">Загрузка поколений...</div>';
            const generations = await API.getGenerationsByModel(item.id);

            populateDropdown(ui.dropGen, generations, 'gen');
            renderGrid(generations, 'gen');
        }
        else if (type === 'gen') {
            state.genId = item.id;
            state.genName = item.name;
            ui.textGen.textContent = item.name;
            
            setBoxState(ui.boxGen, 'completed');
            ui.content.innerHTML = `
                <div class="ui-success-msg">
                    Автомобиль выбран: ${state.makeName} ${state.modelName} ${state.genName}. <br>Нажмите "Найти запчасти"!
                </div>`;
        }
    }


    function populateDropdown(container, items, type) {
        container.innerHTML = '';


        const resetItem = document.createElement('div');
        resetItem.className = 'search-dropdown__item search-dropdown__item--reset';
        if (type === 'make') resetItem.textContent = 'Выберите марку';
        if (type === 'model') resetItem.textContent = 'Выберите модель';
        if (type === 'gen') resetItem.textContent = 'Выберите поколение';

        resetItem.addEventListener('click', (e) => {
            e.stopPropagation();
            container.classList.remove('is-open');

            if (type === 'make') document.getElementById('changeMake').click();
            if (type === 'model') document.getElementById('changeModel').click();
            if (type === 'gen') document.getElementById('changeGen').click();
        });

        container.appendChild(resetItem);


        items.forEach(item => {
            const div = document.createElement('div');
            div.className = 'search-dropdown__item';
            div.textContent = item.name; 

            div.addEventListener('click', (e) => {
                e.stopPropagation();
                container.classList.remove('is-open');
                handleSelection(item, type);
            });
            container.appendChild(div);
        });
    }


    function setBoxState(box, stateStr) {
        box.classList.remove('is-active', 'is-disabled', 'is-completed');
        box.classList.add(`is-${stateStr}`);
    }


    function setupDropdownToggle(boxElement, dropdownElement) {
        if (!boxElement || !dropdownElement) return;
        

        const mainArea = boxElement.querySelector('.search-box__main');
        
        mainArea.addEventListener('click', (e) => {
            e.stopPropagation(); 
            

            if (boxElement.classList.contains('is-disabled')) {
                return; 
            }


            document.querySelectorAll('.search-dropdown').forEach(d => {
                if (d !== dropdownElement) d.classList.remove('is-open');
            });
            
            dropdownElement.classList.toggle('is-open');
        });
    }

    setupDropdownToggle(ui.boxMake, ui.dropMake);
    setupDropdownToggle(ui.boxModel, ui.dropModel);
    setupDropdownToggle(ui.boxGen, ui.dropGen);


    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box')) {
            document.querySelectorAll('.search-dropdown').forEach(d => d.classList.remove('is-open'));
        }
    });


    document.getElementById('changeMake').addEventListener('click', async (e) => {
        e.stopPropagation();
        state.makeId = null; state.modelId = null; state.genId = null;
        ui.textMake.textContent = 'Выберите марку';
        ui.textModel.textContent = 'Выберите модель';
        ui.textGen.textContent = 'Выберите поколение';
        setBoxState(ui.boxMake, 'active');
        setBoxState(ui.boxModel, 'disabled');
        setBoxState(ui.boxGen, 'disabled');
        
        initSmartSearch(); 
    });

    document.getElementById('changeModel').addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!state.makeId) return;
        state.modelId = null; state.genId = null;
        ui.textModel.textContent = 'Выберите модель';
        ui.textGen.textContent = 'Выберите поколение';
        setBoxState(ui.boxModel, 'active');
        setBoxState(ui.boxGen, 'disabled');
        
        const models = await API.getModelsByBrand(state.makeId);
        renderGrid(models, 'model');
    });

    document.getElementById('changeGen').addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!state.modelId) return;
        state.genId = null;
        ui.textGen.textContent = 'Выберите поколение';
        setBoxState(ui.boxGen, 'active');
        
        const generations = await API.getGenerationsByModel(state.modelId);
        renderGrid(generations, 'gen');
    });


    ui.searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const items = ui.content.querySelectorAll('.search-item');

        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            text.includes(query) ? item.classList.remove('is-filter-hidden') : item.classList.add('is-filter-hidden'); 
        });
    });


    async function initSmartSearch() {
        ui.content.innerHTML = '<div class="ui-loading">Загрузка марок...</div>';
        const brands = await API.getBrands();
        
        populateDropdown(ui.dropMake, brands, 'make');
        renderGrid(brands, 'make');
    }

    const submitSearchBtn = document.querySelector('.search-controls .search-btn');
    
    if (submitSearchBtn) {
        submitSearchBtn.addEventListener('click', () => {

            const params = new URLSearchParams();


            if (state.makeId) params.append('make', state.makeId);
            if (state.modelId) params.append('model', state.modelId);
            if (state.genId) params.append('gen', state.genId);


            const queryString = params.toString();



            const targetUrl = queryString ? `zapchasti.html?${queryString}` : 'zapchasti.html';


            window.location.href = targetUrl;
        });
    }
    initSmartSearch();
}

document.addEventListener('DOMContentLoaded', initHomePage);