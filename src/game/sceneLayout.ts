// CSS pixels, independent of the room's aspect ratio and sprite-sheet padding.
export function sceneLayout(width: number, height: number) {
  const narrow = width < 480;
  const foot = Math.round(height - (height < 130 ? 20 : 30));
  return {
    width, height,
    hero: { x: Math.round(width * (narrow ? 0.22 : 0.2)), y: narrow ? Math.round(height * 0.69) : foot, height: 48 },
    boss: { x: Math.round(width * (narrow ? 0.69 : 0.72)), y: narrow ? Math.round(height * 0.69) : foot, height: 80 },
    enemies: (narrow
      ? [[0.66, 0.4], [0.81, 0.65], [0.62, 0.89]]
      : [[0.52, 0], [0.7, 12], [0.85, 4]]).map(([x, y]) => ({
        x: Math.round(width * x), y: narrow ? Math.round(height * y) : foot - 8 + y,
      })),
    enemyHeight: 40,
    eliteHeight: 52,
    weaponWidth: 28,
  };
}
