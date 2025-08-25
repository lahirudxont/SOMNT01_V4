import {
  Component,
  ViewChild,
  OnInit,
  AfterViewInit,
  OnDestroy,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CommonService } from '../common.service';
import { ExecutiveService } from '../executive.service';
import { XontVenturaClassificationSelectorComponent } from '../xont-ventura-classification-selector/xont-ventura-classification-selector.component';
import { ListPromptComponent } from 'xont-ventura-list-prompt';
import { CommonModule } from '@angular/common';
import { XontVenturaCollapsibleComponent } from '../xont-ventura-collapsible/xont-ventura-collapsible.component';
import { XontVenturaMessagePromptComponent } from '../xont-ventura-message-prompt/xont-ventura-message-prompt.component';
import { XontVenturaGridLoaderComponent } from '../xont-ventura-gridloader/xont-ventura-gridloader.component';

export interface IExecutive {
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
  imports: [
    XontVenturaClassificationSelectorComponent,
    ListPromptComponent,
    CommonModule,
    ReactiveFormsModule,
    XontVenturaCollapsibleComponent,
    XontVenturaMessagePromptComponent,
    XontVenturaGridLoaderComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  standalone: true,
})
export class ListComponent implements OnInit, AfterViewInit, OnDestroy {
  // --- ViewChild References ---
  @ViewChild('msgPrompt') msgPrompt: any;
  @ViewChild('gridLoader') gridLoader: any;
  @ViewChild('clsExecutive') clsExecutive: any;
  @ViewChild('lpmtOptType') lpmtOptType: any;

  // --- Component State ---
  isLoading = false;
  busy: Subscription | undefined;
  executiveDataset: IExecutive[] = [];
  searchForm: FormGroup;
  private destroy$ = new Subject<void>();

  // --- Grid Configuration ---
  rowsOnPage = 10;
  sortBy = 'ExecutiveCode';
  sortOrder = 'asc';

  // --- Configuration for Custom Components ---
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

  constructor(
    private http: HttpClient,
    private router: Router,
    private commonService: CommonService,
    private executiveService: ExecutiveService,
    private fb: FormBuilder
  ) {
    this.searchForm = this.fb.group({
      ExecutiveCode: [''],
      ExecutiveName: [''],
      // Group for the custom territory prompt component
      Territory: this.fb.group({
        TerritoryCode: [''],
        TerritoryDesc: [''],
      }),
      // Group for the custom operation type prompt component
      OperationTypeGroup: this.fb.group({
        OperationType: [''],
        OperationTypeDesc: [''],
      }),
      Executive1: [''],
      Executive2: [''],
      Executive3: [''],
      Executive4: [''],
      Executive5: [''],
      SearchType: ['startWith'],
      ActiveOnly: [true],
      FirstRow: [0],
      LastRow: [0],
      Collapsed: [false],
    });
  }

  ngOnInit(): void {
    this.executiveService.componentMethodCalled$
      .pipe(takeUntil(this.destroy$))
      .subscribe((error: any) => {
        if (this.msgPrompt) {
          this.msgPrompt.show(error, 'SOMNT01');
        }
      });
  }

  ngAfterViewInit(): void {
    this.loadCriteriaFromStorage();
    // Use setTimeout to ensure child components are fully initialized before listing
    setTimeout(() => this.list(true), 0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.busy) {
      this.busy.unsubscribe();
    }
  }

  private loadCriteriaFromStorage(): void {
    const storedCriteria = localStorage.getItem('SOMNT01_SelectionCriteria');
    if (storedCriteria) {
      try {
        this.searchForm.patchValue(JSON.parse(storedCriteria));
      } catch (e) {
        console.warn(
          'Failed to parse stored selection criteria from localStorage.'
        );
        localStorage.removeItem('SOMNT01_SelectionCriteria');
      }
    }

    const storedExecutiveLevels = localStorage.getItem(
      'SOMNT01_ExecutiveLevels'
    );
    if (storedExecutiveLevels) {
      try {
        const clsExeArr: any[] = JSON.parse(storedExecutiveLevels);
        if (clsExeArr?.length > 0 && this.clsExecutive) {
          this.clsExecutive.setSelectedClassifications(clsExeArr);
        }
      } catch (e) {
        console.warn(
          'Failed to parse stored executive levels from localStorage.'
        );
        localStorage.removeItem('SOMNT01_ExecutiveLevels');
      }
    }
  }

  private siteName(): string {
    return this.commonService.getAPIPrefix();
  }

  // --- Data Listing ---
  list(isInit: boolean): void {
    if (!this.gridLoader) return;

    this.gridLoader.init('SOMNT01');
    this.rowsOnPage = this.gridLoader.getPageSize();

    this.updateExecutiveLevelsInForm();

    const formValues = this.searchForm.getRawValue();
    localStorage.setItem(
      'SOMNT01_SelectionCriteria',
      JSON.stringify(formValues)
    );

    const selectionCriteriaPayload = {
      ...formValues,
      TerritoryCode: formValues.Territory?.TerritoryCode || '',
      TerritoryDesc: formValues.Territory?.TerritoryDesc || '',
      OperationType: formValues.OperationTypeGroup?.OperationType || '',
      OperationTypeDesc: formValues.OperationTypeGroup?.OperationTypeDesc || '',
    };

    if (isInit) {
      this.gridLoader.setCurrentPage(1);
      selectionCriteriaPayload.FirstRow = 1;
      selectionCriteriaPayload.LastRow = this.gridLoader.getLoadSize();
    } else {
      selectionCriteriaPayload.FirstRow = this.gridLoader.getRowStart();
      selectionCriteriaPayload.LastRow = this.gridLoader.getRowEnd();
    }

    const clsExeArr = this.clsExecutive?.getSelectedClassifications() || [];
    const selectedClassifications = clsExeArr.map((cls: any) => ({
      ParameterCode: cls.GroupCode,
      ParameterValue: cls.ValueCode,
    }));

    const body = {
      SelectionCriteria: selectionCriteriaPayload,
      SelectedClassifications: selectedClassifications,
    };

    this.isLoading = true;

    // Unsubscribe previous subscription if exists
    if (this.busy) {
      this.busy.unsubscribe();
    }

    this.busy = this.http
      .post<[IExecutive[], number]>(
        `${this.siteName()}/api/SOMNT01/GetAllExecutive`,
        body
      )
      .subscribe({
        next: (response) => {
          this.executiveDataset = response[0] || [];
          this.gridLoader.setRowCount(response[1] || 0);
          this.isLoading = false;
        },
        error: (err) => {
          this.showError(err);
          this.isLoading = false;
        },
        complete: () => console.log('Executive list fetch complete.'),
      });
  }

  private updateExecutiveLevelsInForm(): void {
    const clsExeArr = this.clsExecutive?.getSelectedClassifications() || [];
    localStorage.setItem('SOMNT01_ExecutiveLevels', JSON.stringify(clsExeArr));

    const executiveUpdates: any = {
      Executive1: null,
      Executive2: null,
      Executive3: null,
      Executive4: null,
      Executive5: null,
    };

    if (clsExeArr?.length > 0) {
      clsExeArr.forEach((item: any) => {
        if (item.ValueCode != null) {
          switch (item.Index) {
            case 0:
              executiveUpdates.Executive1 = item.ValueCode;
              break;
            case 1:
              executiveUpdates.Executive2 = item.ValueCode;
              break;
            case 2:
              executiveUpdates.Executive3 = item.ValueCode;
              break;
            case 3:
              executiveUpdates.Executive4 = item.ValueCode;
              break;
            case 4:
              executiveUpdates.Executive5 = item.ValueCode;
              break;
          }
        }
      });
    }

    this.searchForm.patchValue(executiveUpdates, { emitEvent: false });
  }

  // --- Event Handlers ---
  gridLoader_OnChange(): void {
    this.list(false);
  }

  btnNew_OnClick(): void {
    localStorage.setItem(
      'SOMNT01_PageInit',
      JSON.stringify({ Mode: 'new', ExecutiveCode: '', ExecutiveName: '' })
    );
    this.router.navigate(['new']);
  }

  newBasedOn_OnClick(item: IExecutive): void {
    localStorage.setItem(
      'SOMNT01_PageInit',
      JSON.stringify({
        Mode: 'newBasedOn',
        ExecutiveCode: item.ExecutiveCode?.trim() || '',
        ExecutiveName: item.ExecutiveName?.trim() || '',
      })
    );
    this.router.navigate(['new']);
  }

  edit_OnClick(item: IExecutive): void {
    localStorage.setItem(
      'SOMNT01_PageInit',
      JSON.stringify({
        Mode: 'edit',
        ExecutiveCode: item.ExecutiveCode?.trim() || '',
        ExecutiveName: item.ExecutiveName?.trim() || '',
      })
    );
    this.router.navigate(['new']);
  }

  // --- Service Integrations ---
  lpmtOptType_DataBind(): void {
    if (this.lpmtOptType && this.executiveService) {
      this.lpmtOptType.dataSourceObservable =
        this.executiveService.getOptTypePrompt();
    }
  }

  toggleCollapse(): void {
    const currentValue = this.searchForm.get('Collapsed')?.value;
    this.searchForm.get('Collapsed')?.setValue(!currentValue);
  }

  // --- Utility ---
  showError(err: HttpErrorResponse): void {
    const errorContent =
      err.error?.message || err.message || 'An unexpected error occurred.';
    if (this.msgPrompt) {
      this.msgPrompt.show(errorContent, 'SOMNT01');
    } else {
      console.error('Error:', errorContent);
    }
  }

  trackByExecutive(index: number, item: IExecutive): string {
    return item.ExecutiveCode;
  }
}
