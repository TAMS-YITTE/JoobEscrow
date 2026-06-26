'use client';

import { useEffect } from 'react';

export default function CrispChat() {
  useEffect(() => {
    // Only initialize once
    if (window.$crisp) return;
    
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID || "7f5a4ba6-6c8c-4c27-bc3a-651fe7a79755";
    (function () {
      const d = document;
      const s = d.createElement("script");
      s.src = "https://client.crisp.chat/l.js";
      s.async = 1;
      d.getElementsByTagName("head")[0].appendChild(s);
    })();
  }, []);

  return null;
}
