import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ContentStore, DraftKind } from '../../core/services/content-store';
import { downloadJson } from '../../core/utils/download';

@Component({
  selector: 'app-admin-publish',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="admin-head">
      <div>
        <h1>Publish changes</h1>
        <p>This website has no server, so changes are published by replacing the data files and redeploying.</p>
      </div>
    </div>

    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr><th>File</th><th>Status</th><th></th></tr></thead>
        <tbody>
          @for (f of files; track f.kind) {
            <tr>
              <td><code>public/data/{{ f.file }}</code><br /><small>{{ f.label }}</small></td>
              <td>
                @if (store.isDraft(f.kind)) { <strong style="color: #8a6420">Changed (draft)</strong> } @else { No changes }
              </td>
              <td>
                <div class="admin-actions">
                  <button type="button" class="btn btn-gold btn-sm" (click)="download(f.kind, f.file)">Download</button>
                  @if (store.isDraft(f.kind)) {
                    <button type="button" class="btn btn-danger btn-sm" (click)="discard(f.kind, f.label)">Discard draft</button>
                  }
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    <section class="admin-panel" style="margin-top: 1.5rem">
      <h2>How to publish</h2>
      <ol>
        <li>Download each changed file above.</li>
        <li>Replace the file with the same name in the project's <code>public/data/</code> folder.</li>
        <li>If you added photos or 3D models by path, copy them into <code>public/images/</code> or <code>public/models/</code>.</li>
        <li>Rebuild and deploy the site (<code>npm run build</code>, then upload <code>dist/KANNAN_JEWELLERY/browser</code>), or push to Git if your host deploys automatically.</li>
        <li>After the new version is live, discard the drafts here so this browser shows the published site again.</li>
      </ol>
      <p class="admin-help">Drafts are stored only in this browser. Clearing browser data deletes them, so download your files first.</p>
    </section>
  `,
})
export class AdminPublish {
  readonly store = inject(ContentStore);

  readonly files: { kind: DraftKind; file: string; label: string }[] = [
    { kind: 'products', file: 'products.json', label: 'Jewellery products' },
    { kind: 'goldRate', file: 'gold-rate.json', label: "Today's gold rate" },
    { kind: 'settings', file: 'settings.json', label: 'Shop details & WhatsApp' },
  ];

  download(kind: DraftKind, file: string): void {
    const data = kind === 'products' ? this.store.products() : kind === 'goldRate' ? this.store.goldRateFile() : this.store.settings();
    downloadJson(file, data);
  }

  discard(kind: DraftKind, label: string): void {
    if (confirm(`Discard unpublished changes to "${label}"? Download the file first if you want to keep them.`)) {
      this.store.discardDraft(kind);
    }
  }
}
