"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { newsApi } from "@/lib/api-service" // Updated path
import { SecureImage } from "@/components/shared/SecureImage"

export function PhotoTest({ newsId }: { newsId: string }) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first")
      return
    }

    setIsUploading(true)
    setError(null)
    setResponse(null)

    try {
      console.log(`Uploading file to news ID ${newsId}:`, file)

      // Display file details
      console.log('File details:', {
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024).toFixed(2)} KB`,
        lastModified: new Date(file.lastModified).toISOString()
      })

      // Log the auth token (masked for security)
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const maskedToken = token.length > 20
            ? `${token.substring(0, 10)}...${token.substring(token.length - 10)}`
            : '***';
          console.log(`Auth token available: ${maskedToken}`);
        } else {
          console.warn('No auth token found in localStorage');
        }
      } catch (e) {
        console.error('Error checking auth token:', e);
      }

      // Attempt to upload the file
      const result = await newsApi.uploadNewsPhoto(newsId, file)
      console.log("Upload result:", result)
      setResponse(result)
    } catch (err: any) {
      console.error("Upload error:", err)

      // Provide more detailed error information
      let errorMessage = "Failed to upload photo. ";

      if (err.message) {
        errorMessage += err.message;
      }

      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage += ` Server responded with status ${err.response.status}: ${JSON.stringify(err.response.data)}`;

        // Log detailed response information
        console.error('Error response details:', {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data,
          headers: err.response.headers
        });
      } else if (err.request) {
        // The request was made but no response was received
        errorMessage += " No response received from server. Check your network connection.";
        console.error('Request details (no response):', err.request);
      }

      setError(errorMessage)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Photo Upload Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="mb-2"
          />
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
          >
            {isUploading ? "Uploading..." : "Upload Photo"}
          </Button>
        </div>

        {error && (
          <div className="p-2 bg-red-50 text-red-700 rounded">
            {error}
          </div>
        )}

        {response && (
          <div className="p-2 bg-green-50 text-green-700 rounded">
            <h3 className="font-bold">Upload Successful</h3>
            <pre className="mt-2 text-xs overflow-auto">
              {JSON.stringify(response, null, 2)}
            </pre>
            {response.photo_url && (
              <div className="mt-2">
                <p className="text-sm mb-1">Photo URL: {response.photo_url}</p>
                <div className="border rounded p-2">
                  <SecureImage
                    src={response.photo_url}
                    alt="Uploaded"
                    width={300}
                    height={200}
                    className="mx-auto"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
