import Image from "next/image";
import Button from "./ui/Button";

export default function ImagePreviewModal({ open, image, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
      <img
        src={image}
        width={800}
        height={600}
        alt="Preview"
        className="max-h-[90%] max-w-[90%] rounded-lg"
      />

      <Button
        onClick={onClose}
        className={"absolute top-6 right-6 text-white text-2xl cursor-pointer"}
      >
        ✕
      </Button>
    </div>
  );
}
