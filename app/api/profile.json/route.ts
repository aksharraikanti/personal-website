import { site } from '@/content/site';
import { jsonApiResponse } from '@/lib/api-response';

export const dynamic = 'force-static';

export function GET() {
  return jsonApiResponse({
    name: site.name,
    tagline: site.tagline,
    description: site.description,
    email: site.email,
    phone: site.phone,
    location: site.location,
    github: site.github,
    linkedin: site.linkedin,
    resumeUrl: `${site.url}${site.resumePath}`,
    website: site.url,
  });
}
