// Thin wrapper over the Telegram WebApp SDK with a browser fallback for local dev.

export const tg = window.Telegram?.WebApp;

export function initTelegram() {
  if (!tg) return;
  tg.ready();
  tg.expand();
  applyTheme();
}

function applyTheme() {
  const root = document.documentElement;
  const p = tg?.themeParams ?? {};
  root.style.setProperty("--tg-bg", p.bg_color ?? "#ffffff");
  root.style.setProperty("--tg-text", p.text_color ?? "#000000");
  root.style.setProperty("--tg-hint", p.hint_color ?? "#999999");
  root.style.setProperty("--tg-card", p.secondary_bg_color ?? "#f4f4f5");
}

// initData string for backend HMAC auth. Empty in plain browser dev.
export function getInitData(): string {
  return tg?.initData ?? "";
}

export function getLanguage(): "uz" | "ru" {
  const code = tg?.initDataUnsafe?.user?.language_code ?? "uz";
  return code.startsWith("ru") ? "ru" : "uz";
}

export function haptic(type: "light" | "medium" | "heavy" = "light") {
  tg?.HapticFeedback?.impactOccurred(type);
}

export const mainButton = tg?.MainButton;
export const backButton = tg?.BackButton;
