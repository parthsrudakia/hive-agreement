import jsPDF from 'jspdf';
import hiveLogo from '@/assets/hive-logo.png';

export interface AgreementData {
  tenantName: string;
  sublessorName: string;
  propertyAddress: string;
  rent: string;
  proRateRent?: string;
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

// Helper to write text with bold names inline
const writeTextWithBoldNames = (
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  tenantName: string,
  sublessorName: string,
  fontSize: number = 10
): number => {
  pdf.setFontSize(fontSize);
  const lines = pdf.splitTextToSize(text, maxWidth);
  const lineHeight = 4.2;
  
  for (const line of lines) {
    let currentX = x;
    const words = line.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const isLastWord = i === words.length - 1;
      
      const isTenantName = tenantName.split(' ').some(part => word.includes(part) && part.length > 2);
      const isSublessorName = sublessorName.split(' ').some(part => word.includes(part) && part.length > 2);
      
      if (isTenantName || isSublessorName) {
        pdf.setFont('helvetica', 'bold');
      } else {
        pdf.setFont('helvetica', 'normal');
      }
      
      pdf.text(word + (isLastWord ? '' : ' '), currentX, y);
      currentX += pdf.getTextWidth(word + ' ');
    }
    y += lineHeight;
  }
  
  pdf.setFont('helvetica', 'normal');
  return y;
};

export const generateAgreementPdf = async (
  data: AgreementData,
  includeLetterhead: boolean
): Promise<void> => {
  const pdf = new jsPDF('p', 'mm', 'letter');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 18;
  
  // Tighter spacing when letterhead is present
  const hasLetterhead = includeLetterhead;
  const clauseSpacing = hasLetterhead ? 1.8 : 2.5;
  const sectionSpacing = hasLetterhead ? 5 : 8;

  // Add letterhead if requested
  if (includeLetterhead) {
    const img = new Image();
    img.src = hiveLogo;
    
    await new Promise((resolve) => {
      img.onload = resolve;
    });
    
    const imgWidth = 55;
    const imgHeight = (img.height / img.width) * imgWidth;
    pdf.addImage(img, 'PNG', margin, yPos, imgWidth, imgHeight);
    
    // Contact details on top right
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const rightX = pageWidth - margin;
    let contactY = yPos + 6;
    
    pdf.text('917-622-9847', rightX, contactY, { align: 'right' });
    contactY += 4;
    pdf.text('Vineet.Dutta@HiveNY.com', rightX, contactY, { align: 'right' });
    contactY += 4;
    pdf.text('442 5th Avenue Suite #2478', rightX, contactY, { align: 'right' });
    contactY += 4;
    pdf.text('New York, NY 10018', rightX, contactY, { align: 'right' });
    
    yPos += imgHeight + 1;
    
    // Yellow divider line
    pdf.setDrawColor(255, 204, 0);
    pdf.setLineWidth(0.7);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;
  }

  // Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  const titleText = 'SUBLEASE AGREEMENT';
  pdf.text(titleText, pageWidth / 2, yPos, { align: 'center' });
  // Underline
  const titleWidth = pdf.getTextWidth(titleText);
  pdf.setLineWidth(0.4);
  pdf.setDrawColor(0, 0, 0);
  pdf.line(pageWidth / 2 - titleWidth / 2, yPos + 1, pageWidth / 2 + titleWidth / 2, yPos + 1);
  yPos += hasLetterhead ? 8 : 10;

  // Introduction paragraph with bold names and address
  pdf.setFontSize(10);
  const lineHeight = 4.2;
  
  // Build the full intro text for proper word wrapping
  const fullIntroText = `This agreement is made between ${data.tenantName} and ${data.sublessorName} for the period beginning ${formatDate(data.leaseStartDate)}, and ending ${formatDate(data.leaseEndDate)}, and will convert to a month-to-month at ${data.propertyAddress}.`;
  
  const introLines = pdf.splitTextToSize(fullIntroText, contentWidth);
  
  for (const line of introLines) {
    let currentX = margin;
    const words = line.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const isLastWord = i === words.length - 1;
      
      // Check if word is part of tenant name, sublessor name, or address
      const isTenantName = data.tenantName.split(' ').some(part => word.includes(part) && part.length > 2);
      const isSublessorName = data.sublessorName.split(' ').some(part => word.includes(part) && part.length > 2);
      const isAddress = data.propertyAddress.split(' ').some(part => word.includes(part) && part.length > 2);
      
      if (isTenantName || isSublessorName || isAddress) {
        pdf.setFont('helvetica', 'bold');
      } else {
        pdf.setFont('helvetica', 'normal');
      }
      
      pdf.text(word + (isLastWord ? '' : ' '), currentX, yPos);
      currentX += pdf.getTextWidth(word + ' ');
    }
    yPos += lineHeight;
  }
  
  pdf.setFont('helvetica', 'normal');
  yPos += 4;

  // Rent and Security Deposit
  pdf.setFontSize(10);
  pdf.text(`1. Rent: $${data.rent}`, margin + 4, yPos);
  yPos += hasLetterhead ? 4 : 5;
  
  // Pro Rate Rent (only if provided)
  let clauseNumber = 2;
  if (data.proRateRent && data.proRateRent.trim() !== '') {
    pdf.text(`${clauseNumber}. Prorated Rent: $${data.proRateRent}`, margin + 4, yPos);
    yPos += hasLetterhead ? 4 : 5;
    clauseNumber++;
  }
  
  pdf.text(`${clauseNumber}. Security Deposit: $${data.securityDeposit}`, margin + 4, yPos);
  yPos += sectionSpacing + (hasLetterhead ? 4 : 0);

  // The parties agree
  pdf.text('The parties agree:', margin, yPos);
  yPos += hasLetterhead ? 9 : 11; // spacing after

  const startClauseNum = 1;
  
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

  // First 3 clauses
  for (let i = 0; i < clauses.length; i++) {
    const clauseText = `${startClauseNum + i}. ${clauses[i]}`;
    yPos = writeTextWithBoldNames(pdf, clauseText, margin + 4, yPos, contentWidth - 8, data.tenantName, data.sublessorName);
    yPos += clauseSpacing;

    // Add sub-clauses after clause 3
    if (i === 2) {
      for (let j = 0; j < subClauses.length; j++) {
        const subClauseText = `${String.fromCharCode(97 + j)}. ${subClauses[j]}`;
        yPos = writeTextWithBoldNames(pdf, subClauseText, margin + 12, yPos, contentWidth - 16, data.tenantName, data.sublessorName);
        yPos += hasLetterhead ? 1 : 1.5;
      }
    }
  }

  // Remaining clauses
  for (let i = 0; i < remainingClauses.length; i++) {
    const clauseText = `${startClauseNum + 3 + i}. ${remainingClauses[i]}`;
    yPos = writeTextWithBoldNames(pdf, clauseText, margin + 4, yPos, contentWidth - 8, data.tenantName, data.sublessorName);
    yPos += clauseSpacing;
  }

  // Signature section
  yPos += hasLetterhead ? 3 : 5;

  pdf.setFontSize(10);
  
  // Sublessor signature
  pdf.setFont('helvetica', 'normal');
  pdf.text('Sublessor: ', margin, yPos);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.sublessorName, margin + pdf.getTextWidth('Sublessor: '), yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Date', pageWidth - margin - 25, yPos);
  yPos += 7;
  
  pdf.text(`${data.sublessorName} ______________`, margin, yPos);
  pdf.text(`________${formatShortDate(data.agreementDate)}___________`, pageWidth - margin - 50, yPos);
  yPos += 10;
  
  // Sublessee signature
  pdf.text('Sublessee: ', margin, yPos);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.tenantName, margin + pdf.getTextWidth('Sublessee: '), yPos);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Date', pageWidth - margin - 25, yPos);
  yPos += 7;
  
  pdf.text('__________________________', margin, yPos);
  pdf.text('________________________', pageWidth - margin - 50, yPos);

  // Save the PDF
  const fileName = `${data.tenantName} Sublease Agreement.pdf`;
  pdf.save(fileName);
};
