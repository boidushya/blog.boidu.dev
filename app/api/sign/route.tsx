import cors from "@/lib/cors";
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabaseClient";

interface CreateRequestBody {
  svgText: string;
  id: string;
}

const corsOptions = {
  origin:
    process.env.NODE_ENV === "development"
      ? "*"
      : ["https://blog.boidu.dev", "https://boidu.dev", "blog-boidu-dev.vercel.app", "blog-boidu-*.vercel.app"],
  methods: ["POST", "GET"],
};

export async function POST(request: NextRequest) {
  const body = (await request.json()) as CreateRequestBody;
  const { data, error } = await supabase.from("signs").insert({ svg_text: body.svgText, post_id: body.id }).select();

  if (error) {
    return cors(request, NextResponse.json({ error: error.message }, { status: 500 }), corsOptions);
  }

  return cors(
    request,
    NextResponse.json(
      {
        message: "Successfully added sign",
        id: data[0].id,
      },
      { status: 200 }
    ),
    corsOptions
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return cors(request, NextResponse.json({ error: "Missing id parameter" }, { status: 400 }), corsOptions);
  }

  const { data, error } = await supabase.from("signs").select("svg_text, id").eq("post_id", id);

  if (error) {
    return cors(request, NextResponse.json({ error: error.message }, { status: 500 }), corsOptions);
  }

  if (!data || data.length === 0) {
    return cors(request, NextResponse.json({ error: "No signs found for this post ID" }, { status: 404 }), corsOptions);
  }

  const svgTexts = data.map(item => ({ svgText: item.svg_text, id: item.id }));

  return cors(request, NextResponse.json(svgTexts, { status: 200 }), corsOptions);
}
