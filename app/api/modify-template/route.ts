import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

interface ModifyTemplateRequest {
  templateText: string
  documentType: string
  modificationRequest: string
}

const SYSTEM_PROMPT = `You are an AI assistant that modifies legal document templates specifically for Pakistan.

- You will receive an existing legal template and a modification request from the user.
- Apply the requested modifications to the template while maintaining legal accuracy and proper formatting.
- Keep the document structure, formatting, and legal language appropriate for Pakistan.
- Output ONLY the modified template text, without any explanations or comments.
- Maintain all standard clauses unless specifically asked to remove them.
- Ensure the document remains a valid legal template.`

export async function POST(request: NextRequest) {
  try {
    const body: ModifyTemplateRequest = await request.json()

    if (!body.templateText || !body.modificationRequest) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
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

    // Construct user prompt
    const userPrompt = `Here is the current legal template:

${body.templateText}

User's modification request: ${body.modificationRequest}

Please modify the template according to the user's request. Return only the modified template text.`

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
    })

    const modifiedText = completion.choices[0]?.message?.content

    if (!modifiedText) {
      return NextResponse.json(
        { error: 'Failed to modify document content' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      templateText: modifiedText,
      documentType: body.documentType,
    })
  } catch (error) {
    console.error('Error modifying template:', error)

    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Invalid API configuration' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Failed to modify template. Please try again.' },
      { status: 500 }
    )
  }
}

