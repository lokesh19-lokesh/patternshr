import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generatePayslipPDF = (payslip: any, companyName: string) => {
  const doc = new jsPDF();
  const monthName = new Date(0, payslip.run.month - 1).toLocaleString('default', { month: 'long' });
  const period = `${monthName} ${payslip.run.year}`;
  const empName = `${payslip.employee?.first_name} ${payslip.employee?.last_name}`;

  // Title & Header
  doc.setFontSize(20);
  doc.setTextColor(40, 40, 40);
  doc.text(companyName, 14, 22);
  
  doc.setFontSize(14);
  doc.setTextColor(100, 100, 100);
  doc.text('PAYSLIP', 14, 30);
  
  doc.setFontSize(10);
  doc.text(`For the period of ${period}`, 14, 36);

  // Employee Details
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 42, 196, 42); // Horizontal line

  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'bold');
  doc.text('Employee Name:', 14, 52);
  doc.setFont('helvetica', 'normal');
  doc.text(empName, 45, 52);

  doc.setFont('helvetica', 'bold');
  doc.text('Employee ID:', 14, 58);
  doc.setFont('helvetica', 'normal');
  doc.text(payslip.employee?.employee_id || 'N/A', 45, 58);

  // Summary Table
  autoTable(doc, {
    startY: 70,
    head: [['Description', 'Amount']],
    body: [
      ['Basic Salary', `$${payslip.basic_salary.toLocaleString()}`],
      ['Total Earnings', `$${payslip.total_earnings.toLocaleString()}`],
      ['Total Deductions', `-$${payslip.total_deductions.toLocaleString()}`],
    ],
    theme: 'grid',
    headStyles: { fillColor: [240, 240, 240], textColor: [40, 40, 40], fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: {
      1: { halign: 'right' }
    }
  });

  // Net Salary
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Net Salary:', 120, finalY);
  doc.setTextColor(37, 99, 235); // Blue-600
  doc.text(`$${payslip.net_salary.toLocaleString()}`, 160, finalY);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.setFont('helvetica', 'normal');
  doc.text('This is a computer generated document and does not require a signature.', 14, 280);

  // Save the PDF
  const filename = `Payslip_${empName.replace(/\s+/g, '_')}_${monthName}_${payslip.run.year}.pdf`;
  doc.save(filename);
};
