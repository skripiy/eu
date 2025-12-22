document.addEventListener('DOMContentLoaded', () => {
    // --- ПРОСУНУТА АНАЛІТИКА ---
    const trackVisit = async () => {
        // Генерація або отримання Session ID
        let sessionId = localStorage.getItem('analytics_session_id');
        if (!sessionId) {
            sessionId = 'sess-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
            localStorage.setItem('analytics_session_id', sessionId);
        }

        try {
            await fetch('/api/visit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    page: window.location.pathname,
                    userAgent: navigator.userAgent,
                    sessionId: sessionId
                })
            });
        } catch (e) {
            console.log('Analytics error', e);
        }
    };
    trackVisit();

    console.log('JavaScript завантажено успішно!');

    // --- ЗАВДАННЯ 1: Динамічна зміна контенту (Привітання за часом) ---
    const mainHeader = document.querySelector('h1');
    if (mainHeader && document.location.pathname.includes('index.html') || document.location.pathname === '/') {
        const hour = new Date().getHours();
        let greeting = 'Вітаємо';

        if (hour >= 5 && hour < 12) greeting = 'Доброго ранку';
        else if (hour >= 12 && hour < 18) greeting = 'Доброго дня';
        else if (hour >= 18 && hour < 23) greeting = 'Доброго вечора';

        // Змінюємо текст заголовка
        mainHeader.innerText = `${greeting} на EU.BaseCorp`;
        // Змінюємо стиль динамічно
        mainHeader.style.color = '#2c3e50';
    }

    // --- ЗАВДАННЯ 2: Інтерактив (Конвертер валют) ---
    // Логіка буде працювати, якщо на сторінці є елементи конвертера
    const amountInput = document.getElementById('amount');
    const convertBtn = document.getElementById('convertBtn');
    const resultDiv = document.getElementById('result');

    if (amountInput && convertBtn && resultDiv) {
        convertBtn.addEventListener('click', () => {
            const amount = parseFloat(amountInput.value);
            const rate = 41.5; // Умовний курс
            if (!isNaN(amount)) {
                const uah = (amount * rate).toFixed(2);
                resultDiv.innerHTML = `<strong>${amount} USD = ${uah} UAH</strong>`;
                resultDiv.style.color = 'green';
            } else {
                resultDiv.innerText = 'Будь ласка, введіть число';
                resultDiv.style.color = 'red';
            }
        });
    }

    // --- ЗАВДАННЯ 3: Обробка форм (Відправка на сервер) ---
    const contactForm = document.querySelector('form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const nameInput = contactForm.querySelector('input[type="text"]');
            const emailInput = contactForm.querySelector('input[type="email"]');
            const msgInput = contactForm.querySelector('textarea');

            const data = {
                name: nameInput.value,
                email: emailInput.value,
                message: msgInput.value
            };

            if (data.name.length < 3) {
                alert('Ім\'я занадто коротке!');
                return;
            }

            try {
                // Відправляємо POST запит на наш API (через Nginx proxy)
                const response = await fetch('/api/messages', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                if (response.ok) {
                    const result = await response.json();
                    alert(`Успіх! Повідомлення збережено в БД під ID: ${result.id}`);
                    contactForm.reset();
                } else {
                    alert('Помилка сервера при збереженні.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Помилка мережі.');
            }
        });
    }

    // --- ЗАВДАННЯ 4: Пасхалка (Зміна фону при кліку на футер) ---
    // (Можна клікнути внизу сторінки, щоб перевірити роботу подій)
    const body = document.body;
    const footer = document.createElement('footer');
    footer.innerHTML = `<p style="text-align:center; padding: 20px; cursor:pointer; color: #777;">&copy; ${new Date().getFullYear()} EU Lab Work. Click me!</p>`;
    document.body.appendChild(footer);

    footer.addEventListener('click', () => {
        const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
        footer.style.backgroundColor = randomColor;
        footer.querySelector('p').style.color = 'white';
    });
});
