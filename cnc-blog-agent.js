// ============================================================
// CNC BLOG AGENT — Unimake Works
// Fully automatic: Research → Write → Thumbnail → Publish → LinkedIn
// ============================================================

const CLAUDE_API_KEY     = process.env.CLAUDE_API_KEY;
const IDEOGRAM_API_KEY   = process.env.IDEOGRAM_API_KEY;
const SUPABASE_ANON_KEY  = process.env.SUPABASE_ANON_KEY;
const BLOG_API_SECRET    = process.env.BLOG_API_SECRET;
const VERCEL_DEPLOY_HOOK = process.env.VERCEL_DEPLOY_HOOK;
const MAKE_WEBHOOK_URL   = process.env.MAKE_WEBHOOK_URL;

const SUPABASE_URL       = "https://onttzurgwjhgyboxcpmy.supabase.co";
const BLOG_API_URL       = `${SUPABASE_URL}/functions/v1/create-blog`;
const SUPABASE_REST_URL  = `${SUPABASE_URL}/rest/v1/blogs`;

function validateSecrets() {
  const required = { CLAUDE_API_KEY, IDEOGRAM_API_KEY, SUPABASE_ANON_KEY, BLOG_API_SECRET };
  const missing = Object.entries(required).filter(([_, v]) => !v || v.trim() === "").map(([k]) => k);
  if (missing.length > 0) throw new Error(`Missing required secrets: ${missing.join(", ")}`);
  console.log("✅ All required secrets found");
}

const DAY_CATEGORIES = {
  0: "CNC Technology Trends (5-axis, automation, AI in manufacturing, Industry 4.0)",
  1: "CNC Materials (aluminum grades, steel types, plastics, exotic metals)",
  2: "CNC Processes (milling, turning, drilling, EDM, surface finishing)",
  3: "India Manufacturing (Made in India, CNC suppliers India, costs India)",
  4: "Quality and Tolerances (GD&T, inspection, surface finish, tolerances)",
  5: "Cost and Efficiency (reducing machining costs, DFM tips, batch sizing)",
  6: "Industry Applications (CNC for EV, aerospace, robotics, medical devices)"
};

const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

const THUMBNAIL_STYLES = [
  "dark steel CNC workshop background, sparks flying, dramatic industrial lighting",
  "clean white background, technical engineering blueprint style, orange accent colors",
  "macro close-up precision CNC machined metal parts, metallic texture, studio lighting"
];

const LINKEDIN_THUMBNAIL_STYLES = [
  "professional LinkedIn banner, dark navy blue background, bold white typography, orange geometric accents, CNC manufacturing",
  "clean corporate banner, white and steel grey, bold headline text, precision engineering aesthetic",
  "industrial professional banner, metallic textures, orange and black color scheme, manufacturing excellence"
];

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// STEP 1 — Fetch existing slugs
// ============================================================

async function getExistingSlugs() {
  console.log("📋 Fetching existing blog slugs...");
  try {
    const fetch = (await import("node-fetch")).default;
    const res = await fetch(
      `${SUPABASE_REST_URL}?select=slug,title&status=eq.published&order=created_at.desc&limit=30`,
      { headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    const data = await res.json();
    if (!Array.isArray(data)) { console.log("⚠️ Supabase response:", JSON.stringify(data)); return { slugs: [], titles: [] }; }
    console.log(`📊 Found ${data.length} existing blogs`);
    return { slugs: data.map(b => b.slug), titles: data.map(b => b.title) };
  } catch (e) {
    console.log("⚠️ Could not fetch slugs:", e.message);
    return { slugs: [], titles: [] };
  }
}

// ============================================================
// STEP 2 — Research trending topics
// ============================================================

async function researchTopics(existingTitles) {
  console.log("🔍 Researching trending CNC topics...");
  const fetch = (await import("node-fetch")).default;
  const today = new Date();
  const dayOfWeek = today.getDay();
  const category = DAY_CATEGORIES[dayOfWeek];
  const dayName = DAY_NAMES[dayOfWeek];
  const dateStr = today.toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" });
  const existingText = existingTitles.length > 0 ? `\n\nAlready published (DO NOT repeat):\n${existingTitles.slice(0,25).join("\n")}` : "";

  const prompt = `Today is ${dayName}, ${dateStr}.\nFocus: ${category}\n\nFind 3 trending unique blog topics for Indian CNC engineers and procurement managers.${existingText}\n\nReturn JSON array only: [{topic, keyword, search_intent, why_it_ranks}]`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": CLAUDE_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 800, tools: [{ type: "web_search_20250305", name: "web_search" }], messages: [{ role: "user", content: prompt }] })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(`Claude research error: ${JSON.stringify(data)}`);
  const textBlock = data.content.filter(c => c.type === "text").pop();
  if (!textBlock) throw new Error("No text from Claude research");
  console.log("✅ Topics researched");
  return textBlock.text;
}

// ============================================================
// STEP 3 — Write SEO blog
// ============================================================

async function writeBlog(topicsText, existingTitles) {
  console.log("✍️ Writing SEO blog post...");
  const fetch = (await import("node-fetch")).default;
  const today = new Date();
  const dateSlug = today.toISOString().slice(0, 10);
  const timestamp = today.getTime();
  const existingText = existingTitles.length > 0 ? `\n\nDO NOT repeat these topics:\n${existingTitles.slice(0,25).join("\n")}` : "";

  const prompt = `From these CNC blog topic ideas:\n\n${topicsText}${existingText}\n\nPick the best unique topic and write a complete SEO blog post.\n\nRULES:\n- Author: Manish Bandi, Founder of Unimake Works, 5+ years CNC experience in Hyderabad India\n- India-specific context, INR pricing where relevant\n- At least one comparison table\n- Specific numbers and technical specs\n- 1200-1500 words\n\nReturn ONLY valid JSON:\n- title (string)\n- slug (string, lowercase hyphens, end with -${dateSlug})\n- meta_title (under 60 chars)\n- meta_description (under 155 chars)\n- content (plain text, HEADING: for H2, SUBHEADING: for H3)\n- tags (array of 5 strings)\n- thumbnail_prompt (max 5 words visual description)\n\nJSON only. No markdown.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": CLAUDE_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 4000, messages: [{ role: "user", content: prompt }] })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(`Claude blog error: ${JSON.stringify(data)}`);
  const textBlock = data.content.filter(c => c.type === "text").pop();
  if (!textBlock) throw new Error("No blog text from Claude");

  let text = textBlock.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const start = text.indexOf("{"); const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON found in Claude response");
  const blog = JSON.parse(text.substring(start, end + 1));
  blog.slug = `${blog.slug}-${timestamp}`;

  const lines = blog.content.split("\n").filter(l => l.trim());
  let html = "";
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith("HEADING:")) html += `<h2>${t.replace("HEADING:", "").trim()}</h2>\n`;
    else if (t.startsWith("SUBHEADING:")) html += `<h3>${t.replace("SUBHEADING:", "").trim()}</h3>\n`;
    else if (t.length > 0) html += `<p>${t}</p>\n`;
  }
  html += `<h2>Get Precision CNC Parts from Unimake Works</h2>\n<p>Looking for high-quality CNC machined parts? <a href="https://www.unimakeworks.com/request-quote">Get a free quote today</a>.</p>`;
  blog.content = html;

  console.log(`✅ Blog written: "${blog.title}"`);
  return blog;
}

// ============================================================
// STEP 4 — Generate blog thumbnail
// ============================================================

async function generateThumbnail(blog) {
  console.log("🖼️ Generating blog thumbnail...");
  const fetch = (await import("node-fetch")).default;
  const style = THUMBNAIL_STYLES[new Date().getDay() % 3];
  const response = await fetch("https://api.ideogram.ai/generate", {
    method: "POST",
    headers: { "Api-Key": IDEOGRAM_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ image_request: { prompt: `${blog.thumbnail_prompt}, ${style}, bold white text, 1200x630px`, aspect_ratio: "ASPECT_16_9", model: "V_2", magic_prompt_option: "AUTO" } })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Ideogram error: ${JSON.stringify(data)}`);
  console.log("✅ Blog thumbnail generated");
  return data.data[0].url;
}

// ============================================================
// STEP 5 — Generate LinkedIn thumbnail (different style)
// ============================================================

async function generateLinkedInThumbnail(blog) {
  console.log("🖼️ Generating LinkedIn thumbnail...");
  const fetch = (await import("node-fetch")).default;
  const style = LINKEDIN_THUMBNAIL_STYLES[new Date().getDay() % 3];
  const response = await fetch("https://api.ideogram.ai/generate", {
    method: "POST",
    headers: { "Api-Key": IDEOGRAM_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ image_request: { prompt: `${blog.thumbnail_prompt}, ${style}, professional social media banner 1200x627px`, aspect_ratio: "ASPECT_16_9", model: "V_2", magic_prompt_option: "AUTO" } })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Ideogram LinkedIn error: ${JSON.stringify(data)}`);
  console.log("✅ LinkedIn thumbnail generated");
  return data.data[0].url;
}

// ============================================================
// STEP 6 — Write LinkedIn caption
// ============================================================

async function writeLinkedInCaption(blog, blogUrl) {
  console.log("✍️ Writing LinkedIn caption...");
  const fetch = (await import("node-fetch")).default;

  const prompt = `Write an engaging LinkedIn post for this CNC manufacturing article.

Title: ${blog.title}
URL: ${blogUrl}
Tags: ${blog.tags.join(", ")}
Summary: ${blog.meta_description}

RULES:
- Hook: Start with a bold statement or surprising fact
- 3-4 short paragraphs with line breaks between each
- 3-4 bullet points with key insights
- CTA to read full article with URL at end
- 5-7 hashtags at the end
- Mention Manish Bandi, Founder of Unimake Works
- Tone: Expert, confident, helpful
- Max 200 words total

Return only the post text. Nothing else.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": CLAUDE_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 600, messages: [{ role: "user", content: prompt }] })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(`Claude LinkedIn error: ${JSON.stringify(data)}`);
  const textBlock = data.content.filter(c => c.type === "text").pop();
  if (!textBlock) throw new Error("No LinkedIn caption from Claude");
  console.log("✅ LinkedIn caption written");
  return textBlock.text.trim();
}

// ============================================================
// STEP 7 — Publish to Supabase
// ============================================================

async function publishBlog(blog, thumbnailUrl) {
  console.log("📤 Publishing blog to website...");
  const fetch = (await import("node-fetch")).default;
  const now = new Date().toISOString();
  const response = await fetch(BLOG_API_URL, {
    method: "POST",
    headers: { "x-blog-api-secret": BLOG_API_SECRET, "Content-Type": "application/json" },
    body: JSON.stringify({ title: blog.title, slug: blog.slug, content: blog.content, meta_title: blog.meta_title, meta_description: blog.meta_description, thumbnail_source_url: thumbnailUrl, tags: blog.tags, status: "published", author: "Manish Bandi", published_at: now, created_at: now })
  });
  const responseText = await response.text();
  let data; try { data = JSON.parse(responseText); } catch { data = { raw: responseText }; }
  if (!response.ok) throw new Error(`Publish error (${response.status}): ${JSON.stringify(data)}`);
  console.log("✅ Blog published to website!");
  return data;
}

// ============================================================
// STEP 8 — Post to LinkedIn via Make.com
// ============================================================

async function postToLinkedIn(blog, linkedInCaption, linkedInThumbnailUrl, blogUrl) {
  if (!MAKE_WEBHOOK_URL || MAKE_WEBHOOK_URL.trim() === "") {
    console.log("⏭️ Skipping LinkedIn (MAKE_WEBHOOK_URL not set)");
    return;
  }
  console.log("💼 Posting to LinkedIn via Make.com...");
  const fetch = (await import("node-fetch")).default;
  const response = await fetch(MAKE_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: blog.title, linkedin_caption: linkedInCaption, image_url: linkedInThumbnailUrl, blog_url: blogUrl })
  });
  if (response.ok) {
    console.log("✅ LinkedIn post sent to Make.com!");
  } else {
    const text = await response.text();
    console.log(`⚠️ Make.com response (${response.status}): ${text}`);
  }
}

// ============================================================
// STEP 9 — Trigger Vercel rebuild
// ============================================================

async function triggerVercelRebuild() {
  if (!VERCEL_DEPLOY_HOOK || VERCEL_DEPLOY_HOOK.trim() === "") { console.log("⏭️ Skipping Vercel rebuild"); return; }
  console.log("🔄 Triggering Vercel rebuild...");
  const fetch = (await import("node-fetch")).default;
  const res = await fetch(VERCEL_DEPLOY_HOOK, { method: "POST" });
  console.log(`✅ Vercel rebuild triggered (${res.status})`);
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log("\n🚀 CNC Blog Agent Starting...");
  console.log("=".repeat(50));
  console.log(`📅 Running at: ${new Date().toUTCString()}`);

  try {
    validateSecrets();
    const { slugs, titles } = await getExistingSlugs();
    const topicsText = await researchTopics(titles);

    console.log("⏳ Waiting 3 minutes (rate limit safety)...");
    await sleep(180000);

    const blog = await writeBlog(topicsText, titles);
    const blogUrl = `https://www.unimakeworks.com/blog/${blog.slug}`;

    const thumbnailUrl = await generateThumbnail(blog);
    const linkedInThumbnailUrl = await generateLinkedInThumbnail(blog);
    const linkedInCaption = await writeLinkedInCaption(blog, blogUrl);

    await publishBlog(blog, thumbnailUrl);
    await postToLinkedIn(blog, linkedInCaption, linkedInThumbnailUrl, blogUrl);
    await triggerVercelRebuild();

    console.log("=".repeat(50));
    console.log("🎉 ALL DONE!");
    console.log(`📝 Blog    : ${blog.title}`);
    console.log(`🔗 URL     : ${blogUrl}`);
    console.log(`💼 LinkedIn: Posted to Unimake Works page`);
    console.log("=".repeat(50));

  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    process.exit(1);
  }
}

main();
