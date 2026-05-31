const state = {
  catalog: [],
  category: "all",
  currency: "USD",
  selected: null,
  activePreview: null,
};

const rates = {
  USD: 1,
  ZAR: 18.52,
  EUR: 0.92,
  GBP: 0.78,
  NGN: 1450,
  JPY: 157.8,
  AUD: 1.51,
  CAD: 1.36,
};

const catalogGrid = document.querySelector("#catalogGrid");
const currencyEl = document.querySelector("#currency");
const checkoutForm = document.querySelector("#checkoutForm");
const checkoutStatus = document.querySelector("#checkoutStatus");

function formatPrice(amount) {
  const converted = Number(amount) * rates[state.currency];
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: state.currency,
    maximumFractionDigits: state.currency === "JPY" ? 0 : 2,
  }).format(converted);
}

function renderCatalog() {
  const filtered = state.catalog.filter((item) => state.category === "all" || item.category === state.category);

  if (filtered.length === 0) {
    catalogGrid.innerHTML = `
      <div class="empty-state">
        <p class="section-kicker">Catalog loading soon</p>
        <h3>No releases are live yet.</h3>
        <p>blarkkeys will publish beats, instrumentals, samples, and loops here from the private studio.</p>
      </div>
    `;
    return;
  }

  catalogGrid.innerHTML = filtered.map((item, index) => `
    <article class="release-card">
      ${item.cover
        ? `<div class="release-art has-cover"><img src="${escapeHtml(item.cover)}" alt="${escapeHtml(item.title)} cover artwork"></div>`
        : `<div class="release-art" style="--tone:${index % 5}"><span></span><span></span><span></span><span></span></div>`}
      <div class="release-content">
        <div>
          <p class="release-type">${escapeHtml(item.category === "samples" ? "sample / loop" : "beat / instrumental")}</p>
          <h3>${escapeHtml(item.title)}</h3>
        </div>
        <p class="release-meta">
          <span>${escapeHtml(item.genre)}</span>
          <span>${escapeHtml(String(item.bpm))} BPM</span>
          <span>${escapeHtml(item.key)}</span>
        </p>
        <div class="release-actions">
          <strong>${formatPrice(item.price)}</strong>
          <button class="icon-button preview-button" type="button" data-id="${escapeHtml(item.id)}" aria-label="Play or pause ${escapeHtml(item.title)}">Play</button>
          <button class="icon-button stop-button" type="button" data-id="${escapeHtml(item.id)}" aria-label="Stop ${escapeHtml(item.title)}">Stop</button>
          <button class="button secondary buy-button" type="button" data-id="${escapeHtml(item.id)}">Buy</button>
        </div>
      </div>
    </article>
  `).join("");

  document.querySelectorAll(".preview-button").forEach((button) => {
    button.addEventListener("click", () => togglePreview(button.dataset.id));
  });
  document.querySelectorAll(".stop-button").forEach((button) => {
    button.addEventListener("click", stopPreview);
  });
  document.querySelectorAll(".buy-button").forEach((button) => {
    button.addEventListener("click", () => selectTrack(button.dataset.id));
  });
}

function selectTrack(id) {
  state.selected = state.catalog.find((item) => item.id === id);
  if (!state.selected) return;
  checkoutStatus.textContent = `${state.selected.title} selected. Checkout will be created in ${state.currency}.`;
  document.querySelector("#checkout").scrollIntoView({ behavior: "smooth" });
}

function togglePreview(id) {
  if (state.activePreview && state.activePreview.id === id && state.activePreview.kind === "audio") {
    if (state.activePreview.audio.paused) {
      state.activePreview.audio.play();
      updatePreviewButtons(id, "Pause");
    } else {
      state.activePreview.audio.pause();
      updatePreviewButtons(id, "Play");
    }
    return;
  }
  if (state.activePreview && state.activePreview.id === id) {
    stopPreview();
    return;
  }

  stopPreview();
  const item = state.catalog.find((track) => track.id === id);
  if (item && item.file) {
    const audio = new Audio(item.file);
    audio.volume = 0.72;
    audio.addEventListener("ended", stopPreview);
    state.activePreview = { id, kind: "audio", audio };
    audio.play()
      .then(() => updatePreviewButtons(id, "Pause"))
      .catch(() => playSynthPreview(id));
    return;
  }
  playSynthPreview(id);
}

function playSynthPreview(id) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  stopPreview();
  const ctx = new AudioContext();
  const now = ctx.currentTime;
  const notes = [98, 130.81, 146.83, 196, 220, 261.63];
  const offset = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % notes.length;
  const nodes = [];

  for (let step = 0; step < 12; step += 1) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = step % 4 === 0 ? "sawtooth" : "triangle";
    osc.frequency.value = notes[(offset + step) % notes.length] * (step % 3 === 0 ? 0.5 : 1);
    gain.gain.setValueAtTime(0.001, now + step * 0.13);
    gain.gain.exponentialRampToValueAtTime(0.13, now + step * 0.13 + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, now + step * 0.13 + 0.11);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + step * 0.13);
    osc.stop(now + step * 0.13 + 0.12);
    nodes.push(osc);
  }
  state.activePreview = { id, kind: "synth", context: ctx, nodes };
  updatePreviewButtons(id, "Pause");
  setTimeout(() => {
    if (state.activePreview && state.activePreview.id === id && state.activePreview.kind === "synth") {
      stopPreview();
    }
  }, 1800);
}

function stopPreview() {
  if (!state.activePreview) return;
  if (state.activePreview.kind === "audio") {
    state.activePreview.audio.pause();
    state.activePreview.audio.currentTime = 0;
  }
  if (state.activePreview.kind === "synth") {
    state.activePreview.nodes.forEach((node) => {
      try {
        node.stop();
      } catch (error) {
        // Oscillator may already have stopped.
      }
    });
    state.activePreview.context.close();
  }
  const previousId = state.activePreview.id;
  state.activePreview = null;
  updatePreviewButtons(previousId, "Play");
}

function updatePreviewButtons(activeId, label) {
  document.querySelectorAll(".preview-button").forEach((button) => {
    button.textContent = button.dataset.id === activeId ? label : "Play";
  });
}

async function loadCatalog() {
  const response = await fetch("/api/catalog");
  state.catalog = await response.json();
  renderCatalog();
}

document.querySelectorAll(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach((tab) => tab.classList.remove("active"));
    button.classList.add("active");
    state.category = button.dataset.category;
    renderCatalog();
  });
});

currencyEl.addEventListener("change", () => {
  state.currency = currencyEl.value;
  renderCatalog();
});

checkoutForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!state.selected) {
    checkoutStatus.textContent = "Select a beat, instrumental, sample, or loop before checkout.";
    return;
  }

  const formData = new FormData(checkoutForm);
  checkoutStatus.textContent = "Creating secure order...";
  const response = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      itemId: state.selected.id,
      title: state.selected.title,
      amount: state.selected.price,
      currency: state.currency,
      email: formData.get("email"),
      method: formData.get("method"),
    }),
  });
  const result = await response.json();
  checkoutStatus.textContent = `${result.orderId}: ${result.message}`;
  if (result.redirectUrl) {
    window.location.href = result.redirectUrl;
  }
});

function startVisualStage() {
  const canvas = document.querySelector("#visualStage");
  const ctx = canvas.getContext("2d");
  const particles = Array.from({ length: 90 }, (_, index) => ({
    x: Math.random(),
    y: Math.random(),
    r: 1 + Math.random() * 3,
    phase: index * 0.31,
    speed: 0.00012 + Math.random() * 0.00022,
  }));

  function resize() {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  }

  function draw(time) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    ctx.clearRect(0, 0, width, height);
    particles.forEach((particle, index) => {
      const pulse = Math.sin(time * particle.speed + particle.phase);
      const x = particle.x * width + pulse * 38;
      const y = ((particle.y + time * particle.speed * 0.06) % 1) * height;
      const color = index % 3 === 0 ? "255, 191, 87" : index % 3 === 1 ? "116, 224, 178" : "160, 191, 255";
      ctx.fillStyle = `rgba(${color}, ${0.16 + Math.abs(pulse) * 0.18})`;
      ctx.beginPath();
      ctx.arc(x, y, particle.r, 0, Math.PI * 2);
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(draw);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

startVisualStage();
loadCatalog();
