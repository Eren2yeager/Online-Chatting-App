'use client';

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/");
        return;
    }
    const go = async () => {
      let handle = session?.user?.handle;
      if (!handle) {
        try {
          const res = await fetch("/api/users/profile");
          if (res.ok) {
            const data = await res.json();
            handle = data?.handle;
          }
        } catch {}
      }
      if (handle) router.replace(`/profile/${handle}`);
    };
    if (status === "authenticated") go();
  }, [status, session?.user?.handle, router]);

  return null;
}


