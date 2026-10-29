import { useEffect, useState } from "react";

/** 미디어 쿼리 일치 여부. 숨긴 요소를 아예 그리지 않아 WebGL(액체 금속 버튼) 컨텍스트를 아낀다. */
export function useMedia(query: string) {
  const [match, setMatch] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const m = window.matchMedia(query);
    const on = () => setMatch(m.matches);
    on();
    m.addEventListener("change", on);
    return () => m.removeEventListener("change", on);
  }, [query]);
  return match;
}
