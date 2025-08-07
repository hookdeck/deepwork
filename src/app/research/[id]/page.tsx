export default async function ResearchDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Research Detail</h1>
      
      {/* Overview Section */}
      <section className="bg-muted rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-3">Research Overview</h2>
        <div className="space-y-2">
          <p className="text-muted">Research ID: {id}</p>
          <p className="text-muted">Question: Loading...</p>
          <p className="text-muted">Status: Pending</p>
          <div className="mt-4">
            <div className="bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '0%' }}></div>
            </div>
            <p className="text-sm text-muted mt-1">Progress: 0%</p>
          </div>
        </div>
      </section>
      
      {/* Events Timeline */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Hookdeck Events Timeline</h2>
        <div className="border-l-2 border-muted pl-4">
          <p className="text-muted">No events yet. Events will appear here as the research progresses.</p>
        </div>
      </section>
      
      {/* Download Section */}
      <section>
        <button
          className="bg-gray-400 dark:bg-gray-500 text-white px-6 py-2 rounded-lg cursor-not-allowed"
          disabled
        >
          Download Research Results (Available when complete)
        </button>
      </section>
    </div>
  );
}