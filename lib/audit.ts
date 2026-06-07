import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";

export interface AuditEntry {
  adminId: string;
  action: string;
  targetType?: string;
  targetId?: string | number;
  detail?: string;
}

/**
 * Records a sensitive admin action to the audit log. Best-effort:
 * logging failures never block the underlying operation.
 */
export async function logAdminAction(entry: AuditEntry): Promise<void> {
  try {
    const admin = getSupabaseAdminClient();
    await admin.from("admin_audit_log").insert({
      admin_id: entry.adminId,
      action: entry.action,
      target_type: entry.targetType ?? "",
      target_id: entry.targetId != null ? String(entry.targetId) : "",
      detail: entry.detail ?? "",
    });
  } catch {
    /* swallow — auditing must not break the request */
  }
}
