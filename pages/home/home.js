const sidebar = document.querySelector(".sidebar");
const sidebarActions = document.querySelectorAll("[data-sidebar-action]");
const panel = document.querySelector("#sidebar-panel");
const panelTitle = document.querySelector("#sidebar-panel-title");
const panelContent = document.querySelector("#sidebar-panel-content");
const panelClose = document.querySelector("#sidebar-panel-close");

const panelViews = {
    bonuses: {
        title: "Бонуси",
        content: '<div class="bonus-offer"><span class="bonus-icon">🎁</span><div><h3>Стартовий бонус</h3><p>Зареєструйте акаунт, щоб переглянути доступні пропозиції.</p></div></div><a class="btn btn-register" href="../register/register.html">До реєстрації</a>'
    },
    support: {
        title: "Підтримка",
        content: '<p>Потрібна допомога? Перевірте, чи є відповідь на ваше питання:</p><details><summary>Як створити акаунт?</summary><p>Натисніть «Реєстрація» та заповніть форму.</p></details><details><summary>Де знайти бонуси?</summary><p>Доступні пропозиції з’являться після входу в акаунт.</p></details><a class="btn btn-register" href="../register/register.html">Перейти до реєстрації</a>'
    },
    settings: {
        title: "Налаштування",
        content: '<label class="setting-row"><span>Звукові ефекти</span><input type="checkbox" data-setting="sound"></label><label class="setting-row"><span>Сповіщення</span><input type="checkbox" data-setting="notifications"></label><p class="settings-note">Налаштування зберігаються на цьому пристрої.</p>'
    }
};

function openPanel(viewName) {
    const view = panelViews[viewName];
    if (!view || !panel) return;

    panelTitle.textContent = view.title;
    panelContent.innerHTML = view.content;
    panel.showModal();

    panel.querySelectorAll("[data-setting]").forEach((control) => {
        const key = `cashdash-${control.dataset.setting}`;
        control.checked = localStorage.getItem(key) === "true";
        control.addEventListener("change", () => {
            localStorage.setItem(key, String(control.checked));
        });
    });
}

sidebarActions.forEach((button) => {
    button.addEventListener("click", () => {
        const action = button.dataset.sidebarAction;

        if (action === "menu") {
            const expanded = sidebar.classList.toggle("expanded");
            button.setAttribute("aria-expanded", String(expanded));
            return;
        }

        if (action === "live") {
            document.querySelector(".sports-section")?.scrollIntoView({ behavior: "smooth" });
            return;
        }

        openPanel(action);
    });
});

panelClose?.addEventListener("click", () => panel.close());
panel?.addEventListener("click", (event) => {
    if (event.target === panel) panel.close();
});
