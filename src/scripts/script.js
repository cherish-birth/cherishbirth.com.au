function onReady() {
  const isLteIe9 = document.querySelector('html').classList.contains('lte-ie9');

  const activeButton = document.querySelector('a.btn.active');
  if (activeButton) {
    activeButton.addEventListener('click', handleActiveButtonClick);
  }

  const form = /** @type {HTMLFormElement} **/ document.querySelector('form#contact');
  if (form) {
    form.addEventListener('submit', onSubmit);
    setupInputListeners(form);
  }

  /**
   * Prevent navigation and toggle menu 'is-open' class
   *
   * @param {MouseEvent} event
   */
  function handleActiveButtonClick(event) {
    event.preventDefault();

    document.querySelector('nav .menu').classList.toggle('is-open');
  }

  /**
   * Handle contact form submissions
   *
   * @param {Event} event
   */
  function onSubmit(event) {
    const form = /** @type {HTMLFormElement} **/ event.target;
    const fields = ['name', 'email', 'phoneNumber', 'message', '_cc', '_subject', '_gotcha'];
    if (!validateInputs(form, fields)) {
      return event.preventDefault();
    }

    // Use normal HTTP form submission for <IE10
    if (isLteIe9) {
      return;
    } else {
      event.preventDefault();
    }

    const formData = fields.reduce((data, field) => {
      if (form[field]) {
        data[field] = form[field].value || void 0;
      }
      return data;
    }, {});

    fetch(form.action, {
      method: form.method,
      body: JSON.stringify(formData),
      headers: new Headers({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }),
    })
      .then((response) => response.ok ? Promise.resolve() : Promise.reject())
      .then(() => form.classList.add('is-submitted'))
      .catch(() => {
        form.classList.add('failed-submitting');
        form.querySelector('button[type=submit]').removeAttribute('disabled');
      })
      .then(() => form.classList.remove('is-sending'));

    form.classList.add('is-sending');
    form.classList.remove('is-submitted', 'failed-submitting');
    form.querySelector('button[type=submit]').setAttribute('disabled', '');
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
    let valid = true;

    // Validate 'required' fields
    fields.forEach((field) => {
      if (form[field] && form[field].hasAttribute('required') && !form[field].value) {
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
    const inputElements = form.querySelectorAll('input[type=text], input[type=email], textarea');
    inputElements.forEach((inputElement) => {
      const parentElement = inputElement.parentNode;

      inputElement.addEventListener('focus', (event) => event.target.parentNode.classList.add('is-focused'));
      inputElement.addEventListener('blur', (event) => event.target.parentNode.classList.remove('is-focused'));
      inputElement.addEventListener('input', onInputChange);

      // Firefox doesn't fire initial 'focus' event
      if (inputElement === document.activeElement) {
        parentElement.classList.add('is-focused');
      }

      // When navigating back/forward, form inputs might already have a value
      if (inputElement.value) {
        parentElement.classList.add('is-dirty');
      }
    });
  }

  /**
   * Add/remove classes when input changes
   *
   * @param {InputEvent} event
   */
  function onInputChange(event) {
    const inputElement = event.target;
    const parentElement = inputElement.parentNode;

    // Add/remove the 'is-dirty' class
    const action = inputElement.value ? 'add' : 'remove';
    parentElement.classList[action]('is-dirty');

    // Remove the 'is-invalid' class
    if (inputElement.value && parentElement.classList.contains('is-dirty')) {
      parentElement.classList.remove('is-invalid');
    }

    // If phone number entered, remove 'required' from email field
    const emailElement = form.email;
    const emailParent = emailElement.parentNode;
    if (inputElement.name === 'phoneNumber') {
      const action = inputElement.value ? 'removeAttribute' : 'setAttribute';
      emailElement[action]('required', '');
      if (!emailElement.hasAttribute('required') && emailParent.classList.contains('is-invalid')) {
        emailParent.classList.remove('is-invalid');
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', onReady);
