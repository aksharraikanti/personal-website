# Akshar Raikanti Portfolio — MCP Server

A small Cloudflare Worker that exposes [aksharraikanti.github.io](https://aksharraikanti.github.io)'s
profile, experience, projects, and skills as [MCP](https://modelcontextprotocol.io) tools, plus a
`contact_me` tool that sends a message through the site's Formspree form.

This is deliberately **separate from the main site**. GitHub Pages (which serves
`aksharraikanti.github.io`) only hosts static files — it can't run a server, so a real MCP server has
to live somewhere else. This worker fetches its data from the main site's static JSON API
(`/api/profile.json`, `/api/experience.json`, `/api/projects.json`, `/api/skills.json`) rather than
duplicating content, so the two stay in sync automatically whenever the main site is rebuilt.

## Tools

| Tool | Description |
|---|---|
| `get_profile` | Name, tagline, bio, contact info, links, resume URL |
| `list_experience` | Full work history, reverse-chronological |
| `list_projects` | All projects with summaries, stack, links |
| `get_project` | Full write-up for one project, by `slug` |
| `list_skills` | Skills grouped by category |
| `contact_me` | Sends a message (name, email, message) via the site's contact form |

## Deploy

Requires a (free) [Cloudflare account](https://dash.cloudflare.com/sign-up).

```bash
cd mcp-server
npm install
npx wrangler login    # opens a browser to authorize wrangler against your Cloudflare account
npx wrangler deploy
```

That's it — `wrangler deploy` prints the live URL, which will be
`https://akshar-portfolio-mcp.<your-account-subdomain>.workers.dev` (the `<your-account-subdomain>`
part is assigned by Cloudflare the first time you deploy a Worker; `wrangler deploy` will tell you
what it is). The MCP endpoint itself is at `<that-url>/mcp`.

Once you know the real URL, update the placeholder in `../public/llms.txt` (the line under
"A Model Context Protocol (MCP) server...") and redeploy the main site so agents crawling
`aksharraikanti.github.io/llms.txt` find the correct link.

## Local development

```bash
npm run dev
```

Runs the worker locally via `wrangler dev` (no Cloudflare login required for local-only dev). It'll
still fetch live data from `https://aksharraikanti.github.io/api/*.json` unless you edit
`SITE_BASE_URL` in `src/index.ts` to point somewhere else for testing.

## Connecting an MCP client

Most desktop MCP clients (Claude Desktop, etc.) currently expect a local `stdio` command rather than
a remote URL directly, so point them at this server via the `mcp-remote` bridge:

```json
{
  "mcpServers": {
    "akshar-portfolio": {
      "command": "npx",
      "args": ["mcp-remote", "https://akshar-portfolio-mcp.<your-account-subdomain>.workers.dev/mcp"]
    }
  }
}
```

Clients with native remote/HTTP MCP support (e.g. Claude.ai custom connectors) can be pointed
directly at `https://akshar-portfolio-mcp.<your-account-subdomain>.workers.dev/mcp` with no bridge
needed.

## Redeploying after a content change

The worker has no build step and no dependency on anything in this repo besides the live JSON API —
if you only change `content/*.ts` in the main site, redeploying the main site is enough (this worker
picks up the new data automatically, cached for at most 5 minutes). You only need to redeploy this
worker if you change `src/index.ts` itself (e.g. adding a new tool).
