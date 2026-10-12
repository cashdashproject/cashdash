const form = document.querySelector(".register-form");
const authToggle = document.querySelector("[data-auth-toggle]");
const heading = document.querySelector(".card-header h2");
const bonusTag = document.querySelector(".bonus-tag");
const submitLabel = form.querySelector("button[type='submit'] span");
const footerText = authToggle.parentElement;
const usernameGroup = document.querySelector("#username").closest(".form-group");
const phoneGroup = document.querySelector("#phone").closest(".form-group");
const ageGroup = document.querySelector(".checkbox-group");
const status = document.createElement("p");
status.className = "auth-status";
status.setAttribute("role", "status");
form.prepend(status);

let loginMode = new URLSearchParams(window.location.search).get("mode") === "login";

function setMode(isLogin) {
    loginMode = isLogin;
    heading.textContent = isLogin ? "УВІЙТИ" : "ЗАРЕЄСТРУВАТИСЯ";
    bonusTag.hidden = isLogin;
    usernameGroup.hidden = isLogin;
    phoneGroup.hidden = isLogin;
    ageGroup.hidden = isLogin;
    document.querySelector("#username").required = !isLogin;
    document.querySelector("#phone").required = !isLogin;
    ageGroup.querySelector("input").required = !isLogin;
    submitLabel.textContent = isLogin ? "УВІЙТИ" : "СУПЕР СТАРТ";
    footerText.innerHTML = isLogin
        ? 'Ще не маєте акаунта? <a href="#" class="link-login" data-auth-toggle>ЗАРЕЄСТРУВАТИСЯ</a>'
        : 'Вже маєте акаунт? <a href="#" class="link-login" data-auth-toggle>УВІЙТИ</a>';
    status.textContent = "";
    authToggle.removeEventListener("click", toggleMode);
    footerText.querySelector("[data-auth-toggle]").addEventListener("click", toggleMode);
}

function toggleMode(event) {
    event.preventDefault();
    setMode(!loginMode);
}

authToggle.addEventListener("click", toggleMode);
form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = form.querySelector("button[type='submit']");
    const formData = new FormData(form);
    status.textContent = "";
    submitButton.disabled = true;
    try {
        if (loginMode) {
            await window.CashDashAccount.login(formData.get("email"), formData.get("password"));
        } else {
            await window.CashDashAccount.register({
                name: formData.get("username"),
                email: formData.get("email"),
                phone: formData.get("phone"),
                password: formData.get("password")
            });
        }
        window.location.href = "../home/home.html";
    } catch (error) {
        status.textContent = error.message;
    } finally {
        submitButton.disabled = false;
    }
});

setMode(loginMode);