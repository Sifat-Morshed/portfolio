import jsPDF from 'jspdf';

export const generateCV = () => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Dark background
  doc.setFillColor(10, 10, 15);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Header gradient effect (simulate with rectangles)
  doc.setFillColor(6, 182, 212, 0.1);
  doc.rect(0, 0, pageWidth, 60, 'F');

  // Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.text('SIFAT MORSHED', margin, yPos + 15);

  // Title
  doc.setTextColor(6, 182, 212);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  yPos += 25;
  doc.text('Outbound Sales Specialist & Appointment Setter', margin, yPos);

  // Contact Info
  yPos += 15;
  doc.setFontSize(10);
  doc.setTextColor(200, 200, 200);
  doc.setFont('helvetica', 'normal');
  doc.text('📞 +880 1867001744', margin, yPos);
  doc.text('✉️  sifat.morshed.dev@gmail.com', margin + 70, yPos);
  yPos += 6;
  doc.text('📍 Dhaka-1219, Bangladesh', margin, yPos);

  // Section divider
  yPos += 10;
  doc.setDrawColor(6, 182, 212);
  doc.setLineWidth(0.5);
  doc.line(margin, yPos, pageWidth - margin, yPos);

  // Professional Summary
  yPos += 10;
  doc.setTextColor(6, 182, 212);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PROFESSIONAL SUMMARY', margin, yPos);

  yPos += 8;
  doc.setTextColor(220, 220, 220);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const summaryText = 'Motivated and confident appointment setter with experience in outbound calling, lead qualification, and setting home-service and solar appointments for US clients. Skilled in communication, objection handling, and building rapport quickly over the phone. Strong work ethic, consistent performance, and ability to meet weekly KPIs.';
  const splitSummary = doc.splitTextToSize(summaryText, pageWidth - 2 * margin);
  doc.text(splitSummary, margin, yPos);
  yPos += splitSummary.length * 5;

  // Experience Section
  yPos += 10;
  doc.setDrawColor(6, 182, 212);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  doc.setTextColor(6, 182, 212);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('EXPERIENCE', margin, yPos);

  // Job 1
  yPos += 10;
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Appointment Setter', margin, yPos);
  
  doc.setTextColor(6, 182, 212);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('PrimePath Home Services (Columbus, OH)', margin + 55, yPos);

  yPos += 6;
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(9);
  doc.text('4 Months Duration', margin, yPos);

  yPos += 6;
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(10);
  const tasks1 = [
    '• Cold-called US homeowners to schedule home inspection assessments.',
    '• Qualified leads based on homeowner interest, property eligibility, and utility status.',
    '• Maintained call logs and updated CRM entries accurately.'
  ];
  tasks1.forEach(task => {
    doc.text(task, margin + 5, yPos);
    yPos += 5;
  });

  // Job 2
  yPos += 8;
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Appointment Setter', margin, yPos);
  
  doc.setTextColor(6, 182, 212);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('BrightLeaf Solar Solutions (Walnut Creek, CA)', margin + 55, yPos);

  yPos += 6;
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(9);
  doc.text('4 Months Duration', margin, yPos);

  yPos += 6;
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(10);
  const tasks2 = [
    '• Outbound calls to homeowners for solar & roof inspection appointments.',
    '• Provided daily reporting to team leader.',
    '• Managed calendar logistics for field consultants.'
  ];
  tasks2.forEach(task => {
    doc.text(task, margin + 5, yPos);
    yPos += 5;
  });

  // Education & Skills Section
  yPos += 10;
  doc.setDrawColor(6, 182, 212);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 10;

  doc.setTextColor(6, 182, 212);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('EDUCATION', margin, yPos);

  yPos += 8;
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('BSc in Computer Science & Engineering', margin, yPos);
  
  yPos += 5;
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Southeast University (Present)', margin, yPos);

  yPos += 8;
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Higher Secondary School Certificate (H.S.C)', margin, yPos);

  yPos += 8;
  doc.text('Secondary School Certificate (S.S.C)', margin, yPos);

  // Skills Section
  yPos += 15;
  doc.setTextColor(6, 182, 212);
  doc.setFontSize(12);
  doc.text('SKILLS', margin, yPos);

  yPos += 8;
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const skills = [
    'Outbound Prospecting • CRM Proficiency • Lead Qualification • Solar Energy Sector',
    'Objection Handling • English Fluency (C1) • Scheduling • Client Relations'
  ];
  skills.forEach(line => {
    doc.text(line, margin, yPos);
    yPos += 6;
  });

  // Footer
  doc.setFillColor(6, 182, 212, 0.05);
  doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.text('Generated by Sifat Morshed Portfolio System • 2026', pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Save PDF
  doc.save('Sifat_Morshed_CV.pdf');
};
