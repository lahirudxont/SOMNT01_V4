import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  inject,
  signal,
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators,
  ReactiveFormsModule,
  FormArray,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Subscription, Observable, of } from 'rxjs';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Services
import { DatetimeService } from '../datetime.service';
import { CommonService } from '../common.service';
import { ExecutiveService } from '../executive.service';

// Components
import { XontVenturaMessagePromptComponent } from '../xont-ventura-message-prompt/xont-ventura-message-prompt.component';
import { ListPromptComponent } from 'xont-ventura-list-prompt';
import { XontVenturaClassificationSelectorComponent } from '../xont-ventura-classification-selector/xont-ventura-classification-selector.component';
import { XontVenturaDatepickerComponent } from '../xont-ventura-datepicker/xont-ventura-datepicker.component';

// Interfaces
interface SaveAllRequest {
  Mode: string;
  ExecutiveProfile: any;
  Stock: any;
  Hierarchy: any;
  Other: any;
  Merchandizing: any;
  ExecutiveClassificationList: any[];
  MarketingHierarchyClassificationList: any[];
  GeoClassificationList: any[];
  ReturnLocationList: any[];
}

interface SelectedClassification {
  groupCode: string;
  groupDescription?: string;
  valueCode: string;
  valueDescription: string;
}

interface ExecutiveData {
  businessUnit: string;
  executiveCode: string;
  executiveName: string;
  executiveGroup: string;
  operationType: string;
  operationTypeDesc: string;
  userName: string;
  password: string;
  passwordExpiry: string;
  passwordReset: string;
  userLocked: number;
  authorityLevel: string;
  newRetailerType: string;
  imeiNumber: string;
  validateIMEI: number;
  mobileNumbers: string;
  emailAddress: string;
  status: string;
  timeStamp: string;
  isValidateOperationType: boolean;
  creditLimitValidation: string;
  allowPriceChange: string;
  cashCustomerOnly: string;
  gisExecutive: string;
  creditLimit: number;
  commissionPercentage: string;
  mappingExecutiveCode: string;
  surveyRecurrence: string;
  lastSurveyDate: string;
  surveyActiveDate: string;
  cashLimit: number;
  lastGRNNo: number;
  lastOrderNo: number;
  lastRetailerNo: number;
  autoTMRouteCode: string;
  tmpsaCodePrefix: string;
  nextTMPSANo: number;
  executiveType: string;
  parentExecutiveCode: string;
  parentExecutiveName: string;
  parentExecutiveType: string;
  applicationUserName: string;
  hierarchyGroup: string;
  hierarchyGroupDesc: string;
  costCenterCode: string;
  costCenterDesc: string;
  onlineExecutive: string;
  hierarchyTimeStamp: string;
  defaultTerritory: string;
  defaultSalesCategoryCode: string;
  defaultSalesCategoryDesc: string;
  defaultSalesLocationCode: string;
  defaultSalesWarehouseCode: string;
  defaultStockWarehouse: string;
  defaultStockLocation: string;
  defaultReturnWarehouse: string;
  defaultReturnLocation: string;
  defaultInspectionWarehouse: string;
  defaultInspectionLocation: string;
  defaultSpecialWarehouse: string;
  defaultSpecialLocation: string;
  defaultUnloadingWarehouse: string;
  defaultUnloadingLocation: string;
  stockTerritory: string;
  stockTerritoryDesc: string;
  defEmpCatCode: string;
  defEmpCatDesc: string;
  applicationType: string;
  recID: number;
  orderPrefix: null;
  bankingFrequency: number;
  distributorPath: string;
  downloadUplloadExist: number;
  dsnName: string;
  encryptedPassword: null;
  hierarchyType: string;

  hhuCode: string;
  intermedeatePath: string;
  path: string;
  lockedBy: string;
  lockedOn: string;
  updatedBy: null;
  userFullName: null;
  userID: string;
  incenScheme: string;
  incenSchemeDesc: string;
}

// Custom Validators
function passwordMatchValidator(
  control: AbstractControl
): ValidationErrors | null {
  const password = control.get('Password');
  const confirmPassword = control.get('ConfirmPassword');
  if (password && confirmPassword && password.value !== confirmPassword.value) {
    confirmPassword.setErrors({ mismatch: true });
    return { mismatch: true };
  } else {
    if (confirmPassword?.hasError('mismatch')) {
      confirmPassword.setErrors(null);
    }
  }
  return null;
}

function imeiValidator(control: AbstractControl): ValidationErrors | null {
  const chkValIMEI = control.get('chkValIMEI')?.value;
  const imei = control.get('IMEINo')?.value;
  if (chkValIMEI && (!imei || imei.trim() === '')) {
    const imeiControl = control.get('IMEINo');
    if (imeiControl) {
      imeiControl.setErrors({ required: true });
    }
    return { imeiRequired: true };
  } else {
    const imeiControl = control.get('IMEINo');
    if (imeiControl?.hasError('required') && !chkValIMEI) {
      imeiControl.setErrors(null);
    }
  }
  return null;
}

@Component({
  selector: 'app-executive-new',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.css'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    XontVenturaMessagePromptComponent,
    ListPromptComponent,
    XontVenturaClassificationSelectorComponent,
    XontVenturaDatepickerComponent,
  ],
})
export class NewComponent implements OnInit, AfterViewInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly datetimeService = inject(DatetimeService);
  private readonly commonService = inject(CommonService);
  private readonly executiveService = inject(ExecutiveService);
  private readonly cdr = inject(ChangeDetectorRef);

  // Form
  executiveForm!: FormGroup;

  // ViewChild references
  @ViewChild('msgPrompt') msgPrompt!: XontVenturaMessagePromptComponent;
  @ViewChild('clsExecutive')
  clsExecutive!: XontVenturaClassificationSelectorComponent;
  @ViewChild('clsGeo') clsGeo!: XontVenturaClassificationSelectorComponent;
  @ViewChild('lpmtOptType') lpmtOptType!: ListPromptComponent;
  @ViewChild('lpmtIncentiveGroup')
  lpmtIncentiveGroup!: ListPromptComponent;
  @ViewChild('lpmtUserProfile')
  lpmtUserProfile!: ListPromptComponent;
  @ViewChild('lpmtCostCenter') lpmtCostCenter!: ListPromptComponent;
  @ViewChild('lpmtParameterGroup')
  lpmtParameterGroup!: ListPromptComponent;
  @ViewChild('lpmtLoginUser') lpmtLoginUser!: ListPromptComponent;
  @ViewChild('lpmtUnloadingLocation')
  lpmtUnloadingLocation!: ListPromptComponent;
  @ViewChild('lpmtSalesLocation') lpmtSalesLocation!: ListPromptComponent;
  @ViewChild('lpmtDefEmptyCategory') lpmtDefEmptyCategory!: ListPromptComponent;
  @ViewChild('lpmtStockLocation') lpmtStockLocation!: ListPromptComponent;
  @ViewChild('lpmtSpecialLocation') lpmtSpecialLocation!: ListPromptComponent;
  @ViewChild('lpmtInspectionLocation')
  lpmtInspectionLocation!: ListPromptComponent;
  @ViewChild('lpmtDefSaleCategory')
  lpmtDefSaleCategory!: ListPromptComponent;
  @ViewChild('lpmtDamageLocation')
  lpmtDamageLocation!: ListPromptComponent;

  // Classification configurations
  readonly cls1 = {
    ID: 'clsExecutive',
    Type: '03',
    TaskCode: 'SOMNT01',
    LabelWidth: '140px',
    EnableUserInput: 'false',
    CodeTextWidth: '120px',
    DescriptionTextWidth: '320px',
    ActiveStatus: 'Active',
    AllMandatory: 'true',
    LastLevelRequired: 'false',
    Enabled: 'true',
  };

  readonly cls2 = {
    ID: 'clsMarketingHierarchy',
    Type: '29',
    TaskCode: 'SOMNT01',
    LabelWidth: '140px',
    EnableUserInput: 'false',
    CodeTextWidth: '120px',
    DescriptionTextWidth: '320px',
    ActiveStatus: 'Active',
    AllMandatory: 'false',
    LastLevelRequired: 'false',
    Enabled: 'true',
  };

  readonly cls3 = {
    ID: 'clsGeo',
    Type: '00',
    TaskCode: 'SOMNT01',
    LabelWidth: '140px',
    EnableUserInput: 'false',
    CodeTextWidth: '120px',
    DescriptionTextWidth: '320px',
    ActiveStatus: 'Active',
    AllMandatory: 'true',
    LastLevelRequired: 'false',
    Enabled: 'true',
  };

  // Signals
  readonly isLoading = signal(false);
  readonly isEditMode = signal(false);
  readonly isNewBasedOnMode = signal(false);
  readonly hierarchyType = signal('');
  readonly returnTypes = signal<any[]>([]);

  // Data
  executivegroup: any[] = [];
  private pageInit: any = undefined;
  private executiveData: ExecutiveData | undefined = undefined;
  private subscriptions = new Set<Subscription>();
  public pnlReturn = { Visible: false };
  public pnlUserProfile = { Visible: true };
  public pnlStockDetails = { Visible: true };
  public pnlStockTerritory = { Visible: true };

  constructor() {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadPageInitialization();
  }

  ngAfterViewInit(): void {
    this.loadStoredData();
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    this.subscriptions.clear();
  }

  // Form getters
  get profile(): FormGroup {
    return this.executiveForm.get('profile') as FormGroup;
  }

  get stock(): FormGroup {
    return this.executiveForm.get('stock') as FormGroup;
  }

  get other(): FormGroup {
    return this.executiveForm.get('other') as FormGroup;
  }

  get merchandizing(): FormGroup {
    return this.executiveForm.get('merchandizing') as FormGroup;
  }

  get returnLocations(): FormArray {
    return this.executiveForm.get('returnLocations') as FormArray;
  }

  get ExecutiveCode(): FormControl {
    return this.profile.get('ExecutiveCode') as FormControl;
  }

  get ExecutiveName(): FormControl {
    return this.profile.get('ExecutiveName') as FormControl;
  }

  get CommissionPercentage(): FormControl {
    return this.other.get('CommissionPercentage') as FormControl;
  }

  private initializeForm(): void {
    this.executiveForm = this.fb.group({
      profile: this.fb.group(
        {
          ExecutiveCode: [
            '',
            [Validators.required, Validators.pattern('^[A-Za-z0-9_-]+$')],
          ],
          ExecutiveName: [
            '',
            [Validators.required, Validators.pattern('^[^&#"\';]*$')],
          ],
          ExecutiveGroup: ['1'],
          OperationType: ['', Validators.required],
          OperationTypeDesc: [''],
          IncentiveGroup: [''],
          IncentiveGroupDesc: [''],
          UserName: ['', Validators.pattern('^[a-zA-Z0-9]*$')],
          Password: [''],
          ConfirmPassword: [''],
          PasswordExpiry: [''],
          chkPasswordReset: [false],
          chkUserLocked: [false],
          AuthorityLevel: ['1'],
          RetailerType: ['0'],
          IMEINo: [''],
          chkValIMEI: [false],
          MobileNumbers: ['', Validators.pattern('^[0-9;\\d]*$')],
          EmailAddress: [
            '',
            Validators.pattern(
              '^(([a-zA-Z0-9_\\-\\.]+)@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.)|(([a-zA-Z0-9\\-]+\\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\\]?)(\\s*;\\s*|\\s*$))*$'
            ),
          ],
          chkActive: [true],
          UserProfile: [''],
          UserProfileName: [''],
          JoiningDate: [''],
          TerminationDate: [''],
          TimeStamp: [''],
          IsValidateOperationType: [true],
        },
        { validators: [passwordMatchValidator, imeiValidator] }
      ),
      stock: this.fb.group({
        StockTerritory: [''],
        StockTerritoryDesc: [''],
        DefSalesWarehouse: [''],
        DefSalesLocation: [''],
        DefSalesLocationDes: [''],
        DefStockWarehouse: [''],
        DefStockLocation: [''],
        DefStockLocationDes: [''],
        DefReturnWarehouse: [''],
        DefReturnLocation: [''],
        DefReturnLocationDes: [''],
        DefInspectionWarehouse: [''],
        DefInspectionLocation: [''],
        DefInspectionLocationDes: [''],
        DefSpecialWarehouse: [''],
        DefSpecialLocation: [''],
        DefSpecialLocationDes: [''],
        DefUnloadingWarehouse: [''],
        DefUnloadingLocation: [''],
        DefUnloadingLocationDes: [''],
        SalesCategoryCode: [''],
        SalesCategoryCodeDes: [''],
        DefEmptyTransactionCategory: [''],
        DefEmptyTransactionCategoryDesc: [''],
      }),
      other: this.fb.group({
        chkCreditLimitValidation: [false],
        CreditLimit: ['0.00', Validators.pattern('^[0-9.,]*$')],
        CommissionPercentage: [null],
        LastGRNNo: ['0', Validators.pattern('^[0-9]*$')],
        CashLimit: ['0.00', Validators.pattern('^[0-9.,]*$')],
        LastRetailerNo: ['0', Validators.pattern('^[0-9]*$')],
        LastOrderNo: ['0', Validators.pattern('^[0-9]*$')],
        SurveyRecurrence: [''],
        LastSurveyDate: [''],
        SurveyActiveDate: [''],
        chkAllowPriceChange: [false],
        chkCashCustomerOnly: [false],
        chkGISExecutive: [false],
        chkOnlineExecutive: [false],
        ParentExecutiveCode: [''],
        ParentExecutiveName: [''],
        ParentExecutiveType: [''],
        ExecutiveType: [''],
        MappingExecutiveCode: [''],
        ApplicationType: [''],
        AppUserName: [''],
        UserFullName: [''],
        Parameter: [''],
        ParameterDescription: [''],
        CostCenterCode: [''],
        CostCenterDesc: [''],
      }),
      merchandizing: this.fb.group({
        chkAutoTMRouteCode: [false],
        TMRouteCodePrefix: ['', Validators.pattern('^[A-Za-z0-9_-]*$')],
        NextTMRouteNo: [''],
      }),
      returnLocations: this.fb.array([]),
    });
  }

  private loadPageInitialization(): void {
    const storedPageInit = localStorage.getItem('SOMNT01_PageInit');
    if (!storedPageInit) {
      this.router.navigate(['list']);
      return;
    }

    try {
      this.pageInit = JSON.parse(storedPageInit);
      this.setFormMode(this.pageInit.mode);
      this.loadExecutiveGroups();

      if (this.isEditMode() || this.isNewBasedOnMode()) {
        this.loadExecutiveData();
      } else {
        this.initializeNewMode();
      }
    } catch (error) {
      console.error('Failed to parse page initialization data:', error);
      this.router.navigate(['list']);
    }
  }

  private setFormMode(mode: string): void {
    this.isEditMode.set(mode === 'edit');
    this.isNewBasedOnMode.set(mode === 'newBasedOn');
    if (mode === 'edit') {
      this.ExecutiveCode.disable();
    } else {
      this.ExecutiveCode.enable();
    }
  }

  private initializeNewMode(): void {
    this.profile.patchValue({ chkActive: true, IsValidateOperationType: true });
    this.LoadReturnLocations();
    this.GetHierarchyType();
  }

  private loadStoredData(): void {}

  private loadExecutiveGroups(): void {
    const sub = this.executiveService.getExecutiveGroups().subscribe({
      next: (data) => {
        this.executivegroup = data;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.showError(err);
      },
    });
    this.subscriptions.add(sub);
  }

  private loadExecutiveData(): void {
    this.isLoading.set(true);
    const sub = this.executiveService
      .getExecutiveData(this.pageInit.executiveCode.trim())
      .subscribe({
        next: (data: any) => {
          this.executiveData = data;
          this.populateFormData();
          this.isLoading.set(false);
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          this.showError(err);
          this.isLoading.set(false);
        },
      });
    this.subscriptions.add(sub);
  }

  private populateFormData(): void {
    if (!this.executiveData) return;

    const formatDateForUI = (dateStr: string | null | undefined): string => {
      if (!dateStr || dateStr === '1900-01-01T00:00:00') return '';
      try {
        const dateObj = new Date(dateStr);
        if (isNaN(dateObj.getTime())) return '';
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        const year = dateObj.getFullYear();
        return `${month}/${day}/${year}`;
      } catch (e) {
        console.error('Error formatting date:', dateStr, e);
        return '';
      }
    };

    let surveyRecurrenceDisplay = '';
    switch (this.executiveData.surveyRecurrence?.trim()) {
      case 'Y':
        surveyRecurrenceDisplay = 'Year';
        break;
      case 'M':
        surveyRecurrenceDisplay = 'Month';
        break;
      case 'W':
        surveyRecurrenceDisplay = 'Week';
        break;
      case 'D':
        surveyRecurrenceDisplay = 'Date';
        break;
      default:
        surveyRecurrenceDisplay = '';
    }

    // Populate Profile Tab
    this.profile.patchValue({
      ExecutiveCode: this.executiveData.executiveCode?.trim() || '',
      ExecutiveName: this.executiveData.executiveName?.trim() || '',
      ExecutiveGroup: this.executiveData.executiveGroup?.trim() || '1',
      OperationType: this.executiveData.operationType?.trim() || '',
      OperationTypeDesc: this.executiveData.operationTypeDesc?.trim() || '',
      IncentiveGroup: this.executiveData.incenScheme?.trim() || '',
      IncentiveGroupDesc: this.executiveData.incenSchemeDesc?.trim() || '',
      UserName: this.executiveData.userName?.trim() || '',
      PasswordExpiry: formatDateForUI(this.executiveData.passwordExpiry),
      chkPasswordReset: this.executiveData.passwordReset === '1',
      chkUserLocked: this.executiveData.userLocked === 1,
      AuthorityLevel: this.executiveData.authorityLevel?.trim() || '1',
      RetailerType: this.executiveData.newRetailerType?.trim() || '0',
      IMEINo: this.executiveData.imeiNumber?.trim() || '',
      chkValIMEI: this.executiveData.validateIMEI === 1,
      MobileNumbers: this.executiveData.mobileNumbers?.trim() || '',
      EmailAddress: this.executiveData.emailAddress?.trim() || '',
      chkActive: this.executiveData.status === '1',
      TimeStamp: this.executiveData.timeStamp?.trim() || '',
      IsValidateOperationType:
        this.executiveData.isValidateOperationType ?? true,
    });

    // Populate Stock Tab
    this.stock.patchValue({
      StockTerritory:
        this.executiveData.defaultTerritory?.trim() ||
        this.executiveData.stockTerritory?.trim() ||
        '',
      DefSalesWarehouse:
        this.executiveData.defaultSalesWarehouseCode?.trim() || '',
      DefSalesLocation:
        this.executiveData.defaultSalesLocationCode?.trim() || '',
      DefStockWarehouse: this.executiveData.defaultStockWarehouse?.trim() || '',
      DefStockLocation: this.executiveData.defaultStockLocation?.trim() || '',
      DefReturnWarehouse:
        this.executiveData.defaultReturnWarehouse?.trim() || '',
      DefReturnLocation: this.executiveData.defaultReturnLocation?.trim() || '',
      DefInspectionWarehouse:
        this.executiveData.defaultInspectionWarehouse?.trim() || '',
      DefInspectionLocation:
        this.executiveData.defaultInspectionLocation?.trim() || '',
      DefSpecialWarehouse:
        this.executiveData.defaultSpecialWarehouse?.trim() || '',
      DefSpecialLocation:
        this.executiveData.defaultSpecialLocation?.trim() || '',
      DefUnloadingWarehouse:
        this.executiveData.defaultUnloadingWarehouse?.trim() || '',
      DefUnloadingLocation:
        this.executiveData.defaultUnloadingLocation?.trim() || '',
      SalesCategoryCode:
        this.executiveData.defaultSalesCategoryCode?.trim() || '',
      SalesCategoryCodeDes:
        this.executiveData.defaultSalesCategoryDesc?.trim() || '',
      DefEmptyTransactionCategory:
        this.executiveData.defEmpCatCode?.trim() || '',
      DefEmptyTransactionCategoryDesc:
        this.executiveData.defEmpCatDesc?.trim() || '',
    });

    // Populate Other Tab
    this.other.patchValue({
      chkCreditLimitValidation:
        this.executiveData.creditLimitValidation === '1',
      CreditLimit: this.executiveData.creditLimit?.toString() || '0.00',
      CommissionPercentage:
        this.executiveData.commissionPercentage !== null &&
        this.executiveData.commissionPercentage !== undefined
          ? parseFloat(this.executiveData.commissionPercentage)
          : null,
      LastGRNNo: this.executiveData.lastGRNNo?.toString() || '0',
      CashLimit: this.executiveData.cashLimit?.toString() || '0.00',
      LastRetailerNo: this.executiveData.lastRetailerNo?.toString() || '0',
      LastOrderNo: this.executiveData.lastOrderNo?.toString() || '0',
      SurveyRecurrence: surveyRecurrenceDisplay,
      LastSurveyDate: formatDateForUI(this.executiveData.lastSurveyDate),
      SurveyActiveDate: formatDateForUI(this.executiveData.surveyActiveDate),
      chkAllowPriceChange: this.executiveData.allowPriceChange === '1',
      chkCashCustomerOnly: this.executiveData.cashCustomerOnly === '1',
      chkGISExecutive: this.executiveData.gisExecutive === '1',
      chkOnlineExecutive: this.executiveData.onlineExecutive === '1',
      ParentExecutiveCode: this.executiveData.parentExecutiveCode?.trim() || '',
      ParentExecutiveName: this.executiveData.parentExecutiveName?.trim() || '',
      ParentExecutiveType: this.executiveData.parentExecutiveType?.trim() || '',
      ExecutiveType: this.executiveData.executiveType?.trim() || '',
      MappingExecutiveCode:
        this.executiveData.mappingExecutiveCode?.trim() || '',
      ApplicationType: this.executiveData.applicationType?.trim() || '',
      AppUserName: this.executiveData.applicationUserName?.trim() || '',
      Parameter: this.executiveData.hierarchyGroup?.trim() || '',
      ParameterDescription: this.executiveData.hierarchyGroupDesc?.trim() || '',
      CostCenterCode: this.executiveData.costCenterCode?.trim() || '',
      CostCenterDesc: this.executiveData.costCenterDesc?.trim() || '',
    });

    // Populate Merchandizing Tab
    this.merchandizing.patchValue({
      chkAutoTMRouteCode: this.executiveData.autoTMRouteCode === '1',
      TMRouteCodePrefix: this.executiveData.tmpsaCodePrefix?.trim() || '',
      NextTMRouteNo: this.executiveData.nextTMPSANo?.toString() || '',
    });

    this.loadClassificationData();
    this.LoadReturnLocations();
  }

  private loadClassificationData(): void {
    if (this.pageInit?.executiveCode) {
      this.loadExecutiveClassification();
      this.loadGeoClassification();
    }
  }

  private loadExecutiveClassification(): void {
    const sub = this.executiveService
      .getExecutiveClassificationData(this.pageInit.executiveCode.trim(), '03')
      .subscribe({
        next: (data) => {
          if (data && Array.isArray(data)) {
            this.setClassificationSelections(this.clsExecutive, data);
          }
        },
        error: (err: any) => {
          this.showError(err);
        },
      });
    this.subscriptions.add(sub);
  }

  private loadGeoClassification(): void {
    const sub = this.executiveService
      .getExecutiveClassificationData(this.pageInit.executiveCode.trim(), '00')
      .subscribe({
        next: (data) => {
          if (data && Array.isArray(data)) {
            this.setClassificationSelections(this.clsGeo, data);
            this.clsGeo_SelectionChange();
          }
        },
        error: (err: any) => {
          this.showError(err);
        },
      });
    this.subscriptions.add(sub);
  }

  private setClassificationSelections(
    component: XontVenturaClassificationSelectorComponent,
    data: any[]
  ): void {
    if (component) {
      const clsArray = data.map((item) => ({
        groupCode: item.masterGroup?.trim() || '',
        valueCode: item.masterGroupValue?.trim() || '',
        valueDescription: item.masterGroupValueDescription?.trim() || '',
      }));
      component.setSelectedClassifications(clsArray);
    }
  }

  // Public Methods
  clsGeo_SelectionChange(): void {
    const selectedcls = this.clsGeo?.getSelectedClassifications() || [];
    let foundTerritory = false;
    for (const item of selectedcls) {
      if (item.groupCode?.trim() === 'TETY' && item.valueCode?.trim() !== '') {
        this.stock.patchValue({
          StockTerritory: item.valueCode.trim(),
        });
        foundTerritory = true;
        break;
      }
    }
    if (!foundTerritory) {
      this.stock.patchValue({
        StockTerritory: '',
      });
    }
    this.LoadReturnLocations();
  }

  LoadReturnLocations(): void {
    const stockTerritory = this.stock.get('StockTerritory')?.value ?? '';
    let returnLocationObservable: Observable<any>;
    if (this.pageInit?.executiveCode) {
      returnLocationObservable = this.executiveService.getReturnLocations(
        this.pageInit.executiveCode.trim(),
        stockTerritory
      );
    } else {
      returnLocationObservable = of([]);
    }

    const sub = returnLocationObservable.subscribe({
      next: (data: any[]) => {
        this.returnTypes.set(data || []);
        this.updateReturnLocationsFormArray(data || []);
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.showError(err);
        this.returnTypes.set([]);
        this.updateReturnLocationsFormArray([]);
      },
    });
    this.subscriptions.add(sub);
  }

  private updateReturnLocationsFormArray(locations: any[]): void {
    const returnLocationsFormArray = this.executiveForm.get(
      'returnLocations'
    ) as FormArray;
    returnLocationsFormArray.clear();
    locations.forEach((location) => {
      returnLocationsFormArray.push(
        this.fb.group({
          ReturnTypeCode: [location.returnTypeCode || ''],
          ReturnTypeDescription: [location.returnTypeDescription || ''],
          LocationCode: [location.locationCode || ''],
          WarehouseName: [location.warehouseName || ''],
          LocationName: [location.locationName || ''],
          WarehouseCode: [location.warehouseCode || ''],
          Status: [location.status !== undefined ? location.status : 1],
          DropDownData: [location.dropDownData || []],
        })
      );
    });
  }

  ddlReturnType_SelectedIndexChanged(index: number, event: any): void {
    const selectedLocationCode = event?.target?.value;
    if (!selectedLocationCode) {
      const locationGroup = this.returnLocations.at(index) as FormGroup;
      if (locationGroup) {
        locationGroup.patchValue({
          WarehouseName: '',
          LocationName: '',
          WarehouseCode: '',
        });
      }
      return;
    }

    const locationGroup = this.returnLocations.at(index) as FormGroup;
    if (!locationGroup) return;

    const dropDownData = locationGroup.get('DropDownData')?.value;
    if (Array.isArray(dropDownData)) {
      const selectedOption = dropDownData.find(
        (opt: any) => opt.LocationCode === selectedLocationCode
      );
      if (selectedOption) {
        locationGroup.patchValue({
          WarehouseName: selectedOption.WarehouseDesc || '',
          LocationName: selectedOption.LocationDesc || '',
          WarehouseCode: selectedOption.WarehouseCode || '',
        });
      }
    }
  }

  GetHierarchyType(): void {
    const sub = this.executiveService.GetHierarchyType().subscribe({
      next: (data) => {
        this.hierarchyType.set(data || '');
        if (data === '1') {
          this.lpmtParameterGroup_DataBind();
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error getting hierarchy type:', error);
      },
    });
    this.subscriptions.add(sub);
  }

  lpmtParameterGroup_DataBind(): void {
    if (this.lpmtParameterGroup) {
      this.lpmtParameterGroup.dataSourceObservable =
        this.executiveService.GetParameterGroup();
    }
  }

  lpmtLoginUser_Databind(): void {
    if (this.lpmtLoginUser) {
      this.lpmtLoginUser.dataSourceObservable =
        this.executiveService.GetAppLoginUser();
    }
  }

  validateCommissionPercentage(): void {
    const commissionControl = this.CommissionPercentage;
    const commissionValue = commissionControl.value;
    let isValid = true;
    if (
      commissionValue !== null &&
      commissionValue !== '' &&
      !isNaN(Number(commissionValue))
    ) {
      const commissionNum = Number(commissionValue);
      isValid = commissionNum >= 0 && commissionNum <= 100;
    } else if (commissionValue !== null && commissionValue !== '') {
      isValid = false;
    }
    this.other.patchValue({ CommissionPercentagevalid: isValid });
    if (!isValid && commissionValue !== null && commissionValue !== '') {
      commissionControl.setErrors({ invalidCommission: true });
    } else {
      if (commissionControl.hasError('invalidCommission')) {
        commissionControl.setErrors(null);
      }
    }
    this.other.updateValueAndValidity();
  }

  ValidateIMEINo(): void {
    const currentVal = this.profile.get('chkValIMEI')?.value;
    this.profile.patchValue({ chkValIMEI: !currentVal });
  }

  chkAutoTMRouteCode_CheckedChanged(): void {
    const isChecked = this.merchandizing.get('chkAutoTMRouteCode')?.value;
    const prefixControl = this.merchandizing.get('TMRouteCodePrefix');
    if (isChecked) {
      prefixControl?.enable();
      if (this.isEditMode() && this.pageInit?.executiveCode) {
        this.loadNextTMRouteNo();
      } else {
        this.merchandizing.patchValue({ NextTMRouteNo: '' });
      }
    } else {
      prefixControl?.disable();
      this.merchandizing.patchValue({
        TMRouteCodePrefix: '',
        NextTMRouteNo: '',
      });
    }
  }

  private loadNextTMRouteNo(): void {
    if (!this.pageInit?.executiveCode) return;
    const sub = this.executiveService
      .getNextTMRouteNo(this.pageInit.executiveCode.trim())
      .subscribe({
        next: (data: any) => {
          this.merchandizing.patchValue({
            NextTMRouteNo: data?.toString() || '',
          });
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          this.showError(err);
        },
      });
    this.subscriptions.add(sub);
  }

  onSubmit(): void {
    if (this.executiveForm.invalid) {
      this.markFormGroupTouched(this.executiveForm);
      console.log('Form is invalid');
      return;
    }

    this.isLoading.set(true);
    const requestData = this.prepareSubmitData();
    console.log('Submitting Data:', JSON.stringify(requestData, null, 2));

    const sub = this.executiveService.saveExecutiveData(requestData).subscribe({
      next: (response: any) => {
        this.isLoading.set(false);
        console.log('Save Response:', response);
        if (response === true || response?.success === true) {
          this.router.navigate(['list']);
        } else {
          this.handleSaveError({
            message: response?.message || response?.toString() || 'Save failed',
          });
        }
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.isLoading.set(false);
        console.error('Save Error:', err);
        this.showError(err);
      },
    });
    this.subscriptions.add(sub);
  }

  private prepareSubmitData(): SaveAllRequest {
    const execClassifications: SelectedClassification[] =
      this.clsExecutive?.getSelectedClassifications() || [];
    const geoClassifications: SelectedClassification[] =
      this.clsGeo?.getSelectedClassifications() || [];
    const profileValue = this.profile.value;
    const stockValue = this.stock.value;
    const otherValue = this.other.value;
    const merchValue = this.merchandizing.value;

    let surveyRecurrenceCode = '';
    switch (otherValue.SurveyRecurrence?.trim()) {
      case 'Year':
        surveyRecurrenceCode = 'Y';
        break;
      case 'Month':
        surveyRecurrenceCode = 'M';
        break;
      case 'Week':
        surveyRecurrenceCode = 'W';
        break;
      case 'Date':
        surveyRecurrenceCode = 'D';
        break;
      default:
        surveyRecurrenceCode = '';
    }

    const request: SaveAllRequest = {
      Mode: this.pageInit?.mode || 'new',
      ExecutiveProfile: {
        ExecutiveCode: profileValue.ExecutiveCode,
        ExecutiveName: profileValue.ExecutiveName,
        ExecutiveGroup: profileValue.ExecutiveGroup,
        OperationType: profileValue.OperationType,
        OperationTypeDesc: profileValue.OperationTypeDesc,
        IncentiveGroup: profileValue.IncentiveGroup,
        IncentiveGroupDesc: profileValue.IncentiveGroupDesc,
        UserName: profileValue.UserName,
        Password: profileValue.Password,
        ConfirmPassword: profileValue.ConfirmPassword,
        PasswordExpiry: profileValue.PasswordExpiry || '',
        chkPasswordReset: profileValue.chkPasswordReset,
        chkUserLocked: profileValue.chkUserLocked,
        AuthorityLevel: profileValue.AuthorityLevel,
        RetailerType: profileValue.RetailerType,
        IMEINo: profileValue.IMEINo,
        chkValIMEI: profileValue.chkValIMEI,
        MobileNumbers: profileValue.MobileNumbers,
        EmailAddress: profileValue.EmailAddress,
        chkActive: profileValue.chkActive,
        UserProfile: profileValue.UserProfile,
        UserProfileName: profileValue.UserProfileName,
        JoiningDate: profileValue.JoiningDate || '',
        TerminationDate: profileValue.TerminationDate || '',
        TimeStamp: profileValue.TimeStamp,
        IsValidateOperationType: profileValue.IsValidateOperationType,
      },
      Stock: {
        StockTerritory: stockValue.StockTerritory,
        StockTerritoryDesc: stockValue.StockTerritoryDesc,
        DefSalesWarehouse: stockValue.DefSalesWarehouse,
        DefSalesLocation: stockValue.DefSalesLocation,
        DefSalesLocationDes: stockValue.DefSalesLocationDes,
        DefStockWarehouse: stockValue.DefStockWarehouse,
        DefStockLocation: stockValue.DefStockLocation,
        DefStockLocationDes: stockValue.DefStockLocationDes,
        DefReturnWarehouse: stockValue.DefReturnWarehouse,
        DefReturnLocation: stockValue.DefReturnLocation,
        DefReturnLocationDes: stockValue.DefReturnLocationDes,
        DefInspectionWarehouse: stockValue.DefInspectionWarehouse,
        DefInspectionLocation: stockValue.DefInspectionLocation,
        DefInspectionLocationDes: stockValue.DefInspectionLocationDes,
        DefSpecialWarehouse: stockValue.DefSpecialWarehouse,
        DefSpecialLocation: stockValue.DefSpecialLocation,
        DefSpecialLocationDes: stockValue.DefSpecialLocationDes,
        DefUnloadingWarehouse: stockValue.DefUnloadingWarehouse,
        DefUnloadingLocation: stockValue.DefUnloadingLocation,
        DefUnloadingLocationDes: stockValue.DefUnloadingLocationDes,
        SalesCategoryCode: stockValue.SalesCategoryCode,
        SalesCategoryCodeDes: stockValue.SalesCategoryCodeDes,
        DefEmptyTransactionCategory: stockValue.DefEmptyTransactionCategory,
        DefEmptyTransactionCategoryDesc:
          stockValue.DefEmptyTransactionCategoryDesc,
      },
      Hierarchy: {
        HierarchyGroup: '',
      },
      Other: {
        chkCreditLimitValidation: otherValue.chkCreditLimitValidation,
        CreditLimit: parseFloat(otherValue.CreditLimit) || 0,
        CommissionPercentage:
          otherValue.CommissionPercentage !== null
            ? otherValue.CommissionPercentage.toString()
            : '',
        LastGRNNo: parseInt(otherValue.LastGRNNo) || 0,
        CashLimit: parseFloat(otherValue.CashLimit) || 0,
        LastRetailerNo: parseInt(otherValue.LastRetailerNo) || 0,
        LastOrderNo: parseInt(otherValue.LastOrderNo) || 0,
        SurveyRecurrence: surveyRecurrenceCode,
        LastSurveyDate: otherValue.LastSurveyDate || '',
        SurveyActiveDate: otherValue.SurveyActiveDate || '',
        chkAllowPriceChange: otherValue.chkAllowPriceChange,
        chkCashCustomerOnly: otherValue.chkCashCustomerOnly,
        chkGISExecutive: otherValue.chkGISExecutive,
        ParentExecutiveCode: otherValue.ParentExecutiveCode,
        ParentExecutiveName: otherValue.ParentExecutiveName,
        ParentExecutiveType: otherValue.ParentExecutiveType,
        ExecutiveType: otherValue.ExecutiveType,
        MappingExecutiveCode: otherValue.MappingExecutiveCode,
        ApplicationType: otherValue.ApplicationType,
        AppUserName: otherValue.AppUserName,
        UserFullName: otherValue.UserFullName,
        Parameter: otherValue.Parameter,
        ParameterDescription: otherValue.ParameterDescription,
        CostCenterCode: otherValue.CostCenterCode,
        CostCenterDesc: otherValue.CostCenterDesc,
      },
      Merchandizing: {
        chkAutoTMRouteCode: merchValue.chkAutoTMRouteCode,
        TMRouteCodePrefix: merchValue.TMRouteCodePrefix,
        NextTMRouteNo: merchValue.NextTMRouteNo
          ? parseInt(merchValue.NextTMRouteNo)
          : 0,
      },
      ExecutiveClassificationList:
        this.mapClassificationsForBackend(execClassifications),
      MarketingHierarchyClassificationList: [],
      GeoClassificationList:
        this.mapClassificationsForBackend(geoClassifications),
      ReturnLocationList: this.returnLocations.value.map((loc: any) => ({
        ExecutiveCode: profileValue.ExecutiveCode,
        ReturnTypeCode: loc.ReturnTypeCode,
        WarehouseCode: loc.WarehouseCode,
        LocationCode: loc.LocationCode,
      })),
    };
    return request;
  }

  private mapClassificationsForBackend(
    classifications: SelectedClassification[]
  ): any[] {
    return classifications.map((cls) => ({
      MasterGroup: cls.groupCode || '',
      MasterGroupDescription: cls.groupDescription || '',
      MasterGroupValue: cls.valueCode || '',
      MasterGroupValueDescription: cls.valueDescription || '',
      Status: '1',
    }));
  }

  private markFormGroupTouched(formGroup: FormGroup | FormArray): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      if (control) {
        if (control instanceof FormGroup || control instanceof FormArray) {
          this.markFormGroupTouched(control);
        } else {
          control.markAsTouched();
        }
      }
    });
  }

  private handleSaveError(response: any): void {
    if (typeof response?.message === 'string') {
      this.showError({ message: response.message });
    } else if (response?.message) {
      this.showError(response);
    } else {
      this.showError({ message: 'An error occurred during save.' });
    }
  }

  btnCancel_Click(): void {
    this.router.navigate(['list']);
  }

  siteName(): string {
    return this.commonService.getAPIPrefix();
  }

  showError(err: any): void {
    if (this.msgPrompt) {
      let message = 'An error occurred';
      if (err?.error?.message) {
        message = err.error.message;
      } else if (err?.message) {
        message = err.message;
      } else if (typeof err === 'string') {
        message = err;
      }
      this.msgPrompt.show(message, 'SOMNT01');
    } else {
      console.error('Message prompt not available:', err);
    }
  }

  lpmtOptType_Changed(event: any): void {
    const operationType = this.profile.get('OperationType')?.value;
    const validTypes = ['OR', 'SL', 'BT'];
    const isVisible = operationType && validTypes.includes(operationType);
    this.profile.patchValue({ IsValidateOperationType: !!isVisible });
    if (!isVisible) {
      this.pnlReturn.Visible = false;
      this.pnlStockDetails.Visible = false;
      this.pnlStockTerritory.Visible = false;
    } else {
      this.pnlReturn.Visible = true;
      this.pnlStockDetails.Visible = true;
      this.pnlStockTerritory.Visible = true;
    }
    if (this.pnlReturn.Visible) {
      this.LoadReturnLocations();
    }
  }

  onPasswordExpirySelect(date: string | null): void {
    this.profile.patchValue({ PasswordExpiry: date || '' });
  }

  onJoiningDateSelect(date: string | null): void {
    this.profile.patchValue({ JoiningDate: date || '' });
  }

  onTerminationDateSelect(date: string | null): void {
    this.profile.patchValue({ TerminationDate: date || '' });
  }

  onLastSurveyDateSelect(date: string | null): void {
    this.other.patchValue({ LastSurveyDate: date || '' });
  }

  onSurveyActiveDateSelect(date: string | null): void {
    this.other.patchValue({ SurveyActiveDate: date || '' });
  }

  lpmtOptType_DataBind(): void {
    if (this.lpmtOptType) {
      this.lpmtOptType.dataSourceObservable =
        this.executiveService.getNewOptTypePrompt();
    }
  }

  lpmtIncentiveGroup_DataBind(): void {
    if (this.lpmtIncentiveGroup) {
      this.lpmtIncentiveGroup.dataSourceObservable =
        this.executiveService.getIncentiveGroupPrompt();
    }
  }

  lpmtUserProfile_DataBind(): void {
    if (this.lpmtUserProfile) {
      this.lpmtUserProfile.dataSourceObservable =
        this.executiveService.getUserProfilePrompt();
    }
  }

  lpmtCostCenter_DataBind(): void {
    if (this.lpmtCostCenter) {
      // this.lpmtCostCenter.dataSourceObservable =
      //   this.executiveService.getCostCenterPrompt();
    }
  }

  lpmtSalesLocation_DataBind(): void {
    const stockTerritory = this.stock.get('StockTerritory')?.value || '';
    if (this.lpmtSalesLocation) {
      this.lpmtSalesLocation.dataSourceObservable =
        this.executiveService.getSalesLocation(stockTerritory.trim());
    }
  }

  lpmtStockLocation_DataBind(): void {
    const stockTerritory = this.stock.get('StockTerritory')?.value || '';
    if (this.lpmtStockLocation) {
      this.lpmtStockLocation.dataSourceObservable =
        this.executiveService.getStockLocation(stockTerritory.trim());
    }
  }

  lpmtInspectionLocation_DataBind(): void {
    const stockTerritory = this.stock.get('StockTerritory')?.value || '';
    if (this.lpmtInspectionLocation) {
      this.lpmtInspectionLocation.dataSourceObservable =
        this.executiveService.getInceptionLocation(stockTerritory.trim());
    }
  }

  lpmtSpecialLocation_DataBind(): void {
    const stockTerritory = this.stock.get('StockTerritory')?.value || '';
    if (this.lpmtSpecialLocation) {
      this.lpmtSpecialLocation.dataSourceObservable =
        this.executiveService.getSpecialLocation(stockTerritory.trim());
    }
  }

  lpmtUnloadingLocation_DataBind(): void {
    const stockTerritory = this.stock.get('StockTerritory')?.value || '';
    if (this.lpmtUnloadingLocation) {
      this.lpmtUnloadingLocation.dataSourceObservable =
        this.executiveService.getUnloadingLocation(stockTerritory.trim());
    }
  }

  getCurrentExecutiveType(): string {
    const clsExecutive = this.clsExecutive.getSelectedClassifications() || [];
    return (
      clsExecutive.find((cls) => cls.groupCode === 'EXETYPE')?.valueCode || ''
    );
  }

  getCurrentExecutiveclsType(): string {
    const clsExecutive = this.clsExecutive.getSelectedClassifications() || [];
    return (
      clsExecutive.find((cls) => cls.groupCode === 'EXECLAS')?.valueCode || ''
    );
  }

  lpmtDefSaleCategory_DataBind(): void {
    const operationType = this.profile.get('OperationType')?.value || '';
    const territoryCode = this.stock.get('StockTerritory')?.value || '';

    if (this.lpmtDefSaleCategory) {
      this.lpmtDefSaleCategory.dataSourceObservable =
        this.executiveService.getDefSaleCategory(operationType, territoryCode);
    }
  }

  lpmtDefEmptyCategory_DataBind(): void {
    const operationType = this.profile.get('OperationType')?.value || '';
    const territoryCode = this.stock.get('StockTerritory')?.value || '';

    if (this.lpmtDefEmptyCategory) {
      this.lpmtDefEmptyCategory.dataSourceObservable =
        this.executiveService.getDefEmptyCategory(operationType, territoryCode);
    }
  }

  lpmtDamageLocation_DataBind(): void {
    const territoryCode = this.stock.get('StockTerritory')?.value || '';

    if (this.lpmtDamageLocation) {
      this.lpmtDamageLocation.dataSourceObservable =
        this.executiveService.getDamageLocation(territoryCode);
    }
  }
  lpmtLoginUser_DataBind(): void {
    if (this.lpmtLoginUser) {
      this.lpmtLoginUser.dataSourceObservable =
        this.executiveService.GetAppLoginUser();
    }
  }

  validatePassword(): void {
    const password = this.profile.get('Password')?.value;
    const confirmPassword = this.profile.get('ConfirmPassword')?.value;

    if (password !== confirmPassword) {
      this.profile.get('ConfirmPassword')?.setErrors({ mismatch: true });
    } else {
      this.profile.get('ConfirmPassword')?.setErrors(null);
    }
  }

  validateIMEINo_OnBlur(): void {
    const chkValIMEI = this.profile.get('chkValIMEI')?.value;
    const imeiNo = this.profile.get('IMEINo')?.value;

    if (chkValIMEI && (!imeiNo || imeiNo.trim() === '')) {
      this.profile.get('IMEINo')?.setErrors({ required: true });
    } else {
      this.profile.get('IMEINo')?.setErrors(null);
    }
  }

  validateExecutiveProfileUpdate(): boolean {
    const joiningDate = this.datetimeService.getDateTimeForString(
      this.profile.get('JoiningDate')?.value?.trim() || ''
    );
    const terminationDate = this.datetimeService.getDateTimeForString(
      this.profile.get('TerminationDate')?.value?.trim() || ''
    );

    if (joiningDate && terminationDate && joiningDate > terminationDate) {
      this.profile.get('TerminationDate')?.setErrors({ dateCompare: true });
      return false;
    }

    return true;
  }
}
