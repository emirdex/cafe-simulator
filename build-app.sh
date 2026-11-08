#!/bin/sh
# Oyunu uygulama için paketler: kafe/ kaynaklarından www/ klasörünü üretir.
set -e
SRC=${KAFE_SRC:-game}
OUT=www
rm -rf $OUT && mkdir -p $OUT/fonts
# fontlar uygulamanın içine gömülür (internet gerekmez)
F=node_modules/@fontsource
css=""
add() { # aile klasör ağırlık
  for sub in latin latin-ext; do
    f="$2-$sub-$3-normal.woff2"; cp "$F/$2/files/$f" $OUT/fonts/
    if [ $sub = latin ]; then rng="U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD"; else rng="U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF"; fi
    css="$css@font-face{font-family:'$1';font-style:normal;font-weight:$3;font-display:swap;src:url(fonts/$f) format('woff2');unicode-range:$rng}
"
  done
}
for w in 400 500 600; do add 'Plus Jakarta Sans' plus-jakarta-sans $w; add 'Manrope' manrope $w; done
for w in 500 600; do add 'Fraunces' fraunces $w; done
for w in 600 700; do add 'Caveat' caveat $w; done
for w in 400 500; do add 'DM Mono' dm-mono $w; done
cp src/native.js src/config.js $OUT/
{
echo '<!doctype html><html lang="tr"><head><meta charset="utf-8">'
echo '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">'
echo '<meta name="format-detection" content="telephone=no"><title>Cafe Simulator</title>'
echo '<style>'; printf '%s' "$css"; echo 'html,body{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;overscroll-behavior:none}'; cat $SRC/app.css; echo '</style></head><body>'
echo '<div id="root"></div>'
echo '<script src="config.js"></script>'
echo '<script>'; cat $SRC/malls.js $SRC/trdata.js $SRC/core.js; echo '</script>'
echo '<script>window.__kzBoot=function(){'; cat $SRC/app.js; echo '};</script>'
echo '<script src="native.js"></script>'
echo '</body></html>'
} > $OUT/index.html
echo "www hazır: $(du -sh $OUT | cut -f1)"
