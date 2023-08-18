# nestjs-logtime-decorator
Typescript decorator to log the duration of a method, for NestJs.

## Installation

Install the dependency with:

```sh
npm install nestjs-logtime-decorator
```

## Usage

```ts
import { Body, Controller, Post } from '@nestjs/common';
import { MeasureTimeAsync } from 'nestjs-logtime-decorator';
import { MyResourceService } from './my-resource.service';
import { MyResourceDto } from './dto/my-resource.dto';
import { MyResource } from '@prisma/client';

@Controller('my-resource')
export class MyResourceController {
  @Post()
  @MeasureTimeAsync({ context: [
    { key: 'name', from: 'Request' },
    { key: 'id', from: 'Response' }
  ] })
  async createOne(
    @Body() dto: MyResourceDto,
  ): Promise<MyResource> {
    return this.service.createOne(dto);
  }

  @Get('something')
  @MeasureTime()
  getSomethingSync(): string {
    return this.service.getSomethingSync();
  }
}
```

If POST my-resource is called, it will print:
> [Nest] 24377  - 06/26/2023, 10:52:35 PM     LOG [MyResourceController] [name: foo, id: 1] createOne took 97ms

If GET my-resource/something is called, it will print:
> [Nest] 24377  - 06/26/2023, 10:52:37 PM     LOG [MyResourceController] getSomethingSync took 10ms

If GET my-resource/something is called but throws an error, it will print:
> [Nest] 24377  - 06/26/2023, 10:52:37 PM     LOG [MyResourceController] getSomethingSync (error) took 10ms
