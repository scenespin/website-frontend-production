import Link from "next/link";
import { getSEOTags } from "@/libs/seo";
import config from "@/config";
import { getWorkflowById, getAllWorkflows } from "@/lib/workflowData";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const workflows = getAllWorkflows();
  return workflows.map((workflow) => ({
    id: workflow.id,
  }));
}

export async function generateMetadata({ params }) {
  const workflow = getWorkflowById(params.id);
  
  if (!workflow) {
    return {
      title: `Workflow Not Found | ${config.appName}`,
    };
  }

  return getSEOTags({
    title: `${workflow.name} Workflow | ${config.appName}`,
    description: workflow.description,
    canonicalUrlRelative: `/help/workflows/${workflow.id}`,
  });
}

export default function WorkflowDetailPage({ params }) {
  const workflow = getWorkflowById(params.id);

  if (!workflow) {
    notFound();
  }

  const categoryColors = {
    'photorealistic': 'from-blue-500/10 to-blue-600/10 border-blue-500/30 text-blue-500',
    'animated': 'from-pink-500/10 to-pink-600/10 border-pink-500/30 text-pink-500',
    'budget': 'from-yellow-500/10 to-yellow-600/10 border-yellow-500/30 text-yellow-500',
    'hybrid': 'from-purple-500/10 to-purple-600/10 border-purple-500/30 text-purple-500',
    'fantasy': 'from-indigo-500/10 to-indigo-600/10 border-indigo-500/30 text-indigo-500',
    'animals': 'from-green-500/10 to-green-600/10 border-green-500/30 text-green-500',
    'production': 'from-orange-500/10 to-orange-600/10 border-orange-500/30 text-orange-500',
    'performance-capture': 'from-red-500/10 to-red-600/10 border-red-500/30 text-red-500',
    'post-production': 'from-pink-500/10 to-red-600/10 border-pink-500/30 text-pink-500',
    'video-enhancement': 'from-cyan-500/10 to-cyan-600/10 border-cyan-500/30 text-cyan-500',
  };

  const colorClass = categoryColors[workflow.category] || 'from-gray-500/10 to-gray-600/10 border-gray-500/30 text-gray-500';
  const [gradientClass, borderClass, textClass] = colorClass.split(' ');

  return (
    <>
      <header className="p-4 flex justify-between items-center max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-extrabold">
            {config.appName}<span className="text-[#DC143C]">.ai</span>
          </span>
        </Link>
        <div className="flex gap-2">
          <Link href="/help/workflows" className="btn btn-ghost btn-sm">← All Workflows</Link>
          <Link href="/help" className="btn btn-ghost btn-sm">Help Center</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-16">
        {/* Breadcrumb */}
        <div className="text-sm breadcrumbs mb-6">
          <ul>
            <li><Link href="/help">Help Center</Link></li>
            <li><Link href="/help/workflows">Workflows</Link></li>
            <li className="font-semibold">{workflow.name}</li>
          </ul>
        </div>

        {/* Hero Section */}
        <div className={`card bg-gradient-to-br ${gradientClass} border-2 ${borderClass} mb-8`}>
          <div className="card-body">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1">
                <h1 className="text-4xl font-extrabold mb-2">{workflow.name}</h1>
                <p className="text-lg opacity-90 mb-4">{workflow.description}</p>
                
                {/* Quick Stats */}
                <div className="flex gap-4 flex-wrap">
                  <div className="badge badge-lg gap-2">
                    <span>⏱️</span>
                    <span>{workflow.time.min}-{workflow.time.max} min</span>
                  </div>
                  <div className="badge badge-lg gap-2">
                    <span>💳</span>
                    <span>{workflow.cost.min}-{workflow.cost.max} credits</span>
                  </div>
                  <div className="badge badge-lg gap-2">
                    <span>⭐</span>
                    <span>Quality: {workflow.quality}/5</span>
                  </div>
                  {workflow.featured && (
                    <div className="badge badge-accent badge-lg">Featured</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <article className="prose prose-lg max-w-none">
          {/* Best For Section */}
          <h2>🎯 Perfect For</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-6">
            {workflow.bestFor.map((use, index) => (
              <div key={index} className="card bg-base-200">
                <div className="card-body p-4">
                  <div className="flex items-center gap-2">
                    <span className="text-green-500">✓</span>
                    <p className="text-sm font-medium">{use}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Examples Section */}
          <h2>💡 Real-World Examples</h2>
          <div className="space-y-4 not-prose my-6">
            {workflow.examples.map((example, index) => (
              <div key={index} className="card bg-base-200">
                <div className="card-body p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{index + 1}.</span>
                    <p className="text-sm flex-1">{example}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* How It Works */}
          <h2>⚙️ How It Works</h2>
          <div className="steps steps-vertical my-8 not-prose">
            {workflow.steps.map((step, index) => (
              <div key={index} className={`step ${index < workflow.steps.length ? 'step-primary' : ''}`}>
                <div className="text-left w-full">
                  <div className="font-bold">Step {step.step}: {step.action}</div>
                  <div className="text-sm opacity-70 mt-1">
                    <span>~{step.estimatedTime}s</span>
                    {step.optional && <span className="ml-2 badge badge-sm badge-ghost">Optional</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Requirements (if any) */}
          {workflow.requirements && (
            <>
              <h2>📋 Requirements</h2>
              <div className="alert alert-info my-6 not-prose">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <div>
                  <ul className="text-sm space-y-1">
                    {Object.entries(workflow.requirements).map(([key, value]) => (
                      <li key={key}><strong>{key.replace(/([A-Z])/g, ' $1').trim()}:</strong> {value}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}

          {/* Marketing Highlights (if any) */}
          {workflow.marketingHighlights && (
            <>
              <h2>🔥 Why This Workflow Is Special</h2>
              <div className="grid grid-cols-1 gap-3 not-prose my-6">
                {workflow.marketingHighlights.map((highlight, index) => (
                  <div key={index} className="card bg-gradient-to-r from-cinema-red/10 to-transparent border-l-4 border-cinema-red">
                    <div className="card-body p-4">
                      <p className="text-sm">{highlight}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Outputs */}
          {workflow.outputs && (
            <>
              <h2>📦 What You Get</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-6">
                {Object.entries(workflow.outputs).map(([key, value]) => (
                  <div key={key} className="card bg-base-200">
                    <div className="card-body p-4">
                      <h4 className="font-bold text-sm">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                      <p className="text-xs opacity-70">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Cost Breakdown */}
          <h2>💰 Cost & Time</h2>
          <div className="overflow-x-auto my-6">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Credits</strong></td>
                  <td>{workflow.cost.min === workflow.cost.max ? workflow.cost.min : `${workflow.cost.min}-${workflow.cost.max}`} credits</td>
                </tr>
                <tr>
                  <td><strong>USD Cost</strong></td>
                  <td>${(workflow.cost.min / 100).toFixed(2)} - ${(workflow.cost.max / 100).toFixed(2)}</td>
                </tr>
                <tr>
                  <td><strong>Processing Time</strong></td>
                  <td>{workflow.time.min}-{workflow.time.max} minutes</td>
                </tr>
                <tr>
                  <td><strong>Quality Rating</strong></td>
                  <td>{'⭐'.repeat(workflow.quality)} ({workflow.quality}/5)</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pro Tips */}
          <h2>💎 Pro Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose my-6">
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="card-title text-base">When to Use</h4>
                <p className="text-sm">This workflow is ideal when you need {workflow.bestFor[0].toLowerCase()}. Consider it for projects requiring {workflow.quality >= 4 ? 'high' : 'moderate'} quality output.</p>
              </div>
            </div>
            <div className="card bg-base-200">
              <div className="card-body">
                <h4 className="card-title text-base">Cost Optimization</h4>
                <p className="text-sm">{workflow.cost.min < 50 ? 'This is a budget-friendly workflow. Perfect for testing and iteration.' : 'This is a premium workflow. Use for final production when quality matters most.'}</p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="card bg-gradient-to-br from-cinema-red/20 to-cinema-blue/20 border-2 border-cinema-red/50 my-12 not-prose">
            <div className="card-body text-center">
              <h3 className="text-2xl font-bold mb-4">Ready to Try {workflow.name}?</h3>
              <p className="mb-6">Sign up and start creating professional content in minutes!</p>
              <div className="flex gap-4 justify-center flex-wrap">
                <Link href="/sign-up" className="btn btn-primary btn-lg">
                  Get Started Free
                </Link>
                <Link href="/production" className="btn btn-outline btn-lg">
                  See All Workflows
                </Link>
              </div>
            </div>
          </div>

          {/* Related Workflows */}
          <h2>🔗 Related Workflows</h2>
          <p>Explore similar workflows in the <strong>{workflow.category.replace(/-/g, ' ')}</strong> category:</p>
          <div className="flex gap-2 flex-wrap my-4 not-prose">
            <Link href="/help/workflows" className="btn btn-outline btn-sm">
              View All {workflow.category.replace(/-/g, ' ')} Workflows
            </Link>
            {workflow.featured && (
              <Link href="/help/workflows#featured" className="btn btn-outline btn-sm">
                View All Featured Workflows
              </Link>
            )}
          </div>
        </article>
      </main>
    </>
  );
}

