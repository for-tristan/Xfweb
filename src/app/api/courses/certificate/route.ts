import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { generateCertificatePDF } from '@/lib/generateCertificatePDF';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const format = searchParams.get('format'); // 'pdf' for direct download

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    // Check if a certificate has been issued for this user/course
    const certificate = await db.certificate.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
    });

    if (!certificate) {
      return NextResponse.json({ hasCertificate: false }, { status: 404 });
    }

    // If format=pdf, generate and serve the PDF
    if (format === 'pdf') {
      try {
        const pdfBuffer = await generateCertificatePDF({
          userName: user.name,
          courseName: certificate.courseName,
          completionDate: certificate.completionDate,
          certificateId: certificate.certificateId,
        });
        const safeFileName = `XFoundry_Certificate_${certificate.courseName.replace(/[^a-zA-Z0-9]/g, '_')}_${certificate.certificateId}.pdf`;
        return new NextResponse(new Uint8Array(pdfBuffer), {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${safeFileName}"`,
          },
        });
      } catch (pdfError) {
        console.error('[Certificate] PDF generation failed:', pdfError);
        return NextResponse.json({ error: 'Failed to generate PDF certificate' }, { status: 500 });
      }
    }

    // Otherwise return certificate metadata
    return NextResponse.json({
      hasCertificate: true,
      userName: user.name,
      courseName: certificate.courseName,
      completionDate: certificate.completionDate,
      certificateId: certificate.certificateId,
      issuedAt: certificate.issuedAt,
    });
  } catch (error) {
    console.error('Certificate check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
