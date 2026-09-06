import { useLayoutEffect, useRef, useState } from 'react';
import { ArrowRight, Check, X } from 'lucide-react';
import { HISTORY_ERAS, hasStudyAnswer, type CategoryItem, type TimelineAnswer } from './data';
import './timeline.css';

interface Props {
  items: CategoryItem[];
  statuses: Array<'correct' | 'revealed' | undefined>;
  attempts: number[];
  activeIndex: number;
  busy?: boolean;
  paused?: boolean;
  resetVersion?: number;
  onPick: (index: number) => void;
  onSubmit: (answer: TimelineAnswer) => void;
  onComposition?: (composing: boolean) => void;
}

export default function TimelineStudy({ items, statuses, attempts, activeIndex, busy = false, paused = false, resetVersion = 0, onPick, onSubmit, onComposition }: Props) {
  const [answer, setAnswer] = useState<TimelineAnswer>({ year: '', event: '' });
  const yearInput = useRef<HTMLInputElement>(null);
  const eventInput = useRef<HTMLInputElement>(null);
  const composing = useRef(false);
  const activeNumber = items[activeIndex]?.num;
  useLayoutEffect(() => {
    setAnswer({ year: '', event: '' });
  }, [activeNumber, resetVersion]);
  useLayoutEffect(() => {
    if (!paused) yearInput.current?.focus({ preventScroll: true });
  }, [activeNumber, paused]);

  const composition = (value: boolean) => { composing.current = value; onComposition?.(value); };

  return <div className="timeline-study">
    {HISTORY_ERAS.map(era => {
      const entries = items.map((item, index) => ({ item, index })).filter(({ item }) => item.era === era);
      return <section key={era} className={`timeline-section ${era === '근대' ? 'timeline-section-wide' : ''}`} aria-label={`${era} 연표`}>
        <header className="timeline-section-heading"><h3>{era}</h3><span>{entries.filter(({ index }) => statuses[index]).length}/{entries.length}</span></header>
        <div className="timeline-grid">{entries.map(({ item, index }) => {
        const status = statuses[index];
        const active = index === activeIndex && !status;
        const retry = !status && attempts[index] === 1;
        const label = `${item.era} ${item.num}번`;
        return <div key={item.num} className={`kitsch-card timeline-card ${active ? 'active' : status || 'pending'} ${retry ? 'first-wrong' : ''}`}>
          {(retry || status === 'revealed') && <span className="timeline-feedback" role="status">{retry ? '1차 오답 · 다시 입력' : '2차 오답 · 정답 공개'}</span>}
          <span className="timeline-number">{item.num}</span>
          {active ? <form onSubmit={event => { event.preventDefault(); if (!busy && !paused && !composing.current && hasStudyAnswer(answer)) onSubmit(answer); }}>
            <label className="timeline-year"><span aria-hidden="true">연도</span><input ref={yearInput} aria-label={`${label} 연도`} value={answer.year} autoComplete="off" inputMode="numeric" disabled={paused} onChange={event => setAnswer({ ...answer, year: event.target.value })} onCompositionStart={() => composition(true)} onCompositionEnd={() => composition(false)} onKeyDown={event => {
              if (event.key === 'Enter') { event.preventDefault(); if (!composing.current && !event.nativeEvent.isComposing && event.nativeEvent.keyCode !== 229 && !event.repeat) eventInput.current?.focus(); }
            }} /></label>
            <label className="timeline-event"><span aria-hidden="true">사건명</span><input ref={eventInput} aria-label={`${label} 사건명`} value={answer.event} autoComplete="off" spellCheck={false} disabled={paused} onChange={event => setAnswer({ ...answer, event: event.target.value })} onCompositionStart={() => composition(true)} onCompositionEnd={() => composition(false)} onKeyDown={event => { if (event.key === 'Enter' && (composing.current || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229 || event.repeat)) event.preventDefault(); }} /></label>
            <button className="kitsch-btn timeline-submit" type="submit" aria-label="정답 제출" disabled={busy || paused || !hasStudyAnswer(answer)}><ArrowRight size={16} /></button>
          </form> : <>
            <button type="button" className="timeline-pick" disabled={Boolean(status) || busy || paused} aria-label={`${label} ${status ? '완료' : '문제 선택'}`} onClick={() => onPick(index)}><span className="timeline-year-value">{status ? item.timeline?.year : '····'}</span><span className="timeline-event-value">{status ? item.timeline?.event : '· · · ·'}</span></button>
            {status && (status === 'correct' ? <Check size={16} aria-label="정답" /> : <X size={16} aria-label="정답 공개" />)}
          </>}
        </div>;
      })}</div>
      </section>;
    })}
  </div>;
}
