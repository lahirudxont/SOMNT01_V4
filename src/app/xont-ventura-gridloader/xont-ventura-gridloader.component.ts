import {
  Component,
  Output,
  EventEmitter,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

@Component({
  selector: 'xont-ventura-gridloader',
  templateUrl: './xont-ventura-gridloader.component.html',
})
export class XontVenturaGridLoaderComponent implements OnChanges {
  @Input()
  taskCode!: string;
  @Input() totalRecords = 0;
  @Output() onChange: EventEmitter<{
    page: number;
    start: number;
    end: number;
  }> = new EventEmitter();

  currentPage = 1;
  totalPages = 0;
  maxLen = 1;
  recordsCountSummary = '';
  private loadSize = 10; // Default

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['taskCode'] && this.taskCode) {
      this.loadSize = this.getLoadSize();
    }
    if (changes['totalRecords'] || changes['taskCode']) {
      this.updatePagination();
    }
  }

  private updatePagination(): void {
    this.totalPages = Math.ceil(this.totalRecords / this.loadSize);
    this.maxLen = this.totalPages > 0 ? this.totalPages.toString().length : 1;
    this.updateSummary();
  }

  private updateSummary(): void {
    const recordsToShow = Math.min(
      this.currentPage * this.loadSize,
      this.totalRecords
    );
    this.recordsCountSummary = `${recordsToShow} / ${this.totalRecords}`;
  }

  public getLoadSize(): number {
    try {
      const key = (this.taskCode ?? '') + '_MasterControlData';
      const json = localStorage.getItem(key);

      const data = json ? JSON.parse(json) : null;

      if (data?.AllowPaging === '1') return data.LoadSize;
      return data?.ExtendedPageSize || 50;
    } catch {
      return 50;
    }
  }

  goToPage(page: number): void {
    const newPage = Math.max(1, Math.min(page, this.totalPages));
    if (this.currentPage !== newPage) {
      this.currentPage = newPage;
      this.emitChange();
    }
  }

  onPageInputBlur(): void {
    if (this.currentPage < 1 || this.currentPage > this.totalPages) {
      this.currentPage = 1; // Reset to a valid page
    }
    this.goToPage(this.currentPage);
  }

  private emitChange(): void {
    const start = (this.currentPage - 1) * this.loadSize + 1;
    const end = start + this.loadSize - 1;
    this.updateSummary();
    this.onChange.emit({ page: this.currentPage, start, end });
  }
}
