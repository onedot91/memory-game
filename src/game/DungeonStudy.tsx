import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { ITEMS } from './content';
import type { Run } from './types';
import type { TimelineAnswer } from '../data';
import TimelineStudy from '../TimelineStudy';

interface Props {
  run: Run;
  value: string;
  busy: boolean;
  paused: boolean;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onSubmitTimeline: (answer: TimelineAnswer) => void;
  onComposition: (composing: boolean) => void;
  onPick: (id: string) => void;
}

export default function DungeonStudy({ run, value, busy, paused, onChange, onSubmit, onSubmitTimeline, onComposition, onPick }: Props) {
  const items = run.questionOrder.flatMap(id => ITEMS.filter(item => item.id === id));
  const active = items.findIndex(item => item.id === run.questionId);
  const activePage = Math.max(0, Math.floor(active / 8));
  const [page, setPage] = useState(activePage);
  const input = useRef<HTMLInputElement>(null);
  const composing = useRef(false);
  const pages = Math.ceil(items.length / 8);
  const completed = new Set(Object.keys(run.answers));
  useLayoutEffect(() => { setPage(activePage); }, [activePage, run.questionId]);
  useEffect(() => { if (!paused) input.current?.focus({ preventScroll: true }); }, [run.questionId, run.phase, paused, page]);
  return <section className="dungeon-study" aria-label="암기 문제">
    <div className="study-heading"><h2>{items[0]?.category}</h2><div className="study-heading-actions"><span className="study-count">{completed.size} / {items.length}</span>
      {!items[0]?.timeline && pages > 1 && <nav className="study-pagination" aria-label="문제 페이지"><button aria-label="이전 문제 페이지" disabled={page === 0} onClick={() => setPage(page - 1)}><ArrowLeft size={14} /></button><span>{page + 1} / {pages}</span>{page !== activePage && <button onClick={() => setPage(activePage)}>현재 문제</button>}<button aria-label="다음 문제 페이지" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}><ArrowRight size={14} /></button></nav>}
    </div></div>
    <div className="study-progress" aria-label={`${items.length}문항 중 ${completed.size}문항 완료`}><i style={{ width: `${completed.size / items.length * 100}%` }} /></div>
    {items[0]?.timeline ? <TimelineStudy items={items} statuses={items.map(item => run.answers[item.id])} attempts={items.map(item => run.attemptsById[item.id] || 0)} activeIndex={active} busy={busy} paused={paused} onPick={index => onPick(items[index].id)} onSubmit={onSubmitTimeline} onComposition={onComposition} /> : <>
    <div className="study-slot-grid">{items.slice(page * 8, page * 8 + 8).map(item => {
      const isActive = item.id === run.questionId && ['question', 'recovery', 'reward', 'route', 'rest'].includes(run.phase);
      const revealed = completed.has(item.id) && !isActive;
      const failed = run.answers[item.id] === 'revealed';
      const retry = !revealed && run.attemptsById[item.id] === 1;
      return <div key={item.id} title={revealed ? item.name : undefined} className="study-card study-slot" data-state={retry ? 'retry' : isActive ? 'active' : revealed ? failed ? 'revealed' : 'correct' : 'pending'}>
        {(retry || (revealed && failed)) && <span className="study-feedback">{retry ? '1차 오답 · 다시 입력' : '2차 오답 · 정답 공개'}</span>}
        <span className="slot-number">{item.number}{item.era && ` · ${item.era}`}</span>
        {isActive ? <form onSubmit={onSubmit}><input id="dungeon-answer" ref={input} aria-label={`${item.category} ${item.number}번 ${item.era ? '연도와 사건' : '정답'}`} autoComplete="off" spellCheck={false} value={value} disabled={paused} placeholder={run.attempts ? '한 번 더 입력…' : item.era ? '연도 + 사건 입력…' : '정답 입력…'} onChange={event => onChange(event.target.value)} onCompositionStart={() => { composing.current = true; onComposition(true); }} onCompositionEnd={() => { composing.current = false; onComposition(false); }} onKeyDown={event => { if (event.key === 'Enter' && (composing.current || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229 || event.repeat)) event.preventDefault();
          if (event.key === 'Tab' && !event.shiftKey && !composing.current && !busy) {
            const pending = [...items.slice(active + 1), ...items.slice(0, active)].find(candidate => !run.answers[candidate.id]);
            if (pending) { event.preventDefault(); onPick(pending.id); }
          }
        }} /><button aria-label="정답 제출" disabled={busy || paused || !value.trim()} type="submit"><ArrowRight size={16} /></button></form> : <><button type="button" className="slot-answer" disabled={revealed || busy || paused || !['question', 'recovery', 'reward', 'route', 'rest'].includes(run.phase)} onClick={() => onPick(item.id)} aria-label={`${item.number}번 문제${revealed ? ' 완료' : ' 선택'}`}>{revealed ? item.name : '· · · ·'}</button>{revealed && (failed ? <X size={16} aria-label="정답 공개" /> : <Check size={16} aria-label="정답" />)}</>}
      </div>;
    })}</div>
    </>}
  </section>;
}
