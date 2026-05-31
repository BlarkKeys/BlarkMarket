const studioState = {
  catalog: [],
};

const lockStatus = document.querySelector("#lockStatus");
const uploadForm = document.querySelector("#uploadForm");
const uploadStatus = document.querySelector("#uploadStatus");
const studioLibrary = document.querySelector("#studioLibrary");
const logoutStudio = document.querySelector("#logoutStudio");

logoutStudio.addEventListener("click", async () => {
  await fetch("/api/studio-logout", { method: "POST" });
  window.location.href = "/studio-login.html";
});

uploadForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(uploadForm);
  const audio = formData.get("audio");
  const cover = formData.get("cover");
  const params = new URLSearchParams();
  params.set("title", formData.get("title"));
  params.set("category", formData.get("category"));
  params.set("genre", formData.get("genre"));
  params.set("bpm", formData.get("bpm"));
  params.set("key", formData.get("key"));
  params.set("price", formData.get("price"));

  uploadStatus.textContent = "Uploading files and generating license...";
  if (audio && audio.size > 0) {
    params.set("fileName", audio.name);
    params.set("audioData", await fileToDataUrl(audio));
  }
  if (cover && cover.size > 0) {
    params.set("coverFileName", cover.name);
    params.set("coverData", await fileToDataUrl(cover));
  }

  const response = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (response.status === 401) {
    window.location.href = "/studio-login.html";
    return;
  }
  if (!response.ok) {
    uploadStatus.textContent = "Upload failed. Check the file and try again.";
    return;
  }

  const item = await response.json();
  studioState.catalog.unshift(item);
  uploadForm.reset();
  uploadStatus.textContent = `${item.title} is now live on the public website. License generated.`;
  renderLibrary();
});

async function loadCatalog() {
  const response = await fetch("/api/catalog");
  studioState.catalog = await response.json();
  renderLibrary();
}

function renderLibrary() {
  if (studioState.catalog.length === 0) {
    studioLibrary.innerHTML = `
      <div class="empty-state compact">
        <h3>No live content yet.</h3>
        <p>Upload your first beat, instrumental, sample, or loop to publish it on the website.</p>
      </div>
    `;
    return;
  }

  studioLibrary.innerHTML = studioState.catalog.map((item) => `
    <article class="library-item">
      <div class="library-cover">${item.cover ? `<img src="${escapeHtml(item.cover)}" alt="">` : `<span>bk</span>`}</div>
      <div class="library-info">
        <strong>${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(item.category)} / ${escapeHtml(item.genre)} / ${escapeHtml(String(item.bpm))} BPM / ${escapeHtml(item.key)}</p>
      </div>
      <div class="library-actions">
        <span>$${Number(item.price).toFixed(2)}</span>
        ${item.file ? `<a class="button secondary" href="${escapeHtml(item.file)}" target="_blank" rel="noreferrer">Audio</a>` : ""}
        ${item.license ? `<a class="button secondary" href="${escapeHtml(item.license)}" target="_blank" rel="noreferrer">License</a>` : ""}
        <button class="button danger delete-button" type="button" data-id="${escapeHtml(item.id)}">Unpublish</button>
      </div>
    </article>
  `).join("");

  document.querySelectorAll(".delete-button").forEach((button) => {
    button.addEventListener("click", () => unpublishItem(button.dataset.id));
  });
}

async function unpublishItem(id) {
  const item = studioState.catalog.find((track) => track.id === id);
  if (!item) return;

  lockStatus.textContent = `Unpublishing ${item.title}...`;
  const params = new URLSearchParams();
  params.set("id", id);
  const response = await fetch("/api/delete", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (response.status === 401) {
    window.location.href = "/studio-login.html";
    return;
  }
  if (response.ok) {
    studioState.catalog = studioState.catalog.filter((track) => track.id !== id);
    lockStatus.textContent = `${item.title} was removed from the public website.`;
    renderLibrary();
  } else {
    lockStatus.textContent = `Could not unpublish ${item.title}.`;
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

loadCatalog();
