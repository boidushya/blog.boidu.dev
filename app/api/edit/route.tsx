import fs from "fs";
import { basename, dirname, join } from "path";
import { applyBlockEdit, readBody } from "@/lib/source-edit";
import { IS_DEV } from "@/utils/constants";
import { type NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const notFound = () => new NextResponse(null, { status: 404 });

const BLOGS = join(process.cwd(), "blogs");

const writes = new Map<string, Promise<unknown>>();

function oneAtATime<T>(path: string, task: () => Promise<T>) {
  const run = (writes.get(path) ?? Promise.resolve()).then(task, task);
  writes.set(
    path,
    run.catch(() => undefined)
  );
  return run;
}

function postPath(id: unknown) {
  if (!IS_DEV || typeof id !== "string") return null;
  const file = fs.readdirSync(BLOGS).find(name => name.replace(/\.mdx?$/, "") === id);
  return file ? join(BLOGS, file) : null;
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
  return oneAtATime(path, async () => {
    const next = applyBlockEdit(await fs.promises.readFile(path, "utf8"), { start, end, expected, replacement });
    if (next === null) return new NextResponse(null, { status: 409 });
    const temp = join(dirname(path), `.${basename(path)}.tmp`);
    await fs.promises.writeFile(temp, next);
    await fs.promises.rename(temp, path);
    return new NextResponse(null, { status: 204 });
  });
}
