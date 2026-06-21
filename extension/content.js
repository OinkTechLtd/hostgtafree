// Этот скрипт просто уведомляет расширение, что пользователь зашел в кабинет
chrome.runtime.sendMessage({ action: "checkNow" });
console.log("HostGta Free: Данные обновлены из кабинета");
