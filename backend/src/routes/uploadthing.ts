import { createUploadthing, type FileRouter } from "uploadthing/express";
import jwt from 'jsonwebtoken';

const f = createUploadthing();

export const uploadRouter = {
  // Image uploads for tasks
  imageUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 5,
    },
  })
    .middleware(async ({ req }) => {
      // Extract token from Authorization header
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        throw new Error("Access token required");
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error("Server configuration error");
      }

      try {
        const decoded = jwt.verify(token, secret) as any;
        return { 
          userId: decoded.userId,
          userEmail: decoded.email 
        };
      } catch (err) {
        throw new Error("Invalid or expired token");
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Image upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      
      // You can save file info to database here
      return { uploadedBy: metadata.userId as number, fileUrl: file.url };
    }),

  // PDF uploads for tasks
  pdfUploader: f({
    pdf: {
      maxFileSize: "16MB",
      maxFileCount: 3,
    },
  })
    .middleware(async ({ req }) => {
      // Extract token from Authorization header
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      
      if (!token) {
        throw new Error("Access token required");
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error("Server configuration error");
      }

      try {
        const decoded = jwt.verify(token, secret) as any;
        return { 
          userId: decoded.userId,
          userEmail: decoded.email 
        };
      } catch (err) {
        throw new Error("Invalid or expired token");
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("PDF upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      
      return { uploadedBy: metadata.userId as number, fileUrl: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;