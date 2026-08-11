const BASE_URL = "https://opentdb.com";
let sessionToken = null;
let tokenRequestPromise = null;

async function requestSessionToken() {
  const res = await fetch(`${BASE_URL}/api_token.php?command=request`);
  if (!res.ok) throw new Error("Failed to request a session token.");

  const data = await res.json();
  if (data.response_code === 0) {
    sessionToken = data.token;
  }
  return sessionToken;
}

async function resetSessionToken() {
  if (!sessionToken) return requestSessionToken();

  const res = await fetch(
    `${BASE_URL}/api_token.php?command=reset&token=${sessionToken}`
  );
  if (!res.ok) throw new Error("Failed to reset the session token.");

  const data = await res.json();
  if (data.response_code === 0) {
    sessionToken = data.token;
  } else {
    await requestSessionToken();
  }
  return sessionToken;
}

async function ensureSessionToken() {
  if (sessionToken) return sessionToken;

  if (!tokenRequestPromise) {
    tokenRequestPromise = requestSessionToken().finally(() => {
      tokenRequestPromise = null;
    });
  }

  return tokenRequestPromise;
}

function getSessionToken() {
  return sessionToken;
}

async function fetchQuestions({ amount, difficulty, category }) {
  await ensureSessionToken();

  const params = new URLSearchParams({ amount, difficulty });
  if (category) params.append("category", category);
  if (sessionToken) params.append("token", sessionToken);

  const res = await fetch(`${BASE_URL}/api.php?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch questions from the server.");
  return res.json();
}

async function fetchCategories() {
  const res = await fetch(`${BASE_URL}/api_category.php`);
  if (!res.ok) throw new Error("Failed to fetch categories.");
  const data = await res.json();
  return data.trivia_categories || [];
}

async function fetchCategoryCount(categoryId) {
  const res = await fetch(`${BASE_URL}/api_count.php?category=${categoryId}`);
  if (!res.ok) throw new Error("Failed to fetch category question count.");
  const data = await res.json();
  return data.category_question_count || null;
}

async function fetchGlobalCount() {
  const res = await fetch(`${BASE_URL}/api_count_global.php`);
  if (!res.ok) throw new Error("Failed to fetch global question count.");
  const data = await res.json();
  return data.overall || null;
}

export default {
  requestSessionToken,
  resetSessionToken,
  ensureSessionToken,
  getSessionToken,
  fetchQuestions,
  fetchCategories,
  fetchCategoryCount,
  fetchGlobalCount,
};