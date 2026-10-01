document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('statusForm');
    const input = document.getElementById('orderIdInput');
    const btn = document.getElementById('checkBtn');
    const resultBlock = document.getElementById('resultBlock');

    if (!form) return;

    let isSearching = false;

    async function findOrder(shortId) {
        try {
            const { data, error } = await supabaseClient.rpc('get_order_status', { search_id: shortId });
            if (error) throw error;
            if (!data || data.length === 0) return null;
            return data[0];
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        if (isSearching) return; 
        
        const shortId = input.value.trim().toLowerCase();
        if (!shortId) return;

        isSearching = true;

        btn.disabled = true;
        btn.textContent = 'Поиск...';
        resultBlock.classList.add('is-hidden');

        const existingError = document.getElementById('orderNotFoundError');
        if (existingError) existingError.classList.add('is-hidden');

        const order = await findOrder(shortId);

        btn.disabled = false;
        btn.textContent = 'Проверить';
        isSearching = false;

        if (!order) {
            let errorBox = document.getElementById('orderNotFoundError');
            if (!errorBox) {
                errorBox = document.createElement('div');
                errorBox.id = 'orderNotFoundError';
                errorBox.className = 'order-not-found-error';
                form.after(errorBox);
            }
            errorBox.innerHTML = `Заказ с номером <strong>#${shortId.toUpperCase()}</strong> не найден. <br>Пожалуйста, проверьте правильность ввода.`;
            errorBox.classList.remove('is-hidden');
            return;
        }
        document.getElementById('resOrderId').textContent = order.id.split('-')[0].toUpperCase();
        
        const dateObj = new Date(order.created_at);
        document.getElementById('resOrderDate').textContent = dateObj.toLocaleDateString('ru-RU', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        document.getElementById('resOrderTotal').textContent = order.total_price.toLocaleString();

        const trackingBlock = document.getElementById('trackingBlock');
        if (trackingBlock) {
            if (order.delivery_type === 'transport' && order.tracking_code) {
                document.getElementById('resTrackingCode').textContent = order.tracking_code;
                trackingBlock.classList.remove('is-hidden');
            } else {
                trackingBlock.classList.add('is-hidden');
            }
        }

        const dbStatus = (order.status || 'Ожидает').trim(); 
        
        const statusMap = {
            'Ожидает': { text: 'Новый (Ожидает обработки)', class: 'status-new' },
            'В обработке': { text: 'Собирается на складе', class: 'status-processing' },
            'Готов к выдаче': { text: 'Готов к выдаче (Ждет вас)', class: 'status-ready' },
            'Отправлен': { text: 'Отправлен покупателю', class: 'status-sent' },
            'Выполнен': { text: 'Выполнен (Получен)', class: 'status-completed' },
            'Отменен': { text: 'Отменен', class: 'status-cancelled' }
        };

        const statusObj = statusMap[dbStatus] || { text: dbStatus, class: 'status-completed' };
        
        const statusBadge = document.getElementById('resOrderStatus');
        statusBadge.textContent = statusObj.text;
        statusBadge.className = `status-badge ${statusObj.class}`;

        resultBlock.classList.remove('is-hidden');
    });

    const urlParams = new URLSearchParams(window.location.search);
    const orderIdFromUrl = urlParams.get('id');
    
    if (orderIdFromUrl && orderIdFromUrl.trim() !== '') {
        input.value = orderIdFromUrl.trim();
        setTimeout(() => {
            btn.click();
        }, 100);
    }
});