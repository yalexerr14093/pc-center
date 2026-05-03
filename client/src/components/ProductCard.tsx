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

      <div className="p-4">
        <div className="truncate text-base font-semibold">{product.name}</div>
        <div className="mt-2 text-sm text-slate-600">
          <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
            {product.description}
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-lg font-semibold">{formatRub(product.priceRub)}</div>
          <span className="text-xs text-slate-600">{product.city ? product.city : `в наличии: ${product.stock}`}</span>
        </div>
      </div>
    </Link>
  );
}

