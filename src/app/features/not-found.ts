import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../core/services/seo.service';

@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <section class="section container">
      <div class="state-box">
        <p class="eyebrow">404</p>
        <h1>This page has been misplaced</h1>
        <p>The link may be old, or the piece may no longer be listed.</p>
        <a class="btn btn-gold" routerLink="/collections">Explore collections</a>
      </div>
    </section>
  `,
})
export class NotFound {
  constructor() {
    inject(SeoService).set({ title: 'Page not found', description: 'The page you were looking for could not be found.' });
  }
}
