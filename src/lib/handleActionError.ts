import { toast } from "sonner";
import { DOMAIN_ERRORS, ErrorCodeType } from "@/lib/constants/domain-errors";
import { UI_ERROR_MESSAGES } from "@/lib/constants/ui-message";

export function handleActionError(errorCode: ErrorCodeType) {
  if (errorCode === DOMAIN_ERRORS.AUTH_UNAUTHORIZED) {
    toast.error(UI_ERROR_MESSAGES[DOMAIN_ERRORS.AUTH_UNAUTHORIZED]);
    window.location.href = "/login";
    return;
  }
  toast.error(UI_ERROR_MESSAGES[errorCode]);
}
