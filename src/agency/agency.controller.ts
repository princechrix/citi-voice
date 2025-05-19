import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { AgencyService } from './agency.service';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { UpdateAgencyDto } from './dto/update-agency.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Agency')
@Controller('agency')
export class AgencyController {
  constructor(private readonly agencyService: AgencyService) {}

  @ApiOperation({ summary: 'Create a new agency' })
  @ApiResponse({ status: 201, description: 'The agency has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @Post()
  create(@Body() createAgencyDto: CreateAgencyDto) {
    return this.agencyService.create(createAgencyDto);
  }



  @ApiOperation({ summary: 'Get all agencies' })
  @ApiResponse({ status: 200, description: 'The list of agencies has been successfully retrieved.' })
  @Get()
  findAll() {
    return this.agencyService.findAll();
  }


  @ApiOperation({ summary: 'Get an agency by ID' })
  @ApiResponse({ status: 200, description: 'The agency has been successfully retrieved.' })
  @ApiResponse({ status: 404, description: 'Agency not found' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.agencyService.findOne(id);
  }

  @ApiOperation({ summary: 'Update an agency by ID' })
  @ApiResponse({ status: 200, description: 'The agency has been successfully updated.' })
  @ApiResponse({ status: 404, description: 'Agency not found' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAgencyDto: UpdateAgencyDto) {
    return this.agencyService.update(id, updateAgencyDto);
  }

  @ApiOperation({ summary: 'Delete an agency by ID' })
  @ApiResponse({ status: 200, description: 'The agency has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Agency not found' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.agencyService.remove(id);
  }
}
