export const placeholderImageDataUrl =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#0b0b12"/>
          <stop offset="1" stop-color="#10101a"/>
        </linearGradient>
      </defs>
      <rect width="800" height="600" fill="url(#g)"/>
      <rect x="40" y="40" width="720" height="520" rx="24" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)"/>
      <path d="M180 410l120-140 110 120 90-90 140 170H180z" fill="rgba(34,211,238,0.18)"/>
      <circle cx="310" cy="230" r="44" fill="rgba(244,114,182,0.18)"/>
      <text x="400" y="500" text-anchor="middle" font-family="ui-sans-serif, system-ui" font-size="28" fill="rgba(255,255,255,0.72)">
        PC-Center
      </text>
      <text x="400" y="535" text-anchor="middle" font-family="ui-sans-serif, system-ui" font-size="14" fill="rgba(255,255,255,0.45)">
        нет изображения
      </text>
    </svg>`
  );

