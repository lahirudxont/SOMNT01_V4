// new.component.ts
import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  inject,
  signal,
  computed,
  ChangeDetectorRef, // Import ChangeDetectorRef
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
import { Subscription, Observable, of } from 'rxjs'; // Import Observable, of

// Services
import { DatetimeService } from '../datetime.service';
import { CommonService } from '../common.service';
import { ExecutiveService } from '../executive.service';

// Updated Components
import { XontVenturaMessagePromptComponent } from '../xont-ventura-message-prompt/xont-ventura-message-prompt.component';
import { ListPromptComponent } from 'xont-ventura-list-prompt';
import { XontVenturaClassificationSelectorComponent } from '../xont-ventura-classification-selector/xont-ventura-classification-selector.component';
import { XontVenturaDatepickerComponent } from '../xont-ventura-datepicker/xont-ventura-datepicker.component';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Types (Consider moving these to separate files for better organization)
interface ExecutiveProfile {
  executiveCode: string;
  executiveName: string;
  executiveGroup: string;
  operationType: string;
  operationTypeDesc: string;
  incentiveGroup: string;
  incentiveGroupDesc: string;
  userName: string;
  password: string;
  confirmPassword: string;
  passwordExpiry: string | null; // Allow null for dates
  chkPasswordReset: boolean;
  chkUserLocked: boolean;
  authorityLevel: string;
  retailerType: string;
  imeiNo: string;
  chkValIMEI: boolean;
  mobileNumbers: string;
  emailAddress: string;
  chkActive: boolean;
  userProfile: string;
  userProfileName: string;
  joiningDate: string | null;
  terminationDate: string | null;
  timeStamp: string;
  isValidateOperationType: boolean;
}

interface StockDetails {
  stockTerritory: string;
  stockTerritoryDesc: string;
  defSalesWarehouse: string;
  defSalesLocation: string;
  defSalesLocationDes: string;
  defStockWarehouse: string;
  defStockLocation: string;
  defStockLocationDes: string;
  defReturnWarehouse: string;
  defReturnLocation: string;
  defReturnLocationDes: string;
  defInspectionWarehouse: string;
  defInspectionLocation: string;
  defInspectionLocationDes: string;
  defSpecialWarehouse: string;
  defSpecialLocation: string;
  defSpecialLocationDes: string;
  defUnloadingWarehouse: string;
  defUnloadingLocation: string;
  defUnloadingLocationDes: string;
  salesCategoryCode: string;
  salesCategoryCodeDes: string;
  defEmptyTransactionCategory: string;
  defEmptyTransactionCategoryDesc: string;
}

interface OtherDetails {
  chkCreditLimitValidation: boolean;
  creditLimit: string; // Keep as string if it's formatted
  commissionPercentage: number | null; // Allow null
  lastGRNNo: string;
  cashLimit: string; // Keep as string if it's formatted
  lastRetailerNo: string;
  lastOrderNo: string;
  surveyRecurrence: string;
  lastSurveyDate: string | null;
  surveyActiveDate: string | null;
  chkAllowPriceChange: boolean;
  chkCashCustomerOnly: boolean;
  chkGISExecutive: boolean;
  parentExecutiveCode: string;
  parentExecutiveName: string;
  parentExecutiveType: string;
  executiveType: string;
  executiveTypeHierarchyLevel: number;
  hierarchyTimeStamp: any;
  commissionPercentagevalid: boolean;
  mappingExecutiveCode: string;
  applicationType: string;
  executiveclsType: string;
  chkOnlineExecutive: boolean;
  appUserName: string;
  userFullName: string;
  parameter: string;
  parameterDescription: string;
  costCenterCode: string;
  costCenterDesc: string;
}

interface MerchandizingDetails {
  chkAutoTMRouteCode: boolean;
  tmRouteCodePrefix: string;
  nextTMRouteNo: string;
}

interface ReturnLocation {
  returnTypeCode: string;
  returnTypeDescription: string;
  locationCode: string;
  warehouseName: string;
  locationName: string;
  warehouseCode: string;
  status: number;
  dropDownData: any[];
}

// Custom Validator for Confirm Password
function passwordMatchValidator(
  control: AbstractControl
): ValidationErrors | null {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');

  if (password && confirmPassword && password.value !== confirmPassword.value) {
    confirmPassword.setErrors({ mismatch: true });
    return { mismatch: true }; // Return error on the group
  } else {
    confirmPassword?.setErrors(null);
  }
  return null;
}

// Custom Validator for IMEI
function imeiValidator(control: AbstractControl): ValidationErrors | null {
  const chkValIMEI = control.get('chkValIMEI')?.value;
  const imei = control.get('imeiNo')?.value;

  if (chkValIMEI && (!imei || imei.trim() === '')) {
    return { imeiRequired: true };
  }
  return null;
}

@Component({
  selector: 'my-new',
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.css'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    XontVenturaMessagePromptComponent,
    ListPromptComponent,
    XontVenturaClassificationSelectorComponent,
    XontVenturaDatepickerComponent,
    CommonModule,
    MatProgressSpinnerModule,
  ],
})
export class NewComponent implements OnInit, AfterViewInit {
  // Dependency Injection
  private http = inject(HttpClient);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private datetimeService = inject(DatetimeService);
  private commonService = inject(CommonService);
  private executiveService = inject(ExecutiveService);
  private cdr = inject(ChangeDetectorRef); // Inject ChangeDetectorRef

  // Main Form Group
  executiveForm: FormGroup;

  // View Children
  @ViewChild('msgPrompt') msgPrompt!: XontVenturaMessagePromptComponent;
  @ViewChild('clsExecutive')
  clsExecutive!: XontVenturaClassificationSelectorComponent;
  @ViewChild('clsMarketingHierarchy')
  clsMarketingHierarchy!: XontVenturaClassificationSelectorComponent;
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

  // Classification Selector Configurations (kept as objects)
  cls1 = {
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

  cls2 = {
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

  cls3 = {
    ID: 'clsGeo',
    Type: '00',
    TaskCode: 'SOMNT01',
    LabelWidth: '140px',
    EnableUserInput: 'false',
    CodeTextWidth: '120px',
    DescriptionTextWidth: '320px',
    ActiveStatus: 'Active',
    AllMandatory: 'true', // This might depend on UI logic, e.g., if pnlStockTerritory is visible
    LastLevelRequired: 'false',
    Enabled: 'true',
  };

  // Signals for reactive state
  isLoading = signal(false);
  isEditMode = signal(false);
  isNewBasedOnMode = signal(false);
  hierarchyType = signal(''); // Default to empty string
  parentexedisable = signal(false); // Default to false

  // Data collections
  executivegroup: any[] = [];
  returnTypes = signal<ReturnLocation[]>([]);

  // UI state
  selectedHierarchyIndex = -1;
  hierarchyIndex = -1;

  busy?: Subscription;
  private pageInit: any = undefined;
  private executiveData: any = undefined;

  constructor() {
    // Initialize the main form structure
    this.executiveForm = this.fb.group({
      // Profile Tab
      profile: this.fb.group(
        {
          ExecutiveCode: [
            '',
            [Validators.required, Validators.pattern('^[A-Za-z0-9_-]+$')],
          ],
          ExecutiveName: [
            '',
            [Validators.required, Validators.pattern('^[^&#"\';]*$')], // Corrected pattern
          ],
          ExecutiveGroup: ['1'],
          OperationType: ['', Validators.required],
          OperationTypeDesc: [''],
          IncentiveGroup: [''],
          IncentiveGroupDesc: [''],
          UserName: ['', Validators.pattern('^[a-zA-Z0-9]*$')],
          Password: [''],
          ConfirmPassword: [''],
          PasswordExpiry: [null], // Use null for dates initially
          chkPasswordReset: [false],
          chkUserLocked: [false],
          AuthorityLevel: ['1'],
          RetailerType: ['0'],
          IMEINo: [''],
          chkValIMEI: [false],
          MobileNumbers: ['', Validators.pattern('^[0-9;\\d]+$')],
          EmailAddress: [
            '',
            Validators.pattern(
              '(([a-zA-Z0-9_\\-\\.]+)@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.)|(([a-zA-Z0-9\\-]+\\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\\]?)(\\s*;\\s*|\\s*$))*'
            ),
          ],
          chkActive: [true],
          UserProfile: [''],
          UserProfileName: [''],
          JoiningDate: [null],
          TerminationDate: [null],
          TimeStamp: [''],
          IsValidateOperationType: [false], // Initialize this flag
        },
        {
          validators: [passwordMatchValidator, imeiValidator], // Add custom validators to the group
        }
      ),

      // Stock Tab
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

      // Other Tab
      other: this.fb.group({
        chkCreditLimitValidation: [false],
        CreditLimit: ['0.00', Validators.pattern('^[0-9.,]+$')],
        CommissionPercentage: [null], // Allow null
        LastGRNNo: ['0', Validators.pattern('^[0-9]+$')],
        CashLimit: ['0.00', Validators.pattern('^[0-9.,]+$')],
        LastRetailerNo: ['0', Validators.pattern('^[0-9]+$')],
        LastOrderNo: ['0', Validators.pattern('^[0-9]+$')],
        SurveyRecurrence: [''],
        LastSurveyDate: [null],
        SurveyActiveDate: [null],
        chkAllowPriceChange: [false],
        chkCashCustomerOnly: [false],
        chkGISExecutive: [false],
        ParentExecutiveCode: [''],
        ParentExecutiveName: [''],
        ParentExecutiveType: [''],
        ExecutiveType: [''],
        ExecutiveTypeHierarchyLevel: [0],
        HierarchyTimeStamp: [null], // Initialize timestamp
        CommissionPercentagevalid: [true],
        MappingExecutiveCode: [''],
        ApplicationType: [''],
        ExecutiveclsType: [''],
        chkOnlineExecutive: [false],
        AppUserName: [''],
        UserFullName: [''],
        Parameter: [''],
        ParameterDescription: [''],
        CostCenterCode: [''],
        CostCenterDesc: [''],
      }),

      // Merchandizing Tab
      merchandizing: this.fb.group({
        chkAutoTMRouteCode: [false],
        TMRouteCodePrefix: ['', Validators.pattern('^[A-Za-z0-9_-]+$')],
        NextTMRouteNo: [''],
      }),

      // Return Locations (FormArray for dynamic locations)
      returnLocations: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.loadPageInitialization();
  }

  ngAfterViewInit(): void {
    this.loadStoredData();
    this.cdr.detectChanges();
  }

  // Form group getters for easier access
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

  // Individual control getters (Optional, but can be useful)
  get ExecutiveCode(): FormControl {
    return this.profile.get('ExecutiveCode') as FormControl;
  }

  get ExecutiveName(): FormControl {
    return this.profile.get('ExecutiveName') as FormControl;
  }

  get CommissionPercentage(): FormControl {
    return this.other.get('CommissionPercentage') as FormControl;
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
    // Disable executiveCode if in edit mode
    if (mode === 'edit') {
      this.ExecutiveCode.disable();
    } else {
      this.ExecutiveCode.enable();
    }
  }

  private initializeNewMode(): void {
    // executiveCode is enabled by default in the form definition for new mode
    this.profile.patchValue({ chkActive: true });
    this.LoadReturnLocations();
    this.GetHierarchyType();
  }

  private loadStoredData(): void {
    // Load any additional stored data if needed
  }

  private loadExecutiveGroups(): void {
    this.busy = this.executiveService.getExecutiveGroups().subscribe({
      next: (data) => {
        this.executivegroup = data;
        // Trigger change detection if needed immediately after data load
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.showError(err);
      },
    });
  }

  private loadExecutiveData(): void {
    this.isLoading.set(true);

    this.busy = this.executiveService
      .getExecutiveData(this.pageInit.executiveCode.trim())
      .subscribe({
        next: (data: any) => {
          this.executiveData = data;
          this.populateFormData();
          this.isLoading.set(false);
          // Trigger change detection after data load
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          this.showError(err);
          this.isLoading.set(false);
        },
      });
  }

  private populateFormData(): void {
    if (!this.executiveData) return;

    if (this.isEditMode()) {
      this.populateEditModeData();
    } else if (this.isNewBasedOnMode()) {
      this.populateNewBasedOnData();
    }

    this.loadClassificationData();
    this.loadStockDetails();
    this.loadOtherDetails();
  }

  private populateEditModeData(): void {
    // executiveCode is disabled in setFormMode for edit
    this.profile.patchValue({
      ExecutiveCode: this.executiveData.executiveCode?.trim() || '',
      TimeStamp: this.executiveData.timeStamp?.trim() || '',
      chkUserLocked: this.executiveData.userLocked === '1',
      UserName: this.executiveData.userName?.trim() || '',
      MobileNumbers: this.executiveData.mobileNumbers?.trim() || '', // Check field name
      EmailAddress: this.executiveData.emailAddress?.trim() || '',
      chkValIMEI: this.executiveData.validateIMEI === '1',
      IMEINo: this.executiveData.imeiNumber?.trim() || '', // Check field name
      // Password fields are typically not populated on edit
    });

    this.other.patchValue({
      ApplicationType: this.executiveData.applicationType?.trim() || '',
      CostCenterCode: this.executiveData.costCenterCode?.trim() || '',
      CostCenterDesc: this.executiveData.costCenterDesc?.trim() || '',
      CommissionPercentage:
        this.executiveData.commissionPercentage !== null &&
        this.executiveData.commissionPercentage !== undefined
          ? parseFloat(this.executiveData.commissionPercentage)
          : null,
      MappingExecutiveCode:
        this.executiveData.mappingExecutiveCode?.trim() || '',
    });

    this.merchandizing.patchValue({
      chkAutoTMRouteCode: this.executiveData.autoTMRouteCode === '1',
      TMRouteCodePrefix: this.executiveData.tmpsaCodePrefix?.trim() || '',
    });
  }

  private populateNewBasedOnData(): void {
    // executiveCode is enabled for newBasedOn
    this.profile.patchValue({
      ExecutiveCode: '',
      chkActive: true,
      chkUserLocked: this.executiveData?.userLocked === '1' || false,
      IMEINo: '',
      chkValIMEI: false,
      // Copy other relevant fields from executiveData if needed
    });
  }

  private loadClassificationData(): void {
    // Only load classification data if we have an executive code (edit or newBasedOn)
    if (this.pageInit?.executiveCode) {
      this.loadExecutiveClassification();
      this.loadMarketingHierarchyClassification();
      this.loadGeoClassification();
    }
  }

  private loadExecutiveClassification(): void {
    this.busy = this.executiveService
      .getExecutiveClassificationData(this.pageInit.executiveCode.trim(), '03')
      .subscribe({
        next: (data: any) => {
          // Assuming data is an array of classification objects
          if (data && Array.isArray(data)) {
            this.setClassificationSelections(this.clsExecutive, data);
          }
        },
        error: (err: any) => {
          this.showError(err);
        },
      });
  }

  private loadMarketingHierarchyClassification(): void {
    this.busy = this.executiveService
      .getExecutiveClassificationData(this.pageInit.executiveCode.trim(), '29')
      .subscribe({
        next: (data: any) => {
          if (data && Array.isArray(data)) {
            this.setClassificationSelections(this.clsMarketingHierarchy, data);
          }
        },
        error: (err: any) => {
          this.showError(err);
        },
      });
  }

  private loadGeoClassification(): void {
    this.busy = this.executiveService
      .getExecutiveClassificationData(this.pageInit.executiveCode.trim(), '00')
      .subscribe({
        next: (data: any) => {
          if (data && Array.isArray(data)) {
            this.setClassificationSelections(this.clsGeo, data);
          }
        },
        error: (err: any) => {
          this.showError(err);
        },
      });
  }

  private setClassificationSelections(
    component: XontVenturaClassificationSelectorComponent,
    data: any[]
  ): void {
    // Ensure component is available (might not be on initial load in some cases)
    if (component) {
      const clsArray = data.map((item) => ({
        groupCode: item.masterGroup?.trim() || '',
        valueCode: item.masterGroupValue?.trim() || '',
        valueDescription: item.masterGroupValueDescription?.trim() || '',
      }));
      component.setSelectedClassifications(clsArray);
    }
  }

  private loadStockDetails(): void {
    this.stock.patchValue({
      StockTerritory: this.executiveData?.stockTerritory?.trim() || '',
      StockTerritoryDesc: this.executiveData?.StockTerritoryDesc?.trim() || '',
      DefSalesWarehouse:
        this.executiveData?.defaultSalesWarehouseCode?.trim() || '',
      DefSalesLocation:
        this.executiveData?.defaultSalesLocationCode?.trim() || '',
      DefStockWarehouse:
        this.executiveData?.defaultStockWarehouse?.trim() || '',
      DefStockLocation: this.executiveData?.DefaultStockLocation?.trim() || '',
      DefReturnWarehouse:
        this.executiveData?.defaultReturnWarehouse?.trim() || '',
      DefReturnLocation:
        this.executiveData?.defaultReturnLocation?.trim() || '',
      DefInspectionWarehouse:
        this.executiveData?.defaultInspectionWarehouse?.trim() || '',
      DefInspectionLocation:
        this.executiveData?.defaultInspectionLocation?.trim() || '',
      DefSpecialWarehouse:
        this.executiveData?.defaultSpecialWarehouse?.trim() || '',
      DefSpecialLocation:
        this.executiveData?.defaultSpecialLocation?.trim() || '',
      DefUnloadingWarehouse:
        this.executiveData?.defaultUnloadingWarehouse?.trim() || '',
      DefUnloadingLocation:
        this.executiveData?.defaultUnloadingLocation?.trim() || '',
      SalesCategoryCode:
        this.executiveData?.defaultSalesCategoryCode?.trim() || '',
      SalesCategoryCodeDes:
        this.executiveData?.defaultSalesCategoryDesc?.trim() || '',
      DefEmptyTransactionCategory:
        this.executiveData?.defEmpCatCode?.trim() || '',
      DefEmptyTransactionCategoryDesc:
        this.executiveData?.defEmpCatDesc?.trim() || '',
    });
  }

  private loadOtherDetails(): void {
    this.other.patchValue({
      chkCreditLimitValidation:
        this.executiveData?.creditLimitValidation === '1',
      CreditLimit: this.executiveData?.creditLimit || '0.00',
      chkAllowPriceChange: this.executiveData?.allowPriceChange === '1',
      chkCashCustomerOnly: this.executiveData?.cashCustomerOnly === '1',
      chkGISExecutive: this.executiveData?.gisExecutive === '1',
      chkOnlineExecutive: this.executiveData?.onlineExecutive === '1',
      ParentExecutiveCode: this.executiveData?.parentExecutiveCode || '',
      ParentExecutiveName: this.executiveData?.parentExecutiveName || '',
      ParentExecutiveType: this.executiveData?.parentExecutiveType || '',
      ExecutiveType: this.executiveData?.executiveType || '',
      Parameter: this.executiveData?.hierarchyGroup || '', // Check field name
      ParameterDescription: this.executiveData?.hierarchyGroupDesc || '', // Check field name
      AppUserName: this.executiveData?.appUserName || '',
      UserFullName: this.executiveData?.userFullName || '',
    });
  }

  // Public methods (Aligned with upgraded component patterns)
  // Password validation is now handled by the custom validator

  clsGeo_SelectionChange(): void {
    const selectedcls = this.clsGeo?.getSelectedClassifications() || [];

    // Reset dependent stock fields
    this.stock.patchValue({
      SalesCategoryCode: '',
      SalesCategoryCodeDes: '',
      DefSalesWarehouse: '',
      DefSalesLocation: '',
      DefSalesLocationDes: '',
      DefStockWarehouse: '',
      DefStockLocation: '',
      DefStockLocationDes: '',
    });

    // Find territory code (TETY)
    let foundTerritory = false;
    for (const item of selectedcls) {
      if (item.GroupCode?.trim() === 'TETY' && item.valueCode?.trim() !== '') {
        this.stock.patchValue({
          StockTerritory: item.valueCode.trim(),
          StockTerritoryDesc: item.valueDescription?.trim() || '',
        });
        foundTerritory = true;
        break;
      }
    }
    // If no TETY found, clear territory
    if (!foundTerritory) {
      this.stock.patchValue({
        StockTerritory: '',
        StockTerritoryDesc: '',
      });
    }

    this.LoadReturnLocations();
  }

  LoadReturnLocations(): void {
    const stockTerritory = this.stock.get('StockTerritory')?.value || '';

    // Use a default observable if stockTerritory is empty
    let returnLocationObservable: Observable<any>;
    if (stockTerritory) {
      returnLocationObservable = this.executiveService.getReturnLocations(
        stockTerritory,
        this.pageInit?.executiveCode?.trim() || ''
      );
    } else {
      returnLocationObservable = of([]); // Return empty array if no territory
    }

    this.busy = returnLocationObservable.subscribe({
      next: (data: any) => {
        this.returnTypes.set(data || []);
        this.updateReturnLocationsFormArray(data || []);
        this.cdr.markForCheck(); // Ensure UI updates
      },
      error: (err: any) => {
        this.showError(err);
        this.returnTypes.set([]);
        this.updateReturnLocationsFormArray([]); // Clear form array on error
      },
    });
  }

  private updateReturnLocationsFormArray(locations: any[]): void {
    const returnLocationsFormArray = this.executiveForm.get(
      'returnLocations'
    ) as FormArray;
    returnLocationsFormArray.clear(); // Clear existing controls
    locations.forEach((location) => {
      returnLocationsFormArray.push(
        this.fb.group({
          ReturnTypeCode: [location.returnTypeCode || ''],
          ReturnTypeDescription: [location.returnTypeDescription || ''],
          LocationCode: [location.locationCode || ''],
          WarehouseName: [location.warehouseName || ''],
          LocationName: [location.locationName || ''],
          WarehouseCode: [location.warehouseCode || ''],
          Status: [location.status !== undefined ? location.status : 1], // Default to 1 if undefined
          DropDownData: [location.dropDownData || []],
        })
      );
    });
  }

  ddlReturnType_SelectedIndexChanged(index: number, event: any): void {
    // Adjusted signature
    const selectedLocationCode = event?.target?.value; // Get value from event
    if (!selectedLocationCode) return;

    const locationGroup = this.returnLocations.at(index) as FormGroup;
    if (!locationGroup) return;

    const dropDownData = locationGroup.get('DropDownData')?.value;

    if (Array.isArray(dropDownData)) {
      const selectedOption = dropDownData.find(
        (opt: any) => opt.LocationCode === selectedLocationCode
      );
      if (selectedOption) {
        locationGroup.patchValue({
          WarehouseName: selectedOption.warehouseDesc || '',
          LocationName: selectedOption.locationDesc || '',
          WarehouseCode: selectedOption.warehouseCode || '',
        });
      }
    }
  }

  GetHierarchyType(): void {
    this.busy = this.executiveService.GetHierarchyType().subscribe({
      next: (data) => {
        this.hierarchyType.set(data || ''); // Set signal, default to empty string
        if (data === '1') {
          // Check the actual value returned by the service
          this.lpmtParameterGroup_DataBind();
        }
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error getting hierarchy type:', error);
        // Handle error appropriately, maybe set a default or show message
      },
    });
  }

  lpmtParameterGroup_DataBind(): void {
    // Ensure the component is available
    if (this.lpmtParameterGroup) {
      this.lpmtParameterGroup.dataSourceObservable =
        this.executiveService.GetParameterGroup();
    }
  }

  lpmtLoginUser_Databind(): void {
    // Ensure the component is available
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
      // If it's not a number but has a value, it's invalid
      isValid = false;
    }
    // If commissionValue is null or empty, we might consider it valid depending on business rules
    // Here, we'll assume empty/null is valid unless the field is required elsewhere

    this.other.patchValue({
      CommissionPercentagevalid: isValid,
    });

    // Optionally, set errors directly on the control
    if (!isValid && commissionValue !== null && commissionValue !== '') {
      commissionControl.setErrors({ invalidCommission: true });
    } else {
      // Only clear errors if they were specifically 'invalidCommission'
      if (commissionControl.hasError('invalidCommission')) {
        commissionControl.setErrors(null);
      }
    }
  }

  ValidateIMEINo(): void {
    // Toggle the checkbox value
    const currentVal = this.profile.get('chkValIMEI')?.value;
    this.profile.patchValue({ chkValIMEI: !currentVal });
    // The custom validator `imeiValidator` will automatically check validity when the form value changes
    this.profile.updateValueAndValidity(); // Trigger validation check
  }

  chkAutoTMRouteCode_CheckedChanged(): void {
    const isChecked = this.merchandizing.get('chkAutoTMRouteCode')?.value;

    const prefixControl = this.merchandizing.get('TMRouteCodePrefix');
    if (isChecked) {
      prefixControl?.enable();
      if (this.isEditMode()) {
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
    if (!this.pageInit?.executiveCode) return; // Guard clause
    this.busy = this.executiveService
      .getNextTMRouteNo(this.pageInit.executiveCode.trim())
      .subscribe({
        next: (data: any) => {
          this.merchandizing.patchValue({ NextTMRouteNo: data || '' });
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          this.showError(err);
        },
      });
  }

  onSubmit(): void {
    if (this.executiveForm.invalid) {
      this.markFormGroupTouched(this.executiveForm);
      // Optionally, scroll to first invalid control or show a general error message
      console.log('Form is invalid');
      return;
    }

    this.isLoading.set(true);

    const requestData = this.prepareSubmitData();

    this.busy = this.executiveService.saveExecutiveData(requestData).subscribe({
      next: (response: any) => {
        this.isLoading.set(false);
        if (response?.success) {
          // Check for response and success property
          this.router.navigate(['list']);
        } else {
          this.handleSaveError(response);
        }
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.showError(err);
      },
    });
  }

  private prepareSubmitData(): any {
    // Get selected classifications from components
    const execClassifications =
      this.clsExecutive?.getSelectedClassifications() || [];
    const mktClassifications =
      this.clsMarketingHierarchy?.getSelectedClassifications() || [];
    const geoClassifications = this.clsGeo?.getSelectedClassifications() || [];

    return {
      Mode: this.pageInit?.mode || 'new', // Default to 'new' if not set
      ExecutiveProfile: this.profile.value,
      Stock: this.stock.value,
      Other: this.other.value,
      Merchandizing: this.merchandizing.value,
      executiveClassificationList:
        this.getClassificationRecords(execClassifications),
      marketingHierarchyClassificationList:
        this.getClassificationRecords(mktClassifications),
      geoClassificationList: this.getClassificationRecords(geoClassifications),
      ReturnLocationList: this.returnLocations.value,
    };
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
    // Example error handling, adjust based on your API response structure
    if (response?.errorCode === 1) {
      const userNameControl = this.profile.get('UserName');
      if (userNameControl) {
        userNameControl.setErrors({
          serverError: response.message || 'Username error',
        });
        userNameControl.markAsTouched(); // Mark as touched to show error
      }
    } else if (response?.errorCode === 2) {
      // Handle other specific error codes
      this.showError({ message: response.message || 'An error occurred.' });
    } else {
      this.showError({
        message: response?.message || 'An unknown error occurred.',
      });
    }
  }

  btnCancel_Click(): void {
    this.router.navigate(['/list']); // Ensure leading slash
  }

  siteName(): string {
    return this.commonService.getAPIPrefix();
  }

  showError(err: any): void {
    // Ensure msgPrompt is available
    if (this.msgPrompt) {
      this.msgPrompt.show(
        err?.error?.message || err?.message || 'An error occurred',
        'SOMNT01'
      );
    } else {
      console.error('Message prompt not available:', err);
    }
  }

  private getClassificationRecords(list: any[]): any[] {
    return list.map((item) => ({
      masterGroup: item.groupCode || '',
      masterGroupDescription: item.groupDescription || '', // Check if this field exists in item
      masterGroupValue: item.valueCode || '',
      masterGroupValueDescription: item.valueDescription || '',
    }));
  }

  // Operation type change handler (Aligned with upgraded component)
  lpmtOptType_Changed(event: any): void {
    // Event type depends on list-prompt implementation
    // The value should ideally be set by the list-prompt component via ngModel/formControl
    // If you need to react to the change event specifically:
    const selectedData = event; // Adjust based on what the list-prompt emits
    const operationType = this.profile.get('OperationType')?.value;
    const validTypes = ['OR', 'SL', 'BT']; // Define valid types

    const isVisible = operationType && validTypes.includes(operationType);
    this.profile.patchValue({ IsValidateOperationType: !!isVisible }); // Convert to boolean
  }

  // Date handlers (Aligned with upgraded component)
  onPasswordExpirySelect(date: string | null): void {
    // Accept null
    this.profile.patchValue({ PasswordExpiry: date });
  }

  onJoiningDateSelect(date: string | null): void {
    this.profile.patchValue({ JoiningDate: date });
  }

  onTerminationDateSelect(date: string | null): void {
    this.profile.patchValue({ TerminationDate: date });
  }

  onLastSurveyDateSelect(date: string | null): void {
    this.other.patchValue({ LastSurveyDate: date });
  }

  onSurveyActiveDateSelect(date: string | null): void {
    this.other.patchValue({ SurveyActiveDate: date });
  }

  // List Prompt Data Bind methods (Aligned with upgraded component)
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

  // lpmtCostCenter_DataBind(): void {
  //   if (this.lpmtCostCenter) {
  //     this.lpmtCostCenter.dataSourceObservable =
  //       this.executiveService.getCostCenterPrompt();
  //   }
  // }
  lpmtUnloadingLocation_DataBind() {
    const stockTerritory = this.stock.get('StockTerritory')?.value || '';
    this.lpmtUnloadingLocation.dataSourceObservable =
      this.executiveService.getUnloadingLocation(stockTerritory.trim());
  }
}
