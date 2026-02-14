// services/FileStorageService.ts
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

interface IUpload {
  buffer: Buffer;
  mimeType: string;
  filename: string;
}

export class FileStorageService {
  private supabase;
  private bucket: string;

  constructor() {
    this.bucket = process.env.SUPABASE_BUCKET!;
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }

  async uploadPrivateFile(data: IUpload): Promise<string> {
    const { buffer, mimeType, filename } = data;
    const fileKey = crypto.randomUUID();
    const objectPath = `${fileKey}/${filename}`;

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(objectPath, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) throw error;

    return objectPath; // store this in DB
  }

  async signDownloadUrl(
    fileKey: string,
  ): Promise<{ signedUrl: string; expiresIn: string }> {
    const ttl = 10;
    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .createSignedUrl(fileKey, 60 * ttl); // 10 minutes

    if (error) throw error;

    return { signedUrl: data.signedUrl, expiresIn: `${ttl} minutes` };
  }
}
