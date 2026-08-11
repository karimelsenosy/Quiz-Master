import { playSound } from './sound-effects.js';
export default class Question {
  constructor(quiz, container, onQuizEnd) {
    this.quiz = quiz;
    this.container = container;
    this.onQuizEnd = onQuizEnd;
    this.questionData = quiz.getCurrentQuestion();
    this.index = quiz.currentQuestionIndex;

    this.question = this.decodeHtml(this.questionData.question);
    this.correctAnswer = this.decodeHtml(this.questionData.correct_answer);
    this.category = this.decodeHtml(this.questionData.category);
    this.wrongAnswers = this.questionData.incorrect_answers.map((a) =>
      this.decodeHtml(a)
    );

    this.allAnswers = this.shuffleAnswers();
    this.answered = false;
    this.timerInterval = null;
    this.timeRemaining = 15; 
    this._handleKeydown = this._handleKeydown.bind(this);
    this.displayQuestion();
  }

  decodeHtml(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.documentElement.textContent;
  }

  shuffleAnswers() {
    const answers = [...this.wrongAnswers, this.correctAnswer];

    for (let i = answers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [answers[i], answers[j]] = [answers[j], answers[i]];
    }

    return answers;
  }

  getProgress() {
    return Math.round(((this.index + 1) / this.quiz.numberOfQuestions) * 100);
  }

  displayQuestion() {
    const difficultyIcons = {
      easy: 'fa-face-smile',
      medium: 'fa-face-meh',
      hard: 'fa-skull',
    };
    const difficultyIcon = difficultyIcons[this.quiz.difficulty] || 'fa-face-smile';

    const answersHtml = this.allAnswers
      .map(
        (answer, idx) => `
        <button class="answer-btn" data-answer="${answer}">
          <span class="answer-key">${idx + 1}</span>
          <span class="answer-text">${answer}</span>
        </button>
      `
      )
      .join('');

    this.container.innerHTML = `
      <div class="game-card question-card">
        <div class="xp-bar-container">
          <div class="xp-bar-header">
            <span class="xp-label"><i class="fa-solid fa-bolt"></i> Progress</span>
            <span class="xp-value">Question ${this.index + 1}/${this.quiz.numberOfQuestions}</span>
          </div>
          <div class="xp-bar">
            <div class="xp-bar-fill" style="width: ${this.getProgress()}%"></div>
          </div>
        </div>

        <div class="stats-row">
          <div class="stat-badge category">
            <i class="fa-solid fa-bookmark"></i>
            <span>${this.category}</span>
          </div>
          <div class="stat-badge difficulty ${this.quiz.difficulty}">
            <i class="fa-solid ${difficultyIcon}"></i>
            <span>${this.quiz.difficulty}</span>
          </div>
          <div class="stat-badge timer">
            <i class="fa-solid fa-stopwatch"></i>
            <span class="timer-value">${this.timeRemaining}</span>s
          </div>
          <div class="stat-badge counter">
            <i class="fa-solid fa-gamepad"></i>
            <span>${this.index + 1}/${this.quiz.numberOfQuestions}</span>
          </div>
        </div>

        <h2 class="question-text">${this.question}</h2>

        <div class="answers-grid">
          ${answersHtml}
        </div>

        <p class="keyboard-hint">
          <i class="fa-regular fa-keyboard"></i> Press 1-${this.allAnswers.length} to select
        </p>

        <div class="score-panel">
          <div class="score-item">
            <div class="score-item-label">Score</div>
            <div class="score-item-value">${this.quiz.score}</div>
          </div>
        </div>
      </div>
    `;

    this.addEventListeners();
    this.startTimer();
  }

  addEventListeners() {
    const buttons = this.container.querySelectorAll('.answer-btn');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => this.checkAnswer(btn));
    });

    document.addEventListener('keydown', this._handleKeydown);
  }

  _handleKeydown(e) {
    const validKeys = ['1', '2', '3', '4'];
    if (!validKeys.includes(e.key)) return;

    const buttons = this.container.querySelectorAll('.answer-btn');
    const targetIndex = Number(e.key) - 1;

    if (buttons[targetIndex]) {
      this.checkAnswer(buttons[targetIndex]);
    }
  }

  removeEventListeners() {
    document.removeEventListener('keydown', this._handleKeydown);
  }

  startTimer() {
    const timerValueEl = this.container.querySelector('.timer-value');
    const timerBadgeEl = this.container.querySelector('.stat-badge.timer');

    this.timerInterval = setInterval(() => {
      this.timeRemaining--;

      if (timerValueEl) timerValueEl.textContent = this.timeRemaining;

      if (this.timeRemaining <= 5 && timerBadgeEl) {
        timerBadgeEl.classList.add('warning');
      }

      if (this.timeRemaining <= 5 && this.timeRemaining > 0) {
        playSound('tick');
      }

      if (this.timeRemaining <= 0) {
        this.stopTimer();
        this.handleTimeUp();
      }
    }, 1000);
  }

  stopTimer() {
    clearInterval(this.timerInterval);
  }

  handleTimeUp() {
    this.answered = true;
    this.removeEventListeners();

    const buttons = this.container.querySelectorAll('.answer-btn');
    buttons.forEach((btn) => {
      if (btn.dataset.answer === this.correctAnswer) {
        btn.classList.add('correct');
      }
      btn.classList.add('disabled');
    });

    const card = this.container.querySelector('.question-card');
    if (card) {
      const timeUpMsg = document.createElement('div');
      timeUpMsg.className = 'time-up-message';
      timeUpMsg.innerHTML = '<i class="fa-solid fa-clock"></i> TIME\'S UP!';
      card.appendChild(timeUpMsg);
    }

    playSound('wrong');
    this.animateQuestion(1000);
  }

  checkAnswer(choiceElement) {
    if (this.answered) return;

    this.answered = true;
    this.stopTimer();
    this.removeEventListeners();
    const selectedAnswer = choiceElement.dataset.answer;
    const isCorrect =
      selectedAnswer.toLowerCase() === this.correctAnswer.toLowerCase();

    if (isCorrect) {
      choiceElement.classList.add('correct');
      this.quiz.incrementScore();
      playSound('correct');
    } else {
      choiceElement.classList.add('wrong');
      this.highlightCorrectAnswer();
      playSound('wrong');
    }

    const buttons = this.container.querySelectorAll('.answer-btn');
    buttons.forEach((btn) => {
      if (btn !== choiceElement) {
        btn.classList.add('disabled');
      }
    });

    this.animateQuestion(1000);
  }

  highlightCorrectAnswer() {
    const buttons = this.container.querySelectorAll('.answer-btn');
    buttons.forEach((btn) => {
      if (btn.dataset.answer === this.correctAnswer) {
        btn.classList.add('correct-reveal');
      }
    });
  }

  getNextQuestion() {
    const hasMoreQuestions = this.quiz.nextQuestion();

    if (hasMoreQuestions) {
      new Question(this.quiz, this.container, this.onQuizEnd);
    } else {
      this.container.innerHTML = this.quiz.endQuiz();

      const restartBtn = this.container.querySelector('.btn-restart');
      if (restartBtn) {
        restartBtn.addEventListener('click', () => {
          if (typeof this.onQuizEnd === 'function') {
            this.onQuizEnd();
          }
        });
      }
    }
  }

  animateQuestion(duration) {
    setTimeout(() => {
      const card = this.container.querySelector('.question-card');
      if (card) card.classList.add('exit');

      setTimeout(() => {
        this.getNextQuestion();
      }, duration);
    }, 1500);
  }
}