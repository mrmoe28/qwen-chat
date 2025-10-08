"use client";

import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icon } from "@/components/icons";

type User = {
  id: string;
  name: string | null;
  email: string;
  imageUrl: string | null;
};

type ProfileFormData = {
  name: string;
  email: string;
  imageUrl?: string;
};

type ProfileSettingsFormProps = {
  user: User;
  onSave: (data: ProfileFormData) => Promise<{ success: boolean }>;
};

export function ProfileSettingsForm({ user, onSave }: ProfileSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(user.imageUrl);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: user.name || "",
      email: user.email,
      imageUrl: user.imageUrl || "",
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    // For now, we'll use a placeholder. In a real app, you'd upload to a service like:
    // - Cloudinary
    // - AWS S3
    // - Vercel Blob Storage
    // - etc.
    
    // Create a temporary URL for demo purposes
    return URL.createObjectURL(file);
  };

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      let imageUrl = data.imageUrl;
      
      // Upload image if a new one was selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      await onSave({
        ...data,
        imageUrl,
      });
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Profile Picture Section */}
      <div className="space-y-4">
        <Label>Profile Picture</Label>
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={imagePreview || undefined} alt={user.name || "User"} />
            <AvatarFallback className="text-lg font-medium">
              {user.name ? getInitials(user.name) : "U"}
            </AvatarFallback>
          </Avatar>
          
          <div className="space-y-2">
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                ref={fileInputRef}
              />
              <Button 
                variant="outline" 
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                <Icon name="plus" className="h-4 w-4 mr-2" />
                Change Picture
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              JPG, PNG or GIF. Max file size 2MB.
            </p>
          </div>
        </div>
      </div>

      {/* Name Field */}
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          {...register("name", { required: "Name is required" })}
          placeholder="Enter your full name"
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          {...register("email", { 
            required: "Email is required",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Please enter a valid email address"
            }
          })}
          placeholder="Enter your email address"
        />
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={isLoading || !isDirty}
          className="flex items-center gap-2"
        >
          {isLoading && <Icon name="loader" className="h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
}