async function updateUI() {
    const app = document.getElementById('app');
    const dataRu = await chrome.storage.local.get('servers_https://hostgta.ru');
    const dataCom = await chrome.storage.local.get('servers_https://hostgta.com');
    
    const servers = [
        ...(dataRu['servers_https://hostgta.ru'] || []),
        ...(dataCom['servers_https://hostgta.com'] || [])
    ];

    if (servers.length === 0) {
        app.innerHTML = `
            <div class="no-auth">
                <p>Серверы не найдены или вы не авторизованы.</p>
                <button class="btn" onclick="window.open('https://hostgta.ru/web')">Войти в кабинет</button>
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

updateUI();
// Обновляем данные при открытии
chrome.runtime.sendMessage({ action: "checkNow" });
