import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-gray-900">
            Casemate – Pakistan Legal Template Generator
          </h1>
          <p className="text-xl text-gray-700 leading-relaxed">
            Generate professional legal document templates for Pakistan using AI.
            This tool helps you create templates for various legal documents
            including rent agreements, employment contracts, legal notices, and more.
          </p>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-left rounded">
            <p className="text-sm text-gray-800">
              <strong>Important:</strong> This tool generates AI-based legal templates
              for Pakistan. It is <strong>not legal advice</strong> and must be reviewed
              by a qualified lawyer before use.
            </p>
          </div>
        </div>
        <Link
          href="/generate"
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
        >
          Generate a Legal Template
        </Link>
      </div>
    </main>
  )
}

