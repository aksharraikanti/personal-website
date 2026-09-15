import { NextResponse } from 'next/server';

/**
 * Permissive CORS + long cache headers for the static JSON API — this data
 * is pre-rendered at build time and identical for every requester, so it's
 * safe to expose cross-origin (agents, tools, the MCP server) and cache hard.
 */
export function jsonApiResponse(data: unknown) {
  return NextResponse.json(data, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
