import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { db } from '@/lib/db';

const SYSTEM_PROMPT = `You are XF AI, a helpful and knowledgeable assistant built into the XFoundry platform. You help users with coding questions, explain concepts, debug issues, suggest learning paths, and provide tech career advice. When users share file content, analyze it thoroughly and provide clear, structured explanations. Be concise, friendly, and accurate. Use code blocks when showing code. You were created by the XFoundry team.`;

const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

const MODEL_FALLBACKS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'llama3-8b-8192', 'mixtral-8x7b-32768'];

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    if (!GROQ_API_KEY) {
      console.error('AI chat error: GROQ_API_KEY is not set');
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { conversationId, message, fileContent, fileName } = body as {
      conversationId?: string;
      message: string;
      fileContent?: string;
      fileName?: string;
    };

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (message.length > 4000) {
      return NextResponse.json({ error: 'Message too long (max 4000 chars)' }, { status: 400 });
    }

    let fullMessage = message.trim();
    if (fileContent && fileName) {
      fullMessage = `[User uploaded file: "${fileName}"]\n\n--- FILE CONTENT START ---\n${fileContent}\n--- FILE CONTENT END ---\n\n${message.trim()}`;
    }

    let conversation;
    if (conversationId) {
      conversation = await db.aiConversation.findFirst({
        where: { id: conversationId, userId: user.id },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            select: { role: true, content: true },
          },
        },
      });
      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }
    } else {
      const title = fileName
        ? `📄 ${fileName}`
        : message.slice(0, 60) + (message.length > 60 ? '...' : '');
      conversation = await db.aiConversation.create({
        data: {
          userId: user.id,
          title,
          messages: {
            create: { role: 'system', content: SYSTEM_PROMPT },
          },
        },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            select: { role: true, content: true },
          },
        },
      });
    }

    const displayMessage = fileName ? `📄 ${fileName}\n${message.trim()}` : message.trim();
    await db.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'user',
        content: displayMessage,
      },
    });

    const allMessages = conversation.messages;
    const userMsgIndex = allMessages.findIndex((m: { role: string }) => m.role === 'user');
    const contextStart = Math.max(userMsgIndex, allMessages.length - 20);
    const contextMessages = allMessages.slice(Math.max(0, contextStart));
    contextMessages.push({ role: 'user', content: fullMessage });

    const apiMessages = contextMessages.map((m: { role: string; content: string }) => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    }));

    let reply: string | null = null;
    let lastError: string | null = null;

    for (const model of MODEL_FALLBACKS) {
      try {
        const apiResponse = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model,
            messages: apiMessages,
            temperature: 0.7,
            max_tokens: 2048,
          }),
        });

        if (apiResponse.status === 429) {
          console.warn(`Groq model ${model} rate-limited, trying next...`);
          lastError = await apiResponse.text();
          continue;
        }

        if (!apiResponse.ok) {
          const errorText = await apiResponse.text();
          console.error(`Groq API error with model ${model} (${apiResponse.status}):`, errorText);
          lastError = errorText;
          continue;
        }

        const completion = await apiResponse.json();
        reply = completion.choices?.[0]?.message?.content || null;
        if (reply) break;
      } catch (err: any) {
        console.error(`Groq fetch error with model ${model}:`, err.message);
        lastError = err.message;
        continue;
      }
    }

    if (!reply) {
      console.error('All Groq models failed. Last error:', lastError);
      return NextResponse.json({ error: 'Failed to generate response — all models rate-limited or unavailable' }, { status: 502 });
    }

    await db.aiMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: reply,
      },
    });

    await db.aiConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({
      conversationId: conversation.id,
      reply,
    });
  } catch (error: any) {
    console.error('AI chat error:', error);
    return NextResponse.json({ error: 'Failed to generate response' }, { status: 500 });
  }
}
