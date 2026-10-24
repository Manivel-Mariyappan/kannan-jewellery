import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ContentStore, DraftKind } from '../../../app/core/services/content-store';
import { downloadJson } from '../../../app/core/utils/download';
import { AdminAlerts } from '../../core/alerts.service';
import { AdminCard } from '../../shared/admin-card';

@Component({
  selector: 'app-publish-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AdminCard],
  template: `
    <admin-card heading="Data files" subtitle="This website has no server: changes go live by replacing these files and redeploying" icon="⇪">
      <div class="list-group list-group-flush">
        @for (f of files; track f.kind) {
          <div class="list-group-item d-flex flex-wrap align-items-center gap-3 px-0">
            <div class="flex-grow-1">
              <div class="fw-semibold">{{ f.label }}</div>
              <code class="small">public/data/{{ f.file }}</code>
            </div>
            @if (store.isDraft(f.kind)) {
              <span class="badge text-bg-warning">Changed (draft)</span>
            } @else {
              <span class="badge text-bg-light border">No changes</span>
            }
            <div class="d-flex gap-2">
              <button type="button" class="btn btn-sm btn-primary" (click)="download(f.kind, f.file)">Download</button>
              @if (store.isDraft(f.kind)) {
                <button type="button" class="btn btn-sm btn-outline-danger" (click)="discard(f.kind, f.label)">Discard draft</button>
              }
            </div>
          </div>
        }
      </div>
      <div card-footer>Drafts are stored only in this browser. Clearing browser data deletes them, so download your files first.</div>
    </admin-card>

    <admin-card heading="How to publish" icon="?">
      <ol class="mb-0">
        <li>Download each changed file above.</li>
        <li>Replace the file with the same name in the project's <code>public/data/</code> folder.</li>
        <li>If you added photos or 3D models by path, copy them into <code>public/images/</code> or <code>public/models/</code>.</li>
        <li>Rebuild and deploy the site (<code>npm run build</code>), or push to Git if your host deploys automatically.</li>
        <li>After the new version is live, discard the drafts here.</li>
      </ol>
    </admin-card>
  `,
})
export class PublishPage {
  readonly store = inject(ContentStore);
  private readonly alerts = inject(AdminAlerts);

  readonly files: { kind: DraftKind; file: string; label: string }[] = [
    { kind: 'products', file: 'products.json', label: 'Jewellery products' },
    { kind: 'goldRate', file: 'gold-rate.json', label: "Today's gold rate" },
    { kind: 'settings', file: 'settings.json', label: 'Shop details & WhatsApp' },
  ];

  download(kind: DraftKind, file: string): void {
    const data = kind === 'products' ? this.store.products() : kind === 'goldRate' ? this.store.goldRateFile() : this.store.settings();
    downloadJson(file, data);
    void this.alerts.toast(`${file} downloaded`);
  }

  async discard(kind: DraftKind, label: string): Promise<void> {
    if (await this.alerts.confirmDelete(`Discard changes to ${label}?`, 'Download the file first if you want to keep them.')) {
      this.store.discardDraft(kind);
      void this.alerts.toast('Draft discarded');
    }
  }
}
