import { Directive, ElementRef, inject, input } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Restricts a text input to numbers: `<input appNumbersOnly [decimals]="2">`.
 * Blocks letters, signs and exponents while typing and cleans pasted text.
 */
@Directive({
  selector: 'input[appNumbersOnly]',
  host: {
    inputmode: 'decimal',
    autocomplete: 'off',
    '(keydown)': 'onKeydown($event)',
    '(input)': 'onInput()',
  },
})
export class NumbersOnlyDirective {
  /** Allowed digits after the decimal point; 0 for whole numbers. */
  readonly decimals = input(2);

  private readonly el = inject(ElementRef<HTMLInputElement>);
  private readonly control = inject(NgControl, { optional: true, self: true });

  private static readonly ALLOWED_KEYS = new Set(['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End']);

  onKeydown(e: KeyboardEvent): void {
    if (NumbersOnlyDirective.ALLOWED_KEYS.has(e.key) || e.ctrlKey || e.metaKey) return;
    const value = (this.el.nativeElement as HTMLInputElement).value;
    if (e.key === '.' && this.decimals() > 0 && !value.includes('.')) return;
    if (/^\d$/.test(e.key)) return;
    e.preventDefault();
  }

  onInput(): void {
    const input = this.el.nativeElement as HTMLInputElement;
    const clean = this.sanitize(input.value);
    if (clean !== input.value) input.value = clean;
    // Whichever input listener runs last (this one or the forms value accessor), the control
    // ends up with the cleaned text. Forms convert it with Number() when saving.
    this.control?.control?.setValue(clean, { emitModelToViewChange: false });
  }

  private sanitize(raw: string): string {
    let v = raw.replace(this.decimals() > 0 ? /[^\d.]/g : /\D/g, '');
    const dot = v.indexOf('.');
    if (dot !== -1) v = v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, '').slice(0, this.decimals());
    return v;
  }
}
