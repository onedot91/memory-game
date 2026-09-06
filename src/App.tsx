import { lazy, Suspense, useState } from 'react';
import ClassicStudy from './ClassicStudy';
import './game/game.css';

const DungeonGame = lazy(() => import('./game/DungeonGame'));
export default function App() {
  const [mode, setMode] = useState<'dungeon' | 'classic'>('dungeon');
  return <>
    <div className={`mode-dock mode-dock-${mode}`} aria-label="학습 모드 선택">
      <button className={mode === 'dungeon' ? 'selected' : ''} onClick={() => setMode('dungeon')}>던전 모드</button>
      <button className={mode === 'classic' ? 'selected' : ''} onClick={() => setMode('classic')}>기본 암기</button>
    </div>
    {mode === 'classic' ? <div className="classic-shell"><ClassicStudy /></div> : <Suspense fallback={<div className="game-loading">기억의 문을 여는 중<span>LOADING THE ARCHIVE…</span></div>}><DungeonGame /></Suspense>}
  </>;
}
