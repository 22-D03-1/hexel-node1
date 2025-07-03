'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Use a proper URL with protocol
    window.location.href = 'https://hexel-tech.de';
    // OR use router.replace with a relative path if redirecting within the app
    // router.replace('/some-internal-path');
  }, [router]);
  
  return null;
}
