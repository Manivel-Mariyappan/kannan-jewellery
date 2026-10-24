import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'whatsapp'
  | 'phone'
  | 'pin'
  | 'clock'
  | 'mail'
  | 'search'
  | 'cube'
  | 'arrow-left'
  | 'arrow-right'
  | 'close'
  | 'menu';

@Component({
  selector: 'app-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', style: 'display:inline-flex;line-height:0' },
  templateUrl: './icons.html',
})
export class Icon {
  readonly name = input.required<IconName>();
  readonly size = input(20);
}
