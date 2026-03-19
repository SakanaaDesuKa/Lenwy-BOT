/*

     Create: Shannyie
     Telegram: t.me/Shannyiee

*/

import os from "os";
import fs from "fs";
import path from "path";
import { performance } from "perf_hooks";
import { execSync } from "child_process";
import * as Jimp from 'jimp';

// --- COLOR PALETTE ---
const THEME = {
  bgBase:       0x050a14ff,
  cardBg:       0x0a192fff,
  accentCyan:   0x00f3ffff,
  accentGreen:  0x0aff0aff,
  accentYellow: 0xffd700ff,
  accentRed:    0xff003cff,
  textWhite:    0xffffffff,
  textDim:      0x8892b0ff,
};

const W = 1200, H = 675, PAD = 40;

// --- UTILITIES ---
const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

const formatTime = (seconds) => {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`;
};

const getCpuSpeed = () => {
  const cpus = os.cpus();
  let speed = cpus[0]?.speed;
  if ((!speed || speed === 0) && process.platform === "linux") {
    try {
      const cpuInfo = fs.readFileSync("/proc/cpuinfo", "utf8");
      const match = cpuInfo.match(/cpu MHz\s*:\s*([\d.]+)/i);
      if (match) speed = parseFloat(match[1]);
    } catch {}
  }
  return speed && speed > 0 ? `${speed.toFixed(0)} MHz` : "Virtual";
};

const getDiskUsage = () => {
  try {
    if (process.platform === "win32") return { total: 0, used: 0 };
    const res = execSync("df -k --output=size,used /")
      .toString().split("\n")[1].trim().split(/\s+/);
    return { total: parseInt(res[0]) * 1024, used: parseInt(res[1]) * 1024 };
  } catch { return { total: 0, used: 0 }; }
};

const getTrashSize = () => {
  try {
    const trashDir = path.join(process.cwd(), "WhatsApp", "database", "trash");
    if (!fs.existsSync(trashDir)) return 0;
    return fs.readdirSync(trashDir).reduce((total, file) => {
      try { return total + fs.statSync(path.join(trashDir, file)).size; }
      catch { return total; }
    }, 0);
  } catch { return 0; }
};

const getNetworkStats = () => {
  try {
    const data = fs.readFileSync("/proc/net/dev", "utf8");
    let rx = 0, tx = 0;
    data.split("\n").forEach((line) => {
      if (line.includes(":")) {
        const parts = line.split(":")[1].trim().split(/\s+/);
        rx += parseInt(parts[0]) || 0;
        tx += parseInt(parts[8]) || 0;
      }
    });
    return { rx, tx };
  } catch { return { rx: 0, tx: 0 }; }
};

// --- JIMP HELPERS ---
const drawProgressBar = (image, x, y, w, h, percent, color, label, fontMain) => {
  const pct = Math.min(Math.max(percent || 0, 0), 100);
  image.composite(new Jimp(w, h, 0x112240ff), x, y);
  if (pct > 0) {
    const fillW = Math.max(1, Math.floor((w * pct) / 100));
    image.composite(new Jimp(fillW, h, color), x, y);
  }
  image.print(fontMain, x, y - 25, label);
  const pctText = `${Math.round(pct)}%`;
  const textWidth = Jimp.measureText(fontMain, pctText);
  image.print(fontMain, x + w - textWidth, y - 25, pctText);
};

const drawTableRow = (image, x, y, w, label, value, color, font) => {
  image.composite(new Jimp(w, 1, 0x1d3557ff), x, y + 25);
  image.composite(new Jimp(5, 15, color), x, y + 2);
  image.print(font, x + 15, y, label);
  const valWidth = Jimp.measureText(font, value);
  image.print(font, x + w - valWidth, y, value);
};

// --- RENDER DASHBOARD ---
const renderDashboard = async (stats) => {
  const image = new Jimp(W, H, THEME.bgBase);

  const fontTitle = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
  const fontMain  = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);
  const fontSmall = await Jimp.loadFont(Jimp.FONT_SANS_14_WHITE);

  // Header
  image.composite(new Jimp(W, 80, 0x020408ff), 0, 0);
  image.composite(new Jimp(W, 3, THEME.accentCyan), 0, 80);
  image.print(fontTitle, PAD, 25, "DASHBOARD MONITORING SYSTEM");
  image.print(fontSmall, W - 200, 35, `LATENCY: ${stats.ping} ms`);

  // Left Column
  const col1X = PAD, col1Y = 120, col1W = 500;
  image.composite(new Jimp(5, 20, THEME.accentYellow), col1X, col1Y);
  image.print(fontMain, col1X + 15, col1Y, "RESOURCE USAGE");

  let barY = col1Y + 40;
  drawProgressBar(image, col1X, barY, col1W, 20, stats.cpuLoad, THEME.accentRed, `CPU (${stats.cpuCores} Cores)`, fontMain);
  barY += 70;
  drawProgressBar(image, col1X, barY, col1W, 20, (stats.ramUsed / stats.ramTotal) * 100, THEME.accentGreen, `RAM (${formatSize(stats.ramUsed)})`, fontMain);
  barY += 70;
  drawProgressBar(image, col1X, barY, col1W, 20, (stats.diskUsed / stats.diskTotal) * 100, THEME.accentCyan, `DISK (${formatSize(stats.diskUsed)})`, fontMain);
  barY += 70;
  drawProgressBar(image, col1X, barY, col1W, 20, stats.diskUsed > 0 ? (stats.trashSize / stats.diskUsed) * 100 : 0, THEME.textDim, `TRASH (${formatSize(stats.trashSize)})`, fontMain);

  // Network
  const netY = barY + 70;
  image.composite(new Jimp(col1W, 100, THEME.cardBg), col1X, netY);
  image.composite(new Jimp(3, 100, THEME.accentYellow), col1X, netY);
  image.print(fontSmall, col1X + 20, netY + 20, "NETWORK TRAFFIC");
  image.print(fontMain,  col1X + 20, netY + 50, `UPLOAD   : ${formatSize(stats.tx)}`);
  image.print(fontMain,  col1X + 200, netY + 50, `DOWNLOAD : ${formatSize(stats.rx)}`);

  // Right Column
  const col2X = 600, col2Y = 120, col2W = W - 600 - PAD;
  image.composite(new Jimp(5, 20, THEME.accentYellow), col2X, col2Y);
  image.print(fontMain, col2X + 15, col2Y, "SYSTEM PARAMETERS");
  image.composite(new Jimp(col2W, 400, THEME.cardBg), col2X, col2Y + 40);

  let rowY = col2Y + 60;
  const rowGap = 50;
  const rows = [
    ["BOT OWNER", stats.ownerName,                       THEME.accentCyan],
    ["PLATFORM",  stats.platform,                        THEME.accentGreen],
    ["NODE.JS",   stats.nodeVersion,                     THEME.accentYellow],
    ["CPU MODEL", stats.cpuModel.substring(0, 20),       THEME.textWhite],
    ["CPU SPEED", stats.cpuSpeed,                        THEME.textDim],
    ["UPTIME",    stats.uptimeBot,                       THEME.accentRed],
    ["DB SIZE",   formatSize(stats.botDataSize),         THEME.accentCyan],
  ];
  for (const [label, value, color] of rows) {
    drawTableRow(image, col2X + 20, rowY, col2W - 40, label, value, color, fontMain);
    rowY += rowGap;
  }

  return await image.getBufferAsync(Jimp.MIME_JPEG);
};

// =================================================================

export const info = {
  name: "System Dashboard",

  menu: ["Owner"],
  case: ["ping", "info", "dashboard"],

  description: "Monitoring Sistem Bot (CPU, RAM, Disk, Network)",
  hidden: false,

  owner: true,
  premium: false,
  group: false,
  private: false,
  admin: false,
  botAdmin: false,

  allowPrivate: false,
};

export default async function handler(leni) {
  const { msg, lenwy, replyJid, len, LenwyText } = leni;

  const start = performance.now();

  try {
    await lenwy.sendMessage(replyJid, { react: { text: "⚡", key: msg.key } });

    const ping        = Math.max(1, Math.round(performance.now() - start));
    const cpus        = os.cpus();
    const totalMem    = os.totalmem();
    const freeMem     = os.freemem();
    const { total: diskTotal, used: diskUsed } = getDiskUsage();
    const { rx, tx }  = getNetworkStats();
    const trashSize   = getTrashSize();

    // owner name dari globalThis (LenwySet.js)
    let ownerName = "OWNER";
    try {
      const ownerNums = globalThis.creator || [];
      const firstNum  = Array.isArray(ownerNums) ? ownerNums[0] : ownerNums;
      if (firstNum) {
        const fetched = await lenwy.getName?.(firstNum + "@s.whatsapp.net");
        if (fetched) ownerName = fetched.toUpperCase();
      }
    } catch {}

    let platformName = os.type();
    if (platformName === "Darwin")      platformName = "macOS";
    else if (platformName === "Windows_NT") platformName = "Windows";

    const stats = {
      ping,
      ownerName,
      platform:     platformName,
      nodeVersion:  process.version,
      uptimeBot:    formatTime(process.uptime()),
      cpuModel:     cpus[0]?.model?.replace(/\(R\)|\(TM\)|CPU|@/gi, "").trim() || "Virtual Core",
      cpuSpeed:     getCpuSpeed(),
      cpuCores:     cpus.length,
      cpuLoad:      Math.min(100, Math.round(os.loadavg()[0] * 10)),
      ramTotal:     totalMem,
      ramUsed:      totalMem - freeMem,
      diskTotal,
      diskUsed,
      trashSize,
      rx,
      tx,
      botDataSize:  0, // Lenwy SCM tidak pakai global.db
    };

    const imageBuffer = await renderDashboard(stats);

    const caption = `📊 *SYSTEM DASHBOARD*
━━━━━━━━━━━━━━━━━━━
📡 Latency : ${stats.ping} ms
💾 RAM     : ${formatSize(stats.ramUsed)} / ${formatSize(stats.ramTotal)}
💻 OS      : ${stats.platform}
⏱️ Uptime  : ${stats.uptimeBot}
━━━━━━━━━━━━━━━━━━━`;

    await lenwy.sendMessage(replyJid, { image: imageBuffer, caption }, { quoted: len });

  } catch (err) {
    console.error("[PING ERROR]", err);
    LenwyText(`❌ Error: ${err.message}`);
  }
}
