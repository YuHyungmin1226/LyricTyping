/**
 * LyricTyping - 노래 가사 타자 연습 애플리케이션
 * 한글 자소 분리 기반 정밀 타수(CPM) 계산, 실시간 슬라이딩 윈도우 타수 측정,
 * 노래 가사 CRUD 관리 및 연습 기록 저장/백업 시스템
 */

const STORAGE_KEYS = {
  SONGS: 'lyric_typing_songs_v1',
  RECORDS: 'lyric_typing_records_v1',
  SETTINGS: 'lyric_typing_settings_v1',
};

// 기본 제공 노래 가사 샘플
const DEFAULT_SONGS = [
  {
    id: 'song-default-1',
    title: '애국가 (1~4절)',
    artist: '대한민국 국가',
    genre: '국민가요',
    lyrics: [
      '동해 물과 백두산이 마르고 닳도록',
      '하느님이 보우하사 우리나라 만세',
      '무궁화 삼천리 화려 강산',
      '대한 사람 대한으로 길이 보전하세',
      '남산 위에 저 소나무 철갑을 두른 듯',
      '바람 서리 불변함은 우리 기상일세',
      '무궁화 삼천리 화려 강산',
      '대한 사람 대한으로 길이 보전하세',
      '가을 하늘 공활한데 높고 구름 없이',
      '밝은 달은 우리 가슴 일편단심일세',
      '무궁화 삼천리 화려 강산',
      '대한 사람 대한으로 길이 보전하세',
      '이 기상과 이 맘으로 충성을 다하여',
      '괴로우나 즐거우나 나라 사랑하세',
      '무궁화 삼천리 화려 강산',
      '대한 사람 대한으로 길이 보전하세',
    ].join('\n'),
  },
  {
    id: 'song-default-2',
    title: '고향의 봄',
    artist: '이원수 작사 / 홍난파 작곡',
    genre: '동요/가곡',
    lyrics: [
      '나의 살던 고향은 꽃피는 산골',
      '복숭아꽃 살구꽃 아기 진달래',
      '울긋불긋 꽃대궐 차리인 동네',
      '그 속에서 놀던 때가 그립습니다',
      '꽃동네 새동네 나의 옛 고향',
      '파란 들 남쪽에서 바람이 불면',
      '냇가에 수양버들 춤추는 동네',
      '그 속에서 놀던 때가 그립습니다',
    ].join('\n'),
  },
  {
    id: 'song-default-3',
    title: '봄날의 멜로디 (연습용 가사)',
    artist: 'LyricTyping Original',
    genre: '발라드',
    lyrics: [
      '창문을 열면 불어오는 따뜻한 봄바람에',
      '잊고 있었던 우리들의 노래가 들려와요',
      '수줍게 건네던 너의 작은 손길 위로',
      '하얀 벚꽃잎이 소리 없이 내려앉았지',
      '시간이 흘러 계절이 다시 바뀌어도',
      '그날의 반짝이던 순간은 사라지지 않아',
      '밤하늘 별빛 아래서 약속했던 것처럼',
      '언제까지나 이 노래를 함께 불러줄래',
    ].join('\n'),
  },
  {
    id: 'song-default-4',
    title: 'Twinkle Twinkle Little Star',
    artist: 'Traditional',
    genre: 'POP/영문',
    lyrics: [
      'Twinkle, twinkle, little star,',
      'How I wonder what you are!',
      'Up above the world so high,',
      'Like a diamond in the sky.',
      'When the blazing sun is gone,',
      'When he nothing shines upon,',
      'Then you show your little light,',
      'Twinkle, twinkle, all the night.',
    ].join('\n'),
  },
];

// ==========================================
// 1. 한글 자소(타수) 정밀 계산기
// ==========================================
// 중성(모음) 21개에 대한 타수 가중치 (복합 모음 ㅘ,ㅙ,ㅚ,ㅝ,ㅞ,ㅟ,ㅢ 등은 2타)
const JUNGSEONG_STROKES = [
  1, // ㅏ
  1, // ㅐ
  1, // ㅑ
  1, // ㅒ
  1, // ㅓ
  1, // ㅔ
  1, // ㅕ
  1, // ㅖ
  1, // ㅗ
  2, // ㅘ
  2, // ㅙ
  2, // ㅚ
  1, // ㅛ
  1, // ㅜ
  2, // ㅝ
  2, // ㅞ
  2, // ㅟ
  1, // ㅠ
  1, // ㅡ
  2, // ㅢ
  1, // ㅣ
];

// 종성(받침) 28개에 대한 타수 가중치 (없음=0, 겹받침 ㄳ,ㄵ,ㄶ,ㄺ,ㄻ,ㄼ,ㄽ,ㄾ,ㄿ,ㅀ,ㅄ = 2타)
const JONGSEONG_STROKES = [
  0, // 없음
  1, // ㄱ
  1, // ㄲ
  2, // ㄳ
  1, // ㄴ
  2, // ㄵ
  2, // ㄶ
  1, // ㄷ
  1, // ㄹ
  2, // ㄺ
  2, // ㄻ
  2, // ㄼ
  2, // ㄽ
  2, // ㄾ
  2, // ㄿ
  2, // ㅀ
  1, // ㅁ
  1, // ㅂ
  2, // ㅄ
  1, // ㅅ
  1, // ㅆ
  1, // ㅇ
  1, // ㅈ
  1, // ㅊ
  1, // ㅋ
  1, // ㅌ
  1, // ㅍ
  1, // ㅎ
];

// 호환 자모(단독 자음/모음 입력 중일 때) 겹자음/복합모음 2타 처리
const DOUBLE_JAMO_SET = new Set([
  'ㄳ', 'ㄵ', 'ㄶ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅄ',
  'ㅘ', 'ㅙ', 'ㅚ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅢ',
]);

/**
 * 한 글자의 타수를 계산합니다 (한컴타자연습 기준과 동일하게 초성+중성+종성 분리 계산)
 */
function getCharStrokes(ch) {
  if (!ch) return 0;
  const code = ch.charCodeAt(0);

  // 완성형 한글 (가 ~ 힣)
  if (code >= 0xac00 && code <= 0xd7a3) {
    const offset = code - 0xac00;
    const jung = Math.floor((offset % 588) / 28);
    const jong = offset % 28;
    return 1 + JUNGSEONG_STROKES[jung] + JONGSEONG_STROKES[jong];
  }

  // 단독 한글 자모 (ㄱ ~ ㅣ)
  if (code >= 0x3131 && code <= 0x3163) {
    return DOUBLE_JAMO_SET.has(ch) ? 2 : 1;
  }

  // 그 외 영문, 숫자, 공백, 문장부호
  return 1;
}

/**
 * 문자열 전체의 타수를 반환합니다
 */
function getStringStrokes(str) {
  if (!str) return 0;
  let total = 0;
  for (let i = 0; i < str.length; i++) {
    total += getCharStrokes(str[i]);
  }
  return total;
}

/**
 * 입력 문자열과 목표 문자열을 비교하여 유효(정타) 타수, 총 입력 타수, 오타 글자 수를 계산합니다.
 */
function evaluateLineInput(targetLine, userInput, isComposing = false) {
  let correctStrokes = 0;
  let totalInputStrokes = 0;
  let typoCount = 0;
  let correctChars = 0;

  const len = userInput.length;
  for (let i = 0; i < len; i++) {
    const uChar = userInput[i];
    const tChar = targetLine[i];
    const uStrokes = getCharStrokes(uChar);
    totalInputStrokes += uStrokes;

    if (tChar === undefined) {
      typoCount++;
    } else if (uChar === tChar) {
      correctStrokes += uStrokes;
      correctChars++;
    } else {
      // 마지막 글자가 한글 조합 중(isComposing)이면 부분 타수로 인정하고 오타로 확정하지 않음
      const isLastChar = i === len - 1;
      if (isLastChar && isComposing) {
        correctStrokes += Math.min(uStrokes, getCharStrokes(tChar));
      } else {
        typoCount++;
      }
    }
  }

  return {
    correctStrokes,
    totalInputStrokes,
    typoCount,
    correctChars,
  };
}

// ==========================================
// 2. 효과음 합성기 (Web Audio API)
// ==========================================
let audioCtx = null;
function playKeySound(isError = false) {
  if (!state.settings.soundEffect) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = isError ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(isError ? 170 : 520, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(isError ? 110 : 180, audioCtx.currentTime + 0.035);

    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.035);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.04);
  } catch (e) {
    // 오디오 컨텍스트 제한 시 무시
  }
}

// ==========================================
// 3. 애플리케이션 상태 관리
// ==========================================
const state = {
  songs: [],
  records: [],
  settings: {
    autoAdvance: true,
    soundEffect: false,
    seededPacks: [], // 이미 목록에 넣어 준 기본 제공 묶음 (지운 뒤 다시 생기지 않도록 기록)
  },
  currentSongId: null,
  searchQuery: '',

  // 현재 연습 세션 상태
  session: {
    lines: [],
    currentLineIdx: 0,
    isStarted: false,
    startTimeMs: 0,
    accumulatedActiveMs: 0,
    lineStartTimeMs: 0,
    isComposing: false,

    // 누적 확정 기록 (이전 줄들)
    completedCorrectStrokes: 0,
    completedTotalStrokes: 0,
    completedTypos: 0,
    completedChars: 0,
    completedTargetChars: 0,

    // 실시간 타수 측정용 최근 이벤트 큐 [{ time, strokes }]
    recentStrokeEvents: [],
    lastCurrentLineCorrectStrokes: 0,
    peakCpm: 0,
    timerId: null,
  },
};

// ==========================================
// 4. 로컬 스토리지 로드 및 저장
// ==========================================
function loadFromStorage() {
  try {
    const rawSongs = localStorage.getItem(STORAGE_KEYS.SONGS);
    if (rawSongs) {
      const parsed = JSON.parse(rawSongs);
      state.songs = Array.isArray(parsed) && parsed.length > 0 ? parsed : [...DEFAULT_SONGS];
    } else {
      state.songs = [...DEFAULT_SONGS];
      saveSongs();
    }

    const rawRecords = localStorage.getItem(STORAGE_KEYS.RECORDS);
    state.records = rawRecords ? JSON.parse(rawRecords) : [];

    const rawSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (rawSettings) {
      state.settings = { ...state.settings, ...JSON.parse(rawSettings) };
    }

    seedSongPack(YUN_DONGJU_PACK_ID, YUN_DONGJU_POEMS);
  } catch (e) {
    console.error('저장소 로드 오류:', e);
    state.songs = [...DEFAULT_SONGS];
  }
}

/**
 * 기본 제공 묶음(예: 윤동주 시)을 목록 끝에 한 번만 추가합니다.
 * 기존 사용자의 저장 데이터에도 들어가며, 사용자가 지운 글은 다시 생기지 않습니다.
 */
function seedSongPack(packId, packSongs) {
  if (state.settings.seededPacks.includes(packId)) return;
  const existingIds = new Set(state.songs.map((s) => s.id));
  packSongs.forEach((song) => {
    if (!existingIds.has(song.id)) state.songs.push({ ...song });
  });
  state.settings.seededPacks = [...state.settings.seededPacks, packId];
  saveSongs();
  saveSettings();
}

function saveSongs() {
  localStorage.setItem(STORAGE_KEYS.SONGS, JSON.stringify(state.songs));
}

function saveRecords() {
  localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(state.records));
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
}

// ==========================================
// 5. DOM 요소 참조
// ==========================================
const dom = {
  songList: document.getElementById('songList'),
  songCount: document.getElementById('songCount'),
  songSearchInput: document.getElementById('songSearchInput'),
  btnAddSong: document.getElementById('btnAddSong'),
  btnExportData: document.getElementById('btnExportData'),
  btnImportData: document.getElementById('btnImportData'),
  fileImportInput: document.getElementById('fileImportInput'),

  currentSongGenre: document.getElementById('currentSongGenre'),
  currentSongTitle: document.getElementById('currentSongTitle'),
  currentSongArtist: document.getElementById('currentSongArtist'),
  btnEditCurrentSong: document.getElementById('btnEditCurrentSong'),
  btnDeleteCurrentSong: document.getElementById('btnDeleteCurrentSong'),

  tabBtns: document.querySelectorAll('.tab-btn'),
  viewPractice: document.getElementById('viewPractice'),
  viewRecords: document.getElementById('viewRecords'),
  recordCountBadge: document.getElementById('recordCountBadge'),

  // 실시간 통계 표시
  statRealtimeCpm: document.getElementById('statRealtimeCpm'),
  realtimeCpmBar: document.getElementById('realtimeCpmBar'),
  statAvgCpm: document.getElementById('statAvgCpm'),
  statBestCpm: document.getElementById('statBestCpm'),
  statAccuracy: document.getElementById('statAccuracy'),
  statTypoCount: document.getElementById('statTypoCount'),
  statElapsedTime: document.getElementById('statElapsedTime'),
  statLineProgress: document.getElementById('statLineProgress'),
  statPercent: document.getElementById('statPercent'),
  overallProgressBar: document.getElementById('overallProgressBar'),

  // 연습 스테이지
  chkAutoAdvance: document.getElementById('chkAutoAdvance'),
  chkSoundEffect: document.getElementById('chkSoundEffect'),
  btnRestartPractice: document.getElementById('btnRestartPractice'),
  prevLineDisplay: document.getElementById('prevLineDisplay'),
  currentLineIndexLabel: document.getElementById('currentLineIndexLabel'),
  currentLineStrokeInfo: document.getElementById('currentLineStrokeInfo'),
  targetLineRender: document.getElementById('targetLineRender'),
  typingInput: document.getElementById('typingInput'),
  nextLineDisplay: document.getElementById('nextLineDisplay'),
  upcomingLineDisplay: document.getElementById('upcomingLineDisplay'),

  // 기록 뷰
  recordFilterSong: document.getElementById('recordFilterSong'),
  btnClearRecords: document.getElementById('btnClearRecords'),
  sumTotalPlays: document.getElementById('sumTotalPlays'),
  sumAvgCpm: document.getElementById('sumAvgCpm'),
  sumMaxCpm: document.getElementById('sumMaxCpm'),
  sumAvgAcc: document.getElementById('sumAvgAcc'),
  recordsTableBody: document.getElementById('recordsTableBody'),

  // 가사 모달
  songModal: document.getElementById('songModal'),
  songModalTitle: document.getElementById('songModalTitle'),
  btnCloseSongModal: document.getElementById('btnCloseSongModal'),
  btnCancelSongModal: document.getElementById('btnCancelSongModal'),
  songForm: document.getElementById('songForm'),
  songFormId: document.getElementById('songFormId'),
  songTitleInput: document.getElementById('songTitleInput'),
  songArtistInput: document.getElementById('songArtistInput'),
  songGenreInput: document.getElementById('songGenreInput'),
  songLyricsInput: document.getElementById('songLyricsInput'),
  btnLoadTxtFile: document.getElementById('btnLoadTxtFile'),
  txtLyricsFileInput: document.getElementById('txtLyricsFileInput'),
  previewLineCount: document.getElementById('previewLineCount'),
  previewStrokeCount: document.getElementById('previewStrokeCount'),

  // 완주 결과 모달
  resultModal: document.getElementById('resultModal'),
  btnCloseResultModal: document.getElementById('btnCloseResultModal'),
  resSongTitle: document.getElementById('resSongTitle'),
  resSongArtist: document.getElementById('resSongArtist'),
  resAvgCpm: document.getElementById('resAvgCpm'),
  resPeakCpm: document.getElementById('resPeakCpm'),
  resAccuracy: document.getElementById('resAccuracy'),
  resTimeAndStrokes: document.getElementById('resTimeAndStrokes'),
  btnResultViewRecords: document.getElementById('btnResultViewRecords'),
  btnResultRetry: document.getElementById('btnResultRetry'),
};

// ==========================================
// 6. 곡 목록 및 선택 처리
// ==========================================
function parseLyricsToLines(rawText) {
  return rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

function getCurrentSong() {
  return state.songs.find((s) => s.id === state.currentSongId) || null;
}

function getSongBestCpm(songId) {
  const songRecords = state.records.filter((r) => r.songId === songId);
  if (songRecords.length === 0) return null;
  return Math.max(...songRecords.map((r) => r.avgCpm));
}

function renderSongList() {
  const query = state.searchQuery.trim().toLowerCase();
  const filtered = state.songs.filter((song) => {
    if (!query) return true;
    return (
      song.title.toLowerCase().includes(query) ||
      (song.artist && song.artist.toLowerCase().includes(query)) ||
      (song.genre && song.genre.toLowerCase().includes(query))
    );
  });

  dom.songCount.textContent = state.songs.length;
  dom.songList.innerHTML = '';

  if (filtered.length === 0) {
    const emptyLi = document.createElement('li');
    emptyLi.style.padding = '20px';
    emptyLi.style.textAlign = 'center';
    emptyLi.style.color = 'var(--text-muted)';
    emptyLi.textContent = '검색된 노래가 없습니다.';
    dom.songList.appendChild(emptyLi);
    return;
  }

  filtered.forEach((song) => {
    const lines = parseLyricsToLines(song.lyrics);
    const bestCpm = getSongBestCpm(song.id);
    const li = document.createElement('li');
    li.className = `song-item ${song.id === state.currentSongId ? 'active' : ''}`;
    li.innerHTML = `
      <div class="song-item-top">
        <span class="song-item-title">${escapeHtml(song.title)}</span>
        <span class="song-item-genre">${escapeHtml(song.genre || '노래')}</span>
      </div>
      <div class="song-item-bottom">
        <span>${escapeHtml(song.artist || '미상')} · ${lines.length}줄</span>
        <span>${bestCpm ? `🏆 ${bestCpm}타` : '미완주'}</span>
      </div>
    `;
    li.addEventListener('click', () => {
      selectSong(song.id);
    });
    dom.songList.appendChild(li);
  });
}

function selectSong(songId) {
  const target = state.songs.find((s) => s.id === songId) || state.songs[0];
  if (!target) {
    state.currentSongId = null;
    dom.currentSongTitle.textContent = '등록된 노래 가사가 없습니다';
    dom.currentSongArtist.textContent = '좌측 [+ 새 노래 가사 추가] 버튼을 눌러 가사를 등록하세요';
    dom.currentSongGenre.textContent = '-';
    resetPracticeSession();
    renderSongList();
    return;
  }

  state.currentSongId = target.id;
  dom.currentSongTitle.textContent = target.title;
  dom.currentSongArtist.textContent = target.artist || '아티스트 미상';
  dom.currentSongGenre.textContent = target.genre || '노래';

  const best = getSongBestCpm(target.id);
  dom.statBestCpm.textContent = best ? best : '-';

  renderSongList();
  resetPracticeSession();
}

// ==========================================
// 7. 타자 연습 엔진 (실시간/평균 타수 측정)
// ==========================================
function resetPracticeSession() {
  stopSessionTimer();
  const song = getCurrentSong();
  const lines = song ? parseLyricsToLines(song.lyrics) : [];

  state.session = {
    lines,
    currentLineIdx: 0,
    isStarted: false,
    startTimeMs: 0,
    lineStartTimeMs: 0,
    isComposing: false,
    completedCorrectStrokes: 0,
    completedTotalStrokes: 0,
    completedTypos: 0,
    completedChars: 0,
    completedTargetChars: 0,
    recentStrokeEvents: [],
    lastCurrentLineCorrectStrokes: 0,
    peakCpm: 0,
    timerId: null,
  };

  dom.typingInput.value = '';
  dom.typingInput.disabled = lines.length === 0;

  renderStageLines();
  updateStatsDisplay();
  dom.typingInput.focus();
}

function startSessionIfNeeded() {
  if (state.session.isStarted) return;
  const now = performance.now();
  state.session.isStarted = true;
  state.session.startTimeMs = now;
  state.session.lineStartTimeMs = now;

  state.session.timerId = setInterval(() => {
    updateStatsDisplay();
  }, 100);
}

function stopSessionTimer() {
  if (state.session.timerId) {
    clearInterval(state.session.timerId);
    state.session.timerId = null;
  }
}

/**
 * 현재 줄, 이전 줄, 다음 줄 화면 렌더링 및 글자별 정오 하이라이트
 */
function renderStageLines() {
  const { lines, currentLineIdx, isComposing } = state.session;
  const totalLines = lines.length;

  if (totalLines === 0) {
    dom.prevLineDisplay.textContent = '-';
    dom.targetLineRender.innerHTML = '<span style="color:var(--text-muted)">가사를 추가하거나 선택해주세요.</span>';
    dom.nextLineDisplay.textContent = '-';
    dom.upcomingLineDisplay.textContent = '-';
    dom.currentLineIndexLabel.textContent = '0';
    dom.currentLineStrokeInfo.textContent = '0 / 0 타';
    return;
  }

  const prevLine = currentLineIdx > 0 ? lines[currentLineIdx - 1] : '🎵 첫 번째 줄입니다';
  const currentLine = lines[currentLineIdx] || '';
  const nextLine = currentLineIdx + 1 < totalLines ? lines[currentLineIdx + 1] : '🏁 마지막 줄입니다!';
  const upcomingLine = currentLineIdx + 2 < totalLines ? lines[currentLineIdx + 2] : '-';

  dom.prevLineDisplay.textContent = prevLine;
  dom.nextLineDisplay.textContent = nextLine;
  dom.upcomingLineDisplay.textContent = upcomingLine;
  dom.currentLineIndexLabel.textContent = `${currentLineIdx + 1} / ${totalLines}`;

  renderTargetLineCharacters(currentLine, dom.typingInput.value, isComposing);
}

/**
 * 현재 치고 있는 줄의 각 글자를 비교하여 정타/오타/현재커서 스타일로 표시
 */
function renderTargetLineCharacters(targetLine, userInput, isComposing) {
  let html = '';
  const maxLen = Math.max(targetLine.length, userInput.length);

  for (let i = 0; i < maxLen; i++) {
    const tChar = targetLine[i];
    const uChar = userInput[i];

    if (tChar === undefined) {
      // 목표 줄 길이를 초과해 입력한 글자
      html += `<span class="char-span incorrect">${escapeHtml(uChar)}</span>`;
      continue;
    }

    let cls = 'char-span pending';
    if (uChar !== undefined) {
      if (uChar === tChar) {
        cls = 'char-span correct';
      } else {
        const isLast = i === userInput.length - 1;
        cls = isLast && isComposing ? 'char-span current' : 'char-span incorrect';
      }
    } else if (i === userInput.length) {
      cls = 'char-span pending current';
    }

    const displayChar = tChar === ' ' ? '&nbsp;' : escapeHtml(tChar);
    html += `<span class="${cls}">${displayChar}</span>`;
  }

  dom.targetLineRender.innerHTML = html;

  const targetStrokes = getStringStrokes(targetLine);
  const evalRes = evaluateLineInput(targetLine, userInput, isComposing);
  dom.currentLineStrokeInfo.textContent = `${evalRes.correctStrokes} / ${targetStrokes} 타`;
}

/**
 * 실시간 분당 타수(CPM)와 전체 평균 분당 타수(CPM), 정확도를 계산하고 UI에 반영
 */
function updateStatsDisplay() {
  const {
    lines,
    currentLineIdx,
    isStarted,
    startTimeMs,
    lineStartTimeMs,
    isComposing,
    completedCorrectStrokes,
    completedTypos,
    completedChars,
    completedTargetChars,
    recentStrokeEvents,
  } = state.session;

  if (!isStarted || lines.length === 0) {
    dom.statRealtimeCpm.textContent = '0';
    dom.realtimeCpmBar.style.width = '0%';
    dom.statAvgCpm.textContent = '0';
    dom.statAccuracy.textContent = '100.0';
    dom.statTypoCount.textContent = '0';
    dom.statElapsedTime.textContent = '00:00';
    dom.statLineProgress.textContent = `0 / ${lines.length}`;
    dom.statPercent.textContent = '0';
    dom.overallProgressBar.style.width = '0%';
    return;
  }

  const now = performance.now();
  const currentLine = lines[currentLineIdx] || '';
  const userInput = dom.typingInput.value;
  const lineEval = evaluateLineInput(currentLine, userInput, isComposing);

  // 1. 전체 누적 정타 타수 & 평균 분당 타수 (CPM)
  const totalCorrectStrokes = completedCorrectStrokes + lineEval.correctStrokes;
  const elapsedMinutes = Math.max((now - startTimeMs) / 60000, 0.005); // 최소 0.3초 보정
  const avgCpm = Math.round(totalCorrectStrokes / elapsedMinutes);

  // 2. 실시간 타수 (최근 4초 슬라이딩 윈도우와 현재 줄 타수 결합)
  const windowMs = 4000;
  while (recentStrokeEvents.length > 0 && now - recentStrokeEvents[0].time > windowMs) {
    recentStrokeEvents.shift();
  }

  let realtimeCpm = 0;
  if (lineEval.correctStrokes > 0) {
    const lineElapsedMin = Math.max((now - lineStartTimeMs) / 60000, 0.006);
    const lineCpm = Math.round(lineEval.correctStrokes / lineElapsedMin);

    // 최근 4초 내 마지막 입력으로부터 2.5초 이상 멈추면 실시간 타수 자연 감쇠
    const lastEventTime = recentStrokeEvents.length > 0 ? recentStrokeEvents[recentStrokeEvents.length - 1].time : lineStartTimeMs;
    const idleTimeMs = now - lastEventTime;
    const decayFactor = idleTimeMs > 1200 ? Math.max(0, 1 - (idleTimeMs - 1200) / 2500) : 1;

    realtimeCpm = Math.round(lineCpm * decayFactor);
  }

  if (realtimeCpm > state.session.peakCpm && totalCorrectStrokes >= 6) {
    state.session.peakCpm = realtimeCpm;
  }

  // 3. 정확도 계산
  const totalTypos = completedTypos + lineEval.typoCount;
  const totalEvaluatedChars = completedChars + userInput.length;
  const accuracy =
    totalEvaluatedChars > 0
      ? Math.max(0, ((totalEvaluatedChars - totalTypos) / totalEvaluatedChars) * 100)
      : 100;

  // 4. 진행 시간 & 진도율
  const elapsedSec = Math.floor((now - startTimeMs) / 1000);
  const mm = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
  const ss = String(elapsedSec % 60).padStart(2, '0');

  const totalSongChars = lines.reduce((acc, l) => acc + l.length, 0) || 1;
  const currentDoneChars = completedTargetChars + Math.min(userInput.length, currentLine.length);
  const progressPercent = Math.min(100, Math.round((currentDoneChars / totalSongChars) * 100));

  // UI 업데이트
  dom.statRealtimeCpm.textContent = realtimeCpm.toLocaleString();
  const barPercent = Math.min(100, Math.round((realtimeCpm / 800) * 100));
  dom.realtimeCpmBar.style.width = `${barPercent}%`;

  dom.statAvgCpm.textContent = avgCpm.toLocaleString();
  dom.statAccuracy.textContent = accuracy.toFixed(1);
  dom.statTypoCount.textContent = totalTypos;
  dom.statElapsedTime.textContent = `${mm}:${ss}`;
  dom.statLineProgress.textContent = `${currentLineIdx + 1} / ${lines.length}`;
  dom.statPercent.textContent = progressPercent;
  dom.overallProgressBar.style.width = `${progressPercent}%`;
}

/**
 * 현재 줄을 완료하고 다음 줄로 이동 (마지막 줄이면 완주 처리)
 */
function advanceToNextLine() {
  const { lines, currentLineIdx } = state.session;
  if (lines.length === 0) return;

  const targetLine = lines[currentLineIdx];
  const userInput = dom.typingInput.value;

  // 아직 한 글자도 안 쳤으면 줄 넘김 방지
  if (userInput.length === 0) return;

  // 현재 줄 결과 확정 반영
  const evalRes = evaluateLineInput(targetLine, userInput, false);
  // 줄을 끝까지 안 치고 엔터를 누른 경우 미입력 글자도 오타에 합산
  const missingChars = Math.max(0, targetLine.length - userInput.length);

  state.session.completedCorrectStrokes += evalRes.correctStrokes;
  state.session.completedTotalStrokes += evalRes.totalInputStrokes;
  state.session.completedTypos += evalRes.typoCount + missingChars;
  state.session.completedChars += Math.max(userInput.length, targetLine.length);
  state.session.completedTargetChars += targetLine.length;
  state.session.lastCurrentLineCorrectStrokes = 0;

  if (currentLineIdx + 1 >= lines.length) {
    finishPracticeSession();
  } else {
    state.session.currentLineIdx++;
    state.session.lineStartTimeMs = performance.now();
    state.session.isComposing = false;
    dom.typingInput.value = '';
    renderStageLines();
    updateStatsDisplay();
  }
}

/**
 * 한 곡 완주 완료 시 기록 저장 및 결과 모달 표시
 */
function finishPracticeSession() {
  stopSessionTimer();
  const now = performance.now();
  const elapsedSec = Math.max(1, Math.round((now - state.session.startTimeMs) / 1000));
  const elapsedMin = Math.max((now - state.session.startTimeMs) / 60000, 0.005);

  const avgCpm = Math.round(state.session.completedCorrectStrokes / elapsedMin);
  const peakCpm = Math.max(avgCpm, state.session.peakCpm);
  const totalChars = state.session.completedChars || 1;
  const accuracy = Number(
    Math.max(0, ((totalChars - state.session.completedTypos) / totalChars) * 100).toFixed(1)
  );

  const song = getCurrentSong();
  const newRecord = {
    id: `rec-${Date.now()}`,
    songId: song ? song.id : 'unknown',
    songTitle: song ? song.title : '알 수 없는 곡',
    songArtist: song ? song.artist || '미상' : '-',
    avgCpm,
    peakCpm,
    accuracy,
    strokes: state.session.completedCorrectStrokes,
    elapsedSec,
    createdAt: new Date().toISOString(),
  };

  state.records.unshift(newRecord);
  saveRecords();
  updateRecordsUI();
  renderSongList();

  const best = song ? getSongBestCpm(song.id) : avgCpm;
  dom.statBestCpm.textContent = best || avgCpm;
  dom.overallProgressBar.style.width = '100%';
  dom.statPercent.textContent = '100';

  // 결과 모달 오픈
  const mm = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
  const ss = String(elapsedSec % 60).padStart(2, '0');
  dom.resSongTitle.textContent = newRecord.songTitle;
  dom.resSongArtist.textContent = newRecord.songArtist;
  dom.resAvgCpm.innerHTML = `${avgCpm.toLocaleString()} <small>타/분</small>`;
  dom.resPeakCpm.innerHTML = `${peakCpm.toLocaleString()} <small>타/분</small>`;
  dom.resAccuracy.textContent = `${accuracy}%`;
  dom.resTimeAndStrokes.textContent = `${mm}:${ss} (${newRecord.strokes.toLocaleString()}타)`;

  dom.resultModal.classList.remove('hidden');
  dom.btnResultRetry.focus();
}

// ==========================================
// 8. 타이핑 입력 이벤트 핸들러 (한글 IME 정밀 대응)
// ==========================================
function handleTypingInput() {
  const { lines, currentLineIdx, isComposing } = state.session;
  if (lines.length === 0) return;

  const userInput = dom.typingInput.value;
  if (userInput.length > 0 && !state.session.isStarted) {
    startSessionIfNeeded();
  }

  const targetLine = lines[currentLineIdx] || '';
  const evalRes = evaluateLineInput(targetLine, userInput, isComposing);

  // 정타 타수가 증가했으면 최근 타수 이벤트에 추가 + 타건음
  const deltaStrokes = evalRes.correctStrokes - state.session.lastCurrentLineCorrectStrokes;
  if (deltaStrokes > 0) {
    state.session.recentStrokeEvents.push({
      time: performance.now(),
      strokes: deltaStrokes,
    });
    playKeySound(false);
  } else if (userInput.length > 0 && evalRes.typoCount > 0) {
    playKeySound(true);
  }
  state.session.lastCurrentLineCorrectStrokes = evalRes.correctStrokes;

  renderTargetLineCharacters(targetLine, userInput, isComposing);
  updateStatsDisplay();

  // 자동 줄바꿈 옵션이 켜져 있고, 목표 줄과 정확히 일치하거나 목표 줄 길이보다 1글자 더 입력(공백 등)되었을 때
  if (state.settings.autoAdvance) {
    if (!isComposing && userInput === targetLine) {
      advanceToNextLine();
    } else if (userInput.length > targetLine.length && userInput.startsWith(targetLine)) {
      dom.typingInput.value = targetLine;
      advanceToNextLine();
    }
  }
}

// ==========================================
// 9. 노래 가사 추가 / 수정 / 삭제 (CRUD)
// ==========================================
function openSongModal(editSong = null) {
  if (editSong) {
    dom.songModalTitle.textContent = '노래 가사 수정';
    dom.songFormId.value = editSong.id;
    dom.songTitleInput.value = editSong.title;
    dom.songArtistInput.value = editSong.artist || '';
    dom.songGenreInput.value = editSong.genre || '';
    dom.songLyricsInput.value = editSong.lyrics;
  } else {
    dom.songModalTitle.textContent = '새 노래 가사 추가';
    dom.songFormId.value = '';
    dom.songTitleInput.value = '';
    dom.songArtistInput.value = '';
    dom.songGenreInput.value = '';
    dom.songLyricsInput.value = '';
  }
  updateLyricsModalPreview();
  dom.songModal.classList.remove('hidden');
  dom.songTitleInput.focus();
}

function closeSongModal() {
  dom.songModal.classList.add('hidden');
  dom.typingInput.focus();
}

function updateLyricsModalPreview() {
  const lines = parseLyricsToLines(dom.songLyricsInput.value);
  const totalStrokes = lines.reduce((sum, line) => sum + getStringStrokes(line), 0);
  dom.previewLineCount.textContent = lines.length.toLocaleString();
  dom.previewStrokeCount.textContent = totalStrokes.toLocaleString();
}

function handleSongFormSubmit(e) {
  e.preventDefault();
  const id = dom.songFormId.value.trim();
  const title = dom.songTitleInput.value.trim();
  const artist = dom.songArtistInput.value.trim() || '미상';
  const genre = dom.songGenreInput.value.trim() || '노래';
  const lines = parseLyricsToLines(dom.songLyricsInput.value);

  if (!title || lines.length === 0) {
    alert('곡 제목과 최소 1줄 이상의 가사를 입력해주세요.');
    return;
  }

  const normalizedLyrics = lines.join('\n');

  if (id) {
    // 기존 곡 수정
    const idx = state.songs.findIndex((s) => s.id === id);
    if (idx !== -1) {
      state.songs[idx] = {
        ...state.songs[idx],
        title,
        artist,
        genre,
        lyrics: normalizedLyrics,
      };
    }
    saveSongs();
    closeSongModal();
    selectSong(id);
  } else {
    // 새 곡 추가
    const newSong = {
      id: `song-${Date.now()}`,
      title,
      artist,
      genre,
      lyrics: normalizedLyrics,
    };
    state.songs.unshift(newSong);
    saveSongs();
    closeSongModal();
    selectSong(newSong.id);
  }
  updateRecordsUI();
}

function deleteCurrentSong() {
  const song = getCurrentSong();
  if (!song) return;

  const confirmed = confirm(`'${song.title}' 가사를 삭제하시겠습니까?`);
  if (!confirmed) return;

  state.songs = state.songs.filter((s) => s.id !== song.id);
  saveSongs();

  const nextSong = state.songs[0] || null;
  selectSong(nextSong ? nextSong.id : null);
  updateRecordsUI();
}

// ==========================================
// 10. 연습 기록 뷰 렌더링 및 백업/복원
// ==========================================
function updateRecordsUI() {
  dom.recordCountBadge.textContent = state.records.length;

  // 곡 필터 셀렉트 박스 갱신
  const currentFilter = dom.recordFilterSong.value || 'ALL';
  dom.recordFilterSong.innerHTML = '<option value="ALL">전체 노래 보기</option>';
  state.songs.forEach((song) => {
    const opt = document.createElement('option');
    opt.value = song.id;
    opt.textContent = `${song.title} (${song.artist || '미상'})`;
    dom.recordFilterSong.appendChild(opt);
  });
  if ([...dom.recordFilterSong.options].some((o) => o.value === currentFilter)) {
    dom.recordFilterSong.value = currentFilter;
  }

  const filterVal = dom.recordFilterSong.value;
  const filteredRecords =
    filterVal === 'ALL' ? state.records : state.records.filter((r) => r.songId === filterVal);

  // 요약 통계 계산
  const totalPlays = filteredRecords.length;
  const avgCpm =
    totalPlays > 0
      ? Math.round(filteredRecords.reduce((s, r) => s + r.avgCpm, 0) / totalPlays)
      : 0;
  const maxCpm = totalPlays > 0 ? Math.max(...filteredRecords.map((r) => r.avgCpm)) : 0;
  const avgAcc =
    totalPlays > 0
      ? (filteredRecords.reduce((s, r) => s + r.accuracy, 0) / totalPlays).toFixed(1)
      : '0.0';

  dom.sumTotalPlays.textContent = `${totalPlays}회`;
  dom.sumAvgCpm.textContent = `${avgCpm.toLocaleString()} 타/분`;
  dom.sumMaxCpm.textContent = `${maxCpm.toLocaleString()} 타/분`;
  dom.sumAvgAcc.textContent = `${avgAcc}%`;

  // 테이블 렌더링
  dom.recordsTableBody.innerHTML = '';
  if (filteredRecords.length === 0) {
    dom.recordsTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-row">저장된 연습 기록이 없습니다. 노래 가사를 끝까지 타이핑하면 자동 기록됩니다!</td>
      </tr>
    `;
    return;
  }

  filteredRecords.forEach((rec) => {
    const tr = document.createElement('tr');
    const dateObj = new Date(rec.createdAt);
    const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(
      dateObj.getDate()
    ).padStart(2, '0')} ${String(dateObj.getHours()).padStart(2, '0')}:${String(
      dateObj.getMinutes()
    ).padStart(2, '0')}`;

    const mm = String(Math.floor(rec.elapsedSec / 60)).padStart(2, '0');
    const ss = String(rec.elapsedSec % 60).padStart(2, '0');

    tr.innerHTML = `
      <td>${dateStr}</td>
      <td><strong>${escapeHtml(rec.songTitle)}</strong></td>
      <td>${escapeHtml(rec.songArtist)}</td>
      <td style="color:#60a5fa; font-weight:700">${rec.avgCpm.toLocaleString()} 타/분</td>
      <td style="color:#34d399">${rec.peakCpm.toLocaleString()} 타/분</td>
      <td>${rec.accuracy}%</td>
      <td>${mm}:${ss}</td>
      <td><button class="btn btn-danger btn-xs" data-del-rec="${rec.id}">삭제</button></td>
    `;
    dom.recordsTableBody.appendChild(tr);
  });

  dom.recordsTableBody.querySelectorAll('[data-del-rec]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const recId = btn.getAttribute('data-del-rec');
      state.records = state.records.filter((r) => r.id !== recId);
      saveRecords();
      updateRecordsUI();
      renderSongList();
    });
  });
}

/**
 * 전체 가사 및 연습 기록을 JSON 파일로 내보내기
 */
function exportAllData() {
  const payload = {
    app: 'LyricTyping',
    exportedAt: new Date().toISOString(),
    songs: state.songs,
    records: state.records,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateTag = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `LyricTyping_Backup_${dateTag}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * JSON 백업 파일 또는 일반 TXT 가사 파일 불러오기
 */
function handleImportFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target.result;
    if (file.name.toLowerCase().endsWith('.json')) {
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed.songs)) {
          state.songs = parsed.songs;
          saveSongs();
        }
        if (Array.isArray(parsed.records)) {
          state.records = parsed.records;
          saveRecords();
        }
        selectSong(state.songs[0]?.id);
        updateRecordsUI();
        alert('가사 및 연습 기록 데이터를 성공적으로 불러왔습니다.');
      } catch (err) {
        alert('올바른 JSON 백업 파일이 아닙니다.');
      }
    } else {
      // .txt 파일인 경우 해당 파일 이름으로 새 노래 가사 바로 등록
      const titleFromFile = file.name.replace(/\.[^/.]+$/, '');
      const lines = parseLyricsToLines(content);
      if (lines.length === 0) {
        alert('텍스트 파일에 유효한 가사 내용이 없습니다.');
        return;
      }
      const newSong = {
        id: `song-${Date.now()}`,
        title: titleFromFile,
        artist: 'TXT 불러오기',
        genre: '사용자 가사',
        lyrics: lines.join('\n'),
      };
      state.songs.unshift(newSong);
      saveSongs();
      selectSong(newSong.id);
      updateRecordsUI();
    }
  };
  reader.readAsText(file, 'utf-8');
}

// ==========================================
// 11. 유틸리티 & 초기화 바인딩
// ==========================================
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function switchTab(viewName) {
  dom.tabBtns.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === viewName);
  });
  dom.viewPractice.classList.toggle('active', viewName === 'practice');
  dom.viewRecords.classList.toggle('active', viewName === 'records');

  if (viewName === 'practice') {
    dom.typingInput.focus();
  } else {
    updateRecordsUI();
  }
}

function initApp() {
  loadFromStorage();

  // 설정 체크박스 초기화
  dom.chkAutoAdvance.checked = state.settings.autoAdvance;
  dom.chkSoundEffect.checked = state.settings.soundEffect;

  dom.chkAutoAdvance.addEventListener('change', () => {
    state.settings.autoAdvance = dom.chkAutoAdvance.checked;
    saveSettings();
    dom.typingInput.focus();
  });

  dom.chkSoundEffect.addEventListener('change', () => {
    state.settings.soundEffect = dom.chkSoundEffect.checked;
    saveSettings();
    dom.typingInput.focus();
  });

  // 검색 이벤트
  dom.songSearchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value;
    renderSongList();
  });

  // 탭 전환
  dom.tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.view));
  });

  // 타이핑 입력 이벤트 (IME 조합 상태 추적)
  dom.typingInput.addEventListener('compositionstart', () => {
    state.session.isComposing = true;
  });

  dom.typingInput.addEventListener('compositionend', () => {
    state.session.isComposing = false;
    handleTypingInput();
  });

  dom.typingInput.addEventListener('input', () => {
    handleTypingInput();
  });

  dom.typingInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      advanceToNextLine();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      resetPracticeSession();
    } else if (e.key === ' ' && state.settings.autoAdvance) {
      // 현재 줄의 글자 수를 이미 모두 채운 상태에서 스페이스를 누르면 다음 줄로 이동
      const currentLine = state.session.lines[state.session.currentLineIdx] || '';
      if (dom.typingInput.value.length >= currentLine.length && currentLine.length > 0) {
        e.preventDefault();
        advanceToNextLine();
      }
    }
  });

  // 붙여넣기 방지 (정확한 타수 측정 보호)
  dom.typingInput.addEventListener('paste', (e) => {
    e.preventDefault();
  });

  dom.btnRestartPractice.addEventListener('click', () => {
    resetPracticeSession();
  });

  // 노래 추가/수정/삭제 버튼
  dom.btnAddSong.addEventListener('click', () => openSongModal(null));
  dom.btnEditCurrentSong.addEventListener('click', () => {
    const song = getCurrentSong();
    if (song) openSongModal(song);
  });
  dom.btnDeleteCurrentSong.addEventListener('click', deleteCurrentSong);

  dom.btnCloseSongModal.addEventListener('click', closeSongModal);
  dom.btnCancelSongModal.addEventListener('click', closeSongModal);
  dom.songLyricsInput.addEventListener('input', updateLyricsModalPreview);
  dom.songForm.addEventListener('submit', handleSongFormSubmit);

  // 모달 내 .txt 가사 파일 읽기
  dom.btnLoadTxtFile.addEventListener('click', () => dom.txtLyricsFileInput.click());
  dom.txtLyricsFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      dom.songLyricsInput.value = ev.target.result;
      if (!dom.songTitleInput.value.trim()) {
        dom.songTitleInput.value = file.name.replace(/\.[^/.]+$/, '');
      }
      updateLyricsModalPreview();
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  });

  // 데이터 내보내기 / 불러오기
  dom.btnExportData.addEventListener('click', exportAllData);
  dom.btnImportData.addEventListener('click', () => dom.fileImportInput.click());
  dom.fileImportInput.addEventListener('change', (e) => {
    handleImportFile(e.target.files[0]);
    e.target.value = '';
  });

  // 기록 필터 및 전체 초기화
  dom.recordFilterSong.addEventListener('change', updateRecordsUI);
  dom.btnClearRecords.addEventListener('click', () => {
    if (state.records.length === 0) return;
    if (confirm('모든 타자 연습 기록을 초기화하시겠습니까? (노래 가사는 유지됩니다)')) {
      state.records = [];
      saveRecords();
      updateRecordsUI();
      renderSongList();
    }
  });

  // 완주 결과 모달 이벤트
  dom.btnCloseResultModal.addEventListener('click', () => {
    dom.resultModal.classList.add('hidden');
    resetPracticeSession();
  });
  dom.btnResultRetry.addEventListener('click', () => {
    dom.resultModal.classList.add('hidden');
    resetPracticeSession();
  });
  dom.btnResultViewRecords.addEventListener('click', () => {
    dom.resultModal.classList.add('hidden');
    resetPracticeSession();
    switchTab('records');
  });

  // 첫 번째 노래 자동 선택 및 렌더링
  selectSong(state.songs[0]?.id || null);
  updateRecordsUI();
}

window.addEventListener('DOMContentLoaded', initApp);
