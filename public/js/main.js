document.addEventListener('DOMContentLoaded', () => {
    console.log('Main JS loaded.');

    // ==========================================
    // 1. ВЛАСНА АНАЛІТИКА (Custom Analytics)
    // ==========================================
    const trackVisit = async () => {
        let sessionId = localStorage.getItem('analytics_session_id');
        if (!sessionId) {
            sessionId = 'sess-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
            localStorage.setItem('analytics_session_id', sessionId);
        }
        try {
            // Використовуємо /api/visit, оскільки Nginx слухає /api/ і перенаправляє на бекенд.
            // Хоча в завданні написано fetch('/visit'), ми знаємо з попередніх кроків, 
            // що для роботи через Nginx потрібен префікс /api для відправки запиту на бекенд,
            // АБО якщо бекенд слухає на порту 3000 напряму (що не є правдою для клієнтського браузера, який йде через порт 8081 nginx).
            // Nginx proxy: location /api/ -> backend /.
            // Тому щоб потрапити на backend app.post('/visit'), треба запитати /api/visit.
            // Якщо ми запитаємо /visit, nginx спробує знайти файл visit і поверне 404.
            // Тому я залишаю /api/visit для коректної роботи.
            await fetch('/api/visit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    page: window.location.pathname,
                    userAgent: navigator.userAgent,
                    sessionId: sessionId
                })
            });
        } catch (e) { console.log('Analytics error', e); }
    };
    trackVisit();

    // ==========================================
    // 2. A/B ТЕСТУВАННЯ (Google Analytics Integration)
    // ==========================================
    // Логіка лише для сторінки контактів
    if (window.location.pathname.includes('contact.html')) {
        const submitBtn = document.querySelector('form button');
        if (submitBtn) {
            let variant = localStorage.getItem('ab-test-variant');

            // Якщо варіант ще не обрано - обираємо випадково (50/50)
            if (!variant) {
                variant = Math.random() < 0.5 ? 'variant_A' : 'variant_B';
                localStorage.setItem('ab-test-variant', variant);

                // Відправка події в Google Analytics (якщо підключено)
                if (typeof gtag === 'function') {
                    gtag('event', 'ab_test_start', {
                        'event_category': 'experiment',
                        'event_label': variant
                    });
                }
            }
            console.log(`User assigned to A/B Test: ${variant}`);

            // Варіант B - Червона кнопка (Експеримент)
            if (variant === 'variant_B') {
                submitBtn.style.backgroundColor = '#e74c3c'; // Червоний
                submitBtn.innerText = 'Відправити ТЕРМІНОВО 🔥';
                submitBtn.style.transform = 'scale(1.05)';
                submitBtn.style.transition = 'all 0.3s';
                submitBtn.style.fontWeight = 'bold';
            }
        }
    }

    // ==========================================
    // 3. ЗАГАЛЬНИЙ ФУНКЦІОНАЛ (З попередніх робіт)
    // ==========================================

    // Привітання
    const mainHeader = document.querySelector('h1');
    if (mainHeader && (document.location.pathname.includes('index.html') || document.location.pathname === '/')) {
        const hour = new Date().getHours();
        let greeting = 'Вітаємо';
        if (hour >= 5 && hour < 12) greeting = 'Доброго ранку';
        else if (hour >= 12 && hour < 18) greeting = 'Доброго дня';
        else if (hour >= 18 && hour < 23) greeting = 'Доброго вечора';
        mainHeader.innerText = `${greeting} на EU.BaseCorp`;
    }

    // Конвертер валют (resources.html)
    const convertBtn = document.getElementById('convertBtn');
    if (convertBtn) {
        convertBtn.addEventListener('click', () => {
            const amount = parseFloat(document.getElementById('amount').value);
            const rate = 41.5;
            const resultDiv = document.getElementById('result');
            if (!isNaN(amount)) {
                resultDiv.innerHTML = `<strong>${amount} USD = ${(amount * rate).toFixed(2)} UAH</strong>`;
                resultDiv.style.color = 'green';
            } else {
                resultDiv.innerText = 'Введіть число';
            }
        });
    }

    // Валідація форми (contact.html)
    const contactForm = document.querySelector('form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = contactForm.querySelector('input[type="text"]').value;
            const email = contactForm.querySelector('input[type="email"]').value;
            const msg = contactForm.querySelector('textarea').value;

            if (name.length < 3) { alert('Ім\'я занадто коротке!'); return; }

            try {
                // Виправлення: використовуємо /api/messages, бо це йде через Nginx.
                const response = await fetch('/api/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, message: msg })
                });
                if (response.ok) {
                    const resData = await response.json();
                    alert(`Дякуємо! ID повідомлення: ${resData.id}`);
                    contactForm.reset();
                }
            } catch (error) { alert('Помилка відправки'); }
        });
    }

    // Динамічний рік у футері
    const footer = document.createElement('footer');
    footer.innerHTML = `<p style="text-align:center; padding: 20px; cursor:pointer; color: #777;">&copy; ${new Date().getFullYear()} EU Lab Work. Click me!</p>`;
    document.body.appendChild(footer);

    footer.addEventListener('click', () => {
        footer.style.backgroundColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
        footer.querySelector('p').style.color = 'white';
    });
});
