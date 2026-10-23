"use client";

import { useEffect, useRef } from "react";

export default function useModal(onClose: () => void) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current!;
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  const dismiss = () => {
    dialog.current?.close();
    onClose();
  };
  return { dialog, dismiss };
}
