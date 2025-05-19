import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class BulkCreateUsersDto {
  @ApiProperty({ 
    type: [CreateUserDto],
    description: 'Array of users to create',
    example: [
      {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        role: 'STAFF',
        agencyId: '123e4567-e89b-12d3-a456-426614174000'
      },
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'password456',
        role: 'STAFF',
        agencyId: '123e4567-e89b-12d3-a456-426614174000'
      }
    ]
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateUserDto)
  users: CreateUserDto[];
} 