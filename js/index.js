import Quiz from "./quiz.js";
import Question from "./question.js";

const quizOptionsForm = document.getElementById("quizOptions");
const playerNameInput = document.getElementById("playerName");
const categoryInput = document.getElementById("categoryMenu");
const difficultyOptions = document.getElementById("difficultyOptions");
const questionsNumber = document.getElementById("questionsNumber");
const startQuizBtn = document.getElementById("startQuiz");
const questionsContainer = document.querySelector(".questions-container");

let currentQuiz = null;

function showLoading() {
  questionsContainer.innerHTML = `
    <div class="loading-overlay">
      <div class="loading-spinner"></div>
      <p class="loading-text">Loading Questions...</p>
    </div>
  `;
}

function hideLoading() {
  const overlay = questionsContainer.querySelector(".loading-overlay");
  if (overlay) overlay.remove();
}

function showError(message) {
  questionsContainer.innerHTML = `
    <div class="game-card error-card">
      <div class="error-icon">
        <i class="fa-solid fa-triangle-exclamation"></i>
      </div>
      <h3 class="error-title">Oops! Something went wrong</h3>
      <p class="error-message">${message}</p>
      <button class="btn-play retry-btn">
        <i class="fa-solid fa-rotate-right"></i> Try Again
      </button>
    </div>
  `;

  const retryBtn = questionsContainer.querySelector(".retry-btn");
  retryBtn.addEventListener("click", resetToStart);
}

function validateForm() {
  const value = questionsNumber.value;

  if (!value) {
    return { isValid: false, error: "Please enter the number of questions." };
  }

  const numValue = Number(value);

  if (numValue < 1) {
    return { isValid: false, error: "Please enter at least 1 question." };
  }

  if (numValue > 50) {
    return { isValid: false, error: "Please enter no more than 50 questions." };
  }

  return { isValid: true, error: null };
}

function showFormError(message) {
  const existingError = quizOptionsForm.querySelector(".form-error");
  if (existingError) existingError.remove();

  const errorDiv = document.createElement("div");
  errorDiv.className = "form-error";
  errorDiv.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${message}`;

  quizOptionsForm.insertBefore(errorDiv, startQuizBtn);

  setTimeout(() => {
    errorDiv.style.transition = "opacity 0.3s ease";
    errorDiv.style.opacity = "0";
    setTimeout(() => errorDiv.remove(), 300);
  }, 3000);
}

function resetToStart() {
  questionsContainer.innerHTML = "";
  quizOptionsForm.reset();
  quizOptionsForm.classList.remove("hidden");
  currentQuiz = null;
}

async function startQuiz() {
  const { isValid, error } = validateForm();

  if (!isValid) {
    showFormError(error);
    return;
  }

  const playerName = playerNameInput.value.trim() || "Player";
  const category = categoryInput.value;
  const difficulty = difficultyOptions.value;
  const numberOfQuestions = Number(questionsNumber.value);

  currentQuiz = new Quiz(category, difficulty, numberOfQuestions, playerName);

  startQuizBtn.disabled = true;
  quizOptionsForm.classList.add("hidden");
  showLoading();

  try {
    const questions = await currentQuiz.getQuestions();
    hideLoading();

    if (!questions || questions.length === 0) {
      showError(
        "No questions were found for this configuration. Please try different settings.",
      );
      return;
    }

    new Question(currentQuiz, questionsContainer, resetToStart);
  } catch (err) {
    hideLoading();
    showError(err.message || "Failed to load questions. Please try again.");
  } finally {
    startQuizBtn.disabled = false;
  }
}

startQuizBtn.addEventListener("click", startQuiz);
questionsNumber.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    startQuiz();
  }
});