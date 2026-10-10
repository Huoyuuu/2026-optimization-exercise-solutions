// 单纯形 MV 引擎：题目解析 + 精确分数单纯形（两阶段）求解，输出完整过程记录
// 约定：统一化为 min；检验数 σ_j = c_B·B⁻¹P_j − c_j；全部 σ_j ≤ 0 即最优
(function (root) {
  // ---------- 有理数 ----------
  const gcd = (a, b) => { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) [a, b] = [b, a % b]; return a; };
  class Q {
    constructor(n, d = 1n) {
      n = BigInt(n); d = BigInt(d);
      if (d < 0n) { n = -n; d = -d; }
      const g = gcd(n, d) || 1n;
      this.n = n / g; this.d = d / g;
    }
    static of(x) {
      if (x instanceof Q) return x;
      x = String(x).trim();
      if (x.includes('/')) { const [a, b] = x.split('/'); return Q.of(a).div(Q.of(b)); }
      if (x.includes('.')) { const f = x.split('.')[1].length; return new Q(BigInt(x.replace('.', '')), 10n ** BigInt(f)); }
      return new Q(BigInt(x));
    }
    add(b) { return new Q(this.n * b.d + b.n * this.d, this.d * b.d); }
    sub(b) { return new Q(this.n * b.d - b.n * this.d, this.d * b.d); }
    mul(b) { return new Q(this.n * b.n, this.d * b.d); }
    div(b) { return new Q(this.n * b.d, this.d * b.n); }
    neg() { return new Q(-this.n, this.d); }
    sgn() { return this.n > 0n ? 1 : this.n < 0n ? -1 : 0; }
    cmp(b) { return this.sub(b).sgn(); }
    eq(b) { return this.cmp(b) === 0; }
    isZero() { return this.n === 0n; }
    num() { return Number(this.n) / Number(this.d); }
    toString() { return this.d === 1n ? String(this.n) : `${this.n}/${this.d}`; }
  }
  const Q0 = new Q(0), Q1 = new Q(1);

  // ---------- 解析 ----------
  // 格式：# 标题: xxx / # 分组: xxx / # 方法: xxx；min|max 表达式；每行一个约束；x1,x2,x3>=0 可省略
  function parseExpr(s) {
    s = s.replace(/\s+/g, '').replace(/[−–]/g, '-').replace(/\\/g, '');
    const re = /([+-]?)(\d+(?:\.\d+)?(?:\/\d+)?)?\*?x_?\{?(\d+)\}?/g;
    const out = {}; let m, pos = 0;
    while ((m = re.exec(s))) {
      if (m.index !== pos) throw new Error('无法识别表达式：' + s);
      pos = re.lastIndex;
      let k = m[2] ? Q.of(m[2]) : Q1;
      if (m[1] === '-') k = k.neg();
      const i = +m[3]; out[i] = (out[i] || Q0).add(k);
    }
    if (pos !== s.length || !Object.keys(out).length) throw new Error('无法识别表达式：' + s);
    return out;
  }

  function parseProblem(text) {
    const meta = { title: '自定义题目', group: '自定义', method: '' };
    let sense = null, cobj = null; const cons = [];
    for (let L of text.split(/\r?\n/)) {
      L = L.trim(); if (!L) continue;
      if (L.startsWith('#')) {
        const m = L.match(/^#\s*(标题|分组|方法)\s*[:：]\s*(.*)$/);
        if (m) meta[{ 标题: 'title', 分组: 'group', 方法: 'method' }[m[1]]] = m[2];
        continue;
      }
      const om = L.match(/^(min|max)\s*[:：]?\s*(?:[zf]\s*=)?\s*(.*)$/i);
      if (om) { sense = om[1].toLowerCase(); cobj = parseExpr(om[2]); continue; }
      const cm = L.replace(/≤|<=|\\le(q)?/g, '<=').replace(/≥|>=|\\ge(q)?/g, '>=').match(/^(.*?)(<=|>=|=)(.*)$/);
      if (!cm) throw new Error('无法识别这一行：' + L);
      if (/[,，…]|\.\.\.|dots/.test(cm[1])) continue; // 非负约束列表
      const lhs = parseExpr(cm[1]), rhs = Q.of(cm[3].replace(/[−–]/g, '-'));
      const ks = Object.keys(lhs);
      if (cm[2] === '>=' && rhs.isZero() && ks.length === 1 && lhs[ks[0]].eq(Q1)) continue;
      cons.push({ a: lhs, op: cm[2], b: rhs });
    }
    if (!sense) throw new Error('缺少目标函数（以 min 或 max 开头的一行）');
    if (!cons.length) throw new Error('至少需要一条约束');
    let n = 0;
    for (const o of [cobj, ...cons.map(c => c.a)]) for (const k in o) n = Math.max(n, +k);
    const vec = o => Array.from({ length: n }, (_, j) => o[j + 1] || Q0);
    return {
      ...meta, sense, n, m: cons.length, text,
      c: vec(cobj), A: cons.map(c => vec(c.a)), ops: cons.map(c => c.op), b: cons.map(c => c.b),
    };
  }

  // ---------- 求解 ----------
  function solve(P) {
    const n = P.n;
    const names = [], kinds = [];
    for (let j = 0; j < n; j++) { names.push('x' + (j + 1)); kinds.push('x'); }
    const cMin = P.sense === 'max' ? P.c.map(v => v.neg()) : P.c.slice();

    // 1. 右端非负化
    const rows = P.A.map((a, i) => {
      const r = { a: a.slice(), op: P.ops[i], b: P.b[i], flipped: false, add: [] };
      if (r.b.sgn() < 0) {
        r.a = r.a.map(v => v.neg()); r.b = r.b.neg(); r.flipped = true;
        r.op = r.op === '<=' ? '>=' : r.op === '>=' ? '<=' : '=';
      }
      r.a0 = r.a.slice(); r.op0 = r.op;
      return r;
    });
    const addCol = (kind, i, val, name) => {
      names.push(name || 'x' + (names.length + 1)); kinds.push(kind);
      rows.forEach((r, k) => r.a.push(k === i ? val : Q0));
      rows[i].add.push({ col: names.length - 1, kind, val });
      return names.length - 1;
    };
    // 2. 松弛 / 剩余变量
    rows.forEach((r, i) => {
      if (r.op === '<=') addCol('s', i, Q1);
      else if (r.op === '>=') addCol('e', i, Q1.neg());
    });
    // 3. 找现成单位列，缺的行补人工变量
    const basis = [];
    rows.forEach((r, i) => {
      let best = -1;
      for (let j = 0; j < names.length; j++) {
        if (!r.a[j].eq(Q1) || basis.includes(j)) continue;
        if (rows.some((o, k) => k !== i && !o.a[j].isZero())) continue;
        if (best < 0 || (kinds[j] === 's' && kinds[best] !== 's')) best = j;
      }
      basis.push(best);
    });
    let na = 0;
    rows.forEach((r, i) => { if (basis[i] < 0) basis[i] = addCol('a', i, Q1, 'u' + ++na); });
    const N = names.length;
    let T = rows.map(r => [...r.a, r.b]);
    const costII = names.map((_, j) => (j < n ? cMin[j] : Q0));
    const costI = kinds.map(k => (k === 'a' ? Q1 : Q0));
    const all = names.map((_, j) => j), real = all.filter(j => kinds[j] !== 'a');

    const snap = (cost, cols) => {
      const cB = basis.map(b => cost[b]);
      const sigma = names.map((_, j) => cols.includes(j)
        ? T.reduce((s, r, i) => s.add(cB[i].mul(r[j])), Q0).sub(cost[j]) : null);
      const z = T.reduce((s, r, i) => s.add(cB[i].mul(r[N])), Q0);
      const x = names.map(() => Q0); basis.forEach((b, i) => (x[b] = T[i][N]));
      return { T: T.map(r => r.slice()), basis: basis.slice(), cB, sigma, z, x, cols: cols.slice(), cost: cost.slice() };
    };
    const pivot = (r, k) => {
      const p = T[r][k];
      T[r] = T[r].map(v => v.div(p));
      T = T.map((row, i) => (i === r || row[k].isZero() ? row : row.map((v, j) => v.sub(row[k].mul(T[r][j])))));
      basis[r] = k;
    };
    const opsFor = (r, k) => T.map((row, i) => (i === r ? { type: 'div', by: row[k] } : row[k].isZero() ? null : { type: 'sub', f: row[k] }));

    function runPhase(cost, cols) {
      const iters = [];
      for (let guard = 0; guard < 60; guard++) {
        const s = snap(cost, cols);
        const bland = guard > 25;
        let k = -1;
        for (const j of cols) {
          if (basis.includes(j) || s.sigma[j].sgn() <= 0) continue;
          if (k < 0 || (!bland && s.sigma[j].cmp(s.sigma[k]) > 0)) k = j;
        }
        if (k < 0) return { iters, final: s, status: 'optimal' };
        const ratios = T.map(r => (r[k].sgn() > 0 ? r[N].div(r[k]) : null));
        if (ratios.every(v => v === null)) return { iters, final: s, status: 'unbounded', enter: k };
        let r = -1;
        ratios.forEach((v, i) => {
          if (v === null) return;
          if (r < 0 || v.cmp(ratios[r]) < 0 || (v.eq(ratios[r]) && basis[i] < basis[r])) r = i;
        });
        const ops = opsFor(r, k);
        pivot(r, k);
        iters.push({ snap: s, enter: k, ratios, leave: r, leaveVar: s.basis[r], pivotVal: s.T[r][k], ops, after: snap(cost, cols) });
      }
      throw new Error('迭代次数过多');
    }

    const out = { P, names, kinds, rows, n, N, cMin, phases: [], events: [] };
    const twoPhase = na > 0;
    out.twoPhase = twoPhase;
    if (twoPhase) {
      const ph = runPhase(costI, all);
      out.phases.push({ key: 'I', title: '阶段一', cost: costI, ...ph });
      if (!ph.final.z.isZero()) { out.status = 'infeasible'; out.w = ph.final.z; return out; }
      // 人工变量仍在基中（取 0 值）：换出或删去冗余行
      for (let i = 0; i < T.length; i++) {
        if (kinds[basis[i]] !== 'a') continue;
        const before = snap(costI, all);
        const k = real.find(j => !basis.includes(j) && !T[i][j].isZero());
        if (k !== undefined) {
          const ops = opsFor(i, k), art = basis[i];
          pivot(i, k);
          out.events.push({ type: 'drive', row: i, enter: k, art, ops, before, after: snap(costI, all) });
        } else {
          const art = basis[i];
          T.splice(i, 1); basis.splice(i, 1);
          out.events.push({ type: 'drop', row: i, art, before, after: snap(costI, all) });
          i--;
        }
      }
    }
    const ph2 = runPhase(costII, real);
    out.phases.push({ key: twoPhase ? 'II' : 'S', title: twoPhase ? '阶段二' : '单纯形迭代', cost: costII, ...ph2 });
    const fin = ph2.final;
    out.status = ph2.status;
    out.final = fin;
    out.z = fin.z;
    out.f = P.sense === 'max' ? fin.z.neg() : fin.z;
    out.x = fin.x.slice(0, n);
    if (ph2.status === 'unbounded') {
      const k = ph2.enter, d = names.map(() => Q0);
      d[k] = Q1; fin.basis.forEach((b, i) => (d[b] = fin.T[i][k].neg()));
      out.ray = { enter: k, d };
    } else {
      // 多重最优：非基变量检验数为 0
      out.alt = real.filter(j => !fin.basis.includes(j) && fin.sigma[j].isZero()).map(k => {
        const rs = fin.T.map(r => (r[k].sgn() > 0 ? r[N].div(r[k]) : null));
        if (rs.every(v => v === null)) return { k, ray: true };
        let r = -1; rs.forEach((v, i) => { if (v !== null && (r < 0 || v.cmp(rs[r]) < 0)) r = i; });
        const t = rs[r], x = fin.x.slice();
        x[k] = t; fin.basis.forEach((b, i) => (x[b] = fin.x[b].sub(fin.T[i][k].mul(t))));
        return { k, t, x: x.slice(0, n), moved: !t.isZero() };
      });
    }
    return out;
  }

  const api = { Q, Q0, Q1, parseProblem, parseExpr, solve };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SimplexEngine = api;
})(typeof window !== 'undefined' ? window : globalThis);
