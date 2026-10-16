const loginLink = document.querySelector("#login-link");
const logoutButton = document.querySelector("#logout-button");
const authMessage = document.querySelector("#auth-message");

function setAuthState(isAuthenticated) {
    loginLink.hidden = isAuthenticated;
    logoutButton.hidden = !isAuthenticated;
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
    } catch {
        authMessage.textContent = "Не удалось проверить вход. Обновите страницу.";
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
