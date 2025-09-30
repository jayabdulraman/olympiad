import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  // Check for admin authorization
  const url = new URL(request.url);
  const adminKey = url.searchParams.get('adminKey');
  
  // This is a simple example - you should implement proper authentication
  if (adminKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Initialize Redis client
  const redis = new Redis({
    url: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL || '',
    token: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN || '',
  });
  
  try {
    // Fetch analytics data
    const [
      totalProblems,
      totalFollowUps,
      totalQuizzes,
      rateLimit,
      scopeFailures,
      apiErrors,
      problemVisitors,
      followUpVisitors,
      quizVisitors,
      rateLimitVisitors,
    ] = await Promise.all([
      redis.get('analytics:olympiad_tutor:problem_submitted') || 0,
      redis.get('analytics:olympiad_tutor:follow_up_submitted') || 0,
      redis.get('analytics:olympiad_tutor:quiz_generated') || 0,
      redis.get('analytics:olympiad_tutor:rate_limit_hit') || 0,
      redis.get('analytics:olympiad_tutor:scope_failure') || 0,
      redis.get('analytics:olympiad_tutor:api_error_submit') || 0,
      redis.scard('analytics:olympiad_tutor:problem_submitted:visitors') || 0,
      redis.scard('analytics:olympiad_tutor:follow_up_submitted:visitors') || 0,
      redis.scard('analytics:olympiad_tutor:quiz_generated:visitors') || 0,
      redis.scard('analytics:olympiad_tutor:rate_limit_hit:visitors') || 0,
    ]);
    
    // Get the current date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's stats
    const todayKey = `analytics:olympiad_tutor:daily:${today}`;
    const todayProblems = await redis.get(`${todayKey}:problem_submitted`) || 0;
    const todayVisitors = await redis.scard(`${todayKey}:visitors`) || 0;
    
    return NextResponse.json({
      totalProblems,
      totalFollowUps,
      totalQuizzes,
      uniqueVisitors: problemVisitors,
      rateLimit,
      scopeFailures,
      apiErrors,
      uniqueFollowUpUsers: followUpVisitors,
      uniqueQuizUsers: quizVisitors,
      uniqueRateLimitUsers: rateLimitVisitors,
      today: {
        problems: todayProblems,
        visitors: todayVisitors
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
