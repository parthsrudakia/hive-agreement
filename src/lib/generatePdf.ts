import jsPDF from 'jspdf';
import hiveLetterhead from '@/assets/hive-letterhead.png';

export interface AgreementData {
  tenantName: string;
  sublessorName: string;
  propertyAddress: string;
  rent: string;
  securityDeposit: string;
  leaseStartDate: string;
  leaseEndDate: string;
  agreementDate: string;
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

const formatShortDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    year: '2-digit', 
    month: '2-digit', 
    day: '2-digit' 
  });
};

export const generateAgreementPdf = async (
  data: AgreementData,
  includeLetterhead: boolean
): Promise<void> => {
  const pdf = new jsPDF('p', 'mm', 'letter');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 25;
  const contentWidth = pageWidth - margin * 2;
  let yPos = margin;

  // Add letterhead if requested
  if (includeLetterhead) {
    // Load and add the letterhead image
    const img = new Image();
    img.src = hiveLetterhead;
    
    await new Promise((resolve) => {
      img.onload = resolve;
    });
    
    // Add letterhead image (width: 160mm, height proportional)
    const imgWidth = 160;
    const imgHeight = (img.height / img.width) * imgWidth;
    pdf.addImage(img, 'PNG', margin, yPos, imgWidth, imgHeight);
    yPos += imgHeight + 5;
    
    // Add yellow divider line
    pdf.setDrawColor(255, 204, 0);
    pdf.setLineWidth(1);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 10;
  }

  // Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  const title = includeLetterhead ? 'Agreement' : 'Rental Agreement';
  pdf.text(title, pageWidth / 2, yPos, { align: 'center' });
  yPos += 12;

  // Introduction paragraph
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  const introParagraph = `This agreement is made between ${data.tenantName} and ${data.sublessorName} for the period beginning ${formatDate(data.leaseStartDate)}, and ending ${formatDate(data.leaseEndDate)}, and will convert to a month-to-month at ${data.propertyAddress}.`;
  
  const introLines = pdf.splitTextToSize(introParagraph, contentWidth);
  pdf.text(introLines, margin, yPos);
  yPos += introLines.length * 5 + 8;

  // Rent and Security Deposit
  pdf.setFont('helvetica', 'normal');
  pdf.text(`1. Rent: $${data.rent}`, margin + 5, yPos);
  yPos += 6;
  pdf.text(`2. Security Deposit: $${data.securityDeposit}`, margin + 5, yPos);
  yPos += 10;

  // The parties agree
  pdf.setFont('helvetica', 'normal');
  pdf.text('The parties agree:', margin, yPos);
  yPos += 8;

  const clauses = [
    `If the monthly electric bill exceeds $200, the amount over $200 will be divided equally among three occupants, with ${data.tenantName} responsible for his/her share of the excess charge.`,
    `Rent will be paid on the first of the month, if payment is not received by the 3rd of the month a $50 late fee will be applied.`,
    `Both ${data.sublessorName} and ${data.tenantName} will be required to give a 30-day notice period in the event parties want to terminate the agreement earlier.`,
  ];

  const subClauses = [
    `${data.tenantName} must provide 30 days' notice before the end date of the agreement if he/she decides to vacate by the end of the agreement.`,
    `If a 30-day notice is not given security deposit will be forfeited by ${data.tenantName}.`,
    `${data.tenantName} will be charged for a full month's rent in the event the move takes place in the middle of the month.`,
  ];

  const remainingClauses = [
    `Security deposit will be returned within 14 days of moving out.`,
    `Smoking is strictly prohibited within the apartment and building. If you are found smoking in the apartment, a $1,000 fine will be issued.`,
    `${data.tenantName} agrees to adhere to cleanliness standards or additional incurred charges for maid services will be required.`,
    `${data.tenantName} shall pay for all property damage he/she is responsible for in the event something happens during sublease.`,
    `A move out cleaning fee of $100 will be applied.`,
    `A joint inspection of the premises shall be conducted by ${data.sublessorName} and ${data.tenantName} recording any damage or deficiencies that exist as the start of the sublease period.`,
    `${data.tenantName} shall be liable for the cost of any cleaning or repair to correct damages caused by ${data.tenantName} at the end of the period if not recorded at the start of the agreement, normal wear and tears excepted. Security deposit will be refunded after vacating the apartment given there is no damage (except normal wear and tear) found prior to vacating.`,
    `${data.tenantName} must reimburse ${data.sublessorName} for the following fee and expenses incurred by ${data.sublessorName.split(' ')[0]}: Any legal fees and disbursements for the preparation and service of legal notices; legal actions or proceedings brought by ${data.sublessorName} against ${data.tenantName} because of a default by ${data.tenantName} under this agreement; or for defending lawsuits brought against ${data.sublessorName} because of the actions of ${data.tenantName}, or any associates of ${data.tenantName}.`,
  ];

  pdf.setFontSize(10);

  // First 3 clauses
  for (let i = 0; i < clauses.length; i++) {
    const clauseText = `${i + 1}. ${clauses[i]}`;
    const lines = pdf.splitTextToSize(clauseText, contentWidth - 5);
    
    // Check if we need a new page
    if (yPos + lines.length * 4.5 > 250) {
      pdf.addPage();
      yPos = margin;
    }
    
    pdf.text(lines, margin + 5, yPos);
    yPos += lines.length * 4.5 + 2;

    // Add sub-clauses after clause 3
    if (i === 2) {
      for (let j = 0; j < subClauses.length; j++) {
        const subClauseText = `${String.fromCharCode(97 + j)}. ${subClauses[j]}`;
        const subLines = pdf.splitTextToSize(subClauseText, contentWidth - 15);
        
        if (yPos + subLines.length * 4.5 > 250) {
          pdf.addPage();
          yPos = margin;
        }
        
        pdf.text(subLines, margin + 15, yPos);
        yPos += subLines.length * 4.5 + 2;
      }
    }
  }

  // Remaining clauses (4-11)
  for (let i = 0; i < remainingClauses.length; i++) {
    const clauseText = `${i + 4}. ${remainingClauses[i]}`;
    const lines = pdf.splitTextToSize(clauseText, contentWidth - 5);
    
    if (yPos + lines.length * 4.5 > 250) {
      pdf.addPage();
      yPos = margin;
    }
    
    pdf.text(lines, margin + 5, yPos);
    yPos += lines.length * 4.5 + 2;
  }

  // Signature section
  yPos += 10;
  
  if (yPos > 230) {
    pdf.addPage();
    yPos = margin;
  }

  pdf.setFontSize(11);
  
  // Sublessor signature
  pdf.text(`Sublessor: ${data.sublessorName}`, margin, yPos);
  pdf.text('Date', pageWidth - margin - 40, yPos);
  yPos += 10;
  
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${data.sublessorName} ______________`, margin, yPos);
  pdf.text(`________${formatShortDate(data.agreementDate)}___________`, pageWidth - margin - 60, yPos);
  yPos += 15;
  
  // Sublessee signature
  pdf.text(`Sublessee: ${data.tenantName}`, margin, yPos);
  pdf.text('Date', pageWidth - margin - 40, yPos);
  yPos += 10;
  
  pdf.text('__________________________', margin, yPos);
  pdf.text('________________________', pageWidth - margin - 60, yPos);

  // Save the PDF
  const fileName = `Agreement_${data.tenantName.replace(/\s+/g, '_')}${includeLetterhead ? '_Hive' : ''}.pdf`;
  pdf.save(fileName);
};
