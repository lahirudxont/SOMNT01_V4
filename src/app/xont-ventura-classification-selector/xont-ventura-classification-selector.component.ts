import {
  Component,
  Output,
  EventEmitter,
  Input,
  ViewChild,
  ElementRef,
  ViewChildren,
  QueryList,
  OnInit,
  AfterViewInit,
  OnDestroy,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule, Location } from '@angular/common';
import { CommonService } from '../common.service';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'xont-ventura-classification-selector',
  styleUrls: ['./xont-ventura-classification-selector.component.css'],
  templateUrl: './xont-ventura-classification-selector.component.html',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class XontVenturaClassificationSelectorComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  clsBusy: Subscription = new Subscription();

  // Reactive Forms
  classificationForm: FormGroup;

  // Pagination
  currentPage = signal(1);
  totalPages = signal(1);

  // Signals for reactive state management
  public selector = signal<any[]>([]);
  public selectedClassifications: any[] = [];
  public list: any[] = [];
  public promptIndex: number = 0;

  // V3001 Adding Start
  public _valid = signal(true);
  public _originalDataSet = signal<any>(null);
  public _dataSet = signal<any>(null);
  public _minWidth = signal(500);
  public _dataSliderStatus = signal('none');
  public _stillDataLoading = signal(false);
  public _pageSize = signal(10);
  public _gridHeaders = signal<string[]>(['Code', 'Description']);
  public _gridFields = signal<string[]>([
    'masterGroupValue',
    'masterGroupValueDescription',
  ]);
  public _currentClsGroupIndex = signal(-1);
  public _codeEmptied = signal(false);
  public _descEmptied = signal(true);
  public _cursorInCorD = signal('');
  public _sortField = signal('');
  public _sortDirection = signal<'asc' | 'desc'>('asc');

  @ViewChild('element') element!: ElementRef;
  @ViewChild('scrollDiv') scrollDiv!: ElementRef;

  @ViewChildren('codeInput') codeInputs!: QueryList<ElementRef>;
  @ViewChildren('descInput') descInputs!: QueryList<ElementRef>;
  // V3001 Adding End

  // Signals for inputs
  readonly id = signal('clsSelector');
  @Input() set id_(value: string) {
    this.id.set(value);
  }

  readonly classificationType = signal('01');
  @Input() set classificationType_(value: string) {
    this.classificationType.set(value);
  }

  readonly taskCode = signal('');
  @Input() set taskCode_(value: string) {
    this.taskCode.set(value);
  }

  readonly codeTextWidth = signal('100px');
  @Input() set codeTextWidth_(value: string) {
    this.codeTextWidth.set(value);
  }

  readonly enableUserInput = signal('true');
  @Input() set enableUserInput_(value: string) {
    this.enableUserInput.set(value);
  }

  readonly descriptionTextWidth = signal('200px');
  @Input() set descriptionTextWidth_(value: string) {
    this.descriptionTextWidth.set(value);
  }

  readonly labelWidth = signal('100px');
  @Input() set labelWidth_(value: string) {
    this.labelWidth.set(value);
  }

  readonly activeStatus = signal('Active');
  @Input() set activeStatus_(value: string) {
    this.activeStatus.set(value);
  }

  private _allMandatory = signal('false');
  @Input() set allMandatory(value: string) {
    this._allMandatory.set(value);
    this.validate();
  }
  get allMandatory(): string {
    return this._allMandatory();
  }

  readonly lastLevelRequired = signal('false');
  @Input() set lastLevelRequired_(value: string) {
    this.lastLevelRequired.set(value);
  }

  readonly enabled = signal('true');
  @Input() set enabled_(value: string) {
    this.enabled.set(value);
  }

  @Output()
  onChange: EventEmitter<string> = new EventEmitter();

  constructor(
    private http: HttpClient,
    private location: Location,
    private commanService: CommonService,
    private fb: FormBuilder
  ) {
    this.classificationForm = this.fb.group({
      codes: this.fb.array([]),
      descriptions: this.fb.array([]),
    });
  }

  siteName(): string {
    return this.commanService.getAPIPrefix();
  }

  ngOnInit(): void {
    this.clsBusy.add(
      this.http
        .get(
          this.siteName() +
            '/api/Prompt/GetMasterCodes?ClassificationType=' +
            this.classificationType()
        )
        .pipe(
          map((data: any) => data),
          catchError((error) => {
            console.log(error);
            return of(null);
          })
        )
        .subscribe(
          (data) => {
            if (data) {
              this.list = data;
              const newSelector = [];
              const codesArray = this.fb.array([]);
              const descArray = this.fb.array([]);

              for (let i = 0; i < this.list.length; i++) {
                const obj = {
                  index: i,
                  txtCode: '',
                  txtDesc: '',
                  GroupDescription: this.list[i].GroupDescription.trim(),
                  HierarchyRequired: this.list[i].HierarchyRequired.trim(),
                  MasterGroup: this.list[i].MasterGroup.trim(),
                  ErrorMessage: undefined,
                  LatestText: '',
                };
                newSelector.push(obj);

                codesArray.push(new FormControl(''));
                descArray.push(new FormControl(''));
              }

              this.classificationForm.setControl('codes', codesArray);
              this.classificationForm.setControl('descriptions', descArray);
              this.selector.set(newSelector);

              if (this.selectedClassifications.length > 0) {
                this.applySelectedClassifications(this.selectedClassifications);
                this.selectedClassifications = [];
              }
              this.validate();
            }
          },
          (err) => {
            console.log(err);
          }
        )
    );

    const codeWidth = parseInt(this.codeTextWidth().replace('px', ''));
    const descWidth = parseInt(this.descriptionTextWidth().replace('px', ''));
    this._minWidth.set(codeWidth + descWidth);
    this.totalPages.set(
      Math.ceil((this._dataSet()?.length || 0) / this._pageSize())
    );
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    if (this.clsBusy) {
      this.clsBusy.unsubscribe();
    }
  }

  // Helper to get form arrays
  get codes(): FormArray {
    return this.classificationForm.get('codes') as FormArray;
  }

  get descriptions(): FormArray {
    return this.classificationForm.get('descriptions') as FormArray;
  }

  // Helper to get error message
  getError(index: number): string | undefined {
    return this.selector()[index]?.ErrorMessage;
  }

  // Pagination methods
  getPagedData() {
    const data = this.getSortedData();
    const start = (this.currentPage() - 1) * this._pageSize();
    const end = start + this._pageSize();
    return data.slice(start, end);
  }

  getSortedData() {
    if (!this._dataSet() || this._dataSet().length === 0) return [];

    const field = this._sortField();
    if (!field) return this._dataSet();

    return [...this._dataSet()].sort((a, b) => {
      const aVal = a[field].toString().toUpperCase();
      const bVal = b[field].toString().toUpperCase();

      if (this._sortDirection() === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });
  }

  sortData(field: string) {
    if (this._sortField() === field) {
      this._sortDirection.set(this._sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this._sortField.set(field);
      this._sortDirection.set('asc');
    }
    this.currentPage.set(1);
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  // V3001 Adding start
  public focus(): void {
    let timeTook = 0;

    const setFocus = () => {
      if (this.codeInputs && this.codeInputs.toArray()[0]) {
        this.codeInputs.toArray()[0].nativeElement.focus();
      } else {
        setTimeout(setFocus, 100);
        timeTook += 100;
      }
    };
    setFocus();
  }

  InputMousedIn(e: any, isLast: boolean, clsGroupIndex: number) {
    this._cursorInCorD.set(isLast ? 'D' : 'C');

    if (
      this._currentClsGroupIndex() != -1 &&
      this._currentClsGroupIndex() != clsGroupIndex
    ) {
      this.ResetProps();
    }

    if (this._dataSliderStatus() == 'block') {
      this.FilterSource();
    }

    if (this._dataSliderStatus() == 'none') {
      this._dataSliderStatus.set('block');
      this.PopulateDataSet(clsGroupIndex);
    }
  }

  InputKeyDown(e: KeyboardEvent, isLast: boolean, clsGroupIndex: number) {
    if (e.keyCode == 32 && this._dataSet() === null) {
      e.preventDefault();
      e.stopPropagation();
      return;
    } else if (
      isLast &&
      e.keyCode == 9 &&
      this._dataSliderStatus() == 'block'
    ) {
      if (!this.isEmpty) {
        this.FilterSource();
        const item =
          this._dataSet() && this._dataSet().length > 0
            ? this._dataSet()[0]
            : null;
        this.SetModel(item);
      } else {
        this.SetModel(null);
      }
      this.ResetProps();
    }

    this._cursorInCorD.set(isLast ? 'D' : 'C');

    const codeValue = this.codes.at(clsGroupIndex).value;
    const descValue = this.descriptions.at(clsGroupIndex).value;

    if (!codeValue && !isLast && e.keyCode == 8 && this._codeEmptied()) {
      e.preventDefault();
      this.descInputs.toArray()[clsGroupIndex].nativeElement.focus();
      this._cursorInCorD.set('D');
      this.FilterSource();
      this._codeEmptied.set(false);
    } else if (!descValue && isLast && e.keyCode == 8 && this._descEmptied()) {
      e.preventDefault();
      this.codeInputs.toArray()[clsGroupIndex].nativeElement.focus();
      this._cursorInCorD.set('C');
      this.FilterSource();
      this._descEmptied.set(false);
    }
  }

  InputKeyUp(e: KeyboardEvent, isLast: boolean, clsGroupIndex: number) {
    if (
      this._currentClsGroupIndex() != -1 &&
      this._currentClsGroupIndex() != clsGroupIndex
    ) {
      this.ResetProps();
    }

    // if not tab apply filter showing data if not shown already
    if (e.keyCode != 9) {
      if (this._dataSliderStatus() != 'block') {
        this._dataSliderStatus.set('block');
      }
      if (this._originalDataSet() === null && !this._stillDataLoading())
        this.PopulateDataSet(clsGroupIndex);

      this.FilterSource();
    }

    const codeValue = this.codes.at(clsGroupIndex).value;
    const descValue = this.descriptions.at(clsGroupIndex).value;

    if (!codeValue && !isLast && !this._codeEmptied()) {
      this._codeEmptied.set(true);
    } else {
      this._codeEmptied.set(false);
    }

    if (!descValue && isLast && !this._descEmptied()) {
      this._descEmptied.set(true);
    } else {
      this._descEmptied.set(false);
    }
  }

  ClickedOn(e: Event, clsGroupIndex: number) {
    if (this.element.nativeElement.attributes['disabled']) {
      console.log(
        'classification selector - yeah it is disabled here goes e.target',
        e
      );
      return;
    }

    if (
      this._currentClsGroupIndex() != -1 &&
      this._currentClsGroupIndex() != clsGroupIndex
    ) {
      this.ResetProps();
    }

    if (this._dataSliderStatus() == 'none') {
      this._dataSliderStatus.set('block');
      this.PopulateDataSet(clsGroupIndex);
    }
    this._cursorInCorD.set('C');
    this.codeInputs
      .toArray()
      [this._currentClsGroupIndex()].nativeElement.focus();
  }

  private PopulateDataSet(clsGroupIndex: number) {
    const masterControlData = JSON.parse(
      localStorage.getItem('PROMPT_MasterControlData') || '{}'
    );

    if (masterControlData)
      this._pageSize.set(
        masterControlData.AllowPaging === '1'
          ? masterControlData.PageSize
          : masterControlData.ExtendedPageSize
      );

    this._stillDataLoading.set(true);

    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    const APIArgs = JSON.stringify({
      selectedIndex: clsGroupIndex,
      selector: this.selector(),
      activeStatus: this.activeStatus(),
    });

    this.clsBusy.add(
      this.http
        .post(this.siteName() + '/api/Prompt/GetMasterValues', APIArgs, {
          headers: headers,
        })
        .pipe(
          map((data: any) => data),
          catchError((error) => {
            console.error(
              'this is from classification selector list prompts',
              error,
              APIArgs
            );
            return of(null);
          })
        )
        .subscribe(
          (data) => {
            this._dataSet.set(data);
            this._originalDataSet.set(data);
            this.totalPages.set(
              Math.ceil((data?.length || 0) / this._pageSize())
            );
            this.currentPage.set(1);
          },
          (error) => {
            console.error(
              'this is from classification selector list prompts',
              error,
              APIArgs
            );
          },
          () => {
            this._stillDataLoading.set(false);
          }
        )
    );
    this._currentClsGroupIndex.set(clsGroupIndex);
    this.AddEvent();
  }

  private FilterSource() {
    const currentFilteration = this.selector()[this._currentClsGroupIndex()];

    let FilterColumn = '';
    let FilterValue = '';

    if (this._cursorInCorD() == 'C') {
      FilterColumn = 'masterGroupValue';
      FilterValue = currentFilteration.txtCode.toString().toUpperCase();
    } else {
      FilterColumn = 'masterGroupValueDescription';
      FilterValue = currentFilteration.txtDesc.toString().toUpperCase();
    }

    if (this._originalDataSet() != null) {
      const filteredData = this._originalDataSet().filter((row: any) => {
        if (FilterColumn && FilterValue) {
          return (
            row[FilterColumn].toString().toUpperCase().indexOf(FilterValue) > -1
          );
        } else {
          return true;
        }
      });
      this._dataSet.set(filteredData);
      this.totalPages.set(
        Math.ceil((filteredData?.length || 0) / this._pageSize())
      );
      this.scrollDiv.nativeElement.scrollTop = 0;
    }
  }

  private ResetProps() {
    this._dataSet.set(null);
    this._dataSliderStatus.set('none');
    this._dataSet.set(null);
    this._originalDataSet.set(null);
    this._currentClsGroupIndex.set(-1);
    this._codeEmptied.set(false);
    this._descEmptied.set(false);
    this.currentPage.set(1);
  }

  private SetModel(item: any) {
    this.promptIndex = this._currentClsGroupIndex();
    const newSelector = [...this.selector()];

    if (item) {
      if (
        this.codes.at(this._currentClsGroupIndex()).value.trim() !=
        item['MasterGroupValue'].trim()
      ) {
        this.clearChildValues();
      }

      this.codes
        .at(this._currentClsGroupIndex())
        .setValue(item['masterGroupValue'].trim());
      this.descriptions
        .at(this._currentClsGroupIndex())
        .setValue(item['masterGroupValueDescription'].trim());
      newSelector[this._currentClsGroupIndex()].LatestText =
        item['masterGroupValue'].trim();
      newSelector[this._currentClsGroupIndex()].ErrorMessage = undefined;

      if (newSelector[this._currentClsGroupIndex()].HierarchyRequired == '1') {
        this.autoFillHirarchy('withActiveStatus');
      }
    } else {
      this.codes.at(this._currentClsGroupIndex()).setValue('');
      this.descriptions.at(this._currentClsGroupIndex()).setValue('');
      this.clearChildValues();
    }

    this.selector.set(newSelector);
    this.onValueChange(this._currentClsGroupIndex());
    this.onChange.emit();
  }

  private get isEmpty(): boolean {
    const currentFilteration = this.selector()[this._currentClsGroupIndex()];
    const FirstfilterValue = this.codes.at(this._currentClsGroupIndex()).value;
    const SecondfilterValue = this.descriptions.at(
      this._currentClsGroupIndex()
    ).value;

    if (this._cursorInCorD() == 'C') return !FirstfilterValue;
    else if (this._cursorInCorD() == 'D') return !SecondfilterValue;
    else return true;
  }

  private AddEvent() {
    const handleClick = (e: Event) => {
      setTimeout(() => {
        if (!this.element.nativeElement.contains(e.target)) {
          if (this._dataSliderStatus() == 'block') {
            if (!this.isEmpty) {
              this.FilterSource();
              const item =
                this._dataSet() && this._dataSet().length > 0
                  ? this._dataSet()[0]
                  : null;
              this.SetModel(item);
            } else {
              this.SetModel(null);
            }
          }
          this.ResetProps();
          window.removeEventListener('click', handleClick);
        }
      }, 0);
    };
    window.removeEventListener('click', handleClick);
    window.addEventListener('click', handleClick);
  }

  ItemSelected(item: any) {
    this.SetModel(item);
    this.ResetProps();
  }

  ClearModel(index: number) {
    this.SetModel(null);
    this.FilterSource();
    this.codeInputs.toArray()[index].nativeElement.focus();
  }

  public get valid() {
    if (this._dataSliderStatus() == 'block') return false;
    else return this._valid();
  }

  // V3001 Adding end

  public clearChildValues(): void {
    if (
      this.promptIndex < this.selector().length - 1 &&
      this.selector()[this.promptIndex + 1].HierarchyRequired == '1'
    ) {
      for (let i = this.promptIndex + 1; i < this.selector().length; i++) {
        if (this.selector()[i].HierarchyRequired == '1') {
          this.codes.at(i).setValue('');
          this.descriptions.at(i).setValue('');
          this.selector()[i].LatestText = '';
        }
      }
    }
  }

  public autoFillHirarchy(type: string): void {
    let apiUrl =
      this.siteName() +
      '/api/Prompt/GetMasterGroupValuesHirarchy?MasterGroup=' +
      this.selector()[this.promptIndex].MasterGroup +
      '&Code=' +
      this.codes.at(this.promptIndex).value.trim();
    if (type == 'withActiveStatus') {
      apiUrl = apiUrl + '&ActiveStatus=' + this.activeStatus();
    }

    this.clsBusy.add(
      this.http
        .get(apiUrl)
        .pipe(
          map((data: any) => data),
          catchError((error) => {
            console.log(error);
            return of(null);
          })
        )
        .subscribe(
          (data) => {
            if (data) {
              const groupValuesHirarchy = data;

              const newSelector = [...this.selector()];
              for (let i = 0; i < newSelector.length; i++) {
                const obj1 = this.getMasterGroupObj(
                  groupValuesHirarchy,
                  newSelector[i].MasterGroup.toString()
                );
                if (obj1 != null) {
                  this.codes.at(i).setValue(obj1['masterGroupValue'].trim());
                  this.descriptions
                    .at(i)
                    .setValue(obj1['masterGroupValueDescription'].trim());
                  newSelector[i].ErrorMessage = undefined;
                  newSelector[i].LatestText = obj1['masterGroupValue'].trim();
                } else {
                  this.codes.at(i).setValue('');
                  this.descriptions.at(i).setValue('');
                  newSelector[i].LatestText = '';
                }
              }
              this.selector.set(newSelector);
              this.validate();
            }
          },
          (err) => {
            console.log(err);
          }
        )
    );
  }

  public getMasterGroupObj(array: any[], masterGroup: string): any {
    for (let i = 0; i < array.length; i++) {
      if (array[i].MasterGroup.trim() == masterGroup.trim()) {
        return array[i];
      }
    }
    return null;
  }

  public onValueChange(index: number): void {
    const newSelector = [...this.selector()];
    const codeValue = this.codes.at(index).value;

    if (this.allMandatory == 'true') {
      if (codeValue == '') {
        newSelector[index].ErrorMessage = '*';
      } else {
        newSelector[index].ErrorMessage = undefined;
      }
    }

    if (this.lastLevelRequired() == 'true') {
      if (index == newSelector.length - 1) {
        if (codeValue == '') {
          newSelector[index].ErrorMessage = '*';
        } else {
          newSelector[index].ErrorMessage = undefined;
        }
      }
    }

    this.selector.set(newSelector);
    this.validate();
  }

  public validate(): void {
    const newSelector = [...this.selector()];

    for (let i = 0; i < newSelector.length; i++) {
      const codeValue = this.codes.at(i).value;

      if (this.allMandatory == 'true') {
        if (codeValue.trim() == '') {
          newSelector[i].ErrorMessage = '*';
        } else {
          newSelector[i].ErrorMessage = undefined;
        }
      } else {
        if (codeValue.trim() == '') {
          newSelector[i].ErrorMessage = undefined;
        }
      }
    }

    if (this.lastLevelRequired() == 'true') {
      const last = newSelector.length - 1;
      const lastCodeValue = this.codes.at(last).value;

      if (lastCodeValue == '') {
        newSelector[last].ErrorMessage = '*';
      } else if (
        lastCodeValue != '' &&
        newSelector[last].ErrorMessage != undefined
      ) {
        // Do nothing
      } else {
        newSelector[last].ErrorMessage = undefined;
      }
    }

    for (let j = 0; j < newSelector.length; j++) {
      if (newSelector[j].ErrorMessage != undefined) {
        this._valid.set(false);
        this.selector.set(newSelector);
        return;
      }
    }

    this._valid.set(true);
    this.selector.set(newSelector);
  }

  public getSelectedClassifications(): any[] {
    const result: any[] = [];

    for (let i = 0; i < this.selector().length; i++) {
      const codeValue = this.codes.at(i).value;
      if (codeValue.trim() != '') {
        result.push({
          Index: i,
          GroupCode: this.list[i].MasterGroup.trim(),
          GroupDescription: this.list[i].GroupDescription.trim(),
          GroupType: this.list[i].GroupType.trim(),
          GroupTypeDescription: this.list[i].GroupType.trim(),
          HasHirarchy: this.list[i].HierarchyRequired.trim(),
          ValueCode: codeValue.trim(),
          ValueDescription: this.descriptions.at(i).value.trim(),
        });
      }
    }

    if (result.length == 0) {
      if (this.selectedClassifications.length > 0) {
        return this.selectedClassifications;
      }
    }
    return result;
  }

  public setSelectedClassifications(array: any[]): void {
    if (array) {
      this.selectedClassifications = array;
      this.applySelectedClassifications(array);
    }
  }

  public applySelectedClassifications(array: any[]): void {
    this.cleanSelector();

    const newSelector = [...this.selector()];
    for (let i = 0; i < array.length; i++) {
      for (let j = 0; j < newSelector.length; j++) {
        if (newSelector[j].MasterGroup.trim() == array[i].GroupCode.trim()) {
          this.codes.at(j).setValue(array[i].ValueCode.trim());
          this.descriptions.at(j).setValue(array[i].ValueDescription.trim());
          newSelector[j].LatestText = '';
        }
      }
    }
    this.selector.set(newSelector);
    this.validate();
  }

  public cleanSelector() {
    const newSelector = [...this.selector()];
    for (let i = 0; i < newSelector.length; i++) {
      this.codes.at(i).setValue('');
      this.descriptions.at(i).setValue('');
      newSelector[i].ErrorMessage = undefined;
      newSelector[i].LatestText = '';
    }
    this.selector.set(newSelector);
  }
}
