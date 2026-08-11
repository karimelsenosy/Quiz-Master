import ApiClient from './api.js';

export default class Quiz {
  constructor(category, difficulty, numberOfQuestions, playerName) {
    this.category = category;
    this.difficulty = difficulty;
    this.numberOfQuestions = numberOfQuestions;
    this.playerName = playerName || 'Player';
    this.score = 0;
    this.questions = [];
    this.currentQuestionIndex = 0;
  }

  async getQuestions() {
    const params = {
      amount: this.numberOfQuestions,
      difficulty: this.difficulty,
      category: this.category,
    };

    let data = await ApiClient.fetchQuestions(params);

    if (data.response_code === 3) {
      await ApiClient.requestSessionToken();
      data = await ApiClient.fetchQuestions(params);
    } else if (data.response_code === 4) {
      await ApiClient.resetSessionToken();
      data = await ApiClient.fetchQuestions(params);
    }

    if (data.response_code !== 0) {
      const errorMessages = {
        1: "There aren't enough questions for this category/difficulty combo. Try lowering the number of questions or picking a different category.",
        2: 'Something in your quiz settings is invalid. Please check your options and try again.',
        3: 'Session expired. Please try again.',
        4: "You've seen all the questions available for this configuration. Try different settings.",
        5: 'Too many requests — please wait a few seconds before starting a new quiz.',
      };

      throw new Error(
        errorMessages[data.response_code] ||
          'No questions found for this configuration.'
      );
    }

    this.questions = data.results;
    return this.questions;
  }

  incrementScore() {
    this.score++;
  }

  getCurrentQuestion() {
    return this.questions[this.currentQuestionIndex] || null;
  }

  nextQuestion() {
    this.currentQuestionIndex++;
    return this.currentQuestionIndex < this.questions.length;
  }

  isComplete() {
    return this.currentQuestionIndex >= this.questions.length;
  }

  getScorePercentage() {
    return Math.round((this.score / this.numberOfQuestions) * 100);
  }

  saveHighScore() {
    const scores = this.getHighScores();

    scores.push({
      name: this.playerName,
      score: this.score,
      total: this.numberOfQuestions,
      percentage: this.getScorePercentage(),
      difficulty: this.difficulty,
      date: new Date().toISOString(),
    });

    scores.sort((a, b) => b.percentage - a.percentage);
    const topScores = scores.slice(0, 10);

    localStorage.setItem('quizHighScores', JSON.stringify(topScores));
  }

  getHighScores() {
    try {
      const raw = localStorage.getItem('quizHighScores');
      return raw ? JSON.parse(raw) : [];
    } catch (err) {
      console.error('Failed to load high scores:', err);
      return [];
    }
  }

  isHighScore() {
    const scores = this.getHighScores();

    if (scores.length < 10) return true;

    const lowestScore = scores[scores.length - 1];
    return this.getScorePercentage() > lowestScore.percentage;
  }

  endQuiz() {
    const percentage = this.getScorePercentage();
    const qualifiesForHighScore = this.isHighScore();

    if (qualifiesForHighScore) {
      this.saveHighScore();
    }

    const highScores = this.getHighScores();
    const medalClasses = ['gold', 'silver', 'bronze'];

    const leaderboardItems = highScores
      .map((entry, idx) => {
        const medalClass = medalClasses[idx] || '';
        return `
          <li class="leaderboard-item ${medalClass}">
            <span class="leaderboard-rank">#${idx + 1}</span>
            <span class="leaderboard-name">${entry.name}</span>
            <span class="leaderboard-score">${entry.percentage}%</span>
          </li>
        `;
      })
      .join('');

    return `
      <div class="game-card results-card">
        <h2 class="results-title">Quiz Complete!</h2>
        <p class="results-score-display">${this.score}/${this.numberOfQuestions}</p>
        <p class="results-percentage">${percentage}% Accuracy</p>

        ${
          qualifiesForHighScore
            ? `<div class="new-record-badge">
                <i class="fa-solid fa-star"></i> New High Score!
              </div>`
            : ''
        }

        <div class="leaderboard">
          <h4 class="leaderboard-title">
            <i class="fa-solid fa-trophy"></i> Leaderboard
          </h4>
          <ul class="leaderboard-list">
            ${leaderboardItems}
          </ul>
        </div>

        <div class="action-buttons">
          <button class="btn-restart">
            <i class="fa-solid fa-rotate-right"></i> Play Again
          </button>
        </div>
      </div>
    `;
  }
}