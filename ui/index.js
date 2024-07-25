const API_ROOT = "http://127.0.0.1:3000";
const credForm = document.querySelector(".credentials-form");
const loginButton = document.getElementById("login-button");
const registerButton = document.getElementById("register-button");

const handleFormSubmission = async (ev, route) => {
    ev.preventDefault();

    const formData = new FormData(credForm);
    const entries = Object.fromEntries(formData.entries());
    const res = await fetch(`${API_ROOT}/${route}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(entries),
    });

    if (res.ok) {
        const authData = await res.json();
        localStorage.setItem("authData", JSON.stringify(authData));
        window.location.replace("./task.html");
    }
}; 

loginButton.addEventListener("click", async (ev) => handleFormSubmission(ev, "login"));
registerButton.addEventListener("click", async (ev) => handleFormSubmission(ev, "register"));

document.addEventListener("DOMContentLoaded", () => {
    if (JSON.parse(localStorage.getItem("authData"))) {
        window.location.replace("./task.html");
    }
});
