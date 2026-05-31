const loginForm = document.querySelector("#studioLoginForm");
const loginStatus = document.querySelector("#loginStatus");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(loginForm);
  const params = new URLSearchParams();
  params.set("pin", formData.get("pin"));

  loginStatus.textContent = "Checking studio code...";
  const response = await fetch("/api/studio-login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (response.ok) {
    window.location.href = "/studio.html";
    return;
  }

  if (response.status === 503) {
    loginStatus.textContent = "Studio code is not configured. Add STUDIO_PIN in Render, then redeploy.";
    return;
  }

  loginStatus.textContent = "Incorrect studio code.";
});
