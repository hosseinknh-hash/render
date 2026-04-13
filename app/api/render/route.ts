import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export const maxDuration = 60; // seconds — DALL-E can be slow

export async function POST(req: NextRequest) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided." }, { status: 400 });
    }

    // Convert File to base64 data URL for GPT-4o vision
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = file.type as "image/jpeg" | "image/png" | "image/webp";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // Step 1: Use GPT-4o vision to analyse the kitchen design
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: dataUrl, detail: "high" },
            },
            {
              type: "text",
              text: `You are an expert interior designer and kitchen architect.
Analyse this kitchen design image (which may be a CAD drawing, technical render, or sketch from Winner Design software or similar) and describe it in precise detail for a photorealistic render.

Cover:
- Cabinet layout, configuration, and dimensions (islands, peninsulas, L-shape, U-shape, etc.)
- Cabinet door style and finish (e.g. handleless, shaker, flat-front, gloss, matte, colour)
- Worktop/countertop material and colour
- Appliances visible (hob, oven, hood, sink, fridge, etc.) and their positions
- Flooring type and colour
- Wall colour or finish
- Lighting visible (under-cabinet, pendants, ceiling)
- Overall style (modern, contemporary, classic, Scandinavian, etc.)
- Colour palette

Be precise and specific. This description will be used to generate a photorealistic interior photograph.`,
            },
          ],
        },
      ],
    });

    const kitchenDescription =
      visionResponse.choices[0]?.message?.content ?? "a modern kitchen";

    // Step 2: Generate a photorealistic render with DALL-E 3
    const dalleResponse = await openai.images.generate({
      model: "dall-e-3",
      size: "1024x1024",
      quality: "hd",
      style: "natural",
      prompt: `Professional interior photography of a real kitchen. Photorealistic, shot with a wide-angle architectural lens, soft natural lighting, ultra-high detail.

Kitchen description: ${kitchenDescription}

The image must look like a real photograph taken by an interior design photographer — not a render, not a drawing. Show the full kitchen space. Lighting should feel natural with ambient fill. No text, no watermarks, no people.`,
    });

    const renderedImageUrl = dalleResponse.data?.[0]?.url;

    if (!renderedImageUrl) {
      return NextResponse.json(
        { error: "Image generation failed." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: renderedImageUrl });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    console.error("[render API]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
