import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Suspense, lazy, useEffect } from "react";
import { useRoute, type Route } from "@/lib/router";
import { sectionOf } from "@/lib/sections";
import { useTheme } from "@/lib/theme";

// 화면별로 코드를 나눠, 처음 여는 화면에 필요한 코드만 먼저 받는다
const HomePage = lazy(() => import("@/pages/home"));
const SectionPage = lazy(() => import("@/pages/section"));

const ORDER: Route[] = ["home", "map", "household", "population"];
const KEYS: Record<string, Route> = { "0": "home", "1": "map", "2": "household", "3": "population" };

export default function App() {
  const { route, params, navigate } = useRoute();
  const { pref, theme, setPref } = useTheme();
  const reduce = useReducedMotion();

  // 화면을 옮기면 맨 위에서 시작하고, 탭 제목도 바꾼다
  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.title = route === "home" ? "서울의 표심 · 팀 양천허씨" : `${sectionOf(route).no} ${sectionOf(route).title} · 서울의 표심`;
  }, [route]);

  // 발표용 단축키: 0 홈 · 1/2/3 분석 · ←/→ 이전·다음 (입력 칸·수정 키 조합에서는 무시)
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input,textarea,select,[contenteditable]")) return;
      if (KEYS[e.key]) {
        navigate(KEYS[e.key]);
        return;
      }
      if (route !== "home" && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
        const i = ORDER.indexOf(route) + (e.key === "ArrowRight" ? 1 : -1);
        if (i >= 0 && i < ORDER.length) {
          e.preventDefault();
          navigate(ORDER[i]);
        }
      }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [route, navigate]);

  return (
    <>
      <a
        href="#content"
        className="sr-only z-50 rounded-full bg-ink px-4 py-2 font-bold text-paper focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        본문으로 건너뛰기
      </a>
      <Suspense fallback={<div className="min-h-svh bg-paper" aria-busy="true" />}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={route}
            // filter·남는 transform 은 fixed 요소(맨 위로 버튼 등)의 기준을 바꾸므로 쓰지 않는다 (y 는 0 에서 transform 이 사라짐)
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 1 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            {route === "home" ? (
              <HomePage theme={theme} pref={pref} setPref={setPref} />
            ) : (
              <SectionPage id={route} theme={theme} pref={pref} setPref={setPref} sel={params.get("sel")} />
            )}
          </motion.div>
        </AnimatePresence>
      </Suspense>
    </>
  );
}
