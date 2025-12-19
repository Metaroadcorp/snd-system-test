import { ApiProperty } from '@nestjs/swagger';

export class ApiResponse<T> {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  data?: T;

  @ApiProperty()
  message?: string;

  @ApiProperty()
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };

  constructor(partial: Partial<ApiResponse<T>>) {
    Object.assign(this, partial);
  }

  static success<T>(data: T, message?: string): ApiResponse<T> {
    return new ApiResponse({ success: true, data, message });
  }

  static paginated<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): ApiResponse<T[]> {
    return new ApiResponse({
      success: true,
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  }

  static error(message: string): ApiResponse<null> {
    return new ApiResponse({ success: false, message });
  }
}
