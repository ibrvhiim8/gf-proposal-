/**
 * Main application — screen flow, questionnaire, interactions
 */
(function () {
  'use strict';

  // ============================================================
  // QUESTIONNAIRE — emotional arc + silent compatibility (never shown)
  // Scoring: positive = 2, neutral = 1, negative = 0 · pass threshold = 60%
  // ============================================================
  const COMPATIBILITY_THRESHOLD = 60;

  const QUESTIONS = [
    {
      text: 'Would you agree we make a dangerously good duo?',
      tone: 'playful',
      answers: [
        { text: 'Honestly, yes', score: 2 },
        { text: 'Maybe a little', score: 1 },
        { text: 'Not really', score: 0 },
      ],
    },
    {
      text: 'Should we admit our chemistry is becoming suspicious?',
      tone: 'playful',
      answers: [
        { text: "It's becoming obvious", score: 2 },
        { text: 'Maybe a bit', score: 1 },
        { text: "I don't think so", score: 0 },
      ],
    },
    {
      text: "Isn't it weird how some people become important unexpectedly?",
      tone: 'personal',
      answers: [
        { text: 'Very weird', score: 2 },
        { text: 'Sometimes', score: 1 },
        { text: 'Not necessarily', score: 0 },
      ],
    },
    {
      text: 'Can distance make certain connections feel even more meaningful?',
      tone: 'reflective',
      answers: [
        { text: 'Definitely', score: 2 },
        { text: 'It depends', score: 1 },
        { text: 'Not really', score: 0 },
      ],
    },
    {
      text: "Can something meaningful still be worth it even if it's scary?",
      tone: 'emotional',
      answers: [
        { text: 'Yes', score: 2 },
        { text: 'Sometimes', score: 1 },
        { text: 'Probably not', score: 0 },
      ],
    },
    {
      text: 'Do you think fear sometimes stops people from something beautiful?',
      tone: 'mature',
      answers: [
        { text: 'More often than we think', score: 2 },
        { text: 'Maybe', score: 1 },
        { text: "I don't think so", score: 0 },
      ],
    },
    {
      text: 'Do you think connection matters more than timing or circumstances?',
      tone: 'deep',
      answers: [
        { text: 'Real connection does', score: 2 },
        { text: 'It depends', score: 1 },
        { text: 'Timing matters more', score: 0 },
      ],
    },
    {
      text: 'Can two people still be right for each other even if life looks complicated?',
      tone: 'comforting',
      answers: [
        { text: 'Yes', score: 2 },
        { text: 'Possibly', score: 1 },
        { text: 'Probably not', score: 0 },
      ],
    },
    {
      text: 'Can connection exist before people officially define it?',
      tone: 'intimate',
      answers: [
        { text: 'Definitely', score: 2 },
        { text: 'Maybe', score: 1 },
        { text: "I don't think so", score: 0 },
      ],
    },
  ];

  const NO_BUTTON_TEXTS = [
    'No',
    'be serious',
    'wrong answer',
    'try again',
    'you know you want to',
    'nice try',
    'think again',
  ];

  // ---- DOM refs ----
  const screens = document.querySelectorAll('.screen');
  const introLines = document.querySelectorAll('.intro-line');
  const introStart = document.getElementById('intro-start');
  const questionCard = document.getElementById('question-card');
  const questionNumber = document.getElementById('question-number');
  const questionText = document.getElementById('question-text');
  const answerOptions = document.getElementById('answer-options');
  const progressFill = document.getElementById('progress-fill');
  const progressLabel = document.getElementById('progress-label');
  const questionnaireContent = document.querySelector('.questionnaire-content');
  const questionnaireTransition = document.getElementById('questionnaire-transition');
  const transitionContinue = document.getElementById('transition-continue');
  const applicationContinue = document.getElementById('application-continue');
  const applicationForm = document.getElementById('application-form');
  const applicationHint = document.getElementById('application-hint');
  const favoritePartner = document.getElementById('favorite-partner');
  const fieldFavoritePartner = document.getElementById('field-favorite-partner');
  const confessionLines = document.querySelectorAll('.confession-line');
  const confessionButtons = document.getElementById('confession-buttons');
  const btnYes = document.getElementById('btn-yes');
  const btnNo = document.getElementById('btn-no');
  const endingText = document.getElementById('ending-text');
  const endingPhoto = document.getElementById('ending-photo');
  const bgMusic = document.getElementById('bg-music');
  const audioControls = document.getElementById('audio-controls');
  const audioToggle = document.getElementById('audio-toggle');
  const ambientGlow = document.getElementById('ambient-glow');
  const heartbeatPulse = document.getElementById('heartbeat-pulse');
  const softEndingLines = document.querySelectorAll('.soft-ending-line');

  let currentQuestion = 0;
  let questionnaireAnswers = {};
  let audioStarted = false;
  let noClickAttempts = 0;
  let noTextIndex = 0;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const delay = (ms) => new Promise((r) => setTimeout(r, prefersReducedMotion ? ms * 0.2 : ms));

  // ---- Screen navigation ----
  function goToScreen(screenId) {
    const target = document.getElementById(screenId);
    if (!target) return;

    const current = document.querySelector('.screen--active');
    if (current && current !== target) {
      current.classList.add('screen--exit');
      current.classList.remove('screen--active');

      setTimeout(() => {
        current.classList.remove('screen--exit');
      }, 900);
    }

    setTimeout(() => {
      target.classList.add('screen--active');
    }, current && current !== target ? 400 : 0);
  }

  // ---- Audio ----
  // Replace with your track: add <source src="assets/music/your-song.mp3"> in index.html
  function initAudio() {
    if (audioStarted) return;
    audioStarted = true;
    audioControls.hidden = false;

    if (bgMusic.querySelector('source')) {
      bgMusic.volume = 0.35;
      bgMusic.play().catch(() => {});
      return;
    }

    // Fallback: subtle ambient pad until you add a real music file
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc1.type = 'sine';
      osc1.frequency.value = 196;
      osc2.type = 'sine';
      osc2.frequency.value = 293.66;
      filter.type = 'lowpass';
      filter.frequency.value = 320;
      gain.gain.value = 0;

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc1.start();
      osc2.start();

      gain.gain.linearRampToValueAtTime(0.025, ctx.currentTime + 2);

      window._ambientOsc = { ctx, gain };
    } catch (_) {
      /* silent fallback */
    }
  }

  function toggleAudio() {
    if (bgMusic.querySelector('source')) {
      if (bgMusic.paused) {
        bgMusic.play();
        audioToggle.classList.remove('muted');
      } else {
        bgMusic.pause();
        audioToggle.classList.add('muted');
      }
    } else if (window._ambientOsc) {
      const { gain } = window._ambientOsc;
      const muted = audioToggle.classList.toggle('muted');
      gain.gain.value = muted ? 0 : 0.03;
    }
  }

  // ---- Intro sequence ----
  async function runIntroSequence() {
    for (let i = 0; i < introLines.length; i++) {
      await delay(i === 0 ? 600 : 1800);
      introLines[i].classList.add('visible');
    }

    await delay(1200);
    introStart.hidden = false;
    introStart.classList.add('visible');
  }

  // ---- Questionnaire ----
  function setQuestionnaireTone(tone) {
    questionCard.dataset.tone = tone;
    questionCard.className = 'question-card glass';
    questionCard.classList.add(`tone-${tone}`);
  }

  function saveQuestionAnswer(index, answerText, score) {
    questionnaireAnswers[index] = {
      question: QUESTIONS[index].text,
      answer: answerText,
      score,
      tone: QUESTIONS[index].tone,
    };
    if (window.ProposalStorage) {
      window.ProposalStorage.save({ questionnaireAnswers: { ...questionnaireAnswers } });
    }
  }

  /** Silent compatibility — never displayed to the user */
  function getCompatibilityResult() {
    const maxScore = QUESTIONS.length * 2;
    const totalScore = Object.values(questionnaireAnswers).reduce(
      (sum, entry) => sum + (entry.score ?? 0),
      0
    );
    const percent = Math.round((totalScore / maxScore) * 100);
    return {
      totalScore,
      maxScore,
      percent,
      passed: percent >= COMPATIBILITY_THRESHOLD,
    };
  }

  function persistCompatibilityResult() {
    const result = getCompatibilityResult();
    if (window.ProposalStorage) {
      window.ProposalStorage.save({
        compatibilityScore: result.totalScore,
        compatibilityPercent: result.percent,
        compatibilityPassed: result.passed,
      });
    }
    return result;
  }

  function renderQuestion(index) {
    const q = QUESTIONS[index];
    setQuestionnaireTone(q.tone);

    questionNumber.textContent = String(index + 1).padStart(2, '0');
    questionText.textContent = q.text;

    if (progressLabel) {
      progressLabel.textContent = `${String(index + 1).padStart(2, '0')} / ${String(QUESTIONS.length).padStart(2, '0')}`;
    }

    answerOptions.innerHTML = '';
    q.answers.forEach((answer, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'answer-btn';
      btn.textContent = answer.text;
      btn.dataset.score = String(answer.score);
      btn.style.animationDelay = `${i * 0.09}s`;
      btn.addEventListener('click', () => selectAnswer(btn, index, answer));
      answerOptions.appendChild(btn);
      requestAnimationFrame(() => btn.classList.add('answer-btn--visible'));
    });

    progressFill.style.width = `${((index + 1) / QUESTIONS.length) * 100}%`;

    // Subtle particle warmth as emotional depth increases
    if (window.Particles && index >= 4) {
      window.Particles.setIntensity(1 + index * 0.08);
    }

    questionCard.classList.remove('transitioning');
    questionCard.classList.add('question-card--enter');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => questionCard.classList.remove('question-card--enter'));
    });
  }

  async function selectAnswer(btn, questionIndex, answer) {
    btn.classList.add('selected');
    saveQuestionAnswer(questionIndex, answer.text, answer.score);
    await delay(prefersReducedMotion ? 120 : 480);

    questionCard.classList.add('transitioning');
    await delay(prefersReducedMotion ? 80 : 420);

    currentQuestion++;

    if (currentQuestion < QUESTIONS.length) {
      renderQuestion(currentQuestion);
    } else {
      const compatibility = persistCompatibilityResult();

      if (questionnaireContent) questionnaireContent.classList.add('questionnaire-content--fade');
      await delay(400);

      if (compatibility.passed) {
        if (window.Particles) window.Particles.setIntensity(1.6);
        await runQuestionnaireTransition();
      } else {
        if (window.Particles) window.Particles.setIntensity(1.1);
        await runSoftEnding();
      }
    }
  }

  /** Warm alternate ending — respectful, no confession */
  async function runSoftEnding() {
    questionnaireTransition.hidden = true;
    if (questionnaireContent) questionnaireContent.classList.remove('questionnaire-content--fade');

    goToScreen('soft-ending');

    softEndingLines.forEach((line) => line.classList.remove('visible'));

    for (let i = 0; i < softEndingLines.length; i++) {
      const pause = i === 0 ? 700 : i === softEndingLines.length - 1 ? 2600 : 2200;
      await delay(pause);
      softEndingLines[i].classList.add('visible');
    }
  }

  async function runQuestionnaireTransition() {
    questionnaireTransition.hidden = false;
    questionnaireTransition.classList.add('transition-overlay--reveal');
    const lines = questionnaireTransition.querySelectorAll('.transition-line');
    transitionContinue.hidden = true;
    transitionContinue.classList.remove('visible');

    for (let i = 0; i < lines.length; i++) {
      await delay(i === 0 ? 600 : i === lines.length - 1 ? 3200 : 2800);
      lines[i].classList.add('visible');
    }

    await delay(800);
    transitionContinue.hidden = false;
    requestAnimationFrame(() => transitionContinue.classList.add('visible'));

    await new Promise((resolve) => {
      transitionContinue.addEventListener('click', resolve, { once: true });
    });

    questionnaireTransition.classList.remove('transition-overlay--reveal');
    questionnaireTransition.hidden = true;
    transitionContinue.hidden = true;
    transitionContinue.classList.remove('visible');
    lines.forEach((l) => l.classList.remove('visible'));
    if (questionnaireContent) questionnaireContent.classList.remove('questionnaire-content--fade');
    goToScreen('application');
  }

  function startQuestionnaire() {
    currentQuestion = 0;
    questionnaireAnswers = {};
    if (window.Particles) window.Particles.setIntensity(1);
    renderQuestion(0);
    goToScreen('questionnaire');
  }

  // Required toggles & acknowledgement for Terms & Conditions
  const APPLICATION_REQUIRED_IDS = [
    'random-affection',
    'excessive-compliments',
    'future-memories',
    'dramatic-behavior',
    'already-obsessed',
  ];

  function getApplicationData() {
    return {
      favoritePartner: favoritePartner.value.trim(),
      randomAffection: document.getElementById('random-affection').checked,
      excessiveCompliments: document.getElementById('excessive-compliments').checked,
      futureMemories: document.getElementById('future-memories').checked,
      dramaticBehavior: document.getElementById('dramatic-behavior').checked,
      alreadyObsessed: document.getElementById('already-obsessed').checked,
    };
  }

  /** Strict validation — every box must be ON (none pre-checked anymore) */
  function validateApplication() {
    const name = favoritePartner.value.trim();
    if (!name) {
      return { valid: false, reason: 'name' };
    }

    for (const id of APPLICATION_REQUIRED_IDS) {
      const el = document.getElementById(id);
      if (!el || !el.checked) {
        return { valid: false, reason: id };
      }
    }

    return { valid: true };
  }

  function isApplicationComplete() {
    return validateApplication().valid;
  }

  function persistApplicationData(extra = {}) {
    if (!window.ProposalStorage) return;
    window.ProposalStorage.save({
      ...getApplicationData(),
      ...extra,
    });
  }

  function highlightIncompleteFields() {
    const validation = validateApplication();
    fieldFavoritePartner.classList.toggle('form-field--incomplete', !favoritePartner.value.trim());

    APPLICATION_REQUIRED_IDS.forEach((id) => {
      const input = document.getElementById(id);
      const field = input.closest('.form-field');
      if (field) field.classList.toggle('form-field--incomplete', !input.checked);
    });

    return validation;
  }

  function updateApplicationContinue() {
    const complete = isApplicationComplete();
    applicationContinue.setAttribute('aria-disabled', complete ? 'false' : 'true');
    applicationContinue.classList.toggle('btn--disabled', !complete);
    applicationHint.classList.toggle('visible', !complete);

    if (complete) {
      fieldFavoritePartner.classList.remove('form-field--incomplete');
      APPLICATION_REQUIRED_IDS.forEach((id) => {
        const field = document.getElementById(id).closest('.form-field');
        if (field) field.classList.remove('form-field--incomplete');
      });
      persistApplicationData();
    }
  }

  // ---- Application form ----
  function initApplicationForm() {
    APPLICATION_REQUIRED_IDS.forEach((id) => {
      const el = document.getElementById(id);
      el.addEventListener('change', updateApplicationContinue);
    });

    favoritePartner.addEventListener('input', updateApplicationContinue);

    applicationContinue.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const validation = validateApplication();
      if (!validation.valid) {
        highlightIncompleteFields();
        applicationForm.classList.add('shake');
        applicationHint.textContent = 'Please enter your name and tick every box to continue';
        applicationHint.classList.add('visible');
        setTimeout(() => applicationForm.classList.remove('shake'), 500);
        return;
      }

      persistApplicationData({ termsAccepted: true, termsAcceptedAt: new Date().toISOString() });

      applicationContinue.classList.add('bounce');
      await delay(500);
      applicationContinue.classList.remove('bounce');
      goToScreen('confession');
      runConfessionSequence();
    });

    // Playful toggle bounce
    document.querySelectorAll('.toggle input').forEach((input) => {
      input.addEventListener('change', () => {
        input.closest('.toggle').style.transform = 'scale(1.08)';
        setTimeout(() => {
          input.closest('.toggle').style.transform = '';
        }, 200);
      });
    });

    updateApplicationContinue();
  }

  // ---- Confession ----
  async function runConfessionSequence() {
    heartbeatPulse.classList.add('active');

    for (let i = 0; i < confessionLines.length; i++) {
      await delay(i === 0 ? 800 : 2200);
      confessionLines[i].classList.add('visible');
    }

    await delay(1400);
    confessionButtons.hidden = false;
    confessionButtons.classList.add('visible');
    initNoButton();
  }

  // ---- Playful "No" button ----
  function initNoButton() {
    const container = confessionButtons;
    const maxAttempts = 6;

    function moveNoButton() {
      if (noClickAttempts >= maxAttempts) {
        btnNo.textContent = '...fine, yes then ❤️';
        btnNo.className = 'btn btn--yes';
        btnNo.onclick = () => triggerYes();
        return;
      }

      const rect = container.getBoundingClientRect();
      const btnRect = btnNo.getBoundingClientRect();
      const padding = 16;

      const maxX = rect.width - btnRect.width - padding;
      const maxY = 60;

      const newX = Math.random() * Math.max(maxX, 40) - maxX / 2;
      const newY = (Math.random() - 0.5) * maxY;

      btnNo.style.transform = `translate(${newX}px, ${newY}px) rotate(${(Math.random() - 0.5) * 12}deg)`;

      noTextIndex = (noTextIndex + 1) % NO_BUTTON_TEXTS.length;
      btnNo.textContent = NO_BUTTON_TEXTS[noTextIndex];
      noClickAttempts++;
    }

    btnNo.addEventListener('mouseenter', moveNoButton);
    btnNo.addEventListener('touchstart', (e) => {
      e.preventDefault();
      moveNoButton();
    }, { passive: false });

    btnNo.addEventListener('click', (e) => {
      e.preventDefault();
      moveNoButton();
    });
  }

  // ---- YES ending ----
  function triggerYes() {
    persistApplicationData({
      saidYes: true,
      saidYesAt: new Date().toISOString(),
      termsAccepted: true,
    });

    goToScreen('ending');

    if (window.Particles) window.Particles.boost();
    if (window.HeartParticles) window.HeartParticles.start();

    // Slightly brighten ambient audio
    if (window._ambientOsc) {
      window._ambientOsc.gain.gain.value = 0.05;
    }
    if (bgMusic && !bgMusic.paused) {
      bgMusic.volume = 0.5;
    }

    setTimeout(() => {
      endingText.classList.add('visible');
    }, 600);

    setTimeout(() => {
      if (endingPhoto) endingPhoto.classList.add('visible');
    }, 2000);
  }

  // ---- Ambient cursor glow (desktop) ----
  function initAmbientGlow() {
    if ('ontouchstart' in window) return;

    ambientGlow.classList.add('visible');
    document.addEventListener('mousemove', (e) => {
      ambientGlow.style.left = `${e.clientX}px`;
      ambientGlow.style.top = `${e.clientY}px`;
    });
  }

  // ---- Easter egg: triple-tap title area on intro ----
  function initEasterEgg() {
    let taps = 0;
    let tapTimer = null;

    document.getElementById('intro').addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      taps++;
      clearTimeout(tapTimer);
      tapTimer = setTimeout(() => {
        taps = 0;
      }, 600);

      if (taps === 5) {
        document.body.style.setProperty('--gold', '#e8c4a0');
        taps = 0;
      }
    });
  }

  // ---- Event bindings ----
  introStart.addEventListener('click', () => {
    initAudio();
    startQuestionnaire();
  });

  btnYes.addEventListener('click', triggerYes);
  audioToggle.addEventListener('click', toggleAudio);

  // ---- Init ----
  initApplicationForm();
  initAmbientGlow();
  initEasterEgg();
  initAdminLink();
  runIntroSequence();

  function initAdminLink() {
    const link = document.getElementById('admin-responses-link');
    if (!link) return;
    if (new URLSearchParams(window.location.search).has('admin')) {
      link.hidden = false;
    }
  }
})();
