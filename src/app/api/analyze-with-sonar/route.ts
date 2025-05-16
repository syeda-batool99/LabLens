import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompts } = await req.json();

    const responses = await Promise.all(
      prompts.map(async (prompt: string) => {

        const res = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${process.env.SONAR_API_KEY}`,
          },
          body: JSON.stringify({
            model: "sonar-pro",
            messages: [
              { role: "system", content: "Be precise and concise." },
              { role: "user", content: prompt },
            ],
          }),
        });

        if (!res.ok) {
          throw new Error(`Sonar API error: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        return data;
      })
    );


    // Extract the actual text content from each response
    const fullText = responses
      .map(r => r.choices?.[0]?.message?.content || '')
      .join('\n\n');

    return NextResponse.json({
      analysisSummary: fullText,
      recommendations: [
        'Review the above results with your healthcare provider.',
        'Discuss any questions you may have about abnormal values.',
        'Consider lifestyle adjustments based on findings.'
      ],
    });
  } catch (error) {
    console.error('Sonar API error:', error);
    return NextResponse.json({ error: 'AI analysis failed' }, { status: 500 });
  }
}
