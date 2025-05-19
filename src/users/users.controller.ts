import { Controller, Get, Post, Body, Param, Delete, UseGuards, HttpCode, Patch } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BulkCreateUsersDto } from './dto/bulk-create-users.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../auth/guard/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../common/enums/role.enum';

@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard) 
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @HttpCode(200)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Returns an array of users' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async findAll() {
    return this.usersService.findAll();
  }  

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.AGENCY_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, description: 'Returns the found user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get('agency/:agencyId')
  @Roles(Role.SUPER_ADMIN, Role.AGENCY_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Get a user by agency ID' })
  @ApiResponse({ status: 200, description: 'Returns the found user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOneByAgencyId(@Param('agencyId') agencyId: string) {
    return this.usersService.findOneByAgencyId(agencyId);
  }

  @Post()
  // @Roles(Role.SUPER_ADMIN) 
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.AGENCY_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, description: 'User successfully updated' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.AGENCY_ADMIN, Role.STAFF)
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 200, description: 'User successfully deleted' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async delete(@Param('id') id: string) { 
    return this.usersService.delete(id);
  }

  @Post('bulk') 
  @Roles(Role.SUPER_ADMIN, Role.AGENCY_ADMIN, Role.STAFF) 
  @ApiOperation({ summary: 'Bulk create users' })
  @ApiResponse({ status: 201, description: 'Users successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
  async bulkCreate(@Body() bulkCreateUsersDto: BulkCreateUsersDto) {
    return this.usersService.bulkCreate(bulkCreateUsersDto);
  }
}