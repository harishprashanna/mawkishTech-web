import { NextRequest, NextResponse } from "next/server";
import { ContactSchema } from "@/lib/contactSchema";
import { transporter } from "@/lib/mailer";
import { saveToHubspot } from "@/lib/hubspot";
import { z } from "zod";

const intentLabels: Record<string, string> = {
  consultation: "Schedule a Consultation",
  demo: "Request a Demo",
  proposal: "Request a Proposal",
};

function formatIntent(intent?: string) {
  if (!intent) return "Not specified";
  return intentLabels[intent] || intent;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.ALLOWED_ORIGIN || "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = ContactSchema.parse(body);

    await saveToHubspot(validatedData);

    // EMAIL TO COMPANY (ADMIN EMAIL)
    await transporter.sendMail({
      from: `"Mawkish Technologies" <${process.env.SMTP_USER}>`,
      to: process.env.CONTACT_RECEIVER,
      subject: `New ${formatIntent(validatedData.intent)} — ${validatedData.name}`,
      html: `
        <div style="font-family: Inter, sans-serif; background:#0A1A12; padding:40px; color:white;">
          <h1 style="color:#2E8B65;">New Lead Received</h1>
          <p><strong>Name:</strong> ${validatedData.name}</p>
          <p><strong>Company:</strong> ${validatedData.company || "Not provided"}</p>
          <p><strong>Email:</strong> ${validatedData.email}</p>
          <p><strong>Interested in:</strong> ${formatIntent(validatedData.intent)}</p>
          <div style="margin-top:20px;">
            <h3 style="color:#A8C4B4;">Message</h3>
            <p>${validatedData.message}</p>
          </div>
        </div>
      `,
    });

    // CONFIRMATION EMAIL TO USER
    await transporter.sendMail({
      from: `"Mawkish Technologies" <${process.env.SMTP_USER}>`,
      to: validatedData.email,
      subject: `We've received your request — ${formatIntent(validatedData.intent)}`,
      html: `
        <div style="font-family: Inter, sans-serif; background:#0A1A12; padding:40px; color:white;">
          <h1 style="color:#2E8B65;">Thank You, ${validatedData.name}</h1>
          <p>We've received your request to <strong>${formatIntent(validatedData.intent)}</strong>. Our team will get back to you shortly.</p>
          <p style="margin-top:20px; color:#A8C4B4;">— Mawkish Technologies Team</p>
        </div>
      `,
    });

    return NextResponse.json(
      { success: true, ok: true, message: "Form submitted successfully" },
      { headers: corsHeaders }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      const msg = error.issues[0].message;
      return NextResponse.json(
        { success: false, error: msg, message: msg },
        { status: 400, headers: corsHeaders }
      );
    }

    console.error("Contact Form Error:", error);
    const msg = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json(
      { success: false, error: msg, message: msg },
      { status: 500, headers: corsHeaders }
    );
  }
}