import { NextRequest, NextResponse } from "next/server";
import { ContactSchema } from "@/lib/contactSchema";
import { transporter } from "@/lib/mailer";
import { saveToHubspot } from "@/lib/hubspot";
import { z } from 'zod'

export async function POST(req: NextRequest) {
  try {
    // Read JSON body from frontend request
    const body = await req.json();

    // Validate incoming form data using Zod schema
    const validatedData = ContactSchema.parse(body);

    // Save lead to HubSpot CRM
    await saveToHubspot(validatedData);


    // EMAIL TO COMPANY (ADMIN EMAIL)

    await transporter.sendMail({
      // Sender name + email (better deliverability)
      from: `"Mawkish Technologies" <${process.env.SMTP_USER}>`,

      // Company email that receives leads
      to: process.env.CONTACT_RECEIVER,

      subject: `New Contact Form Submission - ${validatedData.fullName}`,

      html: `
        <div style="font-family: Inter, sans-serif; background:#0A1A12; padding:40px; color:white;">
          <h1 style="color:#2E8B65;">New Lead Received</h1>

          <p><strong>Name:</strong> ${validatedData.fullName}</p>
          <p><strong>Company:</strong> ${validatedData.companyName}</p>
          <p><strong>Email:</strong> ${validatedData.email}</p>

          <!-- Safe fallback for optional field -->
          <p><strong>Phone:</strong> ${validatedData.phone || "Not provided"}</p>

          <p><strong>Service:</strong> ${validatedData.serviceInterest}</p>

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

      // USER EMAIL comes directly from form input
      to: validatedData.email,

      subject: "Thank You for Contacting Mawkish Technologies",

      html: `
        <div style="font-family: Inter, sans-serif; background:#0A1A12; padding:40px; color:white;">
          <h1 style="color:#2E8B65;">
            Thank You, ${validatedData.fullName}
          </h1>

          <p>
            We've received your inquiry. Our team will get back to you shortly.
          </p>

          <p style="margin-top:20px; color:#A8C4B4;">
            — Mawkish Technologies Team
          </p>
        </div>
      `,
    });

    // Success response back to frontend
    return NextResponse.json({
      success: true,
      message: "Form submitted successfully",
    });

  } catch (error) {

    if (error instanceof z.ZodError) {
        return NextResponse.json(
            { success: false, message: error.issues[0].message },
            { status: 400 }
    )
  }

    console.error("Contact Form Error:", error);

    // Error response
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Something went wrong",
      },
      { status: 500 }
    );
  }
}
