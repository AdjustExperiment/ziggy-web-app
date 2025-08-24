
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { page, content, blocks } = await req.json()

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    // Analyze content for SEO
    const analysisPrompt = `
      Analyze this webpage for SEO optimization and provide a detailed report:

      Page Title: ${page.title}
      URL Slug: ${page.slug}
      Meta Description: ${page.description || 'Not set'}
      Content: ${content}
      
      Current SEO settings:
      - Meta Title: ${page.seo.meta_title || 'Not set'}
      - Meta Description: ${page.seo.meta_description || 'Not set'}
      - Focus Keyword: ${page.seo.focus_keyword || 'Not set'}

      Blocks on page: ${blocks.length} blocks including ${blocks.map(b => b.type).join(', ')}

      Please provide:
      1. An SEO score out of 100
      2. A list of issues (categorized as error, warning, or info)
      3. Specific improvement suggestions
      4. Keyword analysis

      Return a JSON response with this structure:
      {
        "score": number,
        "issues": [{"type": "error|warning|info", "message": string, "field": string}],
        "suggestions": [{"field": string, "current": string, "suggested": string, "reason": string}],
        "keywords": [string]
      }
    `

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert SEO analyst. Analyze web pages and provide actionable SEO recommendations in JSON format.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const analysisResult = data.choices[0].message.content

    let analysis
    try {
      analysis = JSON.parse(analysisResult)
    } catch (e) {
      // Fallback analysis if JSON parsing fails
      analysis = {
        score: 50,
        issues: [{ type: 'error', message: 'Failed to parse AI analysis', field: 'general' }],
        suggestions: [],
        keywords: []
      }
    }

    console.log('SEO Analysis completed:', analysis)

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in analyze-seo function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
