import { Module } from '@nestjs/common';
import { CloudinaryService } from './file.service';
import { CloudinaryProvider } from './cloudnary/cloudnary';
import { FileController } from './file.controller';

@Module({
  providers: [CloudinaryService, CloudinaryProvider],
  controllers: [FileController],
  exports: [CloudinaryService, CloudinaryProvider],
})
export class FileModule {}
