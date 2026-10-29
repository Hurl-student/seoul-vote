"""가구 구성 × 득표율/투표율 상관 히트맵 빌드 스크립트.

입력 : data/raw/세대구성별_가구_및_가구원_일반가구_시군구_2022.csv (KOSIS DT_1JC1515, 인구총조사 2022)
       data/raw/02_성별·연령대별 투표율(구시군별).xlsx  → '전체 투표율' (표본 투표구, 구별 합계)
       data/raw/서울 득표율.xlsx                          → 이재명·윤석열 득표율 (유효투표수 기준)
출력 : viz/household_heatmap.html (외부 의존성 없는 단일 HTML)

실행 : python viz/build_heatmap.py
"""
import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from xl_reader import read  # noqa: E402
import mreg  # noqa: E402

RAW = ROOT / "data" / "raw"
HH_CSV = RAW / "세대구성별_가구_및_가구원_일반가구_시군구_2022.csv"
AGE_XLSX = RAW / "02_성별·연령대별 투표율(구시군별).xlsx"
VOTE_XLSX = RAW / "서울 득표율.xlsx"
TEMPLATE = Path(__file__).resolve().parent / "heatmap_template.html"
OUT = Path(__file__).resolve().parent / "household_heatmap.html"


def num(s):
    return float(str(s).replace(",", ""))


def load_households():
    rows = list(csv.reader(HH_CSV.open(encoding="utf-8")))
    head, seoul, gu = rows[0], [float(x) for x in rows[1][1:]], rows[2:]
    cols = [[float(r[i]) for r in gu] for i in range(1, 7)]
    assert [sum(c) for c in cols] == seoul, "구 합계가 서울 합계와 다릅니다"
    return head[1:], {r[0]: [float(x) for x in r[1:]] for r in gu}


def load_turnout():
    """02 데이터 서울 시트: 각 구의 '합계' 행 → '투표율' 행의 첫 값(전체 투표율)."""
    sheet = list(read(str(AGE_XLSX)).values())[0]
    out = {}
    for i, r in enumerate(sheet):
        if r.get(1) == "합계" and r.get(2) == "선거인수" and r.get(0) and r.get(0) != "전체":
            assert sheet[i + 2][2] == "투표율"
            out[r[0]] = num(sheet[i + 2][3])
    return out


def load_votes():
    rows = list(read(str(VOTE_XLSX)).values())[0]
    out = {}
    for r in rows[1:]:
        if r.get(0) == "서울특별시" and r.get(2) == "합계" and r.get(1) != "합계(특별시)":
            valid = num(r[18])
            out[r[1]] = (num(r[6]) / valid * 100, num(r[7]) / valid * 100)
    return out


OUTCOMES = ("turn", "yoon", "lee")  # 전체 투표율, 보수(윤석열), 진보(이재명)


def build_mr(names, hh_names, shares, y):
    """가구 유형 6개의 비율을 모두 설명변수로 쓰는 다중 회귀 (결과변수 3가지, OUTCOMES 순서).

    6개 비율은 합이 100%라 절편과 함께 넣으면 계수가 하나로 정해지지 않는다. 그래서 하나를 임시 기준(REF)으로
    빼고 적합한 뒤, 같은 적합을 '평균 구성비로 가중한 계수의 합 = 0' 형태(가중 효과 코딩)로 다시 표현한다. 이렇게 하면
    6개 유형 모두에 계수가 생기고, 각 값은 '평균적인 가구 구성에서 1%p를 그 유형으로 바꿀 때의 효과'가 된다
    (R²·F 등 모형 적합은 동일, 기준을 무엇으로 잡아도 같은 값).
    산점도용으로는 부분잔차(= y − 다른 유형의 기여) 를 함께 저장한다."""
    REF = 1
    idx = [i for i in range(6) if i != REF]
    X = [[shares[n][i] for i in idx] for n in names]
    S6 = [[shares[n][i] for i in range(6)] for n in names]
    out = []
    for key in OUTCOMES:
        m = mreg.ols(X, y[key], [hh_names[i] for i in idx])
        beta6 = [0.0] * 6
        cov6 = [[0.0] * 6 for _ in range(6)]
        for j1, i1 in enumerate(idx):
            beta6[i1] = m["coefs"][j1 + 1]["b"]
            for j2, i2 in enumerate(idx):
                cov6[i1][i2] = m["cov"][j1 + 1][j2 + 1]
        w = [mreg.mean([r[k] for r in S6]) for k in range(6)]   # 25개 구의 평균 가구 구성비 (합 100)
        bs, se, t, p, lo, hi, a_star = mreg.centered_effects(beta6, cov6, m["coefs"][0]["b"], m["df"], w)
        sdy = mreg.sd(y[key])
        coefs = []
        for k in range(6):
            col = [r[k] for r in S6]
            pr = [y[key][r] - sum(bs[j] * S6[r][j] for j in range(6) if j != k) for r in range(len(names))]
            coefs.append(dict(i=k, b=bs[k], se=se[k], t=t[k], p=p[k], lo=lo[k], hi=hi[k],
                              beta=bs[k] * mreg.sd(col) / sdy,
                              cpr=[[round(a, 8), round(b, 8)] for a, b in zip(col, pr)]))
        out.append(dict(n=m["n"], df=m["df"], r2=m["r2"], adj=m["adj_r2"], F=m["F"], pF=m["p_F"],
                        a=a_star, coefs=coefs))
    return out


def main():
    hh_names, hh = load_households()
    turn, votes = load_turnout(), load_votes()
    assert set(hh) == set(turn) == set(votes) and len(hh) == 25
    districts = [dict(name=n, hh=hh[n], turn=turn[n], lee=round(votes[n][0], 8), yoon=round(votes[n][1], 8))
                 for n in hh]
    names = list(hh)
    shares = {n: [v / sum(hh[n]) * 100 for v in hh[n]] for n in names}
    y = dict(turn=[turn[n] for n in names], yoon=[votes[n][1] for n in names], lee=[votes[n][0] for n in names])
    payload = dict(districts=districts, hhNames=hh_names, mr=build_mr(names, hh_names, shares, y))
    html = TEMPLATE.read_text(encoding="utf-8").replace(
        "__DATA__", json.dumps(payload, ensure_ascii=False, separators=(",", ":")))
    OUT.write_text(html, encoding="utf-8")
    print("wrote", OUT.name, f"{OUT.stat().st_size/1024:.0f} KB")


if __name__ == "__main__":
    main()
