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
      try {
        // Extract token from Authorization header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
          console.error('UploadThing: No token provided');
          throw new Error("Access token required");
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
          console.error('UploadThing: JWT_SECRET not configured');
          throw new Error("Server configuration error");
        }

        const decoded = jwt.verify(token, secret) as any;
        console.log('UploadThing: Token verified for user:', decoded.userId);
        
        return { 
          userId: decoded.userId,
          userEmail: decoded.email 
        };
      } catch (err) {
        console.error('UploadThing middleware error:', err);
        throw new Error("Authentication failed");
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
      try {
        // Extract token from Authorization header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
          console.error('UploadThing: No token provided');
          throw new Error("Access token required");
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
          console.error('UploadThing: JWT_SECRET not configured');
          throw new Error("Server configuration error");
        }

        const decoded = jwt.verify(token, secret) as any;
        console.log('UploadThing: Token verified for user:', decoded.userId);
        
        return { 
          userId: decoded.userId,
          userEmail: decoded.email 
        };
      } catch (err) {
        console.error('UploadThing middleware error:', err);
        throw new Error("Authentication failed");
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("PDF upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      
      return { uploadedBy: metadata.userId as number, fileUrl: file.url };
    }),

  // General file uploader for attachments
  fileUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 10 },
    pdf: { maxFileSize: "16MB", maxFileCount: 5 },
    text: { maxFileSize: "1MB", maxFileCount: 10 },
    blob: { maxFileSize: "8MB", maxFileCount: 10 }
  })
    .middleware(async ({ req }) => {
      try {
        // Extract token from Authorization header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
          console.error('UploadThing: No token provided');
          throw new Error("Access token required");
        }

        const secret = process.env.JWT_SECRET;
        if (!secret) {
          console.error('UploadThing: JWT_SECRET not configured');
          throw new Error("Server configuration error");
        }

        const decoded = jwt.verify(token, secret) as any;
        console.log('UploadThing: Token verified for user:', decoded.userId);
        
        return { 
          userId: decoded.userId,
          userEmail: decoded.email 
        };
      } catch (err) {
        console.error('UploadThing middleware error:', err);
        throw new Error("Authentication failed");
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("File upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      
      return { uploadedBy: metadata.userId as number, fileUrl: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof uploadRouter;