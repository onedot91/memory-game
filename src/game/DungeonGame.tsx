import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, Download, Heart, LockKeyhole, Pause, Play, Settings2, Shield, Trophy, X, Zap } from 'lucide-react';
import Arena from './Arena';
import DungeonStudy from './DungeonStudy';
import { roomCanvas, spriteCanvas } from './art';
import { BALANCE, CATEGORIES, DUNGEONS, RELICS, ROOM_NAMES, WEAPONS, dungeonById, weaponById } from './content';
import { acknowledgeReveal, chooseRoute, dayKey, leaveRest, roomPlan, selectQuestion, startRun, submitAnswer, takeRelic } from './engine';
import { exportFile, exportMetrics, loadProfile, PROFILE_KEY, readMetrics, recordMetrics, saveProfile, studyOrder } from './storage';
import { dungeonSound } from './sound';
import type { DailyMetrics, DungeonId, Profile, WeaponId } from './types';
import { useActivity } from './useActivity';

function Pixel({ kind, index = 0, theme = 0, className = '' }: { kind: 'hero' | 'enemy' | 'boss' | 'weapon' | 'relic'; index?: number; theme?: number; className?: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const art = spriteCanvas(kind, index, theme);
    const ctx = canvas.current?.getContext('2d');
    if (ctx && canvas.current) { canvas.current.width = art.width; canvas.current.height = art.height; ctx.drawImage(art, 0, 0); }
  }, [kind, index, theme]);
  return <canvas ref={canvas} className={`pixel-art ${className}`} aria-hidden="true" />;
}
function RoomPreview({ theme, locked = false }: { theme: number; locked?: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (ctx) { ctx.drawImage(roomCanvas(theme, theme), 0, 0); ctx.imageSmoothingEnabled = false; ctx.drawImage(spriteCanvas('hero', 0), 155, 175, 60, 80); ctx.drawImage(spriteCanvas('boss', 0, theme), 374, 140, 115, 115); }
  }, [theme]);
  return <canvas width={640} height={360} ref={canvas} className={`room-preview ${locked ? 'locked-art' : ''}`} aria-hidden="true" />;
}
function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    root.current?.querySelector<HTMLButtonElement>('button')?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); close.current(); }
      if (event.key === 'Tab') {
        const nodes = root.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), select, a[href]');
        if (!nodes?.length) return;
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', key, true);
    return () => { window.removeEventListener('keydown', key, true); previous?.focus(); };
  }, []);
  return <div className="game-modal-backdrop"><div ref={root} className="game-modal" role="dialog" aria-modal="true" aria-label={title}>
    <div className="modal-heading"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="닫기"><X size={21} /></button></div>{children}
  </div></div>;
}
const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}분 ${Math.floor(seconds % 60)}초`;

export default function DungeonGame() {
  const [loaded] = useState(loadProfile);
  const [profile, setProfile] = useState<Profile>(loaded.profile);
  const current = useRef(profile);
  const [warning, setWarning] = useState(loaded.warning);
  const [blockedSave, setBlockedSave] = useState(Boolean(loaded.warning));
  const [metricsWarning, setMetricsWarning] = useState(false);
  const [screen, setScreen] = useState<'hub' | 'prepare' | 'run'>('hub');
  const [panel, setPanel] = useState<'settings' | 'codex' | 'stats' | 'exit' | null>(null);
  const [paused, setPaused] = useState(false);
  const [selectedDungeon, setSelectedDungeon] = useState<DungeonId>('library');
  const [categoryId, setCategoryId] = useState(CATEGORIES[0].id);
  const [weapon, setWeapon] = useState<WeaponId>('pistol');
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const lastRewardAt = useRef(0);
  const composing = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const run = profile.run;
  const roomSteps = run ? roomPlan(run) : [0, 1, 2, 3, 4, 5];
  const roomPosition = Math.max(0, roomSteps.indexOf(run?.room || 0));
  const dungeon = dungeonById(run?.dungeon || selectedDungeon);
  const theme = DUNGEONS.findIndex(d => d.id === dungeon.id);
  const stopped = paused || Boolean(panel) || screen !== 'run';
  useActivity('dungeon', screen === 'run' && Boolean(run && ['question', 'recovery', 'reveal', 'reward', 'route', 'rest'].includes(run.phase)) && !busy, paused || Boolean(panel));

  const activateAudio = () => { try { dungeonSound.start(); } catch { /* Visual feedback remains available without an audio device. */ } };
  const commit = (next: Profile) => {
    const previous = current.current;
    if (next === previous) return;
    const before = previous.run, after = next.run;
    const delta: Partial<DailyMetrics> = {};
    if (after && after.id !== before?.id) { delta.runsStarted = 1; delta.roomsStarted = 1; }
    if (before && after && before.id === after.id) {
      if (after.sequence > before.sequence && after.lastResult) {
        delta.submissions = 1; delta.correct = after.correct - before.correct;
        delta.retries = before.attempts > 0 ? 1 : 0;
        delta.reviewAttempts = after.lastResult.review ? 1 : 0;
        delta.reviewCorrect = after.reviews - before.reviews;
      }
      if (after.phase === 'reward' && (before.phase !== 'reward' || before.room !== after.room)) delta.roomsCleared = 1;
      if (after.phase === 'victory' && before.phase !== 'victory') { delta.roomsCleared = 1; delta.runsFinished = 1; }
      if (after.room !== before.room || (after.phase === 'question' && before.phase === 'route')) delta.roomsStarted = 1;
    }
    if (Object.keys(delta).length && !recordMetrics('dungeon', delta)) setMetricsWarning(true);
    current.current = next;
    if (!blockedSave) setWarning(saveProfile(next));
    setProfile(next);
  };
  useEffect(() => {
    dungeonSound.configure(profile.settings.music, profile.settings.effects, theme, screen === 'run' && run?.room === 5);
  }, [profile.settings, theme, screen, run?.room]);
  useEffect(() => {
    if (stopped) dungeonSound.stop();
    else activateAudio();
  }, [stopped]);
  useEffect(() => {
    const hidden = () => { if (document.hidden) { setPaused(true); dungeonSound.stop(); } };
    document.addEventListener('visibilitychange', hidden);
    return () => { document.removeEventListener('visibilitychange', hidden); if (timer.current) clearTimeout(timer.current); dungeonSound.stop(); };
  }, []);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && screen === 'run' && !composing.current && !event.isComposing) { event.preventDefault(); setPaused(value => !value); }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [screen]);


  useEffect(() => {
    if (run?.phase !== 'reveal' || stopped) return;
    const revealTimer = setTimeout(() => { commit(acknowledgeReveal(current.current)); }, BALANCE.turnMs);
    return () => clearTimeout(revealTimer);
  }, [run?.phase, stopped]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (lock.current || stopped || composing.current || !input.trim()) return;
    const before = current.current;
    if (!before.run) return;
    const next = submitAnswer(before, input, before.run.sequence);
    if (next === before) return;
    lock.current = true; setBusy(true); setInput('');
    commit(next); activateAudio();
    dungeonSound.effect(next.run?.lastResult?.outcome === 'correct' ? 'correct' : next.run?.lastResult?.outcome === 'wrong' ? 'wrong' : 'reveal');
    timer.current = setTimeout(() => { lock.current = false; setBusy(false); timer.current = null; }, BALANCE.turnMs);
  };
  const resume = () => { setScreen('run'); setPaused(false); activateAudio(); };
  const begin = () => { commit(startRun(current.current, selectedDungeon, categoryId, weapon, Date.now(), studyOrder(categoryId))); setInput(''); setScreen('run'); setPaused(false); activateAudio(); };
  const exportProgress = () => {
    let original: string | null = null;
    try { original = blockedSave ? localStorage.getItem(PROFILE_KEY) : null; } catch { /* Export the in-memory profile when storage is inaccessible. */ }
    exportFile(`memory-dungeon-${dayKey()}.json`, original || JSON.stringify(current.current, null, 2), 'application/json');
  };
  const goHub = () => { setScreen('hub'); setPanel(null); setPaused(false); setInput(''); dungeonSound.stop(); };
  const abandon = () => { commit({ ...current.current, run: null }); goHub(); };

  return <div className="dungeon-app" data-motion={profile.settings.motion ? 'on' : 'off'}>
    <header className="game-header">
      <button className="game-brand" onClick={() => screen === 'run' ? setPanel('exit') : goHub()} aria-label="암기 던전 거점"><span className="brand-mark"><BookOpen size={23} /></span><span>암기<span className="brand-pink">던전</span></span></button>
      
      <nav className="header-tools" aria-label="게임 메뉴"><button onClick={() => setPanel('codex')}><BookOpen size={16} /> 도감</button><button onClick={() => setPanel('stats')}><Trophy size={16} /> 기록</button><button onClick={() => setPanel('settings')} aria-label="게임 설정"><Settings2 size={19} /></button></nav>
    </header>
    {(warning || metricsWarning) && <div className="save-warning" role="alert"><span>{warning || '사용 지표를 저장하지 못했습니다. 학습은 계속할 수 있습니다.'}</span><button onClick={exportProgress}>기록 내보내기</button>{blockedSave && <button onClick={() => { setBlockedSave(false); setWarning(saveProfile(current.current)); }}>새 기록 시작</button>}</div>}
    <div className="desktop-notice">던전은 PC에 맞춰 제작됐습니다. 작은 화면에서는 상단의 기본 암기 모드를 이용해 주세요.</div>

    {(screen === 'hub' || screen === 'prepare') && <main className="compact-hub">
      <div className="setup-topline"><label htmlFor="category-select">학습</label><select id="category-select" value={categoryId} onChange={e => setCategoryId(e.target.value)}>{CATEGORIES.map(category => <option value={category.id} key={category.id}>{category.group === 'civil' ? '공무원' : '숫자'} · {category.category}</option>)}</select></div>
      <div className="dungeon-cards">{DUNGEONS.map((world, index) => <button key={world.id} className={`dungeon-card world-${index} ${selectedDungeon === world.id ? 'chosen' : ''}`} disabled={index > profile.unlockedDungeon} onClick={() => setSelectedDungeon(world.id)} aria-pressed={selectedDungeon === world.id} title={index > profile.unlockedDungeon ? '이전 던전 완료 후 해금' : world.title}>
        <div className="dungeon-cover"><RoomPreview theme={index} locked={index > profile.unlockedDungeon} />{index > profile.unlockedDungeon && <span className="locked-overlay"><LockKeyhole size={23} /></span>}</div>
        <div className="dungeon-card-info"><h2>{world.title}{index > profile.unlockedDungeon ? <LockKeyhole size={15} /> : selectedDungeon === world.id ? <Check size={18} /> : <ChevronRight size={18} />}</h2>{profile.completed.includes(world.id) && <span className="cleared-mark">완료</span>}</div>
      </button>)}</div>
      <section className="compact-weapons" aria-label="무기 선택"><div className="weapon-heading"><h2>무기</h2><span>{profile.score} 기억</span></div><div className="compact-weapon-list">{WEAPONS.map((arm, index) => <button key={arm.id} className={weapon === arm.id ? 'active' : ''} disabled={arm.unlock > profile.score} onClick={() => setWeapon(arm.id)} title={arm.unlock > profile.score ? `${arm.unlock} 기억에 해금` : arm.description} aria-pressed={weapon === arm.id}><Pixel kind="weapon" index={index} /><span>{arm.name}</span>{arm.unlock > profile.score && <small><LockKeyhole size={10} />{arm.unlock}</small>}</button>)}</div><p className="selected-weapon-detail">{weaponById(weapon).description}</p></section>
      <div className="compact-start">{run && run.phase !== 'victory' ? <><span>{dungeonById(run.dungeon).title} · {roomPosition + 1}/{roomSteps.length} 구간</span><button className="text-button" onClick={() => setPanel('exit')}>원정 끝내기</button><button className="game-button primary" onClick={resume}>이어서<Play size={17} /></button></> : <button className="game-button primary" onClick={begin}>시작<ArrowRight size={19} /></button>}</div>
    </main>}

    {screen === 'run' && run && <main className="run-main">
      <div className="run-heading"><div><h1>{dungeon.title}<span>{roomPosition + 1} / {roomSteps.length}</span></h1></div><div className="run-top-actions"><button className="text-button" onClick={() => setPanel('exit')}><ArrowLeft size={16} /> 거점</button><button className="game-button small" onClick={() => setPaused(true)} aria-label="원정 일시정지"><Pause size={17} /> ESC</button></div></div>
      <div className="run-layout"><div className="battle-column"><div className="battle-hud"><div className="health-block"><Heart size={20} fill="currentColor" /><div className="hp-pips" aria-label={`체력 ${run.hp} / ${run.maxHp}`}>{Array.from({ length: run.maxHp }, (_, i) => <i key={i} className={i < run.hp ? 'filled' : ''} />)}</div><b>{run.hp}/{run.maxHp}</b><span className="shield-count"><Shield size={17} />{run.shield}</span></div><div className="streak-badge"><Zap size={17} />연속 {run.streak}</div></div>
        <Arena run={run} roomNumber={roomPosition + 1} paused={stopped} motion={profile.settings.motion} />
        <div className={`answer-panel ${run.lastResult?.outcome === 'wrong' ? 'answer-warning' : ''}`}>
          <div className="answer-caption"><span>{run.phase === 'recovery' ? '회복 중' : run.bossShield ? '봉인 해제' : ''}</span></div>
          <DungeonStudy run={run} value={input} busy={busy} paused={stopped} onChange={setInput} onSubmit={submit} onComposition={value => { composing.current = value; }} onPick={id => { if (!lock.current) { commit(selectQuestion(current.current, id)); setInput(''); } }} />
          {run.phase === 'rest' && <div className="study-intermission"><span>체력 +4</span><button className="game-button primary small" onClick={() => commit(leaveRest(current.current))}>계속<ArrowRight size={15} /></button></div>}

          <p className={`battle-notice notice-${run.lastResult?.outcome || 'idle'}`} role="status" aria-live="polite">{busy ? '공격 중…' : run.phase === 'question' || run.phase === 'recovery' ? run.lastResult?.outcome === 'wrong' ? '오답 · 다시 입력하세요.' : run.lastResult?.outcome === 'correct' ? run.lastResult.review ? '복습 성공' : '정답' : '' : ''}</p>
        </div>
      </div><aside className="run-sidebar">
        <section className="path-panel"><div className="room-track" aria-label={`${roomSteps.length}구간 중 ${roomPosition + 1}구간`}>{roomSteps.map((index, position) => <div className={`${index === run.room ? 'current' : index < run.room ? 'done' : ''}`} key={index} title={ROOM_NAMES[index]}>{index < run.room ? <Check size={15} /> : index === 5 ? <Trophy size={15} /> : position + 1}</div>)}</div></section>
        {run.phase === 'reward' ? <section className="choice-panel"><h2 title="고르지 않고 정답을 제출하면 첫 강화를 자동 선택합니다.">강화 <small className="optional-choice">선택 사항</small> {run.rewardsLeft > 1 ? `· ${run.rewardsLeft}개` : ''}</h2><div className="relic-choices">{run.choices.map(id => { const relic = RELICS.find(r => r.id === id)!; const index = RELICS.indexOf(relic); return <button key={id} disabled={busy || stopped} onClick={() => { if (Date.now() - lastRewardAt.current < 300) return; lastRewardAt.current = Date.now(); commit(takeRelic(current.current, id)); activateAudio(); dungeonSound.effect('choice'); }}><Pixel kind="relic" index={index} /><span><em>{relic.type} · {(run.relics[id] || 0) + 1}/{relic.max}</em><b>{relic.name}</b><small>{relic.description}</small></span><ChevronRight size={16} /></button>; })}</div></section> : run.phase === 'route' ? <section className="choice-panel"><h2>다음 방</h2><button className="route-option" onClick={() => { commit(chooseRoute(current.current, 'elite')); activateAudio(); }}><Zap size={24} /><b>정예의 방</b><span>유물 2개</span><ArrowRight size={20} /></button><button className="route-option rest" onClick={() => commit(chooseRoute(current.current, 'rest'))}><Heart size={24} /><b>휴식</b><span>체력 +4</span><ArrowRight size={20} /></button></section> : run.phase === 'victory' ? <section className="choice-panel result-panel"><h2>원정 완료</h2><div className="result-stats"><div><b>{Object.keys(run.answers).length}</b><span>문항</span></div><div><b>{run.correct}</b><span>자력 정답</span></div><div><b>{run.reviews}</b><span>복습 성공</span></div><div><b>+{profile.score - run.scoreAtStart}</b><span>기억</span></div></div><p>원정 시간 {formatTime(profile.summaries[0]?.seconds || 0)}</p><div className="unlocks-row" aria-label="새 해금">{WEAPONS.filter(w => w.unlock > run.scoreAtStart && w.unlock <= profile.score).map(w => <span key={w.id} title={`${w.name} 해금`}><Pixel kind="weapon" index={WEAPONS.indexOf(w)} /><span className="sr-only">{w.name} 해금</span></span>)}</div><button className="game-button primary" onClick={() => { commit({ ...current.current, run: null }); setSelectedDungeon(DUNGEONS[Math.min(2, theme + 1)].id); setScreen('prepare'); }}>다음 원정<ArrowRight size={18} /></button><button className="text-button" onClick={goHub}>저장 후 쉬기</button></section> : <section className="enemy-panel"><h2>{run.phase === 'recovery' ? '회복 중' : '적'}</h2>{run.phase === 'recovery' ? <p>남은 문항을 풀면서 체력을 회복합니다.</p> : run.enemies.map(enemy => <div className={`enemy-row ${enemy.hp <= 0 ? 'defeated' : ''}`} key={enemy.id}><Pixel kind={enemy.boss ? 'boss' : 'enemy'} index={theme * 3 + enemy.kind} theme={theme} /><div><b>{enemy.name}</b><small>{enemy.hp <= 0 ? '처치 완료' : `${enemy.hp}/${enemy.maxHp} HP${enemy.armor ? ` · 갑옷 ${enemy.armor}` : ''}`}</small>{enemy.boss && <span>{run.bossShield ? '봉인 활성' : `패턴 ${run.bossPhase}`}</span>}</div></div>)}</section>}
        <section className="loadout-panel"><div className="loadout-weapon"><Pixel kind="weapon" index={WEAPONS.findIndex(w => w.id === run.weapon)} /><div><b>{weaponById(run.weapon).name}</b><small>{weaponById(run.weapon).description}</small></div></div><div className="equipped-relics">{Object.entries(run.relics).length ? Object.entries(run.relics).map(([id, count]) => { const index = RELICS.findIndex(r => r.id === id); return <span key={id} title={`${RELICS[index].name} ${count}단계: ${RELICS[index].description}`}><Pixel kind="relic" index={index} /><b>{count}</b><span className="sr-only">{RELICS[index].name} {count}단계</span></span>; }) : <p>유물 없음</p>}</div></section>
      </aside></div>
    </main>}



    {paused && screen === 'run' && !panel && <Dialog title="일시정지" onClose={resume}><div className="pause-copy"><Pixel kind="hero" /><p>기록이 저장되었습니다.</p></div><button className="game-button primary full" onClick={resume}><Play size={17} /> 이어서</button><button className="text-button full" onClick={goHub}>저장 후 거점</button></Dialog>}
    {panel === 'exit' && <Dialog title="원정 종료" onClose={() => setPanel(null)}><p className="modal-copy">원정을 끝내면 이번 유물은 사라집니다. 영구 해금과 복습 기록은 유지됩니다.</p><button className="game-button primary full" onClick={goHub}>저장 후 거점</button><button className="game-button full" onClick={abandon}>원정 끝내기</button></Dialog>}
    {panel === 'settings' && <Dialog title="설정" onClose={() => { setPanel(null); if (screen === 'run') activateAudio(); }}><div className="settings-fields"><label>배경 음악 <output>{Math.round(profile.settings.music * 100)}%</output><input aria-label="배경 음악 음량" type="range" min="0" max="1" step="0.01" value={profile.settings.music} onChange={e => { commit({ ...current.current, settings: { ...current.current.settings, music: Number(e.target.value) } }); activateAudio(); }} /></label><label>효과음 <output>{Math.round(profile.settings.effects * 100)}%</output><input aria-label="효과음 음량" type="range" min="0" max="1" step="0.01" value={profile.settings.effects} onChange={e => { commit({ ...current.current, settings: { ...current.current.settings, effects: Number(e.target.value) } }); activateAudio(); dungeonSound.effect('choice'); }} /></label><label className="checkbox-label"><input type="checkbox" checked={profile.settings.motion} onChange={e => commit({ ...current.current, settings: { ...current.current.settings, motion: e.target.checked } })} /> 화면 흔들림과 타격 효과</label><p>끄면 흔들림·번쩍임·파티클을 줄입니다. 전투 결과는 글과 아이콘으로도 표시됩니다.</p><button className="game-button" onClick={exportProgress}><Download size={17} /> 진행 기록 JSON</button><button className="game-button" onClick={exportMetrics}><Download size={17} /> 사용 지표 CSV</button></div></Dialog>}
    {panel === 'codex' && <Dialog title="도감" onClose={() => setPanel(null)}><Codex profile={profile} /></Dialog>}
    {panel === 'stats' && <Dialog title="학습 기록" onClose={() => setPanel(null)}><Stats profile={profile} /><button className="game-button" onClick={exportMetrics}><Download size={17} /> CSV 내보내기</button></Dialog>}

  </div>;
}

function Pagination({ page, count, onChange }: { page: number; count: number; onChange: (page: number) => void }) {
  if (count < 2) return null;
  return <nav className="panel-pagination" aria-label="페이지 선택"><button disabled={page === 0} onClick={() => onChange(page - 1)} aria-label="이전 페이지"><ArrowLeft size={15} /></button><span>{page + 1} / {count}</span><button disabled={page + 1 >= count} onClick={() => onChange(page + 1)} aria-label="다음 페이지"><ArrowRight size={15} /></button></nav>;
}

function Codex({ profile }: { profile: Profile }) {
  const [tab, setTab] = useState('weapons');
  const [page, setPage] = useState(0);
  return <div className="codex-view"><nav className="panel-tabs" aria-label="도감 분류">{[['weapons', '무기'], ['relics', '유물'], ['bosses', '보스']].map(([id, label]) => <button key={id} aria-pressed={tab === id} onClick={() => { setTab(id); setPage(0); }}>{label}</button>)}</nav>
    <div className="codex-grid">
      {tab === 'weapons' && WEAPONS.map((arm, index) => <div className={arm.unlock > profile.score ? 'codex-locked' : ''} key={arm.id}><Pixel kind="weapon" index={index} /><b>{arm.name}</b><small>{arm.description}</small><em>{arm.unlock > profile.score ? `${arm.unlock} 기억에 해금` : '사용 가능'}</em></div>)}
      {tab === 'relics' && RELICS.slice(page * 6, page * 6 + 6).map(relic => <div key={relic.id}><Pixel kind="relic" index={RELICS.indexOf(relic)} /><b>{relic.name}</b><small>{relic.description}</small></div>)}
      {tab === 'bosses' && DUNGEONS.map((world, index) => <div key={world.id}><Pixel kind="boss" theme={index} /><b>{world.boss}</b><small>{profile.completed.includes(world.id) ? '봉인 해제' : '미완료'}</small></div>)}
    </div><Pagination page={page} count={tab === 'relics' ? Math.ceil(RELICS.length / 6) : 1} onChange={setPage} />
  </div>;
}

function Stats({ profile }: { profile: Profile }) {
  const [tab, setTab] = useState('summary');
  const [page, setPage] = useState(0);
  const metrics = readMetrics();
  const days = Object.keys(metrics.days).sort();
  const sum = (mode: 'classic' | 'dungeon', field: keyof DailyMetrics) => days.reduce((value, day) => value + (metrics.days[day][mode]?.[field] || 0), 0);
  const visitDays = days.filter(day => metrics.days[day].classic.visits + metrics.days[day].dungeon.visits > 0);
  const deltaDays = (a: string, b: string) => Math.round((Date.parse(`${b}T12:00:00`) - Date.parse(`${a}T12:00:00`)) / 86400000);
  const nextDays = visitDays.filter((day, index) => index > 0 && deltaDays(visitDays[index - 1], day) === 1).length;
  const withinWeek = visitDays.filter((day, index) => index > 0 && deltaDays(visitDays[index - 1], day) <= 7).length;
  const reviewAttempts = sum('dungeon', 'reviewAttempts');
  return <div className="stats-view"><nav className="panel-tabs" aria-label="기록 분류"><button aria-pressed={tab === 'summary'} onClick={() => setTab('summary')}>학습</button><button aria-pressed={tab === 'runs'} onClick={() => setTab('runs')}>원정</button></nav>
    {tab === 'summary' ? <><div className="result-stats"><div><b>{profile.score}</b><span>기억</span></div><div><b>{profile.completed.length}/3</b><span>던전 완료</span></div><div><b>{nextDays}</b><span>다음 날 재방문</span></div><div><b>{withinWeek}</b><span>7일 내 재방문</span></div></div>
      <table><thead><tr><th>이 기기의 기록</th><th>기본 암기</th><th>던전</th></tr></thead><tbody><tr><th>활성 시간</th><td>{formatTime(sum('classic', 'activeSeconds'))}</td><td>{formatTime(sum('dungeon', 'activeSeconds'))}</td></tr><tr><th>학습 시간</th><td>{formatTime(sum('classic', 'learningSeconds'))}</td><td>{formatTime(sum('dungeon', 'learningSeconds'))}</td></tr><tr><th>풀이</th><td>{sum('classic', 'submissions')}</td><td>{sum('dungeon', 'submissions')}</td></tr><tr><th>자력 정답</th><td>{sum('classic', 'correct')}</td><td>{sum('dungeon', 'correct')}</td></tr><tr><th>오답 재도전</th><td>{sum('classic', 'retries')}</td><td>{sum('dungeon', 'retries')}</td></tr></tbody></table>
      <p>복습 정답률 {reviewAttempts ? Math.round(sum('dungeon', 'reviewCorrect') / reviewAttempts * 100) : 0}% · 원정 완료 {sum('dungeon', 'runsFinished')}/{sum('dungeon', 'runsStarted')}</p><p className="panel-note">숨김·60초 이상 자리 비움은 제외합니다. 이 기기의 참고 기록이며 학습 효과를 입증하지 않습니다.</p></> : <><div className="recent-runs">{profile.summaries.length ? profile.summaries.slice(page * 3, page * 3 + 3).map((summary, i) => <div key={`${summary.date}-${i}`}><b>{dungeonById(summary.dungeon).title}</b><span>{summary.date} · {weaponById(summary.weapon).name}</span><small>정답 {summary.correct} · 복습 {summary.reviews} · {formatTime(summary.seconds)}</small><small>{Object.entries(summary.relics).map(([id, n]) => `${RELICS.find(r => r.id === id)?.name} ${n}`).join(' / ')}</small></div>) : <p>완료한 원정이 없습니다.</p>}</div><Pagination page={page} count={Math.ceil(profile.summaries.length / 3)} onChange={setPage} /></>}
  </div>;
}
