
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const { page, content, blocks, focus_keyword } = await req.json()

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const optimizationPrompt = `
      Optimize the SEO for this webpage targeting the focus keyword "${focus_keyword}":

      Current Page:
      - Title: ${page.title}
      - URL: ${page.slug}
      - Description: ${page.description || 'Not set'}
      - Content: ${content}

      Current SEO Settings:
      - Meta Title: ${page.seo.meta_title || page.title}
      - Meta Description: ${page.seo.meta_description || page.description || ''}
      - OG Title: ${page.seo.og_title || page.title}
      - OG Description: ${page.seo.og_description || page.description || ''}
      - Twitter Title: ${page.seo.twitter_title || page.title}
      - Twitter Description: ${page.seo.twitter_description || page.description || ''}

      Please optimize ALL SEO fields for the focus keyword "${focus_keyword}" while keeping them natural and engaging.

      Guidelines:
      - Meta title: 50-60 characters, include focus keyword near the beginning
      - Meta description: 150-160 characters, compelling and include focus keyword
      - Social media titles can be more engaging/clickbait style
      - Ensure all content sounds natural, not keyword-stuffed

      Return optimized SEO data in this JSON format:
      {
        "meta_title": "optimized title",
        "meta_description": "optimized description", 
        "focus_keyword": "${focus_keyword}",
        "og_title": "optimized og title",
        "og_description": "optimized og description",
        "og_image": "${page.seo.og_image || ''}",
        "twitter_title": "optimized twitter title", 
        "twitter_description": "optimized twitter description",
        "twitter_image": "${page.seo.twitter_image || ''}"
      }

      Also provide an updated analysis with the new SEO score.
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
            content: 'You are an expert SEO optimizer. Create optimized meta tags and social media content that ranks well and converts users. Always return valid JSON.'
          },
          {
            role: 'user',
            content: optimizationPrompt
          }
        ],
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const optimizationResult = data.choices[0].message.content

    let optimized_seo
    try {
      // Try to extract JSON from the response
      const jsonMatch = optimizationResult.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        optimized_seo = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (e) {
      console.error('Failed to parse optimization result:', e)
      // Fallback to current SEO settings if parsing fails
      optimized_seo = page.seo
    }

    // Generate analysis for the optimized content
    const analysisPrompt = `
      Analyze the SEO optimization results:
      
      Optimized Meta Title: ${optimized_seo.meta_title}
      Optimized Meta Description: ${optimized_seo.meta_description}  
      Focus Keyword: ${focus_keyword}
      Content: ${content}

      Provide an SEO score and brief analysis in JSON format:
      {
        "score": number,
        "issues": [],
        "suggestions": [],
        "keywords": [array of relevant keywords found]
      }
    `

    const analysisResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are an SEO analyst. Provide analysis in JSON format.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
      }),
    })

    let analysis = {
      score: 85,
      issues: [],
      suggestions: [],
      keywords: [focus_keyword]
    }

    if (analysisResponse.ok) {
      try {
        const analysisData = await analysisResponse.json()
        const analysisResult = analysisData.choices[0].message.content
        const analysisJson = analysisResult.match(/\{[\s\S]*\}/)
        if (analysisJson) {
          analysis = JSON.parse(analysisJson[0])
        }
      } catch (e) {
        console.error('Failed to parse analysis:', e)
      }
    }

    console.log('SEO Optimization completed:', { optimized_seo, analysis })

    return new Response(JSON.stringify({ optimized_seo, analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error in optimize-seo function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
