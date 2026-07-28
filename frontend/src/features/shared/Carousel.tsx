import { useEffect, useState } from "react";
import { isExternal } from "../../utils/whatsapp";
import type { Banner } from "../../types/config";

export function Carousel({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = useState(0);
  const total = banners.length;

  useEffect(() => {
    if (total < 2) return;
    const timer = setInterval(() => setCurrent((c) => (c + 1) % total), 6000);
    return () => clearInterval(timer);
  }, [total, current]);

  if (total === 0) return null;

  const go = (i: number) => setCurrent(((i % total) + total) % total);

  return (
    <div className="carousel" aria-label="Destaques">
      <div className="slides" style={{ transform: `translateX(-${current * 100}%)` }}>
        {banners.map((b, i) => (
          <a
            key={i}
            className="slide"
            href={b.link || "#"}
            {...(isExternal(b.link) ? { target: "_blank", rel: "noreferrer" } : {})}
          >
            <img src={b.img} alt={b.alt || "Banner"} />
          </a>
        ))}
      </div>
      {total > 1 && (
        <>
          <button className="carousel-btn prev" aria-label="Banner anterior" onClick={() => go(current - 1)}>
            ‹
          </button>
          <button className="carousel-btn next" aria-label="Próximo banner" onClick={() => go(current + 1)}>
            ›
          </button>
          <div className="dots">
            {banners.map((_, i) => (
              <button
                key={i}
                className={`dot ${i === current ? "active" : ""}`}
                aria-label={`Banner ${i + 1}`}
                onClick={() => go(i)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
