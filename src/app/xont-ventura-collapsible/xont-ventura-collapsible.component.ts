import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'xont-ventura-collapsible',
  template: `
    <button
      class="btn btn-link linkButton Linkboldtext"
      (click)="toggleCollapse()"
      [attr.aria-expanded]="!isCollapsed"
      [attr.aria-controls]="targetElementID"
    >
      <img
        [src]="isCollapsed ? 'images/imgup.png' : 'images/imgdown.png'"
        style="border-width:0px;"
      />
      &nbsp; {{ getButtonText() }}
    </button>
  `,
})
export class XontVenturaCollapsibleComponent {
  @Input() id: string | undefined;
  @Input() targetElementID: string | undefined;
  @Input() collapsedText = 'Selection Criteria';
  @Input() expandedText = 'Hide';

  _isCollapsed = true;
  @Input('collapsed')
  set collapsed(val: boolean) {
    this._isCollapsed = val;
  }
  get isCollapsed(): boolean {
    return this._isCollapsed;
  }

  @Output() onChange = new EventEmitter<boolean>();

  toggleCollapse(): void {
    this._isCollapsed = !this._isCollapsed;
    this.onChange.emit(this._isCollapsed);
  }

  getButtonText(): string {
    return this._isCollapsed ? this.collapsedText : this.expandedText;
  }
}
