import config from "@/config";
import ButtonCheckout from "./ButtonCheckout";

// <Pricing/> displays the pricing plans
// Uses wrapper-safe language: Professional/Premium/Ultra quality tiers
// Technical aspect ratios: 16:9, 9:16, 1:1, 4:3, 21:9
// Everyone gets everything - pure credit economy

const Pricing = () => {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      credits: "100 signup + 10/month",
      description: "All features unlocked. Try everything.",
      features: [
        "✅ All quality tiers (Professional/Premium/Ultra)",
        "✅ All aspect ratios (16:9, 9:16, 1:1, 4:3, 21:9)",
        "✅ Upload your own footage",
        "✅ 50+ LUTs, 30+ Transitions",
        "✅ Screenplay Editor + Timeline (8 tracks)",
        "✅ Character Bank, Voice Cloning, 3D Export",
        "✅ Cloud Storage (Drive/Dropbox)",
        "✅ No watermarks, no vendor lock-in"
      ],
      cta: "Start Free",
      href: "/dashboard",
      popular: false
    },
    {
      name: "Pro",
      price: "$29",
      period: "/month",
      credits: "3,000 credits/month",
      description: "Same features. Just more credits.",
      features: [
        "✅ Everything in Free",
        "✅ ~60 Professional 1080p videos",
        "✅ ~40 Premium 4K videos",
        "✅ ~20 Ultra Native 4K videos",
        "💰 Save $1,980/year vs traditional stack",
        "✅ Cancel anytime"
      ],
      cta: "Get Pro",
      href: "/dashboard",
      popular: true
    },
    {
      name: "Ultra",
      price: "$149",
      period: "/month",
      credits: "20,000 credits/month",
      description: "Production volume. Same features.",
      features: [
        "✅ Everything in Free",
        "✅ ~400 Professional videos",
        "✅ ~266 Premium 4K videos",
        "✅ ~133 Ultra Native 4K videos",
        "✅ Perfect for studios & agencies",
        "✅ Cancel anytime"
      ],
      cta: "Get Ultra",
      href: "/dashboard",
      popular: false
    },
    {
      name: "Studio",
      price: "$399",
      period: "/month",
      credits: "75,000 credits/month",
      description: "Enterprise teams. Same features.",
      features: [
        "✅ Everything in Free",
        "✅ ~1,500 Professional videos",
        "✅ ~1,000 Premium 4K videos",
        "✅ ~500 Ultra Native 4K videos",
        "✅ Massive production capacity",
        "✅ Cancel anytime"
      ],
      cta: "Get Studio",
      href: "/dashboard",
      popular: false
    }
  ];

  return (
    <section className="bg-base-100 overflow-hidden" id="pricing">
      <div className="py-24 px-8 max-w-7xl mx-auto">
        <div className="flex flex-col text-center w-full mb-12">
          <p className="font-medium text-primary mb-4">Pricing</p>
          <h2 className="font-bold text-3xl lg:text-5xl tracking-tight mb-4">
            Everyone Gets Everything.
            <br />
            <span className="text-[#DC143C]">You Just Buy Credits.</span>
          </h2>
          <p className="text-lg opacity-80 max-w-2xl mx-auto">
            No paywalls. No feature tiers. No watermarks. The only difference is credits per month.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => (
            <div key={index} className="relative">
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                  <span className="badge badge-primary text-xs font-semibold">
                    ⭐ MOST POPULAR
                  </span>
                </div>
              )}

              {plan.popular && (
                <div className="absolute -inset-[1px] rounded-[9px] bg-primary z-10"></div>
              )}

              <div className={`relative flex flex-col h-full gap-4 z-10 bg-base-200 p-6 rounded-lg ${plan.popular ? 'border-2 border-primary' : ''}`}>
                <div>
                  <h3 className="text-2xl font-bold">{plan.name}</h3>
                  <p className="text-sm opacity-70 mt-1">{plan.description}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className="text-sm opacity-70">{plan.period}</span>
                </div>

                <div className="bg-primary/10 p-3 rounded-lg">
                  <p className="text-sm font-semibold">{plan.credits}</p>
                </div>

                <ul className="space-y-2 text-sm flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="shrink-0 mt-0.5">{feature}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={plan.href}
                  className={`btn ${plan.popular ? 'btn-primary' : 'btn-outline'} w-full`}
                >
                  {plan.cta}
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-base-200 p-8 rounded-lg">
          <h3 className="text-2xl font-bold mb-4 text-center">💡 How Credits Work</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="font-semibold mb-2">🎬 Video Quality Tiers</h4>
              <ul className="space-y-1 opacity-80">
                <li>• Professional 1080p: 50 credits</li>
                <li>• Premium 4K: 75 credits</li>
                <li>• Ultra Native 4K: 150 credits</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">📐 Aspect Ratios</h4>
              <ul className="space-y-1 opacity-80">
                <li>• 16:9 Landscape: Base price</li>
                <li>• 9:16 Vertical: Base price</li>
                <li>• 1:1 Square: Base price</li>
                <li>• 4:3 Classic: Base price</li>
                <li>• 21:9 Cinema: +15 credits</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">✨ What&apos;s FREE</h4>
              <ul className="space-y-1 opacity-80">
                <li>• Upload your own footage</li>
                <li>• 50+ LUTs, 30+ Transitions</li>
                <li>• Screenplay + Timeline editor</li>
                <li>• Character Bank, 3D Export</li>
                <li>• Voice Cloning, Cloud Storage</li>
              </ul>
            </div>
          </div>
          <p className="text-center mt-6 text-sm opacity-70">
            <strong>Example:</strong> Professional 1080p in 21:9 Cinema = 50 + 15 = 65 credits
          </p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
