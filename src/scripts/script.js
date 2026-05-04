var FREEBIES_STORAGE_KEY = 'cherishbirth_date_nights_freebies_v1'
var FREEBIES_OPEN_DELAY_MS = 750
var FREEBIES_EXIT_MS = 320

function onReady() {
  var activeButton = document.querySelector('a.btn.active')
  if (activeButton) {
    activeButton.addEventListener('click', function handleActiveNavClick(event) {
      event.preventDefault()
      var menu = document.querySelector('nav .menu')
      if (menu) menu.classList.toggle('is-open')
    })
  }

  var root = document.querySelector('[data-freebies-modal]')
  if (!root) return

  try {
    if (window.localStorage.getItem(FREEBIES_STORAGE_KEY)) return
  } catch (e) {
    /* private mode or blocked — still show once per session via no storage */
  }

  var panel = root.querySelector('.freebies-modal__panel')
  var form = root.querySelector('[data-freebies-form]')
  var formWrap = root.querySelector('[data-freebies-modal-form-wrap]')
  var successEl = root.querySelector('[data-freebies-success]')
  var errorEl = root.querySelector('[data-freebies-error]')
  var submitBtn = root.querySelector('[data-freebies-submit]')

  var storageMarked = false
  function markSeen() {
    if (storageMarked) return
    storageMarked = true
    try {
      window.localStorage.setItem(FREEBIES_STORAGE_KEY, '1')
    } catch (e) {
      /* ignore */
    }
  }

  function showError(msg) {
    if (!errorEl) return
    errorEl.textContent = msg || 'Something went wrong. Please try again.'
    errorEl.hidden = false
  }

  function clearError() {
    if (!errorEl) return
    errorEl.textContent = ''
    errorEl.hidden = true
  }

  var closingTimer = null
  function closeModal() {
    if (!root.classList.contains('is-open')) return
    markSeen()
    root.classList.remove('is-open')
    root.classList.add('is-leaving')
    document.body.classList.remove('freebies-modal-open')
    if (closingTimer) window.clearTimeout(closingTimer)
    closingTimer = window.setTimeout(function () {
      closingTimer = null
      root.classList.remove('is-leaving')
      root.setAttribute('hidden', '')
      root.setAttribute('aria-hidden', 'true')
      teardownFocusTrap()
      document.removeEventListener('keydown', onKeydown)
    }, FREEBIES_EXIT_MS)
  }

  function openModal() {
    root.removeAttribute('hidden')
    root.setAttribute('aria-hidden', 'false')
    document.body.classList.add('freebies-modal-open')
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        root.classList.add('is-open')
        var email = root.querySelector('#freebies-email')
        if (email && typeof email.focus === 'function') email.focus()
        setupFocusTrap()
      })
    })
  }

  /* --- focus trap --- */
  var trapHandler = null
  function getFocusables() {
    if (!panel) return []
    var sel =
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
    return Array.prototype.slice.call(panel.querySelectorAll(sel)).filter(function (el) {
      if (el.hasAttribute('hidden') || el.getAttribute('aria-hidden') === 'true') return false
      return el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement
    })
  }

  function setupFocusTrap() {
    if (trapHandler) return
    trapHandler = function (e) {
      if (e.key !== 'Tab' || !panel) return
      var nodes = getFocusables()
      if (nodes.length === 0) return
      var first = nodes[0]
      var last = nodes[nodes.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', trapHandler)
  }

  function teardownFocusTrap() {
    if (trapHandler) {
      document.removeEventListener('keydown', trapHandler)
      trapHandler = null
    }
  }

  function onKeydown(e) {
    if (e.key === 'Escape' && root.classList.contains('is-open')) {
      e.preventDefault()
      closeModal()
    }
  }

  root.addEventListener('click', function (e) {
    if (e.target.closest('[data-freebies-modal-dismiss]')) {
      e.preventDefault()
      closeModal()
    }
  })

  document.addEventListener('keydown', onKeydown)

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault()
      clearError()
      if (!form.checkValidity()) {
        form.reportValidity()
        return
      }
      var fd = new window.FormData(form)
      var payload = {}
      fd.forEach(function (value, key) {
        payload[key] = value
      })
      if (submitBtn) {
        submitBtn.disabled = true
        submitBtn.setAttribute('aria-busy', 'true')
      }
      window
        .fetch(form.action, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })
        .then(function (res) {
          return res.text().then(function (text) {
            var data = {}
            if (text) {
              try {
                data = JSON.parse(text)
              } catch (parseErr) {
                data = {}
              }
            }
            return { res: res, data: data }
          })
        })
        .then(function (_ref) {
          var res = _ref.res
          var data = _ref.data
          if (res.ok) {
            markSeen()
            if (formWrap) formWrap.setAttribute('hidden', '')
            if (successEl) successEl.removeAttribute('hidden')
            var closeBtn = root.querySelector('.freebies-modal__success-close')
            if (closeBtn) closeBtn.focus()
          } else {
            var msg =
              (data && (data.error || (data.errors && data.errors[0]))) ||
              'Could not send right now. Please try again later.'
            showError(typeof msg === 'string' ? msg : 'Please check your email and try again.')
          }
        })
        .catch(function () {
          showError('Could not send right now. Please try again later.')
        })
        .then(function () {
          if (submitBtn) {
            submitBtn.disabled = false
            submitBtn.removeAttribute('aria-busy')
          }
        })
    })
  }

  window.setTimeout(function () {
    try {
      if (window.localStorage.getItem(FREEBIES_STORAGE_KEY)) return
    } catch (err) {
      /* show anyway */
    }
    openModal()
  }, FREEBIES_OPEN_DELAY_MS)
}

document.addEventListener('DOMContentLoaded', onReady)
