import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const { filename, content } = await req.json();

    if (!filename || !content) {
      return NextResponse.json({ error: 'Filename and content are required' }, { status: 400 });
    }

    // יצירת תיקיית השמירה במידה ואינה קיימת
    const saveDir = path.join(process.cwd(), 'saved_responses');
    if (!fs.existsSync(saveDir)) {
      fs.mkdirSync(saveDir, { recursive: true });
    }

    // ניקוי שם הקובץ מתווים לא חוקיים
    const safeFilename = filename.replace(/[/\\?%*:|"<>]/g, '-').trim();
    const filePath = path.join(saveDir, `${safeFilename}.json`);

    fs.writeFileSync(filePath, typeof content === 'string' ? content : JSON.stringify(content, null, 2), 'utf-8');

    return NextResponse.json({ success: true, filePath: `/saved_responses/${safeFilename}.json` });
  } catch (error: any) {
    console.error('Error saving file:', error);
    return NextResponse.json({ error: error.message || 'Failed to save file' }, { status: 500 });
  }
}
