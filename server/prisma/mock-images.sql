-- Make seed products show frontend placeholder:
-- set non-existent image paths so <img onError> swaps to placeholder.

UPDATE "Product"
SET
  "imageUrl" = CASE "category"
    WHEN 'CPU' THEN '/uploads/__missing-cpu.png'
    WHEN 'GPU' THEN '/uploads/__missing-gpu.png'
    WHEN 'MOTHERBOARD' THEN '/uploads/__missing-motherboard.png'
    WHEN 'RAM' THEN '/uploads/__missing-ram.png'
    WHEN 'SSD' THEN '/uploads/__missing-ssd.png'
    ELSE "imageUrl"
  END,
  "imageUrls" = CASE "category"
    WHEN 'CPU' THEN ARRAY[]::text[]
    WHEN 'GPU' THEN ARRAY[]::text[]
    WHEN 'MOTHERBOARD' THEN ARRAY[]::text[]
    WHEN 'RAM' THEN ARRAY[]::text[]
    WHEN 'SSD' THEN ARRAY[]::text[]
    ELSE "imageUrls"
  END
WHERE "sellerId" IS NULL;

