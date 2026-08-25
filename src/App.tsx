import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  TOPIC_GROUPS,
  CIVIL_CATEGORIES,
  NUMBER_CATEGORIES,
  CategoryItem, 
  CategoryData,
  isMatch 
} from './data';
import { sound } from './audio';
import { 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Check, 
  X,
  ArrowRight,
  GripVertical,
  ArrowUpDown,
  Hash
} from 'lucide-react';

interface SlotStatus {
  item: CategoryItem;
  revealed: boolean;
  revealedBySurrender?: boolean; // 2회 오답 후 시스템에 의해 정답이 공개된 슬롯
  attempts: number; // 현재 슬롯 오답 횟수 (0: 미입력/최초, 1: 1차 오답, 2: 2차 오답 후 공개)
  userAnswer?: string;
  isRecentCorrect?: boolean;
}

// Storage structure for all categories
type SavedCategoryState = Record<string, {
  revealedIndices?: number[];
  revealedBySurrenderIndices?: number[];
  revealedNames?: string[];
  revealedBySurrenderNames?: string[];
  attemptsMap?: Record<number, number>;
  attemptsByName?: Record<string, number>;
  userAnswers?: Record<number, string>;
  userAnswersByName?: Record<string, string>;
}>;

const STORAGE_KEY = 'retro_cloze_saved_progress_v3';
const ORDER_STORAGE_KEY = 'retro_cloze_custom_item_order_v1';
const TOPIC_STORAGE_KEY = 'retro_cloze_active_topic_v1';
const FAILED_HISTORY_KEY = 'retro_cloze_failed_history_v1';

export default function App() {
  // Active Topic Group ('civil' | 'number')
  const [selectedTopic, setSelectedTopic] = useState<'civil' | 'number'>(() => {
    const saved = localStorage.getItem(TOPIC_STORAGE_KEY);
    return saved === 'number' ? 'number' : 'civil';
  });

  // Current category index within active topic
  const [selectedCatIndex, setSelectedCatIndex] = useState<number>(0);
  
  // Persistent category records across all categories
  const [allProgress, setAllProgress] = useState<SavedCategoryState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore
    }
    return {};
  });

  // Persistent failed items record (for visual cue on retries)
  const [failedHistory, setFailedHistory] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(FAILED_HISTORY_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore
    }
    return {};
  });

  // Persistent Custom Item Orders per Category ID
  const [customOrders, setCustomOrders] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem(ORDER_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore
    }
    return {};
  });

  // Order Edit Mode Toggle
  const [isEditOrderMode, setIsEditOrderMode] = useState<boolean>(false);

  // Drag and Drop state on Main Grid
  const [draggedSlotIndex, setDraggedSlotIndex] = useState<number | null>(null);
  const [dragOverSlotIndex, setDragOverSlotIndex] = useState<number | null>(null);

  // Game Status for current category
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // Audio Settings
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem('retro_cloze_muted') === 'true';
  });

  // Active Slot Index & Current Input value
  const [activeSlotIdx, setActiveSlotIdx] = useState<number>(0);
  const [slotInput, setSlotInput] = useState<string>('');
  const [inputShake, setInputShake] = useState<boolean>(false);
  const [inputFlashGreen, setInputFlashGreen] = useState<boolean>(false);
  const [noticeMessage, setNoticeMessage] = useState<string>('');
  const [isKeyActive, setIsKeyActive] = useState<boolean>(false);
  const keyPulseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Melodic Streak counter
  const [streakCount, setStreakCount] = useState<number>(0);

  // Categories list for current topic
  const currentTopicCategories = useMemo(() => {
    return selectedTopic === 'civil' ? CIVIL_CATEGORIES : NUMBER_CATEGORIES;
  }, [selectedTopic]);

  // Ensure selectedCatIndex is valid
  useEffect(() => {
    if (selectedCatIndex >= currentTopicCategories.length) {
      setSelectedCatIndex(0);
    }
  }, [selectedTopic, currentTopicCategories.length, selectedCatIndex]);

  // Current category base data
  const baseCategoryData = useMemo(() => {
    return currentTopicCategories[selectedCatIndex] || currentTopicCategories[0];
  }, [currentTopicCategories, selectedCatIndex]);

  // Derive Ordered Items for current category from customOrders
  const currentOrderedItems = useMemo<CategoryItem[]>(() => {
    const customList = customOrders[baseCategoryData.id];
    if (!customList || customList.length === 0) {
      return baseCategoryData.items;
    }

    const itemMap = new Map<string, CategoryItem>(baseCategoryData.items.map(item => [item.name, item]));
    const ordered: CategoryItem[] = [];

    customList.forEach(name => {
      const found = itemMap.get(name);
      if (found) {
        ordered.push(found);
        itemMap.delete(name);
      }
    });

    // Append any items that were not in the custom list (safeguard)
    itemMap.forEach(item => ordered.push(item));
    return ordered;
  }, [baseCategoryData, customOrders]);

  // Current category combined data with ordered items
  const currentCategoryData = useMemo<CategoryData>(() => {
    return {
      ...baseCategoryData,
      items: currentOrderedItems
    };
  }, [baseCategoryData, currentOrderedItems]);

  const isCustomOrderActive = Boolean(customOrders[baseCategoryData.id]?.length);

  // Current slots state
  const [slots, setSlots] = useState<SlotStatus[]>([]);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync audio mute settings
  useEffect(() => {
    sound.setMuted(isMuted);
    localStorage.setItem('retro_cloze_muted', isMuted ? 'true' : 'false');
  }, [isMuted]);

  // Save active topic
  useEffect(() => {
    localStorage.setItem(TOPIC_STORAGE_KEY, selectedTopic);
  }, [selectedTopic]);

  // Save all progress to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allProgress));
    } catch {
      // Ignore
    }
  }, [allProgress]);

  // Save custom orders to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(customOrders));
    } catch {
      // Ignore
    }
  }, [customOrders]);

  // Save failed items history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(FAILED_HISTORY_KEY, JSON.stringify(failedHistory));
    } catch {
      // Ignore
    }
  }, [failedHistory]);

  // Focus & Auto-scroll helper to keep the active blank centered in view
  const focusActiveInput = (blockPos: ScrollLogicalPosition = 'center') => {
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus({ preventScroll: true });
        inputRef.current.scrollIntoView({
          behavior: 'smooth',
          block: blockPos,
          inline: 'nearest'
        });
      }
    }, 50);
  };

  // Automatically focus and smooth-scroll to the active blank whenever activeSlotIdx changes
  useEffect(() => {
    if (!isFinished && activeSlotIdx !== null) {
      focusActiveInput('center');
    }
  }, [activeSlotIdx, isFinished]);

  // Load or initialize slots when category or ordered items change
  useEffect(() => {
    const catId = currentCategoryData.id;
    const catSaved = allProgress[catId] || { 
      revealedIndices: [], 
      revealedBySurrenderIndices: [], 
      revealedNames: [],
      revealedBySurrenderNames: [],
      attemptsMap: {}, 
      attemptsByName: {},
      userAnswers: {},
      userAnswersByName: {}
    };

    const initializedSlots: SlotStatus[] = currentCategoryData.items.map((item, idx) => {
      const isRevByName = catSaved.revealedNames?.includes(item.name);
      const isRev = isRevByName !== undefined ? isRevByName : (catSaved.revealedIndices?.includes(idx) ?? false);

      const isSurrenderByName = catSaved.revealedBySurrenderNames?.includes(item.name);
      const isSurrender = isSurrenderByName !== undefined ? isSurrenderByName : (catSaved.revealedBySurrenderIndices?.includes(idx) ?? false);

      const attemptCount = catSaved.attemptsByName?.[item.name] ?? catSaved.attemptsMap?.[idx] ?? 0;

      const userAns = isRev 
        ? (catSaved.userAnswersByName?.[item.name] || catSaved.userAnswers?.[idx] || item.name)
        : '';

      return {
        item,
        revealed: isRev,
        revealedBySurrender: isSurrender,
        attempts: attemptCount,
        userAnswer: userAns
      };
    });

    setSlots(initializedSlots);

    const isAllRev = initializedSlots.length > 0 && initializedSlots.every(s => s.revealed);
    setIsFinished(isAllRev);

    // Find the first unrevealed slot to set as active
    const firstUnrevealed = initializedSlots.findIndex(s => !s.revealed);
    if (firstUnrevealed !== -1) {
      setActiveSlotIdx(firstUnrevealed);
    } else {
      setActiveSlotIdx(0);
    }

    setSlotInput('');
    setStreakCount(0);
    setNoticeMessage('');
    setInputShake(false);
    setInputFlashGreen(false);

    focusActiveInput();
  }, [selectedCatIndex, currentCategoryData]);

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 90,
        spread: 90,
        origin: { y: 0.55 },
        colors: ['#ff2a85', '#ffe600', '#00ff66', '#00f0ff', '#843dff'],
        disableForReducedMotion: true
      });
    } catch {
      // Ignore
    }
  };

  // Reordering handlers (1:1 Swap positions)
  const handleMoveItem = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= currentOrderedItems.length || fromIdx === toIdx) return;
    sound.playMechanicalKey();

    const newItems = [...currentOrderedItems];
    const temp = newItems[fromIdx];
    newItems[fromIdx] = newItems[toIdx];
    newItems[toIdx] = temp;

    const newNames = newItems.map(i => i.name);
    setCustomOrders(prev => ({
      ...prev,
      [baseCategoryData.id]: newNames
    }));
  };

  const handleResetItemOrder = () => {
    sound.playReset();
    setCustomOrders(prev => {
      const next = { ...prev };
      delete next[baseCategoryData.id];
      return next;
    });
  };

  // Advance to Next Unrevealed Slot (Tab key)
  const advanceToNextSlot = useCallback(() => {
    if (slots.length === 0) return;
    
    const nextUnrevealed = slots.findIndex((s, idx) => idx > activeSlotIdx && !s.revealed);
    if (nextUnrevealed !== -1) {
      setActiveSlotIdx(nextUnrevealed);
      setSlotInput('');
      focusActiveInput();
      return;
    }

    const firstFromStart = slots.findIndex((s, idx) => idx < activeSlotIdx && !s.revealed);
    if (firstFromStart !== -1) {
      setActiveSlotIdx(firstFromStart);
      setSlotInput('');
      focusActiveInput();
    }
  }, [slots, activeSlotIdx]);

  // Synchronize slot changes to global persistent storage
  const syncSlotsToStorage = (updatedSlots: SlotStatus[]) => {
    const catId = currentCategoryData.id;
    const revNames: string[] = [];
    const surrNames: string[] = [];
    const attemptsByName: Record<string, number> = {};
    const userAnswersByName: Record<string, string> = {};

    updatedSlots.forEach(s => {
      if (s.revealed) {
        revNames.push(s.item.name);
        if (s.revealedBySurrender) {
          surrNames.push(s.item.name);
        }
        if (s.userAnswer) {
          userAnswersByName[s.item.name] = s.userAnswer;
        }
      }
      if (s.attempts > 0) {
        attemptsByName[s.item.name] = s.attempts;
      }
    });

    setAllProgress(prev => ({
      ...prev,
      [catId]: {
        revealedNames: revNames,
        revealedBySurrenderNames: surrNames,
        attemptsByName,
        userAnswersByName
      }
    }));
  };

  // Submits the current active slot input
  const handleSubmitActiveSlot = () => {
    if (isEditOrderMode) return;
    if (slots.length === 0) return;

    const targetIdx = activeSlotIdx;
    const currentSlot = slots[targetIdx];

    if (!currentSlot || currentSlot.revealed) {
      advanceToNextSlot();
      return;
    }

    const cleanText = slotInput.trim();
    const itemName = currentSlot.item.name;

    // 1. Check if input matches active slot's answer (정답 맞힘)
    if (cleanText && isMatch(cleanText, currentSlot.item.name, currentSlot.item.aliases)) {
      sound.playStreakCorrect(streakCount);
      setStreakCount(prev => prev + 1);

      // If this item was previously failed in a 2nd mistake, remove it from failedHistory
      const itemKey = `${currentCategoryData.id}:${currentSlot.item.name}`;
      if (failedHistory[itemKey]) {
        setFailedHistory(prev => {
          const next = { ...prev };
          delete next[itemKey];
          return next;
        });
      }

      // Flash green
      setInputFlashGreen(true);
      setTimeout(() => setInputFlashGreen(false), 240);

      const updatedSlots = [...slots];
      updatedSlots[targetIdx] = {
        ...currentSlot,
        revealed: true,
        revealedBySurrender: false,
        userAnswer: currentSlot.item.name,
        isRecentCorrect: true
      };

      setSlots(updatedSlots);
      syncSlotsToStorage(updatedSlots);
      setSlotInput('');
      setNoticeMessage('');

      // Check stage clear & Auto-advance to next category
      const isAllNowSolved = updatedSlots.every(s => s.revealed);
      if (isAllNowSolved) {
        setIsFinished(true);
        triggerCelebration();
        setTimeout(() => {
          setSelectedCatIndex(prev => (prev + 1) % currentTopicCategories.length);
        }, 800);
      } else {
        const nextUnrevealedIdx = updatedSlots.findIndex((s, idx) => idx > targetIdx && !s.revealed);
        if (nextUnrevealedIdx !== -1) {
          setActiveSlotIdx(nextUnrevealedIdx);
        } else {
          const wrapIdx = updatedSlots.findIndex(s => !s.revealed);
          if (wrapIdx !== -1) setActiveSlotIdx(wrapIdx);
        }
      }
      focusActiveInput();
      return;
    }

    // 2. Incorrect Answer Handling (2-Strike rule)
    setStreakCount(0);

    const currentAttempts = currentSlot.attempts || 0;
    const newAttempts = currentAttempts + 1;

    // Trigger visual error shake
    setInputShake(true);
    setTimeout(() => setInputShake(false), 300);

    if (newAttempts < 2) {
      sound.playFirstWrong();
      // 1st Mistake: Keep slot active, prompt user to retry
      const updatedSlots = [...slots];
      updatedSlots[targetIdx] = {
        ...currentSlot,
        attempts: newAttempts
      };
      setSlots(updatedSlots);
      syncSlotsToStorage(updatedSlots);

      setNoticeMessage(`⚠️ [${currentSlot.item.num || targetIdx + 1}] 오답 (1/2) - 한 번 더 입력해보세요!`);
      setSlotInput('');
      focusActiveInput();
    } else {
      sound.playRevealAnswer();
      // 2nd Mistake: Surrender slot, reveal correct answer, record to failedHistory, and advance
      const itemKey = `${currentCategoryData.id}:${itemName}`;
      setFailedHistory(prev => ({
        ...prev,
        [itemKey]: true
      }));

      const updatedSlots = [...slots];
      updatedSlots[targetIdx] = {
        ...currentSlot,
        revealed: true,
        revealedBySurrender: true,
        attempts: 2,
        userAnswer: itemName
      };
      setSlots(updatedSlots);
      syncSlotsToStorage(updatedSlots);

      setNoticeMessage(`❌ [${currentSlot.item.num || targetIdx + 1}] 정답: "${itemName}"`);
      setSlotInput('');

      // Auto advance to next slot
      const isAllNowSolved = updatedSlots.every(s => s.revealed);
      if (isAllNowSolved) {
        setIsFinished(true);
        triggerCelebration();
        setTimeout(() => {
          setSelectedCatIndex(prev => (prev + 1) % currentTopicCategories.length);
        }, 800);
      } else {
        const nextUnrevealedIdx = updatedSlots.findIndex((s, idx) => idx > targetIdx && !s.revealed);
        if (nextUnrevealedIdx !== -1) {
          setActiveSlotIdx(nextUnrevealedIdx);
        } else {
          const wrapIdx = updatedSlots.findIndex(s => !s.revealed);
          if (wrapIdx !== -1) setActiveSlotIdx(wrapIdx);
        }
      }
      focusActiveInput();
    }
  };

  // Click on a specific slot to switch active target
  const handleSlotClick = (index: number) => {
    if (isEditOrderMode) return;
    const clickedSlot = slots[index];
    if (!clickedSlot) return;

    // 정답 혹은 2차오답으로 이미 공개된 빈칸은 수정/재도전 불가
    if (clickedSlot.revealed) {
      return;
    }

    sound.playMechanicalKey();
    setActiveSlotIdx(index);
    setSlotInput('');
    setNoticeMessage('');
    focusActiveInput();
  };

  // Full Reset for all categories across all topics
  const handleResetAll = useCallback(() => {
    sound.playReset();

    // Clear all categories saved progress
    setAllProgress({});

    // Reset local slots for current category
    const freshSlots: SlotStatus[] = currentCategoryData.items.map(item => ({
      item,
      revealed: false,
      revealedBySurrender: false,
      attempts: 0,
      userAnswer: ''
    }));

    setSlots(freshSlots);
    setIsFinished(false);
    setActiveSlotIdx(0);
    setSlotInput('');
    setStreakCount(0);
    setNoticeMessage('');
    setInputShake(false);
    setInputFlashGreen(false);

    focusActiveInput();
  }, [currentCategoryData]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle sound
      if (e.altKey && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        setIsMuted(prev => !prev);
        return;
      }

      // Switch Topic (Alt+Q: 공무원, Alt+W: 숫자)
      if (e.altKey && (e.key === 'q' || e.key === 'Q')) {
        e.preventDefault();
        sound.playMechanicalKey();
        setSelectedTopic('civil');
        setSelectedCatIndex(0);
        return;
      }
      if (e.altKey && (e.key === 'w' || e.key === 'W')) {
        e.preventDefault();
        sound.playMechanicalKey();
        setSelectedTopic('number');
        setSelectedCatIndex(0);
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        handleResetAll();
        return;
      }

      if (e.altKey && ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].includes(e.key)) {
        e.preventDefault();
        const num = parseInt(e.key);
        const catIdx = num === 0 ? 9 : num - 1;
        if (catIdx >= 0 && catIdx < currentTopicCategories.length) {
          sound.playMechanicalKey();
          setSelectedCatIndex(catIdx);
        }
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        sound.playMechanicalKey();
        advanceToNextSlot();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleResetAll, advanceToNextSlot, currentTopicCategories.length]);

  const revealedCount = slots.filter(s => s.revealed).length;
  const totalCount = slots.length;
  const progressPercent = totalCount > 0 ? Math.round((revealedCount / totalCount) * 100) : 0;

  // Theme color accents
  const themeColors = ['#ff2a85', '#00f0ff', '#ffe600', '#00ff66', '#ff7700', '#843dff'];
  const themeColor = themeColors[selectedCatIndex % themeColors.length];

  return (
    <div className="min-h-screen bg-[#0b0716] text-[#e2d9f3] flex flex-col font-sans select-none overflow-x-hidden">
      
      {/* Background Ambience Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-20 bg-[linear-gradient(to_right,#2a1e47_1px,transparent_1px),linear-gradient(to_bottom,#2a1e47_1px,transparent_1px)] bg-[size:2.5rem_2.5rem]" />

      {/* Main Container */}
      <div className="relative z-10 flex-1 flex flex-col max-w-5xl w-full mx-auto p-3 sm:p-4 lg:p-6">
        
        {/* TOP BAR / NAVIGATION */}
        <header className="flex flex-col gap-3 pb-3 border-b-2 border-[#231a38]">
          
          {/* Top Row: Topic Switcher Deck & Functional Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            
            {/* Topic Switcher Deck Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-[#171126] border-2 border-[#2e214d] rounded-lg shadow-[3px_3px_0px_#000000]">
              {TOPIC_GROUPS.map(tg => {
                const isActive = selectedTopic === tg.id;
                return (
                  <button
                    key={tg.id}
                    onClick={() => {
                      if (selectedTopic !== tg.id) {
                        sound.playMechanicalKey();
                        setSelectedTopic(tg.id);
                        setSelectedCatIndex(0);
                      }
                    }}
                    className={`px-3 py-1.5 rounded text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-[#ff2a85] text-white border border-[#000000] shadow-[2px_2px_0px_#000000]'
                        : 'text-[#a594c7] hover:text-white hover:bg-[#231a38]'
                    }`}
                  >
                    <span>{tg.icon}</span>
                    <span>{tg.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Functional Controls */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setIsEditOrderMode(prev => {
                    const next = !prev;
                    if (!next) {
                      focusActiveInput();
                    }
                    return next;
                  });
                }}
                title="순서 편집 (클릭 후 드래그하여 순서 변경)"
                className={`kitsch-btn px-3 py-1.5 rounded cursor-pointer flex items-center gap-1.5 text-xs font-black transition-all ${
                  isEditOrderMode 
                    ? 'bg-[#ffe600] text-[#0b0716] border-2 border-[#000000] shadow-[2px_2px_0px_#ff2a85]' 
                    : 'bg-[#231a38] text-[#ffe600] border border-[#000000] hover:text-white hover:bg-[#2d2247]'
                }`}
              >
                <ArrowUpDown className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{isEditOrderMode ? '편집 완료' : '순서 편집'}</span>
              </button>

              <button
                onClick={() => setIsMuted(prev => !prev)}
                title="사운드 (Alt+M)"
                className={`kitsch-btn px-3 py-1.5 rounded cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                  !isMuted 
                    ? 'bg-[#ccff00] text-[#0b0716] border-[#000000]' 
                    : 'bg-[#ff2a85] text-white border-[#000000]'
                }`}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                <span>{isMuted ? '음소거' : '효과음'}</span>
              </button>

              <button
                onClick={handleResetAll}
                title="전체 초기화 (ESC)"
                className="kitsch-btn px-3 py-1.5 border border-[#000000] text-[#a594c7] hover:text-white bg-[#231a38] hover:bg-[#ff2a85]/30 cursor-pointer rounded flex items-center gap-1.5 text-xs font-bold"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>전체 초기화</span>
              </button>
            </div>

          </div>

          {/* Sub Row: Category Tabs */}
          <nav className="flex flex-wrap items-center gap-1.5">
            {currentTopicCategories.map((cat, idx) => {
              const isSelected = selectedCatIndex === idx;
              const savedForCat = allProgress[cat.id];
              const isCleared = savedForCat && savedForCat.revealedNames && savedForCat.revealedNames.length >= cat.items.length;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCatIndex(idx)}
                  className={`kitsch-btn flex items-center gap-2 px-3.5 py-1.5 text-xs font-black rounded cursor-pointer ${
                    isSelected
                      ? 'bg-[#ffe600] text-[#0b0716] border-[#000000] shadow-[3px_3px_0px_#ff2a85]'
                      : 'bg-[#231a38] text-[#a594c7] border-[#000000] hover:text-white hover:bg-[#2d2247]'
                  }`}
                >
                  <span className="text-[11px] opacity-70">[{idx + 1}]</span>
                  <span className="tracking-tight">{cat.category}</span>
                  {isCleared && <Check className="w-3.5 h-3.5 text-[#0b0716] stroke-[3]" />}
                </button>
              );
            })}
          </nav>
        </header>

        {/* MAIN STAGE CONSOLE */}
        <main className="flex-1 flex flex-col justify-center my-3 max-w-4xl w-full mx-auto">
          
          {/* Header Banner */}
          <div className="bg-[#171126] border-2 border-[#2e214d] p-4 lg:p-5 rounded-xl mb-4 shadow-[5px_5px_0px_#000000]">
            <div className="flex flex-wrap items-center justify-between gap-3.5 mb-3.5">
              
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[#ff2a85] border border-[#000000] shadow-[0_0_8px_#ff2a85]" />
                <h2 className="text-xl lg:text-2xl font-black text-white tracking-tight">
                  {currentCategoryData.category}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                {isCustomOrderActive && (
                  <button
                    onClick={handleResetItemOrder}
                    title="기본 순서로 복원"
                    className="kitsch-btn px-2.5 py-1 rounded-lg cursor-pointer flex items-center gap-1.5 text-xs font-black bg-[#231a38] hover:bg-[#a594c7] text-[#a594c7] hover:text-[#0b0716] border-2 border-[#000000] shadow-[2px_2px_0px_#000000] transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>기본 순서 복원</span>
                  </button>
                )}

                <div className="bg-[#231a38] border-2 border-[#000000] px-3.5 py-1 rounded-lg flex items-center gap-2.5 shadow-[2px_2px_0px_#000000]">
                  <span className="text-xs font-black text-[#00ff66] font-mono">
                    {revealedCount} / {totalCount}
                  </span>
                  <span className="text-xs font-black text-[#ffe600]">
                    {progressPercent}%
                  </span>
                </div>
              </div>

            </div>

            {/* Neo-brutalist Gradient Gauge */}
            <div className="kitsch-gauge-bg">
              <div 
                className="kitsch-gauge-fill" 
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Edit Mode Notification Banner */}
          {isEditOrderMode && (
            <div className="flex items-center justify-between text-xs font-black text-[#ffe600] bg-[#843dff]/25 border-2 border-[#ffe600] px-3.5 py-2.5 rounded-xl mb-3 shadow-[3px_3px_0px_#000000] animate-jelly-snap">
              <span className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-[#ffe600] shrink-0" />
                <span>순서 편집 중 (정답 전체 공개): 카드를 드래그하여 원하는 위치로 순서를 변경하세요.</span>
              </span>
              <button
                onClick={() => {
                  setIsEditOrderMode(false);
                  focusActiveInput();
                }}
                className="px-3 py-1 bg-[#ffe600] text-[#0b0716] rounded font-black text-xs hover:bg-white cursor-pointer border border-[#000000] shadow-[1px_1px_0px_#000000] shrink-0"
              >
                편집 완료
              </button>
            </div>
          )}

          {/* SEQUENTIAL KITSCH SLOTS GRID WITH CONDITIONAL DRAG & DROP */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {slots.map((slot, index) => {
              const isRevealed = slot.revealed;
              const isActive = !isRevealed && activeSlotIdx === index && !isFinished;
              const isSurrender = slot.revealedBySurrender;
              const attempts = slot.attempts || 0;
              const itemKey = `${currentCategoryData.id}:${slot.item.name}`;
              const hasPrevFail = Boolean(failedHistory[itemKey]);

              const isDraggingThis = isEditOrderMode && draggedSlotIndex === index;
              const isDragOverThis = isEditOrderMode && dragOverSlotIndex === index && draggedSlotIndex !== index;

              // 0. ORDER EDIT MODE: SHOW ALL ANSWERS FULLY OPEN
              if (isEditOrderMode) {
                return (
                  <div
                    key={`${currentCategoryData.id}-${slot.item.name}-${index}`}
                    draggable={true}
                    onDragStart={() => setDraggedSlotIndex(index)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverSlotIndex(index);
                    }}
                    onDragLeave={() => setDragOverSlotIndex(null)}
                    onDrop={() => {
                      if (draggedSlotIndex !== null) {
                        handleMoveItem(draggedSlotIndex, index);
                        setDraggedSlotIndex(null);
                        setDragOverSlotIndex(null);
                      }
                    }}
                    className={`kitsch-card flex items-center justify-between p-3.5 sm:p-4 rounded-xl border-2 transition-all cursor-grab active:cursor-grabbing select-none ${
                      isDraggingThis
                        ? 'opacity-40 border-dashed border-[#ffe600] bg-[#1a1230]'
                        : isDragOverThis
                        ? 'border-[#00f0ff] bg-[#00f0ff]/15 scale-[1.02]'
                        : 'bg-[#18112a] border-[#4b3575] hover:border-[#ffe600] hover:bg-[#22163b] shadow-[3px_3px_0px_#000000]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <GripVertical className="w-4 h-4 text-[#ffe600] shrink-0" />
                      <span className="text-xs sm:text-sm font-black font-mono shrink-0 px-2 py-0.5 rounded border border-[#000000] bg-[#171126] text-[#ffe600] shadow-[1px_1px_0px_#000000]">
                        {slot.item.num || String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="text-base sm:text-lg font-black tracking-tight text-white truncate">
                        {slot.item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-bold text-[#a594c7] font-mono hidden sm:inline">
                        드래그하여 이동
                      </span>
                    </div>
                  </div>
                );
              }

              // 1. REVEALED CARD
              if (isRevealed) {
                return (
                  <div
                    key={`${currentCategoryData.id}-${slot.item.name}-${index}`}
                    draggable={isEditOrderMode}
                    onDragStart={() => isEditOrderMode && setDraggedSlotIndex(index)}
                    onDragOver={(e) => {
                      if (isEditOrderMode) {
                        e.preventDefault();
                        setDragOverSlotIndex(index);
                      }
                    }}
                    onDragLeave={() => isEditOrderMode && setDragOverSlotIndex(null)}
                    onDrop={() => {
                      if (isEditOrderMode && draggedSlotIndex !== null) {
                        handleMoveItem(draggedSlotIndex, index);
                        setDraggedSlotIndex(null);
                        setDragOverSlotIndex(null);
                      }
                    }}
                    onClick={() => handleSlotClick(index)}
                    className={`kitsch-card flex items-center justify-between p-3.5 sm:p-4 rounded-xl border-2 transition-all select-none ${
                      isEditOrderMode ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
                    } ${
                      isDraggingThis
                        ? 'opacity-40 border-dashed border-[#ffe600] bg-[#1a1230]'
                        : isDragOverThis
                        ? 'border-[#00f0ff] bg-[#00f0ff]/15 scale-[1.02]'
                        : isSurrender
                        ? 'bg-[#2a0e24] border-[#ff2a85] shadow-[4px_4px_0px_#ff2a85]/40 text-[#ff2a85]'
                        : 'bg-[#0f241d] border-[#00ff66] shadow-[4px_4px_0px_#00ff66]/40 text-[#00ff66]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isEditOrderMode ? (
                        <GripVertical className="w-4 h-4 text-[#ffe600] shrink-0 cursor-grab active:cursor-grabbing" />
                      ) : (
                        <span className={`text-xs sm:text-sm font-black font-mono px-1.5 py-0.5 rounded border border-[#000000] shadow-[1px_1px_0px_#000000] ${
                          isSurrender ? 'bg-[#ff2a85]/30 text-[#ff2a85]' : 'bg-[#00ff66]/20 text-[#00ff66]'
                        }`}>
                          {slot.item.num || String(index + 1).padStart(2, '0')}
                        </span>
                      )}
                      
                      {isEditOrderMode && (
                        <span className="text-xs font-black font-mono text-[#ffe600]">
                          [{slot.item.num || String(index + 1).padStart(2, '0')}]
                        </span>
                      )}

                      <span className="text-base sm:text-lg font-black tracking-tight text-white">
                        {slot.userAnswer || slot.item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSurrender ? (
                        <div 
                          className="w-6 h-6 rounded bg-[#ff2a85] text-white border border-[#000000] flex items-center justify-center font-black shadow-[1px_1px_0px_#000000]"
                          title="2회 오답 (정답 공개됨)"
                        >
                          <X className="w-4 h-4 stroke-[3]" />
                        </div>
                      ) : (
                        <div 
                          className="w-6 h-6 rounded bg-[#00ff66] text-[#0b0716] border border-[#000000] flex items-center justify-center font-black shadow-[1px_1px_0px_#000000]"
                          title="정답"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              // 2. ACTIVE INPUT CARD
              if (isActive) {
                const isFirstMistake = attempts === 1;

                return (
                  <div
                    key={`${currentCategoryData.id}-${slot.item.name}-${index}`}
                    draggable={isEditOrderMode}
                    onDragStart={() => isEditOrderMode && setDraggedSlotIndex(index)}
                    onDragOver={(e) => {
                      if (isEditOrderMode) {
                        e.preventDefault();
                        setDragOverSlotIndex(index);
                      }
                    }}
                    onDragLeave={() => isEditOrderMode && setDragOverSlotIndex(null)}
                    onDrop={() => {
                      if (isEditOrderMode && draggedSlotIndex !== null) {
                        handleMoveItem(draggedSlotIndex, index);
                        setDraggedSlotIndex(null);
                        setDragOverSlotIndex(null);
                      }
                    }}
                    className={`relative p-3.5 sm:p-4 rounded-xl border-3 transition-all ${
                      inputShake ? 'animate-retro-shake' : ''
                    } ${
                      inputFlashGreen 
                        ? 'border-[#00ff66] !bg-[#00ff66]/20' 
                        : isFirstMistake
                        ? 'border-[#ff7700] !bg-[#2a1b14] shadow-[5px_5px_0px_#ff7700]'
                        : hasPrevFail
                        ? 'border-[#ffe600] !bg-[#2c1532] shadow-[5px_5px_0px_#ff2a85]'
                        : 'border-[#ffe600] !bg-[#23153c] shadow-[5px_5px_0px_#ff2a85]'
                    }`}
                  >
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleSubmitActiveSlot();
                      }}
                      className="flex items-center gap-2.5"
                    >
                      <div className="flex items-center gap-2 w-full">
                        {isEditOrderMode && (
                          <GripVertical className="w-4 h-4 text-[#ffe600] shrink-0 cursor-grab active:cursor-grabbing" />
                        )}

                        <span 
                          className={`text-xs sm:text-sm font-black font-mono shrink-0 px-2 py-0.5 rounded border border-[#000000] shadow-[2px_2px_0px_#000000] ${
                            hasPrevFail ? 'bg-[#201026] text-[#e075b0]' : 'bg-[#171126]'
                          }`}
                          style={!hasPrevFail ? { color: themeColor } : undefined}
                        >
                          {slot.item.num || String(index + 1).padStart(2, '0')}
                        </span>
                        
                        <div 
                          className={`w-2 h-4 shrink-0 transition-transform ${isKeyActive ? 'scale-125 bg-[#00f0ff]' : 'bg-[#ffe600]'}`}
                        />

                        <input
                          ref={inputRef}
                          type="text"
                          value={slotInput}
                          onChange={(e) => {
                            setSlotInput(e.target.value);
                            sound.playMechanicalKey();

                            // Physical click indicator pulse
                            setIsKeyActive(true);
                            if (keyPulseTimerRef.current) clearTimeout(keyPulseTimerRef.current);
                            keyPulseTimerRef.current = setTimeout(() => {
                              setIsKeyActive(false);
                            }, 90);
                          }}
                          placeholder={
                            isFirstMistake 
                              ? "1회 오답! 다시 도전..." 
                              : `[${slot.item.num || index + 1}] 낱말 입력 후 Enter...`
                          }
                          autoComplete="off"
                          autoCorrect="off"
                          spellCheck="false"
                          className={`w-full bg-transparent text-white font-black text-base sm:text-lg focus:outline-none placeholder-[#6d5b8e] ${
                            isFirstMistake ? 'placeholder-[#ff7700]' : ''
                          }`}
                        />
                      </div>

                      <button
                        type="submit"
                        className="kitsch-btn px-3 py-2 bg-[#ffe600] text-[#0b0716] rounded-lg font-black text-xs cursor-pointer border border-[#000000] shadow-[2px_2px_0px_#000000] hover:bg-white active:translate-x-[1px] active:translate-y-[1px] shrink-0"
                      >
                        <ArrowRight className="w-4 h-4 stroke-[3]" />
                      </button>
                    </form>
                  </div>
                );
              }

              // 3. PENDING UNREVEALED CARD
              const wasAttempted = attempts > 0;
              return (
                <div
                  key={`${currentCategoryData.id}-${slot.item.name}-${index}`}
                  draggable={isEditOrderMode}
                  onDragStart={() => isEditOrderMode && setDraggedSlotIndex(index)}
                  onDragOver={(e) => {
                    if (isEditOrderMode) {
                      e.preventDefault();
                      setDragOverSlotIndex(index);
                    }
                  }}
                  onDragLeave={() => isEditOrderMode && setDragOverSlotIndex(null)}
                  onDrop={() => {
                    if (isEditOrderMode && draggedSlotIndex !== null) {
                      handleMoveItem(draggedSlotIndex, index);
                      setDraggedSlotIndex(null);
                      setDragOverSlotIndex(null);
                    }
                  }}
                  onClick={() => handleSlotClick(index)}
                  className={`kitsch-card flex items-center justify-between p-3.5 sm:p-4 rounded-xl border-2 transition-all cursor-pointer select-none ${
                    isDraggingThis
                      ? 'opacity-40 border-dashed border-[#ffe600] !bg-[#1a1230]'
                      : isDragOverThis
                      ? 'border-[#00f0ff] !bg-[#00f0ff]/15 scale-[1.02]'
                      : wasAttempted
                      ? '!bg-[#1e142a] border-[#ff7700]/60 shadow-[3px_3px_0px_#ff7700]/30 hover:border-[#ff7700]'
                      : hasPrevFail
                      ? 'prev-failed-slot shadow-[3px_3px_0px_#000000]'
                      : '!bg-[#150f24] !border-[#291c44] shadow-[3px_3px_0px_#000000] hover:!border-[#843dff] hover:!bg-[#1a1230]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {isEditOrderMode && (
                      <div className="text-[#ffe600] cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-4 h-4" />
                      </div>
                    )}
                    <span className={`text-xs sm:text-sm font-mono font-bold px-1.5 py-0.5 rounded border ${
                      wasAttempted 
                        ? 'border-[#000000] bg-[#171126] text-[#ff7700]' 
                        : hasPrevFail
                        ? 'border-[#5e2448] bg-[#1d0e22] text-[#d47fae]'
                        : 'border-[#000000] bg-[#171126] text-[#a594c7]'
                    }`}>
                      {slot.item.num || String(index + 1).padStart(2, '0')}
                    </span>
                    <span className={`text-base font-mono tracking-widest select-none font-black ${
                      hasPrevFail ? 'text-[#6e395c]' : 'text-[#4a3966]'
                    }`}>
                      . . . .
                    </span>
                  </div>

                  {wasAttempted && (
                    <span className="text-[10px] font-black text-[#ff7700] bg-[#ff7700]/20 border border-[#ff7700] px-1.5 py-0.5 rounded font-mono">
                      1차 오답
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Dynamic Notice / Error Feedback Strip */}
          {noticeMessage && (
            <div className="mt-4 p-3 bg-[#1d1430] border-2 border-[#ff2a85] rounded-xl text-center text-xs font-black text-white shadow-[3px_3px_0px_#ff2a85] animate-jelly-snap">
              {noticeMessage}
            </div>
          )}

        </main>

      </div>
    </div>
  );
}
