document.addEventListener('error', function(event) {
        if (event.target.tagName && event.target.tagName.toLowerCase() === 'img') {
            if (event.target.dataset.fallbackApplied) return;
            event.target.dataset.fallbackApplied = true;
            event.target.src = 'https://placehold.jp/dedede/888888/800x600.png?text=Нет+фото';
        }
    }, true);
const UI = {

    getBadgeStyle(condition) {
        switch(condition) {
            case 'new': return { text: 'Новая', class: 'badge--new' };
            case 'contract': return { text: 'Контрактная', class: 'badge--contract' };
            case 'used': return { text: 'Б/У', class: 'badge--used' };
            default: return { text: '—', class: 'badge--default' };
        }
    }
};
