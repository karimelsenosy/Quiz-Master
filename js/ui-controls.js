/**
 * @fileoverview UI Controls - Custom select dropdowns and number input handlers
 * Extracted from inline HTML for better organization
 */

/**
 * Wires up click handling for whichever option elements currently exist
 * inside a custom select. Safe to call again after an option list has
 * been rebuilt dynamically (e.g. categories loaded from the API).
 */
function attachOptionListeners(select) {
  const trigger = select.querySelector(".custom-select-trigger");
  const hiddenInput = select.parentElement.querySelector('input[type="hidden"]');
  const textSpan = trigger.querySelector(".custom-select-text");
  const iconSpan = trigger.querySelector(".custom-select-icon");
  const options = select.querySelectorAll(".custom-select-option");

  options.forEach((option) => {
    option.addEventListener("click", () => {
      const value = option.dataset.value;
      const icon = option.querySelector("i").outerHTML;
      const text = option.textContent.trim();

      select.dataset.value = value;
      if (hiddenInput) hiddenInput.value = value;
      textSpan.textContent = text;
      iconSpan.innerHTML = icon;

      options.forEach((o) => o.classList.remove("selected"));
      option.classList.add("selected");
      select.classList.remove("open");

      // Let other modules (e.g. index.js) react to a selection change
      // without needing to know about the custom-select internals.
      select.dispatchEvent(
        new CustomEvent("select-change", { detail: { value } })
      );
    });
  });
}

/**
 * Wires up the open/close toggle for a select's trigger button.
 * Guarded so calling init twice on the same select never double-binds it.
 */
function attachTriggerListener(select) {
  const trigger = select.querySelector(".custom-select-trigger");
  if (trigger.dataset.bound === "true") return;
  trigger.dataset.bound = "true";

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    document.querySelectorAll(".custom-select.open").forEach((s) => {
      if (s !== select) s.classList.remove("open");
    });
    select.classList.toggle("open");
  });
}

/** Fully initializes one custom select (trigger + its current options). */
export function initSelect(select) {
  attachTriggerListener(select);
  attachOptionListeners(select);
}

/**
 * Re-binds click handlers after a select's option list has been replaced
 * with new markup (trigger listener is left untouched - it's still bound).
 */
export function refreshSelectOptions(select) {
  attachOptionListeners(select);
}

/**
 * Initialize custom select dropdowns
 */
function initCustomSelects() {
  document.querySelectorAll(".custom-select").forEach(initSelect);
}

/**
 * Initialize number input custom buttons
 */
function initNumberInputs() {
  document.querySelectorAll(".number-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const wrapper = btn.closest(".number-input-wrapper");
      const input = wrapper.querySelector('input[type="number"]');
      const min = parseInt(input.min) || 1;
      const max = parseInt(input.max) || 50;
      let value = parseInt(input.value) || min;

      if (btn.dataset.action === "increment" && value < max) {
        input.value = value + 1;
      } else if (btn.dataset.action === "decrement" && value > min) {
        input.value = value - 1;
      }
    });
  });
}

function initClickOutside() {
  document.addEventListener("click", () => {
    document
      .querySelectorAll(".custom-select.open")
      .forEach((s) => s.classList.remove("open"));
  });
}

// Initialize all UI controls when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  initCustomSelects();
  initNumberInputs();
  initClickOutside();
});