import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

const SYSTEM_PROMPT = `You are XAI, an AI assistant for X-Foundry — a tech company specializing in AI/ML, custom software development, and tech education. You help users with questions about courses, services, enrollment, and general tech topics. Keep responses concise and helpful (2-3 sentences max). If asked about pricing, mention courses are currently free. If asked about enrollment, explain they need to sign up and request enrollment through the platform. Be friendly and professional. Use casual but clean language.`;

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Require authentication — prevent anonymous AI cost abuse
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { message, history } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // SECURITY: Cap message length to prevent cost abuse
    if (message.length > 1000) {
      return NextResponse.json({ error: 'Message too long (max 1000 characters)' }, { status: 400 });
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(history || []).slice(-10),
      { role: 'user', content: message },
    ];

    let reply: string;

    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      const zai = await ZAI.create();
      const completion = await zai.chat.completions.create({
        messages,
        max_tokens: 200,
        temperature: 0.7,
      });
      reply = completion.choices?.[0]?.message?.content || "I'm having trouble responding right now. Please try again.";
    } catch (aiError) {
      console.error('AI SDK error:', aiError);
      reply = "I'm XAI, your X-Foundry assistant! I'm currently offline but I'll be back soon. In the meantime, you can browse our courses or contact us directly.";
    }

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('XAI error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
