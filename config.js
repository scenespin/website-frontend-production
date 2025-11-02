const config = {
  // REQUIRED
  appName: process.env.NEXT_PUBLIC_APP_NAME || "App",
  // REQUIRED: a short description of your app for SEO tags (can be overwritten)
  appDescription:
    process.env.NEXT_PUBLIC_APP_DESCRIPTION || "Modern web application built with Next.js",
  // REQUIRED (no https://, not trialing slash at the end, just the naked domain)
  domainName: process.env.NEXT_PUBLIC_DOMAIN || "example.com",
  crisp: {
    // Crisp website ID. IF YOU DON'T USE CRISP: just remove this => Then add a support email in this config file (resend.supportEmail) otherwise customer support won't work.
    id: "",
    // Hide Crisp by default, except on route "/". Crisp is toggled with <ButtonSupport/>. If you want to show Crisp on every routes, just remove this below
    onlyShowOnRoutes: ["/"],
  },
  stripe: {
    // Wryda.ai Pricing - Pure Credit Economy
    // Everyone gets everything. Only difference is credits per month.
    // TODO: Create these products in Stripe Dashboard, then replace price IDs
    plans: [
      {
        priceId: "price_free", // Free tier doesn't use Stripe
        name: "Free",
        description: "All features unlocked. Try everything.",
        price: 0,
        priceAnchor: null,
        features: [
          { name: "50 signup + 10 credits/month" },
          { name: "All quality tiers & aspect ratios" },
          { name: "Upload your own footage" },
          { name: "68 compositions, 30 transitions" },
        ],
        isFeatured: false,
        // Signup page specific
        signupHeadline: "Start Your Creative Journey",
        signupSubheadline: "Explore professional screenwriting tools — completely free",
        signupValueProp: "Perfect for writers getting started with professional screenplay formatting",
        targetAudience: "Students, hobbyists, and aspiring screenwriters",
      },
      {
        isFeatured: true,
        priceId:
          process.env.NODE_ENV === "development"
            ? "price_1SKx4VICG7b2tCpeJWQJnGER" // $29/mo
            : "price_pro_prod_TODO",
        name: "Pro",
        description: "Same features. Just more credits.",
        price: 29,
        priceAnchor: null,
        features: [
          { name: "3,000 credits/month" },
          { name: "Everything in Free" },
          { name: "All quality tiers unlocked" },
          { name: "Save $1,776/year vs traditional" },
        ],
        // Signup page specific
        signupHeadline: "Power Your Content Creation",
        signupSubheadline: "Professional tools for creators who demand more",
        signupValueProp: "3,000 monthly credits to fuel your creative workflow",
        targetAudience: "YouTube creators, content marketers, and freelancers",
      },
      {
        priceId:
          process.env.NODE_ENV === "development"
            ? "price_1SNesiICG7b2tCpeTKDjOfHU" // $149/mo
            : "price_ultra_prod_TODO",
        name: "Ultra",
        description: "Production volume. Same features.",
        price: 149,
        priceAnchor: null,
        features: [
          { name: "20,000 credits/month" },
          { name: "Everything in Free" },
          { name: "All quality tiers unlocked" },
          { name: "Perfect for studios & agencies" },
        ],
        isFeatured: false,
        // Signup page specific
        signupHeadline: "Scale Your Production",
        signupSubheadline: "Enterprise-grade tools for teams and agencies",
        signupValueProp: "20,000 monthly credits for unlimited creative power",
        targetAudience: "Production companies, agencies, and high-volume creators",
      },
      {
        priceId:
          process.env.NODE_ENV === "development"
            ? "price_1SN5tWICG7b2tCpecu9dNwif" // $399/mo
            : "price_studio_prod_TODO",
        name: "Studio",
        description: "Enterprise teams. Same features.",
        price: 399,
        priceAnchor: null,
        features: [
          { name: "75,000 credits/month" },
          { name: "Everything in Free" },
          { name: "All quality tiers unlocked" },
          { name: "Massive production capacity" },
        ],
        isFeatured: false,
        // Signup page specific
        signupHeadline: "Enterprise-Level Power",
        signupSubheadline: "Built for studios and large production teams",
        signupValueProp: "75,000 monthly credits for enterprise-grade reliability",
        targetAudience: "Large studios, streaming platforms, and enterprise teams",
      },
    ],
  },
  aws: {
    // If you use AWS S3/Cloudfront, put values in here
    bucket: "bucket-name",
    bucketUrl: `https://bucket-name.s3.amazonaws.com/`,
    cdn: "https://cdn-id.cloudfront.net/",
  },
  resend: {
    // REQUIRED — Email 'From' field to be used when sending magic login links
    fromNoReply: `${process.env.NEXT_PUBLIC_APP_NAME || "App"} <noreply@${process.env.NEXT_PUBLIC_DOMAIN || "example.com"}>`,
    // REQUIRED — Email 'From' field to be used when sending other emails, like abandoned carts, updates etc..
    fromAdmin: `${process.env.NEXT_PUBLIC_APP_NAME || "App"} Support <support@${process.env.NEXT_PUBLIC_DOMAIN || "example.com"}>`,
    // Email shown to customer if need support. Leave empty if not needed => if empty, set up Crisp above, otherwise you won't be able to offer customer support."
    supportEmail: `support@${process.env.NEXT_PUBLIC_DOMAIN || "example.com"}`,
  },
  colors: {
    // REQUIRED — The DaisyUI theme to use (added to the main layout.js). Leave blank for default (light & dark mode). If you any other theme than light/dark, you need to add it in config.tailwind.js in daisyui.themes.
    theme: "dark", // Changed to dark for cinema theme
    // REQUIRED — This color will be reflected on the whole app outside of the document (loading bar, Chrome tabs, etc..). By default it takes the primary color from your DaisyUI theme (make sure to update your the theme name after "data-theme=")
    // OR you can just do this to use a custom color: main: "#f37055". HEX only.
    main: "#DC143C", // Cinema red
  },
  auth: {
    // REQUIRED — the path to log in users. It's use to protect private routes (like /dashboard). It's used in apiClient (/libs/api.js) upon 401 errors from our API
    loginUrl: "/api/auth/signin",
    callbackUrl: "/dashboard",
  },
};

export default config;
