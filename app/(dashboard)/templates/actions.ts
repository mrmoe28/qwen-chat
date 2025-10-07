"use server";

import { redirect } from "next/navigation";
import { getCurrentWorkspace } from "@/lib/auth";
import { createCustomTemplate, type CreateTemplateData } from "@/lib/services/template-service";

export async function createCustomTemplateAction(data: CreateTemplateData) {
  const workspaceData = await getCurrentWorkspace();
  
  try {
    const template = await createCustomTemplate(workspaceData.workspace.id, data);
    
    // Redirect to invoice creation with the new template
    redirect(`/invoices/new?template=${template.id}`);
  } catch (error) {
    console.error("Error creating custom template:", error);
    throw new Error("Failed to create custom template");
  }
}