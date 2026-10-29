"""서울 득표율 대시보드 빌드 스크립트.

입력 : data/raw/서울 득표율.xlsx               (중앙선관위 개표결과, 20대 대선)
       data/raw/02_성별·연령대별 투표율(구시군별).xlsx (공공데이터포털, 표본)
       data/geo/seoul_municipalities_geo_simple.json (통계청 2013 경계, southkorea/seoul-maps)
출력 : viz/seoul_vote_dashboard.html  (외부 의존성 없는 단일 HTML)

실행 : python viz/build_dashboard.py
"""
import json
import math
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
from xl_reader import read  # noqa: E402
import mreg  # noqa: E402

RAW = ROOT / "data" / "raw"
VOTE_XLSX = RAW / "서울 득표율.xlsx"
AGE_XLSX = RAW / "02_성별·연령대별 투표율(구시군별).xlsx"
GEO = ROOT / "data" / "geo" / "seoul_municipalities_geo_simple.json"
TEMPLATE = Path(__file__).resolve().parent / "dashboard_template.html"
OUT = Path(__file__).resolve().parent / "seoul_vote_dashboard.html"

BANDS = ["18세", "19세", "20–24세", "25–29세", "30–34세", "35–39세",
         "40–49세", "50–59세", "60–69세", "70–79세", "80세 이상"]
SEX_KEY = {"합계": "all", "남자": "m", "여자": "f"}


def num(s):
    return float(str(s).replace(",", ""))


# ---------------------------------------------------------------- 득표 (데이터 4)
def load_votes():
    rows = list(read(str(VOTE_XLSX)).values())[0]
    out = {}
    for r in rows[1:]:
        if r.get(0) == "서울특별시" and r.get(2) == "합계" and r.get(1) != "합계(특별시)":
            out[r[1]] = dict(elec=num(r[4]), votes=num(r[5]), lee=num(r[6]),
                             yoon=num(r[7]), valid=num(r[18]))
    assert len(out) == 25, len(out)
    return out


# ---------------------------------------------------------------- 연령 (데이터 1, 표본)
def load_ages():
    sheet = list(read(str(AGE_XLSX)).values())[0]  # 첫 시트 = 서울특별시
    out, gu, sex = {}, None, None
    for r in sheet[4:]:
        if r.get(0):
            gu = r[0]
        if r.get(1):
            sex = r[1]
        metric = r.get(2)
        if metric not in ("선거인수", "투표자수") or sex not in SEX_KEY:
            continue
        vals = [num(r[k]) for k in range(3, 15)]  # [합계, 18세 ... 80세이상]
        key = "el" if metric == "선거인수" else "vt"
        out.setdefault(gu, {"el": {}, "vt": {}})[key][SEX_KEY[sex]] = vals
    out.pop("전체", None)
    assert len(out) == 25, len(out)
    return out


# ---------------------------------------------------------------- 지도 경로
def project(lon, lat, lat0):
    return (lon * math.cos(math.radians(lat0)), -lat)


def build_geometry(w=600, h=520, pad=14):
    gj = json.loads(GEO.read_text(encoding="utf-8"))
    lat0 = 37.55
    polys = {}
    allx, ally = [], []
    for f in gj["features"]:
        ring = f["geometry"]["coordinates"][0]
        pts = [project(x, y, lat0) for x, y in ring]
        polys[f["properties"]["name"]] = pts
        allx += [p[0] for p in pts]
        ally += [p[1] for p in pts]
    minx, maxx, miny, maxy = min(allx), max(allx), min(ally), max(ally)
    s = min((w - 2 * pad) / (maxx - minx), (h - 2 * pad) / (maxy - miny))
    ox = (w - s * (maxx - minx)) / 2 - s * minx
    oy = (h - s * (maxy - miny)) / 2 - s * miny
    geo = {}
    for name, pts in polys.items():
        q = [(p[0] * s + ox, p[1] * s + oy) for p in pts]
        d = "M" + "L".join(f"{x:.1f},{y:.1f}" for x, y in q) + "Z"
        # 면적 가중 중심
        a = cx = cy = 0.0
        for i in range(len(q)):
            x0, y0 = q[i]
            x1, y1 = q[(i + 1) % len(q)]
            c = x0 * y1 - x1 * y0
            a += c
            cx += (x0 + x1) * c
            cy += (y0 + y1) * c
        a /= 2
        geo[name] = dict(path=d, cx=round(cx / (6 * a), 1), cy=round(cy / (6 * a), 1))
    return geo, (w, h)


# ---------------------------------------------------------------- 색 (OKLCH 기반 순차 램프)
def _lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def _gam(c):
    return 12.92 * c if c <= 0.0031308 else 1.055 * (c ** (1 / 2.4)) - 0.055


def oklch_to_srgb(L, C, hdeg):
    a = C * math.cos(math.radians(hdeg))
    b = C * math.sin(math.radians(hdeg))
    l_ = L + 0.3963377774 * a + 0.2158037573 * b
    m_ = L - 0.1055613458 * a - 0.0638541728 * b
    s_ = L - 0.0894841775 * a - 1.2914855480 * b
    l, m, s = l_ ** 3, m_ ** 3, s_ ** 3
    return (4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
            -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
            -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s)


def to_hex(L, C, hdeg):
    for _ in range(60):  # 색역 밖이면 채도를 낮춘다
        rgb = oklch_to_srgb(L, C, hdeg)
        if all(-1e-4 <= v <= 1 + 1e-4 for v in rgb):
            break
        C *= 0.96
    r, g, b = [min(1, max(0, v)) for v in rgb]
    return "#{:02x}{:02x}{:02x}".format(*[round(_gam(v) * 255) for v in (r, g, b)])


def ramp(hue, cmax, dark):
    """6단 단색 램프. 라이트: 연함→진함 / 다크: 어두움→밝음 (낮은 값이 배경 쪽으로 물러남)."""
    cf = [0.55, 0.76, 0.92, 1.0, 1.0, 0.9]
    if dark:
        L = [0.29, 0.39, 0.50, 0.61, 0.72, 0.84]
        cf = cf[::-1]
    else:
        L = [0.88, 0.77, 0.66, 0.56, 0.45, 0.33]
    return [to_hex(l, cmax * c, hue) for l, c in zip(L, cf)]


# ---------------------------------------------------------------- 다중 회귀
# 설명변수 = '연령 집단 × 성별' 칸의 선거인 비중(그 구 선거인 전체 대비 %). 예: "18–29세 남성 비중".
# 25개 구로는 11구간 × 2성 = 22칸을 동시에 넣을 수 없으므로(자유도 3, VIF 2,700) 연령을 6집단으로 묶은 12칸을 쓴다.
# 12칸의 합이 100%라 절편과 함께는 계수가 하나로 정해지지 않는다. 가장 큰 칸 하나를 임시 기준으로 빼고 적합한 뒤,
# 같은 적합을 '평균 구성비로 가중한 계수의 합 = 0'(가중 효과 코딩, mreg.centered_effects)으로 다시 써서
# 12칸 모두에 계수를 만든다. 각 값 = 평균적인 구성에서 1%p를 그 칸으로 바꿀 때 득표율 변화(%p).
AGE_GROUPS = [("18–29세", [0, 1, 2, 3]), ("30–39세", [4, 5]), ("40–49세", [6]),
              ("50–59세", [7]), ("60–69세", [8]), ("70세 이상", [9, 10])]
SEXES = [("m", "남성"), ("f", "여성")]


def build_mr(votes, ages):
    names = list(votes)
    n = len(names)
    cells = [(gi, g[0], sk, sn) for gi, g in enumerate(AGE_GROUPS) for sk, sn in SEXES]   # 12칸, 연령 순서 → 남·여
    X = [[sum(ages[nm]["el"][sk][b + 1] for b in AGE_GROUPS[gi][1]) / ages[nm]["el"]["all"][0] * 100
          for gi, _, sk, _ in cells] for nm in names]
    K = len(cells)
    w = [mreg.mean([r[j] for r in X]) for j in range(K)]            # 25개 구의 평균 구성비 (합 100)
    ref = max(range(K), key=lambda j: w[j])                          # 임시 기준 = 평균 비중이 가장 큰 칸
    keep = [j for j in range(K) if j != ref]
    labels = [f"{cells[j][1]} {cells[j][3]}" for j in range(K)]
    models = {}
    for key in ("lee", "yoon"):
        y = [votes[nm][key] / votes[nm]["valid"] * 100 for nm in names]
        m = mreg.ols([[r[j] for j in keep] for r in X], y, [labels[j] for j in keep])
        bK = [0.0] * K
        cK = [[0.0] * K for _ in range(K)]
        for j1, i1 in enumerate(keep):
            bK[i1] = m["coefs"][j1 + 1]["b"]
            for j2, i2 in enumerate(keep):
                cK[i1][i2] = m["cov"][j1 + 1][j2 + 1]
        bs, se, t, p, lo, hi, _ = mreg.centered_effects(bK, cK, m["coefs"][0]["b"], m["df"], w)
        sdy = mreg.sd(y)
        coefs = [dict(label=labels[j], age=cells[j][1], sex=cells[j][3], b=bs[j], se=se[j], p=p[j], lo=lo[j],
                      hi=hi[j], beta=bs[j] * mreg.sd([r[j] for r in X]) / sdy, mean=w[j]) for j in range(K)]
        models[key] = dict(n=m["n"], df=m["df"], r2=m["r2"], adj=m["adj_r2"], F=m["F"], pF=m["p_F"], coefs=coefs)
    axis = [dict(label=labels[j], age=cells[j][1], sex=cells[j][3], mean=w[j]) for j in range(K)]
    groups_desc = {g[0]: " · ".join(BANDS[b] for b in g[1]) for g in AGE_GROUPS}
    return dict(axis=axis, ages=[g[0] for g in AGE_GROUPS], models=models, groupsDesc=groups_desc)


def main():
    votes = load_votes()
    ages = load_ages()
    geo, (w, h) = build_geometry()
    districts = []
    for name in votes:  # 파일 순서 = 종로구 … 강동구
        assert name in ages and name in geo, name
        districts.append(dict(name=name, **votes[name], el=ages[name]["el"],
                              vt=ages[name]["vt"], **geo[name]))
    ramps = {
        "light": {"lee": ramp(258, 0.22, False), "yoon": ramp(27, 0.245, False)},
        "dark": {"lee": ramp(258, 0.22, True), "yoon": ramp(27, 0.245, True)},
    }
    payload = dict(districts=districts, bands=BANDS, view=[w, h], ramps=ramps, mr=build_mr(votes, ages))
    html = TEMPLATE.read_text(encoding="utf-8").replace(
        "__DATA__", json.dumps(payload, ensure_ascii=False, separators=(",", ":")))
    OUT.write_text(html, encoding="utf-8")
    print("wrote", OUT, f"{OUT.stat().st_size/1024:.0f} KB")
    print("ramps", json.dumps(ramps))


if __name__ == "__main__":
    main()
