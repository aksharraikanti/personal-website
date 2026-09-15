import { site } from '@/content/site';
import { projects } from '@/content/projects';
import { jsonApiResponse } from '@/lib/api-response';

export const dynamic = 'force-static';

export function GET() {
  return jsonApiResponse({
    projects: projects.map((project) => ({
      ...project,
      url: `${site.url}/projects/${project.slug}/`,
    })),
  });
}
