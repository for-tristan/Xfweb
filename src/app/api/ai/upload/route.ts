import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const maxDuration = 30;

async function extractPdfText(arrayBuffer: ArrayBuffer): Promise<string> {
  // Dynamic import pdfjs-dist — pure JS, no native deps
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

  // Disable web worker entirely (serverless can't use workers)
  pdfjsLib.GlobalWorkerOptions.workerSrc = '';

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
    // Force no worker — run everything in main thread
    disableAutoFetch: false,
    isEvalSupported: true,
  });

  const pdf = await loadingTask.promise;
  const textParts: string[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str ?? '')
      .join(' ');
    if (pageText.trim()) {
      textParts.push(pageText);
    }
  }

  return textParts.join('\n\n');
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain', 'text/csv', 'text/markdown'];
    const allowedExtensions = ['.pdf', '.txt', '.csv', '.md'];
    const fileName = file.name.toLowerCase();
    const ext = fileName.substring(fileName.lastIndexOf('.'));
    const isAllowed = allowedTypes.includes(file.type) || allowedExtensions.includes(ext);

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Unsupported file type. Supported: PDF, TXT, CSV, MD' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    let extractedText = '';

    if (ext === '.pdf') {
      try {
        extractedText = await extractPdfText(arrayBuffer);

        // If we got no text, it's likely a scanned/image PDF
        if (!extractedText.trim()) {
          return NextResponse.json(
            { error: 'This PDF appears to be image-based or scanned. Only text-based PDFs are supported — image/scan PDFs require OCR which is not available on this server.' },
            { status: 400 }
          );
        }
      } catch (pdfErr: any) {
        console.error('PDF parse error:', pdfErr?.message || pdfErr);
        return NextResponse.json(
          { error: 'Could not read this PDF. It may be corrupted or image-based (OCR not supported).' },
          { status: 400 }
        );
      }
    } else {
      // Text files — just read as UTF-8
      extractedText = Buffer.from(arrayBuffer).toString('utf-8');
    }

    // Truncate if too long (max ~50k chars to fit in context window)
    const MAX_CHARS = 50000;
    const truncated = extractedText.length > MAX_CHARS;
    const content = truncated
      ? extractedText.slice(0, MAX_CHARS) + '\n\n[... File truncated. Showing first ~50k characters ...]'
      : extractedText;

    if (!content.trim()) {
      return NextResponse.json(
        { error: 'Could not extract any text from this file.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      fileName: file.name,
      fileSize: file.size,
      content,
      truncated,
      charCount: extractedText.length,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Failed to process file' }, { status: 500 });
  }
}
