import { experience } from '@/content/experience';
import { jsonApiResponse } from '@/lib/api-response';

export const dynamic = 'force-static';

export function GET() {
  return jsonApiResponse({ experience });
}
