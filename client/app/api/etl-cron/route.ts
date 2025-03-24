import { NextResponse } from 'next/server';
import EtlProcessor from '../../../lib/etl/processor';

// This endpoint will be called by Vercel Cron
export const runtime = 'nodejs';
export const maxDuration = 800;

export async function GET() {
  try {
    // Process the ETL data synchronously
    const processor = new EtlProcessor();
    
    // Start the ETL process and wait for it to complete
    await processor.processData();
    
    return NextResponse.json({
      message: 'ETL process completed successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in ETL process:', error);
    return NextResponse.json(
      { 
        error: 'Failed to complete ETL process',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 