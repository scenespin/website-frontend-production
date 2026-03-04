import Footer from '@/components/Footer';
import {
  llmModels,
  imageModels,
  videoModels,
} from '@/lib/modelCatalog';

function ModelTable({ title, subtitle, rows, showSurface = false, showNotes = false }) {
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
              <th className="text-left text-gray-300 py-2 pr-4">Model ID</th>
              <th className="text-left text-gray-300 py-2 pr-4">Provider</th>
              {showSurface && <th className="text-left text-gray-300 py-2 pr-4">Exposed In</th>}
              {showNotes && <th className="text-left text-gray-300 py-2 pr-4">Notes</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-[#1E1E1E]">
                <td className="py-2 pr-4 text-white">{row.name}</td>
                <td className="py-2 pr-4 text-gray-300 font-mono">{row.id}</td>
                <td className="py-2 pr-4 text-gray-300">{row.provider}</td>
                {showSurface && <td className="py-2 pr-4 text-gray-300">{row.surface || '-'}</td>}
                {showNotes && <td className="py-2 pr-4 text-gray-300">{row.notes || '-'}</td>}
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
    <main className="min-h-screen bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Model Catalog</h1>
          <p className="text-gray-400 mt-3 max-w-3xl">
            Models currently exposed in the Wryda UI: LLMs in the editor, image models in Scene Builder,
            and video models in the Video Gen dropdown.
          </p>
        </div>

        <div className="space-y-6">
          <ModelTable
            title="LLM Models"
            subtitle={`${llmModels.length} models in the editor (Story Advisor, Character, Location agents + modals)`}
            rows={llmModels}
            showSurface
          />

          <ModelTable
            title="Image Models"
            subtitle={`${imageModels.length} models exposed in Scene Builder / reference-shot selectors`}
            rows={imageModels}
            showSurface
          />

          <ModelTable
            title="Video Models"
            subtitle={`${videoModels.length} models in the Video Gen dropdown (playground)`}
            rows={videoModels}
            showNotes
          />
        </div>
      </div>
      <Footer />
    </main>
  );
}
