const API_URL = import.meta.env.VITE_API_URL || "https://meetmind-backend-vdim.onrender.com";

export async function uploadMeeting(formData: FormData) {
  const response = await fetch(`${API_URL}/api/v1/meetings/upload`, {
    method: "POST",
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error("Failed to upload meeting");
  }
  return response.json();
}

export async function uploadFromUrl(payload: {
  url: string;
  title: string;
  participants: string;
  push_notion: boolean;
  push_slack: boolean;
  push_linear: boolean;
}) {
  const response = await fetch(`${API_URL}/api/v1/meetings/upload-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to process URL");
  }
  return response.json();
}

export async function getMeetingStatus(id: string) {
  const response = await fetch(`${API_URL}/api/v1/meetings/${id}/status`);
  
  if (!response.ok) {
    throw new Error("Failed to get meeting status");
  }
  return response.json();
}

export async function getMeetingResult(id: string) {
  const response = await fetch(`${API_URL}/api/v1/meetings/${id}`);
  
  if (!response.ok) {
    throw new Error("Failed to get meeting result");
  }
  return response.json();
}
