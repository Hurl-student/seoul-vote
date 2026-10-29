import type { Theme } from "./theme";

/** OKLCH → sRGB hex. 색역 밖이면 채도를 줄인다 (시각화 HTML 의 colorOf 와 같은 식). */
export function oklch2hex(L: number, C: number, h: number): string {
  const g = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
  let rgb = [0, 0, 0];
  for (let k = 0; k < 60; k++) {
    const a = C * Math.cos((h * Math.PI) / 180);
    const b = C * Math.sin((h * Math.PI) / 180);
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    rgb = [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    ];
    if (rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4)) break;
    C *= 0.95;
  }
  return "#" + rgb.map((v) => Math.round(g(Math.min(1, Math.max(0, v))) * 255).toString(16).padStart(2, "0")).join("");
}

/** 히트맵 칸 색: 양(+) 빨강, 음(−) 파랑 (중간은 회색). |β|/sat 가 클수록 진하다 (household sat=1.0, population sat=1.5). */
export function heatColor(beta: number, sat: number, theme: Theme): string {
  const t = Math.min(1, Math.abs(beta) / sat);
  const h = beta >= 0 ? 27 : 258;
  const L = theme === "dark" ? 0.33 + 0.27 * t : 0.955 - 0.6 * t;
  const C = (beta >= 0 ? 0.215 : 0.19) * Math.min(1, t * 1.35);
  return oklch2hex(L, C, h);
}

/** 미니 지도: 이재명 − 윤석열 격차(%p). 파랑 = 이재명 우세, 빨강 = 윤석열 우세, 20%p 이상이면 가장 진함. */
export function marginColor(margin: number, theme: Theme): string {
  const t = Math.min(1, Math.abs(margin) / 20);
  const h = margin >= 0 ? 258 : 27;
  const L = theme === "dark" ? 0.4 + 0.3 * t : 0.86 - 0.42 * t;
  const C = 0.07 + 0.16 * t;
  return oklch2hex(L, C, h);
}

const lum = (hex: string) => {
  const c = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
/** 배경색 위에서 대비가 더 큰 글자색 (흰/검) */
export function textOn(hex: string): string {
  const L = lum(hex);
  return (1.05 / (L + 0.05)) >= ((L + 0.05) / 0.05) ? "#ffffff" : "#000000";
}
