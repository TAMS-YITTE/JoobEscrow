'use client';

import { useState } from 'react';
import styles from '../app/(marketing)/marketing.module.css';

// Miniature cliquable : YouTube (version sans cookies) n'est charge qu'au clic.
export default function LiteYouTube({ id, title }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className={styles.videoFrame}>
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      ) : (
        <button type="button" className={styles.videoPoster} onClick={() => setPlaying(true)} aria-label={`Play video: ${title}`}>
          <img src={`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`} alt="" loading="lazy" />
          <span className={styles.videoPlay} aria-hidden="true">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          </span>
          <span className={styles.videoLabel}>{title} · 45s</span>
        </button>
      )}
    </div>
  );
}
