import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

const contractTermsSchema = z.object({
  scope: z.string().describe("Detailed scope of work"),
  deliverables: z.array(z.string()).describe("List of expected deliverables"),
  timeline: z.string().describe("Estimated timeline for completion"),
  revisionPolicy: z.string().describe("Policy on revision requests"),
  cancellationPolicy: z.string().describe("Cancellation and refund terms"),
  intellectualProperty: z.string().describe("IP ownership terms"),
  confidentiality: z.string().describe("Confidentiality obligations"),
});

export async function generateContractTerms(input: {
  projectTitle: string;
  projectDescription: string;
  developerName: string;
  clientName: string;
  totalAmount: number;
  currency: string;
}) {
  const { object: terms } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: contractTermsSchema,
    prompt: `Generate professional contract terms for a freelance AI development project.

Project: ${input.projectTitle}
Description: ${input.projectDescription}
Developer: ${input.developerName}
Client: ${input.clientName}
Amount: ${input.currency} ${input.totalAmount}

Generate clear, fair terms covering scope, deliverables, timeline, revision policy, cancellation, IP, and confidentiality.
Keep each section to 2-3 sentences. Be specific but concise.`,
  });

  return terms;
}
