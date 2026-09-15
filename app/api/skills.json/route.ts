import { skills } from '@/content/skills';
import { jsonApiResponse } from '@/lib/api-response';

export const dynamic = 'force-static';

export function GET() {
  return jsonApiResponse({ skills });
}
