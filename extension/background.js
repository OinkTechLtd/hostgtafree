const HOSTS = ['https://hostgta.ru', 'https://hostgta.com'];

// При установке
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        chrome.tabs.create({ url: "https://tatnet.ru/hostgta-welcome" });
    }
    // Создаем будильник для проверки каждые 6 часов
    chrome.alarms.create("checkServers", { periodInMinutes: 360 });
    checkAllServers();
});

// При удалении (через setUninstallURL)
chrome.runtime.setUninstallURL("https://tatnet.ru/hostgta-feedback");

// Слушатель будильника
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "checkServers") {
        checkAllServers();
    }
});

async function checkAllServers() {
    for (const host of HOSTS) {
        try {
            const response = await fetch(`${host}/web`);
            const text = await response.text();
            
            // Парсинг серверов из HTML
            const servers = parseServers(text);
            
            for (const server of servers) {
                // Если осталось 3 дня или меньше (и больше 0)
                if (server.daysLeft <= 3 && server.daysLeft > 0) {
                    await renewServer(host, server.id);
                    showNotification(server.id, server.daysLeft);
                }
            }
            
            chrome.storage.local.set({ [`servers_${host}`]: servers, lastCheck: Date.now() });
        } catch (e) {
            console.error(`Error checking ${host}:`, e);
        }
    }
}

function parseServers(html) {
    const servers = [];
    // Регулярка для поиска строк таблицы с серверами на основе предоставленной разметки
    // Ищем ID из ссылки /web/base/ID и текст "X дней"
    const rowRegex = /table-content__row">([\s\S]*?)<\/div>\s*<\/div>/g;
    const idRegex = /\/web\/base\/(\={0,1}\d+)/;
    const daysRegex = /(\d+)\s+дней|дня|день/;

    let match;
    while ((match = rowRegex.exec(html)) !== null) {
        const rowHtml = match[1];
        const idMatch = rowHtml.match(idRegex);
        const daysMatch = rowHtml.match(daysRegex);

        if (idMatch) {
            servers.push({
                id: idMatch[1],
                daysLeft: daysMatch ? parseInt(daysMatch[1]) : 99,
                status: rowHtml.includes("Активен") ? "active" : "inactive"
            });
        }
    }
    return servers;
}

async function renewServer(host, serverId) {
    // Эмуляция POST запроса на продление на 30 дней
    // Судя по скриншоту, запрос идет на /web/time/ID
    try {
        await fetch(`${host}/web/time/${serverId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'time=30' // Продление на 30 дней
        });
    } catch (e) {
        console.error("Renew failed", e);
    }
}

function showNotification(serverId, days) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'HostGta Free: Сервер продлен!',
        message: `Ваш веб-сервер #${serverId} автоматически продлен на 30 дней (оставалось: ${days} дн.)`,
        priority: 2
    });
}
