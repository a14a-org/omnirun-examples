# Dev.to Articles

Dev.to-ready markdown versions of the OmniRun blog posts. Each article includes Dev.to frontmatter and a `canonical_url` pointing back to the original post on omnirun.io to avoid duplicate content penalties in search engines.

## Articles

| File | Title |
|------|-------|
| `omnirun-vs-e2b.md` | OmniRun vs E2B: Which Cloud Sandbox Is Right for Your AI Agent? |
| `omnirun-vs-modal.md` | OmniRun vs Modal: Sandboxes vs Serverless -- When to Use What |
| `firecracker-vs-docker.md` | Why Firecracker Beats Docker for AI Agent Sandboxing |
| `building-ai-code-interpreter.md` | Build an AI Code Interpreter in 50 Lines of TypeScript |
| `desktop-ai-agents-guide.md` | How to Build AI Agents That Control Desktop Applications |

## How to Publish on Dev.to

### Option 1: Manual (Web UI)

1. Go to [dev.to/new](https://dev.to/new)
2. Click the "..." menu and select "Edit in Markdown" if not already in markdown mode
3. Copy the entire contents of a `.md` file (including the frontmatter between `---` lines)
4. Paste into the editor -- Dev.to will parse the frontmatter automatically
5. Add a cover image if desired (the `cover_image` field is left blank for you to fill in)
6. Preview and save as draft
7. When ready, change `published: false` to `published: true` or click the "Publish" button

### Option 2: GitHub Integration

1. Connect your Dev.to account to a GitHub repo (Settings > Extensions > GitHub)
2. Push these `.md` files to the connected repo
3. Dev.to will automatically create draft posts from the frontmatter
4. Review and publish from the Dev.to dashboard

### Option 3: Dev.to CLI / API

```bash
# Using the Dev.to API
curl -X POST https://dev.to/api/articles \
  -H "Content-Type: application/json" \
  -H "api-key: YOUR_DEV_TO_API_KEY" \
  -d @- <<EOF
{
  "article": {
    "body_markdown": "$(cat omnirun-vs-e2b.md)"
  }
}
EOF
```

## Notes

- All articles are set to `published: false` by default -- they will be saved as drafts
- Each article has a `canonical_url` pointing to omnirun.io to prevent SEO duplicate content issues
- Dev.to allows a maximum of 4 tags per post
- Add a `cover_image` URL before publishing for better visibility in the Dev.to feed
- Recommended cover image size: 1000x420 pixels
