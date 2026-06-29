export function money(value: number): string {
  return value.toLocaleString("ru-RU").replace(/,/g, " ");
}

/** O'zbek raqamini "+998 88 888 88 88" ko'rinishiga keltiradi.
 *  Bo'sh kiritma — bo'sh qatlam (placeholder ko'rinishi uchun). */
export function formatUzPhone(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("998")) d = d.slice(3);
  d = d.slice(0, 9);
  if (!d) return "";
  const parts = ["+998"];
  if (d.length > 0) parts.push(d.slice(0, 2));
  if (d.length > 2) parts.push(d.slice(2, 5));
  if (d.length > 5) parts.push(d.slice(5, 7));
  if (d.length > 7) parts.push(d.slice(7, 9));
  return parts.join(" ");
}
