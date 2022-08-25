function onReady() {
  const activeButton = document.querySelector('a.btn.active');
  if (activeButton) {
    activeButton.addEventListener('click', handleActiveButtonClick);
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
}

document.addEventListener('DOMContentLoaded', onReady);
