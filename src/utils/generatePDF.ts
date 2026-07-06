import jsPDF from 'jspdf';
import { profileImage } from '../constants/assets';

type ExperienceItem = {
  title: string;
  company: string;
  dates: string;
  duration: string;
  bullets: string[];
};

const loadImageAsDataUrl = async (url: string) => {
  const response = await fetch(url);
  const blob = await response.blob();

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
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let y = margin;

  const setDarkBackground = () => {
    doc.setFillColor(10, 12, 16);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    doc.setFillColor(14, 18, 24);
    doc.rect(0, 0, pageWidth, 42, 'F');
  };

  const ensureSpace = (spaceNeeded: number) => {
    if (y + spaceNeeded > pageHeight - 20) {
      doc.addPage();
      setDarkBackground();
      y = margin;
    }
  };

  const writeSectionTitle = (title: string) => {
    ensureSpace(10);
    doc.setTextColor(103, 232, 249);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(title, margin, y);
    y += 5;
    doc.setDrawColor(44, 115, 131);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageWidth - margin, y);
    y += 7;
  };

  const writeBulletList = (bullets: string[]) => {
    doc.setTextColor(226, 232, 240);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    bullets.forEach((bullet) => {
      const lines = doc.splitTextToSize(`• ${bullet}`, pageWidth - margin * 2 - 6);
      ensureSpace(lines.length * 5 + 2);
      doc.text(lines, margin + 3, y);
      y += lines.length * 5;
    });
    y += 2;
  };

  const experiences: ExperienceItem[] = [
    { title: 'Independent Reseller', company: 'Apple Device Reselling (Independent)', dates: 'Mar 2019 - Present', duration: 'Ongoing', bullets: ['Sourced, refurbished and sold Apple devices to B2B and B2C buyers.', 'Managed pricing, repair logistics and customer relationships.'] },
    { title: 'Appointment Setter', company: 'BrightLeaf Solar Solutions', dates: 'May 2021 - Aug 2021', duration: '4 Months', bullets: ['Outbound calls to homeowners for solar and roof inspection appointments.', 'Provided daily reporting to team leader.'] },
    { title: 'Appointment Setter', company: 'PrimePath Home Services', dates: 'Nov 2021 - Feb 2022', duration: '4 Months', bullets: ['Cold-called US homeowners to schedule home inspection assessments.', 'Qualified leads based on homeowner interest, property eligibility, and utility status.', 'Maintained call logs and updated CRM entries accurately.'] },
    { title: 'Appointment Setter', company: '21ideas LLC', dates: 'Aug 2023 - May 2024', duration: '10 Months', bullets: ['Prospected and qualified B2B leads for IT and AI service discussions and demos.', 'Managed CRM workflows and produced daily reporting for technical sales leads.', 'Onboarded and coached new agents on technical call flows and objection handling.'] },
    { title: 'Sales Closer', company: '21ideas LLC', dates: 'Jun 2024 - Nov 2024', duration: '6 Months', bullets: ['Conducted technical discovery calls and positioned AI and IT solutions to stakeholders.', 'Negotiated terms and closed contracts, coordinating handoffs to delivery teams.', 'Maintained automated follow-up sequences and account handover documentation.'] },
    { title: 'Recruiter & HR', company: '21ideas LLC', dates: 'Dec 2024 - May 2026', duration: '1 Year', bullets: ['Led full-cycle recruiting for sales and entry-level technical roles.', 'Managed onboarding, payroll coordination and performance feedback loops.', 'Designed role-specific screening questions and practical assessments for technical candidates.'] },
    { title: 'Independent Contractor', company: 'Silverlight Research', dates: 'Dec 2025 - May 2026', duration: '6 Months', bullets: ['Researched and verified B2B lead contact details for IT and AI service buyers.', 'Built outreach lists and supported pilot campaigns targeting technical stakeholders.', 'Provided concise reporting and data delivery tailored for technical teams.'] }
  ];

  const references = [
    'PrimePath Home Services — Jennifer Simpson, Employee Services Representative',
    'BrightLeaf Solar Solutions — David Harrison, Lead Talent Acquisition Specialist & HR Generalist',
    '21ideas LLC — PETUKHOV VLADIMIR (Denis), Founder, 21 Ideas LLC, Florida',
    'Silverlight Research — Karla, HR & Recruiter, Silverlight Research Center'
  ];

  setDarkBackground();

  try {
    const imageData = await loadImageAsDataUrl(profileImage as unknown as string);
    doc.addImage(imageData, 'JPEG', pageWidth - margin - 28, margin, 24, 24);
  } catch {
    // ignore image failures
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('Sifat Morshed', margin, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(103, 232, 249);
  doc.text('Outbound Sales Specialist & Appointment Setter', margin, 26);

  doc.setTextColor(203, 213, 225);
  doc.setFontSize(9.5);
  doc.text('Phone: +880 1867001744  |  Email: sifatmorshed123@gmail.com  |  Dhaka-1219, Bangladesh', margin, 33);

  y = 50;

  writeSectionTitle('PROFESSIONAL SUMMARY');
  doc.setTextColor(226, 232, 240);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const summary = 'Cumulative experience across outbound sales, appointment setting, recruiting and contract research. Skilled with CRM workflows, scheduling, recruiting and closing.';
  const summaryLines = doc.splitTextToSize(summary, pageWidth - margin * 2);
  doc.text(summaryLines, margin, y);
  y += summaryLines.length * 5 + 3;

  writeSectionTitle('EXPERIENCE');
  experiences.forEach((experience) => {
    ensureSpace(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.text(experience.title, margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(103, 232, 249);
    doc.setFontSize(10.5);
    const companyLine = `${experience.company}  |  ${experience.dates}  |  ${experience.duration}`;
    const companyLines = doc.splitTextToSize(companyLine, pageWidth - margin * 2);
    doc.text(companyLines, margin, y + 5);
    y += 10 + (companyLines.length - 1) * 4;

    writeBulletList(experience.bullets);
    y += 2;
  });

  writeSectionTitle('REFERENCES');
  doc.setTextColor(226, 232, 240);
  references.forEach((reference) => {
    const refLines = doc.splitTextToSize(reference, pageWidth - margin * 2);
    ensureSpace(refLines.length * 5 + 2);
    doc.text(refLines, margin, y);
    y += refLines.length * 5 + 2;
  });

  writeSectionTitle('EDUCATION');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('BSc in Computer Science & Engineering', margin, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225);
  doc.text('Southeast University (Present)', margin, y);
  y += 7;
  doc.setTextColor(255, 255, 255);
  doc.text('Higher Secondary School Certificate (H.S.C)', margin, y);
  y += 6;
  doc.text('Secondary School Certificate (S.S.C)', margin, y);
  y += 8;

  writeSectionTitle('SKILLS');
  doc.setTextColor(226, 232, 240);
  const skills = ['Outbound Prospecting', 'CRM Proficiency', 'Lead Qualification', 'Solar Energy Sector', 'B2B IT/AI Sales', 'Objection Handling', 'English Fluency (C1)', 'Scheduling', 'Client Relations'];
  const skillLines = doc.splitTextToSize(skills.join(' • '), pageWidth - margin * 2);
  doc.text(skillLines, margin, y);

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.text('Generated by Sifat Morshed Portfolio System • 2026', pageWidth / 2, pageHeight - 8, { align: 'center' });

  doc.save('Sifat_Morshed_CV.pdf');
};
