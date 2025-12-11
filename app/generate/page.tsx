'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { pakistanLegalFacts } from '../utils/legalFacts'

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

interface Clause {
  id: string
  text: string
  isModelAdded: boolean
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
  const [isModifying, setIsModifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [templateText, setTemplateText] = useState('')
  const [reviewedTemplateText, setReviewedTemplateText] = useState('')
  const [documentType, setDocumentType] = useState('')
  const [isDownloading, setIsDownloading] = useState(false)
  const [currentFact, setCurrentFact] = useState('')
  const [modificationRequest, setModificationRequest] = useState('')
  const [removedClauseIds, setRemovedClauseIds] = useState<Set<string>>(new Set())

  // Function to identify model-added content
  const identifyModelAddedContent = (text: string, keyTerms: string, extraNotes: string): Clause[] => {
    const clauses: Clause[] = []
    const lines = text.split('\n')
    
    // Create a combined reference text from user inputs (normalize for comparison)
    const referenceText = `${keyTerms} ${extraNotes}`.toLowerCase()
    // Extract meaningful words and phrases from user input
    const referenceWords = new Set(
      referenceText
        .split(/[\s,;:]+/)
        .filter(word => word.length > 2) // Include shorter words too
        .map(word => word.toLowerCase().replace(/[^\w]/g, ''))
    )
    
    // Also extract key phrases (2-3 word combinations)
    const referencePhrases = new Set<string>()
    const words = referenceText.split(/\s+/).filter(w => w.length > 2)
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = `${words[i]} ${words[i + 1]}`.toLowerCase().replace(/[^\w\s]/g, '')
      if (phrase.length > 5) referencePhrases.add(phrase)
    }

    let currentClause = ''
    let clauseId = 0

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      if (!line) {
        if (currentClause.trim()) {
          const clauseLower = currentClause.toLowerCase()
          
          // Check if clause contains user-specified content
          const clauseWords = clauseLower.split(/[\s,;:]+/).map(w => w.replace(/[^\w]/g, ''))
          const hasUserWords = clauseWords.some(word => 
            word.length > 2 && referenceWords.has(word)
          )
          
          // Check for phrases
          const hasUserPhrases = Array.from(referencePhrases).some(phrase => 
            clauseLower.includes(phrase)
          )
          
          // Check if it's a standard legal clause (likely model-added)
          const standardClausePatterns = [
            /^\s*(whereas|now\s+therefore|in\s+witness|disclaimer|governing\s+law|dispute\s+resolution|termination|obligations|definitions|severability|force\s+majeure|entire\s+agreement|amendment|waiver|notices|assignment|indemnification)/i,
            /this\s+agreement\s+shall\s+be\s+governed/i,
            /any\s+dispute\s+arising/i,
            /the\s+parties\s+hereto/i,
          ]
          
          const isStandardClause = standardClausePatterns.some(pattern => 
            pattern.test(currentClause)
          )
          
          // Mark as model-added if it's a standard clause without user content, or if it's long without user content
          const isModelAdded = (isStandardClause && !hasUserWords && !hasUserPhrases) || 
                               (!hasUserWords && !hasUserPhrases && currentClause.length > 100)
          
          clauses.push({
            id: `clause-${clauseId++}`,
            text: currentClause.trim(),
            isModelAdded
          })
          currentClause = ''
        }
        continue
      }

      // Check if line is a heading
      const isHeading = /^[A-Z][A-Z\s]+$/.test(line) || 
                       /^\d+[\.\)]\s+[A-Z]/.test(line) || 
                       (line.length < 60 && /^[A-Z]/.test(line))
      
      if (isHeading && currentClause.trim()) {
        // Save previous clause
        const clauseLower = currentClause.toLowerCase()
        const clauseWords = clauseLower.split(/[\s,;:]+/).map(w => w.replace(/[^\w]/g, ''))
        const hasUserWords = clauseWords.some(word => 
          word.length > 2 && referenceWords.has(word)
        )
        const hasUserPhrases = Array.from(referencePhrases).some(phrase => 
          clauseLower.includes(phrase)
        )
        const standardClausePatterns = [
          /^\s*(whereas|now\s+therefore|in\s+witness|disclaimer|governing\s+law|dispute\s+resolution|termination|obligations|definitions|severability|force\s+majeure|entire\s+agreement|amendment|waiver|notices|assignment|indemnification)/i,
          /this\s+agreement\s+shall\s+be\s+governed/i,
          /any\s+dispute\s+arising/i,
          /the\s+parties\s+hereto/i,
        ]
        const isStandardClause = standardClausePatterns.some(pattern => 
          pattern.test(currentClause)
        )
        const isModelAdded = (isStandardClause && !hasUserWords && !hasUserPhrases) || 
                             (!hasUserWords && !hasUserPhrases && currentClause.length > 100)
        
        clauses.push({
          id: `clause-${clauseId++}`,
          text: currentClause.trim(),
          isModelAdded
        })
        currentClause = line + '\n'
      } else {
        currentClause += (currentClause ? '\n' : '') + line
      }
    }

    // Add last clause
    if (currentClause.trim()) {
      const clauseLower = currentClause.toLowerCase()
      const clauseWords = clauseLower.split(/[\s,;:]+/).map(w => w.replace(/[^\w]/g, ''))
      const hasUserWords = clauseWords.some(word => 
        word.length > 2 && referenceWords.has(word)
      )
      const hasUserPhrases = Array.from(referencePhrases).some(phrase => 
        clauseLower.includes(phrase)
      )
      const standardClausePatterns = [
        /^\s*(whereas|now\s+therefore|in\s+witness|disclaimer|governing\s+law|dispute\s+resolution|termination|obligations|definitions|severability|force\s+majeure|entire\s+agreement|amendment|waiver|notices|assignment|indemnification)/i,
        /this\s+agreement\s+shall\s+be\s+governed/i,
        /any\s+dispute\s+arising/i,
        /the\s+parties\s+hereto/i,
      ]
      const isStandardClause = standardClausePatterns.some(pattern => 
        pattern.test(currentClause)
      )
      const isModelAdded = (isStandardClause && !hasUserWords && !hasUserPhrases) || 
                           (!hasUserWords && !hasUserPhrases && currentClause.length > 100)
      
      clauses.push({
        id: `clause-${clauseId++}`,
        text: currentClause.trim(),
        isModelAdded
      })
    }

    return clauses
  }

  // Parse template into clauses
  const clauses = useMemo(() => {
    if (!templateText) return []
    return identifyModelAddedContent(templateText, formData.keyTerms, formData.extraNotes)
  }, [templateText, formData.keyTerms, formData.extraNotes])

  // Generate reviewed template text
  useEffect(() => {
    if (!templateText) return
    
    const activeClauses = clauses.filter(c => !removedClauseIds.has(c.id))
    const reviewedText = activeClauses.map(c => c.text).join('\n\n')
    setReviewedTemplateText(reviewedText)
  }, [clauses, removedClauseIds, templateText])

  // Show random legal facts during model processing
  useEffect(() => {
    if (!isLoading && !isModifying) return

    const showRandomFact = () => {
      const randomIndex = Math.floor(Math.random() * pakistanLegalFacts.length)
      setCurrentFact(pakistanLegalFacts[randomIndex])
    }

    showRandomFact()
    const interval = setInterval(showRandomFact, 3000) // Change fact every 3 seconds

    return () => clearInterval(interval)
  }, [isLoading, isModifying])

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
    // Ensure at least 2 parties are always present
    if (formData.parties.length > 2) {
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
    setRemovedClauseIds(new Set())

    // Validation
    if (!formData.documentType || !formData.jurisdiction || !formData.keyTerms) {
      setError('Please fill in all required fields.')
      setIsLoading(false)
      return
    }

    if (formData.parties.length < 2) {
      setError('At least two parties are required.')
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

      const data = await response.json()
      setTemplateText(data.templateText)
      setDocumentType(data.documentType)
      setShowReviewModal(true)
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

  const handleRemoveClause = (clauseId: string) => {
    setRemovedClauseIds((prev) => new Set([...prev, clauseId]))
  }

  const handleRestoreClause = (clauseId: string) => {
    setRemovedClauseIds((prev) => {
      const newSet = new Set(prev)
      newSet.delete(clauseId)
      return newSet
    })
  }

  const handleModify = async () => {
    if (!modificationRequest.trim()) {
      setError('Please enter your modification request.')
      return
    }

    setIsModifying(true)
    setError(null)

    try {
      const response = await fetch('/api/modify-template', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateText: reviewedTemplateText,
          documentType: documentType,
          modificationRequest: modificationRequest,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        throw new Error(errorData.error || 'Failed to modify template')
      }

      const data = await response.json()
      setTemplateText(data.templateText)
      setModificationRequest('')
      setRemovedClauseIds(new Set())
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong while modifying the template. Please try again.'
      )
    } finally {
      setIsModifying(false)
    }
  }

  const handleDownload = async () => {
    setIsDownloading(true)
    setShowReviewModal(false)

    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateText: reviewedTemplateText,
          documentType: documentType,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

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
          : 'Something went wrong while generating the PDF. Please try again.'
      )
    } finally {
      setIsDownloading(false)
    }
  }

  // Format template text for PDF-like preview
  const formatTemplateForPreview = (text: string) => {
    const lines = text.split('\n')
    const elements: JSX.Element[] = []
    
    lines.forEach((line, index) => {
      const trimmed = line.trim()
      if (!trimmed) {
        elements.push(<div key={index} className="h-3" />)
        return
      }
      
      // Check if it's a heading (all caps, numbered section, or short uppercase line)
      const isHeading = 
        (trimmed === trimmed.toUpperCase() && trimmed.length < 100 && /^[A-Z\s]+$/.test(trimmed)) ||
        /^\d+[\.\)]\s+[A-Z]/.test(trimmed) ||
        (/^[A-Z]/.test(trimmed) && trimmed.length < 80 && !trimmed.includes('.') && !trimmed.includes(','))
      
      if (isHeading) {
        elements.push(
          <div key={index} className="mt-6 mb-4 first:mt-0">
            <h3 className="text-base font-bold text-charcoal uppercase tracking-wide">
              {trimmed}
            </h3>
          </div>
        )
      } else {
        // Regular paragraph
        elements.push(
          <p key={index} className="mb-3 text-sm text-charcoal leading-relaxed text-justify">
            {trimmed}
          </p>
        )
      }
    })
    
    return elements
  }

  return (
    <main className="min-h-screen bg-midnight-blue py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <Link
            href="/"
            className="text-crimson hover:text-crimson-dark font-medium"
          >
            ← Back to Home
          </Link>
        </div>

        <div className="bg-dark-slate rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-white mb-6">
            Generate Legal Template
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="documentType"
                className="block text-sm font-medium text-white mb-2"
              >
                Document Type <span className="text-crimson">*</span>
              </label>
              <select
                id="documentType"
                name="documentType"
                value={formData.documentType}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 bg-dark-gray border border-medium-gray rounded-lg text-white focus:ring-2 focus:ring-crimson focus:border-crimson"
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
                className="block text-sm font-medium text-white mb-2"
              >
                Jurisdiction / City <span className="text-crimson">*</span>
              </label>
              <input
                type="text"
                id="jurisdiction"
                name="jurisdiction"
                value={formData.jurisdiction}
                onChange={handleChange}
                placeholder="e.g., Karachi, Sindh, Pakistan"
                required
                className="w-full px-4 py-2 bg-dark-gray border border-medium-gray rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-crimson focus:border-crimson"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-white">
                  Parties <span className="text-crimson">*</span>
                </label>
                <button
                  type="button"
                  onClick={addParty}
                  className="text-sm bg-crimson hover:bg-crimson-dark text-white font-medium py-1 px-3 rounded transition-colors"
                >
                  + Add Party
                </button>
              </div>

              <div className="space-y-6">
                {formData.parties.map((party, index) => (
                  <div
                    key={index}
                    className="border border-medium-gray rounded-lg p-4 bg-midnight-blue"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-white">
                        Party {index + 1}
                      </h3>
                      {formData.parties.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeParty(index)}
                          className="text-sm text-crimson hover:text-crimson-dark font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor={`party-${index}-name`}
                          className="block text-xs font-medium text-gray-400 mb-1"
                        >
                          Name <span className="text-crimson">*</span>
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
                          className="w-full px-3 py-2 text-sm bg-dark-gray border border-medium-gray rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-crimson focus:border-crimson"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`party-${index}-role`}
                          className="block text-xs font-medium text-gray-400 mb-1"
                        >
                          Role <span className="text-crimson">*</span>
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
                          className="w-full px-3 py-2 text-sm bg-dark-gray border border-medium-gray rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-crimson focus:border-crimson"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`party-${index}-identifier`}
                          className="block text-xs font-medium text-gray-400 mb-1"
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
                          className="w-full px-3 py-2 text-sm bg-dark-gray border border-medium-gray rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-crimson focus:border-crimson"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`party-${index}-contact`}
                          className="block text-xs font-medium text-gray-400 mb-1"
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
                          className="w-full px-3 py-2 text-sm bg-dark-gray border border-medium-gray rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-crimson focus:border-crimson"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label
                        htmlFor={`party-${index}-address`}
                        className="block text-xs font-medium text-gray-400 mb-1"
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
                        className="w-full px-3 py-2 text-sm bg-dark-gray border border-medium-gray rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-crimson focus:border-crimson"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="keyTerms"
                className="block text-sm font-medium text-white mb-2"
              >
                Key Terms / Details <span className="text-crimson">*</span>
              </label>
              <textarea
                id="keyTerms"
                name="keyTerms"
                value={formData.keyTerms}
                onChange={handleChange}
                rows={4}
                placeholder="e.g., rent amount, duration, salary, notice period, etc."
                required
                className="w-full px-4 py-2 bg-dark-gray border border-medium-gray rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-crimson focus:border-crimson"
              />
            </div>

            <div>
              <label
                htmlFor="extraNotes"
                className="block text-sm font-medium text-white mb-2"
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
                className="w-full px-4 py-2 bg-dark-gray border border-medium-gray rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-crimson focus:border-crimson"
              />
            </div>

            {error && (
              <div className="bg-dark-slate border-l-4 border-crimson p-4 rounded">
                <p className="text-sm text-white">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-crimson hover:bg-crimson-dark disabled:bg-medium-gray text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            >
              {isLoading ? 'Generating template...' : 'Generate Template'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-medium-gray">
            <p className="text-xs text-gray-400 leading-relaxed">
              <strong>Disclaimer:</strong> This tool generates AI-based legal templates
              for Pakistan. It is not legal advice. Always have a licensed Pakistani
              lawyer review any document before use.
            </p>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-slate rounded-lg shadow-2xl max-w-5xl w-full max-h-[95vh] flex flex-col">
            <div className="p-6 border-b border-medium-gray">
              <h2 className="text-2xl font-bold text-white">Review Template</h2>
              <p className="text-sm text-gray-400 mt-2">
                Review the template below. If you need changes, describe them in the text area and click "Apply Changes".
              </p>
            </div>

            {/* Template Preview (PDF-like format) */}
            <div className="flex-1 overflow-y-auto p-8 bg-midnight-blue">
              <div className="bg-white shadow-xl rounded-lg p-12 max-w-4xl mx-auto min-h-full" style={{ fontFamily: 'serif' }}>
                {/* Document Title */}
                <div className="text-center mb-10 border-b-2 border-gray-300 pb-6">
                  <h1 className="text-3xl font-bold text-charcoal">{documentType}</h1>
                </div>

                {/* Template Content */}
                <div className="space-y-1">
                  {formatTemplateForPreview(reviewedTemplateText)}
                </div>
              </div>
            </div>

            {/* Chat/Modification Area */}
            <div className="p-6 border-t border-medium-gray bg-dark-slate">
              <div className="mb-4">
                <label
                  htmlFor="modificationRequest"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Request Changes (optional)
                </label>
                <textarea
                  id="modificationRequest"
                  value={modificationRequest}
                  onChange={(e) => setModificationRequest(e.target.value)}
                  rows={3}
                  placeholder="e.g., Add a clause about late payment penalties, Remove the force majeure clause, Change the notice period to 30 days..."
                  className="w-full px-4 py-2 bg-dark-gray border border-medium-gray rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-crimson focus:border-crimson resize-none"
                  disabled={isModifying}
                />
              </div>

              {error && (
                <div className="mb-4 bg-dark-slate border-l-4 border-crimson p-3 rounded">
                  <p className="text-sm text-white">{error}</p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowReviewModal(false)
                    setRemovedClauseIds(new Set())
                    setModificationRequest('')
                  }}
                  className="flex-1 bg-medium-gray hover:bg-dark-gray text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  disabled={isModifying}
                >
                  Cancel
                </button>
                <button
                  onClick={handleModify}
                  disabled={isModifying || !modificationRequest.trim()}
                  className="flex-1 bg-crimson hover:bg-crimson-dark disabled:bg-medium-gray text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg disabled:cursor-not-allowed"
                >
                  {isModifying ? 'Applying Changes...' : 'Apply Changes'}
                </button>
                <button
                  onClick={handleDownload}
                  className="flex-1 bg-crimson hover:bg-crimson-dark text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg"
                  disabled={isModifying}
                >
                  Download Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Model Processing Modal (for generation and modification) */}
      {(isLoading || isModifying) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-slate rounded-lg shadow-2xl max-w-md w-full p-8 text-center">
            <div className="mb-6">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-crimson border-t-transparent"></div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              {isLoading ? 'Generating Template...' : 'Applying Changes...'}
            </h2>
            {currentFact && (
              <div className="mt-6 p-4 bg-midnight-blue rounded-lg border border-medium-gray">
                <p className="text-sm text-crimson font-medium mb-2">
                  💡 Did you know?
                </p>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {currentFact}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Download Loading Modal */}
      {isDownloading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-slate rounded-lg shadow-2xl max-w-md w-full p-8 text-center">
            <div className="mb-6">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-crimson border-t-transparent"></div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Generating PDF...
            </h2>
          </div>
        </div>
      )}
    </main>
  )
}
