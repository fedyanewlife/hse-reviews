const loginLink = document.querySelector("#login-link");
const logoutButton = document.querySelector("#logout-button");
const authMessage = document.querySelector("#auth-message");
const content = document.querySelector("#content");
const catalog = document.querySelector("#catalog");
const catalogTitle = document.querySelector("#catalog-title");
const catalogMessage = document.querySelector("#catalog-message");
const minorsList = document.querySelector("#minors-list");
const minorDetails = document.querySelector("#minor-details");
const backToCatalogButton = document.querySelector("#back-to-catalog");
const minorName = document.querySelector("#minor-name");
const minorLink = document.querySelector("#minor-link");
const minorMessage = document.querySelector("#minor-message");
const reviewsList = document.querySelector("#reviews-list");

let isAuthenticated = false;
let minorRequestId = 0;

function setAuthState(authenticated) {
    isAuthenticated = authenticated;
    loginLink.hidden = isAuthenticated;
    logoutButton.hidden = !isAuthenticated;
    content.hidden = !isAuthenticated;

    if (!isAuthenticated) {
        minorsList.replaceChildren();
        catalogMessage.textContent = "";
        showCatalog();
    }
}

function handleUnauthorized(response) {
    if (response.status !== 401) {
        return false;
    }

    setAuthState(false);
    authMessage.textContent = "Сессия истекла. Войдите снова.";
    return true;
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

        if (handleUnauthorized(response)) {
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

            const reviewsButton = document.createElement("button");
            reviewsButton.type = "button";
            reviewsButton.className = "button";
            reviewsButton.textContent = "Отзывы";
            reviewsButton.addEventListener("click", () => openMinor(minor.id));

            const actions = document.createElement("div");
            actions.className = "minor-actions";
            actions.append(reviewsButton, link);

            item.append(name, actions);
            minorsList.append(item);
        }

        catalogMessage.textContent = data.items.length === 0 ? "Каталог пока пуст." : "";
    } catch {
        if (isAuthenticated) {
            catalogMessage.textContent = "Не удалось загрузить каталог. Обновите страницу, чтобы попробовать снова.";
        }
    }
}

function showCatalog() {
    minorRequestId++;
    catalog.hidden = false;
    minorDetails.hidden = true;
    minorName.textContent = "";
    minorLink.hidden = true;
    minorLink.removeAttribute("href");
    minorMessage.textContent = "";
    reviewsList.replaceChildren();

    if (isAuthenticated) {
        catalogTitle.focus();
    }
}

function isCurrentMinorRequest(requestId) {
    return isAuthenticated && requestId === minorRequestId;
}

async function openMinor(id) {
    if (!isAuthenticated) {
        return;
    }

    const requestId = ++minorRequestId;
    catalog.hidden = true;
    minorDetails.hidden = false;
    minorName.textContent = "Майнор";
    minorName.focus();
    minorLink.hidden = true;
    minorLink.removeAttribute("href");
    reviewsList.replaceChildren();
    minorMessage.textContent = "Загружаем майнор…";

    try {
        const response = await fetch(`/minors/${id}`, { cache: "no-store" });

        if (handleUnauthorized(response) || !isCurrentMinorRequest(requestId)) {
            return;
        }

        if (response.status === 404) {
            minorMessage.textContent = "Майнор не найден.";
            return;
        }

        if (!response.ok) {
            throw new Error("Minor request failed");
        }

        const minor = await response.json();

        if (!isCurrentMinorRequest(requestId)) {
            return;
        }

        minorName.textContent = minor.name;
        minorLink.href = minor.hse_url;
        minorLink.hidden = false;
    } catch {
        if (isCurrentMinorRequest(requestId)) {
            minorMessage.textContent = "Не удалось загрузить майнор. Вернитесь в каталог и попробуйте снова.";
        }
        return;
    }

    await loadMinorReviews(id, requestId);
}

async function loadMinorReviews(id, requestId) {
    minorMessage.textContent = "Загружаем отзывы…";

    try {
        const response = await fetch(`/minors/${id}/reviews`, { cache: "no-store" });

        if (handleUnauthorized(response) || !isCurrentMinorRequest(requestId)) {
            return;
        }

        if (response.status === 404) {
            minorMessage.textContent = "Майнор не найден.";
            return;
        }

        if (!response.ok) {
            throw new Error("Reviews request failed");
        }

        const data = await response.json();

        if (!isCurrentMinorRequest(requestId)) {
            return;
        }

        for (const review of data.items) {
            reviewsList.append(createReviewItem(review));
        }

        minorMessage.textContent = data.items.length === 0 ? "Опубликованных отзывов пока нет." : "";
    } catch {
        if (isCurrentMinorRequest(requestId)) {
            minorMessage.textContent = "Не удалось загрузить отзывы. Вернитесь в каталог и попробуйте снова.";
        }
    }
}

function createReviewItem(review) {
    const item = document.createElement("li");
    item.className = "review";

    if (review.completion_year !== null) {
        const year = document.createElement("p");
        year.textContent = `Год окончания майнора: ${review.completion_year}`;
        item.append(year);
    }

    const ratings = document.createElement("ul");
    ratings.className = "review-ratings";

    for (const [label, value] of [
        ["Сложность", review.difficulty_rating],
        ["Нагрузка", review.workload_rating],
        ["Интерес", review.interest_rating],
        ["Полезность", review.usefulness_rating],
        ["Готовность рекомендовать", review.recommendation_rating],
    ]) {
        const rating = document.createElement("li");
        rating.textContent = `${label}: ${value} / 5`;
        ratings.append(rating);
    }

    item.append(ratings);

    for (const [label, text] of [
        ["Опыт прохождения", review.experience_text],
        ["Советы по выбору", review.selection_advice],
    ]) {
        if (text) {
            const heading = document.createElement("h4");
            heading.textContent = label;
            const paragraph = document.createElement("p");
            paragraph.className = "review-text";
            paragraph.textContent = text;
            item.append(heading, paragraph);
        }
    }

    return item;
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
backToCatalogButton.addEventListener("click", showCatalog);
checkSession();
