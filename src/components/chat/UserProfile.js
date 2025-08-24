'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UserProfile({ isOpen, onClose }) {
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      router.push('/profile');
      onClose();
    }
  }, [isOpen, router, onClose]);

  return null;
}
