import Link from 'next/link';
import Image from 'next/image';
import Footer from '@/components/Footer';
import config from '@/config';
import logo from '@/app/icon.png';
import {
  llmModels,
  imageModels,
  videoModels,
} from '@/lib/modelCatalog';

function ModelTable({ title, subtitle, rows }) {
  return (
    <section className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-white">{title}</h2>
        <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2A2A2A]">
              <th className="text-left text-gray-300 py-2 pr-4">Name</th>
              <th className="text-left text-gray-300 py-2 pr-4">Provider</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-[#1E1E1E]">
                <td className="py-2 pr-4 text-white">{row.name}</td>
                <td className="py-2 pr-4 text-gray-300">{row.provider}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function ModelsPage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-[#0A0A0A] border-b border-[#3F3F46] sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src={logo}
                alt={`${config.appName} logo`}
                width={40}
                height={40}
                className="w-10 h-10"
                priority={true}
              />
              <span className="text-2xl font-extrabold text-white">
                {config.appName}<span className="text-[#DC143C]">.ai</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/examples" className="text-sm text-gray-300 hover:text-white transition-colors">
                Examples
              </Link>
              <Link href="/compare" className="text-sm text-gray-300 hover:text-white transition-colors">
                Compare
              </Link>
              <Link href="/models" className="text-sm text-white font-medium">
                Models
              </Link>
              <Link href="/pricing" className="text-sm text-gray-300 hover:text-white transition-colors">
                Pricing
              </Link>
              <Link href="/sign-in" className="text-sm text-gray-300 hover:text-white transition-colors">
                Login
              </Link>
            </nav>
            <Link href="/sign-in" className="md:hidden text-sm text-gray-300 hover:text-white transition-colors">
              Login
            </Link>
          </div>
        </div>
      </header>

      <main>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Model Catalog</h1>
          <p className="text-gray-400 mt-3 max-w-3xl">
            Full transparency. The AI models that power your screenplay editor, scene builder, and video workflows—writer-directed, with no hidden choices.
          </p>
        </div>

        <div className="space-y-6">
          <ModelTable
            title="LLM Models"
            subtitle={`${llmModels.length} models in the editor (Story Advisor, Character, Location agents + modals)`}
            rows={llmModels}
          />

          <ModelTable
            title="Image Models"
            subtitle={`${imageModels.length} models exposed in Scene Builder / reference-shot selectors`}
            rows={imageModels}
          />

          <ModelTable
            title="Video Models"
            subtitle={`${videoModels.length} models in the Video Gen dropdown (playground)`}
            rows={videoModels}
          />
        </div>
      </div>
      </main>
      <Footer />
    </div>
  );
}
