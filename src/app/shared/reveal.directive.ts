import { Directive, ElementRef, inject, input, OnInit } from '@angular/core';
import { MotionService } from '../core/services/motion.service';

/**
 * Scroll-reveal via AOS: `<section appReveal="fade-up" [revealDelay]="150">`.
 * The data-aos attribute is only added when the visitor allows motion, so content is never
 * left hidden for reduced-motion users.
 */
@Directive({ selector: '[appReveal]' })
export class RevealDirective implements OnInit {
  readonly appReveal = input<string>('fade-up');
  readonly revealDelay = input<number>(0);

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly motion = inject(MotionService);

  ngOnInit(): void {
    if (this.motion.reduced()) return;
    const el = this.el.nativeElement as HTMLElement;
    el.setAttribute('data-aos', this.appReveal() || 'fade-up');
    if (this.revealDelay()) el.setAttribute('data-aos-delay', String(this.revealDelay()));
  }
}
