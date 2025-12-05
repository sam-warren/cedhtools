/**
 * Health Check Endpoint
 * 
 * Provides system health status for monitoring and load balancers.
 * 
 * GET /api/health - Returns system health status
 * 
 * ## Response Format
 * ```json
 * {
 *   "status": "healthy",
 *   "timestamp": "2024-01-15T10:30:00.000Z",
 *   "version": "1.0.0",
 *   "checks": {
 *     "database": { "status": "healthy", "latencyMs": 15 },
 *     "etl": { "status": "healthy", "lastRun": "2024-01-15T09:00:00.000Z" }
 *   }
 * }
 * ```
 * 
 * ## Status Codes
 * - 200: All systems healthy
 * - 503: One or more systems unhealthy
 */

import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/api/supabase';

// Create singleton for this module
const serviceRoleClient = createServiceRoleClient();
import { apiLogger } from '@/lib/logger';

interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  latencyMs?: number;
  lastRun?: string;
  error?: string;
}

interface HealthResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: HealthCheck;
    etl: HealthCheck;
  };
}

// Track server start time for uptime calculation
const startTime = Date.now();

/**
 * Check database connectivity and latency
 */
async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  
  try {
    // Simple query to verify database connectivity
    const { error } = await serviceRoleClient
      .from('commanders')
      .select('id')
      .limit(1);
    
    const latencyMs = Date.now() - start;
    
    if (error) {
      return {
        status: 'unhealthy',
        latencyMs,
        error: error.message,
      };
    }
    
    // Consider degraded if latency is high (>1000ms)
    if (latencyMs > 1000) {
      return {
        status: 'degraded',
        latencyMs,
      };
    }
    
    return {
      status: 'healthy',
      latencyMs,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check ETL status - verify last successful job run
 */
async function checkEtl(): Promise<HealthCheck> {
  try {
    const { data, error } = await serviceRoleClient
      .from('etl_jobs')
      .select('status, completed_at, records_processed')
      .eq('status', 'COMPLETED')
      .order('completed_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      // No completed ETL jobs is not necessarily unhealthy
      if (error.code === 'PGRST116') {
        return {
          status: 'healthy',
          lastRun: undefined,
        };
      }
      return {
        status: 'degraded',
        error: error.message,
      };
    }
    
    // Check if last run was within the last 48 hours
    const lastRunDate = data.completed_at ? new Date(data.completed_at) : null;
    const hoursSinceLastRun = lastRunDate 
      ? (Date.now() - lastRunDate.getTime()) / (1000 * 60 * 60)
      : Infinity;
    
    if (hoursSinceLastRun > 48) {
      return {
        status: 'degraded',
        lastRun: data.completed_at || undefined,
        error: 'ETL has not run in over 48 hours',
      };
    }
    
    return {
      status: 'healthy',
      lastRun: data.completed_at || undefined,
    };
  } catch (error) {
    return {
      status: 'degraded',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Determine overall system status from individual checks
 */
function determineOverallStatus(checks: Record<string, HealthCheck>): 'healthy' | 'unhealthy' | 'degraded' {
  const statuses = Object.values(checks).map(c => c.status);
  
  if (statuses.includes('unhealthy')) {
    return 'unhealthy';
  }
  if (statuses.includes('degraded')) {
    return 'degraded';
  }
  return 'healthy';
}

export async function GET(): Promise<NextResponse<HealthResponse>> {
  const timer = apiLogger.startTimer('health-check');
  
  try {
    // Run health checks in parallel
    const [database, etl] = await Promise.all([
      checkDatabase(),
      checkEtl(),
    ]);
    
    const checks = { database, etl };
    const status = determineOverallStatus(checks);
    
    const response: HealthResponse = {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      checks,
    };
    
    timer.done({ status });
    
    // Return 503 if unhealthy (for load balancer health checks)
    const httpStatus = status === 'unhealthy' ? 503 : 200;
    
    return NextResponse.json(response, { status: httpStatus });
  } catch (error) {
    apiLogger.logError('Health check failed', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      checks: {
        database: { status: 'unhealthy', error: 'Check failed' },
        etl: { status: 'unhealthy', error: 'Check failed' },
      },
    } as HealthResponse, { status: 503 });
  }
}
