"""웹앱 홈 화면용 요약 데이터 빌드.

세 시각화와 같은 계산 함수(build_dashboard / build_heatmap / build_pop_heatmap)를 그대로 불러
홈 화면의 수치·미니 지도·미니 히트맵에 쓸 값만 뽑는다. (숫자를 손으로 적지 않기 위해)
출력 : webapp/src/data/summary.json

실행 : python viz/build_app_data.py
"""
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import build_dashboard as bd  # noqa: E402
import build_heatmap as bh  # noqa: E402
import build_pop_heatmap as bp  # noqa: E402
import mreg  # noqa: E402

OUT = HERE.parent / "webapp" / "src" / "data" / "summary.json"
COLS = [("turn", "전체 투표율"), ("yoon", "보수 득표율"), ("lee", "진보 득표율")]


def r(v, d=4):
    return round(v, d)


def best_cell(cells):
    """시각화의 헤드라인과 같은 규칙: |β| + (유의하면 10) 가 가장 큰 칸."""
    return max(cells, key=lambda c: abs(c["beta"]) + (10 if c["p"] < 0.05 else 0))


def main():
    votes, ages = bd.load_votes(), bd.load_ages()
    geo, (w, h) = bd.build_geometry(w=320, h=278, pad=6)
    S = lambda k: sum(v[k] for v in votes.values())  # noqa: E731
    seoul = dict(turn=r(S("votes") / S("elec") * 100, 2), lee=r(S("lee") / S("valid") * 100, 2),
                 yoon=r(S("yoon") / S("valid") * 100, 2), elec=S("elec"),
                 nLee=sum(1 for v in votes.values() if v["lee"] > v["yoon"]),
                 nYoon=sum(1 for v in votes.values() if v["yoon"] > v["lee"]))
    districts = [dict(name=n, lee=r(v["lee"] / v["valid"] * 100, 2), yoon=r(v["yoon"] / v["valid"] * 100, 2),
                      turn=r(v["votes"] / v["elec"] * 100, 2), valid=v["valid"], leeN=v["lee"], yoonN=v["yoon"],
                      path=geo[n]["path"], cx=geo[n]["cx"], cy=geo[n]["cy"]) for n, v in votes.items()]

    # 1) 연령×성별 다중 회귀 (첫 번째 시각화)
    mr1 = bd.build_mr(votes, ages)
    age = dict(axis=[a["label"] for a in mr1["axis"]], ages=mr1["ages"],
               models={k: dict(r2=r(m["r2"]), adj=r(m["adj"]), pF=r(m["pF"], 6),
                               coefs=[dict(label=c["label"], b=r(c["b"]), beta=r(c["beta"]), p=r(c["p"], 6),
                                           lo=r(c["lo"]), hi=r(c["hi"])) for c in m["coefs"]])
                       for k, m in mr1["models"].items()})
    lee_best = best_cell(mr1["models"]["lee"]["coefs"])
    yoon_best = best_cell(mr1["models"]["yoon"]["coefs"])

    # 2) 가구 구성 히트맵
    hh_names, hh = bh.load_households()
    turn, v2 = bh.load_turnout(), bh.load_votes()
    names = list(hh)
    shares = {n: [x / sum(hh[n]) * 100 for x in hh[n]] for n in names}
    y = dict(turn=[turn[n] for n in names], yoon=[v2[n][1] for n in names], lee=[v2[n][0] for n in names])
    mr2 = bh.build_mr(names, hh_names, shares, y)
    hh_rows = ["1세대 가구", "2세대 가구", "3세대 가구", "4세대 이상 가구", "1인 가구", "비친족 가구"]

    # 3) 인구지표 히트맵
    _, raw = bp.load_population()
    mr3, _, _ = bp.build_mr(list(raw), raw, dict(turn=[turn[n] for n in raw], yoon=[v2[n][1] for n in raw],
                                                 lee=[v2[n][0] for n in raw]))
    pop_rows = [x["label"] for x in bp.ROWS]

    def heat(mr, rows):
        cells = [dict(row=rows[c["i"]], col=COLS[j][1], beta=r(c["beta"]), p=r(c["p"], 6))
                 for j, m in enumerate(mr) for c in m["coefs"]]
        grid = [[r(m["coefs"][i]["beta"]) for m in mr] for i in range(len(rows))]
        sig = [[m["coefs"][i]["p"] < 0.05 for m in mr] for i in range(len(rows))]
        return dict(rows=rows, cols=[c[1] for c in COLS], grid=grid, sig=sig,
                    fits=[dict(r2=r(m["r2"]), adj=r(m["adj"]), pF=r(m["pF"], 6)) for m in mr],
                    best=best_cell(cells), nSig=sum(1 for c in cells if c["p"] < 0.05))

    out = dict(
        seoul=seoul, view=[w, h], districts=districts, age=age,
        ageBest=dict(lee=dict(label=lee_best["label"], beta=r(lee_best["beta"]), p=r(lee_best["p"], 6)),
                     yoon=dict(label=yoon_best["label"], beta=r(yoon_best["beta"]), p=r(yoon_best["p"], 6))),
        household=heat(mr2, hh_rows), population=heat(mr3, pop_rows),
    )
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
    print("wrote", OUT, f"{OUT.stat().st_size / 1024:.0f} KB")
    print("seoul", seoul)
    print("age best", out["ageBest"])
    print("household best", out["household"]["best"], "nSig", out["household"]["nSig"])
    print("population best", out["population"]["best"], "nSig", out["population"]["nSig"])


if __name__ == "__main__":
    main()
