import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  // Only proxy OpenAI DALL-E image URLs
  const allowed = new URL(url);
  if (!allowed.hostname.endsWith("blob.core.windows.net")) {
    return NextResponse.json({ error: "URL not allowed" }, { status: 403 });
  }

  const imageRes = await fetch(url);
  if (!imageRes.ok) {
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
  }

  const blob = await imageRes.blob();
  return new NextResponse(blob, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": 'attachment; filename="kitchen-render.png"',
    },
  });
}
