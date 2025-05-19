// cloudinary.service.ts

import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryResponse } from './cloudnary/cloudnary-response';
import * as streamifier from 'streamifier';
import { Readable } from 'stream';
import { PrismaService } from '../prisma/prisma.service';

type StreamifierModule = {
  createReadStream(buffer: Buffer): Readable;
};

@Injectable()
export class CloudinaryService {
  constructor(private readonly prisma: PrismaService) {}

  private isValidFile(file: unknown): file is { buffer: Buffer; originalname: string } {
    if (!file || typeof file !== 'object') return false;
    const fileObj = file as { buffer?: unknown; originalname?: unknown };
    return Buffer.isBuffer(fileObj.buffer) && typeof fileObj.originalname === 'string';
  }

  async uploadFile(file: Express.Multer.File): Promise<CloudinaryResponse> {
    if (!this.isValidFile(file)) {
      throw new Error('Invalid file');
    }

    return new Promise<CloudinaryResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        (error, result) => {
          if (error) {
            reject(new Error(error.message));
            return;
          }
          if (!result) {
            reject(new Error('Upload failed'));
            return;
          }

          // Save file information to database
          this.prisma.$queryRaw`
            INSERT INTO "File" (id, filename, url, "createdAt", "updatedAt")
            VALUES (gen_random_uuid(), ${file.originalname}, ${result.secure_url}, NOW(), NOW())
          `.then(() => {      
            resolve(result as CloudinaryResponse);
          }).catch((err: Error) => {
            reject(new Error(`Database error: ${err.message}`));
          });
        },
      );

      const readable = (streamifier as unknown as StreamifierModule).createReadStream(file.buffer);
      readable.pipe(uploadStream);
    });
  }
}
