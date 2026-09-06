import { useEffect, useRef, useState } from 'react';
import type Phaser from 'phaser';
import type { DungeonScene } from './scene';
import type { Run } from './types';

export default function Arena({ run, roomNumber, paused, motion }: { run: Run; roomNumber: number; paused: boolean; motion: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const game = useRef<Phaser.Game | null>(null);
  const scene = useRef<DungeonScene | null>(null);
  const latest = useRef({ run, paused, motion }); latest.current = { run, paused, motion };
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ fps: 0, objects: 0 });
  useEffect(() => {
    let disposed = false;
    let observer: ResizeObserver | undefined;
    let resizeFrame = 0;
    void Promise.all([import('phaser'), import('./scene')]).then(([{ default: Phaser }, { DungeonScene }]) => {
      if (disposed || !container.current) return;
      const battle = new DungeonScene(); scene.current = battle;
      battle.setTelemetry((fps, objects) => setStats({ fps, objects }));
      battle.onReady = () => { if (disposed) return; battle.sync(latest.current.run, latest.current.motion); setReady(true); if (latest.current.paused) game.current?.loop.sleep(); };
      const { width, height } = container.current.getBoundingClientRect();
      const instance = new Phaser.Game({ type: Phaser.WEBGL, parent: container.current, width: Math.max(1, Math.floor(width)), height: Math.max(1, Math.floor(height)), pixelArt: true, antialias: false, backgroundColor: '#100b1c', banner: false, audio: { noAudio: true }, input: { keyboard: false, mouse: false, touch: false }, scale: { mode: Phaser.Scale.NONE }, fps: { target: 60, forceSetTimeOut: false }, scene: [battle] });
      game.current = instance;
      observer = new ResizeObserver(() => {
        cancelAnimationFrame(resizeFrame);
        resizeFrame = requestAnimationFrame(() => {
          if (disposed || !container.current) return;
          const { width, height } = container.current.getBoundingClientRect();
          const w = Math.floor(width), h = Math.floor(height);
          if (w < 1 || h < 1 || (w === instance.scale.width && h === instance.scale.height)) return;
          instance.scale.resize(w, h);
          battle.resizeStage(w, h);
          if (latest.current.paused) instance.step(performance.now(), 0);
        });
      });
      observer.observe(container.current);
    }).catch((cause: unknown) => { console.error('Dungeon renderer initialization failed:', cause); if (!disposed) setError('전투 화면을 불러오지 못했습니다. WebGL을 지원하는 브라우저에서 새로고침해 주세요. 학습 기록은 유지됩니다.'); });
    return () => { disposed = true; observer?.disconnect(); cancelAnimationFrame(resizeFrame); game.current?.destroy(true); game.current = null; scene.current = null; };
  }, []);
  useEffect(() => {
    scene.current?.sync(run, motion);
    if (paused) game.current?.loop.sleep(); else game.current?.loop.wake();
  }, [run, paused, motion, ready]);
  return <div className="arena-frame" data-fps={stats.fps} data-objects={stats.objects}>
    <div ref={container} className="arena-canvas" role="img" aria-label={`${roomNumber}번째 방의 자동 전투`} />
    {!ready && <div className="arena-loading">{error || '픽셀 세계를 불러오는 중…'}</div>}
    
  </div>;
}
