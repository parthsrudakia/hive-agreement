import { jsPDF } from "npm:jspdf@2.5.1";
import { z } from "npm:zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// ---- Rate limiting (in-memory, per instance) ----
const RATE_LIMIT = 10; // requests
const WINDOW_MS = 60_000; // per minute
const ipHits = new Map<string, number[]>();

function checkRateLimit(ip: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const arr = (ipHits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= RATE_LIMIT) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - arr[0])) / 1000);
    ipHits.set(ip, arr);
    return { allowed: false, retryAfter };
  }
  arr.push(now);
  ipHits.set(ip, arr);
  // Periodic cleanup
  if (ipHits.size > 5000) {
    for (const [k, v] of ipHits) {
      const filtered = v.filter((t) => now - t < WINDOW_MS);
      if (filtered.length === 0) ipHits.delete(k);
      else ipHits.set(k, filtered);
    }
  }
  return { allowed: true, retryAfter: 0 };
}

// ---- Validation ----
const BodySchema = z.object({
  tenantName: z.string().min(1).max(200),
  sublessorName: z.string().min(1).max(200),
  propertyAddress: z.string().min(1).max(500),
  rent: z.string().min(1).max(20),
  proRateRent: z.string().max(20).optional().default(""),
  securityDeposit: z.string().min(1).max(20),
  leaseStartDate: z.string().min(1),
  leaseEndDate: z.string().min(1),
  agreementDate: z.string().min(1),
  includeLetterhead: z.boolean().optional().default(true),
  format: z.enum(["pdf", "base64"]).optional().default("pdf"),
});

type AgreementData = z.infer<typeof BodySchema>;

// ---- PDF helpers ----
const formatDate = (s: string) =>
  new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
const formatShortDate = (s: string) =>
  new Date(s).toLocaleDateString("en-US", { year: "2-digit", month: "2-digit", day: "2-digit" });

function writeBold(
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  tenant: string,
  sublessor: string,
  fontSize = 10,
): number {
  pdf.setFontSize(fontSize);
  const lines = pdf.splitTextToSize(text, maxWidth);
  const lineHeight = 4.2;
  for (const line of lines) {
    let cx = x;
    const words = line.split(" ");
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const last = i === words.length - 1;
      const isT = tenant.split(" ").some((p) => w.includes(p) && p.length > 2);
      const isS = sublessor.split(" ").some((p) => w.includes(p) && p.length > 2);
      pdf.setFont("helvetica", isT || isS ? "bold" : "normal");
      pdf.text(w + (last ? "" : " "), cx, y);
      cx += pdf.getTextWidth(w + " ");
    }
    y += lineHeight;
  }
  pdf.setFont("helvetica", "normal");
  return y;
}

function buildPdf(data: AgreementData): Uint8Array {
  const pdf = new jsPDF("p", "mm", "letter");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 18;

  const hasLetterhead = data.includeLetterhead;
  const clauseSpacing = hasLetterhead ? 1.8 : 2.5;
  const sectionSpacing = hasLetterhead ? 5 : 8;

  if (hasLetterhead) {
    // Header text only (no logo image in API version to avoid asset bundling)
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.text("HIVE", margin, yPos + 6);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text("City Living, Made Simple", margin, yPos + 11);

    pdf.setFontSize(9);
    const rightX = pageWidth - margin;
    let cy = yPos + 6;
    pdf.text("917-622-9847", rightX, cy, { align: "right" });
    cy += 4;
    pdf.text("Vineet.Dutta@HiveNY.com", rightX, cy, { align: "right" });
    cy += 4;
    pdf.text("442 5th Avenue Suite #2478", rightX, cy, { align: "right" });
    cy += 4;
    pdf.text("New York, NY 10018", rightX, cy, { align: "right" });

    yPos += 16;
    pdf.setDrawColor(255, 204, 0);
    pdf.setLineWidth(0.7);
    pdf.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;
  }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  const title = "SUBLEASE AGREEMENT";
  pdf.text(title, pageWidth / 2, yPos, { align: "center" });
  const tw = pdf.getTextWidth(title);
  pdf.setLineWidth(0.4);
  pdf.setDrawColor(0, 0, 0);
  pdf.line(pageWidth / 2 - tw / 2, yPos + 1, pageWidth / 2 + tw / 2, yPos + 1);
  yPos += hasLetterhead ? 8 : 10;

  pdf.setFontSize(10);
  const lh = 4.2;
  const intro = `This agreement is made between ${data.tenantName} and ${data.sublessorName} for the period beginning ${formatDate(data.leaseStartDate)}, and ending ${formatDate(data.leaseEndDate)}, and will convert to a month-to-month at ${data.propertyAddress}.`;
  const introLines = pdf.splitTextToSize(intro, contentWidth);
  for (const line of introLines) {
    let cx = margin;
    const words = line.split(" ");
    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      const last = i === words.length - 1;
      const isT = data.tenantName.split(" ").some((p) => w.includes(p) && p.length > 2);
      const isS = data.sublessorName.split(" ").some((p) => w.includes(p) && p.length > 2);
      const isA = data.propertyAddress.split(" ").some((p) => w.includes(p) && p.length > 2);
      pdf.setFont("helvetica", isT || isS || isA ? "bold" : "normal");
      pdf.text(w + (last ? "" : " "), cx, yPos);
      cx += pdf.getTextWidth(w + " ");
    }
    yPos += lh;
  }
  pdf.setFont("helvetica", "normal");
  yPos += 4;

  pdf.text(`1. Rent: $${data.rent}`, margin + 4, yPos);
  yPos += hasLetterhead ? 4 : 5;
  let n = 2;
  if (data.proRateRent && data.proRateRent.trim() !== "") {
    pdf.text(`${n}. Prorated Rent: $${data.proRateRent}`, margin + 4, yPos);
    yPos += hasLetterhead ? 4 : 5;
    n++;
  }
  pdf.text(`${n}. Security Deposit: $${data.securityDeposit}`, margin + 4, yPos);
  yPos += sectionSpacing + (hasLetterhead ? 4 : 0);

  pdf.text("The parties agree:", margin, yPos);
  yPos += hasLetterhead ? 9 : 11;

  const clauses = [
    `If the monthly electric bill exceeds $200, the amount over $200 will be divided equally among three occupants, with ${data.tenantName} responsible for his/her share of the excess charge.`,
    `Rent will be paid on the first of the month, if payment is not received by the 3rd of the month a $50 late fee will be applied.`,
    `Both ${data.sublessorName} and ${data.tenantName} will be required to give a 30-day notice period in the event parties want to terminate the agreement earlier.`,
  ];
  const subClauses = [
    `${data.tenantName} must provide 30 days' notice before the end date of the agreement if he/she decides to vacate by the end of the agreement.`,
    `If a 30-day notice is not given security deposit will be forfeited by ${data.tenantName}.`,
    `${data.tenantName} will be charged for a full month's rent in the event the move takes place in the middle of the month.`,
  ];
  const remaining = [
    `Security deposit will be returned within 14 days of moving out.`,
    `Smoking is strictly prohibited within the apartment and building. If you are found smoking in the apartment, a $1,000 fine will be issued.`,
    `${data.tenantName} agrees to adhere to cleanliness standards or additional incurred charges for maid services will be required.`,
    `${data.tenantName} shall pay for all property damage he/she is responsible for in the event something happens during sublease.`,
    `A move out cleaning fee of $100 will be applied.`,
    `A joint inspection of the premises shall be conducted by ${data.sublessorName} and ${data.tenantName} recording any damage or deficiencies that exist as the start of the sublease period.`,
    `${data.tenantName} shall be liable for the cost of any cleaning or repair to correct damages caused by ${data.tenantName} at the end of the period if not recorded at the start of the agreement, normal wear and tears excepted. Security deposit will be refunded after vacating the apartment given there is no damage (except normal wear and tear) found prior to vacating.`,
    `${data.tenantName} must reimburse ${data.sublessorName} for the following fee and expenses incurred by ${data.sublessorName.split(" ")[0]}: Any legal fees and disbursements for the preparation and service of legal notices; legal actions or proceedings brought by ${data.sublessorName} against ${data.tenantName} because of a default by ${data.tenantName} under this agreement; or for defending lawsuits brought against ${data.sublessorName} because of the actions of ${data.tenantName}, or any associates of ${data.tenantName}.`,
  ];

  for (let i = 0; i < clauses.length; i++) {
    yPos = writeBold(pdf, `${1 + i}. ${clauses[i]}`, margin + 4, yPos, contentWidth - 8, data.tenantName, data.sublessorName);
    yPos += clauseSpacing;
    if (i === 2) {
      for (let j = 0; j < subClauses.length; j++) {
        yPos = writeBold(pdf, `${String.fromCharCode(97 + j)}. ${subClauses[j]}`, margin + 12, yPos, contentWidth - 16, data.tenantName, data.sublessorName);
        yPos += hasLetterhead ? 1 : 1.5;
      }
    }
  }
  for (let i = 0; i < remaining.length; i++) {
    yPos = writeBold(pdf, `${4 + i}. ${remaining[i]}`, margin + 4, yPos, contentWidth - 8, data.tenantName, data.sublessorName);
    yPos += clauseSpacing;
  }

  yPos += hasLetterhead ? 3 : 5;
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text("Sublessor: ", margin, yPos);
  pdf.setFont("helvetica", "bold");
  pdf.text(data.sublessorName, margin + pdf.getTextWidth("Sublessor: "), yPos);
  pdf.setFont("helvetica", "normal");
  pdf.text("Date", pageWidth - margin - 25, yPos);
  yPos += 7;
  pdf.text(`${data.sublessorName} ______________`, margin, yPos);
  pdf.text(`________${formatShortDate(data.agreementDate)}___________`, pageWidth - margin - 50, yPos);
  yPos += 10;
  pdf.text("Sublessee: ", margin, yPos);
  pdf.setFont("helvetica", "bold");
  pdf.text(data.tenantName, margin + pdf.getTextWidth("Sublessee: "), yPos);
  pdf.setFont("helvetica", "normal");
  pdf.text("Date", pageWidth - margin - 25, yPos);
  yPos += 7;
  pdf.text("__________________________", margin, yPos);
  pdf.text("________________________", pageWidth - margin - 50, yPos);

  const ab = pdf.output("arraybuffer");
  return new Uint8Array(ab);
}

// ---- Server ----
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Public docs endpoint
  const url = new URL(req.url);
  if (req.method === "GET") {
    return new Response(
      JSON.stringify({
        name: "Hive Sublease Agreement API",
        endpoint: url.origin + url.pathname,
        method: "POST",
        rate_limit: "10 requests per minute per IP",
        body_schema: {
          tenantName: "string (required)",
          sublessorName: "string (required)",
          propertyAddress: "string (required)",
          rent: "string (required) — monthly rent amount",
          proRateRent: "string (optional)",
          securityDeposit: "string (required)",
          leaseStartDate: "ISO date string (required)",
          leaseEndDate: "ISO date string (required)",
          agreementDate: "ISO date string (required)",
          includeLetterhead: "boolean (optional, default true)",
          format: "'pdf' | 'base64' (optional, default 'pdf')",
        },
      }, null, 2),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Rate limit by IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("cf-connecting-ip") ||
    "unknown";
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Max 10 requests per minute." }),
      {
        status: 429,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Retry-After": String(rl.retryAfter),
        },
      },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const bytes = buildPdf(parsed.data);
    const fileName = `${parsed.data.tenantName} Sublease Agreement.pdf`;

    if (parsed.data.format === "base64") {
      let bin = "";
      for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      const b64 = btoa(bin);
      return new Response(
        JSON.stringify({ filename: fileName, mimeType: "application/pdf", base64: b64 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(bytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to generate PDF", message: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
