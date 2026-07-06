import jsPDF from 'jspdf';
import { profileImage } from '../constants/assets';

const toDataUrl = async (url: string) => {
  const res = await fetch(url);
  const blob = await res.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const generateCV = async () => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  let yPos = margin;

  // White background for ATS friendliness
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');

  // Try to embed profile image if available
  try {
    const imgData = await toDataUrl(profileImage as unknown as string);
    const imgW = 30;
    const imgH = 30;
    doc.addImage(imgData, 'JPEG', pageWidth - margin - imgW, margin, imgW, imgH);
  } catch (e) {
    // ignore if image load fails
  }

  // Header: name + title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('Sifat Morshed', margin, yPos + 10);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Outbound Sales Specialist & Appointment Setter', margin, yPos + 18);

  // Contact
  yPos += 26;
  doc.setFontSize(10);
  doc.text('Phone: +880 1867001744 | Email: sifatmorshed123@gmail.com | Dhaka-1219, Bangladesh', margin, yPos);

  // Professional summary
  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('PROFESSIONAL SUMMARY', margin, yPos);
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  const summary = 'Cumulative experience across outbound sales, appointment setting, recruiting and contract research. Skilled with CRM workflows, scheduling, recruiting and closing.';
  const summaryLines = doc.splitTextToSize(summary, pageWidth - margin * 2);
  doc.text(summaryLines, margin, yPos);
  yPos += summaryLines.length * 5 + 6;

  // Experiences (ordered newest first)
  const experiences = [
    { title: 'Independent Reseller', company: 'Apple Device Reselling', dates: 'Mar 2019 — Apr 2026', bullets: ['Sourced and refurbished Apple devices for resale.', 'Managed sales channels and buyer relationships.'] },
    { title: 'Sales Closer', company: '21ideas LLC', dates: 'Nov 2024 — Apr 2025', bullets: ['Closed qualified leads and coordinated handoffs.', 'Handled discovery calls and negotiations.'] },
    { title: 'Appointment Setter', company: '21ideas LLC', dates: 'Jan 2024 — Oct 2024', bullets: ['Prospected and qualified B2B leads for IT/AI services.', 'Managed CRM workflows and reporting.'] },
    { title: 'Independent Contractor', company: 'Silverlight Research', dates: 'Feb 2024 — Jul 2024', bullets: ['B2B lead research for IT/AI buyers.', 'Built outreach lists and pilot campaigns.'] },
    { title: 'Recruiter & HR', company: '21ideas LLC', dates: 'Jun 2023 — May 2024', bullets: ['Led full-cycle recruiting and onboarding.', 'Designed screening questions and assessments.'] },
    { title: 'Appointment Setter', company: 'PrimePath Home Services', dates: 'Nov 2022 — Feb 2023', bullets: ['Cold-called US homeowners to schedule home inspection assessments.', 'Maintained CRM entries and call logs.'] },
    { title: 'Appointment Setter', company: 'BrightLeaf Solar Solutions', dates: 'May 2021 — Aug 2021', bullets: ['Outbound calls to homeowners for solar appointments.', 'Provided daily reporting to team leader.'] }
  ];

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('EXPERIENCE', margin, yPos);
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  experiences.forEach(exp => {
    if (yPos > doc.internal.pageSize.getHeight() - 60) {
      doc.addPage();
      yPos = margin;
    }
    doc.setFont('helvetica', 'bold');
    doc.text(`${exp.title} — ${exp.company}`, margin, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(exp.dates, pageWidth - margin - 50, yPos);
    yPos += 5;
    exp.bullets.forEach(b => {
      const lines = doc.splitTextToSize('• ' + b, pageWidth - margin * 2 - 8);
      doc.text(lines, margin + 4, yPos);
      yPos += lines.length * 5;
    });
    yPos += 6;
  });

  // References
  if (yPos > doc.internal.pageSize.getHeight() - 120) {
    doc.addPage();
    yPos = margin;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('REFERENCES', margin, yPos);
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const refs = [
    { org: 'PrimePath Home Services', name: 'Jennifer Simpson', title: 'Employee Services Representative' },
    { org: 'BrightLeaf Solar Solutions', name: 'David Harrison', title: 'Lead Talent Acquisition Specialist & HR Generalist' },
    { org: '21ideas LLC', name: 'PETUKHOV VLADIMIR (Denis)', title: 'Founder, 21 Ideas LLC, Florida' },
    { org: 'Silverlight Research', name: 'Karla', title: 'HR & Recruiter' }
  ];
  refs.forEach(r => {
    const lines = doc.splitTextToSize(`${r.name} — ${r.title} (${r.org})`, pageWidth - margin * 2);
    doc.text(lines, margin, yPos);
    yPos += lines.length * 5 + 4;
  });

  // Footer
  doc.setFontSize(8);
  doc.text('Generated by Sifat Morshed Portfolio System • 2026', pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });

  doc.save('Sifat_Morshed_CV.pdf');
};
