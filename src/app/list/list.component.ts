import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  inject,
  signal,
  computed,
} from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
} from '@angular/forms';
import { Subscription, tap, catchError, of } from 'rxjs';

// Services
import { CommonService } from '../common.service';
import { ExecutiveService } from '../executive.service';

// Updated Components
// Import your updated components
import { XontVenturaMessagePromptComponent } from '../xont-ventura-message-prompt/xont-ventura-message-prompt.component';
import { XontVenturaCollapsibleComponent } from '../xont-ventura-collapsible/xont-ventura-collapsible.component';
import { ListPromptComponent } from 'xont-ventura-list-prompt';
import { XontVenturaClassificationSelectorComponent } from '../xont-ventura-classification-selector/xont-ventura-classification-selector.component';
import { XontVenturaGridExportComponent } from '../xont-ventura-gridexport/xont-ventura-gridexport.component';
import { XontVenturaGridLoaderComponent } from '../xont-ventura-gridloader/xont-ventura-gridloader.component';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// Types
interface SelectionCriteria {
  ExecutiveCode: string;
  ExecutiveName: string;
  TerritoryCode: string;
  TerritoryDesc: string;
  OperationType: string;
  OperationTypeDesc: string;
  Executive1: string;
  Executive1Name: string;
  Executive2: string;
  Executive2Name: string;
  Executive3: string;
  Executive3Name: string;
  Executive4: string;
  Executive4Name: string;
  Executive5: string;
  Executive5Name: string;
  SearchType: 'startWith' | 'anyWhere';
  ActiveOnly: boolean;
  FirstRow: number;
  LastRow: number;
  Collapsed: boolean;
}

interface Executive {
  ExecutiveCode: string;
  ExecutiveName: string;
  UserProfileName: string;
  TerritoryName: string;
  OperationTypeDesc: string;
  Status: number;
}

@Component({
  selector: 'my-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.css'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    XontVenturaMessagePromptComponent,
    XontVenturaCollapsibleComponent,
    ListPromptComponent,
    XontVenturaClassificationSelectorComponent,
    XontVenturaGridExportComponent,
    XontVenturaGridLoaderComponent,
    CommonModule,
  ],
})
export class ListComponent implements OnInit, AfterViewInit {
  // Dependency Injection
  private http = inject(HttpClient);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private commonService = inject(CommonService);
  private executiveService = inject(ExecutiveService);

  // Form Group
  searchForm: FormGroup;

  // View Children
  @ViewChild('msgPrompt') msgPrompt!: XontVenturaMessagePromptComponent;
  @ViewChild('gridLoader') gridLoader!: XontVenturaGridLoaderComponent;
  @ViewChild('clsExecutive')
  clsExecutive!: XontVenturaClassificationSelectorComponent;
  @ViewChild('lpmtOptType') lpmtOptType!: ListPromptComponent;

  // Classification Selector Configuration
  cls1 = {
    ID: 'clsExecutive',
    Type: '03',
    TaskCode: 'SOMNT01',
    LabelWidth: '120px',
    EnableUserInput: 'false',
    CodeTextWidth: '120px',
    DescriptionTextWidth: '320px',
    ActiveStatus: 'All',
    AllMandatory: 'false',
    LastLevelRequired: 'false',
    Enabled: 'true',
  };

  // Excel Export Configuration
  export1 = 'executiveExport1';
  gridID1 = 'tblExecutive';
  gridName1 = 'Executive';

  // Signals for reactive state
  executiveDataset = signal<Executive[]>([]);
  isLoading = signal(false);
  isInitialLoad = signal(true);

  // Computed properties
  hasData = computed(() => this.executiveDataset().length > 0);
  noDataFound = computed(() => !this.isLoading() && !this.hasData());

  // Pagination
  rowsOnPage = 10;
  sortBy = 'ExecutiveCode';
  sortOrder = 'asc';

  busy?: Subscription;

  constructor() {
    // Initialize form with default values
    this.searchForm = this.fb.group({
      ExecutiveCode: [''],
      ExecutiveName: [''],
      TerritoryCode: [''],
      TerritoryDesc: [''],
      OperationType: [''],
      OperationTypeDesc: [''],
      SearchType: ['startWith'],
      ActiveOnly: [true],
    });
  }

  ngOnInit(): void {
    this.loadStoredCriteria();
  }

  ngAfterViewInit(): void {
    // Load data after view initialization
    setTimeout(() => {
      if (this.isInitialLoad()) {
        this.loadExecutives(true);
      }
    }, 0);
  }

  private loadStoredCriteria(): void {
    const storedCriteria = localStorage.getItem('SOMNT01_SelectionCriteria');
    const storedExecutiveLevels = localStorage.getItem(
      'SOMNT01_ExecutiveLevels'
    );

    if (storedCriteria) {
      try {
        const criteria = JSON.parse(storedCriteria);
        this.searchForm.patchValue(criteria);
      } catch (e) {
        console.warn('Failed to parse stored selection criteria');
        localStorage.removeItem('SOMNT01_SelectionCriteria');
      }
    }

    if (storedExecutiveLevels && this.clsExecutive) {
      try {
        const clsExeArr: any[] = JSON.parse(storedExecutiveLevels);
        if (clsExeArr && clsExeArr.length > 0) {
          this.clsExecutive.setSelectedClassifications(clsExeArr);
        }
      } catch (e) {
        console.warn('Failed to parse stored executive levels');
        localStorage.removeItem('SOMNT01_ExecutiveLevels');
      }
    }
  }

  // Form control getters for easier template access
  get ExecutiveCode(): FormControl {
    return this.searchForm.get('ExecutiveCode') as FormControl;
  }

  get ExecutiveName(): FormControl {
    return this.searchForm.get('ExecutiveName') as FormControl;
  }

  get TerritoryCode(): FormControl {
    return this.searchForm.get('TerritoryCode') as FormControl;
  }

  get TerritoryDesc(): FormControl {
    return this.searchForm.get('TerritoryDesc') as FormControl;
  }

  get OperationType(): FormControl {
    return this.searchForm.get('OperationType') as FormControl;
  }

  get OperationTypeDesc(): FormControl {
    return this.searchForm.get('OperationTypeDesc') as FormControl;
  }

  get SearchType(): FormControl {
    return this.searchForm.get('SearchType') as FormControl;
  }

  get ActiveOnly(): FormControl {
    return this.searchForm.get('ActiveOnly') as FormControl;
  }

  ChangeSearchType(entry: 'startWith' | 'anyWhere'): void {
    this.SearchType.setValue(entry);
  }

  lpmtOptType_DataBind(): void {
    this.lpmtOptType.dataSourceObservable =
      this.executiveService.getOptTypePrompt();
  }

  loadExecutives(isInit: boolean): void {
    if (!this.gridLoader) return;

    this.isLoading.set(true);
    this.isInitialLoad.set(false);

    // Save current state
    this.saveCurrentState();

    // Initialize grid loader
    this.gridLoader.init('SOMNT01');
    this.rowsOnPage = this.gridLoader.getPageSize();

    // Set pagination
    if (isInit) {
      this.gridLoader.setCurrentPage(1);
      this.updatePagination(1, this.gridLoader.getLoadSize());
    } else {
      this.updatePagination(
        this.gridLoader.getRowStart(),
        this.gridLoader.getRowEnd()
      );
    }

    // Prepare request data
    const requestData = this.prepareRequestData();

    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    this.busy = this.http
      .post<any>(
        `${this.siteName()}/api/SOMNT01/GetAllExecutive`,
        requestData,
        { headers }
      )
      .pipe(
        tap((response) => {
          this.executiveDataset.set(response[0] || []);
          this.gridLoader.setRowCount(response[1] || 0);
        }),
        catchError((err) => {
          this.showError(err);
          this.executiveDataset.set([]);
          return of([]);
        })
      )
      .subscribe(() => {
        this.isLoading.set(false);
      });
  }

  private saveCurrentState(): void {
    localStorage.setItem(
      'SOMNT01_SelectionCriteria',
      JSON.stringify(this.searchForm.value)
    );

    const clsExeArr = this.clsExecutive.getSelectedClassifications();
    localStorage.setItem('SOMNT01_ExecutiveLevels', JSON.stringify(clsExeArr));
  }

  private updatePagination(firstRow: number, lastRow: number): void {
    // Update form with pagination values if needed
    const currentValue = this.searchForm.value;
    this.searchForm.patchValue({
      ...currentValue,
      FirstRow: firstRow,
      LastRow: lastRow,
    });
  }

  private prepareRequestData(): any {
    const formValue = this.searchForm.value;
    const clsExeArr = this.clsExecutive.getSelectedClassifications();

    const selectedClassifications = clsExeArr.map((item) => ({
      ParameterCode: item.GroupCode,
      ParameterValue: item.ValueCode,
    }));

    // Update executive levels from classifications
    this.updateExecutiveLevels(clsExeArr);

    return {
      SelectionCriteria: formValue,
      SelectedClassifications: selectedClassifications,
    };
  }

  private updateExecutiveLevels(clsExeArr: any[]): void {
    const levels = [
      'Executive1',
      'Executive2',
      'Executive3',
      'Executive4',
      'Executive5',
    ];
    const updates: any = {};

    // Reset all levels first
    levels.forEach((level) => {
      updates[level] = '';
      updates[`${level}Name`] = '';
    });

    // Set values from classifications
    clsExeArr.forEach((item) => {
      if (item.Index >= 0 && item.Index < levels.length && item.ValueCode) {
        const levelKey = levels[item.Index];
        updates[levelKey] = item.ValueCode;
        updates[`${levelKey}Name`] = item.ValueDescription || '';
      }
    });

    this.searchForm.patchValue(updates, { emitEvent: false });
  }

  // Navigation methods
  newBasedOn_OnClick(item: Executive): void {
    this.navigateToForm('newBasedOn', item.ExecutiveCode, item.ExecutiveName);
  }

  edit_OnClick(item: Executive): void {
    this.navigateToForm('edit', item.ExecutiveCode, item.ExecutiveName);
  }

  btnNew_OnClick(): void {
    this.navigateToForm('new', '', '');
  }

  private navigateToForm(
    mode: string,
    executiveCode: string,
    executiveName: string
  ): void {
    localStorage.setItem(
      'SOMNT01_PageInit',
      JSON.stringify({
        Mode: mode,
        ExecutiveCode: executiveCode.trim(),
        ExecutiveName: executiveName.trim(),
      })
    );
    this.router.navigate(['new']);
  }

  gridLoader_OnChange(): void {
    this.loadExecutives(false);
  }

  onSearch(): void {
    this.loadExecutives(true);
  }

  onReset(): void {
    this.searchForm.reset({
      SearchType: 'startWith',
      ActiveOnly: true,
    });
    this.clsExecutive.cleanSelector();
    this.executiveDataset.set([]);
  }

  siteName(): string {
    return this.commonService.getAPIPrefix();
  }

  showError(err: any): void {
    this.msgPrompt.show(err.error || err, 'SOMNT01');
  }

  // Sorting functionality
  onSort(column: string): void {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortOrder = 'asc';
    }
    this.sortData();
  }

  private sortData(): void {
    const data = [...this.executiveDataset()];
    data.sort((a, b) => {
      const valueA = a[this.sortBy as keyof Executive];
      const valueB = b[this.sortBy as keyof Executive];

      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return this.sortOrder === 'asc'
          ? valueA.localeCompare(valueB)
          : valueB.localeCompare(valueA);
      }

      return this.sortOrder === 'asc'
        ? (valueA as number) - (valueB as number)
        : (valueB as number) - (valueA as number);
    });

    this.executiveDataset.set(data);
  }

  // TrackBy function for better performance
  trackByExecutiveCode(index: number, item: Executive): string {
    return item.ExecutiveCode;
  }
  closeTab(): void {
    window.parent.postMessage({ action: 'closeTab' }, 'http://localhost:4752');
  }
}
