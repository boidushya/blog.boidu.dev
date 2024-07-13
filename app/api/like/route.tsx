import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabaseClient";
import cors from "@/lib/cors";

type ActionType = "increment" | "decrement";

interface RequestBody {
  action: ActionType;
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
  const { action, id } = (await request.json()) as RequestBody;

  const { error } = await supabase.rpc(`${action}_likes`, { input_post_id: id });

  if (error) {
    return cors(
      request,
      NextResponse.json(
        {
          error: error.message,
        },
        { status: 500 }
      ),
      corsOptions
    );
  }

  return cors(
    request,
    NextResponse.json(
      {
        message: `Successfully ${action}ed like`,
      },
      { status: 200 }
    ),
    corsOptions
  );
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  const { data, error } = await supabase.from("likes").select("count").eq("post_id", id).single();

  if (error && error.code !== "PGRST116") {
    return cors(
      request,
      NextResponse.json(
        {
          error: error.message,
        },
        { status: 500 }
      ),
      corsOptions
    );
  }

  return cors(
    request,
    NextResponse.json(
      {
        count: data?.count || 0,
      },
      { status: 200 }
    ),
    corsOptions
  );
}
