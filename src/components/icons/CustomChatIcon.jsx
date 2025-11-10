import Image from 'next/image';

/**
 * Custom chat icon component using the app's transparent logo
 * Replaces ChatBubbleLeftRightIcon from Heroicons
 */
export default function CustomChatIcon({ className = "h-6 w-6" }) {
  return (
    <div className={`relative ${className}`}>
      <Image
        src="/transparent.png"
        alt="Chat"
        fill
        className="object-contain rounded-2xl"
        sizes="(max-width: 768px) 100vw, 50vw"
      />
    </div>
  );
}
