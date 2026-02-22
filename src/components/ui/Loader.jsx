'use client';

export default function Loader() {
  return (
    <div  className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-lg">
      <div  className="relative">
        {/* Simple spinner */}
        <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    </div>
  );
}
