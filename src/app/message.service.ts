import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { CommonService } from './common.service';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable()
export class MessageService {
  constructor(private http: HttpClient, private commonService: CommonService) {}

  public getMessage(msgID: number): Observable<any> {
    return this.http
      .get(`${this.getSiteName()}/api/Message/GetMessage?msgID=${msgID}`)
      .pipe(catchError(this.handleError));
  }

  public getUserName(): Observable<string> {
    return this.http
      .get<string>(`${this.getSiteName()}/api/Message/GetUserName`)
      .pipe(catchError(this.handleError));
  }

  private getSiteName(): string {
    return this.commonService.getAPIPrefix();
  }

  private handleError(error: HttpErrorResponse) {
    // Return an observable with a user-facing error message.
    return throwError(
      () => new Error('Something bad happened; please try again later.')
    );
  }
}
