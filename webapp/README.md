# 서울의 표심 (웹앱)

팀 양천허씨 · 2026 데이터분석 연구발표회

## 실행
```bash
cd webapp
npm install
npm run dev        # 개발 서버 (시각화 HTML 동기화 포함)
npm run build      # dist/ 생성 (정적 파일)
npm run preview    # dist/ 를 http://localhost:4173 에서 확인
```
`dist/index.html`을 파일로 직접 열면(file://) 동작하지 않습니다. 반드시 웹 서버(preview 또는 호스팅)로 여세요.

## 데이터가 바뀌었을 때
```bash
python viz/build_dashboard.py       # 01 득표 지도 · 연령×성별
python viz/build_heatmap.py         # 02 가구 구성 히트맵
python viz/build_pop_heatmap.py     # 03 인구지표 히트맵
python viz/build_app_data.py        # 홈 화면 요약 수치
cd webapp && npm run build
```

## 배포
`dist/` 폴더 전체를 정적 호스팅(GitHub Pages, Netlify, Vercel 등)에 올리면 됩니다. 자산 경로가 상대 경로(`base: "./"`)라 하위 폴더에 올려도 동작합니다.

## 구조
- `src/components/ui/perspective-tunnel-hero.tsx` — 홈 터널 히어로 (framer-motion)
- `src/components/tunnel-cards.tsx`, `src/components/minis.tsx` — 실제 데이터로 그린 카드·미니 시각화
- `src/pages/home.tsx`, `src/pages/section.tsx` — 홈 / 분석 화면 (사이드바·탭)
- `src/components/viz-frame.tsx` — 시각화 iframe (높이 자동, 테마 동기화)
- `public/viz/` — `npm run sync`가 `../viz/*.html`에서 복사 (직접 수정하지 말 것)
- 디자인 결정: [DESIGN.md](DESIGN.md)
