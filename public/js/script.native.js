function onReady(event) {
  var form =
    /** @type {HTMLFormElement} */
    event.target.querySelector('form#contact');

  if (form) {
    form.addEventListener('submit', onSubmit);
    setupInputListeners(form);
  }
}

/**
 * Handle contact form submissions
 *
 * @param {Event} event
 */
function onSubmit(event) {
  event.preventDefault();

  var fields = ['name', 'email', 'phoneNumber', 'message', '_subject', '_gotcha'];
  if (!validateInputs(/** @type {HTMLFormElement} */event.target, fields)) {
    return;
  }

  console.log('event.target?', typeof event.target, event.target.toString(), event.target);
  event.target.submit();
}

/**
 * Validate form fields
 *
 * @param {HTMLFormElement} form
 * @param {Array<string>}   fields
 *
 * @returns {boolean}
 */
function validateInputs(form, fields) {
  var valid = true;

  // Validate 'required' fields
  fields.forEach(function _forEach(field) {
    if (form[field].required && !form[field].value) {
      valid = false;
      form[field].parentNode.classList.add('is-invalid');
    }
  });

  return valid;
}

/**
 * Setup focus/blur and input event listeners to form inputs
 *
 * @param {HTMLFormElement} form
 */
function setupInputListeners(form) {
  var inputs = form.querySelectorAll('input[type=text], input[type=email], textarea');
  Array.prototype.slice.call(inputs).forEach(function _forEach(input) {
    input.addEventListener('focus', onInputFocus);
    input.addEventListener('blur', onInputBlur);
    input.addEventListener('input', onInputChange);

    // Firefox doesn't fire initial 'focus' event
    if (input === document.activeElement) {
      input.parentNode.classList.add('is-focused');
    }

    // When navigating back/forward, form inputs might already have a value
    if (input.value) {
      input.parentNode.classList.add('is-dirty');
    }
  });
}

/**
 * Add the 'is-focused' class on focus
 *
 * @param {FocusEvent} event
 */
function onInputFocus(event) {
  event.target.parentNode.classList.add('is-focused');
}

/**
 * Remove the 'is-focused' class on blur
 *
 * @param {FocusEvent} event
 */
function onInputBlur(event) {
  event.target.parentNode.classList.remove('is-focused');
}

/**
 * Add/remove classes when input changes
 *
 * @param {InputEvent} event
 */
function onInputChange(event) {
  var input = event.target;
  // Add/remove the 'is-dirty' class
  if (input.value && !input.parentNode.classList.contains('is-dirty')) {
    input.parentNode.classList.add('is-dirty');
  } else if (!input.value && input.parentNode.classList.contains('is-dirty')) {
    input.parentNode.classList.remove('is-dirty');
  }

  // Remove the 'is-invalid' class
  if (input.value && input.parentNode.classList.contains('is-invalid')) {
    input.parentNode.classList.remove('is-invalid');
  }

  // If phone number entered, remove 'required' from email field
  var emailInput = input.form.email;
  if (input.name === 'phoneNumber') {
    emailInput.required = !input.value;
    if (!emailInput.required && emailInput.parentNode.classList.contains('is-invalid')) {
      emailInput.parentNode.classList.remove('is-invalid');
    }
  }
}

document.addEventListener('DOMContentLoaded', onReady);
