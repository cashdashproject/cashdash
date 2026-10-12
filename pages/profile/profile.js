const account = window.CashDashAccount;
const user = account.currentUser();

if (!user) {
    window.location.replace("../register/register.html?mode=login");
} else {
    const profileForm = document.querySelector("#profile-form");
    const avatarInput = document.querySelector("#avatar-input");
    const avatarPreview = document.querySelector("#avatar-preview");
    let avatarData = user.avatar || "";

    function initials(name) {
        return name.trim().slice(0, 1).toLocaleUpperCase("uk") || "К";
    }

    function renderAvatar(name) {
        avatarPreview.innerHTML = avatarData
            ? `<img src="${avatarData}" alt="Фото профілю">`
            : `<span>${initials(name)}</span>`;
    }

    function renderStats(profile) {
        const bets = profile.bets || [];
        document.querySelector("#stat-bets").textContent = String(bets.length);
        document.querySelector("#stat-stake").textContent = `${bets.reduce((sum, bet) => sum + Number(bet.stake || 0), 0).toFixed(2)} ₴`;
        let favorites = [];
        try {
            favorites = JSON.parse(localStorage.getItem("cashdash-favorites") || "[]");
        } catch {
            favorites = [];
        }
        document.querySelector("#stat-favorites").textContent = String(favorites.length);
        const history = document.querySelector("#bet-history");
        history.replaceChildren();
        if (!bets.length) {
            const empty = document.createElement("p");
            empty.className = "history-empty";
            empty.textContent = "Тут з’являться ваші демо-ставки.";
            history.append(empty);
            return;
        }
        bets.slice().reverse().forEach((bet) => {
            const item = document.createElement("article");
            item.className = "history-item";
            const description = document.createElement("div");
            const selections = document.createElement("strong");
            selections.textContent = (bet.selections || []).map((selection) => `${selection.eventLabel || "Подія"}: ${selection.choice}`).join(" · ") || "Демо-ставка";
            const date = document.createElement("time");
            date.dateTime = bet.createdAt;
            date.textContent = new Date(bet.createdAt).toLocaleString("uk-UA", { dateStyle: "medium", timeStyle: "short" });
            description.append(selections, date);
            const amount = document.createElement("span");
            amount.className = "history-stake";
            amount.textContent = `${Number(bet.stake).toFixed(2)} ₴`;
            item.append(description, amount);
            history.append(item);
        });
    }

    profileForm.elements.name.value = user.name;
    profileForm.elements.email.value = user.email;
    profileForm.elements.phone.value = user.phone;
    renderAvatar(user.name);
    renderStats(user);

    avatarInput.addEventListener("change", () => {
        const file = avatarInput.files?.[0];
        if (!file) return;
        if (!file.type.startsWith("image/") || file.size > 1024 * 1024) {
            document.querySelector("#profile-status").textContent = "Оберіть зображення розміром до 1 МБ.";
            avatarInput.value = "";
            return;
        }
        const reader = new FileReader();
        reader.addEventListener("load", () => {
            avatarData = String(reader.result);
            renderAvatar(profileForm.elements.name.value);
        });
        reader.readAsDataURL(file);
    });

    document.querySelector("#remove-avatar").addEventListener("click", () => {
        avatarData = "";
        avatarInput.value = "";
        renderAvatar(profileForm.elements.name.value);
    });

    profileForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const status = document.querySelector("#profile-status");
        try {
            const updated = account.updateProfile({
                name: profileForm.elements.name.value.trim(),
                email: profileForm.elements.email.value.trim(),
                phone: profileForm.elements.phone.value.trim(),
                avatar: avatarData
            });
            status.textContent = "Зміни збережено.";
            account.renderHeader();
            renderAvatar(updated.name);
        } catch (error) {
            status.textContent = error.message;
        }
    });

    document.querySelector("#password-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const status = document.querySelector("#password-status");
        try {
            await account.changePassword(form.elements.currentPassword.value, form.elements.newPassword.value);
            form.reset();
            status.textContent = "Пароль оновлено.";
        } catch (error) {
            status.textContent = error.message;
        }
    });

    document.querySelector("#logout-button").addEventListener("click", account.logout);
}