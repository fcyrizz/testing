export default {
  async fetch(request, env, ctx) {
    const GITHUB_TOKEN = env.GITHUB_TOKEN
    const owner = "fcyrizz"
    const repo = "json_apu"
    const branch = "main"
    const filePath = "data.json"

    const apiBase = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`

    // Step 1: GET the current file to get SHA
    const getRes = await fetch(`${apiBase}?ref=${branch}`, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
    })

    if (!getRes.ok) {
      return new Response("Failed to fetch existing file", { status: 500 })
    }

    const file = await getRes.json()
    const currentContent = JSON.parse(atob(file.content))
    const sha = file.sha

    // Step 2: Modify content (example: add timestamp)
    const updated = {
      ...currentContent,
      updatedAt: new Date().toISOString(),
    }

    const encoded = btoa(JSON.stringify(updated, null, 2))

    // Step 3: PUT update to GitHub
    const putRes = await fetch(apiBase, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({
        message: "Update data.json from Cloudflare Worker",
        content: encoded,
        sha,
        branch,
      }),
    })

    if (!putRes.ok) {
      const error = await putRes.text()
      return new Response(`GitHub update failed: ${error}`, { status: 500 })
    }

    return new Response("JSON file updated successfully", { status: 200 })
  },
}
