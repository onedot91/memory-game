import { useEffect, useRef } from 'react';
import { recordMetrics } from './storage';

export function useActivity(mode: 'classic' | 'dungeon', learning: boolean, paused = false) {
  const state = useRef({ learning, paused });
  state.current = { learning, paused };
  useEffect(() => {
    let lastInput = 0;
    let lastTick = Date.now();
    let active = 0;
    let study = 0;
    let visited = false;
    const flush = () => { if (active || study) recordMetrics(mode, { activeSeconds: active, learningSeconds: study }); active = 0; study = 0; };
    const input = () => {
      lastInput = Date.now();
      if (!visited) { visited = true; recordMetrics(mode, { visits: 1 }); }
    };
    const tick = () => {
      const now = Date.now();
      const delta = Math.min(2, (now - lastTick) / 1000);
      lastTick = now;
      if (!document.hidden && document.hasFocus() && now - lastInput <= 60000 && !state.current.paused) {
        active += delta;
        if (state.current.learning) study += delta;
      }
      if (active >= 5) flush();
    };
    const hidden = () => { if (document.hidden) { flush(); lastInput = 0; } lastTick = Date.now(); };
    window.addEventListener('keydown', input);
    window.addEventListener('pointerdown', input);
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', hidden);
    const timer = setInterval(tick, 1000);
    return () => { clearInterval(timer); flush(); window.removeEventListener('keydown', input); window.removeEventListener('pointerdown', input); window.removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', hidden); };
  }, [mode]);
}
