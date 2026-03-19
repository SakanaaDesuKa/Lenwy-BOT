/*

     Create: Shannyie
     Telegram: t.me/Shannyiee

*/

export const info = {
  name: "Market Tracker",

  menu: ["Market"],
  case: ["market", "pasar", "crypto", "forex"],

  description: "Cek Harga Crypto & Forex Real-Time",
  hidden: false,

  owner: false,
  premium: false,
  group: false,
  private: false,
  admin: false,
  botAdmin: false,

  allowPrivate: false,
};

export default async function handler(leni) {
  const { msg, lenwy, replyJid, LenwyText, LenwyWait } = leni;

  LenwyWait();

  try {
    const cryptoPairs = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];

    const [cryptoResults, fxRes] = await Promise.all([
      Promise.all(
        cryptoPairs.map((pair) =>
          fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${pair}`).then((r) => r.json())
        )
      ),
      fetch("https://open.er-api.com/v6/latest/USD").then((r) => r.json()),
    ]);

    const rates = fxRes.rates;
    const eurUsd = (1 / rates.EUR).toFixed(5);
    const gbpUsd = (1 / rates.GBP).toFixed(5);
    const usdJpy = rates.JPY.toFixed(3);

    const formatPrice = (price) =>
      parseFloat(price).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    const formatChange = (change) => {
      const num = parseFloat(change);
      return num > 0 ? `+${num.toFixed(2)}% 🟢` : `${num.toFixed(2)}% 🔴`;
    };

    const time = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });

    const text = `╭─── [ 📈 MARKET TRACKER ] ───
│ ⏱️ *Update:* ${time} WIB
│
├─ [ 💱 FOREX (MAJOR PAIRS) ]
│  ⊳ *EUR/USD:* ${eurUsd}
│  ⊳ *GBP/USD:* ${gbpUsd}
│  ⊳ *USD/JPY:* ${usdJpy}
│
├─ [ 🪙 CRYPTO (24H STATS) ]
│  ⊳ *BTC/USDT:* $${formatPrice(cryptoResults[0].lastPrice)}
│      └ Trend: ${formatChange(cryptoResults[0].priceChangePercent)}
│
│  ⊳ *ETH/USDT:* $${formatPrice(cryptoResults[1].lastPrice)}
│      └ Trend: ${formatChange(cryptoResults[1].priceChangePercent)}
│
│  ⊳ *SOL/USDT:* $${formatPrice(cryptoResults[2].lastPrice)}
│      └ Trend: ${formatChange(cryptoResults[2].priceChangePercent)}
╰───────────────────────────`;

    await lenwy.sendMessage(replyJid, { react: { text: "🪙", key: msg.key } });
    await LenwyText(text);
    await lenwy.sendMessage(replyJid, { react: { text: "💰", key: msg.key } });

  } catch (err) {
    console.error("[MARKET ERROR]", err);
    LenwyText("❌ Gagal mengambil data pasar. Server API mungkin sedang sibuk.");
  }
}
