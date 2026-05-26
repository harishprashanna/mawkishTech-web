import { ContactFormData } from "./contactSchema";

const HUBSPOT_API = "https://api.hubapi.com/crm/v3/objects/contacts";

const contactProperties = (data: ContactFormData) => ({
  firstname: data.fullName,
  email: data.email,
  phone: data.phone || "",
  company: data.companyName,
  message: data.message,
  service_interest: data.serviceInterest,
});

export async function saveToHubspot(data: ContactFormData) {
  const response = await fetch(HUBSPOT_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({ properties: contactProperties(data) }),
  });

  if (response.ok) return response.json();

  const errorBody = await response.json();

  // Contact already exists — update them instead
  if (errorBody.category === "CONFLICT") {
    const existingId: string = errorBody.message.match(/Existing ID:\s*(\d+)/)?.[1];

    const updateResponse = await fetch(`${HUBSPOT_API}/${existingId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ properties: contactProperties(data) }),
    });

    if (!updateResponse.ok) {
      const updateError = await updateResponse.text();
      throw new Error(updateError);
    }

    return updateResponse.json();
  }

  throw new Error(JSON.stringify(errorBody));
}
