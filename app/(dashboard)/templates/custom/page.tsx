"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/icons";
import { createCustomTemplateAction } from "../actions";

const customTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().min(1, "Template description is required"),
  category: z.string().min(1, "Category is required"),
  defaultNotes: z.string(),
  defaultCurrency: z.string().min(3, "Currency must be 3 characters").max(3),
  defaultLineItems: z.array(z.object({
    description: z.string().min(1, "Line item description is required"),
    quantity: z.number().min(1, "Quantity must be at least 1"),
  })).min(1, "At least one line item is required"),
});

type CustomTemplateFormValues = z.infer<typeof customTemplateSchema>;

const categories = [
  "General",
  "Services", 
  "Products",
  "Subscription",
  "Deposits",
  "Simple",
  "Custom",
];

const categoryColors = {
  General: "default",
  Services: "secondary", 
  Products: "outline",
  Subscription: "success",
  Deposits: "warning",
  Simple: "outline",
  Custom: "destructive",
} as const;

export default function CustomTemplatePage() {
  const router = useRouter();
  const [isPreviewMode, setIsPreviewMode] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);

  const form = useForm<CustomTemplateFormValues>({
    resolver: zodResolver(customTemplateSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "Custom",
      defaultNotes: "Thank you for your business! Payment is due within 30 days.",
      defaultCurrency: "USD",
      defaultLineItems: [
        {
          description: "Service or Product Description",
          quantity: 1,
        },
      ],
    },
  });

  const { control, handleSubmit, watch, register, formState } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "defaultLineItems" });

  const watchedValues = watch();

  const onSubmit = async (values: CustomTemplateFormValues) => {
    setIsSaving(true);
    try {
      await createCustomTemplateAction({
        name: values.name,
        description: values.description,
        category: values.category,
        defaultNotes: values.defaultNotes,
        defaultCurrency: values.defaultCurrency,
        defaultLineItems: values.defaultLineItems,
      });
      // The action will redirect to the invoice creation page
    } catch (error) {
      console.error("Error saving template:", error);
      setIsSaving(false);
    }
  };

  const addLineItem = () => {
    append({ 
      description: "Service or Product Description", 
      quantity: 1,
    });
  };

  const removeLineItem = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  if (isPreviewMode) {
    return (
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setIsPreviewMode(false)}>
              ← Back to Builder
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Template Preview</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={categoryColors[watchedValues.category as keyof typeof categoryColors]}>
                  {watchedValues.category}
                </Badge>
                <span className="text-sm text-muted-foreground">{watchedValues.description}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsPreviewMode(false)}>
              Edit Template
            </Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save & Use Template"}
            </Button>
          </div>
        </div>

        {/* Invoice Preview */}
        <Card className="max-w-4xl mx-auto">
          <CardContent className="p-8">
            <div className="space-y-8">
              {/* Header Section */}
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">Your Company Name</h2>
                      <p className="text-sm text-gray-600">{watchedValues.name}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>123 Business Street</p>
                    <p>City, State 12345</p>
                    <p>contact@yourcompany.com</p>
                    <p>(555) 123-4567</p>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <h1 className="text-3xl font-bold text-primary">INVOICE</h1>
                  <div className="text-sm text-gray-600">
                    <p><span className="font-medium">Invoice #:</span> INV-001</p>
                    <p><span className="font-medium">Date:</span> {new Date().toLocaleDateString()}</p>
                    <p><span className="font-medium">Due Date:</span> {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Bill To Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Bill To:</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900">Customer Name</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Customer Address</p>
                    <p>City, State 67890</p>
                    <p>customer@email.com</p>
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Items</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr className="text-left">
                        <th className="px-4 py-3 text-sm font-medium text-gray-900">Description</th>
                        <th className="px-4 py-3 text-sm font-medium text-gray-900 text-center">Qty</th>
                        <th className="px-4 py-3 text-sm font-medium text-gray-900 text-right">Unit Price</th>
                        <th className="px-4 py-3 text-sm font-medium text-gray-900 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {watchedValues.defaultLineItems.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-4">
                            <p className="font-medium text-gray-900">{item.description}</p>
                          </td>
                          <td className="px-4 py-4 text-center">{item.quantity}</td>
                          <td className="px-4 py-4 text-right">$0.00</td>
                          <td className="px-4 py-4 text-right font-medium">$0.00</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="w-96 space-y-2">
                  <div className="flex justify-between py-3 border-t-2 border-primary font-bold text-lg text-primary">
                    <span>Total:</span>
                    <span>$0.00</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {watchedValues.defaultNotes && (
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
                  <div className="text-sm text-gray-600">
                    <p>{watchedValues.defaultNotes}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-2xl">Build Custom Template</CardTitle>
            <CardDescription>
              Create a custom invoice template with your own line items, notes, and branding
            </CardDescription>
          </div>
          <Button variant="outline" asChild>
            <Link href="/templates">← Back to Templates</Link>
          </Button>
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
          {/* Template Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Template Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Template Name</Label>
                <Input 
                  id="name"
                  placeholder="e.g., My Custom Invoice Template"
                  {...register("name")}
                />
                {formState.errors.name && (
                  <p className="text-xs text-destructive">{formState.errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description"
                  placeholder="Describe what this template is for..."
                  rows={2}
                  {...register("description")}
                />
                {formState.errors.description && (
                  <p className="text-xs text-destructive">{formState.errors.description.message}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={form.watch("category")} 
                    onValueChange={(value) => form.setValue("category", value)}
                  >
                    <SelectTrigger id="category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultCurrency">Default Currency</Label>
                  <Input 
                    id="defaultCurrency"
                    placeholder="USD"
                    maxLength={3}
                    {...register("defaultCurrency")}
                  />
                  {formState.errors.defaultCurrency && (
                    <p className="text-xs text-destructive">{formState.errors.defaultCurrency.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="defaultNotes">Default Notes</Label>
                <Textarea 
                  id="defaultNotes"
                  placeholder="Payment terms, thanks, etc."
                  rows={3}
                  {...register("defaultNotes")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Template Preview Card */}
          <Card>
            <CardHeader>
              <CardTitle>Template Preview</CardTitle>
              <CardDescription>
                See how your template will look
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{watchedValues.name || "Template Name"}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {watchedValues.description || "Template description..."}
                      </p>
                    </div>
                    <Badge variant={categoryColors[watchedValues.category as keyof typeof categoryColors]}>
                      {watchedValues.category}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Default Line Items:</p>
                  <div className="space-y-1">
                    {watchedValues.defaultLineItems?.map((item, index) => (
                      <div key={index} className="text-xs p-2 bg-muted/50 rounded">
                        {item.quantity}x {item.description}
                      </div>
                    )) || <p className="text-xs text-muted-foreground">No line items yet</p>}
                  </div>
                </div>

                <Button 
                  type="button" 
                  className="w-full" 
                  onClick={() => setIsPreviewMode(true)}
                  disabled={!watchedValues.name || !watchedValues.description}
                >
                  Full Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Default Line Items */}
        <Card>
          <CardHeader>
            <CardTitle>Default Line Items</CardTitle>
            <CardDescription>
              Set up the default items that will appear when someone uses this template
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg border border-border/60 px-3 py-2 text-xs font-medium uppercase text-muted-foreground">
              <span>Description</span>
              <span className="text-center">Qty</span>
              <span className="sr-only">Actions</span>
            </div>
            <div className="space-y-3">
              {fields.map((field, index) => (
                <div 
                  key={field.id} 
                  className="grid grid-cols-[1fr_auto_auto] items-center gap-3 rounded-lg border border-border/60 px-3 py-3"
                >
                  <Textarea
                    rows={2}
                    placeholder="Describe the service or product"
                    {...register(`defaultLineItems.${index}.description` as const)}
                  />
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    className="w-20 text-center"
                    {...register(`defaultLineItems.${index}.quantity` as const, { valueAsNumber: true })}
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => removeLineItem(index)}
                    disabled={fields.length === 1}
                    aria-label="Remove line item"
                  >
                    <Icon name="x" className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
            {formState.errors.defaultLineItems && (
              <p className="text-xs text-destructive">{formState.errors.defaultLineItems.message}</p>
            )}
            <Button type="button" variant="secondary" onClick={addLineItem} className="gap-2">
              Add Line Item
            </Button>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSaving}>
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setIsPreviewMode(true)}
            disabled={!watchedValues.name || !watchedValues.description}
          >
            Preview
          </Button>
          <Button type="submit" disabled={isSaving} className="gap-2">
            {isSaving ? "Saving..." : "Save & Use Template"}
          </Button>
        </div>
      </form>
    </div>
  );
}