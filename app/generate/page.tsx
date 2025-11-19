'use client'

import { useState } from 'react'
import Link from 'next/link'

type DocumentType = 
  | 'Rent Agreement'
  | 'Employment Contract'
  | 'Legal Notice (Pre-litigation)'
  | 'Non-Disclosure Agreement (NDA)'
  | 'Partnership Agreement'

interface Party {
  name: string
  role: string
  identifier: string
  address: string
  contact: string
}

interface FormData {
  documentType: DocumentType | ''
  jurisdiction: string
  parties: Party[]
  keyTerms: string
  extraNotes: string
}

export default function GeneratePage() {
  const [formData, setFormData] = useState<FormData>({
    documentType: '',
    jurisdiction: '',
    parties: [
      { name: '', role: '', identifier: '', address: '', contact: '' },
      { name: '', role: '', identifier: '', address: '', contact: '' },
    ],
    keyTerms: '',
    extraNotes: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handlePartyChange = (
    index: number,
    field: keyof Party,
    value: string
  ) => {
    setFormData((prev) => {
      const newParties = [...prev.parties]
      newParties[index] = { ...newParties[index], [field]: value }
      return { ...prev, parties: newParties }
    })
    setError(null)
  }

  const addParty = () => {
    setFormData((prev) => ({
      ...prev,
      parties: [
        ...prev.parties,
        { name: '', role: '', identifier: '', address: '', contact: '' },
      ],
    }))
  }

  const removeParty = (index: number) => {
    if (formData.parties.length > 1) {
      setFormData((prev) => ({
        ...prev,
        parties: prev.parties.filter((_, i) => i !== index),
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    // Validation
    if (!formData.documentType || !formData.jurisdiction || !formData.keyTerms) {
      setError('Please fill in all required fields.')
      setIsLoading(false)
      return
    }

    if (formData.parties.length === 0) {
      setError('At least one party is required.')
      setIsLoading(false)
      return
    }

    // Validate each party has required fields
    for (let i = 0; i < formData.parties.length; i++) {
      const party = formData.parties[i]
      if (!party.name || !party.role) {
        setError(`Party ${i + 1} is missing required fields (name and role).`)
        setIsLoading(false)
        return
      }
    }

    // Prepare request body with only non-empty optional fields
    const requestBody = {
      documentType: formData.documentType,
      jurisdiction: formData.jurisdiction,
      parties: formData.parties.map((party) => ({
        name: party.name,
        role: party.role,
        ...(party.identifier && { identifier: party.identifier }),
        ...(party.address && { address: party.address }),
        ...(party.contact && { contact: party.contact }),
      })),
      keyTerms: formData.keyTerms,
      ...(formData.extraNotes && { extraNotes: formData.extraNotes }),
    }

    try {
      const response = await fetch('/api/generate-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to generate template')
      }

      // Handle PDF download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'legal-template.pdf'
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while generating the document. Please try again.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Generate Legal Template
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="documentType"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Document Type <span className="text-red-500">*</span>
              </label>
              <select
                id="documentType"
                name="documentType"
                value={formData.documentType}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select a document type</option>
                <option value="Rent Agreement">Rent Agreement</option>
                <option value="Employment Contract">Employment Contract</option>
                <option value="Legal Notice (Pre-litigation)">Legal Notice (Pre-litigation)</option>
                <option value="Non-Disclosure Agreement (NDA)">Non-Disclosure Agreement (NDA)</option>
                <option value="Partnership Agreement">Partnership Agreement</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="jurisdiction"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Jurisdiction / City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="jurisdiction"
                name="jurisdiction"
                value={formData.jurisdiction}
                onChange={handleChange}
                placeholder="e.g., Karachi, Sindh, Pakistan"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Parties <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={addParty}
                  className="text-sm bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-medium py-1 px-3 rounded transition-colors"
                >
                  + Add Party
                </button>
              </div>

              <div className="space-y-6">
                {formData.parties.map((party, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-gray-700">
                        Party {index + 1}
                      </h3>
                      {formData.parties.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeParty(index)}
                          className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor={`party-${index}-name`}
                          className="block text-xs font-medium text-gray-600 mb-1"
                        >
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id={`party-${index}-name`}
                          value={party.name}
                          onChange={(e) =>
                            handlePartyChange(index, 'name', e.target.value)
                          }
                          placeholder="Full name"
                          required
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`party-${index}-role`}
                          className="block text-xs font-medium text-gray-600 mb-1"
                        >
                          Role <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id={`party-${index}-role`}
                          value={party.role}
                          onChange={(e) =>
                            handlePartyChange(index, 'role', e.target.value)
                          }
                          placeholder="e.g., Landlord, Tenant, Employer, Employee"
                          required
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`party-${index}-identifier`}
                          className="block text-xs font-medium text-gray-600 mb-1"
                        >
                          Identifier (CNIC/NTN)
                        </label>
                        <input
                          type="text"
                          id={`party-${index}-identifier`}
                          value={party.identifier}
                          onChange={(e) =>
                            handlePartyChange(index, 'identifier', e.target.value)
                          }
                          placeholder="e.g., 12345-1234567-1"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`party-${index}-contact`}
                          className="block text-xs font-medium text-gray-600 mb-1"
                        >
                          Contact
                        </label>
                        <input
                          type="text"
                          id={`party-${index}-contact`}
                          value={party.contact}
                          onChange={(e) =>
                            handlePartyChange(index, 'contact', e.target.value)
                          }
                          placeholder="Phone or email"
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label
                        htmlFor={`party-${index}-address`}
                        className="block text-xs font-medium text-gray-600 mb-1"
                      >
                        Address
                      </label>
                      <textarea
                        id={`party-${index}-address`}
                        value={party.address}
                        onChange={(e) =>
                          handlePartyChange(index, 'address', e.target.value)
                        }
                        rows={2}
                        placeholder="Full address"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="keyTerms"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Key Terms / Details <span className="text-red-500">*</span>
              </label>
              <textarea
                id="keyTerms"
                name="keyTerms"
                value={formData.keyTerms}
                onChange={handleChange}
                rows={4}
                placeholder="e.g., rent amount, duration, salary, notice period, etc."
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="extraNotes"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Additional Clauses / Notes (optional)
              </label>
              <textarea
                id="extraNotes"
                name="extraNotes"
                value={formData.extraNotes}
                onChange={handleChange}
                rows={3}
                placeholder="Any additional information or specific clauses..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            >
              {isLoading ? 'Generating template...' : 'Generate Template'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-600 leading-relaxed">
              <strong>Disclaimer:</strong> This tool generates AI-based legal templates
              for Pakistan. It is not legal advice. Always have a licensed Pakistani
              lawyer review any document before use.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

