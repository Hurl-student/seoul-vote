"""표준 라이브러리만 쓰는 다중 선형 회귀(OLS).

ols(X, y, names) → 절편 포함 모형. 계수·표준오차·t·p·95% CI·표준화 계수(β)·VIF·R²·수정 R²·F 검정을 돌려준다.
partial_points(...) → 부분 회귀(added-variable) 산점도용 잔차 쌍.
"""
import math


def _solve(A, B):
    """A x = B (A: n×n, B: n×m) 가우스-조던. A의 역행렬이 필요할 땐 B=I."""
    n = len(A)
    M = [row[:] + brow[:] for row, brow in zip(A, B)]
    for c in range(n):
        p = max(range(c, n), key=lambda r: abs(M[r][c]))
        if abs(M[p][c]) < 1e-12:
            raise ValueError("특이 행렬: 설명변수가 완전 공선입니다")
        M[c], M[p] = M[p], M[c]
        piv = M[c][c]
        M[c] = [v / piv for v in M[c]]
        for r in range(n):
            if r != c and M[r][c] != 0:
                f = M[r][c]
                M[r] = [a - f * b for a, b in zip(M[r], M[c])]
    return [row[n:] for row in M]


def _betacf(a, b, x):
    tiny, MAXIT = 1e-30, 300
    qab, qap, qam = a + b, a + 1, a - 1
    c, d = 1.0, 1 - qab * x / qap
    d = 1 / (d if abs(d) > tiny else tiny)
    h = d
    for m in range(1, MAXIT + 1):
        m2 = 2 * m
        aa = m * (b - m) * x / ((qam + m2) * (a + m2))
        d = 1 + aa * d; d = 1 / (d if abs(d) > tiny else tiny)
        c = 1 + aa / c; c = c if abs(c) > tiny else tiny
        h *= d * c
        aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2))
        d = 1 + aa * d; d = 1 / (d if abs(d) > tiny else tiny)
        c = 1 + aa / c; c = c if abs(c) > tiny else tiny
        de = d * c
        h *= de
        if abs(de - 1) < 3e-14:
            break
    return h


def betainc(a, b, x):
    if x <= 0:
        return 0.0
    if x >= 1:
        return 1.0
    lbeta = math.lgamma(a + b) - math.lgamma(a) - math.lgamma(b)
    front = math.exp(lbeta + a * math.log(x) + b * math.log(1 - x))
    if x < (a + 1) / (a + b + 2):
        return front * _betacf(a, b, x) / a
    return 1 - front * _betacf(b, a, 1 - x) / b


def t_sf2(t, df):
    """양측 p값."""
    return betainc(df / 2, 0.5, df / (df + t * t))


def f_sf(F, d1, d2):
    return betainc(d2 / 2, d1 / 2, d2 / (d2 + d1 * F))


def t_crit(df, alpha=0.05):
    lo, hi = 0.0, 50.0
    for _ in range(100):
        mid = (lo + hi) / 2
        if t_sf2(mid, df) > alpha:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2


def mean(v):
    return sum(v) / len(v)


def sd(v):
    m = mean(v)
    return math.sqrt(sum((a - m) ** 2 for a in v) / (len(v) - 1))


def ols(X, y, names):
    """X: n×p 설명변수(절편 제외), y: n. 절편을 앞에 붙여 적합."""
    n, p = len(X), len(X[0])
    k = p + 1
    # 수치 안정성: 설명변수를 표준화(평균 0, 표준편차 1)한 공간에서 풀고 원래 단위로 되돌린다.
    # (비율이 0.01~0.02% 수준인 변수와 40% 수준인 변수가 섞여도 정규방정식이 망가지지 않게)
    cm = [mean([r[j] for r in X]) for j in range(p)]
    cs = [sd([r[j] for r in X]) for j in range(p)]
    D = [[1.0] + [(r[j] - cm[j]) / cs[j] for j in range(p)] for r in X]
    XtX = [[sum(D[i][a] * D[i][b] for i in range(n)) for b in range(k)] for a in range(k)]
    Xty = [[sum(D[i][a] * y[i] for i in range(n))] for a in range(k)]
    invz = _solve(XtX, [[1.0 if i == j else 0.0 for j in range(k)] for i in range(k)])
    g = [sum(invz[a][b] * Xty[b][0] for b in range(k)) for a in range(k)]
    # 원래 단위로 변환: b0 = g0 - Σ (m_j/s_j) g_j,  b_j = g_j / s_j   (b = T g)
    T = [[0.0] * k for _ in range(k)]
    T[0][0] = 1.0
    for j in range(p):
        T[0][j + 1] = -cm[j] / cs[j]
        T[j + 1][j + 1] = 1 / cs[j]
    beta = [sum(T[a][b] * g[b] for b in range(k)) for a in range(k)]
    inv = [[sum(T[a][c] * invz[c][d] * T[b][d] for c in range(k) for d in range(k)) for b in range(k)] for a in range(k)]
    fit = [sum(D[i][a] * g[a] for a in range(k)) for i in range(n)]
    res = [y[i] - fit[i] for i in range(n)]
    sse = sum(e * e for e in res)
    my = mean(y)
    sst = sum((v - my) ** 2 for v in y)
    df = n - k
    s2 = sse / df
    se = [math.sqrt(s2 * inv[a][a]) for a in range(k)]
    tc = t_crit(df)
    sy = sd(y)
    coefs = []
    for a in range(k):
        t = beta[a] / se[a]
        row = dict(name="(절편)" if a == 0 else names[a - 1], b=beta[a], se=se[a], t=t,
                   p=t_sf2(t, df), lo=beta[a] - tc * se[a], hi=beta[a] + tc * se[a])
        if a > 0:
            col = [r[a - 1] for r in X]
            row["beta"] = beta[a] * sd(col) / sy          # 표준화 계수
            # VIF = 1 / (1 - R²_j): 다른 설명변수로 j번째를 회귀
            if p > 1:
                others = [[v for jj, v in enumerate(r) if jj != a - 1] for r in X]
                row["vif"] = 1 / (1 - _r2(others, col))
            else:
                row["vif"] = 1.0
        coefs.append(row)
    r2 = 1 - sse / sst
    adj = 1 - (1 - r2) * (n - 1) / df
    F = ((sst - sse) / p) / s2
    cov = [[s2 * v for v in row] for row in inv]   # 계수(절편 포함) 공분산행렬
    return dict(n=n, p=p, df=df, coefs=coefs, r2=r2, adj_r2=adj, F=F, p_F=f_sf(F, p, df),
                rmse=math.sqrt(s2), resid=res, fit=fit, cov=cov)


def centered_effects(ref_beta, ref_cov, a0, df, w):
    """합이 100%인 구성비 변수 K개를 '모두' 계수로 갖게 하는 재표현 (가중 효과 코딩).

    기준 범주 하나를 뺀 모형(ref_beta: K개, 기준은 0 / ref_cov: K×K, 기준 행·열은 0)을 같은 적합에서
    'Σ w_k·b*_k = 0' (w = 구들의 평균 구성비, 합 100) 이 되도록 다시 쓴다:  b*_k = b_k − Σ_j (w_j/100)·b_j.
    의미: 평균적인 구성에서 1%p를 해당 유형으로 바꿀 때의 효과. 같은 모형·같은 R²(표현만 다름),
    기준을 무엇으로 잡아도 같은 값이 나온다.  절편은 a* = a0 + Σ w_j·b_j.
    반환: (b*, se*, t, p, lo, hi, a*)."""
    K = len(ref_beta)
    C = [[(1.0 if i == j else 0.0) - w[j] / 100.0 for j in range(K)] for i in range(K)]
    bs = [sum(C[i][j] * ref_beta[j] for j in range(K)) for i in range(K)]
    cs = [[sum(C[i][a] * ref_cov[a][b] * C[j][b] for a in range(K) for b in range(K)) for j in range(K)] for i in range(K)]
    se = [math.sqrt(cs[i][i]) for i in range(K)]
    tc = t_crit(df)
    t = [bs[i] / se[i] for i in range(K)]
    return (bs, se, t, [t_sf2(v, df) for v in t], [bs[i] - tc * se[i] for i in range(K)],
            [bs[i] + tc * se[i] for i in range(K)], a0 + sum(w[j] * ref_beta[j] for j in range(K)))


def _r2(X, y):
    n, p = len(X), len(X[0])
    D = [[1.0] + list(r) for r in X]
    k = p + 1
    XtX = [[sum(D[i][a] * D[i][b] for i in range(n)) for b in range(k)] for a in range(k)]
    Xty = [[sum(D[i][a] * y[i] for i in range(n))] for a in range(k)]
    inv = _solve(XtX, [[1.0 if i == j else 0.0 for j in range(k)] for i in range(k)])
    b = [sum(inv[a][c] * Xty[c][0] for c in range(k)) for a in range(k)]
    sse = sum((y[i] - sum(D[i][a] * b[a] for a in range(k))) ** 2 for i in range(n))
    my = mean(y)
    return 1 - sse / sum((v - my) ** 2 for v in y)


def residualize(X, y):
    """y를 X(절편 포함)에 회귀한 잔차."""
    if not X or not X[0]:
        m = mean(y)
        return [v - m for v in y]
    return ols(X, y, [str(i) for i in range(len(X[0]))])["resid"]


def partial_points(X, y, j):
    """j번째 설명변수의 부분 회귀 산점도: (x의 잔차, y의 잔차)."""
    xj = [r[j] for r in X]
    rest = [[v for jj, v in enumerate(r) if jj != j] for r in X]
    return residualize(rest, xj), residualize(rest, y)
