import { jsPDF } from 'jspdf';

export interface CertificateData {
  userName: string;
  courseName: string;
  completionDate: string;
 certificateId: string;
}

export function generateCertificatePDF(
  data: CertificateData
): Buffer {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });


  const W = 297;
  const H = 210;


  const BG: [number, number, number] = [250, 247, 242];

  const DARK: [number, number, number] = [24, 24, 28];

  const GOLD: [number, number, number] = [184, 134, 11];

  const GOLD_LIGHT: [number, number, number] = [212, 175, 55];

  const RED: [number, number, number] = [170, 25, 50];

  const GRAY: [number, number, number] = [120, 120, 120];

  const LIGHT: [number, number, number] = [165, 165, 165];


  doc.setFillColor(...BG);
  doc.rect(0, 0, W, H, 'F');


  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1.2);

  doc.rect(10, 10, W - 20, H - 20);

  doc.setLineWidth(0.25);

  doc.rect(14, 14, W - 28, H - 28);


  doc.setTextColor(240, 236, 228);

  doc.setFont('times', 'bold');
  doc.setFontSize(70);

  doc.text('X', W / 2, 122, {
    align: 'center',
    angle: 0,
  });


  doc.setTextColor(...RED);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);

  doc.text('X.FOUNDRY', W / 2, 34, {
    align: 'center',
  });


  doc.setDrawColor(...GOLD_LIGHT);
  doc.setLineWidth(0.8);

  doc.line(W / 2 - 20, 39, W / 2 + 20, 39);


  doc.setTextColor(...DARK);

  doc.setFont('times', 'bold');
  doc.setFontSize(30);

  doc.text('Certificate', W / 2, 58, {
    align: 'center',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);

  doc.text('OF COMPLETION', W / 2, 68, {
    align: 'center',
  });


  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  doc.setTextColor(...GRAY);

  doc.text(
    'THIS CERTIFIES THAT',
    W / 2,
    84,
    {
      align: 'center',
    }
  );


  doc.setFont('times', 'bold');
  doc.setFontSize(34);

  doc.setTextColor(...DARK);

  doc.text(data.userName, W / 2, 104, {
    align: 'center',
  });


  const nameWidth = doc.getTextWidth(data.userName);

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(0.6);

  doc.line(
    W / 2 - nameWidth / 2 - 6,
    108,
    W / 2 + nameWidth / 2 + 6,
    108
  );


  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  doc.setTextColor(...GRAY);

  doc.text(
    'has successfully completed the professional program',
    W / 2,
    122,
    {
      align: 'center',
    }
  );


  doc.setFont('times', 'bolditalic');
  doc.setFontSize(24);

  doc.setTextColor(...RED);

  doc.text(data.courseName, W / 2, 138, {
    align: 'center',
  });


  const sigY = 165;

  doc.setDrawColor(...LIGHT);
  doc.setLineWidth(0.4);


  doc.line(92, sigY, 132, sigY);

  doc.setFont('times', 'italic');
  doc.setFontSize(16);

  doc.setTextColor(...RED);

  doc.text('XFoundry', 112, sigY - 4, {
    align: 'center',
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);

  doc.setTextColor(...DARK);

  doc.text('Program Director', 112, sigY + 7, {
    align: 'center',
  });


  doc.line(165, sigY, 205, sigY);

  doc.setFont('times', 'italic');
  doc.setFontSize(16);

  doc.setTextColor(...RED);

  doc.text('XFoundry', 185, sigY - 4, {
    align: 'center',
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);

  doc.setTextColor(...DARK);

  doc.text('Lead Instructor', 185, sigY + 7, {
    align: 'center',
  });


  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  doc.setTextColor(...LIGHT);

  doc.text(
    `Issued ${data.completionDate}`,
    30,
    192
  );

  doc.text(
    `Certificate ID: ${data.certificateId}`,
    W - 30,
    192,
    {
      align: 'right',
    }
  );


  doc.setDrawColor(...GOLD_LIGHT);
  doc.setLineWidth(0.8);

  doc.line(
    W / 2 - 28,
    188,
    W / 2 + 28,
    188
  );

  return Buffer.from(doc.output('arraybuffer'));
}
