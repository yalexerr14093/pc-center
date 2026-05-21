import { Link } from "react-router-dom";
import type { Product } from "../types";
import { formatRub } from "../lib/format";
import { placeholderImageDataUrl } from "../lib/placeholderImage";
import { resolveAssetUrl } from "../lib/api";

const categoryLabel: Record<Product["category"], string> = {
  CPU: "Процессор",
  GPU: "Видеокарта",
  MOTHERBOARD: "Материнская плата",
  RAM: "ОЗУ",
  SSD: "SSD"
};

export function ProductCard({ product }: { product: Product }) {
  const src = resolveAssetUrl(product.imageUrls?.[0] ?? product.imageUrl);
  return (
    <Link to={`/product/${product.id}`} className="card group">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <img
          src={src}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = placeholderImageDataUrl;
          }}
        />
        <div className="absolute left-3 top-3 badge">{categoryLabel[product.category]}</div>
      </div>

      <div className="min-w-0 p-3 sm:p-4">
        <div className="line-clamp-2 text-sm font-semibold leading-snug sm:text-base">{product.name}</div>
        <div className="mt-2 text-xs text-slate-600 sm:text-sm">
          <span className="line-clamp-2 block leading-snug">{product.description}</span>
        </div>

        <div className="mt-3 flex min-w-0 items-start justify-between gap-2 sm:mt-4">
          <div className="min-w-0 shrink text-base font-semibold sm:text-lg">{formatRub(product.priceRub)}</div>
          <span className="max-w-[45%] shrink-0 break-words text-right text-[11px] leading-snug text-slate-600 sm:text-xs">
            {product.city ? product.city : `в наличии: ${product.stock}`}
          </span>
        </div>
      </div>
    </Link>
  );
}

