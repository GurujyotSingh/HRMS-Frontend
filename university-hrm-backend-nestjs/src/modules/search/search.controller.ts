import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Search') @ApiBearerAuth() @Controller('search')
export class SearchController {
  constructor(private svc: SearchService) {}

  @Get() @ApiOperation({ summary: 'Global search (CMD+K)' })
  search(@Query('q') query: string, @CurrentUser() user: Record<string, unknown>) {
    return this.svc.globalSearch(query, user as never);
  }
}
