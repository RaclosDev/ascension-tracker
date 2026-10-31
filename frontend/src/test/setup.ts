import '@testing-library/jest-dom';

// JSDOM lacks dialog methods. Playwright checks native focus and modal behavior.
HTMLDialogElement.prototype.showModal = function () {
  this.open = true;
};
HTMLDialogElement.prototype.close = function () {
  this.open = false;
  this.dispatchEvent(new Event('close'));
};
