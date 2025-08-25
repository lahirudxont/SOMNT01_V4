import {
  Component,
  OnInit,
  ViewChild,
  signal,
  computed,
  effect,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  AbstractControl,
  ValidationErrors,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

// --- Material Imports ---
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
// --- Add other necessary Material modules ---

// --- Services (Migrated) ---
import { ExecutiveService } from '../executive.service'; // Adjust path
import { CommonService } from '../common.service'; // Adjust path
import { MessageService } from '../message.service'; // Adjust path
import { CommonModule } from '@angular/common';

// --- Interfaces/Models (Define based on your data) ---
// You'll need interfaces for ExecutiveProfile, Stock, Other, Merchandizing, Hierarchy, etc.
// Example:
interface ExecutiveProfile {
  ExecutiveCode: string;
  ExecutiveName: string;
  OperationType: string;
  OperationTypeDesc: string;
  UserProfile: string;
  UserProfileName: string;
  IncentiveGroup: string;
  IncentiveGroupName: string;
  // ... other properties
}

interface Stock {
  StockTerritory: string;
  StockTerritoryDesc: string;
  DefStockWarehouse: string;
  DefStockLocation: string;
  DefStockLocationDes: string;
  // ... other properties
}
// ... Define interfaces for Other, Merchandizing, Hierarchy

@Component({
  selector: 'app-new',
  standalone: true,
  imports: [
    // --- Core Modules ---
    CommonModule,
    ReactiveFormsModule, // Essential for reactive forms

    // --- Material Modules ---
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule, // Or your preferred date adapter
    MatProgressBarModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    // --- Import other necessary Material modules ---

    // --- Custom Components (Migrated/Recreated) ---
    // You need to create these as standalone components
    // XontVenturaListPromptComponent, // Needs migration/recreation
    // XontVenturaClassificationSelectorComponent, // Needs migration/recreation
    // XontVenturaDatepickerComponent, // Can use MatDatepicker or migrate
    // XontVenturaGridExportComponent, // Needs migration/recreation or use MatTable features
  ],
  templateUrl: './new.component.html',
  styleUrls: ['./new.component.css'],
})
export class NewComponent implements OnInit {
  // --- UI State ---
  isLoading = signal(false);
  isEditMode = signal(false);
  isHierarchyTabVisible = signal(false);
  // Add signals for other dynamic UI states if needed

  // --- Reactive Forms ---
  mainForm: FormGroup; // The root form group containing all sections
  executiveProfileForm: FormGroup;
  stockForm: FormGroup;
  otherForm: FormGroup;
  merchandizingForm: FormGroup;
  hierarchyForm: FormGroup;
  hierarchyDetailsFormArray: FormArray; // For the Hierarchy Details table

  // --- Data Models (Populated from API or localStorage) ---
  executiveProfile: ExecutiveProfile = {
    ExecutiveCode: '',
    ExecutiveName: '',
    OperationType: '',
    OperationTypeDesc: '',
    UserProfile: '',
    UserProfileName: '',
    IncentiveGroup: '',
    IncentiveGroupName: '',
    // Initialize other properties...
  };
  stock: Stock = {
    StockTerritory: '',
    StockTerritoryDesc: '',
    DefStockWarehouse: '',
    DefStockLocation: '',
    DefStockLocationDes: '',
    // Initialize other properties...
  };
  // other: Other = { ... };
  // merchandizing: Merchandizing = { ... };
  hierarchyDetailsDataset: any[] = []; // Replace 'any' with specific type
  displayedHierarchyColumns: string[] = [
    'BusinessUnit',
    'ExecutiveCode',
    /* ... other columns ... */
    'actions',
  ];

  // --- View Children (for custom components - if needed) ---
  // @ViewChild('lpmtTerritory') lpmtTerritory!: XontVenturaListPromptComponent;
  // @ViewChild('clsExecutive') clsExecutive!: XontVenturaClassificationSelectorComponent;
  // ... Add view children for other custom components

  // --- Configuration Objects (like cls1, cls2 from V4) ---
  clsExecutiveConfig = {
    ID: 'clsExecutive',
    Type: '03',
    TaskCode: 'SOMNT01',
    LabelWidth: '120px',
    EnableUserInput: 'false',
    CodeTextWidth: '120px',
    DescriptionTextWidth: '320px',
    ActiveStatus: 'All', // Or 'Active'
    AllMandatory: 'false',
    LastLevelRequired: 'false',
    Enabled: 'true',
  };
  // clsGeoConfig = { ... }; // Define similarly if needed

  constructor(
    private router: Router,
    private fb: FormBuilder, // For easier form building
    private executiveService: ExecutiveService,
    private commonService: CommonService,
    private messageService: MessageService,
    private snackBar: MatSnackBar
  ) {
    // --- Initialize Forms ---
    this.executiveProfileForm = this.fb.group({
      ExecutiveCode: [{ value: '', disabled: true }], // Usually disabled in edit mode
      ExecutiveName: ['', Validators.required],
      OperationType: ['', Validators.required],
      OperationTypeDesc: [''],
      UserProfile: ['', Validators.required],
      UserProfileName: [''],
      IncentiveGroup: ['', Validators.required],
      IncentiveGroupName: [''],
      // Add other controls with initial values and validators
      // Example:
      // DateOfBirth: [null], // For date pickers, use null or Date object
      // Status: [true], // For checkboxes
      // RetailerType: ['0', Validators.required] // For selects
    });

    this.stockForm = this.fb.group({
      StockTerritory: ['', Validators.required],
      StockTerritoryDesc: [''],
      DefStockWarehouse: ['', Validators.required],
      DefStockLocation: ['', Validators.required],
      DefStockLocationDes: [''],
      // ... other stock controls
    });

    this.otherForm = this.fb.group({
      CommissionPercentage: [0, [Validators.min(0), Validators.max(100)]], // Example validator
      chkOnlineExecutive: [false],
      // ... other 'Other' controls
    });

    this.merchandizingForm = this.fb.group({
      chkAutoTMRouteCode: [false],
      // ... other merchandizing controls
    });

    this.hierarchyForm = this.fb.group({
      HierarchyGroup: ['', Validators.required],
      ParentHierarchy: ['', Validators.required],
      // ... other hierarchy controls
    });

    this.hierarchyDetailsFormArray = this.fb.array([]); // Initially empty

    // --- Main Form Group ---
    this.mainForm = this.fb.group({
      executiveProfile: this.executiveProfileForm,
      stock: this.stockForm,
      other: this.otherForm,
      merchandizing: this.merchandizingForm,
      hierarchy: this.hierarchyForm,
      hierarchyDetails: this.hierarchyDetailsFormArray,
    });

    // --- Example: Disable/Enable fields based on mode or other fields ---
    // Use effects or form value changes subscriptions
    // effect(() => {
    //   if (this.isEditMode()) {
    //     this.executiveProfileForm.get('ExecutiveCode')?.disable();
    //   } else {
    //     this.executiveProfileForm.get('ExecutiveCode')?.enable();
    //   }
    // });

    // this.executiveProfileForm.get('someField')?.valueChanges.subscribe(value => {
    //   if (value === 'someCondition') {
    //     this.otherForm.get('anotherField')?.enable();
    //   } else {
    //     this.otherForm.get('anotherField')?.disable();
    //   }
    // });
  }

  ngOnInit(): void {
    this.isLoading.set(true);
    const pageInitData = localStorage.getItem('SOMNT01_PageInit');
    let mode = 'new';
    let execCode = '';
    let execName = '';

    if (pageInitData) {
      try {
        const data = JSON.parse(pageInitData);
        mode = data.Mode || 'new';
        execCode = data.ExecutiveCode || '';
        execName = data.ExecutiveName || '';
      } catch (e) {
        console.error('Error parsing SOMNT01_PageInit:', e);
      }
    }

    this.isEditMode.set(mode === 'edit');
    // Set initial form values based on mode and data
    if (mode === 'edit' || mode === 'newBasedOn') {
      this.loadExecutiveData(execCode, mode); // Load data for edit/newBasedOn
    } else {
      // New mode - just set initial UI state
      this.initializeFormForNew();
      this.isLoading.set(false);
    }

    // Load static lookup data (e.g., operation types, user profiles) if needed on init
    // this.loadStaticData();
  }

  private initializeFormForNew(): void {
    // Set any default values for a new form
    // this.executiveProfileForm.patchValue({ Status: true }); // Example
    // Trigger any initial data loads for prompts/classifications if needed
  }

  private loadExecutiveData(executiveCode: string, mode: string): void {
    // Call the service to load executive data
    // const apiUrl = `${this.commonService.getAPIPrefix()}/api/SOMNT01/GetExecutiveDetails?code=${executiveCode}`;
    // this.http.get<any>(apiUrl).subscribe({
    //   next: (data) => {
    //     // Populate the form groups with data
    //     this.executiveProfileForm.patchValue(data.executiveProfile);
    //     this.stockForm.patchValue(data.stock);
    //     // ... populate other form groups
    //     this.hierarchyDetailsDataset = data.hierarchyDetails || [];
    //     this.updateHierarchyDetailsFormArray(); // Populate FormArray from dataset
    //     this.isLoading.set(false);
    //   },
    //   error: (err) => {
    //     this.isLoading.set(false);
    //     console.error('Error loading executive data:', err);
    //     this.messageService.addMessage({ code: 'ERR_LOAD_DATA', description: 'Failed to load executive data.', type: 'error' }, 'SOMNT01');
    //     if (mode === 'edit') {
    //        // If edit fails, maybe navigate back or show error
    //        this.router.navigate(['/list']);
    //     }
    //   }
    // });

    // Placeholder for now
    console.log(`Loading data for executive: ${executiveCode}, Mode: ${mode}`);
    this.isLoading.set(false);
  }

  // --- Form Interactions ---
  onSubmit(): void {
    if (this.mainForm.valid) {
      this.isLoading.set(true);
      const formData = this.mainForm.value;
      // Prepare data for saving according to your API contract
      const saveData = {
        ExecutiveProfile: formData.executiveProfile,
        Stock: formData.stock,
        Other: formData.other,
        Merchandizing: formData.merchandizing,
        Hierarchy: formData.hierarchy,
        HierarchyDetails: formData.hierarchyDetails, // This will be the array from the FormArray
      };

      // Call the service to save data
      // const apiUrl = `${this.commonService.getAPIPrefix()}/api/SOMNT01/SaveExecutive`;
      // const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
      // this.http.post<any>(apiUrl, saveData, { headers }).subscribe({
      //   next: (response) => {
      //     this.isLoading.set(false);
      //     // Handle success (e.g., show message, navigate)
      //     this.snackBar.open('Executive saved successfully!', 'Close', { duration: 3000 });
      //     this.router.navigate(['/list']); // Navigate back to list
      //   },
      //   error: (err) => {
      //     this.isLoading.set(false);
      //     console.error('Error saving executive:', err);
      //     // Handle error (e.g., show message)
      //     this.messageService.addMessage({ code: 'ERR_SAVE_DATA', description: 'Failed to save executive data.', type: 'error' }, 'SOMNT01');
      //   }
      // });

      // Placeholder for now
      console.log('Saving data:', saveData);
      this.isLoading.set(false);
      this.snackBar.open(
        'Executive saved successfully (placeholder)!',
        'Close',
        { duration: 3000 }
      );
      this.router.navigate(['/list']);
    } else {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched(this.mainForm);
      this.snackBar.open('Please correct the errors in the form.', 'Close', {
        duration: 3000,
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/list']);
  }

  // --- Helper for Validation ---
  private markFormGroupTouched(formGroup: FormGroup | FormArray): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      if (control instanceof FormControl) {
        control.markAsTouched();
      } else if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }

  // --- Hierarchy Details Table Management ---
  updateHierarchyDetailsFormArray(): void {
    // Clear existing form array
    this.hierarchyDetailsFormArray.clear();
    // Add form groups for each item in the dataset
    this.hierarchyDetailsDataset.forEach((item) => {
      this.hierarchyDetailsFormArray.push(
        this.createHierarchyDetailFormGroup(item)
      );
    });
  }

  createHierarchyDetailFormGroup(data: any): FormGroup {
    // Use specific interface instead of 'any'
    return this.fb.group({
      BusinessUnit: [data.BusinessUnit || '', Validators.required],
      ExecutiveCode: [data.ExecutiveCode || ''],
      // ... map other properties from 'data'
    });
  }

  addHierarchyDetail(): void {
    const newRow = this.createHierarchyDetailFormGroup({}); // Empty object for new row
    this.hierarchyDetailsFormArray.push(newRow);
  }

  removeHierarchyDetail(index: number): void {
    this.hierarchyDetailsFormArray.removeAt(index);
    // Optionally update the dataset if needed immediately
    // this.hierarchyDetailsDataset.splice(index, 1);
  }

  // --- Prompt/List Interactions (Example) ---
  // These methods would interact with your migrated custom prompt components
  openTerritoryPrompt(): void {
    // Logic to open the territory prompt (e.g., MatDialog with a prompt component)
    // Pass data, handle selection result
    // Example using MatDialog (requires MatDialog import and injection):
    // const dialogRef = this.dialog.open(TerritoryPromptDialogComponent, {
    //   width: '600px',
    //   data: { /* initial data if needed */ }
    // });

    // dialogRef.afterClosed().subscribe(result => {
    //   if (result) {
    //     // Handle selected data
    //     this.stockForm.patchValue({
    //       StockTerritory: result.code,
    //       StockTerritoryDesc: result.description
    //     });
    //   }
    // });
    console.log('Opening Territory Prompt (Placeholder)');
  }

  // Similar methods for other prompts (OperationType, UserProfile, etc.)
  // openOperationTypePrompt() { ... }
  // openUserProfilePrompt() { ... }

  // --- Classification Selector Interactions (Example) ---
  // getSelectedClassifications() {
  //   // Call method on the migrated classification selector component
  //   // return this.clsExecutive?.getSelectedClassifications() || [];
  // }

  // --- Custom Validators (if needed) ---
  // static customValidator(control: AbstractControl): ValidationErrors | null {
  //   // Implement custom validation logic
  //   const value = control.value;
  //   if (value && value.length < 5) {
  //     return { customError: true };
  //   }
  //   return null;
  // }
  // Inside new.component.ts class

  // --- Prompt/List Interactions ---
  openOperationTypePrompt(): void {
    console.log('Opening Operation Type Prompt (Placeholder)');
    // TODO: Implement logic to open the Operation Type prompt
    // This will likely involve your migrated xont-ventura-list-prompt component
    // or using MatDialog with a custom dialog component.
  }

  openUserProfilePrompt(): void {
    console.log('Opening User Profile Prompt (Placeholder)');
    // TODO: Implement logic to open the User Profile prompt
  }

  openIncentiveGroupPrompt(): void {
    console.log('Opening Incentive Group Prompt (Placeholder)');
    // TODO: Implement logic to open the Incentive Group prompt
  }

  openStockTerritoryPrompt(): void {
    // Correct the name based on the error
    console.log('Opening Stock Territory Prompt (Placeholder)');
    // TODO: Implement logic to open the Stock Territory prompt
  }

  openDefStockWarehousePrompt(): void {
    console.log('Opening Default Stock Warehouse Prompt (Placeholder)');
    // TODO: Implement logic to open the Default Stock Warehouse prompt
  }

  openDefStockLocationPrompt(): void {
    console.log('Opening Default Stock Location Prompt (Placeholder)');
    // TODO: Implement logic to open the Default Stock Location prompt
  }

  openHierarchyGroupPrompt(): void {
    console.log('Opening Hierarchy Group Prompt (Placeholder)');
    // TODO: Implement logic to open the Hierarchy Group prompt
  }

  openParentHierarchyPrompt(): void {
    console.log('Opening Parent Hierarchy Prompt (Placeholder)');
    // TODO: Implement logic to open the Parent Hierarchy prompt
  }

  // --- Hierarchy Details Table Helper ---
  getHierarchyDetailControl(
    rowIndex: number,
    controlName: string
  ): AbstractControl | null {
    const rowGroup = this.hierarchyDetailsFormArray.at(rowIndex) as FormGroup;
    return rowGroup ? rowGroup.get(controlName) : null;
  }
}
