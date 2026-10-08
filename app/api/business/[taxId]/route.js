import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { taxId } = await params;
  const cleanId = String(taxId || "").replace(/[^0-9\-]/g, "").trim();

  if (!cleanId || cleanId.length < 8) {
    return NextResponse.json(
      { valid: false, tax_id: cleanId, error: "Tax ID must be at least 8 digits" },
      { status: 400 }
    );
  }

  // Query VietQR API server-side
  try {
    const res = await fetch(`https://api.vietqr.io/v2/business/${encodeURIComponent(cleanId)}`, {
      headers: {
        Accept: "application/json",
      },
      cache: "force-cache",
    });

    if (res.ok) {
      const json = await res.json();
      if (json && json.code === "00" && json.data) {
        return NextResponse.json({
          valid: true,
          tax_id: cleanId,
          business: json.data,
          message: "Tax ID is valid and verified in Vietnam National Business Registry",
        });
      }
      return NextResponse.json({
        valid: false,
        tax_id: cleanId,
        business: null,
        error: json?.desc || "Tax ID not found in Vietnam Business Registry",
      });
    }
  } catch (err) {
    console.error("VietQR API proxy failed:", err);
  }

  const isFormatOk = /^\d{10}(\-\d{3}|\d{3})?$/.test(cleanId);
  return NextResponse.json({
    valid: isFormatOk,
    tax_id: cleanId,
    business: null,
    fallback: true,
    error: isFormatOk ? null : "Invalid Tax ID format",
  });
}
