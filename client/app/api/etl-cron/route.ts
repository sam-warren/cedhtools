import { NextResponse } from 'next/server';
import EtlProcessor from '../../../lib/etl/processor';

// This endpoint will be called by Vercel Cron
export const runtime = 'edge';
export const maxDuration = 300; // 5 minutes

export async function GET(request: Request) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Process the ETL data asynchronously
    const processor = new EtlProcessor();
    
    // Start the ETL process in the background
    // This allows the function to return quickly while processing continues
    processor.processData().catch(error => {
      console.error('Error in scheduled ETL process:', error);
      // You might want to implement a notification system here
      // to alert you of failures
    });
    
    return NextResponse.json({
      message: 'Scheduled ETL process started successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error starting scheduled ETL process:', error);
    return NextResponse.json(
      { 
        error: 'Failed to start scheduled ETL process',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 