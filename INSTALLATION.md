# Steam Saat 0.6.0

İndir: https://github.com/aksoysavas4422-hue/steam-saat-releases/releases/latest/download/SteamSaat.exe

SteamSaat.exe dosyasını aç. İlk açılışta gereken dosyalar kullanıcı hesabının
LocalAppData/Programs/SteamSaat klasörüne arka planda yerleştirilir, ardından uygulama
açılır. Terminal, kurulum sihirbazı, KUR/BASLAT dosyası veya yönetici izni gerekmez.
İlk açılış dosya boyutu nedeniyle biraz sürebilir. İkinci açılışta mevcut uygulama
doğrudan açılır. Masaüstü/Başlat kısayolu oluşturulur. Windows x64 ve Windows'ta bulunan
.NET Framework 4 çalışma zamanı kullanılır; Node.js ve .NET SDK kurulmaz.

Steam hesabına uygulama içinden kendin giriş yap. Arama alanında Steam mağazasından
oyun bulabilir, + Favori ile ekleyebilir ve seçerek başlatabilirsin. En fazla 50 favori
ve aynı anda 32 seçili oyun desteklenir. Steam mağazasında oyun türü doğrulanır;
DLC/paket eklenmez. Oyun eklemek lisans satın almaz veya hesabına oyun kazandırmaz.
Squad ve CS2 hazır favorilerdir. FiveM yalnızca yerel FiveM.exe kısayoludur;
Steam AppID'si atanmaz veya yerine GTA V seçilmez.

Favoriler ve seçimler kalıcıdır. Eklenen oyunların Steam süresi, seçilip başlatıldıktan
sonra sorgulanır. Alınamayan süre uydurulmaz. Yerel sayaç Steam toplamı değildir.

Güncellemeler açılıştan 15 saniye sonra ve saatte bir kontrol edilip arka planda
indirilir. Hazır olduğunda Uygulamadan çık seçeneği bağlantıyı kapatıp güncellemeyi
sessizce uygular. Pencere çarpısı tepsiye gizliyorsa kurulum başlamaz. Windows
kapanırken güncelleme kurulumu başlatılmaz. Bilgisayar kapalıyken saat birikmez.

## Güvenlik sınırları ve doğrulama

Şifre ve Guard kodu diske yazılmaz. İsteğe bağlı hatırlanan oturum Windows DPAPI ile
şifrelenir. Aynı Windows hesabında çalışan zararlı yazılıma karşı garanti değildir.
Steam araması doğrudan Steam mağazasına, güncelleme kontrolü GitHub'a gider.
Hesap bilgileri bu sorgulara eklenmez. Arama adı ve IP gibi normal HTTP metaverileri
ilgili sunucuya görünür. Arama, Steam'in belgelenmiş kararlı Web API sözleşmesi
olmayan mağaza uçlarını kullanır; mağaza değişirse arama güncellemesi gerekebilir.

NSIS ve tek EXE giriş noktası yayıncı sertifikasıyla imzalanmış değildir. Windows
tanınmayan yayıncı uyarısı gösterebilir; uygulama bu işletim sistemi uyarılarını
gizleyemez. Güvenlik yazılımlarını kapatma. Güncelleme güveni GitHub HTTPS ve
electron-updater SHA-512 dosya bütünlüğü kontrolüne dayanır. Bağımsız yayıncı imzası
doğrulanmaz; GitHub yazma yetkisinin ele geçirilmesi kötü amaçlı güncelleme riski
oluşturur. GitHub hesabında iki faktörlü doğrulama kullan.

Electron 45.1.0, steam-user 5.3.0, electron-updater 6.8.12 ve electron-builder 26.18.1
tam sürüme sabittir; geçişli bağımlılıklar package-lock.json içinde çözülüp kilitlenmiştir.
Derleme npm ci kullanır. Üçüncü tarafların tamamına kaynak güvenlik denetimi yapılmadı.
Onlar da uygulama yetkileriyle çalışır. Takas, envanter, reklam veya telemetri yoktur.
Başka Steam oyun oturumunu düşürmez. Steam otomasyonu hesap kısıtlaması riski taşır.

GitHub Actions kaynak kontrolü, otomatik testler, canlı genel mağaza araması ve
Windows paketlemesi yapar. Gerçek Steam hesabı kullanılmaz. Yerel otomasyon ortamında
Electron arayüzü açılmadığından gerçek pencere ve güncelleme geçişi testi yapılamadı.

Geliştirme için ağ erişimli Node 22+ ortamında npm ci, npm run check, npm test,
npm run dist kullanılır. GitHub Actions NSIS'i ve tek SteamSaat.exe giriş noktasını
birlikte üretip sürüme ekler. Sonraki sürümlerde package.json ve kilit dosyasının
kök sürümünü artırıp main dalına gönder. Aynı yayımlanmış sürümün üzerine yazılmaz.
