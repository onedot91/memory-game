import type { ReactNode } from 'react';
import { BookOpen } from 'lucide-react';

export type StudyMode = 'dungeon' | 'classic';
export interface StudyModeProps { onModeChange: (mode: StudyMode) => void }

interface Props extends StudyModeProps {
  mode: StudyMode;
  actions?: ReactNode;
  onHome?: () => void;
}

export default function StudyHeader({ mode, onModeChange, actions, onHome }: Props) {
  const brand = <><span className="study-brand-mark"><BookOpen size={22} /></span><span>암기<span className="study-brand-accent">던전</span></span></>;
  return <header className="study-header">
    {onHome ? <button className="study-brand" onClick={onHome} aria-label="학습 시작 화면">{brand}</button> : <div className="study-brand">{brand}</div>}
    <nav className="study-mode-tabs" aria-label="학습 모드 선택">
      <button aria-pressed={mode === 'dungeon'} onClick={() => onModeChange('dungeon')}>던전 모드</button>
      <button aria-pressed={mode === 'classic'} onClick={() => onModeChange('classic')}>기본 암기</button>
    </nav>
    <div className="study-header-actions">{actions}</div>
  </header>;
}
