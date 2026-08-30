export default {
  async scheduled(event, env, ctx) {
    const resp = await fetch(
      "https://api.github.com/repos/tallzilla/tallzilla.github.io/actions/workflows/update-frame.yml/dispatches",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.GITHUB_TOKEN}`,
          "Accept": "application/vnd.github+json",
          "User-Agent": "frame-refresh-worker",
        },
        body: JSON.stringify({ ref: "master" }),
      }
    );
    if (!resp.ok) {
      console.log(`GitHub dispatch failed: ${resp.status} ${await resp.text()}`);
    }
  },

  async fetch(request) {
    return new Response("This worker only responds to cron triggers.", {
      status: 200,
      headers: { "content-type": "text/plain" },
    });
  },
};
