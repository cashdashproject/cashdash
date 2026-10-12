(function () {
    const USERS_KEY = "cashdash-users";
    const SESSION_KEY = "cashdash-session";

    function readUsers() {
        try {
            return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
        } catch {
            return [];
        }
    }

    function writeUsers(users) {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    function currentUser() {
        const userId = localStorage.getItem(SESSION_KEY);
        return readUsers().find((user) => user.id === userId) || null;
    }

    async function hashPassword(password, salt) {
        if (!window.crypto?.subtle) {
            throw new Error("Для входу відкрийте сайт через локальний сервер або HTTPS.");
        }
        const input = new TextEncoder().encode(`${salt}:${password}`);
        const digest = await window.crypto.subtle.digest("SHA-256", input);
        return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    }

    function createSalt() {
        return Array.from(window.crypto.getRandomValues(new Uint8Array(16)), (byte) => byte.toString(16).padStart(2, "0")).join("");
    }

    async function register({ name, email, phone, password }) {
        const users = readUsers();
        const normalizedEmail = email.trim().toLocaleLowerCase("uk");
        if (users.some((user) => user.email.toLocaleLowerCase("uk") === normalizedEmail)) {
            throw new Error("Акаунт із такою електронною поштою вже існує.");
        }
        const salt = createSalt();
        const user = {
            id: window.crypto.randomUUID(),
            name: name.trim(),
            email: normalizedEmail,
            phone: phone.trim(),
            avatar: "",
            salt,
            passwordHash: await hashPassword(password, salt),
            bets: [],
            createdAt: new Date().toISOString()
        };
        users.push(user);
        writeUsers(users);
        localStorage.setItem(SESSION_KEY, user.id);
        return user;
    }

    async function login(email, password) {
        const normalizedEmail = email.trim().toLocaleLowerCase("uk");
        const user = readUsers().find((entry) => entry.email.toLocaleLowerCase("uk") === normalizedEmail);
        if (!user || await hashPassword(password, user.salt) !== user.passwordHash) {
            throw new Error("Неправильна електронна пошта або пароль.");
        }
        localStorage.setItem(SESSION_KEY, user.id);
        return user;
    }

    function updateProfile(updates) {
        const users = readUsers();
        const index = users.findIndex((user) => user.id === localStorage.getItem(SESSION_KEY));
        if (index < 0) throw new Error("Увійдіть у свій акаунт, щоб змінити профіль.");
        const normalizedEmail = updates.email?.trim().toLocaleLowerCase("uk");
        if (normalizedEmail && users.some((user, userIndex) => userIndex !== index && user.email.toLocaleLowerCase("uk") === normalizedEmail)) {
            throw new Error("Ця електронна пошта вже використовується.");
        }
        users[index] = { ...users[index], ...updates };
        if (normalizedEmail) users[index].email = normalizedEmail;
        writeUsers(users);
        return users[index];
    }

    async function changePassword(currentPassword, newPassword) {
        const user = currentUser();
        if (!user || await hashPassword(currentPassword, user.salt) !== user.passwordHash) {
            throw new Error("Поточний пароль введено неправильно.");
        }
        const salt = createSalt();
        return updateProfile({ salt, passwordHash: await hashPassword(newPassword, salt) });
    }

    function recordDemoBet(bet) {
        const user = currentUser();
        if (!user) return;
        const users = readUsers();
        const index = users.findIndex((entry) => entry.id === user.id);
        users[index].bets = [...(users[index].bets || []), { ...bet, createdAt: new Date().toISOString() }];
        writeUsers(users);
    }

    function renderHeader() {
        document.querySelectorAll("[data-account-actions]").forEach((container) => {
            const user = currentUser();
            if (!user) {
                const loginLink = document.createElement("a");
                loginLink.className = "btn btn-login top-link";
                loginLink.href = "../register/register.html?mode=login";
                loginLink.textContent = "Увійти";
                const registerLink = document.createElement("a");
                registerLink.className = "btn btn-register top-cta";
                registerLink.href = "../register/register.html";
                registerLink.textContent = "Реєстрація";
                container.replaceChildren(loginLink, registerLink);
                return;
            }
            const initials = user.name.trim().slice(0, 1).toLocaleUpperCase("uk") || "К";
            const profileLink = document.createElement("a");
            profileLink.className = "account-link";
            profileLink.href = "../profile/profile.html";
            profileLink.setAttribute("aria-label", `Профіль ${user.name}`);
            profileLink.title = `Профіль ${user.name}`;
            if (user.avatar) {
                const image = document.createElement("img");
                image.src = user.avatar;
                image.alt = "";
                image.className = "account-avatar-image";
                profileLink.append(image);
            } else {
                const label = document.createElement("span");
                label.className = "account-avatar-initials";
                label.textContent = initials;
                profileLink.append(label);
            }
            container.replaceChildren(profileLink);
        });
    }

    function logout() {
        localStorage.removeItem(SESSION_KEY);
        window.location.href = "../home/home.html";
    }

    window.CashDashAccount = { currentUser, register, login, updateProfile, changePassword, recordDemoBet, renderHeader, logout };
    renderHeader();
})();