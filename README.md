# React ve Motion geçiş ölçüm demosu

Bu bağımsız demo, Motion `wait` ile React `<ViewTransition>` örneklerinde seçili sekmenin ve panel başlığının DOM'a ne zaman geçtiğini ölçer. React örneğinde, tarayıcı destekliyorsa `document.activeViewTransition.finished` süresini de kaydeder. Amaç performans yarışı ilan etmek değil; DOM güncellemesiyle tarayıcı geçişinin bitişini ayrı gözlemlemektir.

## Gereksinimler

- Node.js 22.12 veya üzeri
- npm
- Güncel Chromium tabanlı tarayıcı

## Çalıştırma

Depoyu indirdikten sonra bu klasörde:

```sh
npm ci
npm run dev
```

Vite'ın yazdırdığı yerel adresi tarayıcıda aç. Her iki varyantta **“1 ısınma + 6 ölçüm”** düğmesine bas. Araç önce kayda girmeyen bir ısınma tıklaması, ardından aralarında 350 ms bulunan altı ölçüm yapar. **CSV indir** düğmesi ham sonuçları dışa aktarır.

Makalede raporlanan koşullara yaklaşmak için Chromium 154, 1280×720 viewport ve DPR 1 kullan. Sayfanın alt satırı gerçek tarayıcı sürümünü, viewport'u ve DPR'ı gösterir. Makaledeki sonuçlar headless Chromium'dan geldi; görünür tarayıcıda, başka donanımda veya farklı sistem yükünde aynı süreler beklenmemeli.

Üretim derlemesini doğrulamak için:

```sh
npm run build
npm run preview
```

Bağımlılık sürümleri `package.json` ve `package-lock.json` içinde sabitlendi. Kod MIT lisanslıdır.

## Ölçüm tanımı ve sınırlar

- Sayaç programatik `HTMLElement.click()` çağrısından hemen önce başlar.
- `MutationObserver`, seçili sekme işaretinin ve panel başlığının beklenen değere ulaştığı callback zamanını kaydeder.
- `document.activeViewTransition.finished`, tarayıcı bu nesneyi sağladığında geçişin tamamlanmasını ölçer. CSV hücresi boşsa o çalıştırmada değer yakalanmamıştır; tahminle doldurma.
- Bu değerler paint süresi, gerçek fare/klavye gecikmesi veya kullanılabilirlik sonucu değildir.
- Düğmeler tam bir ARIA sekme bileşeni kurmaz; demo erişilebilirlik testi değildir.
- React geçiş bitişi ile DOM mutasyon süreleri farklı olaylardır; birleştirip tek gecikme değeri gibi yorumlama.
- Kod tekrarlanabilir; donanım, tarayıcı modu, işletim sistemi, güç durumu ve arka plan yükü birebir aynı süreleri garanti etmez. Kendi ham CSV çıktını raporla.
