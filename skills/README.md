# Dissector — Agent Skills

Drop-in skills for any AI agent (Claude, Cursor, ChatGPT, custom SDK). Just **copy a link** below and paste it to your AI — it will fetch the skill and use Dissector for you.

> Tip: start with the **dissector** entry skill — it covers setup and links to all capability skills.

## Skills

| Capability | Copy link below and paste to your AI |
|---|---|
| **Entry / Setup** (start here) | https://raw.githubusercontent.com/decolua/9router/refs/heads/master/skills/dissector/SKILL.md |
| Chat / code-gen | https://raw.githubusercontent.com/decolua/9router/refs/heads/master/skills/dissector-chat/SKILL.md |
| Image generation | https://raw.githubusercontent.com/decolua/9router/refs/heads/master/skills/dissector-image/SKILL.md |
| Video generation (xAI Grok Imagine) | https://raw.githubusercontent.com/decolua/9router/refs/heads/master/skills/dissector-video/SKILL.md |
| Text-to-speech | https://raw.githubusercontent.com/decolua/9router/refs/heads/master/skills/dissector-tts/SKILL.md |
| Speech-to-text | https://raw.githubusercontent.com/decolua/9router/refs/heads/master/skills/dissector-stt/SKILL.md |
| Embeddings | https://raw.githubusercontent.com/decolua/9router/refs/heads/master/skills/dissector-embeddings/SKILL.md |
| Web search | https://raw.githubusercontent.com/decolua/9router/refs/heads/master/skills/dissector-web-search/SKILL.md |
| Web fetch (URL → markdown) | https://raw.githubusercontent.com/decolua/9router/refs/heads/master/skills/dissector-web-fetch/SKILL.md |

## How to use

Paste to your AI (Claude, Cursor, ChatGPT, …):

```
Read this skill and use it: https://raw.githubusercontent.com/decolua/9router/refs/heads/master/skills/dissector/SKILL.md
```

Then ask normally — *"generate an image of a cat"*, *"transcribe this URL"*, etc.

## Configure your shell once

```bash
export DISSECTOR_URL="http://localhost:20128"   # local default, or your VPS / tunnel URL
export DISSECTOR_KEY="sk-..."                   # from Dashboard → Keys (only if requireApiKey=true)
```

Legacy `NINEROUTER_URL` / `NINEROUTER_KEY` names are still accepted.

Verify: `curl $DISSECTOR_URL/api/health` → `{"ok":true}`.

## Links

- Source: https://github.com/decolua/9router
- Dashboard: https://9router.com
