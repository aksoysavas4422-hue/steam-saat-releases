# Windows uygulaması

Releases: https://github.com/aksoysavas4422-hue/steam-saat-releases/releases/latest

Eski uygulamadan tamamen çık. SteamSaat-0.5.0-Setup.exe dosyasını indirip kur.
Masaüstündeki veya Başlat menüsündeki Steam Saat kısayolunu aç. Node.js, .NET SDK,
KUR.cmd veya BASLAT.cmd gerekmez. Windows x64 kullanılır. Steam hesabına kendin giriş yap.
Kaynak sürümle aynı Windows hesabındaki kayıtlı oturum/ayarlar korunur.
Yeni kurulumda Windows ile başlat ayarını tekrar açmak gerekebilir.

Uygulama 15 saniye sonra ve saatte bir GitHub Releases güncellemelerini kontrol eder.
İndirme arka plandadır. İndirme tamamlandıktan sonra Uygulamadan çık seçeneği
bağlantıyı kapatır ve kurulumu uygular. Pencerenin çarpısı tepsiye gizliyorsa güncelleme
kurulmaz. Windows kapanırken güncelleme kurulumu başlatılmaz.

## Güvenlik sınırları

Steam kimlik bilgileri güncelleme servisine aktarılmaz. Güncelleme erişimi GitHub'a
uygulama sürümü ve normal HTTP istek metaverileri gösterir. Reklam/telemetri yoktur.
Şifre ve Guard kodu diske yazılmaz. İsteğe bağlı hatırlanan oturum Windows DPAPI ile
şifrelenir. Bu, aynı Windows hesabında çalışan zararlı yazılıma karşı koruma sağlamaz.

NSIS paketinde yayıncı sertifikası yoktur; Windows tanınmayan yayıncı gösterebilir.
electron-updater GitHub HTTPS ve sürüm metadatasındaki SHA-512 bütünlük kontrolünü
kullanır. Bağımsız bir yayıncı imzası doğrulanmaz; GitHub hesabı/depo yazma yetkisi
ele geçirilirse kötü amaçlı güncelleme yayımlanabilir. GitHub hesabında iki faktörlü
doğrulama kullan. Güvenlik yazılımlarını kapatma.

Üst bağımlılıklar tam sürüme sabittir: Electron 45.1.0, steam-user 5.3.0,
electron-updater 6.8.12, electron-builder 26.18.1. Yeni paketlerin kilit dosyası bu
ortamda ağ engeli nedeniyle çözülemiyor. İlk CI çalışması mevcut kilidi genişletir,
ardından npm ci kullanır ve çözülen package-lock.json dosyasını sürüme ekler.
Bu ilk çözümün geçişli bağımlılıkları henüz sabitlenmiş sayılmaz; sonraki geliştirmede
yayımlanan kilit dosyası kaynak depoya alınmalıdır. Üçüncü taraf kodu da uygulamanın
işlem yetkileriyle çalışır; tüm bağımlılıkların güvenlik denetimi yapılmış değildir.

Steam saat otomasyonu hesap kısıtlaması riski taşır. Bilgisayar kapalıyken çalışmaz.

## Derleme

GitHub Actions Windows üzerinde kontrol/test sonrasında NSIS üretir ve sürümü yayımlar.
Aynı sürümün üzerine yazılmaz. Sonraki sürümlerde package.json sürümünü artır.
Yerelde ağ erişimi olan Node 22+ ortamında: npm install, npm run check, npm test,
npm run dist. Gerçek hesap girişi testlerin parçası değildir.
