import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { PDFDocument, StandardFonts } from 'pdf-lib'

interface Party {
  name: string
  role: string
  identifier?: string
  address?: string
  contact?: string
}

interface GenerateTemplateRequest {
  documentType: string
  jurisdiction: string
  parties: Party[]
  keyTerms: string
  extraNotes?: string
}

const SYSTEM_PROMPT = `You are an AI assistant that drafts legal document templates specifically for Pakistan.

- Always draft in clear, professional legal English commonly used in Pakistan.
- Assume the governing law is that of Pakistan and adapt structure/clauses accordingly.
- Your output must be a generic template, not personalized legal advice.
- At the top of the document, include a short disclaimer that the template must be reviewed by a qualified lawyer in Pakistan before use.
- Output the document as plain text with clear headings and numbered clauses.
- Do NOT include any extra explanation outside the document itself.
- Format the document with clear sections, proper headings, and numbered clauses.
- Include all standard clauses relevant to the document type (definitions, obligations, duration, termination, dispute resolution, governing law, etc.).
- The document may involve multiple parties (two or more). Handle multiple tenants, partners, guarantors, or other parties appropriately in the template structure.`

export async function POST(request: NextRequest) {
  try {
    const body: GenerateTemplateRequest = await request.json()

    // Validation
    if (!body.documentType || !body.jurisdiction || !body.keyTerms) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!body.parties || !Array.isArray(body.parties) || body.parties.length === 0) {
      return NextResponse.json(
        { error: 'At least one party is required' },
        { status: 400 }
      )
    }

    // Validate each party has required fields
    for (let i = 0; i < body.parties.length; i++) {
      const party = body.parties[i]
      if (!party.name || !party.role) {
        return NextResponse.json(
          { error: `Party ${i + 1} is missing required fields (name and role)` },
          { status: 400 }
        )
      }
    }

    // Check for API key
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      console.error('OPENAI_API_KEY is not set')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Initialize OpenAI client
    const openai = new OpenAI({ apiKey })

    // Build parties string
    const partiesString = body.parties
      .map((party, index) => {
        let partyText = `Party ${index + 1} (${party.role}):\nName: ${party.name}`
        if (party.identifier) {
          partyText += `\nIdentifier: ${party.identifier}`
        }
        if (party.address) {
          partyText += `\nAddress: ${party.address}`
        }
        if (party.contact) {
          partyText += `\nContact: ${party.contact}`
        }
        return partyText
      })
      .join('\n\n')

    // Construct user prompt
    const userPrompt = `Generate a ${body.documentType} for use in ${body.jurisdiction}.

Parties:
${partiesString}

Key terms: ${body.keyTerms}

${body.extraNotes ? `Additional notes: ${body.extraNotes}` : ''}

Produce a complete legal template including definitions, obligations, duration, termination, dispute resolution, and governing law, appropriate for Pakistan.`

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    })

    const generatedText = completion.choices[0]?.message?.content

    if (!generatedText) {
      return NextResponse.json(
        { error: 'Failed to generate document content' },
        { status: 500 }
      )
    }

    // Generate PDF using pdf-lib
    const pdfBytes = await generatePDF(generatedText, body.documentType)

    // Return PDF as response
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="legal-template.pdf"',
      },
    })
  } catch (error) {
    console.error('Error generating template:', error)

    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Invalid API configuration' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate template. Please try again.' },
      { status: 500 }
    )
  }
}

// pdf-lib version of generatePDF
async function generatePDF(text: string, documentType: string): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  let page = pdfDoc.addPage()
  const { width, height } = page.getSize()

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const margin = 50
  const normalSize = 11
  const headingSize = 14

  let y = height - margin

  // Title at the top
  const title = documentType || 'Legal Document'
  const titleWidth = boldFont.widthOfTextAtSize(title, 20)
  page.drawText(title, {
    x: (width - titleWidth) / 2,
    y,
    size: 20,
    font: boldFont,
  })
  y -= 30

  const lines = text.split('\n')
  let isFirstLine = true

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      y -= normalSize // blank line spacing
      continue
    }

    // New page if needed
    if (y < margin) {
      page = pdfDoc.addPage()
      y = page.getSize().height - margin
    }

    // Heading detection (similar to your pdfkit logic)
    const looksLikeHeading =
      line.length < 100 &&
      (line === line.toUpperCase() ||
        /^[0-9]+\.\s+[A-Z]/.test(line) ||
        /^[A-Z][A-Z\s]+$/.test(line))

    if (looksLikeHeading) {
      if (!isFirstLine) {
        y -= 10
        if (y < margin) {
          page = pdfDoc.addPage()
          y = page.getSize().height - margin
        }
      }

      page.drawText(line, {
        x: margin,
        y,
        size: headingSize,
        font: boldFont,
      })
      y -= headingSize + 4
    } else {
      // Simple text wrap by splitting long lines
      const maxWidth = width - margin * 2
      const words = line.split(' ')
      let currentLine = ''

      for (const word of words) {
        const testLine = currentLine ? currentLine + ' ' + word : word
        const textWidth = font.widthOfTextAtSize(testLine, normalSize)

        if (textWidth > maxWidth) {
          page.drawText(currentLine, {
            x: margin,
            y,
            size: normalSize,
            font,
          })
          y -= normalSize + 4

          if (y < margin) {
            page = pdfDoc.addPage()
            y = page.getSize().height - margin
          }

          currentLine = word
        } else {
          currentLine = testLine
        }
      }

      if (currentLine) {
        page.drawText(currentLine, {
          x: margin,
          y,
          size: normalSize,
          font,
        })
        y -= normalSize + 4
      }
    }

    isFirstLine = false
  }

  return pdfDoc.save()
}
