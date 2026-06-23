#!/bin/bash
# Genera íconos PNG del PWA desde el SVG de origen.
# Uso: bash scripts/generate-pwa-icons.sh
#
# Requiere ImageMagick (brew install imagemagick).
# Produce los assets que vite-plugin-pwa referencia desde el manifest.

set -e
cd "$(dirname "$0")/.."

SRC_SQUARE="public/apple-touch-icon.svg"   # ya tiene fondo verde + símbolo blanco
SRC_TRANSPARENT="public/favicon.svg"        # símbolo sobre fondo verde sólido

mkdir -p public

# Íconos any (los que ve Android en home)
magick -background none "$SRC_SQUARE" -resize 192x192 public/pwa-192x192.png
magick -background none "$SRC_SQUARE" -resize 512x512 public/pwa-512x512.png

# Íconos "maskable" (Android adaptive — necesita un safe zone del 80% en el centro).
# Para esto agrandamos el fondo y centramos el símbolo, dejando ~10% de margen seguro.
magick -size 512x512 xc:'#047C00' \
  \( "$SRC_TRANSPARENT" -resize 320x320 \) \
  -gravity center -composite \
  public/pwa-maskable-512x512.png

# Icono apple-touch (180×180 PNG por compatibilidad con iOS < 17)
magick -background none "$SRC_SQUARE" -resize 180x180 public/apple-touch-icon.png

# Favicon clásico .ico (algunos browsers viejos)
magick "$SRC_TRANSPARENT" -resize 32x32 public/favicon-32x32.png
magick "$SRC_TRANSPARENT" -resize 16x16 public/favicon-16x16.png

echo "PWA icons generados en public/:"
ls -la public/*.png public/*.svg
