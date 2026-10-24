import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { categoryName } from '../../core/config/categories';
import { Product } from '../../core/models';
import { enquiryMessages } from '../../core/services/whatsapp.service';
import { Icon } from '../icons';
import { JewelleryViewer } from '../jewellery-viewer/jewellery-viewer';
import { WhatsappButton } from '../whatsapp-button';

// One 3D viewer shared by all pieces (a single WebGL context is lighter on phones).
@Component({
  selector: 'app-showroom',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Icon, JewelleryViewer, WhatsappButton],
  templateUrl: './showroom.html',
  styleUrl: './showroom.scss',
})
export class Showroom {
  readonly products = input.required<Product[]>();
  readonly tone = input<'light' | 'dark'>('dark');

  readonly index = signal(0);
  readonly items = computed(() => this.products().filter((p) => p.model3d));
  readonly active = computed(() => this.items()[Math.min(this.index(), this.items().length - 1)]);
  readonly message = computed(() => (this.active() ? enquiryMessages.product(this.active()) : ''));
  readonly categoryName = categoryName;

  select(i: number): void {
    const n = this.items().length;
    this.index.set(((i % n) + n) % n);
  }
}
