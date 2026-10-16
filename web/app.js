const loginLink = document.querySelector("#login-link");
const logoutButton = document.querySelector("#logout-button");
const authMessage = document.querySelector("#auth-message");
const catalog = document.querySelector("#catalog");
const catalogMessage = document.querySelector("#catalog-message");
const minorsList = document.querySelector("#minors-list");

let isAuthenticated = false;

function setAuthState(authenticated) {
    isAuthenticated = authenticated;
    loginLink.hidden = isAuthenticated;
    logoutButton.hidden = !isAuthenticated;
    catalog.hidden = !isAuthenticated;

    if (!isAuthenticated) {
        minorsList.replaceChildren();
        catalogMessage.textContent = "";
    }
}

async function checkSession() {
    try {
        const response = await fetch("/me", { cache: "no-store" });

        if (response.status === 401) {
            setAuthState(false);
            authMessage.textContent = "Войдите, чтобы продолжить.";
            return;
        }

        if (!response.ok) {
            throw new Error("Session check failed");
        }

        setAuthState(true);
        authMessage.textContent = "";
        await loadCatalog();
    } catch {
        authMessage.textContent = "Не удалось проверить вход. Обновите страницу.";
    }
}

async function loadCatalog() {
    minorsList.replaceChildren();
    catalogMessage.textContent = "Загружаем каталог…";

    try {
        const response = await fetch("/minors", { cache: "no-store" });

        if (!isAuthenticated) {
            return;
        }

        if (response.status === 401) {
            setAuthState(false);
            authMessage.textContent = "Сессия истекла. Войдите снова.";
            return;
        }

        if (!response.ok) {
            throw new Error("Catalog request failed");
        }

        const data = await response.json();

        if (!isAuthenticated) {
            return;
        }

        for (const minor of data.items) {
            const item = document.createElement("li");
            const name = document.createElement("h3");
            name.textContent = minor.name;

            const link = document.createElement("a");
            link.href = minor.hse_url;
            link.textContent = "Страница на сайте ВШЭ";
            link.target = "_blank";
            link.rel = "noopener noreferrer";

            item.append(name, link);
            minorsList.append(item);
        }

        catalogMessage.textContent = data.items.length === 0 ? "Каталог пока пуст." : "";
    } catch {
        if (isAuthenticated) {
            catalogMessage.textContent = "Не удалось загрузить каталог. Обновите страницу, чтобы попробовать снова.";
        }
    }
}

async function logout() {
    logoutButton.disabled = true;
    authMessage.textContent = "";

    try {
        const response = await fetch("/auth/logout", { method: "POST" });

        if (!response.ok && response.status !== 401) {
            throw new Error("Logout failed");
        }

        setAuthState(false);
        if (response.status === 401) {
            authMessage.textContent = "Сессия истекла. Войдите снова.";
        }
    } catch {
        authMessage.textContent = "Не удалось выйти. Попробуйте ещё раз.";
    } finally {
        logoutButton.disabled = false;
    }
}

logoutButton.addEventListener("click", logout);
checkSession();
