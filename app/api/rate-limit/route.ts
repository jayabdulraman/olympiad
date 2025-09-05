import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, checkRateLimitOnly } from '@/lib/utils';

// GET request just checks the rate limit without incrementing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const visitorId = searchParams.get('visitorId');
    
    if (!visitorId) {
      return NextResponse.json({ error: 'Visitor ID is required' }, { status: 400 });
    }

    const RATE_LIMIT_KEY = 'algebraTutorRateLimit';
    const RATE_LIMIT_MAX_REQUESTS = 5;
    const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
    
    const result = await checkRateLimitOnly(
      visitorId,
      RATE_LIMIT_KEY,
      RATE_LIMIT_MAX_REQUESTS,
      RATE_LIMIT_WINDOW_MS
    );
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Rate limit check error:', error);
    return NextResponse.json({ error: 'Failed to check rate limit' }, { status: 500 });
  }
}

// POST request checks and increments the rate limit counter
export async function POST(request: NextRequest) {
  try {
    const { visitorId } = await request.json();
    
    if (!visitorId) {
      return NextResponse.json({ error: 'Visitor ID is required' }, { status: 400 });
    }

    const RATE_LIMIT_KEY = 'algebraTutorRateLimit';
    const RATE_LIMIT_MAX_REQUESTS = 5;
    const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
    
    const result = await checkRateLimit(
      visitorId,
      RATE_LIMIT_KEY,
      RATE_LIMIT_MAX_REQUESTS,
      RATE_LIMIT_WINDOW_MS
    );
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Rate limit check error:', error);
    return NextResponse.json({ error: 'Failed to check rate limit' }, { status: 500 });
  }
}
