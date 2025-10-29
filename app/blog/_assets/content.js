import Image from "next/image";
import wrydaImg from "@/app/blog/_assets/images/authors/wryda.png";
import introducingSupabaseImg from "@/public/blog/introducing-supabase/header.png";

// ==================================================================================================================================================================
// BLOG CATEGORIES 🏷️
// ==================================================================================================================================================================

// These slugs are used to generate pages in the /blog/category/[categoryI].js. It's a way to group articles by category.
const categorySlugs = {
  feature: "feature",
  tutorial: "tutorial",
  announcement: "announcement",
};

// All the blog categories data display in the /blog/category/[categoryI].js pages.
export const categories = [
  {
    slug: categorySlugs.announcement,
    title: "Announcements",
    titleShort: "News",
    description:
      "Major announcements and product updates from Wryda.ai. Stay up-to-date with what's new.",
    descriptionShort: "Latest news and announcements from Wryda.ai.",
  },
  {
    // The slug to use in the URL, from the categorySlugs object above.
    slug: categorySlugs.feature,
    // The title to display the category title (h1), the category badge, the category filter, and more. Less than 60 characters.
    title: "New Features",
    // A short version of the title above, display in small components like badges. 1 or 2 words
    titleShort: "Features",
    // The description of the category to display in the category page. Up to 160 characters.
    description:
      "Here are the latest features we've added to Wryda.ai. We're constantly improving our product to help you create better.",
    // A short version of the description above, only displayed in the <Header /> on mobile. Up to 60 characters.
    descriptionShort: "Latest features added to Wryda.ai.",
  },
  {
    slug: categorySlugs.tutorial,
    title: "How Tos & Tutorials",
    titleShort: "Tutorials",
    description:
      "Learn how to use Wryda.ai with these step-by-step tutorials. Create professional videos faster.",
    descriptionShort:
      "Learn how to use Wryda.ai with these step-by-step tutorials.",
  },
];

// ==================================================================================================================================================================
// BLOG AUTHORS 📝
// ==================================================================================================================================================================

// Social icons used in the author's bio.
const socialIcons = {
  twitter: {
    name: "Twitter",
    svg: (
      <svg
        version="1.1"
        id="svg5"
        x="0px"
        y="0px"
        viewBox="0 0 1668.56 1221.19"
        className="w-9 h-9"
        // Using a dark theme? ->  className="w-9 h-9 fill-white"
      >
        <g id="layer1" transform="translate(52.390088,-25.058597)">
          <path
            id="path1009"
            d="M283.94,167.31l386.39,516.64L281.5,1104h87.51l340.42-367.76L984.48,1104h297.8L874.15,558.3l361.92-390.99   h-87.51l-313.51,338.7l-253.31-338.7H283.94z M412.63,231.77h136.81l604.13,807.76h-136.81L412.63,231.77z"
          />
        </g>
      </svg>
    ),
  },
  linkedin: {
    name: "LinkedIn",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6"
        // Using a dark theme? ->  className="w-6 h-6 fill-white"
        viewBox="0 0 24 24"
      >
        <path d="M4.98 3.5c0 1.381-1.11 2.5-2.48 2.5s-2.48-1.119-2.48-2.5c0-1.38 1.11-2.5 2.48-2.5s2.48 1.12 2.48 2.5zm.02 4.5h-5v16h5v-16zm7.982 0h-4.968v16h4.969v-8.399c0-4.67 6.029-5.052 6.029 0v8.399h4.988v-10.131c0-7.88-8.922-7.593-11.018-3.714v-2.155z" />
      </svg>
    ),
  },
  github: {
    name: "GitHub",
    svg: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6"
        // Using a dark theme? ->  className="w-6 h-6 fill-white"
        viewBox="0 0 24 24"
      >
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    ),
  },
};

// These slugs are used to generate pages in the /blog/author/[authorId].js. It's a way to show all articles from an author.
const authorSlugs = {
  wryda: "wryda",
};

// All the blog authors data display in the /blog/author/[authorId].js pages.
export const authors = [
  {
    // The slug to use in the URL, from the authorSlugs object above.
    slug: authorSlugs.wryda,
    // The name to display in the author's bio. Up to 60 characters.
    name: "Wryda Team",
    // The job to display in the author's bio. Up to 60 characters.
    job: "Founders of Wryda.ai",
    // The description of the author to display in the author's bio. Up to 160 characters.
    description:
      "Building the future of AI-powered video production. Professional tools for screenwriters, filmmakers, and creators.",
    // The avatar of the author to display in the author's bio and avatar badge. It's better to use a local image, but you can also use an external image (https://...)
    avatar: wrydaImg,
    // A list of social links to display in the author's bio.
    socials: [
      {
        name: socialIcons.twitter.name,
        icon: socialIcons.twitter.svg,
        url: "https://twitter.com/wrydaai",
      },
    ],
  },
];

// ==================================================================================================================================================================
// BLOG ARTICLES 📚
// ==================================================================================================================================================================

// These styles are used in the content of the articles. When you update them, all articles will be updated.
const styles = {
  h2: "text-2xl lg:text-4xl font-bold tracking-tight mb-4 text-base-content",
  h3: "text-xl lg:text-2xl font-bold tracking-tight mb-2 text-base-content",
  p: "text-base-content/90 leading-relaxed",
  ul: "list-inside list-disc text-base-content/90 leading-relaxed",
  li: "list-item",
  // Altnernatively, you can use the library react-syntax-highlighter to display code snippets.
  code: "text-sm font-mono bg-neutral text-neutral-content p-6 rounded-box my-4 overflow-x-scroll select-all",
  codeInline:
    "text-sm font-mono bg-base-300 px-1 py-0.5 rounded-box select-all",
};

// All the blog articles data display in the /blog/[articleId].js pages.
export const articles = [
  {
    // The unique slug to use in the URL. It's also used to generate the canonical URL.
    slug: "wryda-ai-launch",
    // The title to display in the article page (h1). Less than 60 characters. It's also used to generate the meta title.
    title: "Wryda.ai Launch: Professional Film at 1% Cost",
    // The description of the article to display in the article page. Up to 160 characters. It's also used to generate the meta description.
    description:
      "Introducing Wryda.ai - the all-in-one platform combining screenplay writing, AI video generation, and Hollywood-grade editing. Everything unlocked. Pure credit economy.",
    // An array of categories of the article. It's used to generate the category badges, the category filter, and more.
    categories: [
      categories.find((category) => category.slug === categorySlugs.announcement),
    ],
    // The author of the article. It's used to generate a link to the author's bio page.
    author: authors.find((author) => author.slug === authorSlugs.wryda),
    // The date of the article. It's used to generate the meta date.
    publishedAt: "2025-10-29",
    image: {
      // The image to display in <CardArticle /> components.
      src: introducingSupabaseImg, // TODO: Replace with Wryda launch image
      // The relative URL of the same image to use in the Open Graph meta tags & the Schema Markup JSON-LD.
      urlRelative: "/blog/wryda-ai-launch/header.jpg",
      alt: "Wryda.ai Launch - Professional Film at 1% Cost",
    },
    // The actual content of the article that will be shown under the <h1> title in the article page.
    content: (
      <>
        <Image
          src={introducingSupabaseImg}
          alt="Wryda.ai platform overview"
          width={700}
          height={500}
          priority={true}
          className="rounded-box"
          placeholder="blur"
        />
        
        <section>
          <h2 className={styles.h2}>Revolutionary Pricing Model</h2>
          <p className={styles.p}>
            Today, we're launching something different. Wryda.ai breaks the traditional "feature tier" model.
            <strong> Everyone gets everything. You just buy credits.</strong>
          </p>
          <p className={styles.p}>
            No paywalls. No feature restrictions. No watermarks. No vendor lock-in. Pure credit economy.
          </p>
        </section>

        <section>
          <h2 className={styles.h2}>What You Get (Everyone Gets This)</h2>
          <ul className={styles.ul}>
            <li className={styles.li}><strong>Professional Screenplay Editor</strong> - Full Fountain format support</li>
            <li className={styles.li}><strong>8-Track Timeline Editor</strong> - Video + audio editing</li>
            <li className={styles.li}><strong>65 Professional Compositions</strong> - Split screens, PIP, grids, audio mixing</li>
            <li className={styles.li}><strong>30 Hollywood Transitions</strong> - Whip pans, glitch effects, vintage burns</li>
            <li className={styles.li}><strong>All Quality Tiers</strong> - Professional 1080p, Premium 4K, Ultra Native 4K</li>
            <li className={styles.li}><strong>All Aspect Ratios</strong> - 16:9, 9:16, 1:1, 4:3, 21:9</li>
            <li className={styles.li}><strong>Upload Your Own Footage</strong> - Unlimited, completely FREE</li>
            <li className={styles.li}><strong>Character Bank</strong> - Consistent characters across scenes</li>
            <li className={styles.li}><strong>Voice Cloning</strong> - FREE (bring your 11 Labs voice)</li>
            <li className={styles.li}><strong>3D Model Export</strong> - GLB, OBJ, USDZ formats</li>
            <li className={styles.li}><strong>Cloud Storage</strong> - Export to Google Drive or Dropbox</li>
          </ul>
        </section>

        <section>
          <h2 className={styles.h2}>How Credits Work</h2>
          <p className={styles.p}>
            Credits are only used when generating AI video or images. Everything else is FREE.
          </p>
          
          <h3 className={styles.h3}>Pricing Plans</h3>
          <ul className={styles.ul}>
            <li className={styles.li}><strong>Free:</strong> 100 signup + 10/month = ~2 professional videos</li>
            <li className={styles.li}><strong>Pro ($29/mo):</strong> 3,000 credits = ~60 professional videos</li>
            <li className={styles.li}><strong>Ultra ($149/mo):</strong> 20,000 credits = ~400 professional videos</li>
            <li className={styles.li}><strong>Studio ($399/mo):</strong> 75,000 credits = ~1,500 professional videos</li>
          </ul>
          
          <h3 className={styles.h3}>Credit Costs by Quality</h3>
          <ul className={styles.ul}>
            <li className={styles.li}>Professional 1080p: 50 credits per 5s</li>
            <li className={styles.li}>Premium 4K: 75 credits per 5s</li>
            <li className={styles.li}>Ultra Native 4K: 150 credits per 5s</li>
          </ul>
          
          <p className={styles.p}>
            All aspect ratios are base price except 21:9 Cinema (+15 credits).
          </p>
        </section>

        <section>
          <h2 className={styles.h2}>Mix Your Footage with AI</h2>
          <p className={styles.p}>
            This is what makes Wryda.ai unique. We're not just another AI video generator.
          </p>
          <p className={styles.p}>
            <strong>Upload your camera footage</strong> (100% FREE, unlimited), then enhance it with:
          </p>
          <ul className={styles.ul}>
            <li className={styles.li}>AI-generated VFX shots</li>
            <li className={styles.li}>AI-generated B-roll</li>
            <li className={styles.li}>AI-generated locations and backgrounds</li>
            <li className={styles.li}>65 professional compositions</li>
            <li className={styles.li}>30 Hollywood transitions</li>
          </ul>
          <p className={styles.p}>
            <strong>Your Camera Footage + AI Shots + Hollywood Tools = Professional Film at 1% Cost</strong>
          </p>
        </section>

        <section>
          <h2 className={styles.h2}>Save $1,583/Year vs Traditional Stack</h2>
          <p className={styles.p}>
            Traditional video production stack costs $1,931/year:
          </p>
          <ul className={styles.ul}>
            <li className={styles.li}>Final Draft (Screenwriting): $250/yr</li>
            <li className={styles.li}>Premiere Pro (Video Editing): $263/yr</li>
            <li className={styles.li}>Midjourney (AI Images): $360/yr</li>
            <li className={styles.li}>After Effects (VFX): $263/yr</li>
            <li className={styles.li}>DaVinci Resolve Studio: $295</li>
            <li className={styles.li}>Stock Footage & Music: $500/yr</li>
          </ul>
          <p className={styles.p}>
            <strong>Wryda.ai Pro: $348/year</strong> (save $1,583/year)
          </p>
          <p className={styles.p}>
            Plus, traditional tools can't generate AI video. Wryda.ai replaces 6+ tools with one platform.
          </p>
        </section>

        <section>
          <h2 className={styles.h2}>Revolutionary Features</h2>
          <h3 className={styles.h3}>1. Seamless Timeline ↔ Composition</h3>
          <p className={styles.p}>
            Round-trip editing without data loss. Edit in composition, changes sync to timeline automatically.
            No other platform has this.
          </p>
          
          <h3 className={styles.h3}>2. Screenplay-Driven Builder</h3>
          <p className={styles.p}>
            Generate complete scenes directly from script. Intelligent scene analysis means no wasted credits.
          </p>
          
          <h3 className={styles.h3}>3. Character Consistency</h3>
          <p className={styles.p}>
            Upload 1-3 character references, get consistent characters across all your scenes.
            Character Bank stores all your characters for reuse.
          </p>
          
          <h3 className={styles.h3}>4. 95% Time Savings</h3>
          <p className={styles.p}>
            Intelligent automation eliminates repetitive tasks entirely. Professional workflows built-in.
          </p>
        </section>

        <section>
          <h2 className={styles.h2}>Who Is Wryda.ai For?</h2>
          <ul className={styles.ul}>
            <li className={styles.li}><strong>Screenwriters</strong> - Visualize your scripts as you write</li>
            <li className={styles.li}><strong>Filmmakers</strong> - Pre-visualize scenes before shooting, create pitch decks</li>
            <li className={styles.li}><strong>Content Creators</strong> - High-volume social media content for YouTube, TikTok, Instagram</li>
            <li className={styles.li}><strong>Marketing Teams</strong> - Generate video ads at scale</li>
            <li className={styles.li}><strong>Agencies</strong> - Produce client content efficiently with team collaboration</li>
          </ul>
        </section>

        <section>
          <h2 className={styles.h2}>Start Creating Today</h2>
          <p className={styles.p}>
            Sign up for free and get 100 credits to start. All features unlocked from day one.
            No credit card required.
          </p>
          <p className={styles.p}>
            <a href="/dashboard" className="link link-primary text-lg font-semibold">
              Start Free →
            </a>
          </p>
        </section>

        <section>
          <h2 className={styles.h2}>Early Access</h2>
          <p className={styles.p}>
            We're in early access and building with our community. Your feedback shapes the product.
          </p>
          <p className={styles.p}>
            Questions? Email us at{" "}
            <a href="mailto:hello@wryda.ai" className="link link-primary">
              hello@wryda.ai
            </a>
          </p>
        </section>

        <section>
          <p className={styles.p}>
            <strong>Founded 2025 • Building with creators</strong>
          </p>
        </section>
      </>
    ),
  },
];
