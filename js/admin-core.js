const AdminApp = {

    getStatusSelectClass(status) {
        if (status === 'Выполнен') return 'adm-status-select--completed';
        if (status === 'Отменен') return 'adm-status-select--cancelled';
        if (status === 'Отправлен') return 'adm-status-select--sent';
        if (status === 'Готов к выдаче') return 'adm-status-select--ready';
        return 'adm-status-select--default';
    },

    async init() {

        const isAuthenticated = await API.checkAuth();

        if (!isAuthenticated) {

            document.getElementById('login-screen').classList.remove('is-hidden');
            document.getElementById('admin-layout').classList.add('is-hidden');
            return;
        }


        document.getElementById('login-screen').classList.add('is-hidden');
        document.getElementById('admin-layout').classList.remove('is-hidden');

        this.bindNavigation();
        this.bindMobileMenu();
        this.loadPage('orders');
    },

    async handleLogin(event) {
        event.preventDefault();

        const btn = document.getElementById('login-btn');
        const errorDiv = document.getElementById('login-error');
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-password').value;

        btn.disabled = true;
        btn.textContent = 'Проверка...';
        errorDiv.classList.add('is-hidden');


        const response = await API.login(email, pass);

        if (response.success) {

            document.getElementById('login-email').value = '';
            document.getElementById('login-password').value = '';
            this.init();
        } else {

            errorDiv.classList.remove('is-hidden');
            btn.disabled = false;
            btn.textContent = 'Войти';
        }
    },


    async handleLogout(event) {
        if (event) event.preventDefault();

        if (confirm('Вы точно хотите выйти из панели управления?')) {
            await API.logout();
            window.location.reload();
        }
    },


    bindMobileMenu() {
        const btn = document.getElementById('mobileMenuBtn');
        const sidebar = document.querySelector('.admin-sidebar');
        const overlay = document.getElementById('adminOverlay');

        if (btn && sidebar && overlay) {

            btn.addEventListener('click', () => {
                sidebar.classList.add('is-open');
                overlay.classList.add('is-visible');
            });


            overlay.addEventListener('click', () => {
                sidebar.classList.remove('is-open');
                overlay.classList.remove('is-visible');
            });
        }
    },


    bindNavigation() {
        const links = document.querySelectorAll('.admin-nav__link[data-page]');
        const sidebar = document.querySelector('.admin-sidebar');
        const overlay = document.getElementById('adminOverlay');

        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();

                links.forEach(l => l.classList.remove('is-active'));
                e.target.classList.add('is-active');

                const page = e.target.getAttribute('data-page');
                const title = e.target.textContent.replace(/[^\а-яА-Яa-zA-Z\s]/g, '').trim();
                document.getElementById('admin-page-title').textContent = title;


                if (sidebar.classList.contains('is-open')) {
                    sidebar.classList.remove('is-open');
                    overlay.classList.remove('is-visible');
                }

                this.loadPage(page);
            });
        });
    },




    async loadPage(page) {
        const contentDiv = document.getElementById('admin-content');
        contentDiv.innerHTML = '<div class="adm-loading adm-loading--muted">Загрузка данных...</div>';

        if (page === 'orders') {
            await this.renderOrders();
        } else if (page === 'dicts') {
            await this.renderDicts();
        } else if (page === 'parts') {
            await this.renderParts();
        } else if (page === 'wheels') {
            await this.renderWheels();
        } else if (page === 'guide') {

            this.renderGuide();
        }
    },








    async renderOrders() {
        const contentDiv = document.getElementById('admin-content');
        contentDiv.innerHTML = '<div class="adm-loading">Загрузка заказов...</div>';

        const orders = await API.getOrders();

        AdminApp.currentOrders = orders;

        let html = `
            <div class="admin-card">
                <div class="adm-card-header">
                    <h2 class="adm-title">📦 Управление заказами <span class="adm-count">(${orders.length})</span></h2>
                </div>

                <input type="text" onkeyup="AdminApp.filterTable(this, 'tbody-orders')" placeholder="🔍 Быстрый поиск по ID, имени, телефону, email..." class="adm-search">

                <table class="adm-table">
                    <thead>
                        <tr class="adm-table__head-row">
                            <th class="adm-table__th">ID / Дата</th>
                            <th class="adm-table__th">Клиент / Контакты</th>
                            <th class="adm-table__th">Доставка</th>
                            <th class="adm-table__th">Сумма</th>
                            <th class="adm-table__th">Статус</th>
                            <th class="adm-table__th adm-table__th--center">Действия</th>
                        </tr>
                    </thead>
                    <tbody id="tbody-orders">
                        ${orders.map(order => {
            const date = new Date(order.created_at);
            const dateStr = date.toLocaleDateString('ru-RU') + ', ' + date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
            const shortId = order.id ? order.id.split('-')[0].toUpperCase() : 'Н/Д';

            const clientName = order.customer_name || order.name || order.full_name || '—';
            const clientPhone = order.customer_phone || order.phone || '—';
            const clientEmail = order.customer_email || order.email || 'Нет email';

            const hasComment = order.comment && order.comment !== '—' && order.comment.trim() !== '';
            const commentIcon = hasComment ? `<span title="Есть комментарий (см. Детали)" class="adm-comment-icon">💬</span>` : '';

            let deliveryHtml = order.delivery_type === 'pickup'
                ? `<span class="adm-delivery adm-delivery--pickup">📦 Самовывоз</span>`
                : `<span class="adm-delivery adm-delivery--transport">🚚 Доставка ТК</span>${order.city ? `<br><span class="adm-muted-sm">г. ${order.city}</span>` : ''}`;

            return `
                                <tr class="adm-table__row">
                                    <td class="adm-table__td">
                                        <strong class="adm-id-strong">#${shortId}</strong><br>
                                        <span class="adm-muted-sm">${dateStr}</span>
                                    </td>
                                    <td class="adm-table__td">
                                        <strong>${clientName}</strong>${commentIcon}<br>
                                        ${clientPhone}<br>
                                        <span class="adm-email">${clientEmail}</span>
                                    </td>
                                    <td class="adm-table__td adm-table__td--top">
                                        ${deliveryHtml}
                                    </td>
                                    <td class="adm-table__td"><strong>${(order.total_price || order.total || 0).toLocaleString()} ₽</strong></td>
                                    <td class="adm-table__td">
                                        <select onchange="AdminApp.handleStatusChange('${order.id}', this.value)" class="adm-status-select ${AdminApp.getStatusSelectClass(order.status)}">
                                            <option value="Ожидает" ${order.status === 'Ожидает' ? 'selected' : ''}>⏳ Ожидает</option>
                                            <option value="В обработке" ${order.status === 'В обработке' ? 'selected' : ''}>⚙️ В обработке</option>
                                            <option value="Готов к выдаче" ${order.status === 'Готов к выдаче' ? 'selected' : ''}>🏪 Готов к выдаче</option>
                                            <option value="Отправлен" ${order.status === 'Отправлен' ? 'selected' : ''}>🚚 Отправлен</option>
                                            <option value="Выполнен" ${order.status === 'Выполнен' ? 'selected' : ''}>✅ Выполнен</option>
                                            <option value="Отменен" ${order.status === 'Отменен' ? 'selected' : ''}>❌ Отменен</option>
                                        </select>
                                    </td>
                                    <td class="adm-table__td">
                                        <div class="adm-actions">
                                            <button onclick="AdminApp.showOrderDetails('${order.id}')" class="adm-btn adm-btn--dark">📄 Детали</button>
                                            <button onclick="AdminApp.handleDeleteOrder('${order.id}')" class="adm-btn adm-btn--danger" title="Удалить заказ">✖</button>
                                        </div>
                                    </td>
                                </tr>
                            `;
        }).join('')}
                        ${orders.length === 0 ? '<tr><td colspan="6" class="adm-table__empty">Заказов пока нет</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        `;
        contentDiv.innerHTML = html;
    },


    async handleStatusChange(id, newStatus) {
        const success = await API.updateOrderStatus(id, newStatus);
        if (success) {
            this.renderOrders();
        } else {
            alert('Ошибка при обновлении статуса.');
        }
    },


    async handleDeleteOrder(id) {
        if (!confirm('ВНИМАНИЕ! Вы точно хотите удалить этот заказ? Это действие нельзя отменить.')) return;
        const success = await API.deleteOrder(id);
        if (success) {
            this.renderOrders();
        } else {
            alert('Ошибка при удалении заказа.');
        }
    },








    async showOrderDetails(orderId) {

        const order = AdminApp.currentOrders.find(o => o.id === orderId);
        if (!order) return alert('Ошибка: заказ не найден в памяти!');

        const shortId = order.id.split('-')[0].toUpperCase();

        const oldModal = document.getElementById('order-modal');
        if (oldModal) oldModal.remove();

        const clientName = order.customer_name || order.name || order.full_name || '—';
        const address = order.delivery_address || order.address || '';
        const comment = order.comment || order.notes || 'Нет комментария';


        const modalHtml = `
            <div id="order-modal" class="adm-modal-overlay">
                <div class="adm-modal adm-modal--lg">
                    
                    <div class="adm-modal__header">
                        <h3 class="adm-modal__title">📄 Детали заказа #${shortId}</h3>
                        <button onclick="document.getElementById('order-modal').remove()" class="adm-modal__close">&times;</button>
                    </div>
                    
                    <div class="adm-modal__body">
                        
                        <!-- ВЕРХНИЙ БЛОК: Инфа и Доставка -->
                        <div class="adm-modal__grid-2">
                            <div class="adm-info-box adm-info-box--column">
                                <h4 class="adm-info-box__title">👤 Клиент</h4>
                                <p class="adm-info-box__line"><strong>Имя:</strong> ${clientName}</p>
                                <p class="adm-info-box__line"><strong>Телефон:</strong> ${order.phone || '—'}</p>
                                <p class="adm-info-box__line adm-info-box__line--spaced"><strong>Email:</strong> ${order.email || '—'}</p>

                                <h4 class="adm-info-box__title">💬 Комментарий покупателя</h4>
                                <div class="adm-comment-box">${comment}</div>
                            </div>

                            <div class="adm-info-box">
                                <h4 class="adm-info-box__title">🚚 Доставка</h4>
                                <p class="adm-info-box__line"><strong>Тип:</strong> ${order.delivery_type === 'pickup' ? 'Самовывоз' : 'Транспортная компания'}</p>
                                ${order.city ? `<p class="adm-info-box__line"><strong>Город:</strong> ${order.city}</p>` : ''}
                                ${address ? `<p class="adm-info-box__line"><strong>Адрес:</strong> ${address}</p>` : ''}

                                ${order.delivery_type === 'transport' ? `
                                    <hr class="adm-hr">
                                    <h4 class="adm-info-box__title adm-info-box__title--sm">Трек-номер ТК</h4>
                                    <div class="adm-flex-gap-sm">
                                        <input type="text" id="modal-track-${order.id}" value="${order.tracking_code || ''}" placeholder="Номер для отслеживания" class="adm-input adm-input--flex">
                                        <button onclick="AdminApp.saveTrackingFromModal('${order.id}')" class="adm-btn adm-btn--orange">Сохранить</button>
                                    </div>
                                ` : ''}
                            </div>
                        </div>

                        <!-- НИЖНИЙ БЛОК: Состав заказа (таблица) -->
                        <div>
                            <h4 class="adm-info-box__title">📦 Состав заказа</h4>
                            <div id="order-modal-items">
                                <div class="adm-center-muted">Загрузка товаров...</div>
                            </div>
                        </div>

                    </div>
                    
                    <div class="adm-modal__footer">
                        <button onclick="document.getElementById('order-modal').remove()" class="adm-btn adm-btn--dark">Закрыть</button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);


        const items = await API.getOrderItems(orderId);
        const contentDiv = document.getElementById('order-modal-items');

        if (!items || items.length === 0) {
            contentDiv.innerHTML = '<div class="adm-empty-items">Товары не найдены в БД.</div>';
            return;
        }

        let totalSum = 0;
        let tableHtml = `
            <table class="adm-table">
                <thead>
                    <tr class="adm-table__head-row">
                        <th class="adm-table__th adm-table__th--sm">Наименование товара</th>
                        <th class="adm-table__th adm-table__th--sm adm-table__th--right">Цена</th>
                    </tr>
                </thead>
                <tbody>
        `;

        items.forEach(item => {
            const price = item.price || item.unit_price || 0;
            totalSum += price;
            const name = item.product_name || item.name || item.title || ('Товар (ID: ' + (item.product_id || item.part_id || item.id) + ')');

            let productLink = '#';
            if (item.part_id) productLink = `product.html?id=${item.part_id}`;
            else if (item.tire_id) productLink = `product.html?id=${item.tire_id}&type=tire`;
            else if (item.wheel_id) productLink = `product.html?id=${item.wheel_id}&type=wheel`;

            const itemSku = item.sku || item.parts?.sku || item.tires?.sku || item.wheels?.sku || 'Без артикула';
            const nameDisplay = productLink !== '#'
                ? `<a href="${productLink}" target="_blank" class="adm-link">${name} 🔗</a>`
                : `<strong>${name}</strong>`;

            tableHtml += `
                <tr class="adm-table__row">
                    <td class="adm-table__td adm-table__td--sm">
                        <div class="adm-mb-xs">${nameDisplay}</div>
                        <span class="adm-sku-tag">SKU: ${itemSku}</span>
                    </td>
                    <td class="adm-table__td adm-table__td--right">${price.toLocaleString()} ₽</td>
                </tr>
            `;
        });

        tableHtml += `
                </tbody>
            </table>
            <div class="adm-total-row">
                Итого к оплате: <strong class="adm-total-sum">${totalSum.toLocaleString()} ₽</strong>
            </div>
        `;

        contentDiv.innerHTML = tableHtml;
    },


    async saveTrackingFromModal(orderId) {
        const input = document.getElementById(`modal-track-${orderId}`);
        const trackingCode = input.value.trim();
        const btn = input.nextElementSibling;

        const oldText = btn.textContent;
        btn.disabled = true;
        btn.textContent = '⏳';

        const success = await API.updateOrderTracking(orderId, trackingCode);

        btn.disabled = false;
        btn.textContent = oldText;

        if (success) {

            const order = AdminApp.currentOrders.find(o => o.id === orderId);
            if (order) order.tracking_code = trackingCode;

            input.classList.add('is-saved');
            setTimeout(() => {
                input.classList.remove('is-saved');
            }, 1500);
        } else {
            alert('Ошибка при сохранении трек-номера.');
        }
    },


    async changeOrderStatus(orderId, newStatus) {
        const success = await API.updateOrderStatus(orderId, newStatus);
        if (success) {
            alert('Статус заказа успешно обновлен!');
        } else {
            alert('Ошибка при обновлении статуса.');
            this.loadPage('orders');
        }
    },




    async renderDicts() {
        const contentDiv = document.getElementById('admin-content');
        contentDiv.innerHTML = '<div class="adm-loading">Загрузка справочников...</div>';

        try {

            const [categories, brands, models, gens, engines] = await Promise.all([
                API.getCategories(),
                API.getBrands(),
                API.getAllModels(),
                API.getAllGenerations(),
                API.getAllEngines()
            ]);

            let html = `<div class="adm-stack adm-stack--20">`;


            html += this.buildDictCard('Категории запчастей', 'cat', categories,
                ['Название', 'Действия'],
                (c) => `<td class="adm-table__td"><strong>${c.name}</strong></td>
                        <td class="adm-table__td"><button onclick="AdminApp.handleDeleteCategory('${c.id}')" class="adm-btn-text adm-btn-text--danger">🗑️ Удал.</button></td>`
            );

            html += this.buildDictCard('Марки авто', 'brand', brands,
                ['Название', 'Действия'],
                (b) => `<td class="adm-table__td"><strong>${b.name}</strong></td>
                        <td class="adm-table__td"><button onclick="AdminApp.handleDeleteBrand('${b.id}')" class="adm-btn-text adm-btn-text--danger">🗑️ Удал.</button></td>`
            );

            html += this.buildDictCard('Модели авто', 'model', models,
                ['Модель', 'Привязка к Марке', 'Действия'],
                (m) => `<td class="adm-table__td"><strong>${m.name}</strong></td>
                        <td class="adm-table__td">${m.brands?.name || '—'}</td>
                        <td class="adm-table__td"><button onclick="AdminApp.handleDeleteModel('${m.id}')" class="adm-btn-text adm-btn-text--danger">🗑️ Удал.</button></td>`
            );

            html += this.buildDictCard('Поколения', 'gen', gens,
                ['Поколение (Годы)', 'Привязка к Модели', 'Действия'],
                (g) => `<td class="adm-table__td"><strong>${g.name}</strong> <span class="adm-muted-sm">(${g.years || ''})</span></td>
                        <td class="adm-table__td">${g.models?.brands?.name || ''} ${g.models?.name || '—'}</td>
                        <td class="adm-table__td"><button onclick="AdminApp.handleDeleteGen('${g.id}')" class="adm-btn-text adm-btn-text--danger">🗑️ Удал.</button></td>`
            );

            html += this.buildDictCard('Двигатели', 'engine', engines,
                ['Двигатель', 'Объем / Топливо', 'Действия'],
                (e) => `<td class="adm-table__td"><strong>${e.name}</strong></td>
                        <td class="adm-table__td">${e.volume ? e.volume + ' л.' : '—'} / ${e.fuel_type || '—'}</td>
                        <td class="adm-table__td"><button onclick="AdminApp.handleDeleteEngine('${e.id}')" class="adm-btn-text adm-btn-text--danger">🗑️ Удал.</button></td>`
            );

            html += `</div>`;
            contentDiv.innerHTML = html;
        } catch (error) {
            console.error(error);
            contentDiv.innerHTML = '<div class="adm-loading adm-loading--error">Ошибка загрузки справочников.</div>';
        }
    },




    buildDictCard(title, idPrefix, dataArray, columns, rowRenderer) {
        return `
            <div class="admin-card">
                <div class="adm-card-header adm-card-header--bordered">
                    <div class="adm-section-toggle" onclick="AdminApp.toggleSection('${idPrefix}-container', '${idPrefix}-arrow')">
                        <span id="${idPrefix}-arrow" class="adm-section-arrow">▼</span>
                        <h2 class="adm-modal__title">${title} <span class="adm-count">(${dataArray.length})</span></h2>
                    </div>
                    <button onclick="AdminApp.showDictModal('${idPrefix}')" class="adm-btn adm-btn--green">+ Добавить</button>
                </div>
                
                <div id="${idPrefix}-container" class="adm-section-body">
                    <input type="text" onkeyup="AdminApp.filterTable(this, 'tbody-${idPrefix}')" placeholder="🔍 Быстрый поиск..." class="adm-search">
                    
                    <table class="adm-table">
                        <thead>
                            <tr class="adm-table__head-row">
                                ${columns.map(c => `<th class="adm-table__th">${c}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody id="tbody-${idPrefix}">
                            ${dataArray.map(item => `<tr class="adm-table__row">${rowRenderer(item)}</tr>`).join('')}
                            ${dataArray.length === 0 ? `<tr><td colspan="${columns.length}" class="adm-table__empty adm-table__empty--sm">Нет данных</td></tr>` : ''}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    },


    filterTable(input, tbodyId) {
        const filter = input.value.toLowerCase();
        const tbody = document.getElementById(tbodyId);
        const rows = tbody.getElementsByTagName('tr');

        for (let i = 0; i < rows.length; i++) {
            const text = rows[i].textContent.toLowerCase();

            if (text.indexOf(filter) > -1) {
                rows[i].classList.remove('is-filter-hidden');
            } else {
                rows[i].classList.add('is-filter-hidden');
            }
        }
    },


    async showDictModal(type) {

        const oldModal = document.getElementById('dict-modal');
        if (oldModal) oldModal.remove();


        const modalHtml = `
            <div id="dict-modal" class="adm-modal-overlay adm-modal-overlay--light">
                <div class="adm-modal adm-modal--sm adm-modal--padded">
                    <div class="adm-card-header">
                        <h3 id="dict-modal-title" class="adm-modal__title">Добавление</h3>
                        <button onclick="document.getElementById('dict-modal').remove()" class="adm-modal__close">&times;</button>
                    </div>
                    <form id="dict-modal-form" onsubmit="AdminApp.handleDictSubmit(event, '${type}')" class="adm-form-col">
                        <div id="dict-modal-content">Загрузка полей...</div>
                        
                        <div class="adm-form-actions">
                            <button type="button" onclick="document.getElementById('dict-modal').remove()" class="adm-btn adm-btn--cancel">Отмена</button>
                            <button type="submit" id="dict-btn-save" class="adm-btn adm-btn--green">Сохранить в базу</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        const contentDiv = document.getElementById('dict-modal-content');
        const titleEl = document.getElementById('dict-modal-title');


        if (type === 'cat') {
            titleEl.textContent = 'Новая категория';
            contentDiv.innerHTML = `
                <label class="adm-label-bold">Название категории *</label>
                <input type="text" id="dict-name" required placeholder="Например: Трансмиссия" class="adm-input adm-input--full">
            `;
        } else if (type === 'brand') {
            titleEl.textContent = 'Новая марка авто';
            contentDiv.innerHTML = `
                <label class="adm-label-bold">Название марки *</label>
                <input type="text" id="dict-name" required placeholder="Например: Toyota" class="adm-input adm-input--full">
            `;
        } else if (type === 'model') {
            titleEl.textContent = 'Новая модель';
            const brands = await API.getBrands();
            contentDiv.innerHTML = `
                <label class="adm-label-bold">Выберите марку *</label>
                <select id="dict-parent-id" required class="adm-input adm-input--full adm-input--mb">
                    <option value="">-- Марка --</option>
                    ${brands.map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
                </select>
                <label class="adm-label-bold">Название модели *</label>
                <input type="text" id="dict-name" required placeholder="Например: Camry" class="adm-input adm-input--full">
            `;
        } else if (type === 'gen') {
            titleEl.textContent = 'Новое поколение';
            const brands = await API.getBrands();
            contentDiv.innerHTML = `
                <label class="adm-label-bold">Марка *</label>
                <select onchange="AdminApp.loadModalModels(this.value)" required class="adm-input adm-input--full adm-input--mb">
                    <option value="">-- Выберите марку --</option>
                    ${brands.map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
                </select>
                <label class="adm-label-bold">Модель *</label>
                <select id="dict-parent-id" disabled required class="adm-input adm-input--full adm-input--mb is-disabled">
                    <option value="">Сначала выберите марку</option>
                </select>
                <label class="adm-label-bold">Поколение (Название/Кузов) *</label>
                <input type="text" id="dict-name" required placeholder="Например: XV40" class="adm-input adm-input--full adm-input--mb">
                <label class="adm-label-bold">Годы выпуска (опционально)</label>
                <input type="text" id="dict-years" placeholder="Например: 2006-2011" class="adm-input adm-input--full">
            `;
        } else if (type === 'engine') {
            titleEl.textContent = 'Новый двигатель';
            contentDiv.innerHTML = `
                <label class="adm-label-bold">Маркировка двигателя *</label>
                <input type="text" id="dict-name" required placeholder="Например: 2GR-FE" class="adm-input adm-input--full adm-input--mb">
                <div class="adm-flex-gap">
                    <div class="adm-flex-1">
                        <label class="adm-label-bold">Объем (л) *</label>
                        <input type="number" step="0.1" id="dict-vol" required placeholder="Напр: 3.5" class="adm-input adm-input--full">
                    </div>
                    <div class="adm-flex-1">
                        <label class="adm-label-bold">Топливо</label>
                        <select id="dict-fuel" class="adm-input adm-input--full">
                            <option value="Бензин">Бензин</option>
                            <option value="Дизель">Дизель</option>
                            <option value="Гибрид">Гибрид</option>
                            <option value="Электро">Электро</option>
                        </select>
                    </div>
                </div>
            `;
        }
    },


    async loadModalModels(brandId) {
        const select = document.getElementById('dict-parent-id');
        if (!brandId) {
            select.innerHTML = '<option value="">Сначала выберите марку</option>';
            select.disabled = true; select.classList.add('is-disabled');
            return;
        }
        select.innerHTML = '<option value="">Загрузка моделей...</option>';
        const models = await API.getModelsByBrand(brandId);
        select.innerHTML = '<option value="">-- Выберите модель --</option>' + models.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
        select.disabled = false; select.classList.remove('is-disabled');
    },


    async handleDictSubmit(event, type) {
        event.preventDefault();
        const btn = document.getElementById('dict-btn-save');
        btn.disabled = true; btn.textContent = 'Сохранение...';

        try {
            const name = document.getElementById('dict-name')?.value.trim();
            let success = false;

            if (type === 'cat') {
                success = await API.addCategory(name);
            } else if (type === 'brand') {
                success = await API.addBrand(name);
            } else if (type === 'model') {
                const brandId = document.getElementById('dict-parent-id').value;
                success = await API.addModelToDb({ name: name, brand_id: brandId });
            } else if (type === 'gen') {
                const modelId = document.getElementById('dict-parent-id').value;
                const years = document.getElementById('dict-years').value.trim() || null;
                success = await API.addGenerationToDb({ name: name, model_id: modelId, years: years });
            } else if (type === 'engine') {
                const volume = parseFloat(document.getElementById('dict-vol').value) || null;
                const fuel = document.getElementById('dict-fuel').value;
                success = await API.addEngineToDb({ name: name, volume: volume, fuel_type: fuel });
            }

            if (success) {
                document.getElementById('dict-modal').remove();
                this.renderDicts();
            } else {
                throw new Error('Ошибка записи в БД');
            }
        } catch (err) {
            console.error(err);
            alert('Произошла ошибка при сохранении!');
            btn.disabled = false; btn.textContent = 'Сохранить в базу';
        }
    },


    async handleDeleteCategory(id) { if (confirm('Точно удалить категорию?')) { await API.deleteCategory(id); this.renderDicts(); } },
    async handleDeleteBrand(id) { if (confirm('Точно удалить марку?')) { await API.deleteBrand(id); this.renderDicts(); } },
    async handleDeleteModel(id) { if (confirm('Точно удалить модель?')) { await API.deleteModel(id); this.renderDicts(); } },
    async handleDeleteGen(id) { if (confirm('Точно удалить поколение?')) { await API.deleteGeneration(id); this.renderDicts(); } },
    async handleDeleteEngine(id) { if (confirm('Точно удалить двигатель?')) { await API.deleteEngine(id); this.renderDicts(); } },




    async renderParts() {
        const contentDiv = document.getElementById('admin-content');
        const parts = await API.getPartsList();

        let html = `
            <div class="admin-card">
                <div class="adm-card-header">
                    <h2 class="adm-title">Список запчастей</h2>
                    <button onclick="AdminApp.showAddPartForm()" class="adm-btn adm-btn--primary">+ Добавить запчасть</button>
                </div>

                <input type="text" onkeyup="AdminApp.filterTable(this, 'tbody-parts')" placeholder="🔍 Быстрый поиск по названию, артикулу, категории..." class="adm-search">
                <table class="adm-table">
                    <thead>
                        <tr class="adm-table__head-row">
                            <th class="adm-table__th">Артикул / Название</th>
                            <th class="adm-table__th">Категория</th>
                            <th class="adm-table__th">Цена</th>
                            <th class="adm-table__th">Наличие</th>
                            <th class="adm-table__th">Действия</th>
                        </tr>
                    </thead>
                    <tbody id="tbody-parts">
                        ${parts.map(part => `
                            <tr class="adm-table__row">
                                <td class="adm-table__td">
                                    <strong>${part.sku || '—'}</strong><br>
                                    ${part.name}
                                </td>
                                <td class="adm-table__td">${part.categories?.name || 'Без категории'}</td>
                                <td class="adm-table__td"><strong>${part.price.toLocaleString()} ₽</strong></td>
                                <td class="adm-table__td">
                                    ${part.in_stock ? '<span class="adm-stock adm-stock--yes">● В наличии</span>' : '<span class="adm-stock adm-stock--no">● Нет в наличии</span>'}
                                </td>
                                <td class="adm-table__td">
                                    <button onclick="AdminApp.showEditPartForm('${part.id}')" class="adm-btn-text adm-btn-text--edit">✏️ Изменить</button>
                                    <button onclick="AdminApp.handleDeletePart('${part.id}')" class="adm-btn-text adm-btn-text--danger">🗑️ Удалить</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        contentDiv.innerHTML = html;
    },

    async handleDeletePart(id) {
        if (!confirm('Вы уверены, что хотите удалить этот товар?')) return;
        const success = await API.deletePart(id);
        if (success) this.renderParts();
        else alert('Ошибка при удалении товара.');
    },




    applicabilityRows: 0,

    async showAddPartForm() {
        const contentDiv = document.getElementById('admin-content');
        contentDiv.innerHTML = '<div class="adm-loading">Загрузка формы...</div>';

        const categories = await API.getCategories();
        this.applicabilityRows = 0;

        let html = `
            <div class="admin-card">
                <div class="adm-card-header">
                    <h2 class="adm-title">Добавление новой запчасти</h2>
                    <button onclick="AdminApp.renderParts()" class="adm-btn adm-btn--gray">← Назад к списку</button>
                </div>

                <form id="add-part-form" onsubmit="AdminApp.handlePartSubmit(event)" class="adm-form-grid">
                    
                    <div>
                        <h3 class="adm-form-section-title">Основная информация</h3>
                        
                        <div class="adm-field">
                            <label class="adm-label">Название детали *</label>
                            <input type="text" id="part-name" required class="adm-input">
                        </div>

                        <div class="adm-flex-row adm-flex-row--mb">
                            <div class="adm-flex-1">
                                <label class="adm-label">Цена (₽) *</label>
                                <input type="number" id="part-price" required class="adm-input">
                            </div>
                            <div class="adm-flex-1">
                                <label class="adm-label">Состояние *</label>
                                <select id="part-condition" required class="adm-input">
                                    <option value="contract">Контрактная</option>
                                    <option value="used">Б/У</option>
                                    <option value="new">Новая</option>
                                </select>
                            </div>
                        </div>

                        <div class="adm-flex-row adm-flex-row--mb">
                            <div class="adm-flex-1">
                                <label class="adm-label">Категория *</label>
                                <select id="part-category" required class="adm-input">
                                    <option value="">-- Выберите --</option>
                                    ${categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
                                </select>
                            </div>
                            <div class="adm-flex-1">
                                <label class="adm-label">Артикул (SKU)</label>
                                <input type="text" id="part-sku" class="adm-input">
                            </div>
                        </div>

                        <div class="adm-flex-row adm-flex-row--mb">
                            <div class="adm-flex-1">
                                <label class="adm-label">Производитель</label>
                                <input type="text" id="part-manufacturer" placeholder="Например: Toyota" class="adm-input">
                            </div>
                            <div class="adm-flex-1">
                                <label class="adm-label">OEM Номер</label>
                                <input type="text" id="part-oem" class="adm-input">
                            </div>
                            <div class="adm-flex-1">
                                <label class="adm-label">Год (детали)</label>
                                <input type="number" id="part-year" placeholder="YYYY" class="adm-input">
                            </div>
                        </div>

                        <div class="adm-field">
                            <label class="adm-label">Кол-во в комплекте (лот)</label>
                            <input type="number" id="part-pieces" value="1" min="1" class="adm-input adm-input--narrow">
                        </div>

                        <div class="adm-field">
                            <label class="adm-label">Фотографии</label>
                            <input type="file" id="part-images-input" multiple accept="image/*" class="adm-input adm-input--file">
                            <small class="adm-hint">Вы можете выделить сразу несколько фотографий.</small>
                        </div>

                        <div class="adm-field">
                            <label class="adm-label">Описание</label>
                            <textarea id="part-desc" rows="4" class="adm-input"></textarea>
                        </div>
                        
                        <div class="adm-field">
                            <label class="adm-checkbox-label">
                                <input type="checkbox" id="part-instock" checked class="adm-checkbox">
                                Товар есть в наличии на складе
                            </label>
                        </div>
                    </div>

                    <div>
                        <h3 class="adm-form-section-title">Применимость к авто</h3>
                        <p class="adm-hint adm-hint--block">Добавьте один или несколько автомобилей, к которым подходит эта деталь.</p>
                        
                        <div id="applicability-container"></div>
                        
                        <button type="button" onclick="AdminApp.addCarRow()" class="adm-btn-add-car">+ Добавить еще один автомобиль</button>
                    </div>

                    <div class="adm-form-footer">
                        <button type="submit" id="btn-save-part" class="adm-btn adm-btn--green adm-btn--lg">Сохранить деталь в базу</button>
                    </div>

                </form>
            </div>
        `;
        contentDiv.innerHTML = html;
        this.addCarRow();
    },


    async addCarRow() {
        const container = document.getElementById('applicability-container');
        const rowId = this.applicabilityRows++;
        const brands = await API.getBrands();

        const rowHtml = `
            <div class="car-row" id="row-${rowId}" class="car-row">
                <button type="button" onclick="this.parentElement.remove()" class="car-row__remove">✕</button>
                
                <div class="adm-grid-2 adm-grid-2--mb">
                    <div>
                        <label class="adm-label adm-label--sm">Марка *</label>
                        <select onchange="AdminApp.loadRowModels(${rowId}, this.value)" class="row-make" required class="adm-input adm-input--sm">
                            <option value="">-- Выберите --</option>
                            ${brands.map(b => `<option value="${b.id}">${b.name}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="adm-label adm-label--sm">Модель *</label>
                        <select onchange="AdminApp.loadRowGens(${rowId}, this.value)" class="row-model" disabled required class="adm-input adm-input--sm adm-input--disabled">
                            <option value="">Сначала выберите марку</option>
                        </select>
                    </div>
                </div>

                <div class="adm-grid-2">
                    <div>
                        <label class="adm-label adm-label--sm">Поколение *</label>
                        <select onchange="AdminApp.loadRowEngines(${rowId}, this.value)" class="row-gen" disabled required class="adm-input adm-input--sm adm-input--disabled">
                            <option value="">Сначала выберите модель</option>
                        </select>
                    </div>
                    <div>
                        <label class="adm-label adm-label--sm">Двигатель (опц.)</label>
                        <select class="row-engine" disabled class="adm-input adm-input--sm adm-input--disabled">
                            <option value="">Сначала выберите поколение</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', rowHtml);
    },


    async loadRowModels(rowId, makeId) {
        const row = document.getElementById(`row-${rowId}`);
        const modelSelect = row.querySelector('.row-model');
        const genSelect = row.querySelector('.row-gen');
        const engineSelect = row.querySelector('.row-engine');

        genSelect.innerHTML = '<option value="">Сначала выберите модель</option>'; genSelect.disabled = true; genSelect.classList.add('is-disabled');
        engineSelect.innerHTML = '<option value="">Сначала выберите поколение</option>'; engineSelect.disabled = true; engineSelect.classList.add('is-disabled');

        if (!makeId) {
            modelSelect.innerHTML = '<option value="">Сначала выберите марку</option>';
            modelSelect.disabled = true;
            modelSelect.classList.add('is-disabled');
            return;
        }

        modelSelect.innerHTML = '<option value="">Загрузка...</option>';
        const models = await API.getModelsByBrand(makeId);
        modelSelect.innerHTML = '<option value="">-- Выберите модель --</option>' + models.map(m => `<option value="${m.id}">${m.name}</option>`).join('');
        modelSelect.disabled = false;
        modelSelect.classList.remove('is-disabled');
    },


    async loadRowGens(rowId, modelId) {
        const row = document.getElementById(`row-${rowId}`);
        const genSelect = row.querySelector('.row-gen');
        const engineSelect = row.querySelector('.row-engine');

        engineSelect.innerHTML = '<option value="">Сначала выберите поколение</option>'; engineSelect.disabled = true; engineSelect.classList.add('is-disabled');

        if (!modelId) {
            genSelect.innerHTML = '<option value="">Сначала выберите модель</option>';
            genSelect.disabled = true;
            genSelect.classList.add('is-disabled');
            return;
        }

        genSelect.innerHTML = '<option value="">Загрузка...</option>';
        const gens = await API.getGenerationsByModel(modelId);
        genSelect.innerHTML = '<option value="">-- Выберите поколение --</option>' + gens.map(g => `<option value="${g.id}">${g.name} (${g.years || ''})</option>`).join('');
        genSelect.disabled = false;
        genSelect.classList.remove('is-disabled');
    },


    async loadRowEngines(rowId, genId) {
        const row = document.getElementById(`row-${rowId}`);
        const engineSelect = row.querySelector('.row-engine');

        if (!genId) {
            engineSelect.innerHTML = '<option value="">Сначала выберите поколение</option>';
            engineSelect.disabled = true;
            engineSelect.classList.add('is-disabled');
            return;
        }

        engineSelect.innerHTML = '<option value="">Загрузка...</option>';
        const engines = await API.getEnginesByGen(genId);
        engineSelect.innerHTML = '<option value="">-- Любой двигатель --</option>' + engines.map(e => `<option value="${e.id}">${e.name}</option>`).join('');
        engineSelect.disabled = false;
        engineSelect.classList.remove('is-disabled');
    },


    async handlePartSubmit(event) {
        event.preventDefault();
        const form = event.target;
        const btn = document.getElementById('btn-save-part');
        btn.disabled = true;
        btn.textContent = 'Сохранение...';

        try {

            const imageFiles = document.getElementById('part-images-input').files;
            const imageUrls = [];
            if (imageFiles.length > 0 && typeof API.uploadImage === 'function') {
                for (const file of imageFiles) {
                    const url = await API.uploadImage(file);
                    if (url) imageUrls.push(url);
                }
            }


            const partData = {
                name: document.getElementById('part-name').value.trim(),
                price: parseInt(document.getElementById('part-price').value),
                condition: document.getElementById('part-condition').value,
                category_id: document.getElementById('part-category').value,
                sku: document.getElementById('part-sku').value.trim() || null,
                description: document.getElementById('part-desc').value.trim() || null,
                in_stock: document.getElementById('part-instock').checked,
                manufacturer: document.getElementById('part-manufacturer').value.trim() || null,
                oem_number: document.getElementById('part-oem').value.trim() || null,
                manufacture_year: parseInt(document.getElementById('part-year').value) || null,
                pieces_in_set: parseInt(document.getElementById('part-pieces').value) || 1,
                images: imageUrls.length > 0 ? imageUrls : null
            };


            const newPart = await API.addPart(partData);

            if (newPart) {

                const rows = [];
                document.querySelectorAll('.car-row').forEach(row => {
                    const genId = row.querySelector('.row-gen').value;
                    const engineId = row.querySelector('.row-engine').value;


                    if (genId) {
                        rows.push({
                            genId: genId,
                            engineId: engineId || null
                        });
                    }
                });


                if (rows.length > 0 && typeof API.addMultipleApplicabilities === 'function') {
                    await API.addMultipleApplicabilities(newPart.id, rows);
                }

                alert('Запчасть успешно сохранена!');
                this.renderParts();
            } else {
                throw new Error('Ошибка создания записи в БД.');
            }
        } catch (error) {
            console.error(error);
            alert('Произошла ошибка при сохранении товара.');
            btn.disabled = false;
            btn.textContent = 'Сохранить деталь в базу';
        }
    },




    async showEditPartForm(partId) {
        const contentDiv = document.getElementById('admin-content');
        contentDiv.innerHTML = '<div class="adm-loading">Загрузка данных товара...</div>';


        const part = await API.getPartById(partId);
        if (!part) return alert('Ошибка: не удалось загрузить данные товара!');

        const categories = await API.getCategories();
        this.applicabilityRows = 0;

        let html = `
            <div class="admin-card">
                <div class="adm-card-header">
                    <h2 class="adm-title">✏️ Редактирование запчасти</h2>
                    <button onclick="AdminApp.renderParts()" class="adm-btn adm-btn--gray">← Назад к списку</button>
                </div>

                <form id="edit-part-form" onsubmit="AdminApp.handleEditPartSubmit(event, '${part.id}')" class="adm-form-grid">
                    
                    <div>
                        <div class="adm-field">
                            <label class="adm-label-bold">Название детали *</label>
                            <input type="text" id="edit-part-name" value="${part.name}" required class="adm-input">
                        </div>

                        <div class="adm-flex-row adm-flex-row--mb">
                            <div class="adm-flex-1">
                                <label class="adm-label-bold">Цена (₽) *</label>
                                <input type="number" id="edit-part-price" value="${part.price}" required class="adm-input">
                            </div>
                            <div class="adm-flex-1">
                                <label class="adm-label-bold">Состояние *</label>
                                <select id="edit-part-condition" required class="adm-input">
                                    <option value="contract" ${part.condition === 'contract' ? 'selected' : ''}>Контрактная</option>
                                    <option value="used" ${part.condition === 'used' ? 'selected' : ''}>Б/У</option>
                                    <option value="new" ${part.condition === 'new' ? 'selected' : ''}>Новая</option>
                                </select>
                            </div>
                        </div>

                        <div class="adm-flex-row adm-flex-row--mb">
                            <div class="adm-flex-1">
                                <label class="adm-label-bold">Категория *</label>
                                <select id="edit-part-category" required class="adm-input">
                                    ${categories.map(c => `<option value="${c.id}" ${part.category_id === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                                </select>
                            </div>
                            <div class="adm-flex-1">
                                <label class="adm-label-bold">Артикул (SKU)</label>
                                <input type="text" id="edit-part-sku" value="${part.sku || ''}" class="adm-input">
                            </div>
                        </div>

                        <div class="adm-flex-row adm-flex-row--mb">
                            <div class="adm-flex-1">
                                <label class="adm-label-bold">Производитель</label>
                                <input type="text" id="edit-part-manuf" value="${part.manufacturer || ''}" class="adm-input">
                            </div>
                            <div class="adm-flex-1">
                                <label class="adm-label-bold">OEM Номер</label>
                                <input type="text" id="edit-part-oem" value="${part.oem_number || ''}" class="adm-input">
                            </div>
                            <div class="adm-flex-1">
                                <label class="adm-label-bold">Год</label>
                                <input type="number" id="edit-part-year" value="${part.manufacture_year || ''}" class="adm-input">
                            </div>
                        </div>

                        <div class="adm-field">
                            <label class="adm-label-bold">Кол-во в комплекте (лот)</label>
                            <input type="number" id="edit-part-pieces" value="${part.pieces_in_set || 1}" min="1" class="adm-input adm-input--narrow">
                        </div>

                        <div class="adm-field">
                            <label class="adm-label-bold">Обновить фотографии</label>
                            <input type="file" id="edit-part-images" multiple accept="image/*" class="adm-input adm-input--file">
                            <small class="adm-delivery adm-delivery--transport">Внимание: Если вы выберете новые фото, они полностью заменят старые. Если оставить пустым — старые сохранятся.</small>
                            ${part.images && part.images.length > 0 ? `<div class="adm-hint adm-hint--mt">Текущих фото: ${part.images.length} шт.</div>` : ''}
                        </div>

                        <div class="adm-field">
                            <label class="adm-label-bold">Описание</label>
                            <textarea id="edit-part-desc" rows="4" class="adm-input">${part.description || ''}</textarea>
                        </div>
                        
                        <div class="adm-field">
                            <label class="adm-checkbox-label">
                                <input type="checkbox" id="edit-part-instock" ${part.in_stock ? 'checked' : ''} class="adm-checkbox">
                                Товар есть в наличии на складе
                            </label>
                        </div>
                    </div>

                    <div>
                        <h3 class="adm-form-section-title">Применимость к авто</h3>
                        <div id="applicability-container"></div>
                        <button type="button" onclick="AdminApp.addCarRow()" class="adm-btn-add-car">+ Добавить еще один автомобиль</button>
                    </div>

                    <div class="adm-form-footer">
                        <button type="submit" id="btn-update-part" class="adm-btn adm-btn--orange adm-btn--lg">💾 Сохранить изменения</button>
                    </div>
                </form>
            </div>
        `;
        contentDiv.innerHTML = html;


        if (part.part_applicability && part.part_applicability.length > 0) {
            for (const app of part.part_applicability) {
                const brandId = app.generations?.models?.brand_id;
                const modelId = app.generations?.model_id;
                const genId = app.generation_id;
                const engineId = app.engine_id;
                await this.addPreFilledCarRow(brandId, modelId, genId, engineId);
            }
        } else {
            this.addCarRow();
        }
    },


    async addPreFilledCarRow(brandId, modelId, genId, engineId) {
        const container = document.getElementById('applicability-container');
        const rowId = this.applicabilityRows++;

        const brands = await API.getBrands();
        const models = brandId ? await API.getModelsByBrand(brandId) : [];
        const gens = modelId ? await API.getGenerationsByModel(modelId) : [];
        const engines = genId ? await API.getEnginesByGen(genId) : [];

        const rowHtml = `
            <div class="car-row" id="row-${rowId}" class="car-row car-row--white">
                <button type="button" onclick="this.parentElement.remove()" class="car-row__remove car-row__remove--lower">✕</button>
                
                <div class="adm-grid-2 adm-grid-2--mb">
                    <div>
                        <label class="adm-label adm-label--sm">Марка *</label>
                        <select onchange="AdminApp.loadRowModels(${rowId}, this.value)" class="row-make" required class="adm-input adm-input--sm">
                            <option value="">-- Выберите --</option>
                            ${brands.map(b => `<option value="${b.id}" ${b.id === brandId ? 'selected' : ''}>${b.name}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="adm-label adm-label--sm">Модель *</label>
                        <select onchange="AdminApp.loadRowGens(${rowId}, this.value)" class="row-model" required class="adm-input adm-input--sm">
                            <option value="">-- Выберите --</option>
                            ${models.map(m => `<option value="${m.id}" ${m.id === modelId ? 'selected' : ''}>${m.name}</option>`).join('')}
                        </select>
                    </div>
                </div>

                <div class="adm-grid-2">
                    <div>
                        <label class="adm-label adm-label--sm">Поколение *</label>
                        <select onchange="AdminApp.loadRowEngines(${rowId}, this.value)" class="row-gen" required class="adm-input adm-input--sm">
                            <option value="">-- Выберите --</option>
                            ${gens.map(g => `<option value="${g.id}" ${g.id === genId ? 'selected' : ''}>${g.name}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label class="adm-label adm-label--sm">Двигатель (опц.)</label>
                        <select class="row-engine" class="adm-input adm-input--sm">
                            <option value="">-- Любой --</option>
                            ${engines.map(e => `<option value="${e.id}" ${e.id === engineId ? 'selected' : ''}>${e.name}</option>`).join('')}
                        </select>
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', rowHtml);
    },


    async handleEditPartSubmit(event, partId) {
        event.preventDefault();
        const btn = document.getElementById('btn-update-part');
        btn.disabled = true;
        btn.textContent = 'Сохранение...';

        try {

            const imageFiles = document.getElementById('edit-part-images').files;
            let finalImages = null;

            if (imageFiles.length > 0) {
                const newImageUrls = [];
                for (const file of imageFiles) {
                    const url = await API.uploadImage(file);
                    if (url) newImageUrls.push(url);
                }
                finalImages = newImageUrls;
            } else {

                const oldPart = await API.getPartById(partId);
                finalImages = oldPart.images;
            }


            const partData = {
                name: document.getElementById('edit-part-name').value.trim(),
                price: parseInt(document.getElementById('edit-part-price').value),
                condition: document.getElementById('edit-part-condition').value,
                category_id: document.getElementById('edit-part-category').value,
                sku: document.getElementById('edit-part-sku').value.trim() || null,
                description: document.getElementById('edit-part-desc').value.trim() || null,
                in_stock: document.getElementById('edit-part-instock').checked,
                manufacturer: document.getElementById('edit-part-manuf').value.trim() || null,
                oem_number: document.getElementById('edit-part-oem').value.trim() || null,
                manufacture_year: parseInt(document.getElementById('edit-part-year').value) || null,
                pieces_in_set: parseInt(document.getElementById('edit-part-pieces').value) || 1,
                images: finalImages
            };


            const updated = await API.updatePart(partId, partData);

            if (updated) {

                const rows = [];
                document.querySelectorAll('.car-row').forEach(row => {
                    const genId = row.querySelector('.row-gen').value;
                    const engineId = row.querySelector('.row-engine').value;
                    if (genId) rows.push({ genId, engineId: engineId || null });
                });


                await API.clearPartApplicabilities(partId);
                if (rows.length > 0) {
                    await API.addMultipleApplicabilities(partId, rows);
                }

                alert('Изменения успешно сохранены!');
                this.renderParts();
            } else {
                throw new Error('Ошибка обновления в БД');
            }
        } catch (error) {
            console.error(error);
            alert('Произошла ошибка при сохранении.');
            btn.disabled = false;
            btn.textContent = '💾 Сохранить изменения';
        }
    },




    async renderWheels() {
        const contentDiv = document.getElementById('admin-content');
        contentDiv.innerHTML = '<div class="adm-loading">Загрузка данных...</div>';

        const tires = await API.getTiresList();
        const wheels = await API.getWheelsList();

        let html = `
            <div class="adm-wheels-grid">
                
                <!-- ТАБЛИЦА ШИН -->
                <div class="admin-card">
                    <!-- Шапка карточки -->
                    <div class="adm-card-header adm-card-header--bordered">
                        <div class="adm-section-toggle" onclick="AdminApp.toggleSection('tires-container', 'tires-arrow')">
                            <span id="tires-arrow" class="adm-section-arrow">▼</span>
                            <h2 class="adm-modal__title">Список шин <span class="adm-count">(${tires.length})</span></h2>
                        </div>
                        <button onclick="AdminApp.showAddTireForm()" class="adm-btn adm-btn--primary">+ Добавить</button>
                    </div>
                    
                    <!-- Сворачиваемый контейнер -->
                    <div id="tires-container" class="adm-section-body">
                    <input type="text" onkeyup="AdminApp.filterTable(this, 'tbody-tires')" placeholder="🔍 Быстрый поиск шин по названию, ширине, радиусу..." class="adm-search">
                        <table class="adm-table">
                            <thead>
                                <tr class="adm-table__head-row">
                                    <th class="adm-table__th">Артикул / Название</th>
                                    <th class="adm-table__th">Параметры</th>
                                    <th class="adm-table__th">Цена</th>
                                    <th class="adm-table__th">Наличие</th>
                                    <th class="adm-table__th">Действия</th>
                                </tr>
                            </thead>
                            <tbody id="tbody-tires">
                                ${tires.map(tire => `
                                    <tr class="adm-table__row">
                                        <td class="adm-table__td"><strong>${tire.sku || '—'}</strong><br>${tire.name}</td>
                                        <td class="adm-table__td">${tire.tire_width}/${tire.tire_profile} R${tire.tire_diameter} ${tire.tire_season ? '(' + tire.tire_season + ')' : ''}</td>
                                        <td class="adm-table__td"><strong>${tire.price.toLocaleString()} ₽</strong></td>
                                        <td class="adm-table__td">
                                            ${tire.in_stock ? '<span class="adm-stock adm-stock--yes">● В наличии</span>' : '<span class="adm-stock adm-stock--no">● Нет в наличии</span>'}
                                        </td>
                                        <td class="adm-table__td">
                                            <button onclick="AdminApp.showEditTireForm('${tire.id}')" class="adm-btn-text adm-btn-text--edit">✏️ Изменить</button>
                                            <button onclick="AdminApp.handleDeleteTire('${tire.id}')" class="adm-btn-text adm-btn-text--danger">🗑️ Удалить</button>
                                        </td>
                                    </tr>
                                `).join('')}
                                ${tires.length === 0 ? '<tr><td colspan="5" class="adm-table__empty adm-table__empty--sm">Шин пока нет</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- ТАБЛИЦА ДИСКОВ -->
                <div class="admin-card">
                    <!-- Шапка карточки -->
                    <div class="adm-card-header adm-card-header--bordered">
                        <div class="adm-section-toggle" onclick="AdminApp.toggleSection('wheels-container', 'wheels-arrow')">
                            <span id="wheels-arrow" class="adm-section-arrow">▼</span>
                            <h2 class="adm-modal__title">Список дисков <span class="adm-count">(${wheels.length})</span></h2>
                        </div>
                        <button onclick="AdminApp.showAddWheelForm()" class="adm-btn adm-btn--primary">+ Добавить</button>
                    </div>
                    
                    <!-- Сворачиваемый контейнер -->
                    <div id="wheels-container" class="adm-section-body">
                    <input type="text" onkeyup="AdminApp.filterTable(this, 'tbody-wheels')" placeholder="🔍 Быстрый поиск дисков по параметрам, сверловке, названию..." class="adm-search">
                        <table class="adm-table">
                            <thead>
                                <tr class="adm-table__head-row">
                                    <th class="adm-table__th">Артикул / Название</th>
                                    <th class="adm-table__th">Параметры</th>
                                    <th class="adm-table__th">Цена</th>
                                    <th class="adm-table__th">Наличие</th>
                                    <th class="adm-table__th">Действия</th>
                                </tr>
                            </thead>
                            <tbody id="tbody-wheels">
                                ${wheels.map(wheel => `
                                    <tr class="adm-table__row">
                                        <td class="adm-table__td"><strong>${wheel.sku || '—'}</strong><br>${wheel.name}</td>
                                        <td class="adm-table__td">R${wheel.wheel_diameter}, ${wheel.wheel_width}J, PCD ${wheel.wheel_bolt_pattern}, ET${wheel.wheel_offset_et}</td>
                                        <td class="adm-table__td"><strong>${wheel.price.toLocaleString()} ₽</strong></td>
                                        <td class="adm-table__td">
                                            ${wheel.in_stock ? '<span class="adm-stock adm-stock--yes">● В наличии</span>' : '<span class="adm-stock adm-stock--no">● Нет в наличии</span>'}
                                        </td>
                                        <td class="adm-table__td">
                                            <button onclick="AdminApp.showEditWheelForm('${wheel.id}')" class="adm-btn-text adm-btn-text--edit">✏️ Изменить</button>
                                            <button onclick="AdminApp.handleDeleteWheel('${wheel.id}')" class="adm-btn-text adm-btn-text--danger">🗑️ Удалить</button>
                                        </td>
                                    </tr>
                                `).join('')}
                                ${wheels.length === 0 ? '<tr><td colspan="5" class="adm-table__empty adm-table__empty--sm">Дисков пока нет</td></tr>' : ''}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        `;
        contentDiv.innerHTML = html;
    },


    toggleSection(containerId, arrowId) {
        const container = document.getElementById(containerId);
        const arrow = document.getElementById(arrowId);

        if (container.classList.contains('is-collapsed')) {
            container.classList.remove('is-collapsed');
            arrow.classList.remove('is-collapsed');
        } else {
            container.classList.add('is-collapsed');
            arrow.classList.add('is-collapsed');
        }
    },


    async handleDeleteTire(id) {
        if (!confirm('Точно удалить эту шину?')) return;
        const success = await API.deleteTire(id);
        if (success) this.renderWheels();
        else alert('Ошибка при удалении шины.');
    },

    async handleDeleteWheel(id) {
        if (!confirm('Точно удалить этот диск?')) return;
        const success = await API.deleteWheel(id);
        if (success) this.renderWheels();
        else alert('Ошибка при удалении диска.');
    },




    showAddTireForm() {
        const contentDiv = document.getElementById('admin-content');
        let html = `
            <div class="admin-card">
                <div class="adm-card-header">
                    <h2 class="adm-title">Добавление новой шины</h2>
                    <button onclick="AdminApp.renderWheels()" class="adm-btn adm-btn--gray">← Назад</button>
                </div>

                <form id="add-tire-form" onsubmit="AdminApp.handleTireSubmit(event)" class="adm-form-grid">
                    
                    <div>
                        <h3 class="adm-form-section-title adm-form-section-title--plain">Основная информация</h3>
                        
                        <label class="adm-label">Название (модель) *</label>
                        <input type="text" id="tire-name" required class="adm-input adm-input--full adm-input--mb">

                        <div class="adm-flex-row adm-flex-row--mb">
                            <div class="adm-flex-1">
                                <label class="adm-label">Цена (₽) *</label>
                                <input type="number" id="tire-price" required class="adm-input">
                            </div>
                            <div class="adm-flex-1">
                                <label class="adm-label">Состояние *</label>
                                <select id="tire-condition" required class="adm-input">
                                    <option value="new">Новая</option>
                                    <option value="used">Б/У</option>
                                    <option value="contract">Контрактная</option>
                                </select>
                            </div>
                        </div>

                        <div class="adm-flex-row adm-flex-row--mb">
                            <div class="adm-flex-1">
                                <label class="adm-label">Производитель</label>
                                <input type="text" id="tire-manuf" placeholder="Например: Michelin" class="adm-input">
                            </div>
                            <div class="adm-flex-1">
                                <label class="adm-label">Артикул</label>
                                <input type="text" id="tire-sku" class="adm-input">
                            </div>
                        </div>

                        <label class="adm-label">Фотографии</label>
                        <input type="file" id="tire-images" multiple accept="image/*" class="adm-input adm-input--file">

                        <label class="adm-label">Описание</label>
                        <textarea id="tire-desc" rows="3" class="adm-input adm-input--full adm-input--mb"></textarea>
                    </div>

                    <div>
                        <h3 class="adm-form-section-title adm-form-section-title--plain">Характеристики шины</h3>

                        <div class="adm-flex-row adm-flex-row--mb">
                            <div class="adm-flex-1">
                                <label class="adm-label">Ширина *</label>
                                <input type="number" id="tire-width" placeholder="Напр: 225" required class="adm-input">
                            </div>
                            <div class="adm-flex-1">
                                <label class="adm-label">Профиль *</label>
                                <input type="number" id="tire-profile" placeholder="Напр: 55" required class="adm-input">
                            </div>
                            <div class="adm-flex-1">
                                <label class="adm-label">Диаметр (R) *</label>
                                <input type="text" id="tire-dia" placeholder="Напр: 17" required class="adm-input">
                            </div>
                        </div>

                        <div class="adm-flex-row adm-flex-row--mb">
                            <div class="adm-flex-1">
                                <label class="adm-label">Сезонность</label>
                                <select id="tire-season" class="adm-input">
                                    <option value="Летние">Летние</option>
                                    <option value="Зимние (шипованные)">Зимние (шипы)</option>
                                    <option value="Зимние (нешипованные)">Зимние (липучка)</option>
                                    <option value="Всесезонные">Всесезонные</option>
                                </select>
                            </div>
                            <div class="adm-flex-1">
                                <label class="adm-label">Кол-во в комплекте</label>
                                <input type="number" id="tire-pieces" value="4" class="adm-input">
                            </div>
                        </div>
                    </div>

                    <div class="adm-form-footer">
                        <button type="submit" id="btn-save-tire" class="adm-btn adm-btn--green adm-btn--lg">Сохранить шину в базу</button>
                    </div>
                </form>
            </div>
        `;
        contentDiv.innerHTML = html;
    },

    async handleTireSubmit(event) {
        event.preventDefault();
        const btn = document.getElementById('btn-save-tire');
        btn.disabled = true;
        btn.textContent = 'Сохранение...';

        try {

            const imageFiles = document.getElementById('tire-images').files;
            const imageUrls = [];
            if (imageFiles.length > 0 && typeof API.uploadImage === 'function') {
                for (const file of imageFiles) {
                    const url = await API.uploadImage(file);
                    if (url) imageUrls.push(url);
                }
            }


            const tireData = {
                name: document.getElementById('tire-name').value.trim(),
                price: parseInt(document.getElementById('tire-price').value),
                condition: document.getElementById('tire-condition').value,
                sku: document.getElementById('tire-sku').value.trim() || null,
                manufacturer: document.getElementById('tire-manuf').value.trim() || null,
                description: document.getElementById('tire-desc').value.trim() || null,
                tire_width: parseInt(document.getElementById('tire-width').value) || null,
                tire_profile: parseInt(document.getElementById('tire-profile').value) || null,
                tire_diameter: document.getElementById('tire-dia').value.trim() || null,
                tire_season: document.getElementById('tire-season').value,
                pieces_in_set: parseInt(document.getElementById('tire-pieces').value) || 1,
                images: imageUrls.length > 0 ? imageUrls : null,
                in_stock: true
            };

            const newTire = await API.addTire(tireData);
            if (newTire) {
                alert('Шина успешно добавлена!');
                this.renderWheels();
            } else {
                throw new Error('Ошибка БД');
            }
        } catch (error) {
            console.error(error);
            alert('Произошла ошибка при сохранении шины.');
            btn.disabled = false;
            btn.textContent = 'Сохранить шину в базу';
        }
    },




    showAddWheelForm() {
        const contentDiv = document.getElementById('admin-content');
        let html = `
            <div class="admin-card">
                <div class="adm-card-header">
                    <h2 class="adm-title">Добавление нового диска</h2>
                    <button onclick="AdminApp.renderWheels()" class="adm-btn adm-btn--gray">← Назад</button>
                </div>

                <form id="add-wheel-form" onsubmit="AdminApp.handleWheelSubmit(event)" class="adm-form-grid">
                    
                    <div>
                        <h3 class="adm-form-section-title adm-form-section-title--plain">Основная информация</h3>
                        
                        <label class="adm-label">Название (модель) *</label>
                        <input type="text" id="wheel-name" required class="adm-input adm-input--full adm-input--mb">

                        <div class="adm-flex-row adm-flex-row--mb">
                            <div class="adm-flex-1">
                                <label class="adm-label">Цена (₽) *</label>
                                <input type="number" id="wheel-price" required class="adm-input">
                            </div>
                            <div class="adm-flex-1">
                                <label class="adm-label">Состояние *</label>
                                <select id="wheel-condition" required class="adm-input">
                                    <option value="new">Новые</option>
                                    <option value="used">Б/У</option>
                                    <option value="contract">Контрактные</option>
                                </select>
                            </div>
                        </div>

                        <div class="adm-flex-row adm-flex-row--mb">
                            <div class="adm-flex-1">
                                <label class="adm-label">Производитель</label>
                                <input type="text" id="wheel-manuf" placeholder="Напр: K&K" class="adm-input">
                            </div>
                            <div class="adm-flex-1">
                                <label class="adm-label">Артикул</label>
                                <input type="text" id="wheel-sku" class="adm-input">
                            </div>
                        </div>

                        <label class="adm-label">Фотографии</label>
                        <input type="file" id="wheel-images" multiple accept="image/*" class="adm-input adm-input--file">

                        <label class="adm-label">Описание</label>
                        <textarea id="wheel-desc" rows="3" class="adm-input adm-input--full adm-input--mb"></textarea>
                    </div>

                    <div>
                        <h3 class="adm-form-section-title adm-form-section-title--plain">Характеристики диска</h3>

                        <div class="adm-flex-row adm-flex-row--mb">
                            <div class="adm-flex-1">
                                <label class="adm-label">Диаметр (R) *</label>
                                <input type="text" id="wheel-dia" placeholder="Напр: 17" required class="adm-input">
                            </div>
                            <div class="adm-flex-1">
                                <label class="adm-label">Ширина (J)</label>
                                <input type="number" step="0.5" id="wheel-width" placeholder="Напр: 7.5" class="adm-input">
                            </div>
                        </div>

                        <div class="adm-flex-row adm-flex-row--mb">
                            <div class="adm-flex-1">
                                <label class="adm-label">Сверловка (PCD) *</label>
                                <input type="text" id="wheel-pcd" placeholder="Напр: 5x114.3" required class="adm-input">
                            </div>
                            <div class="adm-flex-1">
                                <label class="adm-label">Вылет (ET)</label>
                                <input type="number" step="1" id="wheel-et" placeholder="Напр: 45" class="adm-input">
                            </div>
                            <div class="adm-flex-1">
                                <label class="adm-label">ЦО (DIA)</label>
                                <input type="number" step="0.1" id="wheel-dia-cb" placeholder="Напр: 60.1" class="adm-input">
                            </div>
                        </div>
                        
                        <div class="adm-field">
                            <label class="adm-label">Кол-во в комплекте</label>
                            <input type="number" id="wheel-pieces" value="4" class="adm-input">
                        </div>
                    </div>

                    <div class="adm-form-footer">
                        <button type="submit" id="btn-save-wheel" class="adm-btn adm-btn--green adm-btn--lg">Сохранить диск в базу</button>
                    </div>
                </form>
            </div>
        `;
        contentDiv.innerHTML = html;
    },

    async handleWheelSubmit(event) {
        event.preventDefault();
        const btn = document.getElementById('btn-save-wheel');
        btn.disabled = true;
        btn.textContent = 'Сохранение...';

        try {

            const imageFiles = document.getElementById('wheel-images').files;
            const imageUrls = [];
            if (imageFiles.length > 0 && typeof API.uploadImage === 'function') {
                for (const file of imageFiles) {
                    const url = await API.uploadImage(file);
                    if (url) imageUrls.push(url);
                }
            }


            const wheelData = {
                name: document.getElementById('wheel-name').value.trim(),
                price: parseInt(document.getElementById('wheel-price').value),
                condition: document.getElementById('wheel-condition').value,
                sku: document.getElementById('wheel-sku').value.trim() || null,
                manufacturer: document.getElementById('wheel-manuf').value.trim() || null,
                description: document.getElementById('wheel-desc').value.trim() || null,

                wheel_diameter: document.getElementById('wheel-dia').value.trim() || null,
                wheel_width: parseFloat(document.getElementById('wheel-width').value) || null,
                wheel_bolt_pattern: document.getElementById('wheel-pcd').value.trim() || null,
                wheel_offset_et: parseFloat(document.getElementById('wheel-et').value) || null,
                wheel_cb_dia: parseFloat(document.getElementById('wheel-dia-cb').value) || null,

                pieces_in_set: parseInt(document.getElementById('wheel-pieces').value) || 1,
                images: imageUrls.length > 0 ? imageUrls : null,
                in_stock: true
            };

            const newWheel = await API.addWheel(wheelData);
            if (newWheel) {
                alert('Диск успешно добавлен!');
                this.renderWheels();
            } else {
                throw new Error('Ошибка БД');
            }
        } catch (error) {
            console.error(error);
            alert('Произошла ошибка при сохранении диска.');
            btn.disabled = false;
            btn.textContent = 'Сохранить диск в базу';
        }
    },




    async showEditTireForm(id) {
        const contentDiv = document.getElementById('admin-content');
        const tire = await API.getTireById(id);
        if (!tire) return alert('Ошибка загрузки данных');

        contentDiv.innerHTML = `
            <div class="admin-card">
                <div class="adm-card-header">
                    <h2>✏️ Редактирование шины</h2>
                    <button onclick="AdminApp.renderWheels()" class="adm-btn adm-btn--gray">← Назад</button>
                </div>
                <form onsubmit="AdminApp.handleEditTireSubmit(event, '${tire.id}')" class="adm-form-grid">
                    <div>
                        <label>Название *</label>
                        <input type="text" id="edit-tire-name" value="${tire.name}" required class="adm-input adm-input--full adm-input--mb">
                        
                        <div class="adm-flex-gap">
                            <div class="adm-flex-1"><label>Цена (₽)</label><input type="number" id="edit-tire-price" value="${tire.price}" required class="adm-input"></div>
                            <div class="adm-flex-1"><label>Состояние</label>
                                <select id="edit-tire-cond" class="adm-input">
                                    <option value="new" ${tire.condition === 'new' ? 'selected' : ''}>Новая</option>
                                    <option value="used" ${tire.condition === 'used' ? 'selected' : ''}>Б/У</option>
                                    <option value="contract" ${tire.condition === 'contract' ? 'selected' : ''}>Контрактная</option>
                                </select>
                            </div>
                        </div>
                        <label class="adm-field adm-field--mt">Новые фото (оставьте пустым, чтобы не менять)</label>
                        <input type="file" id="edit-tire-images" multiple accept="image/*" class="adm-input adm-input--file">
                    </div>
                    <div>
                        <h3>Параметры</h3>
                        <div class="adm-flex-gap adm-flex-gap--mb">
                            <input type="number" id="edit-tire-w" value="${tire.tire_width || ''}" placeholder="Ширина" class="adm-input adm-input--flex">
                            <input type="number" id="edit-tire-p" value="${tire.tire_profile || ''}" placeholder="Профиль" class="adm-input adm-input--flex">
                            <input type="text" id="edit-tire-d" value="${tire.tire_diameter || ''}" placeholder="R" class="adm-input adm-input--flex">
                        </div>
                        <label>Сезонность</label>
                        <select id="edit-tire-season" class="adm-input adm-input--full adm-input--mb">
                            <option value="Летние" ${tire.tire_season === 'Летние' ? 'selected' : ''}>Летние</option>
                            <option value="Зимние" ${tire.tire_season === 'Зимние' ? 'selected' : ''}>Зимние</option>
                            <option value="Всесезонные" ${tire.tire_season === 'Всесезонные' ? 'selected' : ''}>Всесезонные</option>
                        </select>
                        
                        <!-- НОВАЯ ГАЛОЧКА -->
                        <div class="adm-field adm-field--mt-lg">
                            <label class="adm-checkbox-label">
                                <input type="checkbox" id="edit-tire-instock" ${tire.in_stock ? 'checked' : ''} class="adm-checkbox">
                                Товар есть в наличии на складе
                            </label>
                        </div>
                    </div>
                    <div class="adm-form-footer"><button type="submit" class="adm-btn adm-btn--orange adm-btn--lg">Сохранить изменения</button></div>
                </form>
            </div>
        `;
    },

    async handleEditTireSubmit(event, id) {
        event.preventDefault();
        const files = document.getElementById('edit-tire-images').files;
        let images = null;

        if (files.length > 0) {
            images = [];
            for (const f of files) {
                const url = await API.uploadImage(f);
                if (url) images.push(url);
            }
        }

        const data = {
            name: document.getElementById('edit-tire-name').value,
            price: parseInt(document.getElementById('edit-tire-price').value),
            condition: document.getElementById('edit-tire-cond').value,
            tire_width: parseInt(document.getElementById('edit-tire-w').value),
            tire_profile: parseInt(document.getElementById('edit-tire-p').value),
            tire_diameter: document.getElementById('edit-tire-d').value,
            tire_season: document.getElementById('edit-tire-season').value,
            in_stock: document.getElementById('edit-tire-instock').checked
        };
        if (images) data.images = images;

        if (await API.updateTire(id, data)) {
            alert('Обновлено!');
            this.renderWheels();
        }
    },




    async showEditWheelForm(id) {
        const contentDiv = document.getElementById('admin-content');
        const wheel = await API.getWheelById(id);
        if (!wheel) return alert('Ошибка загрузки данных');

        contentDiv.innerHTML = `
            <div class="admin-card">
                <div class="adm-card-header">
                    <h2>✏️ Редактирование диска</h2>
                    <button onclick="AdminApp.renderWheels()" class="adm-btn adm-btn--gray">← Назад</button>
                </div>
                <form onsubmit="AdminApp.handleEditWheelSubmit(event, '${wheel.id}')" class="adm-form-grid">
                    <div>
                        <label>Название *</label>
                        <input type="text" id="edit-wheel-name" value="${wheel.name}" required class="adm-input adm-input--full adm-input--mb">
                        <label>Цена (₽)</label>
                        <input type="number" id="edit-wheel-price" value="${wheel.price}" required class="adm-input adm-input--full adm-input--mb">
                        <label>Новые фото (оставьте пустым, чтобы не менять)</label>
                        <input type="file" id="edit-wheel-images" multiple accept="image/*" class="adm-input adm-input--file">
                    </div>
                    <div>
                        <h3>Параметры</h3>
                        <div class="adm-guide__li">
                            <label>Диаметр (R)</label>
                            <input type="text" id="edit-wheel-dia" value="${wheel.wheel_diameter || ''}" class="adm-input">
                        </div>
                        <div class="adm-guide__li">
                            <label>Сверловка (PCD)</label>
                            <input type="text" id="edit-wheel-pcd" value="${wheel.wheel_bolt_pattern || ''}" class="adm-input">
                        </div>
                        
                        <!-- НОВАЯ ГАЛОЧКА -->
                        <div class="adm-field adm-field--mt-lg">
                            <label class="adm-checkbox-label">
                                <input type="checkbox" id="edit-wheel-instock" ${wheel.in_stock ? 'checked' : ''} class="adm-checkbox">
                                Товар есть в наличии на складе
                            </label>
                        </div>
                    </div>
                    <div class="adm-form-footer"><button type="submit" class="adm-btn adm-btn--orange adm-btn--lg">Сохранить изменения</button></div>
                </form>
            </div>
        `;
    },

    async handleEditWheelSubmit(event, id) {
        event.preventDefault();
        const files = document.getElementById('edit-wheel-images').files;
        let images = null;

        if (files.length > 0) {
            images = [];
            for (const f of files) {
                const url = await API.uploadImage(f);
                if (url) images.push(url);
            }
        }

        const data = {
            name: document.getElementById('edit-wheel-name').value,
            price: parseInt(document.getElementById('edit-wheel-price').value),
            wheel_diameter: document.getElementById('edit-wheel-dia').value,
            wheel_bolt_pattern: document.getElementById('edit-wheel-pcd').value,
            in_stock: document.getElementById('edit-wheel-instock').checked
        };
        if (images) data.images = images;

        if (await API.updateWheel(id, data)) {
            alert('Обновлено!');
            this.renderWheels();
        }
    },



    renderGuide() {
        const container = document.getElementById('admin-content');

        container.innerHTML = `
            <div class="admin-card" class="adm-guide">
                <h2 class="adm-guide__title">📖 Руководство менеджера по работе с каталогом и заказами</h2>
                <p class="adm-guide__lead">Добро пожаловать в панель управления интернет-магазином!</p>
                
                <div class="adm-guide__note adm-guide__note--blue">
                    <strong>Главное правило системы:</strong> Мы всегда движемся от «общего» к «частному». Нельзя добавить в каталог запчасть для автомобиля, которого еще нет в базе. Сначала мы создаем фундамент (марки, модели, категории), а затем добавляем к нему конкретные товары.
                </div>

                <p class="adm-guide__text">Вся работа делится на 4 логических блока.</p>

                <!-- БЛОК 1 -->
                <h3 class="adm-guide__h3 adm-guide__h3--blue">
                    <span>📚</span> Блок 1: Справочники (Базовые настройки)
                </h3>
                <p class="adm-guide__text">В этот раздел вы будете заходить реже всего. Здесь формируется основа каталога. Если появилась запчасть из автомобиля, которого раньше никогда не было, начинать нужно отсюда.</p>
                <ol class="adm-guide__list">
                    <li class="adm-field">
                        <strong>Добавление автомобиля (Строгая последовательность):</strong>
                        <ul class="adm-guide__sublist">
                            <li><em>Шаг 1. Марка:</em> Зайдите в раздел «Марки» и проверьте, есть ли нужная (например, Toyota). Если нет — добавьте.</li>
                            <li><em>Шаг 2. Модель:</em> Зайдите в «Модели». Выберите марку из списка и напишите название модели (например, Camry).</li>
                            <li><em>Шаг 3. Поколение:</em> Зайдите в «Поколения». Выберите созданную модель и укажите данные кузова (например, XV40, 2006-2011).</li>
                        </ul>
                    </li>
                    <li class="adm-field">
                        <strong>Категории товаров:</strong> Здесь хранятся названия разделов каталога (например, Кузовные детали, Оптика, Подвеска). Если нужной категории нет, добавьте ее.
                    </li>
                    <li class="adm-field">
                        <strong>Двигатели:</strong> Справочник моторов (например, 1JZ-GTE). Добавляйте сюда новые маркировки по мере их поступления.
                    </li>
                </ol>

                <hr class="adm-hr adm-hr--lg">

                <!-- БЛОК 2 -->
                <h3 class="adm-guide__h3 adm-guide__h3--green">
                    <span>🛞</span> Блок 2: Добавление независимых товаров (Шины и Диски)
                </h3>
                <p class="adm-guide__text">Шины и диски — это универсальные товары. Они не привязываются к конкретной марке автомобиля, поэтому добавлять их очень просто.</p>
                <ul class="adm-guide__list">
                    <li class="adm-guide__li adm-guide__li--sm">Откройте раздел «Шины и Диски» и нажмите кнопку добавления.</li>
                    <li class="adm-guide__li adm-guide__li--sm">Заполните параметры: Название, Цена, Артикул, радиус, ширина, профиль или сверловка.</li>
                    <li class="adm-guide__li adm-guide__li--sm"><strong>Количество в комплекте:</strong> Если вы продаете 4 диска единым набором, ставьте цифру 4. Если это шина на запаску — ставьте 1.</li>
                    <li class="adm-guide__li adm-guide__li--sm">Загрузите фотографии и нажмите «Сохранить». Товар сразу появится на сайте.</li>
                </ul>

                <hr class="adm-hr adm-hr--lg">

                <!-- БЛОК 3 -->
                <h3 class="adm-guide__h3 adm-guide__h3--orange">
                    <span>⚙️</span> Блок 3: Добавление Автозапчастей
                </h3>
                <p class="adm-guide__text">Это самый частый процесс. Так как одна и та же фара может подходить к разным поколениям авто, форма разделена на две части.</p>
                <ul class="adm-guide__list">
                    <li class="adm-guide__li">
                        <strong>Шаг 1: Основные данные детали.</strong> Заполните Категорию, Название товара, Цену и Артикул. Загрузите фото.
                    </li>
                    <li class="adm-guide__li">
                        <strong>Шаг 2: Привязка к автомобилю (Применяемость).</strong> В этой же форме нажмите кнопку добавления машины.
                        <ul class="adm-guide__sublist">
                            <li>Выберите Марку → Модель → Поколение.</li>
                            <li><em>Внимание:</em> если деталь кузовная (дверь, бампер), поле двигателя можно оставить пустым. Если это генератор или стартер — желательно указать двигатель.</li>
                            <li>Если деталь подходит на разные кузова, просто нажмите кнопку добавления машины еще раз и добавьте второй кузов!</li>
                        </ul>
                    </li>
                </ul>

                <hr class="adm-hr adm-hr--lg">

                <!-- БЛОК 4 -->
                <h3 class="adm-guide__h3 adm-guide__h3--purple">
                    <span>📦</span> Блок 4: Обработка заказов
                </h3>
                <p class="adm-guide__text">В этом разделе вы видите все покупки клиентов.</p>
                <ul class="adm-guide__list">
                    <li class="adm-guide__li adm-guide__li--sm">Новые заказы по умолчанию имеют статус <strong>Ожидает</strong>.</li>
                    <li class="adm-guide__li adm-guide__li--sm">Внутри заказа вы увидите контакты клиента, способ доставки (Самовывоз/Доставка ТК) и комментарий. <em>Если комментарий длинный, он будет скроллиться внутри своего блока.</em></li>
                    <li class="adm-guide__li adm-guide__li--sm">После передачи артикулов кладовщику на сборку, переведите статус в <strong>В обработке</strong>.</li>
                    <li class="adm-guide__li adm-guide__li--sm">После отправки ТК или выдачи на кассе, измените статус на <strong>Отправлен</strong> или <strong>Выполнен</strong>.</li>
                </ul>

                <div class="adm-guide__note adm-guide__note--orange">
                    <h4 class="adm-guide__h4">📌 Памятка менеджера (Частые ошибки)</h4>
                    <ul class="adm-guide__list adm-guide__list--mb0">
                        <li class="adm-guide__li adm-guide__li--sm"><strong>Артикул (SKU) — это идентификатор товарной позиции.</strong> Никогда не оставляйте это поле пустым. Базе данных для работы достаточно внутренних кодов, но живой кладовщик без артикула деталь на складе не найдет.</li>
                        <li class="adm-guide__li adm-guide__li--sm"><strong>Удаление товаров:</strong> Старайтесь не удалять товары из базы без крайней необходимости. Лучше просто снимите галочку «В наличии» (или статус видимости), чтобы скрыть товар с витрины, но сохранить историю.</li>
                        <li><strong>Удаление заказов:</strong> При нажатии на красный крестик в заказах заказ удаляется безвозвратно. <em>Важно:</em> вместе с заказом из базы каскадно удаляются все товары, которые он заказывал!</li>
                    </ul>
                </div>
            </div>
        `;
    }
};


document.addEventListener('DOMContentLoaded', () => AdminApp.init());