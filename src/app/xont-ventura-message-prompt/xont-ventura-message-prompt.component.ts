import {
  Component,
  Input,
  ViewChild,
  TemplateRef,
  Output,
  EventEmitter,
} from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { MessageService } from '../message.service';
import { finalize } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

export interface IErrorMessage {
  ErrorType: 1 | 2;
  ErrorLog?: string;
  ErrorTime?: string;
  WorkstationId?: string;
  UserName?: string;
  IpAddress?: string;
  MsgNumber?: number;
  Desc?: string;
  ErrorSource?: string;
  DllName?: string;
  Version?: string;
  Routine?: string;
  LineNumber?: string;
}

@Component({
  selector: 'xont-ventura-message-prompt',
  providers: [MessageService],
  templateUrl: './xont-ventura-message-prompt.component.html',
  imports: [CommonModule],
})
export class XontVenturaMessagePromptComponent {
  @ViewChild('modalContent')
  private modalContent!: TemplateRef<any>;

  // Outputs for confirmation dialogs
  @Output() onOK: EventEmitter<void> = new EventEmitter();
  @Output() onCancel: EventEmitter<void> = new EventEmitter();

  // Modal state
  private modalRef!: NgbModalRef;
  isLoading = false;

  // Configurable properties
  messageType: 'alert' | 'confirm' | 'error' = 'alert';
  messageText = '';
  okButtonText = 'Yes';
  cancelButtonText = 'No';
  errorMessage: IErrorMessage | undefined;

  constructor(
    private messageService: MessageService,
    private modalService: NgbModal
  ) {}

  // --- Public Methods ---

  public show(error: IErrorMessage, taskCode: string): void {
    this.messageType = 'error';
    this.errorMessage = this.formatErrorMessage(error);

    if (this.errorMessage.ErrorType === 1) {
      this.isLoading = true;
      this.messageService
        .getUserName()
        .pipe(
          finalize(() => {
            this.isLoading = false;
            this.modalRef = this.modalService.open(this.modalContent, {
              backdrop: 'static',
            });
          })
        )
        .subscribe((userName) => {
          if (this.errorMessage) this.errorMessage.UserName = userName;
        });
    } else {
      this.modalRef = this.modalService.open(this.modalContent, {
        backdrop: 'static',
        size: 'sm',
      });
    }
  }

  public confirmation(msgID: number, ...params: string[]): void {
    this.messageType = 'confirm';
    this.isLoading = true;
    this.messageService
      .getMessage(msgID)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe((data) => {
        let msg =
          data?.[0]?.MessageText?.trim() || `Message ${msgID} not found.`;
        params.forEach((param, index) => {
          if (param != null) msg = msg.replace(`&${index + 1}`, param.trim());
        });
        this.messageText = msg;
        this.modalRef = this.modalService.open(this.modalContent, {
          backdrop: 'static',
          size: 'sm',
        });
      });
  }

  public alert(msgID: number, ...params: string[]): void {
    this.messageType = 'alert';
    this.okButtonText = 'OK';
    this.isLoading = true;
    this.messageService
      .getMessage(msgID)
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe((data) => {
        let msg =
          data?.[0]?.MessageText?.trim() || `Message ${msgID} not found.`;
        params.forEach((param, index) => {
          if (param != null) msg = msg.replace(`&${index + 1}`, param.trim());
        });
        this.messageText = msg;
        this.modalRef = this.modalService.open(this.modalContent, {
          backdrop: 'static',
          size: 'sm',
        });
      });
  }

  // --- Modal Actions ---

  confirm_ok(): void {
    this.modalRef.close();
    this.onOK.emit();
  }

  confirm_cancel(): void {
    this.modalRef.dismiss();
    this.onCancel.emit();
  }

  alert_ok(): void {
    this.modalRef.close();
    this.onOK.emit();
  }

  // --- Private Helpers ---

  private formatErrorMessage(error: IErrorMessage): IErrorMessage {
    if (error.ErrorTime) {
      const date = new Date(error.ErrorTime);
      error.ErrorTime = date
        .toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
        .replace(',', ' ');
    }
    return error;
  }
}
