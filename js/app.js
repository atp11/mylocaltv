(() => {
  "use strict";

  const OFFICIAL = "https://raw.githubusercontent.com/LaQuay/TDTChannels/master/TELEVISION.md";
  const EPG_URL = "https://www.tdtchannels.com/epg/TV.json";
  const PRINCIPALES = new Set(["Generalistas", "Informativos", "Deportivos", "Infantiles"]);
  const TONES = ["#6e4634", "#3e5648", "#3d4c66", "#654838", "#534258", "#5a5140", "#4a4038"];
  const HOUR = 176;

  const $ = (id) => document.getElementById(id);
  const video = $("video");

  const state = {
    channels: [],
    filter: "Principales",
    query: "",
    current: 0,
    epg: {},
    epgUpdated: 0,
    epgLive: false,
    playToken: 0,
    phase: "idle",
    overlayMode: "idle",
    hls: null,
    osdTimer: null,
    digits: "",
    digitTimer: null,
    lastWheel: 0,
    guideDay: "",
    guideMap: new Map(),
    picked: null,
    officialRows: null,
    officialAt: 0,
    officialTask: null
  };

  function norm(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "");
  }

  function esc(value) {
    return String(value).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[ch]));
  }

  function safeUrl(value) {
    try {
      const url = new URL(value);
      if (url.protocol === "https:" || url.protocol === "http:") return url.href;
    } catch (err) { /* ignore */ }
    return "";
  }

  function initials(name) {
    const parts = String(name).replace(/[^\p{L}\p{N} ]+/gu, " ").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "TV";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  function tone(name) {
    let hash = 0;
    const text = norm(name);
    for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
    return TONES[hash % TONES.length];
  }

  function logoHtml(name, src, className) {
    const url = safeUrl(src);
    const img = url ? `<img alt="" src="${esc(url)}" loading="lazy">` : "";
    return `<span class="logo ${className || ""}" style="--tone:${tone(name)}"><span>${esc(initials(name))}</span>${img}</span>`;
  }

  function current() {
    return state.channels[state.current] || state.channels[0];
  }

  function visibleChannels() {
    const query = norm(state.query);
    return state.channels.filter((ch) => {
      if (state.filter === "Principales" && !PRINCIPALES.has(ch.group)) return false;
      if (state.filter !== "Principales" && state.filter !== "Todos" && ch.group !== state.filter) return false;
      if (!query) return true;
      return norm(ch.name).includes(query) || norm(ch.group).includes(query);
    });
  }

  function programmes(id) {
    return (id && state.epg[id]) || [];
  }

  function nowAndNext(id, now) {
    const list = programmes(id);
    const ts = now == null ? Date.now() / 1000 : now;
    let currentProg = null;
    let nextProg = null;
    for (let i = 0; i < list.length; i += 1) {
      const item = list[i];
      if (item[0] <= ts && ts < item[1]) currentProg = item;
      else if (item[0] > ts) {
        nextProg = item;
        break;
      }
    }
    return { currentProg, nextProg };
  }

  function formatHM(ts) {
    return new Intl.DateTimeFormat("es-ES", {
      timeZone: "Europe/Madrid",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    }).format(new Date(ts * 1000));
  }

  function madridParts(utcMs) {
    const dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: "Europe/Madrid",
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    const parts = Object.fromEntries(dtf.formatToParts(new Date(utcMs)).map((p) => [p.type, p.value]));
    return {
      year: +parts.year,
      month: +parts.month,
      day: +parts.day,
      hour: +parts.hour,
      minute: +parts.minute,
      second: +parts.second
    };
  }

  function madridKey(ms) {
    const p = madridParts(ms);
    return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
  }

  function addDays(key, days) {
    const [y, m, d] = key.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + days));
    return dt.toISOString().slice(0, 10);
  }

  function madridMidnightMs(key) {
    const [y, m, d] = key.split("-").map(Number);
    let utc = Date.UTC(y, m - 1, d, 0, 0, 0);
    for (let i = 0; i < 3; i += 1) {
      const p = madridParts(utc);
      const asIf = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
      utc += Date.UTC(y, m - 1, d, 0, 0, 0) - asIf;
    }
    return utc;
  }

  function hostname(url) {
    try {
      const parts = new URL(url).hostname.replace(/^www\./, "").split(".");
      return parts.length > 2 ? parts.slice(-2).join(".") : parts.join(".");
    } catch (err) { return ""; }
  }

  function setSignal(text) {
    $("signal").textContent = text;
  }

  function setNote(text) {
    $("list-note").textContent = text;
  }

  function showToast(text) {
    const toast = $("toast");
    toast.hidden = !text;
    toast.textContent = text || "";
  }

  function showOverlay(mode, title, text, action) {
    state.overlayMode = mode;
    $("overlay").hidden = false;
    $("overlay-title").textContent = title;
    $("overlay-text").textContent = text;
    $("overlay-action").textContent = action;
    $("overlay-action").hidden = !action;
    const ch = current();
    $("overlay-logo").innerHTML = ch ? logoHtml(ch.name, ch.logo) : "";
  }

  function hideOverlay() {
    $("overlay").hidden = true;
  }

  function showOsd() {
    const ch = current();
    if (!ch || state.phase !== "playing") return;
    if (document.body.classList.contains("guide")) return;
    const pair = nowAndNext(ch.id);
    $("osd").hidden = false;
    $("osd-num").textContent = String(ch.n);
    $("osd-logo").innerHTML = logoHtml(ch.name, ch.logo);
    $("osd-name").textContent = ch.name;
    $("osd-now").textContent = pair.currentProg ? `Ahora · ${pair.currentProg[2]}` : ch.group;
    $("osd-next").textContent = pair.nextProg ? `Después · ${pair.nextProg[2]}` : "";
    updateProgress();
    clearTimeout(state.osdTimer);
    state.osdTimer = setTimeout(() => { $("osd").hidden = true; }, 4200);
  }

  function updateProgress() {
    const ch = current();
    const bar = $("osd-bar");
    if (!ch) return;
    const pair = nowAndNext(ch.id);
    if (!pair.currentProg) {
      bar.style.width = "0%";
      return;
    }
    const [start, end] = pair.currentProg;
    const now = Date.now() / 1000;
    const pct = Math.max(0, Math.min(100, ((now - start) / (end - start)) * 100));
    bar.style.width = `${pct}%`;
  }

  function renderChips() {
    const groups = [];
    state.channels.forEach((ch) => {
      if (!groups.includes(ch.group)) groups.push(ch.group);
    });
    const items = ["Principales", "Todos", ...groups];
    $("chips").innerHTML = items.map((name) => (
      `<button type="button" data-filter="${esc(name)}" class="${name === state.filter ? "on" : ""}" aria-pressed="${name === state.filter}">${esc(name)}</button>`
    )).join("");
  }

  function renderList() {
    const rows = visibleChannels();
    $("list-count").textContent = rows.length === 1 ? "1 canal" : `${rows.length} canales`;
    if (!rows.length) {
      $("list").innerHTML = `<div class="empty-list">Ningún canal coincide con esa búsqueda.</div>`;
      return;
    }
    const now = Date.now() / 1000;
    const active = current() && current().n;
    $("list").innerHTML = rows.map((ch) => {
      const pair = nowAndNext(ch.id, now);
      const sub = pair.currentProg ? pair.currentProg[2] : ch.group;
      return `<button type="button" class="ch${ch.n === active ? " on" : ""}" data-n="${ch.n}">
        <span class="ch-num">${ch.n}</span>
        ${logoHtml(ch.name, ch.logo)}
        <span><span class="ch-name">${esc(ch.name)}</span><span class="ch-sub">${esc(sub)}</span></span>
      </button>`;
    }).join("");
    const on = $("list").querySelector(".ch.on");
    if (on) on.scrollIntoView({ block: "nearest" });
  }

  function markActive() {
    const n = current() && current().n;
    $("list").querySelectorAll(".ch").forEach((el) => {
      el.classList.toggle("on", Number(el.dataset.n) === n);
    });
    const on = $("list").querySelector(".ch.on");
    if (on) on.scrollIntoView({ block: "nearest" });
  }

  function ensureVisible(ch) {
    if (visibleChannels().some((item) => item.n === ch.n)) return;
    state.filter = PRINCIPALES.has(ch.group) ? "Principales" : ch.group;
    state.query = "";
    $("search").value = "";
    renderChips();
    renderList();
  }

  function refreshNowLabels() {
    const now = Date.now() / 1000;
    $("list").querySelectorAll(".ch").forEach((el) => {
      const ch = state.channels.find((item) => item.n === Number(el.dataset.n));
      const sub = el.querySelector(".ch-sub");
      if (!ch || !sub) return;
      const pair = nowAndNext(ch.id, now);
      sub.textContent = pair.currentProg ? pair.currentProg[2] : ch.group;
    });
    if (!$("osd").hidden) showOsd();
    if (document.body.classList.contains("guide")) positionNowLine();
  }

  function destroyHls() {
    if (state.hls) {
      state.hls.destroy();
      state.hls = null;
    }
  }

  function hideYoutube() {
    $("yt").hidden = true;
    $("yt").replaceChildren();
  }

  function showYoutube(id) {
    if (!/^UC[\w-]{8,}$/.test(id)) return false;
    destroyHls();
    video.pause();
    video.removeAttribute("src");
    video.load();
    const frame = document.createElement("iframe");
    const mute = video.muted ? "&mute=1" : "";
    frame.src = `https://www.youtube-nocookie.com/embed/live_stream?channel=${encodeURIComponent(id)}&autoplay=1&rel=0&modestbranding=1${mute}`;
    frame.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    frame.allowFullscreen = true;
    frame.title = `Emisión de ${current().name} en YouTube`;
    $("yt").replaceChildren(frame);
    $("yt").hidden = false;
    return true;
  }

  function tryPlay(url, token) {
    return new Promise((resolve) => {
      destroyHls();
      hideYoutube();
      let settled = false;
      const finish = (ok) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(token === state.playToken && ok);
      };
      const timer = setTimeout(() => finish(false), 9000);
      const onReady = () => {
        const played = video.play();
        if (played && typeof played.then === "function") {
          played.then(() => finish(true)).catch((err) => {
            if (err && err.name === "NotAllowedError") {
              showOverlay("gesture", current().name, "El navegador espera un toque para poner el sonido.", "Empezar");
              finish(true);
            } else finish(false);
          });
        } else finish(true);
      };

      if (window.Hls && Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: false,
          capLevelToPlayerSize: true,
          manifestLoadingTimeOut: 8000,
          manifestLoadingMaxRetry: 0,
          levelLoadingMaxRetry: 1,
          fragLoadingMaxRetry: 2
        });
        state.hls = hls;
        let recovered = false;
        hls.on(Hls.Events.MANIFEST_PARSED, onReady);
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (!data.fatal) return;
          if (data.type === Hls.ErrorTypes.MEDIA_ERROR && !recovered) {
            recovered = true;
            hls.recoverMediaError();
            return;
          }
          finish(false);
        });
        hls.loadSource(url);
        hls.attachMedia(video);
        return;
      }

      const onMeta = () => onReady();
      const onErr = () => finish(false);
      video.addEventListener("loadedmetadata", onMeta, { once: true });
      video.addEventListener("error", onErr, { once: true });
      video.src = url;
    });
  }

  function parseOfficial(markdown) {
    const linkRe = /\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g;
    const rows = [];
    markdown.split(/\r?\n/).forEach((line) => {
      if (!line.startsWith("|") || /^\|\s*-+/.test(line)) return;
      const cols = line.split("|").slice(1, -1).map((col) => col.trim());
      if (cols.length < 5 || /^canal$/i.test(cols[0])) return;
      const links = [...cols[1].matchAll(linkRe)].map((match) => match[2]);
      const urls = links.filter((url) => /\.m3u8(?:\?|#|$)/i.test(url));
      let youtube = null;
      links.some((url) => {
        const match = url.match(/youtube\.com\/channel\/(UC[\w-]{8,})/i);
        if (match) youtube = match[1];
        return Boolean(match);
      });
      const logos = [...(cols[3] || "").matchAll(linkRe)];
      rows.push({
        name: cols[0],
        id: (cols[4] || "").trim(),
        urls,
        youtube,
        logo: logos.length ? logos[0][2] : ""
      });
    });
    return rows;
  }

  function applyOfficial(rows) {
    const byName = new Map();
    const byId = new Map();
    rows.forEach((row) => {
      const key = norm(row.name);
      if (key && !byName.has(key)) byName.set(key, row);
      if (row.id) {
        if (!byId.has(row.id)) byId.set(row.id, []);
        byId.get(row.id).push(row);
      }
    });
    let refreshed = 0;
    state.channels.forEach((ch) => {
      const row = byName.get(norm(ch.name));
      const siblings = ch.id ? (byId.get(ch.id) || []) : [];
      const pool = [];
      [row, ...siblings].forEach((item) => {
        if (!item) return;
        item.urls.forEach((url) => {
          if (safeUrl(url) && !pool.includes(url)) pool.push(url);
        });
        if (!ch.youtube && item.youtube) ch.youtube = item.youtube;
        if (!ch.logo && item.logo) ch.logo = item.logo;
      });
      if (!pool.length) return;
      const merged = [];
      [...pool, ...ch.urls].forEach((url) => {
        if (!merged.includes(url)) merged.push(url);
      });
      if (merged[0] !== ch.urls[0]) refreshed += 1;
      ch.urls = merged;
    });
    try {
      localStorage.setItem("mltv:sources", JSON.stringify(state.channels.map((ch) => ({
        name: ch.name,
        urls: ch.urls,
        youtube: ch.youtube || null
      }))));
    } catch (err) { /* quota */ }
    return refreshed;
  }

  function officialData(force) {
    const fresh = state.officialRows && Date.now() - state.officialAt < 30 * 60 * 1000;
    if (!force && fresh) return Promise.resolve(state.officialRows);
    if (!force && state.officialTask) return state.officialTask;
    state.officialTask = fetch(OFFICIAL, { cache: "no-cache" })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.text();
      })
      .then((markdown) => {
        state.officialRows = parseOfficial(markdown);
        state.officialAt = Date.now();
        const changed = applyOfficial(state.officialRows);
        setNote(changed
          ? "Lista contrastada. Hay señales más nuevas listas por si alguna caduca."
          : "Lista contrastada con los canales en abierto de TDTChannels.");
        return state.officialRows;
      })
      .catch(() => {
        state.officialTask = null;
        return null;
      });
    return state.officialTask;
  }

  async function tune(ch, options) {
    const opts = options || {};
    const token = ++state.playToken;
    state.phase = "loading";
    $("onair").hidden = true;
    hideOverlay();
    $("osd").hidden = true;
    if (opts.rotate && ch.urls.length > 1) ch.urls.push(ch.urls.shift());
    const tried = new Set();
    const locals = ch.urls.slice();
    for (let i = 0; i < locals.length; i += 1) {
      if (token !== state.playToken) return;
      const url = locals[i];
      tried.add(url);
      showToast(i === 0
        ? `Sintonizando ${ch.name}…`
        : `Esa señal no responde. Probando otra de ${ch.name}…`);
      setSignal(i === 0 ? hostname(url) : `Sustituto · ${hostname(url)}`);
      if (await tryPlay(url, token)) return playing(ch, url, i > 0);
    }
    if (token !== state.playToken) return;
    showToast(`Buscando un sustituto actualizado de ${ch.name}…`);
    setSignal("Consultando la lista oficial");
    await officialData(Boolean(opts.force));
    if (token !== state.playToken) return;
    const extras = ch.urls.filter((url) => !tried.has(url));
    for (let i = 0; i < extras.length; i += 1) {
      if (token !== state.playToken) return;
      showToast(`Probando una señal nueva de ${ch.name}…`);
      setSignal(`Sustituto · ${hostname(extras[i])}`);
      tried.add(extras[i]);
      if (await tryPlay(extras[i], token)) return playing(ch, extras[i], true);
    }
    if (token !== state.playToken) return;
    if (ch.youtube && showYoutube(ch.youtube)) {
      return playing(ch, `youtube:${ch.youtube}`, true);
    }
    state.phase = "error";
    showToast("");
    setSignal("Sin señal");
    showOverlay(
      "error",
      ch.name,
      "No queda ninguna señal en abierto funcionando para este canal.",
      "Volver a intentar"
    );
  }

  function playing(ch, url, alt) {
    if (state.playToken === 0) return;
    state.phase = "playing";
    showToast("");
    hideOverlay();
    $("onair").hidden = false;
    $("play-btn").textContent = "Pausa";
    if (String(url).startsWith("youtube:")) setSignal(alt ? "YouTube · sustituto" : "YouTube");
    else setSignal(alt ? `Sustituto · ${hostname(url)}` : hostname(url));
    document.title = `${ch.name} · Mi Tele`;
    showOsd();
    try { localStorage.setItem("mltv:last", String(ch.n)); } catch (err) { /* ignore */ }
  }

  function playChannel(index) {
    const ch = state.channels[index];
    if (!ch) return;
    state.current = index;
    ensureVisible(ch);
    markActive();
    document.title = `${ch.name} · Mi Tele`;
    tune(ch);
  }

  function playNumber(n) {
    const index = state.channels.findIndex((ch) => ch.n === n);
    if (index < 0) {
      showToast(`No hay canal ${n}`);
      setTimeout(() => { if (state.phase === "playing") showToast(""); }, 1600);
      return;
    }
    playChannel(index);
  }

  function zap(delta) {
    const rows = visibleChannels();
    if (!rows.length) return;
    const ch = current();
    let index = rows.findIndex((item) => item.n === (ch && ch.n));
    if (index < 0) index = 0;
    else index = (index + delta + rows.length) % rows.length;
    const next = state.channels.findIndex((item) => item.n === rows[index].n);
    playChannel(next);
  }

  function showIdle() {
    const ch = current();
    state.phase = "idle";
    showOverlay("idle", ch ? ch.name : "Mi Tele", "Elige un canal de la lista o dale al botón para empezar.", ch ? `Ver ${ch.name}` : "Ver");
    setSignal("Listo");
  }

  function togglePlay() {
    if ($("yt").querySelector("iframe")) return;
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  }

  function tickClock() {
    const now = new Date();
    $("clock-time").textContent = new Intl.DateTimeFormat("es-ES", {
      hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Europe/Madrid"
    }).format(now);
    $("clock-date").textContent = new Intl.DateTimeFormat("es-ES", {
      weekday: "long", day: "numeric", month: "short", timeZone: "Europe/Madrid"
    }).format(now);
    if (state.phase === "playing") updateProgress();
  }

  function guideDays() {
    let min = Infinity;
    let max = 0;
    Object.values(state.epg).forEach((rows) => {
      rows.forEach((item) => {
        if (item[0] < min) min = item[0];
        if (item[1] > max) max = item[1];
      });
    });
    if (!Number.isFinite(min)) return [];
    const keys = [];
    let key = madridKey(min * 1000);
    const end = madridKey((max - 60) * 1000);
    while (key <= end && keys.length < 8) {
      keys.push(key);
      key = addDays(key, 1);
    }
    return keys;
  }

  function dayLabel(key) {
    const today = madridKey(Date.now());
    if (key === today) return "Hoy";
    if (key === addDays(today, 1)) return "Mañana";
    return new Intl.DateTimeFormat("es-ES", {
      weekday: "short", day: "numeric", timeZone: "Europe/Madrid"
    }).format(new Date(madridMidnightMs(key)));
  }

  function guideStamp() {
    if (!state.epgUpdated) return "Sin guía";
    const when = new Intl.DateTimeFormat("es-ES", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
      hourCycle: "h23", timeZone: "Europe/Madrid"
    }).format(new Date(state.epgUpdated * 1000));
    return state.epgLive ? `Guía actualizada · ${when}` : `Guía guardada · ${when}`;
  }

  function renderGuide() {
    const days = guideDays();
    const today = madridKey(Date.now());
    if (!state.guideDay || !days.includes(state.guideDay)) {
      state.guideDay = days.includes(today) ? today : (days[0] || today);
    }
    $("days").innerHTML = days.map((key) => (
      `<button type="button" data-day="${key}" class="${key === state.guideDay ? "on" : ""}">${esc(dayLabel(key))}</button>`
    )).join("");
    $("guide-meta").textContent = guideStamp();

    const start = madridMidnightMs(state.guideDay) / 1000;
    const end = start + 86400;
    const width = 24 * HOUR;
    const rows = visibleChannels();
    state.guideMap = new Map();
    const canvas = $("guide-canvas");
    if (!rows.length) {
      canvas.innerHTML = `<div class="empty-list">No hay canales en esta vista.</div>`;
      return;
    }

    const ticks = [];
    for (let hour = 0; hour < 24; hour += 1) {
      ticks.push(`<span class="tick" style="left:${hour * HOUR}px">${String(hour).padStart(2, "0")}:00</span>`);
    }
    const head = `<div class="g-row g-head"><div class="g-ch">Canal</div><div class="g-track" style="width:${width}px">${ticks.join("")}</div></div>`;
    const body = rows.map((ch) => {
      const items = programmes(ch.id).filter((item) => item[1] > start && item[0] < end);
      state.guideMap.set(ch.n, items);
      const blocks = items.map((item, index) => {
        const left = Math.max(0, (item[0] - start) / 3600) * HOUR;
        const right = Math.min(24, (item[1] - start) / 3600) * HOUR;
        const box = Math.max(right - left, 8);
        const now = Date.now() / 1000;
        const isNow = item[0] <= now && now < item[1];
        const narrow = box < 86;
        return `<button type="button" class="prog${isNow ? " is-now" : ""}" style="left:${left}px;width:${box}px" data-n="${ch.n}" data-i="${index}" title="${esc(item[2])}">
          <strong>${esc(item[2])}</strong>
          ${narrow ? "" : `<em>${formatHM(item[0])}–${formatHM(item[1])}</em>`}
        </button>`;
      }).join("");
      const empty = blocks ? "" : `<span class="tick" style="left:12px;transform:none">Sin datos de programación</span>`;
      return `<div class="g-row"><button type="button" class="g-ch" data-tune="${ch.n}">${logoHtml(ch.name, ch.logo)}<b>${esc(ch.name)}</b></button><div class="g-track" style="width:${width}px">${blocks}${empty}</div></div>`;
    }).join("");
    canvas.innerHTML = `${head}${body}<div class="now-line" id="now-line" hidden></div>`;
    positionNowLine();
    if (state.guideDay === madridKey(Date.now())) {
      requestAnimationFrame(() => scrollGuideToNow());
    }
  }

  function positionNowLine() {
    const line = $("now-line");
    if (!line || !state.guideDay) return;
    if (state.guideDay !== madridKey(Date.now())) {
      line.hidden = true;
      return;
    }
    const start = madridMidnightMs(state.guideDay) / 1000;
    const x = 228 + ((Date.now() / 1000 - start) / 3600) * HOUR;
    line.hidden = false;
    line.style.left = `${x}px`;
  }

  function scrollGuideToNow() {
    const sc = $("guide-scroll");
    const line = $("now-line");
    if (!sc || !line || line.hidden || state.guideDay !== madridKey(Date.now())) return;
    const left = parseFloat(line.style.left) || 0;
    const gutter = Math.min(460, Math.max(240, sc.clientWidth * 0.28));
    const next = Math.max(0, left - gutter);
    sc.scrollLeft = next;
    requestAnimationFrame(() => { sc.scrollLeft = next; });
  }

  function openDetail(ch, item) {
    state.picked = { n: ch.n, item };
    $("detail").hidden = false;
    $("detail-when").textContent = `${ch.name} · ${formatHM(item[0])} – ${formatHM(item[1])}`;
    $("detail-title").textContent = item[2];
    $("detail-desc").textContent = item[3] || "Sin descripción.";
    document.querySelectorAll(".prog").forEach((el) => el.classList.remove("is-picked"));
    const picked = document.querySelector(`.prog[data-n="${ch.n}"].is-now`) || null;
    document.querySelectorAll(`.prog[data-n="${ch.n}"]`).forEach((el) => {
      const prog = (state.guideMap.get(ch.n) || [])[Number(el.dataset.i)];
      if (prog && prog[0] === item[0]) el.classList.add("is-picked");
    });
    if (picked) picked.classList.add("is-picked");
  }

  function setView(view) {
    const guide = view === "guide";
    document.body.classList.toggle("guide", guide);
    $("view-guide").hidden = !guide;
    $("tab-guide").classList.toggle("on", guide);
    $("tab-tv").classList.toggle("on", !guide);
    if (!guide) {
      $("detail").hidden = true;
      return;
    }
    renderGuide();
    requestAnimationFrame(scrollGuideToNow);
  }

  function compactEpg(data) {
    const epg = {};
    data.forEach((ch) => {
      const rows = [];
      (ch.events || []).forEach((event) => {
        const title = String(event.t || "").trim();
        if (!title) return;
        let desc = String(event.d || "").replace(/\s+/g, " ").trim();
        if (desc.length > 180) desc = `${desc.slice(0, 177).trim()}…`;
        rows.push([Number(event.hi), Number(event.hf), title, desc]);
      });
      if (rows.length) epg[ch.name] = rows;
    });
    return epg;
  }

  function idb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open("mltv", 1);
      req.onupgradeneeded = () => req.result.createObjectStore("kv");
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  function idbGet(key) {
    return idb().then((db) => new Promise((resolve, reject) => {
      const tx = db.transaction("kv", "readonly");
      const req = tx.objectStore("kv").get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    })).catch(() => null);
  }

  function idbSet(key, value) {
    return idb().then((db) => new Promise((resolve, reject) => {
      const tx = db.transaction("kv", "readwrite");
      tx.objectStore("kv").put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    })).catch(() => {});
  }

  function useEpg(epg, updated, live) {
    state.epg = epg;
    state.epgUpdated = updated;
    state.epgLive = live;
    refreshNowLabels();
    if (document.body.classList.contains("guide")) renderGuide();
    else $("guide-meta").textContent = guideStamp();
  }

  async function hydrateEpg() {
    const cached = await idbGet("epg");
    if (cached && cached.epg && cached.updated > state.epgUpdated) {
      useEpg(cached.epg, cached.updated, true);
    }
    const button = $("guide-refresh");
    button.disabled = true;
    try {
      const res = await fetch(EPG_URL, { cache: "no-cache" });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      const epg = compactEpg(data);
      const updated = Math.floor(Date.now() / 1000);
      useEpg(epg, updated, true);
      await idbSet("epg", { updated, epg });
    } catch (err) {
      $("guide-meta").textContent = guideStamp();
    } finally {
      button.disabled = false;
    }
  }

  function loadStoredSources() {
    try {
      const saved = JSON.parse(localStorage.getItem("mltv:sources") || "[]");
      const map = new Map(saved.map((row) => [row.name, row]));
      state.channels.forEach((ch) => {
        const row = map.get(ch.name);
        if (!row || !Array.isArray(row.urls)) return;
        const urls = row.urls.filter((url) => safeUrl(url));
        if (urls.length) ch.urls = urls;
        if (row.youtube) ch.youtube = row.youtube;
      });
    } catch (err) { /* ignore */ }
  }

  function pushDigit(digit) {
    state.digits = (state.digits + digit).slice(-3);
    $("numflash").hidden = false;
    $("numflash").textContent = state.digits;
    clearTimeout(state.digitTimer);
    state.digitTimer = setTimeout(() => {
      const n = parseInt(state.digits, 10);
      state.digits = "";
      $("numflash").hidden = true;
      if (n) playNumber(n);
    }, 900);
  }

  function bind() {
    $("chips").addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter]");
      if (!button) return;
      state.filter = button.dataset.filter;
      renderChips();
      renderList();
      if (document.body.classList.contains("guide")) renderGuide();
    });

    $("search").addEventListener("input", () => {
      state.query = $("search").value;
      renderList();
      if (document.body.classList.contains("guide")) renderGuide();
    });

    $("list").addEventListener("click", (event) => {
      const button = event.target.closest("[data-n]");
      if (!button) return;
      const index = state.channels.findIndex((ch) => ch.n === Number(button.dataset.n));
      if (index >= 0) playChannel(index);
    });

    $("list").addEventListener("error", (event) => {
      if (event.target.tagName === "IMG") event.target.remove();
    }, true);

    $("ch-prev").addEventListener("click", () => zap(-1));
    $("ch-next").addEventListener("click", () => zap(1));
    $("play-btn").addEventListener("click", togglePlay);
    $("mute-btn").addEventListener("click", () => {
      video.muted = !video.muted;
      $("mute-btn").textContent = video.muted ? "Sonido" : "Silencio";
      try { localStorage.setItem("mltv:muted", video.muted ? "1" : "0"); } catch (err) { /* ignore */ }
    });
    $("volume").addEventListener("input", () => {
      video.volume = Number($("volume").value);
      if (video.volume > 0 && video.muted) {
        video.muted = false;
        $("mute-btn").textContent = "Silencio";
      }
      try { localStorage.setItem("mltv:volume", String(video.volume)); } catch (err) { /* ignore */ }
    });
    $("full-btn").addEventListener("click", () => {
      const node = $("bezel");
      if (document.fullscreenElement) document.exitFullscreen();
      else node.requestFullscreen().catch(() => {});
    });
    $("overlay-action").addEventListener("click", () => {
      if (state.overlayMode === "error") tune(current(), { rotate: true, force: true });
      else if (state.overlayMode === "gesture") video.play().then(hideOverlay).catch(() => {});
      else playChannel(state.current);
    });
    $("tab-tv").addEventListener("click", () => setView("tv"));
    $("tab-guide").addEventListener("click", () => setView("guide"));
    $("guide-now").addEventListener("click", () => {
      state.guideDay = madridKey(Date.now());
      renderGuide();
      requestAnimationFrame(scrollGuideToNow);
    });
    $("guide-refresh").addEventListener("click", hydrateEpg);
    $("days").addEventListener("click", (event) => {
      const button = event.target.closest("[data-day]");
      if (!button) return;
      state.guideDay = button.dataset.day;
      renderGuide();
    });
    $("guide-canvas").addEventListener("click", (event) => {
      const tuneBtn = event.target.closest("[data-tune]");
      if (tuneBtn) {
        const index = state.channels.findIndex((ch) => ch.n === Number(tuneBtn.dataset.tune));
        if (index >= 0) {
          setView("tv");
          playChannel(index);
        }
        return;
      }
      const prog = event.target.closest(".prog");
      if (!prog) return;
      const ch = state.channels.find((item) => item.n === Number(prog.dataset.n));
      const item = (state.guideMap.get(ch.n) || [])[Number(prog.dataset.i)];
      if (ch && item) openDetail(ch, item);
    });
    $("guide-canvas").addEventListener("error", (event) => {
      if (event.target.tagName === "IMG") event.target.remove();
    }, true);
    $("detail-tune").addEventListener("click", () => {
      if (!state.picked) return;
      const index = state.channels.findIndex((ch) => ch.n === state.picked.n);
      $("detail").hidden = true;
      setView("tv");
      if (index >= 0) playChannel(index);
    });
    $("bezel").addEventListener("click", () => {
      if (document.body.classList.contains("guide")) setView("tv");
    });
    video.addEventListener("click", (event) => {
      if (document.body.classList.contains("guide")) return;
      event.stopPropagation();
      if (state.phase === "playing") togglePlay();
    });
    video.addEventListener("play", () => { $("play-btn").textContent = "Pausa"; });
    video.addEventListener("pause", () => { $("play-btn").textContent = "Seguir"; });
    $("screen").addEventListener("error", (event) => {
      if (event.target.tagName === "IMG") event.target.remove();
    }, true);
    $("screen").addEventListener("mousemove", () => {
      if (state.phase === "playing") showOsd();
    });
    $("screen").addEventListener("wheel", (event) => {
      if (document.body.classList.contains("guide")) return;
      event.preventDefault();
      const now = Date.now();
      if (now - state.lastWheel < 450) return;
      state.lastWheel = now;
      zap(event.deltaY > 0 ? 1 : -1);
    }, { passive: false });

    window.addEventListener("keydown", (event) => {
      const typing = event.target.matches("input, textarea");
      if (typing) {
        if (event.key === "Escape") event.target.blur();
        return;
      }
      if (event.key === "ArrowUp") { event.preventDefault(); zap(-1); }
      else if (event.key === "ArrowDown") { event.preventDefault(); zap(1); }
      else if (event.key === "ArrowLeft" && document.body.classList.contains("guide")) {
        $("guide-scroll").scrollLeft -= HOUR / 2;
      } else if (event.key === "ArrowRight" && document.body.classList.contains("guide")) {
        $("guide-scroll").scrollLeft += HOUR / 2;
      } else if (event.key === "ArrowLeft") {
        video.volume = Math.max(0, video.volume - 0.05);
        $("volume").value = String(video.volume);
      } else if (event.key === "ArrowRight") {
        video.volume = Math.min(1, video.volume + 0.05);
        $("volume").value = String(video.volume);
      } else if (event.key === " " || event.key === "k") {
        event.preventDefault();
        togglePlay();
      } else if (event.key === "m") $("mute-btn").click();
      else if (event.key === "f") $("full-btn").click();
      else if (event.key === "g" || event.key === "G") {
        setView(document.body.classList.contains("guide") ? "tv" : "guide");
      } else if (event.key === "Escape") {
        if (!$("detail").hidden) $("detail").hidden = true;
        else if (document.body.classList.contains("guide")) setView("tv");
        else if (document.fullscreenElement) document.exitFullscreen();
      } else if (/^[0-9]$/.test(event.key)) pushDigit(event.key);
    });
  }

  function init() {
    state.channels = (window.MLTV_CHANNELS || []).map((ch) => ({ ...ch, urls: ch.urls.slice(), youtube: null }));
    state.epg = window.MLTV_EPG || {};
    state.epgUpdated = window.MLTV_EPG_UPDATED || 0;
    loadStoredSources();
    try {
      const rawVolume = localStorage.getItem("mltv:volume");
      const savedVolume = rawVolume == null ? NaN : Number(rawVolume);
      if (Number.isFinite(savedVolume)) {
        video.volume = savedVolume;
        $("volume").value = String(savedVolume);
      } else video.volume = 0.9;
      video.muted = localStorage.getItem("mltv:muted") === "1";
      if (video.muted) $("mute-btn").textContent = "Sonido";
    } catch (err) { video.volume = 0.9; }

    const last = Number(localStorage.getItem("mltv:last"));
    const index = state.channels.findIndex((ch) => ch.n === last);
    state.current = index >= 0 ? index : 0;
    bind();
    renderChips();
    renderList();
    showIdle();
    tickClock();
    setInterval(tickClock, 1000);
    setInterval(refreshNowLabels, 30000);
    document.querySelectorAll("img").forEach((img) => {
      img.addEventListener("error", () => img.remove());
    });
    officialData(false);
    hydrateEpg();
  }

  init();
})();
