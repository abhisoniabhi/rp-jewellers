import React, { useState } from "react";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/ui/file-upload";
import { Control } from "react-hook-form";

interface ImageUploadFieldProps {
  control: Control<any>;
  name: string;
}

export function ImageUploadField({ control, name }: ImageUploadFieldProps) {
  const { toast } = useToast();
  
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const [uploadMode, setUploadMode] = useState<'url' | 'upload'>('url');
        
        // Handle file upload completion from the FileUpload component
        const handleFileUploaded = (fileUrl: string) => {
          field.onChange(fileUrl);
          toast({
            title: "Image Uploaded",
            description: "Image was successfully uploaded"
          });
        };
        
        return (
          <FormItem>
            <FormLabel className="text-amber-900">Product Image</FormLabel>
            
            <div className="flex items-center mb-2 space-x-2">
              <Button 
                type="button" 
                variant={uploadMode === 'url' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUploadMode('url')}
                className={uploadMode === 'url' ? 'bg-amber-600' : 'border-amber-200'}
              >
                <ImageIcon className="h-3.5 w-3.5 mr-1" /> URL
              </Button>
              <Button 
                type="button" 
                variant={uploadMode === 'upload' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUploadMode('upload')}
                className={uploadMode === 'upload' ? 'bg-amber-600' : 'border-amber-200'}
              >
                <Upload className="h-3.5 w-3.5 mr-1" /> Upload
              </Button>
            </div>
            
            <FormControl>
              {uploadMode === 'url' ? (
                <Input 
                  {...field}
                  placeholder="https://example.com/image.jpg" 
                  className="border-amber-200 focus-visible:ring-amber-500"
                />
              ) : (
                <FileUpload onFileUploaded={handleFileUploaded} />
              )}
            </FormControl>
            
            {field.value && (
              <div className="mt-4 border border-amber-200 rounded-md overflow-hidden">
                <img 
                  src={field.value} 
                  alt="Selected product" 
                  className="w-full h-auto max-h-48 object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/src/assets/rp-logo.jpg"; // fallback image
                  }}
                />
              </div>
            )}
            
            <FormDescription className="text-amber-600/70">
              {uploadMode === 'url' 
                ? "Enter a URL for the product image" 
                : "Upload an image for the product"
              }
            </FormDescription>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}