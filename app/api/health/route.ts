import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Test DB connection by selecting the current time or a simple limit 1 query
    const { data, error } = await supabase.from('models').select('id').limit(1);

    if (error) {
      console.error('Health Check Database Error:', error);
      return NextResponse.json(
        { status: 'error', message: 'Database connection failed' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { status: 'ok', timestamp: new Date().toISOString() },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Health Check Exception:', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

