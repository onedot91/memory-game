// Original, code-authored pixel artwork. One character is one painted pixel.
export const PALETTES = [
  { floor: '#171729', tile: '#232139', line: '#36334e', wall: '#30344c', edge: '#54516c', light: '#96ffe0', accent: '#ff59ad', dim: '#31596a' },
  { floor: '#241925', tile: '#382737', line: '#533642', wall: '#5b3941', edge: '#a07165', light: '#ffdb70', accent: '#ff765a', dim: '#6a5551' },
  { floor: '#20162f', tile: '#2a203c', line: '#443157', wall: '#493456', edge: '#79518c', light: '#dda1ff', accent: '#a5f568', dim: '#514477' },
];
const hero = [
  '................','.....oooooo.....','....obbbbbbo....','...obbbccbbbo...',
  '..obbcccccbbbo..','..obbcccccbbbo..','..obbeeeeebbbo..','..obeeeeeeebbo..',
  '..obeegeegeebo..','...oeeeeeeeo....','....oeffeeo.....','...oddffdddo....',
  '..oddhddhdddo...','..oddhddhdddo...','.oddihddhidddo..','.odddhhhhddddo..',
  '.oadddddddddao..','..oaaddddaao....','...oddddddo.....','...oddddddo.....',
  '...oddooddo.....','...ojjoojj o....','...ojjoojj o....','..okkkookkko....',
].map(row => row.replaceAll(' ', '.'));
const creatures = [
  ['................','.....gggg.......','...ggffffgg.....','..gffffffffg....','.gffgffffgffg...','.gffgffffgffg...','.gffffhhffffg...','..gffffffffg....','...ggffffgg.....','..gffggggffg....','.gfffffffffg....','..ggg..ggg......','................','................','................','................'],
  ['.....oooo.......','....obbbbo......','...obbccbbo.....','...obccccbo.....','...obee ebo.....','....oegeeo......','...oddddddo.....','..oddfddfddo....','..oddddddddo....','...oddddddo.....','..oddddddddo....','.oddddddddddo...','.oddo.ddo.ddo...','..oo...o...oo...','................','................'],
  ['.....aaaa.......','....akkkka......','...akffffka.....','...akfkfkka.....','...akffffka.....','....aeeeaa......','...ahhhhhha.....','..ahhhhhhhaa....','.akihhhhikka....','.akiihhiikka....','.akiihhiikka....','..akkkkkkka.....','...aajjaa.......','...ajjjjaa......','...akkkkaa......','................'],
  ['.....aaaa.......','...aakkkkaa.....','..akkffffkka....','..akffgfgfka....','..akffffffka....','...aakkkaa......','..aahhhhhaa.....','.aahhffhhhaa....','.akhhffhhkka....','.akhhhhhhkka....','..ahhhhhhhaa....','...aajjaa.......','...ajjjjaa......','..aakkkkaa......','................','................'],
  ['................','...a.......a....','..aka.....aka...','...aaakkkaa.....','..akffffffka....','.akfffggfffka...','.akfffggfffka...','..akffffffka....','...aakkkkaa.....','.....ahha.......','....aahhaa......','.....aaaa.......','................','................','................','................'],
  ['................','....aaaaaa......','...akffffka.....','..akffffffka....','..akfggggfka....','..akfggggfka....','..akffffffka....','...akhhhka......','...akhhhka......','..akkkkkkka.....','..aaaa.aaaa.....','..akaa.akaa.....','...aa...aa......','................','................','................'],
  ['......gg........','.....gffg.......','....gffffg......','...gffffffg.....','..gffhhhhffg....','..gffhffhffg....','..gffhhhhffg....','...gffffffg.....','....gffffg......','...gffffffg.....','..gfffggfffg....','...gfg..gfg.....','....g....g......','................','................','................'],
  ['.....oooo.......','....obbbbo......','...obeeeebo.....','...oegeegeeo....','....oeeeeo......','...oddddddo.....','..oddfddfddo....','.oddffddffddo...','.oddddddddddo...','..oddddddddo....','...oddddddo.....','..oddo..oddo....','...oo....oo.....','................','................','................'],
  ['......gg........','.....gffg.......','....gffffg......','...gffhhffg.....','..gffhhhhffg....','..gffhhhhffg....','...gffhhffg.....','....gffffg......','.....gffg.......','....ghhhhg......','...ghhhhhhg.....','..gggggggggg....','................','................','................','................'],
];
function matrix(ctx: CanvasRenderingContext2D, pattern: string[], colors: Record<string, string>, x: number, y: number, scale = 1) {
  pattern.forEach((row, iy) => [...row].forEach((char, ix) => { if (colors[char]) { ctx.fillStyle = colors[char]; ctx.fillRect(x + ix * scale, y + iy * scale, scale, scale); } }));
}
const rect = (ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
export function spriteCanvas(kind: 'hero' | 'enemy' | 'boss' | 'weapon' | 'relic', index: number, theme = 0, direction = 0, action = 'idle', frame = 0): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = kind === 'boss' ? 64 : kind === 'hero' ? 24 : 32;
  canvas.height = kind === 'boss' ? 64 : 32;
  const ctx = canvas.getContext('2d')!;
  const p = PALETTES[theme];
  const colors = { o: '#0c0a19', a: '#110d1c', b: '#394857', c: '#ceff65', d: '#55c4ad', e: '#eccab4', f: '#f4edc9', g: '#302848', h: '#ff5faa', i: '#af7574', j: '#4a3b56', k: '#2b283b' };
  if (kind === 'hero') {
    const bob = action === 'walk' ? frame % 2 : action === 'idle' && frame === 3 ? -1 : 0;
    if (direction === 1) { ctx.translate(24, 0); ctx.scale(-1, 1); }
    if (action === 'death') { ctx.translate(12, 22); ctx.rotate(Math.min(frame, 3) * Math.PI / 6); ctx.translate(-12, -22); }
    matrix(ctx, hero, colors, 4, 4 + bob);
    if (direction === 2) { rect(ctx, '#394857', 8, 10 + bob, 10, 7); rect(ctx, '#ceff65', 10, 9 + bob, 6, 3); }
    if (action === 'walk') { rect(ctx, '#0c0a19', frame % 2 ? 8 : 14, 27 + bob, 3, 3); }
    if (action === 'attack') { rect(ctx, '#0c0a19', 16, 17, 7, 4); rect(ctx, '#eeca73', 16, 17, 7, 2); if (frame === 1) { rect(ctx, '#fff3b0', 22, 15, 2, 6); } }
    if (action === 'hit') { ctx.globalCompositeOperation = 'source-atop'; rect(ctx, '#ff5b9277', 0, 0, 24, 32); }
  } else if (kind === 'enemy') {
    const c = { ...colors, b: p.dim, c: p.light, d: p.wall, e: '#e2d9ba', f: p.light, g: '#171425', h: p.accent, k: p.edge };
    matrix(ctx, creatures[index % 9].map(r => r.replaceAll(' ', '.')), c, 8, 8 + (frame % 2 ? -1 : 0));
    if (action === 'attack') { rect(ctx, p.accent, 6, 13, 2, 6); rect(ctx, p.accent, 24, 13, 2, 6); }
  } else if (kind === 'boss') {
    const c = { ...colors, b: p.dim, c: p.light, d: p.wall, f: p.light, h: p.accent, k: p.edge };
    matrix(ctx, creatures[theme === 0 ? 1 : theme === 1 ? 3 : 7].map(r => r.replaceAll(' ', '.')), c, 8, 9 + (frame % 2), 3);
    // Individually authored silhouettes: floating folio, cog shoulders, crystal antlers.
    if (theme === 0) {
      rect(ctx, '#100f22', 2, 34, 17, 18); rect(ctx, '#dcad69', 3, 34, 14, 15); rect(ctx, '#f4edc9', 4, 35, 11, 11);
      for (let i = 0; i < 4; i++) rect(ctx, '#a37b67', 5, 37 + i * 2, 8, 1);
      rect(ctx, '#ff5faa', 34, 6, 3, 5); rect(ctx, '#ecca73', 23, 5, 20, 3);
    } else if (theme === 1) {
      for (const x of [1, 48]) { rect(ctx, '#110d1c', x, 21, 15, 20); rect(ctx, '#dcaa68', x + 2, 23, 11, 14); rect(ctx, '#61433f', x + 5, 26, 5, 8); }
      rect(ctx, '#ff6760', 29, 30, 7, 8); rect(ctx, '#ffe6a6', 31, 32, 3, 3);
    } else {
      for (let i = 0; i < 4; i++) { rect(ctx, p.light, 10 + i * 3, 5 + i * 3, 3, 10); rect(ctx, p.light, 51 - i * 3, 5 + i * 3, 3, 10); }
      rect(ctx, '#f6e6ff', 30, 3, 4, 10);
    }
  } else if (kind === 'weapon') {
    const weaponColors = ['#f2cd73', '#bdd3d0', '#94d3ff', '#ffa47f', '#d4a4ff', '#b1f272'];
    const color = weaponColors[index % 6];
    if (index === 5) {
      for (let i = 0; i < 15; i++) rect(ctx, '#a7786a', 8 + Math.floor(i / 2), 24 - i, 3, 2);
      matrix(ctx, ['..ff..','.ffff.','ffhhff','.ffff.','..ff..'], { f: color, h: '#f7f4ca' }, 15, 3, 2);
    } else {
      rect(ctx, '#090813', 3, 10, 25, 10); rect(ctx, color, 4, 11, 23, 6); rect(ctx, '#fff0b3', 5, 11, 18, 2);
      rect(ctx, '#4c435b', 10, 17, 6, 8); rect(ctx, '#b78876', 11, 18, 3, 5);
      rect(ctx, '#343349', 25, 12, 5, index === 3 ? 7 : 4);
      if (index === 2) { rect(ctx, '#7c6ef6', 10, 9, 2, 10); rect(ctx, '#7c6ef6', 17, 9, 2, 10); }
      if (index === 4) { rect(ctx, color, 4, 8, 18, 4); rect(ctx, '#a888e0', 4, 19, 18, 3); }
      if (index === 1) rect(ctx, '#d3e4d7', 21, 12, 10, 3);
    }
  } else {
    const designs = [
      ['...a...','..afa..','..afa..','..aha..','..aha..','..aaa..'],
      ['.aaaa..','af..fa.','af..fa.','.aaaa..','....a..','.....a.'],
      ['..aa...','.aff a.','.ahh a.','.ahh a.','.afffa.','.aaaaa.'],
      ['...a...','..afa..','.afffa.','..afa..','...a...','...a...'],
      ['.....a.','....fa.','...ffa.','..ffa..','.ffa...','aa.....'],
      ['....aa.','...af..','..af...','.afffa.','...af..','..af...'],
      ['.aaaaa.','afffffa','afhh h a','afhhhfa','.afffa.','..afa..'],
      ['.aaaaa.','afffffa','afhfhfa','afhfhfa','afffffa','.aaaaa.'],
      ['..aaa..','..afa..','.afffa.','afhhhfa','afhhhfa','.aaaaa.'],
      ['.aa.aa.','affaffa','afffffa','.afffa.','..afa..','...a...'],
      ['...f...','..fhf..','.fhhhf.','fhhfhhf','fhhfhhf','.fffff.'],
      ['..aaa..','.a...a.','..aaa..','.afffa.','.afhfa.','.aaaaa.'],
    ];
    matrix(ctx, designs[index % 12].map(r => r.replaceAll(' ', '.')), { a: '#151020', f: ['#eeca73', '#91d7cc', '#f98ccc', '#c3a1ef'][index % 4], h: '#fff0be' }, 5, 6, 3);
  }
  return canvas;
}

function shelf(ctx: CanvasRenderingContext2D, x: number, y: number, theme: number) {
  const p = PALETTES[theme];
  rect(ctx, '#0c0b17', x, y, 42, 38); rect(ctx, p.edge, x + 1, y, 40, 3);
  for (let row = 0; row < 2; row++) {
    for (let b = 0; b < 8; b++) { rect(ctx, [p.accent, p.dim, '#c89b69', p.light][(b + row) % 4], x + 4 + b * 4, y + 5 + row * 16, 3, 10 + b % 3); rect(ctx, '#ffffff33', x + 4 + b * 4, y + 8 + row * 16, 3, 1); }
    rect(ctx, '#b17d67', x + 2, y + 17 + row * 16, 38, 3);
  }
}
function gear(ctx: CanvasRenderingContext2D, x: number, y: number, p: typeof PALETTES[number]) {
  rect(ctx, '#15101d', x, y, 28, 28); rect(ctx, p.edge, x + 4, y + 4, 20, 20); rect(ctx, p.dim, x + 8, y + 8, 12, 12); rect(ctx, p.light, x + 12, y + 12, 4, 4);
  for (let i = 0; i < 3; i++) { rect(ctx, p.edge, x + 5 + i * 7, y, 4, 5); rect(ctx, p.edge, x + 5 + i * 7, y + 23, 4, 5); rect(ctx, p.edge, x, y + 5 + i * 7, 5, 4); rect(ctx, p.edge, x + 23, y + 5 + i * 7, 5, 4); }
}
function crystal(ctx: CanvasRenderingContext2D, x: number, y: number, p: typeof PALETTES[number]) {
  matrix(ctx, ['...f....','..fff...','..fhf...','.ffhff..','.ffhff..','ffhhfff.','ffhhffff','.fffffff','..fffff.'], { f: p.edge, h: p.light }, x, y, 3);
}
export function roomCanvas(theme: number, layout: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas'); canvas.width = 640; canvas.height = 360;
  const ctx = canvas.getContext('2d')!; const p = PALETTES[theme];
  rect(ctx, '#0b0815', 0, 0, 640, 360);
  for (let y = 48; y < 344; y += 16) for (let x = 16; x < 624; x += 16) {
    const n = (x * 31 + y * 73 + layout * 37) % 17;
    rect(ctx, n > 7 ? p.floor : p.tile, x, y, 16, 16);
    rect(ctx, p.line, x, y, 15, 1);
    rect(ctx, '#ffffff06', x + 2, y + 2, 12, 1);
    if (n < 3) { rect(ctx, p.line, x + 4, y + 7, 4, 1); rect(ctx, p.line, x + 7, y + 8, 1, 3); }
  }
  // Four deliberately composed room plans with navigable foreground space.
  const rug = layout === 0 ? [96, 164, 432, 144] : layout === 1 ? [250, 92, 144, 230] : layout === 2 ? [64, 176, 512, 100] : [120, 144, 400, 172];
  rect(ctx, theme === 0 ? '#572645' : theme === 1 ? '#4f2830' : '#39294f', ...rug as [number, number, number, number]);
  rect(ctx, p.accent, rug[0], rug[1], rug[2], 2); rect(ctx, p.accent, rug[0], rug[1] + rug[3] - 2, rug[2], 2);
  for (let x = rug[0] + 6; x < rug[0] + rug[2]; x += 8) { rect(ctx, '#c5a474', x, rug[1] + 5, 2, 2); rect(ctx, '#c5a474', x, rug[1] + rug[3] - 7, 2, 2); }
  if (theme === 2) for (let i = 0; i < 45; i++) rect(ctx, '#8968c533', 38 + (i * 137) % 560, 108 + (i * 43) % 210, 12, 1);
  for (let x = 16; x < 624; x += 32) { rect(ctx, p.wall, x, 20, 30, 40); rect(ctx, p.edge, x, 20, 30, 3); rect(ctx, '#0d0b1d', x, 57, 30, 6); rect(ctx, '#ffffff0d', x + 3, 26, 24, 2); }
  for (const x of [16, 602]) { rect(ctx, p.wall, x, 20, 22, 316); rect(ctx, p.edge, x + 2, 20, 2, 316); rect(ctx, '#080713', x + 19, 60, 4, 276); }
  for (const x of [64, 142, 452, 534]) {
    if (theme === 0) shelf(ctx, x, 42 + (layout % 2) * 10, theme);
    if (theme === 1) { gear(ctx, x + 6, 42, p); rect(ctx, '#aa7863', x + 17, 70, 4, 42); }
    if (theme === 2) crystal(ctx, x + 8, 42, p);
  }
  const columns = layout === 0 ? [[68, 130], [550, 130], [68, 268], [550, 268]] : layout === 1 ? [[170, 150], [450, 150], [170, 280], [450, 280]] : layout === 2 ? [[95, 115], [525, 115]] : [[270, 112], [360, 112], [76, 264], [544, 264]];
  for (const [x, y] of columns) {
    rect(ctx, '#0a081755', x - 6, y + 26, 40, 9);
    rect(ctx, p.edge, x, y, 26, 5); rect(ctx, p.wall, x + 3, y + 5, 20, 23); rect(ctx, p.dim, x + 7, y + 6, 4, 21); rect(ctx, p.edge, x - 2, y + 26, 30, 6);
  }
  // Portal, carved lintel and checkerboard entry are actual map decorations.
  rect(ctx, '#0c0918', 280, 18, 80, 70); rect(ctx, p.edge, 275, 14, 90, 6);
  rect(ctx, p.light, 282, 28, 3, 54); rect(ctx, p.light, 355, 28, 3, 54);
  for (let i = 0; i < 5; i++) rect(ctx, p.dim, 288 + i * 13, 26, 5, 50);
  rect(ctx, p.light, 285, 82, 70, 2);
  for (let y = 324; y < 344; y += 8) for (let x = 280; x < 360; x += 8) rect(ctx, ((x + y) / 8) % 2 ? p.light : '#141021', x, y, 8, 8);
  for (let i = 0; i < 17; i++) {
    const x = 50 + (i * 131 + layout * 41) % 530; const y = 100 + (i * 71) % 206;
    if (theme === 0) { rect(ctx, '#110d19', x, y, 8, 5); rect(ctx, i % 2 ? p.dim : '#af716b', x, y - 1, 7, 4); rect(ctx, '#e3caa3', x + 1, y, 5, 1); }
    if (theme === 1) { rect(ctx, p.edge, x, y, 5, 4); rect(ctx, p.floor, x + 1, y + 1, 3, 2); }
    if (theme === 2) { rect(ctx, p.light, x, y, 2, 2); rect(ctx, p.edge, x - 1, y + 2, 4, 2); }
  }
  return canvas;
}
