#!/usr/bin/env node
// Regenera js/epg.js desde la EPG pública de TDTChannels.
// Uso: node update-epg.js
// (hace falta al abrir la tele como file://: el navegador no puede descargar TV.json por CORS)

const fs = require("fs");
const https = require("https");
const path = require("path");

const EPG_URL = "https://www.tdtchannels.com/epg/TV.json";
const OUT = path.join(__dirname, "js", "epg.js");

function get(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "mylocaltv-update-epg" } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          get(res.headers.location).then(resolve, reject);
          return;
        }
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          if (res.statusCode !== 200) reject(new Error(`HTTP ${res.statusCode}`));
          else resolve(Buffer.concat(chunks).toString("utf8"));
        });
      })
      .on("error", reject);
  });
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

get(EPG_URL)
  .then((raw) => {
    const epg = compactEpg(JSON.parse(raw));
    const updated = Math.floor(Date.now() / 1000);
    fs.writeFileSync(OUT, `window.MLTV_EPG_UPDATED = ${updated};\nwindow.MLTV_EPG = ${JSON.stringify(epg)};\n`);
    const when = new Date(updated * 1000).toLocaleString("es-ES", { timeZone: "Europe/Madrid" });
    console.log(`EPG actualizada · ${Object.keys(epg).length} canales · ${when}`);
    console.log(`Escrito: ${OUT}`);
  })
  .catch((err) => {
    console.error(err.message || err);
    process.exit(1);
  });
