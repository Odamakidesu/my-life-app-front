import React from "react";
import Toast from "react-bootstrap/Toast";
import ToastContainer from "react-bootstrap/ToastContainer";
import { NotificationVariant } from "shared/types/Notifier";

type ToastNotifierProps = {
  message: string;
  variant: NotificationVariant;
  isVisible: boolean;
  onClose: () => void;
};

/** 画面右下に処理結果を知らせるトースト */
const ToastNotifier: React.FC<ToastNotifierProps> = ({
  message,
  variant,
  isVisible,
  onClose,
}) => (
  <ToastContainer position="bottom-end" className="p-3 fixed-toast">
    <Toast
      onClose={onClose}
      show={isVisible}
      delay={2000}
      autohide
      bg={variant}
    >
      <Toast.Body className="text-white">{message}</Toast.Body>
    </Toast>
  </ToastContainer>
);

export default ToastNotifier;
