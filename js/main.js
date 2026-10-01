document.addEventListener('DOMContentLoaded', () => {
    const moreWrapper = document.querySelector('.nav__item--more-wrapper');
    const moreBtn = document.querySelector('.nav__more-btn');

    if (moreBtn && moreWrapper) {
        moreBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            moreWrapper.classList.toggle('is-open');
        });

        document.addEventListener('click', (e) => {
            if (!moreWrapper.contains(e.target)) {
                moreWrapper.classList.remove('is-open');
            }
        });
    }


    const burgerBtn = document.getElementById('burgerBtn');
    const mobileNav = document.getElementById('mobileNav');
    const closeNavBtn = document.getElementById('closeNavBtn');


    if (burgerBtn && mobileNav) {
        burgerBtn.addEventListener('click', () => {
            mobileNav.classList.add('is-open');

            document.body.classList.add('body-no-scroll');
        });
    }


    if (closeNavBtn && mobileNav) {
        closeNavBtn.addEventListener('click', () => {
            mobileNav.classList.remove('is-open');

            document.body.classList.remove('body-no-scroll');
        });
    }



    const slider = document.getElementById('productsSlider');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (slider && prevBtn && nextBtn) {
        nextBtn.addEventListener('click', () => {

            slider.scrollBy({ left: slider.clientWidth, behavior: 'smooth' });
        });

        prevBtn.addEventListener('click', () => {
            slider.scrollBy({ left: -slider.clientWidth, behavior: 'smooth' });
        });
    }


    const sliderDots = document.querySelectorAll('.slider-dot');

    if (slider && sliderDots.length > 0) {


        slider.addEventListener('scroll', () => {

            const pageWidth = slider.clientWidth;

            const scrollPosition = slider.scrollLeft;


            const activeIndex = Math.round(scrollPosition / pageWidth);


            sliderDots.forEach((dot, index) => {
                if (index === activeIndex) {
                    dot.classList.add('is-active');
                } else {
                    dot.classList.remove('is-active');
                }
            });
        });


        sliderDots.forEach((dot) => {
            dot.addEventListener('click', (e) => {

                const targetIndex = parseInt(e.target.getAttribute('data-index'));
                const pageWidth = slider.clientWidth;


                slider.scrollTo({
                    left: pageWidth * targetIndex,
                    behavior: 'smooth'
                });
            });
        });
    }

    const deliveryRadios = document.querySelectorAll('input[name="delivery"]');
    const deliveryCards = document.querySelectorAll('.delivery-card');


    const labelName = document.getElementById('label-name');
    const inputName = document.getElementById('input-name');
    const groupCity = document.getElementById('group-city');

    if (deliveryRadios.length > 0) {
        deliveryRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {


                deliveryCards.forEach(card => card.classList.remove('is-active'));
                e.target.closest('.delivery-card').classList.add('is-active');


                if (e.target.value === 'transport') {

                    groupCity.classList.remove('is-hidden');
                    labelName.innerHTML = 'Ф.И.О. <span class="required">*</span>';
                    inputName.placeholder = 'Ф.И.О. получателя груза';
                } else {

                    groupCity.classList.add('is-hidden');
                    labelName.innerHTML = 'Ф.И.О. <span class="required">*</span>';
                    inputName.placeholder = 'Ф.И.О. получателя';
                }
            });
        });
    }


    const openFiltersBtn = document.getElementById('openMobileFilters');
    const closeFiltersBtn = document.getElementById('closeMobileFilters');
    const mobileFilterMenu = document.getElementById('mobileFilterMenu');

    if (openFiltersBtn && closeFiltersBtn && mobileFilterMenu) {


        openFiltersBtn.addEventListener('click', () => {
            mobileFilterMenu.classList.add('is-open');

            document.body.classList.add('body-no-scroll');
        });


        closeFiltersBtn.addEventListener('click', () => {
            mobileFilterMenu.classList.remove('is-open');

            document.body.classList.remove('body-no-scroll');
        });
    }





    


    const filterCheckboxes = document.querySelectorAll('.catalog-sidebar input[type="checkbox"]');
    const filterActions = document.getElementById('filterActions');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');

    if (filterCheckboxes.length > 0 && filterActions) {


        filterCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {

                const isAnyChecked = Array.from(filterCheckboxes).some(cb => cb.checked);


                if (isAnyChecked) {
                    filterActions.classList.remove('is-hidden');
                } else {
                    filterActions.classList.add('is-hidden');
                }
            });
        });


        if (resetFiltersBtn) {
            resetFiltersBtn.addEventListener('click', () => {

                filterCheckboxes.forEach(cb => cb.checked = false);

                filterActions.classList.add('is-hidden');
            });
        }
    }











    const btnChangeCarDesktop = document.getElementById('btnChangeCarDesktop');
    const modalChangeCar = document.getElementById('modalChangeCar');
    const btnCloseModalCar = document.getElementById('btnCloseModalCar');
    const btnCancelModalCar = document.getElementById('btnCancelModalCar');

    if (btnChangeCarDesktop && modalChangeCar) {


        btnChangeCarDesktop.addEventListener('click', () => {
            modalChangeCar.classList.add('is-open');
            document.body.classList.add('body-no-scroll');
        });


        const closeModal = () => {
            modalChangeCar.classList.remove('is-open');
            document.body.classList.remove('body-no-scroll');
        };


        if (btnCloseModalCar) btnCloseModalCar.addEventListener('click', closeModal);
        if (btnCancelModalCar) btnCancelModalCar.addEventListener('click', closeModal);


        modalChangeCar.addEventListener('click', (e) => {
            if (e.target === modalChangeCar) {
                closeModal();
            }
        });
    }




    const btnOpenCategories = document.getElementById('btnOpenCategories');
    const btnCloseCategories = document.getElementById('btnCloseCategories');
    const mobileCategoryMenu = document.getElementById('mobileCategoryMenu');

    if (btnOpenCategories && btnCloseCategories && mobileCategoryMenu) {


        btnOpenCategories.addEventListener('click', () => {
            mobileCategoryMenu.classList.add('is-open');
            document.body.classList.add('body-no-scroll');
        });


        btnCloseCategories.addEventListener('click', () => {
            mobileCategoryMenu.classList.remove('is-open');
            document.body.classList.remove('body-no-scroll');
        });
    }




    const mobileModalChangeCar = document.getElementById('mobileModalChangeCar');
    const btnCloseMobileModalCar = document.getElementById('btnCloseMobileModalCar');


    const btnChangeCarMobile = document.getElementById('btnChangeCarMobile');
    const btnRefineBodyMobile = document.getElementById('btnRefineBodyMobile');
    const btnSelectEngineMobile = document.getElementById('btnSelectEngineMobile');

    if (mobileModalChangeCar) {


        const openMobileModal = (e) => {
            e.preventDefault();
            mobileModalChangeCar.classList.add('is-open');
            document.body.classList.add('body-no-scroll');
        };


        const closeMobileModal = () => {
            mobileModalChangeCar.classList.remove('is-open');
            document.body.classList.remove('body-no-scroll');
        };


        if (btnChangeCarMobile) btnChangeCarMobile.addEventListener('click', openMobileModal);
        if (btnRefineBodyMobile) btnRefineBodyMobile.addEventListener('click', openMobileModal);
        if (btnSelectEngineMobile) btnSelectEngineMobile.addEventListener('click', openMobileModal);


        if (btnCloseMobileModalCar) btnCloseMobileModalCar.addEventListener('click', closeMobileModal);
    }



    {

        const productTabs = document.querySelectorAll('.tab-btn');
        const productContents = document.querySelectorAll('.tab-content');

        if (productTabs.length > 0) {
            productTabs.forEach(btn => {
                btn.addEventListener('click', () => {
                    productTabs.forEach(b => b.classList.remove('is-active'));
                    productContents.forEach(c => c.classList.remove('is-active'));

                    btn.classList.add('is-active');
                    const targetId = btn.getAttribute('data-tab');
                    const targetEl = document.getElementById(targetId);
                    if (targetEl) targetEl.classList.add('is-active');
                });
            });
        }

    }




    const globalSearchInput = document.querySelector('.nav__input');

    if (globalSearchInput) {

        globalSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const query = globalSearchInput.value.trim();
                if (query) {

                    window.location.href = `zapchasti.html?q=${encodeURIComponent(query)}`;
                }
            }
        });



    }




    const currentPath = window.location.pathname.toLowerCase();
    const urlParams = new URLSearchParams(window.location.search);
    const productType = urlParams.get('type');


    const navLinks = document.querySelectorAll('.nav__link, .dropdown-link');

    navLinks.forEach(link => {

        const href = link.getAttribute('href')?.toLowerCase() || '';
        let isMatch = false;


        if (currentPath.includes('index.html') || currentPath.includes('zapchasti.html') || currentPath.endsWith('/')) {
            if (href.includes('index.html')) isMatch = true;
        } 

        else if (currentPath.includes('shiny.html') || currentPath.includes('diski.html')) {
            if (href.includes('shiny.html')) isMatch = true;
        } 

        else if (currentPath.includes('product.html')) {
            if (productType === 'tire' || productType === 'wheel') {

                if (href.includes('shiny.html')) isMatch = true;
            } else {

                if (href.includes('index.html')) isMatch = true;
            }
        } 

        else {
            const cleanHref = href.replace('/', '');
            if (cleanHref && currentPath.includes(cleanHref)) {
                isMatch = true;
            }
        }


        if (isMatch) {
            link.classList.add('is-active');
            

            if (link.classList.contains('dropdown-link')) {
                const moreBtn = document.querySelector('.nav__more-btn');
                if (moreBtn) moreBtn.classList.add('is-active');
            }
        }
    });
});

