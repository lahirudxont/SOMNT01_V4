import { Component, Input } from '@angular/core';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Define a type for header configuration for type safety
export interface ExportHeader {
  key: string; // The key in the data object
  label: string; // The display label for the column header
}

@Component({
  selector: 'xont-ventura-gridexport',
  template: `
    <span class="Linkboldtext">{{ gridName }}&nbsp;&nbsp;</span>
    <button
      title="Excel"
      class="btn btn-sm btn-success"
      (click)="exportToExcel()"
    >
      <i class="fa fa-file-excel-o"></i>
    </button>
    <button title="PDF" class="btn btn-sm btn-danger" (click)="exportToPdf()">
      <i class="fa fa-file-pdf-o"></i>
    </button>
    <button
      title="Word"
      class="btn btn-sm btn-primary"
      (click)="exportToWord()"
    >
      <i class="fa fa-file-word-o"></i>
    </button>
  `,
})
export class XontVenturaGridExportComponent {
  @Input() gridName = 'Export';
  @Input() data: any[] = [];
  @Input() headers: ExportHeader[] = [];

  // --- PDF Export ---
  exportToPdf(): void {
    const doc = new jsPDF();
    const head = [this.headers.map((h) => h.label)];
    const body = this.data.map((row) =>
      this.headers.map((h) => row[h.key] || '')
    );

    (doc as any).autoTable({ head, body });
    doc.save(`${this.gridName}.pdf`);
  }

  // --- Excel Export ---
  exportToExcel(): void {
    const xml = this.generateXmlForExcel();
    const blob = new Blob([xml], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    this.downloadBlob(blob, `${this.gridName}.xls`);
  }

  // --- Word Export ---
  exportToWord(): void {
    const html = this.generateHtmlForWord();
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    this.downloadBlob(blob, `${this.gridName}.doc`);
  }

  // --- Private Helper Methods ---

  private downloadBlob(blob: Blob, filename: string): void {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private generateXmlForExcel(): string {
    const headerXml = `<ss:Row>${this.headers
      .map(
        (h) =>
          `<ss:Cell ss:StyleID="columnheaders"><ss:Data ss:Type="String">${h.label}</ss:Data></ss:Cell>`
      )
      .join('')}</ss:Row>`;
    const bodyXml = this.data
      .map(
        (row) =>
          `<ss:Row>${this.headers
            .map((h) => {
              const value = row[h.key] || '';
              const type = isNaN(value) ? 'String' : 'Number';
              return `<ss:Cell><ss:Data ss:Type="${type}">${value}</ss:Data></ss:Cell>`;
            })
            .join('')}</ss:Row>`
      )
      .join('');

    return `<?xml version="1.0"?><ss:Workbook xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><ss:Styles><ss:Style ss:ID="columnheaders"><ss:Font ss:Bold="1" /></ss:Style></ss:Styles><ss:Worksheet ss:Name="${this.gridName}"><ss:Table>${headerXml}${bodyXml}</ss:Table></ss:Worksheet></ss:Workbook>`;
  }

  private generateHtmlForWord(): string {
    const css = `<style>table{border-collapse:collapse;} td,th{padding:5px; border:1px solid #AAAAAA;} th{background-color:#006699;color:white;}</style>`;
    const headerHtml = `<tr>${this.headers
      .map((h) => `<th>${h.label}</th>`)
      .join('')}</tr>`;
    const bodyHtml = this.data
      .map(
        (row) =>
          `<tr>${this.headers
            .map((h) => `<td>${row[h.key] || ''}</td>`)
            .join('')}</tr>`
      )
      .join('');

    return `<html><head>${css}</head><body><table>${headerHtml}${bodyHtml}</table></body></html>`;
  }
}
