const HOSTS = ['https://hostgta.ru', 'https://hostgta.com'];

// При установке
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === "install") {
        chrome.tabs.create({ url: "https://hostgtafree.tatnet.app/welcome" });
    }
    // Создаем будильник для проверки каждые 6 часов
    chrome.alarms.create("checkServers", { periodInMinutes: 360 });
    checkAllServers();
});

// При удалении (через setUninstallURL)
chrome.runtime.setUninstallURL("https://hostgtafree.tatnet.app/feedback");

// Слушатель будильника
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "checkServers") {
        checkAllServers();
    }
});

async function checkAllServers() {
    for (const host of HOSTS) {
        try {
            // Добавляем credentials: 'include' чтобы передавались куки сессии
            const response = await fetch(`${host}/web`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            
            const text = await response.text();

            // Более надежная проверка авторизации
            if (text.includes('btn-login') && !text.includes('exitgood')) {
                console.log(`Not authorized on ${host}`);
                chrome.storage.local.set({ [`auth_${host}`]: false, [`servers_${host}`]: [] });
                continue;
            }

            chrome.storage.local.set({ [`auth_${host}`]: true });
            
            const servers = parseServers(text);
            console.log(`Found ${servers.length} servers on ${host}`);
            
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
    // Улучшенный парсинг: ищем блоки с ID и днями более глобально
    const serverBlocks = html.split('table-content__row').slice(1);
    
    serverBlocks.forEach(block => {
        const idMatch = block.match(/\/web\/base\/(\d+)/);
        const daysMatch = block.match(/(\d+)\s+(дней|дня|день)/);
        
        if (idMatch) {
            servers.push({
                id: idMatch[1],
                daysLeft: daysMatch ? parseInt(daysMatch[1]) : 0,
                status: block.includes('Активен') ? 'active' : 'inactive'
            });
        }
    });
    return servers;
}

async function renewServer(host, serverId) {
    try {
        // Важно: передаем credentials для POST запроса
        await fetch(`${host}/web/time/${serverId}`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'time=30'
        });
    } catch (e) {
        console.error("Renew failed", e);
    }
}

// Слушатель сообщений от Popup для мгновенной проверки
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "checkNow") {
        checkAllServers().then(() => sendResponse({success: true}));
        return true;
    }
});

function showNotification(serverId, days) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'HostGta Free: Сервер продлен!',
        message: `Ваш веб-сервер #${serverId} автоматически продлен на 30 дней (оставалось: ${days} дн.)`,
        priority: 2
    });
}
