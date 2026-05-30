import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { sendInquiryEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email, phone, company, serviceType, budget, description } = body;

    // Phone is optional - only require name, email, serviceType, description
    if (!name || !email || !serviceType || !description) {
      return NextResponse.json(
        { error: 'Name, email, service type, and description are required' },
        { status: 400 }
      );
    }

    const quote = await db.quoteRequest.create({
      data: {
        userId: user.id,
        name,
        email,
        phone: phone || '',
        company: company || null,
        serviceType,
        budget: budget || null,
        description,
      },
    });

    // Send email BEFORE returning response.
    // IMPORTANT: On Vercel serverless, after() does NOT keep the function alive —
    // the email send gets killed before it completes. We MUST await it here.
    try {
      await sendInquiryEmail({ name, email, phone: phone || '', company, serviceType, budget, description });
    } catch (emailErr: any) {
      console.error('[Quotes] Email send failed:', emailErr?.message || emailErr);
    }

    return NextResponse.json({
      message: 'Quote request submitted successfully!',
      quote,
    });
  } catch (error) {
    console.error('Quote submit error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
