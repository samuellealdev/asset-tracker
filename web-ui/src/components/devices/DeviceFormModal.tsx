import { Modal } from "@/components/shared/Modal";
import { DeviceForm } from "@/components/devices/DeviceForm";
import type { Device, CreateDeviceInput } from "@/lib/schemas/device";

interface DeviceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  device?: Device;
  onSubmit: (input: CreateDeviceInput) => Promise<void>;
  isPending: boolean;
}

export function DeviceFormModal({
  isOpen,
  onClose,
  device,
  onSubmit,
  isPending,
}: DeviceFormModalProps) {
  const title = device ? `Edit ${device.name}` : "Create Device";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <DeviceForm
        device={device}
        onSubmit={onSubmit}
        isPending={isPending}
        onCancel={onClose}
      />
    </Modal>
  );
}
