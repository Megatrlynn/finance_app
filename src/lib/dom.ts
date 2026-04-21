export const focusFirstInvalid = (form: HTMLFormElement): void => {
  const firstInvalid = form.querySelector<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
    ':invalid',
  );

  if (firstInvalid) {
    firstInvalid.focus();
    firstInvalid.classList.add('flash-invalid');
    setTimeout(() => firstInvalid.classList.remove('flash-invalid'), 700);
  }
};

export const scrollToTopSmooth = (): void => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
