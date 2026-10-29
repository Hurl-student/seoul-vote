// ../viz 에서 빌드한 시각화 HTML 3개와 Pretendard 웹폰트를 public/ 으로 복사한다.
// 시각화 파일은 iframe(?embed=1)으로 들어가므로, 앱과 같은 글꼴을 쓰도록 <head>에 폰트 링크를 넣는다.
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const vizSrc = join(root, "..", "viz");
const pub = join(root, "public");

const FILES = {
  "seoul_vote_dashboard.html": "map.html",
  "household_heatmap.html": "household.html",
  "population_heatmap.html": "population.html",
};

const FONT_SRC = join(root, "node_modules", "pretendard", "dist", "web", "variable");
const FONT_DST = join(pub, "fonts", "pretendard");
mkdirSync(FONT_DST, { recursive: true });
cpSync(join(FONT_SRC, "pretendardvariable-dynamic-subset.css"), join(FONT_DST, "pretendardvariable-dynamic-subset.css"));
cpSync(join(FONT_SRC, "woff2-dynamic-subset"), join(FONT_DST, "woff2-dynamic-subset"), { recursive: true });

const HEAD = `<link rel="stylesheet" href="../fonts/pretendard/pretendardvariable-dynamic-subset.css">
<style>.sv,.hv,.tip{font-family:"Pretendard Variable","Pretendard","Apple SD Gothic Neo","Noto Sans KR","Malgun Gothic",system-ui,sans-serif !important}</style>
</head>`;

mkdirSync(join(pub, "viz"), { recursive: true });
for (const [src, dst] of Object.entries(FILES)) {
  const from = join(vizSrc, src);
  if (!existsSync(from)) throw new Error(`시각화 파일이 없습니다: ${from} (python viz/build_*.py 로 먼저 빌드)`);
  const html = readFileSync(from, "utf8");
  if (!html.includes("</head>")) throw new Error(`</head> 없음: ${src}`);
  writeFileSync(join(pub, "viz", dst), html.replace("</head>", HEAD), "utf8");
  console.log(`viz: ${src} → public/viz/${dst}`);
}
