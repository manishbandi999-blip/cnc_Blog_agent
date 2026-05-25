// ============================================================
// CNC BLOG AGENT — Unimake Works
// Strategy: Skyscraper SEO — Research top ranking content,
// write something better. Post 3x/week for quality over quantity.
// Target: International buyers outside India
// ============================================================

const CLAUDE_API_KEY     = process.env.CLAUDE_API_KEY;
const IDEOGRAM_API_KEY   = process.env.IDEOGRAM_API_KEY;
const SUPABASE_ANON_KEY  = process.env.SUPABASE_ANON_KEY;
const BLOG_API_SECRET    = process.env.BLOG_API_SECRET;
const VERCEL_DEPLOY_HOOK = process.env.VERCEL_DEPLOY_HOOK;

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

// Monday=1, Wednesday=3, Friday=5
const DAY_TOPICS = {
  1: {
    focus: "CNC sourcing and supplier selection for international buyers",
    keywords: ["CNC parts supplier India", "CNC machining company India export", "reliable CNC manufacturer India"],
    angle: "Problem: Buyers don't know how to find and verify a good Indian CNC supplier"
  },
  3: {
    focus: "CNC cost, materials and design optimization for buyers",
    keywords: ["CNC machining cost India", "reduce CNC part cost", "CNC material selection guide"],
    angle: "Problem: Buyers are overpaying or getting wrong material recommendations"
  },
  5: {
    focus: "CNC quality, tolerances and inspection for international orders",
    keywords: ["CNC part quality India", "CNC tolerance explained", "ISO 9001 CNC manufacturer India"],
    angle: "Problem: Buyers have received wrong or poor quality CNC parts before"
  }
};

const THUMBNAIL_STYLES = [
  "dark steel CNC workshop, sparks flying, dramatic industrial lighting, professional photo",
  "technical blueprint engineering style, orange accents, precision machining India",
  "macro close-up CNC machined metal parts, studio lighting, high quality finish"
];

// ============================================================
// STEP 1 — Get existing blogs
// ============================================================
async function getExistingSlugs() {
  console.log("📋 Fetching existing blogs...");
  try {
    const fetch = (await import("node-fetch")).default;
    const res = await fetch(
      `${SUPABASE_REST_URL}?select=slug,title&status=eq.published&order=created_at.desc&limit=30`,
      { headers: { "apikey": SUPABASE_ANON_KEY, "Authorization": `Bearer ${SUPABASE_ANON_KEY}` } }
    );
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
// STEP 2 — Skyscraper Research
// Find what is already ranking, then plan to beat it
// ============================================================
async function skyscraperResearch(existingTitles) {
  console.log("🔍 Running Skyscraper SEO research...");
  const fetch = (await import("node-fetch")).default;

  const today = new Date();
  const day = today.getDay();
  const topic = DAY_TOPICS[day] || DAY_TOPICS[1];
  const existing = existingTitles.length > 0
    ? `Already published (avoid these topics):\n${existingTitles.slice(0,15).join("\n")}`
    : "";

  const prompt = `You are an SEO expert helping Unimake Works rank on Google.

TODAY'S FOCUS: ${topic.focus}
TARGET KEYWORDS: ${topic.keywords.join(", ")}
BUYER PROBLEM: ${topic.angle}

${existing}

DO THIS:
1. Search Google for the target keywords above
2. Find what articles are currently ranking on page 1
3. Analyze what topics they cover and what they MISS
4. Identify one specific blog topic that:
   - Matches exactly what buyers search on Google
   - Has not been covered in existing blogs above
   - Can be covered BETTER than current ranking articles
   - Will attract buyers from Saudi Arabia, UAE, USA, UK

Return JSON only:
{
  "chosen_topic": "exact blog title",
  "primary_keyword": "main keyword to rank for",
  "secondary_keywords": ["kw2", "kw3", "kw4"],
  "buyer_search_query": "exact phrase buyer types in Google",
  "what_ranks_now": "brief description of what currently ranks",
  "what_we_cover_better": "what our article will cover that others miss",
  "buyer_problem": "specific problem this buyer has",
  "word_count_target": 1800
}
JSON only. No extra text.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": CLAUDE_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-5", max_tokens: 600,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(`Research error: ${JSON.stringify(data)}`);
  const block = data.content.filter(c => c.type === "text").pop();
  if (!block) throw new Error("No research response");

  let text = block.text.replace(/```json\n?/g,"").replace(/```\n?/g,"").trim();
  const s = text.indexOf("{"); const e = text.lastIndexOf("}");
  if (s === -1 || e === -1) throw new Error("No JSON in research response");

  const research = JSON.parse(text.substring(s, e+1));
  console.log(`✅ Research done. Topic: "${research.chosen_topic}"`);
  console.log(`🎯 Keyword: "${research.primary_keyword}"`);
  console.log(`📊 We cover better: "${research.what_we_cover_better}"`);
  return research;
}

// ============================================================
// STEP 3 — Write high quality blog (Skyscraper style)
// ============================================================
async function writeQualityBlog(research, existingTitles) {
  console.log("✍️ Writing high quality blog...");
  const fetch = (await import("node-fetch")).default;
  const today = new Date();
  const dateSlug = today.toISOString().slice(0,10);
  const timestamp = today.getTime();

  const prompt = `You are Manish Bandi, Founder of Unimake Works, Hyderabad India.
You have 10+ years hands-on CNC machining experience on the shop floor.

COMPANY FACTS (mention naturally — not like advertisement):
- ISO 9001:2015 certified CNC manufacturer
- 6 VMC (Vertical Machining Centres) in-house
- 30+ VMC, 20+ CNC Turning, 2 Fourth-axis, 2 Fifth-axis in partner network
- Total 60+ machines across network in Hyderabad, India
- All materials except Magnesium
- Clients in Saudi Arabia, UAE, USA, UK, Australia
- Quote response within 6 hours
- Website: www.unimakeworks.com

BLOG ASSIGNMENT:
Topic: ${research.chosen_topic}
Primary keyword to rank for: ${research.primary_keyword}
Secondary keywords: ${research.secondary_keywords.join(", ")}
Buyer search query: ${research.buyer_search_query}
Buyer problem: ${research.buyer_problem}
What we cover better than competitors: ${research.what_we_cover_better}

WRITE A HIGH QUALITY BLOG FOLLOWING THESE RULES:

QUALITY RULES (Google E-E-A-T):
1. Open with a real scenario or experience from Unimake Works shop floor
   Example: "Last month a procurement manager from Riyadh contacted us..."
   Example: "In our CNC workshop in Hyderabad, we see this mistake often..."
2. Show REAL expertise — specific numbers, real tolerances, actual prices in INR/USD
3. Share genuine opinions and recommendations based on experience
4. Mention real client situations (without naming clients) to show experience

CONTENT RULES:
- 1600 to 1800 words. Quality over everything.
- Simple English but with technical terms in brackets always
  Format: "VMC (Vertical Machining Centre — a CNC machine that cuts metal by moving the cutting tool vertically)"
  Format: "Ra 1.6 (surface roughness value — means a smooth finish suitable for moving parts)"
  Format: "Tolerance ±0.02mm (the part can be max 0.02mm bigger or smaller than drawing — very tight)"
- Short paragraphs — max 4 lines each
- Real practical examples in every section
- At least one comparison table with real data
- Write from first-person experience perspective

STRUCTURE (follow exactly):
HEADING: [Opening Hook — Real scenario or surprising fact]
[2-3 paragraphs setting up the buyer problem with real example]

HEADING: [Main problem explained in depth]
[Technical content with bracket explanations and examples]

HEADING: [Key factor 1 buyers must know]
[Detailed practical information]

SUBHEADING: [Sub point]
[Content]

HEADING: [Key factor 2 buyers must know]
[Comparison table here]

HEADING: [Key factor 3 buyers must know]
[More practical content]

HEADING: Frequently Asked Questions
[4-5 FAQs that buyers actually ask — with detailed answers]

HEADING: How Unimake Works Solves This
[2-3 paragraphs naturally explaining Unimake Works solution]
[Mention ISO 9001, machines, location, response time naturally]

[End with CTA]

SEO RULES:
- Use primary keyword naturally in first paragraph
- Use primary keyword in at least 2 headings
- Use secondary keywords naturally throughout
- FAQ section helps rank for featured snippets on Google

Respond with ONLY this JSON. Start with { end with }:
{"title":"...","slug":"primary-keyword-slug-${dateSlug}","meta_title":"under 60 chars with keyword","meta_description":"under 155 chars, mention India CNC benefit","content":"full blog with HEADING: and SUBHEADING: markers, no HTML","tags":["tag1","tag2","tag3","tag4","tag5"],"thumbnail_prompt":"5 words max visual"}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": CLAUDE_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-5", max_tokens: 5000,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(`Blog write error: ${JSON.stringify(data)}`);
  const block = data.content.filter(c => c.type === "text").pop();
  if (!block) throw new Error("No blog response from Claude");

  let text = block.text.replace(/```json\n?/g,"").replace(/```\n?/g,"").trim();
  console.log("Claude preview:", text.substring(0,150));

  const s = text.indexOf("{"); const e = text.lastIndexOf("}");
  if (s === -1 || e === -1) {
    console.log("Full Claude response:", text.substring(0,500));
    throw new Error("No JSON found in Claude blog response");
  }

  const blog = JSON.parse(text.substring(s, e+1));
  blog.slug = `${blog.slug}-${timestamp}`;

  // Convert plain text to HTML with proper structure
  const lines = blog.content.split("\n").filter(l => l.trim());
  let html = "";
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith("HEADING:")) {
      html += `<h2>${t.replace("HEADING:","").trim()}</h2>\n`;
    } else if (t.startsWith("SUBHEADING:")) {
      html += `<h3>${t.replace("SUBHEADING:","").trim()}</h3>\n`;
    } else if (t.startsWith("|")) {
      html += `<p style="font-family:monospace">${t}</p>\n`;
    } else if (t.length > 0) {
      html += `<p>${t}</p>\n`;
    }
  }

  // Strong CTA at end
  html += `
<h2>Get a Quote from Unimake Works in 6 Hours</h2>
<p>We manufacture precision CNC parts for buyers across Saudi Arabia, UAE, USA, UK and Australia. ISO 9001:2015 certified. 60+ machines across our network in Hyderabad, India. Send us your drawings and get a detailed quote within 6 hours.</p>
<p>
✅ <a href="https://www.unimakeworks.com/request-quote"><strong>Request Quote Online — Free</strong></a><br/>
✅ Email your drawings directly<br/>
✅ WhatsApp for quick questions
</p>`;

  blog.content = html;
  console.log(`✅ Blog written: "${blog.title}"`);
  return blog;
}

// ============================================================
// STEP 4 — Generate thumbnail
// ============================================================
async function generateThumbnail(blog) {
  console.log("🖼️ Generating thumbnail...");
  const fetch = (await import("node-fetch")).default;
  const style = THUMBNAIL_STYLES[new Date().getDay() % 3];
  const res = await fetch("https://api.ideogram.ai/generate", {
    method: "POST",
    headers: { "Api-Key": IDEOGRAM_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      image_request: {
        prompt: `${blog.thumbnail_prompt}, ${style}, 1200x630px`,
        aspect_ratio: "ASPECT_16_9", model: "V_2", magic_prompt_option: "AUTO"
      }
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Ideogram error: ${JSON.stringify(data)}`);
  console.log("✅ Thumbnail generated");
  return data.data[0].url;
}

// ============================================================
// STEP 5 — Publish to Supabase
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
  const resText = await res.text();
  let data; try { data = JSON.parse(resText); } catch { data = { raw: resText }; }
  if (!res.ok) throw new Error(`Publish error (${res.status}): ${JSON.stringify(data)}`);
  console.log("✅ Blog published!");
  return data;
}

// ============================================================
// STEP 6 — Trigger Vercel rebuild
// ============================================================
async function triggerVercel() {
  if (!VERCEL_DEPLOY_HOOK || VERCEL_DEPLOY_HOOK.trim() === "") {
    console.log("⏭️ Skipping Vercel rebuild");
    return;
  }
  const fetch = (await import("node-fetch")).default;
  const res = await fetch(VERCEL_DEPLOY_HOOK, { method: "POST" });
  console.log(`✅ Vercel rebuild triggered (${res.status})`);
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log("\n🚀 CNC Blog Agent — Unimake Works (Quality Edition)");
  console.log("=".repeat(55));
  console.log(`📅 ${new Date().toUTCString()}`);
  console.log(`🎯 Strategy: Skyscraper SEO — Quality over Quantity`);
  console.log(`🌍 Target: International CNC buyers (Saudi, UAE, USA, UK)`);

  try {
    validateSecrets();

    const { titles } = await getExistingSlugs();

    // Step 1: Skyscraper research
    const research = await skyscraperResearch(titles);

    // Step 2: Wait 5 minutes for rate limit reset
    console.log("⏳ Waiting 5 minutes (rate limit safety)...");
    await sleep(300000);

    // Step 3: Write high quality blog
    const blog = await writeQualityBlog(research, titles);
    const blogUrl = `https://www.unimakeworks.com/blog/${blog.slug}`;

    // Step 4: Generate thumbnail
    const thumbUrl = await generateThumbnail(blog);

    // Step 5: Publish
    await publishBlog(blog, thumbUrl);

    // Step 6: Vercel rebuild
    await triggerVercel();

    console.log("=".repeat(55));
    console.log("🎉 HIGH QUALITY BLOG PUBLISHED!");
    console.log(`📝 Title   : ${blog.title}`);
    console.log(`🔑 Keyword : ${research.primary_keyword}`);
    console.log(`🔗 URL     : ${blogUrl}`);
    console.log(`📊 Better than competitors: ${research.what_we_cover_better}`);
    console.log("=".repeat(55));

  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    process.exit(1);
  }
}

main();
