import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/utils/supabase/service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data: doc } = await supabase
    .from("documents")
    .select("storage_path, mime_type, name")
    .eq("id", id)
    .eq("is_public", true)
    .single();

  if (!doc) {
    return NextResponse.json(
      { error: "Document not found or is private" },
      { status: 404 }
    );
  }

  const { data: file } = await supabase.storage
    .from("documents")
    .download(doc.storage_path);

  if (!file) {
    return NextResponse.json(
      { error: "File not found in storage" },
      { status: 404 }
    );
  }

  const isInline =
    doc.mime_type.startsWith("text/") ||
    doc.mime_type.startsWith("image/") ||
    doc.mime_type === "application/pdf";

  const disposition = isInline
    ? `inline; filename="${doc.name}"`
    : `attachment; filename="${doc.name}"`;

  return new NextResponse(file, {
    headers: {
      "Content-Type": doc.mime_type,
      "Content-Disposition": disposition,
    },
  });
}
