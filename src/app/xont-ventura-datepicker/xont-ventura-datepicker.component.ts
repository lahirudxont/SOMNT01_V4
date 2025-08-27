import {
  Component,
  Input,
  Output,
  EventEmitter,
  AfterViewInit,
  OnInit,
  OnDestroy,
  inject,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';

declare var $: any;

@Component({
  selector: 'xont-ventura-datepicker',
  standalone: true,
  template: `
    <!-- calendar button -->
    <button
      class="btn btn-xs "
      type="button"
      (click)="openPicker()"
      [disabled]="_disabled"
    >
      <i class="fa fa-calendar"></i>
    </button>
  `,
})
export class XontVenturaDatepickerComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  @Input() id!: string; // internal id (not used much now)
  @Input() targetId!: string; // <-- external input id
  @Output() onDateSelect = new EventEmitter<string>();

  private http = inject(HttpClient);
  format = 'yyyy/mm/dd';
  _disabled = false;
  private docClickHandler: any;

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
      return;
    }

    const $target = $('#' + this.targetId);

    $target
      .datepicker({
        todayHighlight: true,
        autoclose: true,
        todayBtn: 'linked',
        showOnFocus: false,
      })
      .on('changeDate', (e: any) => {
        const year = e.date.getFullYear();
        const month = (1 + e.date.getMonth()).toString().padStart(2, '0');
        const date = e.date.getDate().toString().padStart(2, '0');

        const output = this.formatDate(year, month, date);

        // update external input value
        $target.val(output);

        // emit to parent
        this.onDateSelect.emit(output);
      });

    // close on outside click
    this.docClickHandler = (event: any) => {
      if (
        !$(event.target).closest('.datepicker').length &&
        !$(event.target).closest('#' + this.targetId).length
      ) {
        $target.datepicker('hide');
      }
    };
    $(document).on('click', this.docClickHandler);
  }

  openPicker() {
    const $target = $('#' + this.targetId);
    $target.focus().datepicker('show'); // ensure it opens even if readonly
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
    return formatMap[this.format] ?? '';
  }

  public destroy() {
    $('#' + this.targetId).datepicker('destroy');
  }

  public reset() {
    $('#' + this.targetId).datepicker({
      todayHighlight: true,
      autoclose: true,
      todayBtn: 'linked',
      showOnFocus: false,
    });
  }

  ngOnDestroy() {
    if (this.docClickHandler) {
      $(document).off('click', this.docClickHandler);
    }
    this.destroy();
  }
}
