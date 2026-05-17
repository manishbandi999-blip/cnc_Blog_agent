// CNC BLOG AGENT — Unimake Works
// Buyer Intent Topics + Problem→Solution Format + International Focus

const CLAUDE_API_KEY     = process.env.CLAUDE_API_KEY;
const IDEOGRAM_API_KEY   = process.env.IDEOGRAM_API_KEY;
const SUPABASE_ANON_KEY  = process.env.SUPABASE_ANON_KEY;
const BLOG_API_SECRET    = process.env.BLOG_API_SECRET;
const VERCEL_DEPLOY_HOOK = process.env.VERCEL_DEPLOY_HOOK;
const MAKE_WEBHOOK_URL   = process.env.MAKE_WEBHOOK_URL;

const SUPABASE_URL      = "https://onttzurgwjhgyboxcpmy.supabase.co";
const BLOG_API_URL      = `${SUPABASE_URL}/functions/v1/create-blog`;
const SUPABASE_REST_URL = `${SUPABASE_URL}/rest/v1/blogs`;

function validateSecrets() {
  const required = { CLAUDE_API_KEY, IDEOGRAM_API_KEY, SUPABASE_ANON_KEY, BLOG_API_SECRET };
  const missing = Object.entries(required).filter(([_, v]) => !v || v.trim() === "").map(([k]) => k);
  if (missing.length > 0) throw new Error(`Missing secrets: ${missing.join(", ")}`);
  console.log("✅ All secrets found");
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

const DAY_CATEGORIES = {
  0: "How international buyers can source CNC parts from India — finding suppliers, verifying quality, placing orders",
  1: "CNC material selection for buyers — aluminium vs steel vs stainless, cost in INR, best choice per application",
  2: "CNC processes explained simply — VMC milling vs turning vs 4-axis vs 5-axis, which process for which part",
  3: "Why source CNC parts from India — India vs China cost and quality comparison, delivery to Gulf countries",
  4: "CNC quality and tolerances — what tolerance means, ISO 9001, CMM inspection, how to avoid wrong parts",
  5: "CNC part cost and quotation — why parts are expensive, how to reduce cost, DFM tips, getting fast quotes",
  6: "CNC for specific industries — automotive, aerospace, EV, defense, oil and gas applications from India"
};

const THUMBNAIL_STYLES = [
  "dark steel CNC workshop, sparks flying, dramatic industrial lighting",
  "technical blueprint style, orange accents, precision engineering",
  "macro close-up CNC machined metal parts, studio lighting, quality finish"
];

const LINKEDIN_STYLES = [
  "professional LinkedIn banner, navy blue, bold white text, orange accents, CNC India",
  "corporate banner, steel grey and white, precision engineering headline, India export",
  "industrial banner, metallic texture, orange black scheme, Hyderabad manufacturing"
];

// ============================================================
// STEP 1 — Get existing blogs
// ============================================================
async function getExistingSlugs() {
  console.log("📋 Fetching existing blogs...");
  try {
    const fetch = (await import("node-fetch")).default;
    const res = await fetch(`${SUPABASE_REST_URL}?select=slug,title&status=eq.published&order=created_at.desc&limit=20`, {
      headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` }
    });
    const data = await res.json();
    if (!Array.isArray(data)) return { slugs: [], titles: [] };
    console.log(`📊 Found ${data.length} existing blogs`);
    return { slugs: data.map(b => b.slug), titles: data.map(b => b.title) };
  } catch (e) {
    console.log("⚠️ Could not fetch blogs:", e.message);
    return { slugs: [], titles: [] };
  }
}

// ============================================================
// STEP 2 — Research buyer search topics
// ============================================================
async function researchTopics(existingTitles) {
  console.log("🔍 Researching buyer search topics...");
  const fetch = (await import("node-fetch")).default;
  const today = new Date();
  const day = today.getDay();
  const category = DAY_CATEGORIES[day];
  const dayName = DAY_NAMES[day];
  const existing = existingTitles.length > 0 ? `\nAvoid these already published topics:\n${existingTitles.slice(0,10).join("\n")}` : "";

  const prompt = `Today is ${dayName}. Category: ${category}

Search Google to find what REAL BUYERS type when they need CNC machined parts from India.
Focus on purchase-intent searches from Saudi Arabia, UAE, USA, UK buyers.
${existing}

Return 3 unique blog topic ideas. Each must:
1. Match actual buyer search queries
2. Have not been covered in existing blogs above  
3. Target international buyers outside India
4. Lead to Unimake Works as the solution

Return JSON array only:
[{"topic":"title","keyword":"main search keyword","buyer_problem":"their problem","unimake_solution":"how Unimake solves it"}]
JSON only. No extra text.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": CLAUDE_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-5", max_tokens: 800,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(`Research error: ${JSON.stringify(data)}`);
  const block = data.content.filter(c => c.type === "text").pop();
  if (!block) throw new Error("No research response");
  console.log("✅ Topics researched");
  return block.text;
}

// ============================================================
// STEP 3 — Write blog
// ============================================================
async function writeBlog(topicsText, existingTitles) {
  console.log("✍️ Writing blog post...");
  const fetch = (await import("node-fetch")).default;
  const today = new Date();
  const dateSlug = today.toISOString().slice(0,10);
  const timestamp = today.getTime();
  const existing = existingTitles.length > 0 ? `Do not repeat: ${existingTitles.slice(0,8).join(", ")}` : "";

  const prompt = `You are Manish Bandi, Founder of Unimake Works, Hyderabad India.
10+ years CNC machining experience. ISO 9001:2015 certified.
Machines: 6 VMC in-house, 30+ VMC, 20+ CNC Turning, 2 fourth-axis, 2 fifth-axis in partner network (60+ total).
Materials: All metals except Magnesium.
Clients: All industries worldwide. Mainly Saudi Arabia, UAE, USA, UK buyers.

Topic ideas from research:
${topicsText}
${existing}

Write a blog post for international buyers who need CNC parts from India.

STRICT RULES:
- 800 to 1200 words ONLY. Never exceed 1200 words.
- Simple English. Short paragraphs (3-4 lines max).
- Every technical term must have bracket explanation.
  Example: "VMC (Vertical Machining Centre — CNC machine that cuts metal vertically)"
  Example: "Tolerance (±0.01mm — how much size variation is allowed)"
  Example: "Ra value (surface roughness — Ra 0.8 is very smooth, Ra 3.2 is standard)"
- Add real practical examples throughout.
  Example: "For example, a Saudi oil company ordering valve bodies needs..."
- Structure: Problem Hook → Explanation → Technical Content → Comparison Table → Unimake Solution → CTA
- Mention Unimake Works 3-4 times naturally. Mention ISO 9001:2015, 60+ machines, Hyderabad India, 6-hour quote response.
- End with CTA: website quote form, email, WhatsApp.
- HEADING: for H2 sections. SUBHEADING: for H3. No HTML tags in content.

Pick the best topic and write the blog now.

Respond with ONLY this JSON object (start with { end with }):
{"title":"...","slug":"keyword-slug-${dateSlug}","meta_title":"under 60 chars","meta_description":"under 155 chars","content":"full blog text with HEADING: and SUBHEADING: markers","tags":["tag1","tag2","tag3","tag4","tag5"],"thumbnail_prompt":"5 words max visual description"}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": CLAUDE_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-5", max_tokens: 4000,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(`Blog write error: ${JSON.stringify(data)}`);
  const block = data.content.filter(c => c.type === "text").pop();
  if (!block) throw new Error("No blog response");

  let text = block.text.replace(/```json\n?/g,"").replace(/```\n?/g,"").trim();
  console.log("Claude response preview:", text.substring(0,100));

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) {
    console.log("Full Claude response:", text);
    throw new Error("No JSON found in Claude response");
  }

  const blog = JSON.parse(text.substring(start, end+1));
  blog.slug = `${blog.slug}-${timestamp}`;

  const lines = blog.content.split("\n").filter(l => l.trim());
  let html = "";
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith("HEADING:")) html += `<h2>${t.replace("HEADING:","").trim()}</h2>\n`;
    else if (t.startsWith("SUBHEADING:")) html += `<h3>${t.replace("SUBHEADING:","").trim()}</h3>\n`;
    else if (t.length > 0) html += `<p>${t}</p>\n`;
  }

  html += `<h2>Ready to Get Your CNC Parts from India?</h2>
<p>Unimake Works manufactures precision CNC parts for buyers across Saudi Arabia, UAE, USA and UK. ISO 9001:2015 certified. 60+ machines. 6-hour quote response from Hyderabad, India.</p>
<p>✅ <a href="https://www.unimakeworks.com/request-quote">Request Quote Online</a><br/>✅ Email us your drawings<br/>✅ WhatsApp for quick response</p>`;

  blog.content = html;
  console.log(`✅ Blog written: "${blog.title}"`);
  return blog;
}

// ============================================================
// STEP 4 — Blog thumbnail
// ============================================================
async function generateThumbnail(blog) {
  console.log("🖼️ Generating blog thumbnail...");
  const fetch = (await import("node-fetch")).default;
  const style = THUMBNAIL_STYLES[new Date().getDay() % 3];
  const res = await fetch("https://api.ideogram.ai/generate", {
    method: "POST",
    headers: { "Api-Key": IDEOGRAM_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ image_request: { prompt: `${blog.thumbnail_prompt}, ${style}, 1200x630px professional`, aspect_ratio: "ASPECT_16_9", model: "V_2", magic_prompt_option: "AUTO" } })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Ideogram error: ${JSON.stringify(data)}`);
  console.log("✅ Blog thumbnail done");
  return data.data[0].url;
}

// ============================================================
// STEP 5 — LinkedIn thumbnail
// ============================================================
async function generateLinkedInThumbnail(blog) {
  console.log("🖼️ Generating LinkedIn thumbnail...");
  const fetch = (await import("node-fetch")).default;
  const style = LINKEDIN_STYLES[new Date().getDay() % 3];
  const res = await fetch("https://api.ideogram.ai/generate", {
    method: "POST",
    headers: { "Api-Key": IDEOGRAM_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ image_request: { prompt: `${blog.thumbnail_prompt}, ${style}, LinkedIn banner 1200x627px`, aspect_ratio: "ASPECT_16_9", model: "V_2", magic_prompt_option: "AUTO" } })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Ideogram LinkedIn error: ${JSON.stringify(data)}`);
  console.log("✅ LinkedIn thumbnail done");
  return data.data[0].url;
}

// ============================================================
// STEP 6 — LinkedIn caption
// ============================================================
async function writeLinkedInCaption(blog, blogUrl) {
  console.log("✍️ Writing LinkedIn caption...");
  const fetch = (await import("node-fetch")).default;
  const prompt = `You are Manish Bandi, Founder of Unimake Works, Hyderabad India.
Write a LinkedIn post for international CNC buyers.

Blog: ${blog.title}
URL: ${blogUrl}
Summary: ${blog.meta_description}

Rules: Hook opening → 3 short paragraphs → 3 bullet insights → CTA with URL → 5 hashtags
Mention Unimake Works, ISO 9001, 60+ machines, Hyderabad India naturally.
Max 180 words. Expert tone, not salesy.
Return post text only.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": CLAUDE_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 400, messages: [{ role: "user", content: prompt }] })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`LinkedIn caption error: ${JSON.stringify(data)}`);
  const block = data.content.filter(c => c.type === "text").pop();
  console.log("✅ LinkedIn caption done");
  return block.text.trim();
}

// ============================================================
// STEP 7 — Publish to Supabase
// ============================================================
async function publishBlog(blog, thumbnailUrl) {
  console.log("📤 Publishing to website...");
  const fetch = (await import("node-fetch")).default;
  const now = new Date().toISOString();
  const res = await fetch(BLOG_API_URL, {
    method: "POST",
    headers: { "x-blog-api-secret": BLOG_API_SECRET, "Content-Type": "application/json" },
    body: JSON.stringify({
      title: blog.title, slug: blog.slug, content: blog.content,
      meta_title: blog.meta_title, meta_description: blog.meta_description,
      thumbnail_source_url: thumbnailUrl, tags: blog.tags,
      status: "published", author: "Manish Bandi",
      published_at: now, created_at: now
    })
  });
  const text = await res.text();
  let data; try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok) throw new Error(`Publish error (${res.status}): ${JSON.stringify(data)}`);
  console.log("✅ Blog published!");
  return data;
}

// ============================================================
// STEP 8 — Post to LinkedIn via Make.com
// ============================================================
async function postToLinkedIn(blog, caption, liImage, blogUrl) {
  if (!MAKE_WEBHOOK_URL || MAKE_WEBHOOK_URL.trim() === "") { console.log("⏭️ Skipping LinkedIn"); return; }
  console.log("💼 Posting to LinkedIn...");
  const fetch = (await import("node-fetch")).default;
  const res = await fetch(MAKE_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: blog.title, linkedin_caption: caption, image_url: liImage, blog_url: blogUrl })
  });
  console.log(res.ok ? "✅ LinkedIn posted!" : `⚠️ Make.com status: ${res.status}`);
}

// ============================================================
// STEP 9 — Vercel rebuild
// ============================================================
async function triggerVercel() {
  if (!VERCEL_DEPLOY_HOOK || VERCEL_DEPLOY_HOOK.trim() === "") { console.log("⏭️ Skipping Vercel"); return; }
  const fetch = (await import("node-fetch")).default;
  const res = await fetch(VERCEL_DEPLOY_HOOK, { method: "POST" });
  console.log(`✅ Vercel rebuild triggered (${res.status})`);
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log("\n🚀 CNC Blog Agent — Unimake Works");
  console.log("=".repeat(50));
  console.log(`📅 ${new Date().toUTCString()}`);
  console.log(`🌍 Target: International CNC buyers`);

  try {
    validateSecrets();

    const { slugs, titles } = await getExistingSlugs();
    const topicsText = await researchTopics(titles);

    console.log("⏳ Waiting 3 minutes (rate limit safety)...");
    await sleep(180000);

    const blog = await writeBlog(topicsText, titles);
    const blogUrl = `https://www.unimakeworks.com/blog/${blog.slug}`;

    const thumbUrl   = await generateThumbnail(blog);
    const liThumbUrl = await generateLinkedInThumbnail(blog);
    const liCaption  = await writeLinkedInCaption(blog, blogUrl);

    await publishBlog(blog, thumbUrl);
    await postToLinkedIn(blog, liCaption, liThumbUrl, blogUrl);
    await triggerVercel();

    console.log("=".repeat(50));
    console.log("🎉 ALL DONE!");
    console.log(`📝 ${blog.title}`);
    console.log(`🔗 ${blogUrl}`);
    console.log("=".repeat(50));

  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    process.exit(1);
  }
}

main();
