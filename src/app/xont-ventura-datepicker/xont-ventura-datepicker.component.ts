import {
  Component,
  Input,
  Output,
  EventEmitter,
  AfterViewInit,
  OnInit,
  inject,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
declare var $: any;

@Component({
  selector: 'xont-ventura-datepicker',
  standalone: true,
  template: `
    <button [id]="id" class="btn btn-xs" type="button" [disabled]="_disabled">
      <i class="fa fa-calendar"></i>
    </button>
  `,
})
export class XontVenturaDatepickerComponent implements OnInit, AfterViewInit {
  @Input() id!: string;
  @Output() onDateSelect = new EventEmitter<string>();

  private http = inject(HttpClient);

  format = 'yyyy/mm/dd';
  _disabled = false;

  @Input()
  set disabled(val: boolean) {
    this._disabled = val;
    if (val) {
      this.destroy();
    } else {
      this.reset();
    }
  }

  ngOnInit() {
    const dateFormat = localStorage.getItem('ClientDateFormat');
    if (dateFormat) {
      this.format = dateFormat;
    }
  }

  ngAfterViewInit() {
    if (this._disabled) {
      this.destroy();
    } else {
      this.reset();
    }

    $('#' + this.id)
      .datepicker()
      .on('changeDate', (e: any) => {
        const year = e.date.getFullYear();
        const month = (1 + e.date.getMonth()).toString().padStart(2, '0');
        const date = e.date.getDate().toString().padStart(2, '0');

        const output = this.formatDate(year, month, date);
        this.onDateSelect.emit(output);
      });
  }

  private formatDate(year: string, month: string, date: string): string {
    const formatMap: { [key: string]: string } = {
      'yyyy/mm/dd': `${year}/${month}/${date}`,
      'yyyy/dd/mm': `${year}/${date}/${month}`,
      'mm/yyyy/dd': `${month}/${year}/${date}`,
      'mm/dd/yyyy': `${month}/${date}/${year}`,
      'dd/yyyy/mm': `${date}/${year}/${month}`,
      'dd/mm/yyyy': `${date}/${month}/${year}`,

      'yyyy.mm.dd': `${year}.${month}.${date}`,
      'yyyy.dd.mm': `${year}.${date}.${month}`,
      'mm.yyyy.dd': `${month}.${year}.${date}`,
      'mm.dd.yyyy': `${month}.${date}.${year}`,
      'dd.yyyy.mm': `${date}.${year}.${month}`,
      'dd.mm.yyyy': `${date}.${month}.${year}`,

      'yyyy-mm-dd': `${year}-${month}-${date}`,
      'yyyy-dd-mm': `${year}-${date}-${month}`,
      'mm-yyyy-dd': `${month}-${year}-${date}`,
      'mm-dd-yyyy': `${month}-${date}-${year}`,
      'dd-yyyy-mm': `${date}-${year}-${month}`,
      'dd-mm-yyyy': `${date}-${month}-${year}`,
    };

    const formattedDate = formatMap[this.format];
    if (!formattedDate) {
      console.error('Invalid date format in "ventura.config.json"');
      return '';
    }

    return formattedDate;
  }

  public destroy() {
    $('#' + this.id).datepicker('destroy');
  }

  public reset() {
    console.log('reset');
    $('#' + this.id).datepicker({
      todayHighlight: true,
      autoclose: true,
      todayBtn: 'linked',
    });
  }
}
