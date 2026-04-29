// hooks/useToast.js
import { toast } from "sonner";

const useToast = () => {
  const showSuccess = (message) => {
    toast.success(message, {
      icon: "✅",
      description: "Thao tác thành công",
    });
  };

  const showError = (message) => {
    toast.error(message, {
      icon: "❌",
      description: "Vui lòng thử lại",
    });
  };

  const showWarning = (message) => {
    toast.warning(message, {
      icon: "⚠️",
    });
  };

  const showInfo = (message) => {
    toast.info(message, {
      icon: "ℹ️",
    });
  };

  const showPromise = (promise, messages) => {
    return toast.promise(promise, {
      loading: messages.loading || "Đang xử lý...",
      success: messages.success || "Thành công!",
      error: messages.error || "Có lỗi xảy ra",
    });
  };

  const showCustom = (message, options = {}) => {
    toast(message, options);
  };

  const dismiss = () => {
    toast.dismiss();
  };

  return {
    success: showSuccess,
    error: showError,
    warning: showWarning,
    info: showInfo,
    promise: showPromise,
    custom: showCustom,
    dismiss,
  };
};

export default useToast;