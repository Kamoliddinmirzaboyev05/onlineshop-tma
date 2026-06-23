export function money(value: number): string {
  return value.toLocaleString("ru-RU").replace(/,/g, " ");
}
