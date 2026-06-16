//notifikasi toast dipakai sebagai pengganti window.confirm()
import { toast } from 'sonner';

export const confirmToast = (message, onConfirm, options = {}) => {
  const { description, confirmLabel = 'Hapus' } = options;

  toast(message, {
    description,
    duration: 10000,
    action: {
      label: confirmLabel,
      onClick: onConfirm,
    },
    actionButtonStyle: {
      backgroundColor: '#EF4444',
      color: '#FFFFFF',
    },
    cancel: {
      label: 'Batal',
      onClick: () => {},
    },
    cancelButtonStyle: {
      backgroundColor: 'transparent',
      color: '#A67C5B',
      border: '1px solid #E8D9C8',
    },
  });
};