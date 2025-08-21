import {
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";

import type { OurFileRouter } from "../../../backend/src/routes/uploadthing";

// Get the backend URL without the /api suffix for UploadThing
const getUploadThingUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const baseUrl = apiUrl.replace('/api', '');
  return `${baseUrl}/api/uploadthing`;
};

export const UploadButton = generateUploadButton<OurFileRouter>({
  url: getUploadThingUrl(),
});

export const UploadDropzone = generateUploadDropzone<OurFileRouter>({
  url: getUploadThingUrl(),
});