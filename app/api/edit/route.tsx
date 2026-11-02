import fs from "fs";
import { join } from "path";
import { applyBlockEdit, readBody } from "@/lib/source-edit";
import { IS_DEV } from "@/utils/constants";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const notFound = () => new NextResponse(null, { status: 404 });

function postPath(id: unknown) {
  if (!IS_DEV || typeof id !== "string") return null;
  const file = fs.readdirSync("blogs").find(name => name.replace(/\.mdx?$/, "") === id);
  return file ? join("blogs", file) : null;
}

export async function GET(request: NextRequest) {
  const path = postPath(request.nextUrl.searchParams.get("id"));
  if (!path) return notFound();
  return NextResponse.json({ body: readBody(await fs.promises.readFile(path, "utf8")) });
}

export async function PUT(request: NextRequest) {
  const { id, start, end, expected, replacement } = await request.json();
  const path = postPath(id);
  if (!path) return notFound();
  if (![start, end].every(Number.isInteger) || typeof expected !== "string" || typeof replacement !== "string") {
    return new NextResponse(null, { status: 400 });
  }
  const next = applyBlockEdit(await fs.promises.readFile(path, "utf8"), { start, end, expected, replacement });
  if (next === null) return new NextResponse(null, { status: 409 });
  await fs.promises.writeFile(path, next);
  return new NextResponse(null, { status: 204 });
}
