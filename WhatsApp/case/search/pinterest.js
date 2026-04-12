export const info = {
  name: "Image Pinterest",

  menu: ["Pin"],
  case: ["pin"],

  description: "Image search Pinterest (fast, no API, stable)",

  hidden: false,
  owner: false,
  premium: false,
  group: false,
  private: false,
  admin: false,
  botAdmin: false,
};

async function pinterestSearch(query, limit = 20) {
  const url =
    "https://www.pinterest.com/resource/BaseSearchResource/get/?data=" +
    encodeURIComponent(
      JSON.stringify({
        options: {
          query: query,
          scope: "pins",
          page_size: limit,
        },
      }),
    );

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      Accept: "application/json, text/javascript",
      "Accept-Language": "en-US,en;q=0.9",
      "x-pinterest-pws-handler": "www/search/[scope].js",
    },
  });

  const json = await res.json();

  const results = [];
  const data = json?.resource_response?.data?.results || [];

  for (const item of data) {
    const img =
      item?.images?.orig?.url ||
      item?.images?.["736x"]?.url ||
      item?.images?.["564x"]?.url;

    if (img) {
      results.push({
        original_url: img,
        preview_url: img,
      });
    }
  }

  return results;
}

export default async function handler(leni) {
  const { q, LenwyText, lenwy, replyJid, msg } = leni;

  if (!q) {
    return LenwyText("*Contoh:* .Pin Ruridragon");
  }

  try {
    const [query, limitInput = "3"] = q.split("|").map((v) => v.trim());
    let limit = Math.min(parseInt(limitInput) || 3);

    if (!query) return LenwyText("❌ Query kosong.");

    await LenwyText(`☕ Mencari Gambar *${query}*`);

    let results = await pinterestSearch(query, 20);

    if (!results || results.length === 0) {
      return LenwyText("🍂 Gambar tidak ditemukan.");
    }

    results = results.filter((v) => v?.original_url);

    results = results.sort(() => Math.random() - 0.5).slice(0, limit);

    await Promise.all(
      results.map((img, i) =>
        lenwy.sendMessage(
          replyJid,
          {
            image: { url: img.original_url },
            caption: `☕ *${query} (${i + 1}/${results.length})*`,
          },
          { quoted: msg },
        ),
      ),
    );
  } catch (err) {
    console.error(err);
    return LenwyText("❌ Error saat mengambil gambar.");
  }
}
