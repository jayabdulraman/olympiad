import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

/**
 * Debug endpoint to check visitor ID information in Redis
 */
export async function GET(request: NextRequest) {
  // Check for admin authorization
  const url = new URL(request.url);
  const adminKey = url.searchParams.get('adminKey');
  const visitorId = url.searchParams.get('visitorId');
  
  // This is a simple example - you should implement proper authentication
  if (adminKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  if (!visitorId) {
    return NextResponse.json({ error: 'Visitor ID is required' }, { status: 400 });
  }
  
  // Initialize Redis client
  const redis = new Redis({
    url: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL || '',
    token: process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN || '',
  });
  
  try {
    // Get the current date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch visitor data
    const [
      problemCount,
      followUpCount,
      quizCount,
      rateLimitCount,
      rateLimitKey,
      timeline,
      inDailySet
    ] = await Promise.all([
      redis.get(`analytics:olympiad_tutor:visitor:${visitorId}:problem_submitted`) || 0,
      redis.get(`analytics:olympiad_tutor:visitor:${visitorId}:follow_up_submitted`) || 0,
      redis.get(`analytics:olympiad_tutor:visitor:${visitorId}:quiz_generated`) || 0,
      redis.get(`analytics:olympiad_tutor:visitor:${visitorId}:rate_limit_hit`) || 0,
      redis.get(`ratelimit:algebraTutorRateLimit:${visitorId}`),
      redis.zrange(`analytics:olympiad_tutor:visitor:${visitorId}:timeline`, 0, -1),
      redis.sismember(`analytics:olympiad_tutor:daily:${today}:visitors`, visitorId),
    ]);
    
    // Check if visitor is in any event visitor sets
    const [
      inProblemSet,
      inFollowUpSet,
      inQuizSet,
      inRateLimitSet
    ] = await Promise.all([
      redis.sismember(`analytics:olympiad_tutor:problem_submitted:visitors`, visitorId),
      redis.sismember(`analytics:olympiad_tutor:follow_up_submitted:visitors`, visitorId),
      redis.sismember(`analytics:olympiad_tutor:quiz_generated:visitors`, visitorId),
      redis.sismember(`analytics:olympiad_tutor:rate_limit_hit:visitors`, visitorId),
    ]);
    
    return NextResponse.json({
      visitorId,
      eventCounts: {
        problems: problemCount,
        followUps: followUpCount,
        quizzes: quizCount,
        rateLimit: rateLimitCount
      },
      memberOfSets: {
        dailyVisitors: inDailySet,
        problemVisitors: inProblemSet,
        followUpVisitors: inFollowUpSet,
        quizVisitors: inQuizSet,
        rateLimitVisitors: inRateLimitSet
      },
      rateLimit: rateLimitKey ? JSON.parse(rateLimitKey as string) : null,
      timeline
    });
  } catch (error) {
    console.error('Error fetching visitor data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch visitor data' },
      { status: 500 }
    );
  }
}
