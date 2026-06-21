async function updateUI() {
    const app = document.getElementById('app');
    const dataRu = await chrome.storage.local.get('servers_https://hostgta.ru');
    const dataCom = await chrome.storage.local.get('servers_https://hostgta.com');
    
    const servers = [
        ...(dataRu['servers_https://hostgta.ru'] || []),
        ...(dataCom['servers_https://hostgta.com'] || [])
    ];

    const isAuthRu = (await chrome.storage.local.get('auth_https://hostgta.ru'))['auth_https://hostgta.ru'];
    const isAuthCom = (await chrome.storage.local.get('auth_https://hostgta.com'))['auth_https://hostgta.com'];

    if (servers.length === 0) {
        let statusText = !isAuthRu && !isAuthCom 
            ? "Вы не авторизованы ни на одном из сайтов."
            : "Серверы не найдены в вашем аккаунте.";
            
        app.innerHTML = `
            <div class="no-auth">
                <p>${statusText}</p>
                <div style="display:flex; gap:10px;">
                    <button class="btn" id="open-ru">HostGta.RU</button>
                    <button class="btn" id="open-com">HostGta.COM</button>
                </div>
            </div>
        `;
        return;
    }

    app.innerHTML = servers.map(s => `
        <div class="server-card">
            <div class="server-id">ID: #${s.id}</div>
            <div class="server-days">${s.daysLeft} дней</div>
            <div class="status-active">● Активен (Авто-продление)</div>
        </div>
    `).join('');
}

// Слушатель кликов (вместо onclick в HTML)
document.addEventListener('click', (e) => {
    if (e.target.id === 'open-ru') window.open('https://hostgta.ru/web');
    if (e.target.id === 'open-com') window.open('https://hostgta.com/web');
});

updateUI();

// Обновляем данные при открытии и перерисовываем интерфейс
chrome.runtime.sendMessage({ action: "checkNow" }, () => {
    setTimeout(updateUI, 500); // Небольшая задержка чтобы данные успели сохраниться
});
