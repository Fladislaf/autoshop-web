async function loadComponents() {
    try {

        const headerRes = await fetch('/header.html');
        const headerHtml = await headerRes.text();
        document.getElementById('header-placeholder').innerHTML = headerHtml;
        

        const footerRes = await fetch('/footer.html');
        const footerHtml = await footerRes.text();
        document.getElementById('footer-placeholder').innerHTML = footerHtml;
        

        const event = new Event('DOMContentLoaded');
        document.dispatchEvent(event);
        
    } catch (error) {
        console.error('Ошибка загрузки компонентов:', error);
    }
}

loadComponents();