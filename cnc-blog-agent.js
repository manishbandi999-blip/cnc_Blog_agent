// ============================================================
// CNC BLOG AGENT — Unimake Works
// Fully automatic: Research → Write → Thumbnail → Publish
// ============================================================
// All secrets are read from environment variables (GitHub Secrets)
// DO NOT hardcode any API keys in this file
// ============================================================

// ============================================================
// CONFIGURATION — Read from GitHub Secrets / Environment
// ============================================================

const CLAUDE_API_KEY     = process.env.CLAUDE_API_KEY;
const IDEOGRAM_API_KEY   = process.env.IDEOGRAM_API_KEY;
const SUPABASE_ANON_KEY  = process.env.SUPABASE_ANON_KEY;
const BLOG_API_SECRET    = process.env.BLOG_API_SECRET;
const VERCEL_DEPLOY_HOOK = process.env.VERCEL_DEPLOY_HOOK;

const SUPABASE_URL       = "https://onttzurgwjhgyboxcpmy.supabase.co";
const BLOG_API_URL       = `${SUPABASE_URL}/functions/v1/create-blog`;
const SUPABASE_REST_URL  = `${SUPABASE_URL}/rest/v1/blogs`;

// ============================================================
// Validate secrets exist before running
// ============================================================

function validateSecrets() {
  const required = {
    CLAUDE_API_KEY,
    IDEOGRAM_API_KEY,
    SUPABASE_ANON_KEY,
    BLOG_API_SECRET
  };
  const missing = Object.entries(required)
    .filter(([_, v]) => !v || v.trim() === "")
    .map(([k]) => k);

  if (missing.length > 0) {
    throw new Error(`Missing required secrets: ${missing.join(", ")}\nAdd them in GitHub → Settings → Secrets → Actions`);
  }
  console.log("✅ All required secrets found");
}

// ============================================================
// CATEGORIES — Day-based topic rotation
// ============================================================

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

// ============================================================
// HELPER — Sleep
// ============================================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// STEP 1 — Fetch existing slugs from Supabase (avoid repeats)
// ============================================================

async function getExistingSlugs() {
  console.log("📋 Fetching existing blog slugs...");
  try {
    const fetch = (await import("node-fetch")).default;
    const res = await fetch(
      `${SUPABASE_REST_URL}?select=slug,title&status=eq.published&order=created_at.desc&limit=30`,
      {
        headers: {
          "apikey": SUPABASE_ANON_KEY,
          "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
        }
      }
    );
    const data = await res.json();
    if (!Array.isArray(data)) {
      console.log("⚠️ Unexpected response from Supabase:", JSON.stringify(data));
      return { slugs: [], titles: [] };
    }
    console.log(`📊 Found ${data.length} existing blogs`);
    return {
      slugs: data.map(b => b.slug),
      titles: data.map(b => b.title)
    };
  } catch (e) {
    console.log("⚠️ Could not fetch existing slugs:", e.message);
    return { slugs: [], titles: [] };
  }
}

// ============================================================
// STEP 2 — Research trending CNC topics via Claude
// ============================================================

async function researchTopics(existingTitles) {
  console.log("🔍 Researching trending CNC topics...");
  const fetch = (await import("node-fetch")).default;

  const today = new Date();
  const dayOfWeek = today.getDay();
  const dayName = DAY_NAMES[dayOfWeek];
  const dateStr = today.toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" });
  const category = DAY_CATEGORIES[dayOfWeek];

  const existingTopicsText = existingTitles.length > 0
    ? `\n\nAlready published titles (DO NOT repeat or write anything similar):\n${existingTitles.slice(0, 25).join("\n")}`
    : "";

  const prompt = `Today is ${dayName}, ${dateStr}.

Focus category for today: ${category}

Search for the most discussed and trending topics in this category this week. Find what engineers and procurement managers in India are actively searching for right now.${existingTopicsText}

Return 3 completely unique blog topic ideas that are NOT similar to any already published title above.

Return as JSON array only with fields: topic, keyword, search_intent, why_it_ranks
Return JSON only, no extra text.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 800,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(`Claude research error: ${JSON.stringify(data)}`);

  const textBlock = data.content.filter(c => c.type === "text").pop();
  if (!textBlock) throw new Error("No text response from Claude research");

  console.log("✅ Topics researched successfully");
  return textBlock.text;
}

// ============================================================
// STEP 3 — Write full SEO blog post via Claude
// ============================================================

async function writeBlog(topicsText, existingTitles) {
  console.log("✍️ Writing SEO blog post...");
  const fetch = (await import("node-fetch")).default;

  const today = new Date();
  const dateSlug = today.toISOString().slice(0, 10); // YYYY-MM-DD
  const timestamp = today.getTime();

  const existingTopicsText = existingTitles.length > 0
    ? `\n\nDO NOT write about any topic similar to these already published blogs:\n${existingTitles.slice(0, 25).join("\n")}`
    : "";

  const prompt = `From these CNC blog topic ideas:

${topicsText}${existingTopicsText}

Pick the single best and most unique topic and write a complete SEO blog post.

IMPORTANT RULES:
- Write from the perspective of Manish Bandi, Founder of Unimake Works, with 5+ years of hands-on CNC machining experience in Hyderabad, India
- Include India-specific context, pricing in INR where relevant, and Indian manufacturing examples
- Include at least one comparison table using plain text format
- Include specific numbers, tolerances, and technical specs
- Word count: 1200-1500 words
- Make it genuinely useful for engineers and procurement managers

Return ONLY a valid JSON object with these exact keys:
- title (string)
- slug (string, lowercase hyphens only, end with -${dateSlug})
- meta_title (string, under 60 chars, includes primary keyword)
- meta_description (string, under 155 chars)
- content (string, plain text only, NO HTML tags, NO double quotes inside content, use HEADING: for H2 sections, SUBHEADING: for H3 sections)
- tags (array of 5 strings)
- thumbnail_prompt (string, maximum 5 words describing the blog topic visually)

Return JSON only. No markdown fences. No extra text.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(`Claude blog error: ${JSON.stringify(data)}`);

  const textBlock = data.content.filter(c => c.type === "text").pop();
  if (!textBlock) throw new Error("No text response from Claude blog writer");

  // Parse JSON safely — strip any accidental markdown fences
  let text = textBlock.text
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Could not find JSON in Claude response");
  text = text.substring(start, end + 1);

  const blog = JSON.parse(text);

  // Guarantee unique slug with timestamp
  blog.slug = `${blog.slug}-${timestamp}`;

  // Convert plain text content to clean HTML
  const lines = blog.content.split("\n").filter(l => l.trim());
  let html = "";
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("HEADING:")) {
      html += `<h2>${trimmed.replace("HEADING:", "").trim()}</h2>\n`;
    } else if (trimmed.startsWith("SUBHEADING:")) {
      html += `<h3>${trimmed.replace("SUBHEADING:", "").trim()}</h3>\n`;
    } else if (trimmed.startsWith("|")) {
      html += `<p>${trimmed}</p>\n`;
    } else if (trimmed.length > 0) {
      html += `<p>${trimmed}</p>\n`;
    }
  }

  // Append CTA
  html += `<h2>Get Precision CNC Parts from Unimake Works</h2>\n<p>Looking for high-quality CNC machined parts with tight tolerances? Unimake Works delivers precision parts with fast turnaround and competitive pricing. <a href="https://www.unimakeworks.com/request-quote">Get a free CNC quote today</a> and experience the difference of working with a trusted Indian manufacturer.</p>`;

  blog.content = html;

  console.log(`✅ Blog written: "${blog.title}"`);
  return blog;
}

// ============================================================
// STEP 4 — Generate thumbnail via Ideogram
// ============================================================

async function generateThumbnail(blog) {
  console.log("🖼️ Generating thumbnail...");
  const fetch = (await import("node-fetch")).default;

  const dayOfWeek = new Date().getDay();
  const styleIndex = dayOfWeek % 3;
  const style = THUMBNAIL_STYLES[styleIndex];
  const fullPrompt = `${blog.thumbnail_prompt}, ${style}, bold white text overlay maximum 4 words, 1200x630px professional`;

  const response = await fetch("https://api.ideogram.ai/generate", {
    method: "POST",
    headers: {
      "Api-Key": IDEOGRAM_API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      image_request: {
        prompt: fullPrompt,
        aspect_ratio: "ASPECT_16_9",
        model: "V_2",
        magic_prompt_option: "AUTO"
      }
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(`Ideogram error: ${JSON.stringify(data)}`);

  const imageUrl = data.data[0].url;
  console.log("✅ Thumbnail generated");
  return imageUrl;
}

// ============================================================
// STEP 5 — Publish blog to Supabase Edge Function
// ============================================================

async function publishBlog(blog, thumbnailUrl) {
  console.log("📤 Publishing blog to Supabase...");
  const fetch = (await import("node-fetch")).default;

  const now = new Date().toISOString();

  const payload = {
    title: blog.title,
    slug: blog.slug,
    content: blog.content,
    meta_title: blog.meta_title,
    meta_description: blog.meta_description,
    thumbnail_source_url: thumbnailUrl,
    tags: blog.tags,
    status: "published",
    author: "Manish Bandi",
    published_at: now,
    created_at: now
  };

  const response = await fetch(BLOG_API_URL, {
    method: "POST",
    headers: {
      "x-blog-api-secret": BLOG_API_SECRET,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const responseText = await response.text();
  let data;
  try {
    data = JSON.parse(responseText);
  } catch {
    data = { raw: responseText };
  }

  if (!response.ok) throw new Error(`Publish error (${response.status}): ${JSON.stringify(data)}`);

  console.log("✅ Blog published successfully!");
  return data;
}

// ============================================================
// STEP 6 — Trigger Vercel rebuild
// ============================================================

async function triggerVercelRebuild() {
  if (!VERCEL_DEPLOY_HOOK || VERCEL_DEPLOY_HOOK.trim() === "") {
    console.log("⏭️ Skipping Vercel rebuild (VERCEL_DEPLOY_HOOK not configured)");
    return;
  }
  console.log("🔄 Triggering Vercel rebuild...");
  const fetch = (await import("node-fetch")).default;
  const res = await fetch(VERCEL_DEPLOY_HOOK, { method: "POST" });
  console.log(`✅ Vercel rebuild triggered (status: ${res.status})`);
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log("\n🚀 CNC Blog Agent Starting...");
  console.log("=".repeat(50));
  console.log(`📅 Running at: ${new Date().toUTCString()}`);

  try {
    // Validate all secrets are present
    validateSecrets();

    // Step 1 — Get existing blogs to avoid repetition
    const { slugs, titles } = await getExistingSlugs();

    // Step 2 — Research topics
    const topicsText = await researchTopics(titles);

    // Step 3 — Wait 90 seconds to respect Claude API rate limits
    console.log("⏳ Waiting 90 seconds before blog writing (rate limit safety)...");
    await sleep(90000);

    // Step 4 — Write blog
    const blog = await writeBlog(topicsText, titles);

    // Step 5 — Generate thumbnail
    const thumbnailUrl = await generateThumbnail(blog);

    // Step 6 — Publish to Supabase
    await publishBlog(blog, thumbnailUrl);

    // Step 7 — Trigger Vercel rebuild
    await triggerVercelRebuild();

    console.log("=".repeat(50));
    console.log("🎉 ALL DONE!");
    console.log(`📝 Title  : ${blog.title}`);
    console.log(`🔗 URL    : https://www.unimakeworks.com/blog/${blog.slug}`);
    console.log(`🏷️  Tags   : ${blog.tags.join(", ")}`);
    console.log("=".repeat(50));

  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    process.exit(1);
  }
}

main();
