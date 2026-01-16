/**
 * Scroll to and focus the first invalid field in a form.
 * Use this as the `onInvalid` callback for react-hook-form's handleSubmit.
 * 
 * @example
 * const onSubmit = form.handleSubmit(onValid, scrollToFirstInvalid);
 */
export function scrollToFirstInvalid() {
  // Use setTimeout to ensure DOM has been updated with aria-invalid attributes
  setTimeout(() => {
    const firstInvalid = document.querySelector<HTMLElement>(
      '[aria-invalid="true"]'
    );
    
    if (firstInvalid) {
      firstInvalid.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      firstInvalid.focus({ preventScroll: true });
    }
  }, 0);
}

/**
 * Scroll to and focus the first invalid field within a specific form element.
 * Useful when you have multiple forms on a page.
 */
export function scrollToFirstInvalidInForm(form: HTMLFormElement | null) {
  if (!form) return;
  
  setTimeout(() => {
    const firstInvalid = form.querySelector<HTMLElement>(
      '[aria-invalid="true"]'
    );
    
    if (firstInvalid) {
      firstInvalid.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      firstInvalid.focus({ preventScroll: true });
    }
  }, 0);
}
