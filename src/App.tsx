import { lazy, Suspense, useState } from 'react';
import ClassicStudy from './ClassicStudy';
import StudyHeader from './StudyHeader';
import './game/game.css';
import './study.css';

const DungeonGame = lazy(() => import('./game/DungeonGame'));
export default function App() {
  const [mode, setMode] = useState<'dungeon' | 'classic'>('dungeon');
  return <div className="study-app">
    {mode === 'classic' ? <ClassicStudy onModeChange={setMode} /> : <Suspense fallback={<><StudyHeader mode={mode} onModeChange={setMode} /><div className="game-loading">불러오는 중…</div></>}><DungeonGame onModeChange={setMode} /></Suspense>}
  </div>;
}
