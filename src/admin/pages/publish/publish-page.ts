import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ContentStore, DraftKind } from '../../../app/core/services/content-store';
import { downloadJson } from '../../../app/core/utils/download';
import { AdminAlerts } from '../../core/alerts.service';
import { AdminCard } from '../../shared/admin-card';

@Component({
  selector: 'app-publish-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AdminCard],
  templateUrl: './publish-page.html',
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
    const data =
      kind === 'products'
        ? this.store.products()
        : kind === 'goldRate'
          ? this.store.goldRateFile()
          : this.store.settings();
    downloadJson(file, data);
    void this.alerts.toast(`${file} downloaded`);
  }

  async discard(kind: DraftKind, label: string): Promise<void> {
    if (
      await this.alerts.confirmDelete(
        `Discard changes to ${label}?`,
        'Download the file first if you want to keep them.',
      )
    ) {
      this.store.discardDraft(kind);
      void this.alerts.toast('Draft discarded');
    }
  }
}
