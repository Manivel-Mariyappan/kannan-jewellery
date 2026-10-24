import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgbOffcanvas } from '@ng-bootstrap/ng-bootstrap';
import { AgGridAngular } from 'ag-grid-angular';
import { ColDef } from 'ag-grid-community';
import { AdminDataService } from '../../core/admin-data.service';
import { Enquiry, EnquiryStatus } from '../../core/admin-models';
import { AdminAlerts } from '../../core/alerts.service';
import {
  actionButtons,
  adminGridTheme,
  badge,
  formatDate,
  pinRightOnWideScreens,
} from '../../shared/grid';
import { UiOnlyNote } from '../../shared/ui-only-note';
import { ENQUIRY_STATUSES, EnquiryForm } from './enquiry-form';

const STATUS_COLORS: Record<EnquiryStatus, string> = {
  New: 'primary',
  Contacted: 'info',
  'Follow-up': 'warning',
  Converted: 'success',
  Closed: 'secondary',
};

@Component({
  selector: 'app-enquiries-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AgGridAngular, UiOnlyNote],
  templateUrl: './enquiries-page.html',
})
export class EnquiriesPage {
  readonly data = inject(AdminDataService);
  private readonly offcanvas = inject(NgbOffcanvas);
  private readonly alerts = inject(AdminAlerts);

  readonly theme = adminGridTheme;
  readonly statuses = ENQUIRY_STATUSES;
  readonly search = signal('');
  readonly status = signal<EnquiryStatus | null>(null);
  readonly getRowId = (p: { data: Enquiry }) => p.data.id;

  readonly rows = computed(() => {
    const s = this.status();
    return s ? this.data.enquiries.all().filter((e) => e.status === s) : this.data.enquiries.all();
  });
  readonly counts = computed(() => {
    const c = Object.fromEntries(this.statuses.map((s) => [s, 0])) as Record<EnquiryStatus, number>;
    for (const e of this.data.enquiries.all()) c[e.status]++;
    return c;
  });

  readonly columns: ColDef<Enquiry>[] = [
    {
      headerName: 'Date',
      field: 'date',
      width: 130,
      sort: 'desc',
      valueFormatter: (p) => formatDate(p.value as string),
    },
    { headerName: 'Customer', field: 'customerName', flex: 1.2, minWidth: 160 },
    { headerName: 'Mobile', field: 'mobile', width: 125 },
    {
      headerName: 'Product',
      colId: 'product',
      flex: 1.4,
      minWidth: 180,
      valueGetter: (p) =>
        p.data?.productCode ? `${p.data.productCode} · ${p.data.productName}` : '—',
    },
    { headerName: 'Source', field: 'source', width: 125 },
    { headerName: 'Status', field: 'status', width: 125, cellRenderer: badge(STATUS_COLORS) },
    {
      headerName: 'Follow-up',
      field: 'followUpDate',
      width: 130,
      valueFormatter: (p) => formatDate(p.value as string) || '—',
    },
    { headerName: 'Assigned', field: 'assignedTo', width: 120 },
    {
      headerName: 'Actions',
      colId: 'actions',
      width: 150,
      sortable: false,
      filter: false,
      pinned: pinRightOnWideScreens(),
      cellRenderer: actionButtons<Enquiry>(
        (e) => this.open(e),
        (e) => void this.remove(e),
      ),
    },
  ];

  open(enquiry: Enquiry | null): void {
    const ref = this.offcanvas.open(EnquiryForm, {
      position: 'end',
      panelClass: 'kj-offcanvas-lg',
      backdrop: 'static',
      ariaLabelledBy: 'enquiry-form-title',
    });
    (ref.componentInstance as EnquiryForm).enquiry = enquiry;
  }

  async remove(e: Enquiry): Promise<void> {
    if (
      !(await this.alerts.confirmDelete('Delete this enquiry?', `${e.customerName} · ${e.mobile}`))
    )
      return;
    this.data.enquiries.remove(e.id);
    void this.alerts.toast('Enquiry deleted');
  }
}
