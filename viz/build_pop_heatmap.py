"""인구지표 × 투표율/득표율 다중 회귀 히트맵 빌드 스크립트.

입력 : data/raw/주요_인구지표_시군구_2025.csv   (KOSIS DT_1IN2030 「주요 인구지표(부양비, 노령화지수, 중위연령 등) - 시군구」, 인구총조사 2025)
       data/raw/02_성별·연령대별 투표율(구시군별).xlsx  → '전체 투표율' (표본 투표구, 구별 합계)
       data/raw/서울 득표율.xlsx                          → 이재명·윤석열 득표율 (유효투표수 기준)
출력 : viz/population_heatmap.html (외부 의존성 없는 단일 HTML)

실행 : python viz/build_pop_heatmap.py
"""
import csv
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
import mreg  # noqa: E402
from build_heatmap import load_turnout, load_votes, OUTCOMES  # noqa: E402

POP_CSV = ROOT / "data" / "raw" / "주요_인구지표_시군구_2025.csv"
TEMPLATE = Path(__file__).resolve().parent / "pop_heatmap_template.html"
OUT = Path(__file__).resolve().parent / "population_heatmap.html"

# 행(=y축) 순서: 총부양비 → 유소년부양비 → 노년부양비 → 노령화지수 → 중위연령 → 평균연령
ROWS = [
    dict(label="총부양비", desc="유소년+노년 부양비의 합", unit="", dec=1, step=1, stepTxt="1"),
    dict(label="유소년부양비", desc="생산연령(15–64세) 100명당 유소년(0–14세)", unit="", dec=1, step=1, stepTxt="1"),
    dict(label="노년부양비", desc="생산연령 100명당 고령(65세 이상)", unit="", dec=1, step=1, stepTxt="1"),
    dict(label="노령화지수", desc="유소년 100명당 고령 인구", unit="", dec=0, step=10, stepTxt="10"),
    dict(label="중위연령", desc="나이순으로 세웠을 때 한가운데 나이", unit="세", dec=1, step=1, stepTxt="1세"),
    dict(label="평균연령", desc="전체 인구의 산술평균 나이", unit="세", dec=1, step=1, stepTxt="1세"),
]


def load_population():
    rows = list(csv.reader(POP_CSV.open(encoding="utf-8")))
    head, body = rows[0], rows[2:]          # rows[1] = 서울특별시 전체
    return head, {r[0]: [float(x) for x in r[1:]] for r in body}


def build_mr(names, raw, y):
    """결과변수 3개(OUTCOMES 순서) 각각에 대한 다중 회귀. 설명변수 5개: 유소년부양비·노년부양비·노령화지수·중위연령·평균연령.

    총부양비 = 유소년부양비 + 노년부양비라 셋을 한꺼번에 넣을 수 없다(완전 공선). 그래서 6번째 행(총부양비)은
    ‘총부양비가 1 늘고, 늘어난 만큼이 유소년·노년 부양비에 현재 평균 비율(p : 1-p)대로 나뉘어 반영될 때’의 효과
    = p·b_유소년 + (1-p)·b_노년 (선형 결합, 표준오차는 공분산행렬에서)로 계산한다. 같은 값은 모형을
    (총부양비 T, D = 유소년 − p·T, ...)로 바꿔 적합해도 T의 계수로 나오며(아래에서 대조), 이때 T의 VIF도 얻는다.
    산점도용 부분잔차 = 결과변수 − (이 행 이외의 기여)이므로 절편 a와 기울기 b로 회귀선이 그려진다."""
    n = len(names)
    yo, no, ag, md, mn = ([raw[nm][k] for nm in names] for k in (1, 2, 3, 4, 5))
    tot = [a + b for a, b in zip(yo, no)]                       # 총부양비 = 유소년 + 노년 (파일 표기와 0.1 이내 차이: 반올림)
    p = mreg.mean(yo) / (mreg.mean(yo) + mreg.mean(no))          # 평균적인 유소년 몫
    D = [a - p * t for a, t in zip(yo, tot)]
    xcols = [tot, yo, no, ag, md, mn]
    X5 = [[yo[i], no[i], ag[i], md[i], mn[i]] for i in range(n)]
    XR = [[tot[i], D[i], ag[i], md[i], mn[i]] for i in range(n)]
    names5 = ["유소년부양비", "노년부양비", "노령화지수", "중위연령", "평균연령"]
    out, check = [], 0.0
    for key in OUTCOMES:
        yv = y[key]
        m = mreg.ols(X5, yv, names5)
        r = mreg.ols(XR, yv, ["총부양비", "D"] + names5[2:])
        bs = [c["b"] for c in m["coefs"][1:]]                    # b_유소년, b_노년, b_노령화, b_중위, b_평균
        a0 = m["coefs"][0]["b"]
        # 총부양비 행 = 재매개 모형의 T 계수 (선형결합과 같아야 함)
        v = [p, 1 - p, 0, 0, 0]
        cov = [[m["cov"][i + 1][j + 1] for j in range(5)] for i in range(5)]
        se_lc = math.sqrt(sum(v[i] * cov[i][j] * v[j] for i in range(5) for j in range(5)))
        b_lc = p * bs[0] + (1 - p) * bs[1]
        check = max(check, abs(b_lc - r["coefs"][1]["b"]), abs(se_lc - r["coefs"][1]["se"]), abs(a0 - r["coefs"][0]["b"]))
        bD = r["coefs"][2]["b"]
        rows = []
        for k in range(6):
            c = r["coefs"][1] if k == 0 else m["coefs"][k]       # k=0: 재매개 T계수, k≥1: 원 모형 계수
            col = xcols[k]
            if k == 0:
                pr = [yv[i] - bD * D[i] - sum(bs[j] * X5[i][j] for j in (2, 3, 4)) for i in range(n)]
            else:
                pr = [yv[i] - sum(bs[j] * X5[i][j] for j in range(5) if j != k - 1) for i in range(n)]
            rows.append(dict(i=k, b=c["b"], se=c["se"], t=c["t"], p=c["p"], lo=c["lo"], hi=c["hi"],
                             beta=c["b"] * mreg.sd(col) / mreg.sd(yv), vif=c["vif"],
                             cpr=[[round(col[i], 8), round(pr[i], 8)] for i in range(n)]))
        out.append(dict(n=m["n"], df=m["df"], r2=m["r2"], adj=m["adj_r2"], F=m["F"], pF=m["p_F"], a=a0, coefs=rows,
                        r2_check=abs(m["r2"] - r["r2"])))
    assert check < 1e-7, check
    return out, p, tot


def main():
    head, raw = load_population()
    turn, votes = load_turnout(), load_votes()
    assert set(raw) == set(turn) == set(votes) and len(raw) == 25
    names = list(raw)
    y = dict(turn=[turn[n] for n in names], yoon=[votes[n][1] for n in names], lee=[votes[n][0] for n in names])
    mr, p, tot = build_mr(names, raw, y)
    districts = [dict(name=n, x=[round(tot[i], 4)] + raw[n][1:], turn=turn[n], lee=round(votes[n][0], 8),
                      yoon=round(votes[n][1], 8)) for i, n in enumerate(names)]
    payload = dict(districts=districts, rows=ROWS, share=p, mr=mr)
    html = TEMPLATE.read_text(encoding="utf-8").replace(
        "__DATA__", json.dumps(payload, ensure_ascii=False, separators=(",", ":")))
    OUT.write_text(html, encoding="utf-8")
    print("wrote", OUT.name, f"{OUT.stat().st_size/1024:.0f} KB", "유소년 몫 p=%.3f" % p)
    for key, m in zip(OUTCOMES, mr):
        print(key, "R2 %.3f adj %.3f Fp %.4f" % (m["r2"], m["adj"], m["pF"]),
              [f"{ROWS[c['i']]['label']} β{c['beta']:+.2f} p{c['p']:.3f} VIF{c['vif']:.0f}" for c in m["coefs"]])


if __name__ == "__main__":
    main()
