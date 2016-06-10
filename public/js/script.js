/**
 * Bootstrap application
 *
 * @param {function} $
 */
function onReady($) {
  var form = $('form#contact');
  if (form.length) {
    form.on('submit', onSubmit);
    setupInputListeners(form.first());
  }

  /**
   * Handle contact form submissions
   *
   * @param {Event} event
   */
  function onSubmit(event) {
    event.preventDefault();

    var form = /** @type {HTMLFormElement} */ event.target;
    var fields = ['name', 'email', 'phoneNumber', 'message', '_subject', '_gotcha'];
    if (!validateInputs(form, fields)) {
      return;
    }

    var formData = fields.reduce(function _reduce(data, field) {
      data[field] = form[field].value || null;
      return data;
    }, {});

    console.log('SUBMIT!', formData);
    $.ajax({
      url: form.action,
      type: form.method,
      data: formData,
      dataType: 'json',
      success: onSubmitSuccess,
      error: onSubmitError,
      complete: onSubmitComplete,
    });

    // TODO: show spinner and/or message while sending
    // TODO: handle success/error with friendly messages
  }

  function onSubmitSuccess(data, status, xhr) {
    console.log('SUCCESS!', data, status, xhr);
  }

  function onSubmitError(xhr, errorType, error) {
    console.log('ERROR!', xhr, errorType, error);
  }

  function onSubmitComplete(xhr, status) {
    console.log('COMPLETE!', xhr, status);
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
        $(form[field]).parent().addClass('is-invalid');
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
    $(form)
      .find('input[type=text], input[type=email], textarea')
      .each(function _each(_, input) {
        var $input = $(input);
        var $parent = $input.parent();

        $input.on('focus', onInputFocus);
        $input.on('blur', onInputBlur);
        $input.on('input', onInputChange);

        // Firefox doesn't fire initial 'focus' event
        if (input === document.activeElement) {
          $parent.addClass('is-focused');
        }

        // When navigating back/forward, form inputs might already have a value
        if (input.value) {
          $parent.addClass('is-dirty');
        }
      });
  }

  /**
   * Add the 'is-focused' class on focus
   *
   * @param {FocusEvent} event
   */
  function onInputFocus(event) {
    $(event.target).parent().addClass('is-focused');
  }

  /**
   * Remove the 'is-focused' class on blur
   *
   * @param {FocusEvent} event
   */
  function onInputBlur(event) {
    $(event.target).parent().removeClass('is-focused');
  }

  /**
   * Add/remove classes when input changes
   *
   * @param {InputEvent} event
   */
  function onInputChange(event) {
    var input = event.target;
    var $parent = $(input).parent();

    // Add/remove the 'is-dirty' class
    if (input.value && !$parent.hasClass('is-dirty')) {
      $parent.addClass('is-dirty');
    } else if (!input.value && $parent.hasClass('is-dirty')) {
      $parent.removeClass('is-dirty');
    }

    // Remove the 'is-invalid' class
    if (input.value && $parent.hasClass('is-dirty')) {
      $parent.removeClass('is-invalid');
    }

    // If phone number entered, remove 'required' from email field
    var emailInput = input.form.email;
    var $emailParent = $(emailInput).parent();
    if (input.name === 'phoneNumber') {
      emailInput.required = !input.value;
      if (!emailInput.required && $emailParent.hasClass('is-invalid')) {
        $emailParent.removeClass('is-invalid');
      }
    }
  }
}

if (window.Zepto) {
  Zepto(onReady);
} else {
  jQuery(onReady);
}
