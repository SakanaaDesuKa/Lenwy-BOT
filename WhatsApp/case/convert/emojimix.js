/*

     Create: Shannyie
     Telegram: t.me/Shannyiee

*/

export const info = {
  name: "Emoji Mix",

  menu: ["Convert"],
  case: ["emojimix", "emix"],

  description: "Gabungkan Dua Emoji Menjadi Satu!",
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
  const { command, q, LenwyText, LenwyWait, LenwyImage, lenwy, replyJid, len } = leni;

  switch (command) {
    case "emojimix":
    case "emix": {
      if (!q) return LenwyText("😵 *Contoh:* .emojimix 😊 😔");

      const args = q.trim().split(/\s+/);
      if (args.length < 2) return LenwyText("😵 *Masukkan 2 Emoji!*\n*Contoh:* .emojimix 😊 😔");

      const emoji1 = args[0];
      const emoji2 = args[1];

      LenwyWait();

      try {
        const url = `https://shiny-beta-six.vercel.app/api/tools/emojimix?emoji1=${encodeURIComponent(emoji1)}&emoji2=${encodeURIComponent(emoji2)}`;

        const res = await fetch(url);

        if (!res.ok) return LenwyText("⚠️ *Gagal Menggabungkan Emoji. Coba Emoji Lain!*");

        const contentType = res.headers.get("content-type");

        if (contentType && contentType.includes("image")) {
          const buffer = Buffer.from(await res.arrayBuffer());

          await lenwy.sendMessage(
            replyJid,
            {
              image: buffer,
              caption: `✨ *Emoji Mix*\n\n${emoji1} + ${emoji2} = 🎉`,
            },
            { quoted: len }
          );
        } else {
          const json = await res.json();
          if (json?.url) {
            await LenwyImage(json.url, `✨ *Emoji Mix*\n\n${emoji1} + ${emoji2} = 🎉`);
          } else {
            LenwyText("⚠️ *Format Respon Tidak Dikenali.*");
          }
        }
      } catch (err) {
        console.error("EmojiMix Error:", err);
        LenwyText(globalThis.mess.error);
      }

      break;
    }
  }
}