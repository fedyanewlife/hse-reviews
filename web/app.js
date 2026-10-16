const loginLink = document.querySelector("#login-link");
const logoutButton = document.querySelector("#logout-button");
const myReviewsButton = document.querySelector("#my-reviews-button");
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
const myReviews = document.querySelector("#my-reviews");
const myReviewsBackButton = document.querySelector("#my-reviews-back");
const myReviewsTitle = document.querySelector("#my-reviews-title");
const myReviewsMessage = document.querySelector("#my-reviews-message");
const myReviewsList = document.querySelector("#my-reviews-list");
const writeReviewButton = document.querySelector("#write-review-button");
const reviewForm = document.querySelector("#review-form");
const reviewFields = document.querySelector("#review-fields");
const reviewFormMessage = document.querySelector("#review-form-message");
const submitReviewButton = document.querySelector("#submit-review-button");
const cancelReviewButton = document.querySelector("#cancel-review-button");
const reviewConsent = document.querySelector("#review-consent");
const completionYearInput = document.querySelector("#completion_year");

const ratingFields = [
    "difficulty_rating",
    "workload_rating",
    "interest_rating",
    "usefulness_rating",
    "recommendation_rating",
];
const draftFields = ["completion_year", ...ratingFields, "experience_text", "selection_advice"];
const draftStorageKey = "hse-reviews:review-draft";

let isAuthenticated = false;
let currentUserId = null;
let currentMinorId = null;
let isSubmitting = false;
let viewRequestId = 0;
let minorNames = new Map();

function setAuthState(authenticated) {
    isAuthenticated = authenticated;
    loginLink.hidden = isAuthenticated;
    logoutButton.hidden = !isAuthenticated;
    myReviewsButton.hidden = !isAuthenticated;
    content.hidden = !isAuthenticated;

    if (!isAuthenticated) {
        currentUserId = null;
        minorsList.replaceChildren();
        catalogMessage.textContent = "";
        minorNames.clear();
        showCatalog();
    }
}

function handleUnauthorized(response) {
    if (response.status !== 401) {
        return false;
    }

    const draftSaved = saveReviewDraft();
    setAuthState(false);
    authMessage.textContent = draftSaved
        ? "Сессия истекла. Войдите снова."
        : "Сессия истекла. Войдите снова. Черновик не удалось сохранить.";
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

        const user = await response.json();
        currentUserId = user.user_id;
        setAuthState(true);
        authMessage.textContent = "";
        const requestId = viewRequestId;
        await loadCatalog();

        if (isCurrentViewRequest(requestId)) {
            const draft = readReviewDraft();
            if (draft) {
                await openMinor(draft.minor_id, true);
            }
        }
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

        minorNames = new Map(data.items.map(minor => [minor.id, minor.name]));
        updateMyReviewNames();

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
    viewRequestId++;
    resetReviewForm();
    catalog.hidden = false;
    minorDetails.hidden = true;
    myReviews.hidden = true;
    minorName.textContent = "";
    minorLink.hidden = true;
    minorLink.removeAttribute("href");
    minorMessage.textContent = "";
    reviewsList.replaceChildren();
    myReviewsList.replaceChildren();
    myReviewsMessage.textContent = "";

    if (isAuthenticated) {
        catalogTitle.focus();
    }
}

function isCurrentViewRequest(requestId) {
    return isAuthenticated && requestId === viewRequestId;
}

async function openMinor(id, restoreDraft = false) {
    if (!isAuthenticated || isSubmitting) {
        return;
    }

    const requestId = ++viewRequestId;
    resetReviewForm();
    catalog.hidden = true;
    minorDetails.hidden = false;
    myReviews.hidden = true;
    minorName.textContent = "Майнор";
    minorName.focus();
    minorLink.hidden = true;
    minorLink.removeAttribute("href");
    reviewsList.replaceChildren();
    minorMessage.textContent = "Загружаем майнор…";

    try {
        const response = await fetch(`/minors/${id}`, { cache: "no-store" });

        if (handleUnauthorized(response) || !isCurrentViewRequest(requestId)) {
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

        if (!isCurrentViewRequest(requestId)) {
            return;
        }

        minorName.textContent = minor.name;
        minorLink.href = minor.hse_url;
        minorLink.hidden = false;
        currentMinorId = minor.id;
        writeReviewButton.hidden = false;
    } catch {
        if (isCurrentViewRequest(requestId)) {
            minorMessage.textContent = "Не удалось загрузить майнор. Вернитесь в каталог и попробуйте снова.";
        }
        return;
    }

    if (restoreDraft) {
        openReviewForm();
    }
    await loadMinorReviews(id, requestId);
}

async function loadMinorReviews(id, requestId) {
    minorMessage.textContent = "Загружаем отзывы…";

    try {
        const response = await fetch(`/minors/${id}/reviews`, { cache: "no-store" });

        if (handleUnauthorized(response) || !isCurrentViewRequest(requestId)) {
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

        if (!isCurrentViewRequest(requestId)) {
            return;
        }

        for (const review of data.items) {
            reviewsList.append(createReviewItem(review));
        }

        minorMessage.textContent = data.items.length === 0 ? "Опубликованных отзывов пока нет." : "";
    } catch {
        if (isCurrentViewRequest(requestId)) {
            minorMessage.textContent = "Не удалось загрузить отзывы. Вернитесь в каталог и попробуйте снова.";
        }
    }
}

function updateMyReviewNames() {
    for (const heading of myReviewsList.querySelectorAll("[data-minor-id]")) {
        heading.textContent = minorNames.get(Number(heading.dataset.minorId)) || "Название майнора недоступно";
    }
}

async function openMyReviews() {
    if (!isAuthenticated || isSubmitting) {
        return;
    }

    const requestId = ++viewRequestId;
    resetReviewForm();
    catalog.hidden = true;
    minorDetails.hidden = true;
    myReviews.hidden = false;
    myReviewsTitle.focus();
    myReviewsList.replaceChildren();
    myReviewsMessage.textContent = "Загружаем ваши отзывы…";

    try {
        const response = await fetch("/me/reviews", { cache: "no-store" });

        if (handleUnauthorized(response) || !isCurrentViewRequest(requestId)) {
            return;
        }

        if (!response.ok) {
            throw new Error("My reviews request failed");
        }

        const data = await response.json();

        if (!isCurrentViewRequest(requestId)) {
            return;
        }

        const statusLabels = {
            pending: "На проверке",
            published: "Опубликован",
            rejected: "Отклонён",
        };

        for (const review of data.items) {
            const item = createReviewItem(review);
            const name = document.createElement("h3");
            name.dataset.minorId = review.minor_id;

            const status = document.createElement("p");
            status.className = "review-status";
            status.textContent = `Статус: ${statusLabels[review.status] || "Неизвестен"}`;

            item.prepend(name, status);
            myReviewsList.append(item);
        }

        updateMyReviewNames();
        myReviewsMessage.textContent = data.items.length === 0 ? "Вы пока не оставляли отзывов." : "";
    } catch {
        if (isCurrentViewRequest(requestId)) {
            myReviewsMessage.textContent = "Не удалось загрузить ваши отзывы. Нажмите «Мои отзывы», чтобы попробовать снова.";
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

function getReviewValues() {
    const values = {};
    for (const name of draftFields) {
        values[name] = reviewForm.elements.namedItem(name).value;
    }
    return values;
}

function saveReviewDraft() {
    if (!currentUserId || !currentMinorId || reviewForm.hidden) {
        return true;
    }

    try {
        sessionStorage.setItem(draftStorageKey, JSON.stringify({
            user_id: currentUserId,
            minor_id: currentMinorId,
            fields: getReviewValues(),
        }));
        return true;
    } catch {
        return false;
    }
}

function clearReviewDraft() {
    try {
        sessionStorage.removeItem(draftStorageKey);
    } catch {
        // The form still works when browser storage is unavailable.
    }
}

function readReviewDraft() {
    try {
        const draft = JSON.parse(sessionStorage.getItem(draftStorageKey));
        if (!draft) {
            return null;
        }

        if (draft.user_id !== currentUserId || !Number.isInteger(draft.minor_id) ||
            draft.minor_id <= 0 || !draft.fields || typeof draft.fields !== "object") {
            clearReviewDraft();
            return null;
        }

        return draft;
    } catch {
        clearReviewDraft();
        return null;
    }
}

function resetReviewForm() {
    currentMinorId = null;
    reviewForm.hidden = true;
    reviewForm.reset();
    reviewFormMessage.textContent = "";
    writeReviewButton.hidden = true;
    writeReviewButton.disabled = false;
}

function cancelReviewForm() {
    if (isSubmitting) {
        return;
    }

    const draft = readReviewDraft();
    if (draft && draft.minor_id === currentMinorId) {
        clearReviewDraft();
    }
    reviewForm.hidden = true;
    reviewForm.reset();
    reviewFormMessage.textContent = "";
    writeReviewButton.hidden = false;
    writeReviewButton.focus();
}

async function openReviewForm() {
    if (!isAuthenticated || !currentMinorId || isSubmitting || writeReviewButton.disabled) {
        return;
    }

    const requestId = viewRequestId;
    writeReviewButton.disabled = true;
    reviewFormMessage.textContent = "Проверяем возможность отправки…";

    try {
        const response = await fetch("/me/reviews", { cache: "no-store" });

        if (handleUnauthorized(response) || !isCurrentViewRequest(requestId)) {
            return;
        }
        if (!response.ok) {
            throw new Error("Review eligibility check failed");
        }

        const data = await response.json();
        if (!isCurrentViewRequest(requestId)) {
            return;
        }

        if (data.items.some(review => review.status === "pending" || review.status === "published")) {
            reviewFormMessage.textContent = "У вас уже есть отзыв на проверке или опубликованный отзыв. Посмотрите раздел «Мои отзывы».";
            return;
        }

        reviewForm.reset();
        completionYearInput.max = String(new Date().getFullYear());
        const draft = readReviewDraft();
        const hasDraft = draft && draft.minor_id === currentMinorId;
        if (hasDraft) {
            for (const name of draftFields) {
                const value = draft.fields[name];
                reviewForm.elements.namedItem(name).value = typeof value === "string" ? value : "";
            }
        }

        reviewConsent.checked = false;
        reviewForm.hidden = false;
        writeReviewButton.hidden = true;
        reviewFormMessage.textContent = hasDraft ? "Черновик восстановлен. Проверьте поля и подтвердите согласие." : "";
        completionYearInput.focus();
    } catch {
        if (isCurrentViewRequest(requestId)) {
            reviewFormMessage.textContent = "Не удалось проверить возможность отправки. Нажмите «Оставить отзыв», чтобы попробовать снова.";
        }
    } finally {
        if (isCurrentViewRequest(requestId)) {
            writeReviewButton.disabled = false;
        }
    }
}

function setSubmitting(submitting) {
    isSubmitting = submitting;
    reviewFields.disabled = submitting;
    for (const button of [backToCatalogButton, myReviewsBackButton, myReviewsButton, logoutButton, writeReviewButton]) {
        button.disabled = submitting;
    }
    submitReviewButton.textContent = submitting ? "Отправляем…" : "Отправить отзыв";
}

async function submitReview(event) {
    event.preventDefault();
    if (!isAuthenticated || isSubmitting || logoutButton.disabled || reviewForm.hidden || !reviewForm.reportValidity()) {
        return;
    }

    const requestId = viewRequestId;
    const values = getReviewValues();
    const payload = {
        minor_id: currentMinorId,
        completion_year: values.completion_year === "" ? null : Number(values.completion_year),
        experience_text: values.experience_text,
        selection_advice: values.selection_advice,
    };
    for (const name of ratingFields) {
        payload[name] = Number(values[name]);
    }

    saveReviewDraft();
    setSubmitting(true);
    reviewFormMessage.textContent = "Отправляем отзыв…";

    try {
        const response = await fetch("/reviews", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (handleUnauthorized(response)) {
            return;
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            if (isCurrentViewRequest(requestId)) {
                reviewFormMessage.textContent = errorData?.error || "Не удалось отправить отзыв. Попробуйте снова.";
                if (response.status === 409) {
                    reviewForm.hidden = true;
                    writeReviewButton.hidden = false;
                }
            }
            return;
        }

        clearReviewDraft();
    } catch {
        if (isCurrentViewRequest(requestId)) {
            reviewFormMessage.textContent = "Не удалось подтвердить отправку. Проверьте «Мои отзывы» перед повторной попыткой.";
        }
        return;
    } finally {
        setSubmitting(false);
    }

    resetReviewForm();
    if (isAuthenticated) {
        await openMyReviews();
    }
    authMessage.textContent = isAuthenticated
        ? "Отзыв отправлен на проверку."
        : "Отзыв отправлен на проверку. Войдите снова, чтобы увидеть его.";
}

async function logout() {
    if (isSubmitting) {
        return;
    }

    logoutButton.disabled = true;
    authMessage.textContent = "";

    try {
        const response = await fetch("/auth/logout", { method: "POST" });

        if (!response.ok && response.status !== 401) {
            throw new Error("Logout failed");
        }

        clearReviewDraft();
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
myReviewsBackButton.addEventListener("click", showCatalog);
myReviewsButton.addEventListener("click", openMyReviews);
writeReviewButton.addEventListener("click", openReviewForm);
cancelReviewButton.addEventListener("click", cancelReviewForm);
reviewForm.addEventListener("input", saveReviewDraft);
reviewForm.addEventListener("submit", submitReview);
loginLink.addEventListener("click", event => {
    if (isSubmitting) {
        event.preventDefault();
    }
});
checkSession();
