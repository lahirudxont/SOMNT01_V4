import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Define interfaces
export interface Executive {
  executiveCode: string;
  executiveName: string;
  userProfileName: string;
  territoryName: string;
  operationTypeDesc: string;
  status: number; // For deactiveRow
}

export interface SelectionCriteria {
  ExecutiveCode: string;
  ExecutiveName: string;
  TerritoryCode: string;
  TerritoryDesc: string;
  OperationType: string;
  OperationTypeDesc: string;
  Executive1: string;
  Executive2: string;
  Executive3: string;
  Executive4: string;
  Executive5: string;
  SearchType: 'startWith' | 'anyWhere';
  ActiveOnly: boolean;
  FirstRow: number;
  LastRow: number;
  Collapsed: boolean;
}

export interface SelectedClassification {
  ParameterCode: string;
  ParameterValue: string;
}

export interface GetAllExecutiveResponse {
  executives: Executive[];
  totalCount: number;
}

@Injectable({
  providedIn: 'root',
})
export class ExecutiveService {
  private readonly API_BASE_URL = '/api/SOMNT01';
  private componentMethodCallSource = new Subject<any>();
  componentMethodCalled$ = this.componentMethodCallSource.asObservable();

  constructor(private http: HttpClient) {}

  private getApiUrl(endpoint: string): string {
    return `${this.API_BASE_URL}/${endpoint}`;
  }

  public getAllExecutive(data: {
    SelectionCriteria: SelectionCriteria;
    SelectedClassifications: SelectedClassification[];
  }): Observable<GetAllExecutiveResponse> {
    const url = this.getApiUrl('GetAllExecutive');
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });

    return this.http
      .post<GetAllExecutiveResponse>(url, data, { headers })
      .pipe(catchError(this.handleError));
  }

  public getOptTypePrompt(): Observable<any> {
    const url = this.getApiUrl('GetOperationTypePrompt');
    return this.http.get<any>(url).pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error);
    return throwError(
      () => new Error(`Error Code: ${error.status}\nMessage: ${error.message}`)
    );
  }
}
