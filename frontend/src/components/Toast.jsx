import { useEffect } from "react";
import { pageStyles } from "../styles/shared";

export default function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div style={pageStyles.toast} role="alert">
      {message}
    </div>
  );
}
