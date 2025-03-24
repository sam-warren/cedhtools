import { NextResponse } from 'next/server';
import EtlProcessor from '../../../lib/etl/processor';

// This endpoint will be called by Vercel Cron
export async function GET() {
  try {
    // Process the ETL data asynchronously
    const processor = new EtlProcessor();
    
    // Process data for the last day by default
    processor.processData().catch(error => {
      console.error('Error in scheduled ETL process:', error);
    });
    
    return NextResponse.json({
      message: 'Scheduled ETL process started successfully',
    });
  } catch (error) {
    console.error('Error starting scheduled ETL process:', error);
    return NextResponse.json(
      { error: 'Failed to start scheduled ETL process' },
      { status: 500 }
    );
  }
} 