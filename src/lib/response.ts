// =============================================
// Module: Response Helpers
// Chuẩn hóa format response API
// =============================================

export function ok<T>(data: T, message?: string) {
  return { success: true, message: message ?? 'OK', data }
}

export function err(message: string, code?: number) {
  return { success: false, message, code }
}

export function paginate<T>(items: T[], total: number, page: number, limit: number) {
  return {
    success: true,
    data: items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }
}
