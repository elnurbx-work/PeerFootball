export type ApiResponse<T = unknown> =
  | {
      ok: true;
      message: string;
      data?: T;
    }
  | {
      ok: false;
      message: string;
      issues?: Record<string, string[] | undefined>;
    };
