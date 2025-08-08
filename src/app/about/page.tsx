export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">About DeepWork</h1>

      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-3">Overview</h2>
          <p className="text-gray-700">
            DeepWork is a demonstration application that showcases the power of
            combining OpenAI's Deep Research API with Hookdeck's webhook
            infrastructure. The application enables users to submit complex
            research questions to OpenAI's Deep Research service, which runs
            asynchronously in the background.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">OpenAI Deep Research</h2>
          <p className="text-gray-700">
            OpenAI's Deep Research API provides long-running research
            capabilities that can analyze complex questions and provide
            comprehensive answers. The service operates asynchronously, making
            it perfect for webhook-based architectures.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Hookdeck's Role</h2>
          <p className="text-gray-700">
            Hookdeck manages both the outbound API requests (via queue) and
            inbound webhook responses, providing complete visibility into the
            entire research workflow. This includes automatic retries, rate
            limiting, and comprehensive event tracking.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Vercel Deployment</h2>
          <p className="text-gray-700">
            DeepWork is designed to be deployed on Vercel, utilizing serverless
            functions for API routes and Vercel KV for data persistence. This
            ensures scalability and reliability without the overhead of managing
            infrastructure.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Key Features</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            <li>
              No setup required - Hookdeck connections created automatically on
              first use
            </li>
            <li>
              Complete visibility - See every API request and webhook in the
              events timeline
            </li>
            <li>
              Correlation - Track the full journey of each research request
            </li>
            <li>Progress tracking - Real-time updates via polling</li>
            <li>Download results - Export completed research</li>
            <li>Type safety - Full TypeScript implementation</li>
            <li>Production ready - Deployed on Vercel with KV storage</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
