import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, StandardFonts } from 'pdf-lib'

interface GeneratePDFRequest {
  templateText: string
  documentType: string
}

export async function POST(request: NextRequest) {
  try {
    const body: GeneratePDFRequest = await request.json()

    if (!body.templateText || !body.documentType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate PDF using pdf-lib
    const pdfBytes = await generatePDF(body.templateText, body.documentType)

    // Return PDF as response
    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="legal-template.pdf"',
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF. Please try again.' },
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

