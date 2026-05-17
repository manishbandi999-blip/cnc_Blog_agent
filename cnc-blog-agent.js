// ============================================================
// CNC BLOG AGENT — Unimake Works
// Research → Write → Thumbnail → Publish → LinkedIn
// Strategy: Buyer Search Intent + Problem→Solution Format
// Target: International buyers outside India
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

// ============================================================
// UNIMAKE WORKS — Company Profile (used in every blog)
// ============================================================

const COMPANY_PROFILE = `
COMPANY: Unimake Works
FOUNDER: Manish Bandi
LOCATION: Hyderabad, India
CERTIFICATION: ISO 9001:2015 certified

MACHINE CAPACITY:
- 6 VMC (Vertical Machining Centres) in-house
- 30+ VMC in partner network
- 20+ CNC Turning machines in partner network
- 2 Fourth-axis machines (for complex angled features)
- 2 Fifth-axis machines (for highly complex geometries)
- Total: 60+ machines across network

MATERIALS: All metals and engineering materials
(Aluminium alloys, Steel, Stainless Steel, Brass, 
Copper, Titanium, Inconel, Tool Steel, POM, Nylon)
EXCEPTION: Does not work with Magnesium

INDUSTRIES SERVED: All industries
(Automotive, Aerospace, EV/Electric Vehicles, Defense,
Medical Devices, Oil and Gas, Robotics, General Engineering)

TARGET CLIENTS: International buyers outside India
(Saudi Arabia, UAE, Bahrain, USA, UK, Australia, Canada)

HOW TO CONTACT UNIMAKE WORKS:
1. Request Quote on website: www.unimakeworks.com/request-quote
2. Email: (mention email on website)
3. WhatsApp: (mention WhatsApp on website)
QUOTE RESPONSE TIME: Within 6 hours
`;

// ============================================================
// BLOG WRITING RULES (applied to every blog)
// ============================================================

const BLOG_RULES = `
STRICT BLOG WRITING RULES — FOLLOW EXACTLY:

1. WORD COUNT: 800 to 1200 words ONLY. Never more than 1200 words.

2. LANGUAGE: Very simple English. Write as if explaining to a 
   non-engineer buyer who is purchasing CNC parts for the first time.
   Avoid complicated sentences. Short paragraphs — max 3-4 lines each.

3. TECHNICAL TERMS: Always use technical terms BUT immediately explain 
   them in brackets after.
   Example: "VMC (Vertical Machining Centre — a CNC machine where the 
   cutting tool moves up and down to cut metal precisely)"
   Example: "Tolerance (±0.01mm — this means the part can be 0.01mm 
   bigger or smaller than the drawing, anything beyond that is rejected)"
   Example: "Ra value (Surface Roughness — Ra 0.8 means a very smooth 
   finish, Ra 3.2 means a standard finish)"
   Example: "GD&T (Geometric Dimensioning and Tolerancing — an 
   international standard for defining exact measurements on drawings)"

4. REAL EXAMPLES: Add practical real-world examples throughout.
   Example: "For example, an automotive brake bracket needs tolerance 
   of ±0.05mm — our VMC machines achieve this consistently"
   Example: "Think of it like ordering a custom-fit suit — the 
   measurements must be exact or it won't work"

5. STRUCTURE: Every blog must follow this exact structure:
   - Hook: Start with the reader's PROBLEM or QUESTION (2-3 lines)
   - Problem explanation: Why this problem happens (with example)
   - Main content: Practical information with examples and technical terms
   - Comparison or table: At least one comparison or data table
   - Unimake Works Solution: How Unimake Works solves this exact problem
   - CTA: End with 3 contact options

6. PROBLEM → SOLUTION FORMAT:
   Every blog must feel like: "You have this problem → Here is the 
   solution → Unimake Works is the best place to get this solution"

7. UNIMAKE WORKS MENTION:
   - Mention Unimake Works naturally 3-4 times in the blog
   - Always mention: ISO 9001:2015 certification
   - Always mention: 60+ machine network
   - Always mention: Hyderabad, India location
   - Always mention: 6-hour quote response time
   - Do NOT make it sound like an advertisement — make it sound 
     like genuine advice from an expert who happens to run Unimake Works

8. CTA AT END — Always end with this section:
   "Ready to Get Your CNC Parts Manufactured?
   At Unimake Works we manufacture precision CNC parts for clients 
   across Saudi Arabia, UAE, USA, UK and more. ISO 9001:2015 certified, 
   60+ machines, 6-hour quote response.
   ✅ Request Quote: www.unimakeworks.com/request-quote
   ✅ Email us your drawings
   ✅ WhatsApp us for quick response"

9. NEVER WRITE ABOUT:
   - Magnesium machining
   - Theoretical or academic topics with no practical use
   - Generic global tech trends (AI, metaverse, blockchain in CNC)
   - Topics that don't help a buyer choose or evaluate a CNC supplier
`;

// ============================================================
// DAY-BASED CATEGORIES — Buyer Search Intent Focus
// ============================================================

const DAY_CATEGORIES = {
  0: {
    name: "How to Source CNC Parts from India",
    search_focus: "International buyers searching for Indian CNC suppliers",
    buyer_searches: [
      "how to import CNC parts from India",
      "CNC machining supplier India for Saudi Arabia",
      "reliable CNC manufacturer India export",
      "how to order CNC parts from Indian company",
      "CNC parts India to UAE supplier"
    ],
    problem_solution_angles: [
      "How to find a trustworthy CNC supplier in India",
      "What to check before ordering CNC parts from India",
      "How Unimake Works makes ordering from India simple for Gulf buyers"
    ]
  },
  1: {
    name: "CNC Materials Selection",
    search_focus: "Engineers deciding which material to use for their part",
    buyer_searches: [
      "which metal for CNC machined part",
      "aluminium vs steel CNC machining cost",
      "best material for precision CNC parts",
      "stainless steel CNC machining India cost",
      "CNC material selection guide"
    ],
    problem_solution_angles: [
      "How to choose the right material for your CNC part",
      "Why wrong material selection costs you double",
      "Complete material guide: What Unimake Works recommends for each industry"
    ]
  },
  2: {
    name: "CNC Processes Explained Simply",
    search_focus: "Buyers who need to understand CNC processes to make better decisions",
    buyer_searches: [
      "difference between CNC milling and turning",
      "what is VMC machining",
      "CNC machining process explained simply",
      "5-axis CNC machining benefits India",
      "surface finish options CNC parts"
    ],
    problem_solution_angles: [
      "CNC Turning vs Milling: Which process does your part need?",
      "What is 5-axis machining and when do you actually need it?",
      "How Unimake Works selects the right process for your part"
    ]
  },
  3: {
    name: "India CNC Manufacturing Advantage",
    search_focus: "International buyers comparing India vs other countries for CNC sourcing",
    buyer_searches: [
      "CNC machining India vs China cost comparison",
      "why source CNC parts from India",
      "India CNC manufacturing quality standard",
      "CNC parts India delivery time international",
      "Made in India CNC precision parts quality"
    ],
    problem_solution_angles: [
      "India vs China CNC parts: Real cost and quality comparison",
      "Why Saudi and UAE companies are switching to Indian CNC suppliers",
      "How to get China-competitive pricing with better quality from India"
    ]
  },
  4: {
    name: "CNC Quality and Tolerances",
    search_focus: "Buyers who have faced quality problems or need tight tolerance parts",
    buyer_searches: [
      "how to ensure CNC part quality from India",
      "CNC machining tolerance explained",
      "ISO 9001 CNC manufacturer India",
      "how to read CNC inspection report",
      "CMM inspection CNC parts India"
    ],
    problem_solution_angles: [
      "Received wrong CNC parts? Here is how to prevent it next time",
      "What does ±0.01mm tolerance actually mean for your part?",
      "How Unimake Works guarantees quality with CMM inspection and ISO 9001"
    ]
  },
  5: {
    name: "CNC Cost and Quotation",
    search_focus: "Buyers trying to reduce CNC costs or understand pricing",
    buyer_searches: [
      "how much does CNC machining cost in India",
      "how to reduce CNC part manufacturing cost",
      "CNC machining price per piece India",
      "why is my CNC quote so expensive",
      "get fast CNC machining quote India"
    ],
    problem_solution_angles: [
      "Why your CNC parts are expensive and how to fix it",
      "How to get an accurate CNC quote in 6 hours from India",
      "5 design changes that can reduce your CNC part cost by 30%"
    ]
  },
  6: {
    name: "Industry-Specific CNC Applications",
    search_focus: "Engineers from specific industries searching for specialized CNC supplier",
    buyer_searches: [
      "CNC parts for electric vehicle manufacturer India",
      "aerospace CNC machining supplier India",
      "automotive CNC components manufacturer Hyderabad",
      "CNC machining for oil and gas India",
      "defense CNC parts manufacturer India"
    ],
    problem_solution_angles: [
      "CNC Machining for EV manufacturers: Materials, tolerances and timelines",
      "Aerospace CNC parts from India: What certifications to look for",
      "How Unimake Works serves automotive, EV and defense industries"
    ]
  }
};

const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

const THUMBNAIL_STYLES = [
  "dark steel CNC workshop background, sparks flying, dramatic industrial lighting, professional",
  "clean white background, technical engineering blueprint style, orange accent colors, precision",
  "macro close-up precision CNC machined metal parts, metallic texture, studio lighting, quality"
];

const LINKEDIN_THUMBNAIL_STYLES = [
  "professional LinkedIn banner, dark navy blue background, bold white typography, orange geometric accents, CNC manufacturing India",
  "clean corporate banner, white and steel grey, bold headline text, precision engineering India export",
  "industrial professional banner, metallic textures, orange and black color scheme, Hyderabad manufacturing"
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
    if (!Array.isArray(data)) { console.log("⚠️ Supabase:", JSON.stringify(data)); return { slugs: [], titles: [] }; }
    console.log(`📊 Found ${data.length} existing blogs`);
    return { slugs: data.map(b => b.slug), titles: data.map(b => b.title) };
  } catch (e) {
    console.log("⚠️ Could not fetch slugs:", e.message);
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
  const dayOfWeek = today.getDay();
  const dayName = DAY_NAMES[dayOfWeek];
  const category = DAY_CATEGORIES[dayOfWeek];
  const dateStr = today.toLocaleDateString("en-IN", { day:"numeric", month:"long", year:"numeric" });

  const existingText = existingTitles.length > 0
    ? `\n\nAlready published blogs (DO NOT repeat similar topics):\n${existingTitles.slice(0, 10).join("\n")}`
    : "";

  const prompt = `Today is ${dayName}, ${dateStr}.

CATEGORY FOR TODAY: ${category.name}
TARGET AUDIENCE: ${category.search_focus}

These are the exact search queries that REAL BUYERS type in Google when they need CNC parts:
${category.buyer_searches.map((s, i) => `${i+1}. "${s}"`).join("\n")}

These are possible blog angles that solve buyer problems and lead to Unimake Works:
${category.problem_solution_angles.map((a, i) => `${i+1}. ${a}`).join("\n")}
${existingText}

YOUR TASK:
Search Google to find what international buyers (Saudi Arabia, UAE, USA, UK) are 
specifically searching for when they need to source CNC machined parts from India.
Focus on PURCHASE INTENT searches — people who are ready to buy or evaluate suppliers.

Return 3 unique blog topic ideas that:
1. Match what real buyers actually search
2. Have not been covered in existing blogs above
3. Will attract buyers from outside India
4. End with Unimake Works as the solution

Return as JSON array only:
[{
  "topic": "exact blog title",
  "primary_keyword": "main keyword buyers search",
  "secondary_keywords": ["keyword2", "keyword3"],
  "buyer_problem": "what problem does this buyer have",
  "search_intent": "what is the buyer trying to achieve",
  "unimake_solution": "how Unimake Works solves this problem"
}]

Return JSON only. No extra text.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": CLAUDE_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 1000,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(`Claude research error: ${JSON.stringify(data)}`);
  const textBlock = data.content.filter(c => c.type === "text").pop();
  if (!textBlock) throw new Error("No text from Claude research");
  console.log("✅ Buyer topics researched");
  return textBlock.text;
}

// ============================================================
// STEP 3 — Write SEO blog with all rules
// ============================================================

async function writeBlog(topicsText, existingTitles) {
  console.log("✍️ Writing blog post...");
  const fetch = (await import("node-fetch")).default;

  const today = new Date();
  const dateSlug = today.toISOString().slice(0, 10);
  const timestamp = today.getTime();
  const existingText = existingTitles.length > 0
    ? `\nDO NOT repeat these topics:\n${existingTitles.slice(0, 10).join("\n")}`
    : "";

  const prompt = `You are Manish Bandi, Founder of Unimake Works, Hyderabad India.
You have 10+ years of hands-on CNC machining experience.
You write helpful blogs for international buyers who need CNC parts from India.

COMPANY PROFILE:
${COMPANY_PROFILE}

BLOG WRITING RULES:
${BLOG_RULES}

TOPIC IDEAS FROM RESEARCH:
${topicsText}
${existingText}

YOUR TASK:
Pick the BEST topic from the research above that will attract international buyers.
Write a complete blog post following ALL the rules above strictly.

IMPORTANT REMINDERS:
- 800 to 1200 words MAXIMUM
- Use technical terms with bracket explanations every time
- Add real practical examples (e.g. "For example, a Saudi aerospace company 
  ordering aluminium brackets needs Ra 1.6 surface finish...")
- Problem → Solution → Unimake Works structure
- End with 3-way CTA (website quote / email / WhatsApp)
- Mention ISO 9001:2015, 60+ machines, Hyderabad, 6-hour response naturally

Return ONLY a valid JSON object with these exact fields:
{
  "title": "compelling blog title with primary keyword",
  "slug": "lowercase-hyphens-only-end-with-${dateSlug}",
  "meta_title": "under 60 characters with primary keyword",
  "meta_description": "under 155 characters, mentions India CNC, buyer benefit",
  "content": "full blog in plain text. Use HEADING: for H2 sections. Use SUBHEADING: for H3. No HTML tags. No double quotes inside content. Technical terms always in brackets.",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "thumbnail_prompt": "maximum 5 words visual description of blog topic"
}

Return JSON only. No markdown. No extra text.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": CLAUDE_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }]
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(`Claude blog error: ${JSON.stringify(data)}`);
  const textBlock = data.content.filter(c => c.type === "text").pop();
  if (!textBlock) throw new Error("No blog from Claude");

  let text = textBlock.text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const start = text.indexOf("{"); const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in Claude response");
  const blog = JSON.parse(text.substring(start, end + 1));
  blog.slug = `${blog.slug}-${timestamp}`;

  // Convert plain text to HTML
  const lines = blog.content.split("\n").filter(l => l.trim());
  let html = "";
  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith("HEADING:")) html += `<h2>${t.replace("HEADING:", "").trim()}</h2>\n`;
    else if (t.startsWith("SUBHEADING:")) html += `<h3>${t.replace("SUBHEADING:", "").trim()}</h3>\n`;
    else if (t.startsWith("|")) html += `<p>${t}</p>\n`;
    else if (t.length > 0) html += `<p>${t}</p>\n`;
  }

  // CTA section at end
  html += `
<h2>Ready to Get Your CNC Parts Manufactured?</h2>
<p>At Unimake Works we manufacture precision CNC parts for clients across Saudi Arabia, UAE, USA, UK and more. ISO 9001:2015 certified, 60+ machines across our network, 6-hour quote response time from Hyderabad, India.</p>
<p>✅ <a href="https://www.unimakeworks.com/request-quote">Request Quote on Website</a><br/>
✅ Email us your drawings and quantity<br/>
✅ WhatsApp us for quick response</p>`;

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
    body: JSON.stringify({ image_request: { prompt: `${blog.thumbnail_prompt}, ${style}, 1200x630px`, aspect_ratio: "ASPECT_16_9", model: "V_2", magic_prompt_option: "AUTO" } })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`Ideogram error: ${JSON.stringify(data)}`);
  console.log("✅ Blog thumbnail generated");
  return data.data[0].url;
}

// ============================================================
// STEP 5 — Generate LinkedIn thumbnail
// ============================================================

async function generateLinkedInThumbnail(blog) {
  console.log("🖼️ Generating LinkedIn thumbnail...");
  const fetch = (await import("node-fetch")).default;
  const style = LINKEDIN_THUMBNAIL_STYLES[new Date().getDay() % 3];
  const response = await fetch("https://api.ideogram.ai/generate", {
    method: "POST",
    headers: { "Api-Key": IDEOGRAM_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ image_request: { prompt: `${blog.thumbnail_prompt}, ${style}, LinkedIn banner 1200x627px`, aspect_ratio: "ASPECT_16_9", model: "V_2", magic_prompt_option: "AUTO" } })
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

  const prompt = `You are Manish Bandi, Founder of Unimake Works, Hyderabad India.
Write a LinkedIn post for this blog article targeting international buyers.

Blog Title: ${blog.title}
Blog URL: ${blogUrl}
Meta Description: ${blog.meta_description}
Tags: ${blog.tags.join(", ")}

LINKEDIN POST RULES:
- Start with a powerful hook — a question or bold fact that grabs attention
- 3-4 short paragraphs with line break between each
- 3 bullet points with key insights
- Mention Unimake Works naturally — 60+ machines, ISO 9001, Hyderabad India
- End with CTA to read the blog
- 5-7 hashtags focused on CNC, manufacturing, India, sourcing
- Total: 150-200 words maximum
- Tone: Expert founder sharing genuine knowledge, not salesy

Return only the LinkedIn post text. Nothing else.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": CLAUDE_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 500, messages: [{ role: "user", content: prompt }] })
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
    body: JSON.stringify({
      title: blog.title, slug: blog.slug, content: blog.content,
      meta_title: blog.meta_title, meta_description: blog.meta_description,
      thumbnail_source_url: thumbnailUrl, tags: blog.tags,
      status: "published", author: "Manish Bandi",
      published_at: now, created_at: now
    })
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
  if (response.ok) { console.log("✅ LinkedIn post sent!"); }
  else { const text = await response.text(); console.log(`⚠️ Make.com (${response.status}): ${text}`); }
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
  console.log("\n🚀 CNC Blog Agent Starting — Unimake Works");
  console.log("=".repeat(50));
  console.log(`📅 Running at: ${new Date().toUTCString()}`);
  console.log(`📍 Target: International CNC buyers outside India`);

  try {
    validateSecrets();
    const { slugs, titles } = await getExistingSlugs();
    const topicsText = await researchTopics(titles);

    console.log("⏳ Waiting 3 minutes (rate limit safety)...");
    await sleep(180000);

    const blog = await writeBlog(topicsText, titles);
    const blogUrl = `https://www.unimakeworks.com/blog/${blog.slug}`;

    const thumbnailUrl        = await generateThumbnail(blog);
    const linkedInThumbnailUrl = await generateLinkedInThumbnail(blog);
    const linkedInCaption     = await writeLinkedInCaption(blog, blogUrl);

    await publishBlog(blog, thumbnailUrl);
    await postToLinkedIn(blog, linkedInCaption, linkedInThumbnailUrl, blogUrl);
    await triggerVercelRebuild();

    console.log("=".repeat(50));
    console.log("🎉 ALL DONE!");
    console.log(`📝 Title   : ${blog.title}`);
    console.log(`🔗 URL     : ${blogUrl}`);
    console.log(`💼 LinkedIn: Posted to Unimake Works page`);
    console.log(`🎯 Target  : International CNC buyers`);
    console.log("=".repeat(50));

  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    process.exit(1);
  }
}

main();
