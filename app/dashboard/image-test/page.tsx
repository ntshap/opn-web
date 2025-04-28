"use client";

import { useState } from 'react';
import { SecureImage } from '@/components/shared/SecureImage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatImageUrl } from '@/lib/image-utils';

export default function ImageTestPage() {
  const [imageUrl, setImageUrl] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState('');

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus('Uploading...');

    try {
      // Create a FormData object
      const formData = new FormData();
      formData.append('files', file);

      // Use the news upload endpoint for testing
      const response = await fetch('/api/v1/uploads/news/1/photos', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Upload response:', data);

      if (data.uploaded_files && data.uploaded_files.length > 0) {
        const uploadedUrl = data.uploaded_files[0];
        setUploadedImage(uploadedUrl);
        setUploadStatus('Upload successful!');
      } else {
        setUploadStatus('Upload completed but no URL returned');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus(`Upload failed: ${error.message}`);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Image Authentication Test</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Existing Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter image URL"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={() => setImageUrl('')}>Clear</Button>
              </div>

              {imageUrl && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Formatted URL: {formatImageUrl(imageUrl)}
                  </p>
                  <div className="border rounded-md p-4">
                    <SecureImage
                      src={imageUrl}
                      alt="Test image"
                      width={300}
                      height={200}
                      className="mx-auto"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload New Image</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
              />

              {uploadStatus && (
                <p className="text-sm font-medium">
                  Status: {uploadStatus}
                </p>
              )}

              {uploadedImage && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground break-all">
                    Uploaded URL: {uploadedImage}
                  </p>
                  <div className="border rounded-md p-4">
                    <SecureImage
                      src={uploadedImage}
                      alt="Uploaded image"
                      width={300}
                      height={200}
                      className="mx-auto"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
