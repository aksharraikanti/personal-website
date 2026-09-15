import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { z } from 'zod';

const SITE_BASE_URL = 'https://aksharraikanti.github.io';
const FORMSPREE_FORM_ID = 'mrpgzjlz';

type Profile = {
  name: string;
  tagline: string;
  description: string;
  email: string;
  phone: string;
  location: string;
  github: string;
  linkedin: string;
  resumeUrl: string;
  website: string;
};

type ExperienceEntry = {
  id: string;
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string | null;
  note?: string;
  highlights: string[];
  skills: string[];
  featured?: boolean;
};

type Project = {
  slug: string;
  title: string;
  summary: string;
  description: string[];
  stack: string[];
  githubUrl?: string;
  liveUrl?: string;
  date: string;
  featured?: boolean;
  url: string;
};

type SkillGroup = { category: string; items: string[] };

// Short in-isolate cache — this data only changes on a site rebuild, so
// there's no need to refetch it on every tool call within the same worker
// instance.
const cache = new Map<string, { data: unknown; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

async function fetchJson<T>(path: string): Promise<T> {
  const cached = cache.get(path);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data as T;
  }

  const response = await fetch(`${SITE_BASE_URL}${path}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.status} ${response.statusText}`);
  }
  const data = (await response.json()) as T;
  cache.set(path, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  return data;
}

function textResult(value: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(value, null, 2) }],
  };
}

function errorResult(message: string) {
  return {
    isError: true,
    content: [{ type: 'text' as const, text: message }],
  };
}

// The MCP SDK's stateless WebStandardStreamableHTTPServerTransport is
// single-use (throws if handleRequest is called more than once), and its
// own examples pair that with a fresh McpServer per request too — so this
// factory is called once per incoming HTTP request, not shared as a
// module-scope singleton.
function createServer(): McpServer {
  const server = new McpServer({
    name: 'akshar-raikanti-portfolio',
    version: '1.0.0',
  });

  server.registerTool(
    'get_profile',
    {
      title: 'Get profile',
      description:
        "Get Akshar Raikanti's contact info, tagline, bio, and links (GitHub, LinkedIn, resume). Use this first for any general question about who he is.",
    },
    async () => {
      const profile = await fetchJson<Profile>('/api/profile.json');
      return textResult(profile);
    }
  );

  server.registerTool(
    'list_experience',
    {
      title: 'List work experience',
      description:
        "List all of Akshar Raikanti's professional experience (companies, roles, dates, highlights, skills used), reverse-chronological.",
    },
    async () => {
      const { experience } = await fetchJson<{ experience: ExperienceEntry[] }>(
        '/api/experience.json'
      );
      return textResult(experience);
    }
  );

  server.registerTool(
    'list_projects',
    {
      title: 'List projects',
      description:
        "List all of Akshar Raikanti's side/personal projects with summaries, tech stack, and links.",
    },
    async () => {
      const { projects } = await fetchJson<{ projects: Project[] }>('/api/projects.json');
      return textResult(projects);
    }
  );

  server.registerTool(
    'get_project',
    {
      title: 'Get project details',
      description:
        'Get the full write-up for one project by its slug (see list_projects for slugs).',
      inputSchema: {
        slug: z.string().describe('The project slug, e.g. "malloc-implementation"'),
      },
    },
    async ({ slug }) => {
      const { projects } = await fetchJson<{ projects: Project[] }>('/api/projects.json');
      const project = projects.find((p) => p.slug === slug);
      if (!project) {
        return errorResult(
          `No project found with slug "${slug}". Call list_projects to see valid slugs.`
        );
      }
      return textResult(project);
    }
  );

  server.registerTool(
    'list_skills',
    {
      title: 'List skills',
      description: "List Akshar Raikanti's technical skills, grouped by category.",
    },
    async () => {
      const { skills } = await fetchJson<{ skills: SkillGroup[] }>('/api/skills.json');
      return textResult(skills);
    }
  );

  server.registerTool(
    'contact_me',
    {
      title: 'Send a message to Akshar',
      description:
        'Send a message to Akshar Raikanti via his contact form. Use this when someone wants to reach out to him directly (e.g. about a job opportunity, collaboration, or question) rather than just look up information about him.',
      inputSchema: {
        name: z.string().min(1).max(200).describe("The sender's name"),
        email: z.string().email().describe("The sender's email address, so Akshar can reply"),
        message: z.string().min(1).max(5000).describe('The message to send'),
      },
    },
    async ({ name, email, message }) => {
      const response = await fetch(`https://formspree.io/f/${FORMSPREE_FORM_ID}`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message, source: 'mcp' }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const detail =
          (body as { errors?: { message: string }[] } | null)?.errors
            ?.map((e) => e.message)
            .join(', ') || `HTTP ${response.status}`;
        return errorResult(`Failed to send message: ${detail}`);
      }

      return textResult({ sent: true, message: 'Message delivered to Akshar.' });
    }
  );

  return server;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Session-Id, Mcp-Protocol-Version',
  'Access-Control-Expose-Headers': 'Mcp-Session-Id',
};

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(CORS_HEADERS)) {
    headers.set(key, value);
  }
  return new Response(response.body, { status: response.status, headers });
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (url.pathname === '/' && request.method === 'GET') {
      return withCors(
        new Response(
          JSON.stringify({
            name: 'Akshar Raikanti Portfolio MCP Server',
            description:
              "Model Context Protocol server exposing Akshar Raikanti's profile, experience, projects, and skills as tools, plus a contact_me action.",
            mcpEndpoint: `${url.origin}/mcp`,
            source: `${SITE_BASE_URL}/mcp-server`,
          }),
          { headers: { 'Content-Type': 'application/json' } }
        )
      );
    }

    if (url.pathname !== '/mcp') {
      return withCors(new Response('Not found', { status: 404 }));
    }

    const server = createServer();
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless: no session continuity needed
    });
    await server.connect(transport);

    const response = await transport.handleRequest(request);
    return withCors(response);
  },
};
