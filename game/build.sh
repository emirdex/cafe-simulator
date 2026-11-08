#!/bin/sh
{
echo '<title>Kafe Zinciri Simülatörü</title>'
echo '<meta name="claude:viewport-fit-sides" content="cover">'
echo '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
echo '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600&family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Caveat:wght@600;700&family=Manrope:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap">'
echo '<style>'; cat app.css; echo '</style>'
echo '<div id="root"></div>'
echo '<script>'; cat malls.js trdata.js core.js; echo '</script>'
echo '<script>'; cat app.js; echo '</script>'
} > kafe-zinciri.html
