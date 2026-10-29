import { useCallback, useEffect, useState } from "react";

export type Route = "home" | "map" | "household" | "population";
const ROUTES: Route[] = ["home", "map", "household", "population"];

/**
 * 해시 기반 라우팅: 정적 호스팅(GitHub Pages 등)에서도 새로고침·공유 링크가 그대로 동작한다.
 * "#/map?sel=양천구" 처럼 쿼리를 붙이면 화면에 넘길 값(params)이 된다.
 */
function parse(hash: string): { route: Route; query: string } {
  const body = hash.replace(/^#\/?/, "");
  const [id, query = ""] = body.split("?");
  return { route: (ROUTES as string[]).includes(id) ? (id as Route) : "home", query };
}

export function useRoute() {
  const [state, setState] = useState(() => parse(window.location.hash));

  useEffect(() => {
    // "#content" 같은 문서 안 앵커는 화면 전환이 아니므로 무시한다
    const on = () => {
      const h = window.location.hash;
      if (h && h !== "#" && !h.startsWith("#/")) return;
      setState(parse(h));
    };
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);

  const navigate = useCallback((to: Route) => {
    const next = hrefOf(to);
    if (window.location.hash === next) {
      window.scrollTo({ top: 0 });
      return;
    }
    window.location.hash = next;
  }, []);

  return { route: state.route, params: new URLSearchParams(state.query), navigate };
}

export const hrefOf = (to: Route) => (to === "home" ? "#/" : `#/${to}`);
