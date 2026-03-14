import type { APIContext } from 'astro';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 响应工具类
export class ResponseUtils {
  static success<T>(data?: T, message?: string): Response {
    return new Response(
      JSON.stringify({
        success: true,
        data,
        message,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  static error(error: string, status: number = 400): Response {
    return new Response(
      JSON.stringify({
        success: false,
        error,
      }),
      {
        status,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  static notFound(message: string = '资源不存在'): Response {
    return new Response(
      JSON.stringify({
        success: false,
        error: message,
      }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  static unauthorized(message: string = '未授权访问'): Response {
    return new Response(
      JSON.stringify({
        success: false,
        error: message,
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  static forbidden(message: string = '禁止访问'): Response {
    return new Response(
      JSON.stringify({
        success: false,
        error: message,
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  static serverError(message: string = '服务器错误'): Response {
    return new Response(
      JSON.stringify({
        success: false,
        error: message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// 分页工具类
export class PaginationUtils {
  static createPaginationResponse<T>(
    items: T[],
    page: number,
    limit: number,
    total: number
  ): {
    items: T[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  } {
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }
}

// 日志工具
export class Logger {
  static logRequest(context: APIContext, message: string): void {
    const timestamp = new Date().toISOString();
    const method = context.request.method;
    const url = context.request.url;
    console.log(`[${timestamp}] ${method} ${url} - ${message}`);
  }

  static logError(error: Error, context?: string): void {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR${context ? ` [${context}]` : ''}:`, error);
  }
}

// 错误处理中间件
export function withErrorHandling(
  handler: (context: APIContext) => Promise<Response>
) {
  return async (context: APIContext): Promise<Response> => {
    try {
      return await handler(context);
    } catch (error) {
      Logger.logError(error as Error, `${context.request.method} ${context.request.url}`);

      return ResponseUtils.serverError('服务器内部错误');
    }
  };
}

// 请求日志中间件
export function withLogging(
  handler: (context: APIContext) => Promise<Response>
) {
  return async (context: APIContext): Promise<Response> => {
    Logger.logRequest(context, 'Incoming request');
    const response = await handler(context);
    Logger.logRequest(context, `Response: ${response.status}`);
    return response;
  };
}
