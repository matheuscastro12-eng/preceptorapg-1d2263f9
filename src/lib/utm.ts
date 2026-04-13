// ============================================================
// UTM source normalization
// ============================================================
// Consolida apelidos do mesmo canal num valor canonico para
// nao fragmentar o relatorio de Source no painel de Analytics
// (ex: "fb" e "facebook" eram contados separados).

const SOURCE_ALIASES: Record<string, string> = {
  // Facebook / Meta Ads
  fb: "facebook",
  fb_ads: "facebook",
  fbads: "facebook",
  meta: "facebook",
  meta_ads: "facebook",
  metaads: "facebook",
  "l.facebook.com": "facebook",
  "lm.facebook.com": "facebook",
  "m.facebook.com": "facebook",

  // Instagram
  ig: "instagram",
  insta: "instagram",
  ig_ads: "instagram",
  igads: "instagram",
  "l.instagram.com": "instagram",

  // Google
  ggl: "google",
  goog: "google",
  google_ads: "google",
  googleads: "google",
  gads: "google",
  adwords: "google",
  "google.com": "google",
  "www.google.com": "google",
  "l.google.com": "google",

  // YouTube
  yt: "youtube",
  "youtu.be": "youtube",
  "youtube.com": "youtube",
  "www.youtube.com": "youtube",
  "m.youtube.com": "youtube",

  // TikTok
  tt: "tiktok",
  tiktok_ads: "tiktok",
  "tiktok.com": "tiktok",
  "www.tiktok.com": "tiktok",

  // LinkedIn
  li: "linkedin",
  linkedin_ads: "linkedin",
  "linkedin.com": "linkedin",
  "www.linkedin.com": "linkedin",
  "lnkd.in": "linkedin",

  // Twitter / X
  tw: "twitter",
  x: "twitter",
  "x.com": "twitter",
  "twitter.com": "twitter",
  "www.twitter.com": "twitter",
  "t.co": "twitter",

  // WhatsApp
  wa: "whatsapp",
  whatsapp_ads: "whatsapp",
  "wa.me": "whatsapp",
  "api.whatsapp.com": "whatsapp",

  // Telegram
  tg: "telegram",
  "t.me": "telegram",

  // Email providers (todos viram "email")
  email_marketing: "email",
  newsletter: "email",
  resend: "email",
  mailchimp: "email",

  // Bing
  "bing.com": "bing",
  "www.bing.com": "bing",

  // Direct variants (host do proprio site = direct)
  "thepreceptor.com.br": "direct",
  "www.thepreceptor.com.br": "direct",
};

/**
 * Normaliza o valor de utm_source para evitar fragmentacao no relatorio.
 * - Lowercase + trim
 * - Mapeia apelidos conhecidos (fb -> facebook, ig -> instagram, etc.)
 * - Preserva valores desconhecidos (so lowercase) para nao perder dados
 */
export function normalizeUtmSource(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const cleaned = String(raw).toLowerCase().trim();
  if (!cleaned) return null;
  return SOURCE_ALIASES[cleaned] ?? cleaned;
}
