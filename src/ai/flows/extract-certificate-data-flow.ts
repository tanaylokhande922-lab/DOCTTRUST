'use server';
/**
 * @fileOverview A Genkit flow for extracting medical registration data from certificates.
 *
 * - extractCertificateData - A function that extracts medical registration details from a certificate image or PDF.
 * - ExtractCertificateDataInput - The input type for the extractCertificateData function.
 * - ExtractCertificateDataOutput - The return type for the extractCertificateData function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractCertificateDataInputSchema = z.object({
  certificateDataUri: z
    .string()
    .describe(
      "A medical certificate, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>' (can be image or PDF)."
    ),
});
export type ExtractCertificateDataInput = z.infer<
  typeof ExtractCertificateDataInputSchema
>;

const ExtractCertificateDataOutputSchema = z.object({
  medicalRegistrationNumber: z
    .string()
    .describe('The extracted medical registration number.'),
  name: z.string().describe('The extracted full name of the practitioner.'),
  specialization: z
    .string()
    .describe('The extracted specialization of the practitioner.'),
});
export type ExtractCertificateDataOutput = z.infer<
  typeof ExtractCertificateDataOutputSchema
>;

export async function extractCertificateData(
  input: ExtractCertificateDataInput
): Promise<ExtractCertificateDataOutput> {
  return extractCertificateDataFlow(input);
}

const extractCertificateDataPrompt = ai.definePrompt({
  name: 'extractCertificateDataPrompt',
  input: {schema: ExtractCertificateDataInputSchema},
  output: {schema: ExtractCertificateDataOutputSchema},
  prompt: `You are an AI assistant specialized in extracting key information from medical certificates.
Your task is to accurately identify and extract the Medical Registration Number, the full name of the practitioner, and their specialization from the provided document.
The output must strictly adhere to the JSON schema provided.

Document: {{media url=certificateDataUri}}`,
});

const extractCertificateDataFlow = ai.defineFlow(
  {
    name: 'extractCertificateDataFlow',
    inputSchema: ExtractCertificateDataInputSchema,
    outputSchema: ExtractCertificateDataOutputSchema,
  },
  async input => {
    const {output} = await extractCertificateDataPrompt(input);
    if (!output) {
      throw new Error('Failed to extract data from the certificate.');
    }
    return output;
  }
);
