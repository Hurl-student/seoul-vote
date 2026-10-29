import { useCallback, useEffect, useState } from "react";

export type ThemePref = "auto" | "light" | "dark";
export type Theme = "light" | "dark";

const KEY = "svl-theme";
const mq = () => window.matchMedia("(prefers-color-scheme: dark)");

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    return v === "light" || v === "dark" ? v : "auto";
  } catch {
    return "auto";
  }
}

const resolve = (pref: ThemePref): Theme => (pref === "auto" ? (mq().matches ? "dark" : "light") : pref);

/** 자동/라이트/다크 선택을 저장하고, 실제 적용 테마를 <html data-theme> 에 반영한다. */
export function useTheme() {
  const [pref, setPrefState] = useState<ThemePref>(readPref);
  const [theme, setTheme] = useState<Theme>(() => resolve(readPref()));

  useEffect(() => {
    const apply = () => {
      const t = resolve(pref);
      setTheme(t);
      document.documentElement.dataset.theme = t;
    };
    apply();
    if (pref !== "auto") return;
    const m = mq();
    m.addEventListener("change", apply);
    return () => m.removeEventListener("change", apply);
  }, [pref]);

  const setPref = useCallback((p: ThemePref) => {
    setPrefState(p);
    try {
      if (p === "auto") localStorage.removeItem(KEY);
      else localStorage.setItem(KEY, p);
    } catch {
      /* 저장 불가(시크릿 창 등)여도 화면은 정상 동작 */
    }
  }, []);

  return { pref, theme, setPref };
}
