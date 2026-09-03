"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function UploadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const payload = {
      projectId: Number(formData.get("projectId")),
      owner: formData.get("owner"),
      dateRecorded: formData.get("dateRecorded"),
      place: formData.get("place"),
      uploadedBy: "employee-test", // hardcoded for now, real auth comes later
    };

    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      router.push("/dashboard");
    } else {
      setError(data.error);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Upload Document</CardTitle>
          <CardDescription>Enter the document details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectId">Project</Label>
              <Select name="projectId" required>
                <SelectTrigger id="projectId">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Medical Bills (Acme Corp)</SelectItem>
                  <SelectItem value="2">Contracts (Acme Corp)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner">Owner</Label>
              <Input id="owner" name="owner" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateRecorded">Date</Label>
              <Input id="dateRecorded" name="dateRecorded" type="date" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="place">Place</Label>
              <Input id="place" name="place" required />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving..." : "Save Document"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}