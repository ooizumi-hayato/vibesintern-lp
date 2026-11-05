// キービジュアル：アイソメトリックの「キャリアの街」を SVG で描画する
// 使い方：<div id="kv"></div> を置いてこのファイルを読み込む
(function () {
  const C = {
    line: '#2b3a4a', white: '#ffffff', faceL: '#f4f6f9', faceR: '#e3e9f0', win: '#d6e4f0',
    yellow: '#FFE14D', yellowD: '#f2c500', red: '#D81617', redL: '#f7c6c6', cream: '#fff8e1',
    tree: '#bfe5cb', treeD: '#8fcca4', ground: '#f3f5f8', skin: '#ffe0cc', hair: '#2b3a4a',
  };
  const W = 900, H = 700, S = 19, OX = 470, OY = 230;
  const P = (x, y, z = 0) => [OX + (x - y) * S * 0.866, OY + (x + y) * S * 0.5 - z * S];
  const pts = (arr) => arr.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ');
  const poly = (arr, fill, extra = '') => `<polygon points="${pts(arr)}" fill="${fill}" stroke="${C.line}" stroke-width="1.3" stroke-linejoin="round" ${extra}/>`;

  // 直方体（上面・右面・左面）
  function box(x, y, z, w, d, h, o = {}) {
    const top = o.top || C.white, r = o.right || C.faceR, l = o.left || C.faceL;
    let s = '';
    s += poly([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x, y + d, z + h)], l);
    s += poly([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z + h), P(x + w, y, z + h)], r);
    s += poly([P(x, y, z + h), P(x + w, y, z + h), P(x + w, y + d, z + h), P(x, y + d, z + h)], top);
    return s;
  }
  // 建物（窓つき）
  function building(x, y, w, d, h, o = {}) {
    let s = box(x, y, 0, w, d, h, o);
    const win = o.win || C.win;
    for (let zz = 0.8; zz < h - 0.6; zz += 1.1) {
      for (let yy = y + 0.35; yy < y + d - 0.35; yy += 0.9) // 右面の窓
        s += poly([P(x + w, yy, zz), P(x + w, yy + 0.5, zz), P(x + w, yy + 0.5, zz + 0.6), P(x + w, yy, zz + 0.6)], win, 'stroke-width="0.8"');
      for (let xx = x + 0.35; xx < x + w - 0.35; xx += 0.9) // 左面の窓
        s += poly([P(xx, y + d, zz), P(xx + 0.5, y + d, zz), P(xx + 0.5, y + d, zz + 0.6), P(xx, y + d, zz + 0.6)], win, 'stroke-width="0.8"');
    }
    if (o.roof) s += box(x + w * 0.3, y + d * 0.3, h, w * 0.4, d * 0.4, 0.5, { top: o.roof });
    return s;
  }
  // 床（プラットフォーム）
  const platform = (x, y, w, d, top) => box(x, y, 0, w, d, 0.35, { top, left: C.white, right: C.faceL });

  // 人物（立ち姿）
  function person(x, y, z, o = {}) {
    const [px, py] = P(x, y, z);
    const body = o.body || C.red, k = o.scale || 1.25;
    let s = `<g transform="translate(${px.toFixed(1)},${py.toFixed(1)}) scale(${k})">`;
    s += `<ellipse cx="0" cy="0" rx="9" ry="3.5" fill="${C.line}" opacity=".12"/>`;
    s += `<path d="M-3.5 -15 L-4.5 0 M3.5 -15 L4.5 0" stroke="${o.pants || C.line}" stroke-width="3.6" stroke-linecap="round"/>`;
    if (o.bag) s += `<rect x="-11" y="-32" width="6" height="12" rx="2" fill="${o.bag}" stroke="${C.line}" stroke-width="1.1"/>`;
    s += `<rect x="-7" y="-34" width="14" height="21" rx="6" fill="${body}" stroke="${C.line}" stroke-width="1.3"/>`;
    if (o.arm === 'up') s += `<path d="M6 -30 L13 -42" stroke="${C.line}" stroke-width="2.4" stroke-linecap="round"/>`;
    else if (o.arm === 'point') s += `<path d="M6 -29 L16 -33" stroke="${C.line}" stroke-width="2.4" stroke-linecap="round"/>`;
    else if (o.arm === 'shake') s += `<path d="M6 -27 L13 -24" stroke="${C.line}" stroke-width="2.4" stroke-linecap="round"/>`;
    else if (o.arm === 'shakeL') s += `<path d="M-6 -27 L-13 -24" stroke="${C.line}" stroke-width="2.4" stroke-linecap="round"/>`;
    s += `<circle cx="0" cy="-41" r="6.5" fill="${C.skin}" stroke="${C.line}" stroke-width="1.3"/>`;
    s += `<path d="M-6.5 -42 A6.5 6.5 0 0 1 6.5 -42 Q0 -45 -6.5 -42Z" fill="${o.hair || C.hair}"/>`;
    s += '</g>';
    return s;
  }
  // 木
  function tree(x, y, size = 1) {
    const [px, py] = P(x, y, 0);
    return `<g transform="translate(${px.toFixed(1)},${py.toFixed(1)}) scale(${size})">
      <ellipse cx="0" cy="0" rx="7" ry="2.8" fill="${C.line}" opacity=".1"/>
      <path d="M0 0 V-12" stroke="${C.line}" stroke-width="1.6"/>
      <ellipse cx="0" cy="-20" rx="8" ry="11" fill="${C.tree}" stroke="${C.line}" stroke-width="1.2"/>
      <path d="M0 -10 V-24" stroke="${C.treeD}" stroke-width="1.2"/></g>`;
  }
  // 職種ラベル：プラットフォームの手前の側面に貼る（上に載った人や物と重ならない）
  function sign(x, y, w, d, text, color = C.red) {
    const [px, py] = P(x + w / 2, y + d, 0);
    const tw = text.length * 15 + 24;
    return `<g transform="translate(${px.toFixed(1)},${(py + 6).toFixed(1)})">
      <rect x="${-tw / 2}" y="-2" width="${tw}" height="28" rx="14" fill="${color}" stroke="${C.line}" stroke-width="1.3"/>
      <text x="0" y="17.5" text-anchor="middle" font-size="15" font-weight="900" fill="#fff" font-family="'Zen Kaku Gothic New','Noto Sans JP',sans-serif">${text}</text></g>`;
  }
  // ノートPC
  function laptop(x, y, z) {
    let s = box(x, y, z, 1.1, 0.8, 0.08, { top: '#cfd8e2' });
    s += poly([P(x, y, z + 0.08), P(x + 1.1, y, z + 0.08), P(x + 1.1, y, z + 0.9), P(x, y, z + 0.9)], C.yellow);
    return s;
  }
  // 円グラフ（床に置いた円盤）
  function pie(cx, cy, z, r, t = 0.35) {
    const ring = (a0, a1, zz) => { const arr = []; for (let i = 0; i <= 32; i++) { const a = a0 + (a1 - a0) * i / 32; arr.push(P(cx + r * Math.cos(a), cy + r * Math.sin(a), zz)); } return arr; };
    const front0 = -Math.PI / 4, front1 = Math.PI * 3 / 4; // 画面の手前に見える側面
    let s = poly(ring(front0, front1, z + t).concat(ring(front0, front1, z).reverse()), C.faceR);
    s += poly(ring(0, Math.PI * 2, z + t), C.white);
    s += poly([P(cx, cy, z + t)].concat(ring(-Math.PI * 0.6, Math.PI * 0.1, z + t)), C.yellow);
    s += poly([P(cx, cy, z + t)].concat(ring(Math.PI * 0.1, Math.PI * 0.55, z + t)), C.red);
    return s;
  }
  // ホワイトボード＋電球（企画）
  function board(x, y) {
    let s = '';
    const [a, b] = [P(x, y, 0), P(x + 2.4, y, 0)];
    s += `<path d="M${a[0] + 4} ${a[1]} l0 -30 M${b[0] - 4} ${b[1]} l0 -30" stroke="${C.line}" stroke-width="1.6"/>`;
    s += poly([P(x, y, 1.2), P(x + 2.4, y, 1.2), P(x + 2.4, y, 3.2), P(x, y, 3.2)], C.white);
    const [bx, by] = P(x + 1.2, y, 2.35);
    s += `<circle cx="${bx}" cy="${by - 4}" r="9" fill="${C.yellow}" stroke="${C.line}" stroke-width="1.3"/>
      <rect x="${bx - 4}" y="${by + 4}" width="8" height="6" rx="1.5" fill="#cfd8e2" stroke="${C.line}" stroke-width="1.1"/>
      <path d="M${bx - 15} ${by - 16} l-5 -4 M${bx + 15} ${by - 16} l5 -4 M${bx} ${by - 20} v-6" stroke="${C.yellowD}" stroke-width="2" stroke-linecap="round"/>`;
    return s;
  }
  // 道（点線）
  // 背景透過なので、赤背景の上でもクリーム色の床の上でも見えるよう白点＋紺フチにする
  function road(points) {
    const d = points.map((p, i) => { const [sx, sy] = P(p[0], p[1], 0.36); return `${i ? 'L' : 'M'}${sx.toFixed(1)} ${sy.toFixed(1)}`; }).join(' ');
    return `<path d="${d}" fill="none" stroke="${C.line}" stroke-width="5.5" stroke-dasharray="0.1 9" stroke-linecap="round"/>
      <path d="${d}" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="0.1 9" stroke-linecap="round"/>`;
  }
  // 雲・気球・飛行機（空の飾り）
  const cloud = (x, y, k = 1) => `<g transform="translate(${x},${y}) scale(${k})"><path d="M0 0 h56 a10 10 0 0 0 -8 -16 a14 14 0 0 0 -24 -6 a12 12 0 0 0 -22 8 a8 8 0 0 0 -2 14z" fill="#fff" stroke="${C.line}" stroke-width="1.2"/></g>`;
  const balloon = (x, y) => `<g transform="translate(${x},${y})"><path d="M0 -26 c-14 0 -18 14 -10 24 l6 8 h8 l6 -8 c8 -10 4 -24 -10 -24z" fill="${C.yellow}" stroke="${C.line}" stroke-width="1.3"/><path d="M0 -26 c-5 6 -5 22 -3 32 M0 -26 c5 6 5 22 3 32" fill="none" stroke="${C.line}" stroke-width="1"/><rect x="-4" y="10" width="8" height="6" rx="1" fill="${C.red}" stroke="${C.line}" stroke-width="1.1"/></g>`;
  const plane = (x, y) => `<g transform="translate(${x},${y}) rotate(-18)"><path d="M0 0 l40 0 q8 0 8 4 q0 4 -8 4 l-40 0 l-6 -10z M14 0 l10 -14 h6 l-4 14 M16 8 l8 12 h6 l-4 -12" fill="#fff" stroke="${C.line}" stroke-width="1.2" stroke-linejoin="round"/></g>`;

  // ===== シーン構成 =====
  const items = []; // [奥行き, svg]
  const add = (depth, svg) => items.push([depth, svg]);

  // 背景のビル群（奥）
  add(5, building(1, 1, 3, 3, 6, { roof: C.yellow }));
  add(7.6, building(5, 0, 2.6, 2.6, 8.5));
  add(7.7, box(6.05, 1.05, 8.5, 0.5, 0.5, 2.2, { top: C.red }));
  add(11.1, building(9, -1, 3.2, 3, 5.5));
  add(15.1, building(13, -1, 3, 3.2, 7, { roof: C.red }));
  add(19.8, building(17, 0, 2.6, 3, 4.5, { win: '#fdeeb0' }));
  add(8.8, building(0, 6, 2.6, 3, 4));
  add(27, building(20, 4, 3, 3, 6));
  // 追加の企業ビル
  add(1.6, building(-3, 2, 2.6, 2.6, 5, { roof: C.red }));
  add(7.3, building(9.5, -5, 2.8, 2.8, 10, { roof: C.yellow }));
  add(11.3, building(13.5, -5, 2.6, 3, 6.5, { win: '#fdeeb0' }));
  add(16, building(17, -4, 3, 3, 9));
  add(16.1, box(18.25, -2.75, 9, 0.5, 0.5, 1.6, { top: C.yellow }));
  add(22.6, building(21, -1, 2.6, 2.6, 5, { roof: C.red }));
  add(28.8, building(24, 2, 2.6, 3, 7.5, { win: '#fdeeb0' }));
  add(33.6, building(25, 6, 2.6, 2.6, 4.5));
  add(5.5, building(-3, 6, 2.4, 2.6, 3));

  // プラットフォーム
  add(-10, platform(1, 11, 7, 6, C.cream));     // 営業
  add(-10, platform(10, 5, 7, 6, '#fff3c4'));   // マーケ
  add(-10, platform(10, 14, 6, 6, C.cream));    // 企画
  add(-10, platform(18, 10, 6, 6, '#fff3c4'));  // エンジニア
  add(-10, platform(3, 21, 5, 4, '#fde2e2'));   // スタート（学生）

  // 道（START → 営業・企画 → マーケ・エンジニア）
  add(-9, road([[5.5, 21], [5.5, 17]]));
  add(-9, road([[8, 23], [10, 23], [10, 19]]));
  add(-9, road([[13, 14], [13, 11]]));
  add(-9, road([[16, 17], [18, 17], [18, 14.5]]));

  // 営業：デスク＋握手
  add(14, box(2.5, 12, 0.35, 3, 1.2, 0.8));
  add(17.5, person(3.4, 15.2, 0.35, { body: C.red, arm: 'shake' }));
  add(18.5, person(5.6, 14.4, 0.35, { body: '#5b7c99', arm: 'shakeL', hair: '#6b4a2b' }));
  add(-8, sign(1, 11, 7, 6, '営業'));

  // マーケ：棒グラフ＋円グラフ
  add(13, box(11, 6, 0.35, 0.9, 0.9, 1.4, { top: C.yellow, right: C.yellowD, left: '#ffe98a' }));
  add(14, box(12.3, 6, 0.35, 0.9, 0.9, 2.4, { top: C.yellow, right: C.yellowD, left: '#ffe98a' }));
  add(15, box(13.6, 6, 0.35, 0.9, 0.9, 3.4, { top: C.red, right: '#a81011', left: '#f05a5b' }));
  add(19, pie(15, 9, 0.35, 1.4));
  add(20, person(11.8, 9.8, 0.35, { body: C.yellow, arm: 'point' }));
  add(-8, sign(10, 5, 7, 6, 'マーケティング'));

  // 企画：ホワイトボード＋電球
  add(25, board(11.5, 15.2));
  add(29, person(12.8, 17.6, 0.35, { body: C.red, arm: 'up', hair: '#6b4a2b' }));
  add(30, person(14.4, 17, 0.35, { body: '#5b7c99' }));
  add(-8, sign(10, 14, 6, 6, '企画'));

  // エンジニア：デスク＋PC
  add(30, box(19, 11.2, 0.35, 2.6, 1.2, 0.8));
  add(31, laptop(19.5, 11.4, 1.15));
  add(31.2, laptop(20.8, 11.4, 1.15));
  add(33, person(19.9, 13.6, 0.35, { body: C.yellow }));
  add(34, person(21.6, 13.4, 0.35, { body: C.red, hair: '#6b4a2b', arm: 'up' }));
  add(-8, sign(18, 10, 6, 6, 'エンジニア'));

  // スタート：リュックの学生
  add(40, person(5.2, 22.8, 0.35, { body: '#ffffff', bag: C.red, arm: 'up', scale: 1.4 }));
  add(-8, sign(3, 21, 5, 4, 'START', C.line));

  // 木
  [[8.5, 9.5], [9, 3.5], [0.5, 19], [17.4, 21], [23, 8.5], [17, 3.3], [9.2, 21.5], [25, 17]].forEach(([x, y]) => add(x + y, tree(x, y)));

  items.sort((a, b) => a[0] - b[0]);

  // 表示範囲（描画内容の実寸 x100〜875 / y47〜632 に少し余白を足す。背景透過なので余白は最小限）
  const VB = { x: 90, y: 37, w: 795, h: 605 };
  const sky = cloud(170, 90, 1) + cloud(700, 70, 0.85) + cloud(790, 290, 0.7) + balloon(210, 230) + plane(640, 120);

  const svg = `<svg viewBox="${VB.x} ${VB.y} ${VB.w} ${VB.h}" xmlns="http://www.w3.org/2000/svg" role="img" aria-labelledby="kv-title">
    <title id="kv-title">学生がSTARTから営業・マーケ・企画・エンジニアの現場へ、長期インターンで挑戦していく街のイラスト</title>
    ${sky}
    ${items.map((i) => i[1]).join('')}
  </svg>`;

  const mount = document.getElementById('kv');
  if (mount) mount.innerHTML = svg;
})();
