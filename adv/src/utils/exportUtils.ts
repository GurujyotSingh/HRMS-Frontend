import { saveAs } from 'file-saver';

export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => JSON.stringify(row[header] || '')).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, filename);
};

export const exportToPDF = (elementId: string, filename: string) => {
  // This is a placeholder - in a real app, you'd use a library like jsPDF
  console.log(`Exporting element ${elementId} to PDF as ${filename}`);
  alert('PDF export functionality would be implemented with a library like jsPDF');
};

export const exportToExcel = (data: any[], filename: string) => {
  // This is a placeholder - in a real app, you'd use a library like xlsx
  console.log(`Exporting data to Excel as ${filename}`);
  alert('Excel export functionality would be implemented with a library like xlsx');
};

export const printElement = (elementId: string) => {
  const printContents = document.getElementById(elementId)?.innerHTML;
  if (!printContents) return;

  const originalContents = document.body.innerHTML;
  document.body.innerHTML = printContents;
  window.print();
  document.body.innerHTML = originalContents;
  window.location.reload();
};