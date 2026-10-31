# Steam Saat 0.4.1

Türkçe, koyu temalı Windows masaüstü uygulaması. Ana ekranda Squad, Counter-Strike 2 ve FiveM bulunur. Bu proje ASF kodunu kopyalamaz; Steam bağlantısı için `steam-user` kullanır.

## Ne hazır, ne doğrulanmadı?

- Kaynak kodu, üç oyun kartı, giriş/Steam Guard arayüzü, başlat/durdur/bağlantıyı kes ve FiveM dosya seçicisi hazır.
- Steam oturumu, arayüzden ayrı ve bağlantı sonunda sonlandırılan bir alt işlemde çalışır.
- Steam toplam sürelerini okuma, başlatma öncesine göre artış gösterme ve Windows ile şifrelenmiş oturumu yeniden açma eklendi.
- Sistem tepsisi, artan aralıklarla otomatik yeniden bağlantı ve isteğe bağlı Windows başlangıcı vardır. Windows başlangıcında seçili oyunları otomatik başlatma eklendi. Oyun seçimleri ve FiveM yolu hatırlanır.
- Arayüz sade masaüstü düzenine geçirildi: üst sekmeler, düz yüzeyler, kompakt oyun seçimleri ve tablolar. Giriş başarılı olduğunda kullanıcı adı/şifre formu gizlenir.
- Windows başlangıcında özel adla oluşturulmuş kaydın yanlışlıkla kapalı okunması düzeltildi. Uygulama yalnızca kendi başlangıç girdisini doğrular; aynı Electron EXE'sini kullanan başka projeleri açık kabul etmez. Başlangıç ayarı yerel tercih dosyasına yazma başarısına bağlı değildir. Engellenmiş veya yazılamayan kayıtlarda açıklayıcı hata gösterilir.
- Node.js üzerinde 46 otomatik test ve 16 JavaScript dosyasının sözdizimi kontrolü başarılı. Testler Windows şifreleme API'sini, Electron'u ve Steam'i taklit eder; gerçek Steam hesabıyla uçtan uca doğrulama değildir.
- Bağımlılıklar artık yerelde kurulu ve `package-lock.json` mevcut. Electron uygulama modu bu otomasyon ortamında `0x80000003` ile açılmadığından gerçek DPAPI ve pencere testi tamamlanamadı. Hazır tek dosya EXE paketi oluşturulmadı.
- Doğrudan sürümler ve geçişli bağımlılıklar kilit dosyasında sabitlenmiştir. Bağımlılıkların tamamı kaynak düzeyinde denetlenmiş değildir.
- Hiçbir gerçek Steam hesabına giriş yapılmadı.

## Kurulum ve çalıştırma

1. [Node.js](https://nodejs.org/en/download) 22 veya üstünü **npm dahil** kur. Node.js tek başına yeterli değildir. Standart Windows yükleyicisi npm içerir.
2. Bu klasörde `KUR.cmd` dosyasını aç. İlk kurulum internet gerektirir. Paketler npm'den, Electron çalışma zamanı Electron dağıtım sunucularından indirilir. Bu indirme adresleri oyun oturumunun veri alıcıları değildir.
3. Kurulum ve testler başarılıysa `BASLAT.cmd` dosyasını aç.
4. İlk seferde kullanıcı adını ve şifreni **uygulamanın içinde** gir. Steam Guard isterse e-posta veya mobil kodunu yine uygulamada gir. **Oturumu bu bilgisayarda hatırla** seçiliyse başarılı girişin oturum tokenı Windows ile şifrelenerek kaydedilir; şifren kaydedilmez. Sonraki açılışta kayıtlı token ile otomatik bağlantı kurulur. Süresi dolmuş veya Steam tarafından iptal edilmiş oturumda yeniden giriş gerekir. Hesap bilgilerini sohbetlere veya dosyalara yazma.
5. Squad, CS2 veya ikisini seçip **Başlat** düğmesine bas. Yalnızca hesabında bulunan oyunları seç. Uygulama oyun lisansı satın almaz veya bir lisans kontrolünü aşmaz.
6. **Durdur** oyun bildirimini kaldırır. **Bağlantıyı kes** mevcut bağlantıyı kapatır ama hatırlanan girişi silmez. **Kayıtlı oturumu sil ve çıkış yap** hem bağlantıyı keser hem token kaydını siler. Yeni başlatma yerel süre sayacını ve Steam süre artışı başlangıcını sıfırlar. Normal elle açılışta oyunlar kendiliğinden başlamaz; Windows başlangıç modu aşağıda açıklanır.
7. FiveM kartındaki **Dosya seç** ile güvendiğin `FiveM.exe` dosyasını seç, sonra **FiveM’i aç** düğmesine bas. Dosya yolu sonraki açılışlarda da hatırlanır.

## Sistem tepsisi ve Windows başlangıcı

- **Kapatınca tepside tut** varsayılan olarak açıktır. Pencerenin × düğmesi uygulamayı gizler; Steam işlemi devam eder. Sağ alttaki saat simgesine tıklayarak pencereyi geri açabilirsin. Simge Windows'un gizli simgeler menüsünde olabilir.
- Tepsi menüsünden seçili oyunları başlatabilir, durdurabilir veya **Tamamen çıkış yap** ile uygulamayı ve bağlantıyı kapatabilirsin. Ayarlardaki **Uygulamadan tamamen çık** düğmesi de aynı amaçla kullanılabilir.
- Tepsi oluşturulamazsa pencere gizlenmez; × düğmesi uygulamadan çıkar. Sistem tepsisi çalışırken uygulama açık kaldığı için ikinci `BASLAT.cmd` çağrısı yeni kopya başlatmak yerine pencereyi gösterir.
- **Windows ile başlat** varsayılan olarak kapalıdır. Ayarlardan açınca yalnızca mevcut Windows kullanıcısının başlangıç kaydı oluşturulur. Kapatınca aynı kayıt kaldırılır; yönetici yetkisi istenmez. Başlangıç kaydı açılışta kendiliğinden oluşturulmaz.
- Windows kullanıcı oturumu açılınca uygulama `--hidden` ile tepside başlar. Kaydedilmiş Steam girişi varsa bağlanır. **Windows başlangıcında saat biriktir** seçiliyse, kaydedilmiş Squad/CS2 seçimlerini başarılı bağlantıdan sonra otomatik başlatır. Başka oyun oturumu varsa otomatik başlatma iptal edilir. Steam Guard gerekirse uygulamayı tepsiden açıp kodu girmen gerekir.
- **Windows başlangıcında saat biriktir** bu sürümde varsayılan olarak açıktır; Windows'un uygulamayı açması için ayrı **Windows ile başlat** ayarının da açılması gerekir. Daha önce 0.3 sürümünde oluşturulmuş `--hidden` başlangıç kaydı değişiklik istemeden çalışır. İstersen otomatik oyun başlatmayı ayrı olarak kapatıp yalnızca uygulamanın açılmasını sağlayabilirsin.
- Otomatik çalışma için üç koşul gerekir: **Windows ile başlat** açık, oyun seçimi kaydedilmiş ve Steam oturumu **Oturumu hatırla** ile saklanmış olmalı. Hiç oyun seçilmemişse veya kayıtlı giriş yoksa oyunlar başlatılmaz. FiveM bu otomatik işleme dahil değildir ve kendiliğinden açılmaz.
- Bu kaynak sürümünde kayıt Electron EXE'sine ve proje klasörünün tam yoluna işaret eder. Klasörü taşırsan, ayarı eski konumda kapatıp yeni konumda tekrar aç. Windows Görev Yöneticisi başlangıç kaydını devre dışı bırakmışsa uygulama bunu ayarlarda kapalı gösterir.
- Bilgisayar kapalıyken veya uykudayken çalışmaz. Uykuya geçişte bağlantı durdurulur; uyanınca uygun oturum tokenı ve otomatik bağlantı tercihi varsa tekrar denenir.

## Yeniden bağlantı davranışı

**Otomatik yeniden bağlan** varsayılan olarak açıktır. Kütüphanenin `autoRelogin` seçeneği kapalı kalır; denemeleri uygulama yönetir. Geçici ağ/Steam hizmet kesintilerinde 5, 10, 20, 40, 60, 120, 120 ve 120 saniye aralıklarla en fazla 8 deneme yapılır. Sayaç ve sıradaki deneme arayüzde görünür. Başarılı bağlantı sınırı sıfırlar. **Şimdi bağlan** elle tekrar denemek için kullanılabilir.

Bağlantı kesilmeden önce çalışan oyunlar, yeniden girişten sonra 1,5 saniyelik beklemeyle tekrar bildirilir. Başka bir oyun oturumu algılanırsa bu devam isteği iptal edilir; diğer oturum düşürülmez. Diğer oyun kapanınca kendiliğinden yeniden başlamaz. Kullanıcının **Durdur**, **Bağlantıyı kes**, **Kayıtlı oturumu sil** veya tam çıkış komutu bekleyen denemeleri iptal eder. Yeniden girişte yerel oturum sayacı ve Steam artışı başlangıcı sıfırlanır; bağlantısız süre oyun süresine eklenmez.

Geçersiz şifre/token, reddedilen giriş, oturumun başka istemci tarafından değiştirilmesi ve hız sınırı gibi durumlarda otomatik deneme durur. Bu durumlar ağ hatası gibi ele alınmaz. Yeniden bağlantıda parola saklanmaz: yalnızca mevcut işlem belleğindeki veya açıkça hatırlanmış şifreli kayıttaki token kullanılır. Hatırlama kapalıysa uygulama yeniden açıldığında tekrar giriş gerekir.

`KUR.cmd` önce paketlerin kurulum betiklerini devre dışı bırakarak kurulum yapar. Ardından yalnızca Electron'un çalışma zamanını indiren kurulum betiğini açıkça çalıştırır. Bu önlem bağımlılıkların çalışırken yürüttüğü kodu denetlemez.

İlk başarılı kurulum `package-lock.json` üretir. Bu dosyayı kaynak kodla birlikte sakla ve sonraki kurulumlarda kullan. `KUR.cmd`, kilit dosyası bulduğunda `npm ci` kullanır. Bilinen açıkları ayrıca `npm audit` ile değerlendirebilirsin; tek başına bu tarama güvenlik onayı sağlamaz. Paketleri otomatik ve kontrolsüz yükseltme.

Terminalden eşdeğer işlemler:

```powershell
npm install --ignore-scripts --no-audit --no-fund
node node_modules/electron/install.js
npm run check
npm test
npm start
```

Kilit dosyası oluştuktan sonra ilk komut yerine `npm ci --ignore-scripts --no-audit --no-fund` kullan.

## Oyunların davranışı

| Kart | İşlem |
| --- | --- |
| Squad | Steam'e AppID `393380` için oyun bildirimi gönderir. |
| Counter-Strike 2 | Steam'e AppID `730` için oyun bildirimi gönderir. |
| FiveM | Seçtiğin yerel `FiveM.exe` dosyasını açar. Steam saati biriktirmez. |

Oyun bildirimi, oyunun bilgisayarda gerçekten çalıştığı veya Steam'in kesin olarak süre eklediği anlamına gelmez. Yerel sayaç yalnızca uygulamanın etkin bildirim süresini ölçer.

**Steam’de kayıtlı süre** alanı oturum açıldıktan sonra Steam'in `getUserOwnedApps` yanıtındaki `playtime_forever` değerini dakika cinsinden okur. Oyun bildirimi başlamadan hemen önce başlangıç değeri alınır. Toplam ve bu başlangıca göre fark ayrı gösterilir; her 60 saniyede, durdurunca ve **Steam’den yenile** düğmesiyle yenilenir. Steam istatistikleri anlık güncellenmeyebilir. Gösterilen artış hesabın toplamındaki farktır; yalnızca bu uygulamanın oluşturduğu süre olarak yorumlanamaz.

Veri alınamazsa hata ve son başarılı okuma zamanı gösterilir; yerel sayaçtan tahmini Steam süresi üretilmez. Listede bulunmayan oyun sıfır dakika kabul edilmez, **Alınamadı** olarak gösterilir. Başlangıç değeri alınamazsa o oturumun artışı hesaplanmaz. Aynı hesabı başka oturumda kullanmak ve Steam gizlilik/erişim koşulları sonucu etkileyebilir.

Başka bir Steam oturumunda oyun oynandığı bilgisi gelirse etkin bildirim durur ve sayaç donar. Başka oturumu düşürmek için `kickPlayingSession` çağrısı yapılmaz ve `gamesPlayed` için `force: true` kullanılmaz. Başka oturum kapanınca işlem kendiliğinden yeniden başlamaz. Girişte rastgele sıfırdan farklı `logonID` kullanılması, aynı kimlik yüzünden başka istemciyi değiştirme riskini azaltır; Steam'in bütün sunucu davranışları için garanti değildir.

## Veri ve güvenlik sınırı

- Şifre, Guard kodu ve çerezler dosyaya veya loglara yazılmaz. **Hatırla** seçiliyse yalnızca giriş tokenının şifreli hâli `%APPDATA%\steam-saat\remembered-session.bin` dosyasına kaydedilir (Electron kullanıcı veri dizini). Açık token arayüze gönderilmez, uygulama loguna veya analitik servisine yazılmaz.
- Token, Electron `safeStorage` asenkron API'siyle Windows DPAPI koruması altında şifrelenir. Windows şifrelemesi kullanılamazsa açık metin veya sabit anahtarlı kayıt yapılmaz. Aynı Windows hesabı altında çalışan zararlı bir uygulama veriyi çözebilir; bu koruma tam güvenlik garantisi değildir. **Kayıtlı oturumu sil** yerel kaydı siler; Steam tarafındaki tüm cihaz oturumlarını iptal etmez.
- Zararsız uygulama tercihleri, oyun kimlikleri ve FiveM dosyasının yolu kullanıcı veri dizinindeki `preferences.json` dosyasında saklanır. Bu dosyaya şifre veya token yazılmaz. Windows başlangıcı mevcut kullanıcının kayıt defteri girdisiyle yönetilir; buraya yalnızca uygulama yolu ve `--hidden` argümanı yazılır.
- `steam-user`, `dataDirectory: null` ve `autoRelogin: false` ile oluşturulur. Şifre ve kod alanları IPC ile gönderildikten sonra temizlenir. Kütüphanenin oturum verileri işlem belleğinde bulunabilir.
- Bellekteki JavaScript dizgilerinin güvenli biçimde sıfırlanması garanti edilemez. Bağlantı sonunda Steam alt işlemi sonlandırılır. İşletim sistemi takas dosyası, üçüncü taraf ekran kaydı, zararlı yazılım veya sistem çökme dökümleri karşısında veri silme garantisi verilmez. Electron çökme raporlama servisi başlatılmaz.
- Arayüz `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true` ile çalışır. İnternetten betik, font veya görsel yüklemez. Yeni pencereler, gezinme, izinler ve arayüzün ağ istekleri engellenir. IPC yalnızca ana pencerenin beklenen yerel dosyasından kabul edilir.
- Bir HTTP/WebSocket kontrol sunucusu açılmaz. Telemetri, reklam, takas, envanter yönetimi ve otomatik güncelleme uygulanmaz. Steam kütüphanesinin kendisi daha geniş yeteneklere sahip olsa da bu uygulama bu işlevleri çağırmaz.
- FiveM, kabuk komutu oluşturmadan, argüman eklemeden ve yükseltilmiş yetki istemeden başlatılır. Seçtiğin EXE'nin gerçek ve güvenilir olduğunu kullanıcı olarak sen doğrulamalısın.
- Electron yerel profil/tercih dosyaları oluşturabilir; arayüz oturumu kalıcı olmayan bir partition kullanır. Şifre kaydedilmese de seçili hatırlama özelliği şifreli oturum dosyası oluşturur. Kaynak ZIP'i veya güncellemeler bu kullanıcıya özel dosyayı içermez.
- Kullanılan Electron, Chromium, Node.js, `steam-user` ve geçişli npm paketleri güven zincirinin parçasıdır. Bunların tamamı kaynak düzeyinde denetlenmedi. Tam sürüm belirtmek veya testlerin geçmesi zararlı bağımlılık/açık bulunmadığını kanıtlamaz. İnternete bağlanan Steam alt işlemi işletim sistemi seviyesinde ayrı bir güvenlik sandbox'ına alınmış değildir.

## Bağımlılıklar ve incelenen resmî belgeler

31 Ekim 2026 tarihinde Electron Tray, Windows başlangıcı ve powerMonitor belgeleri de kontrol edildi:

- `steam-user` **5.3.0**: [kaynak ve paket sürümü](https://github.com/DoctorMcKay/node-steam-user/blob/master/package.json), [API belgeleri](https://github.com/DoctorMcKay/node-steam-user). Özellikle `dataDirectory`, `autoRelogin`, `logonID`, `steamGuard`, `playingState` ve `gamesPlayed` davranışları.
- Electron **45.1.0**: [resmî sürümler](https://releases.electronjs.org/release?channel=stable), [güvenlik önerileri](https://www.electronjs.org/docs/latest/tutorial/security), [safeStorage](https://www.electronjs.org/docs/latest/api/safe-storage).
- Masaüstü entegrasyonu: [Tray](https://www.electronjs.org/docs/latest/api/tray), [app.setLoginItemSettings](https://www.electronjs.org/docs/latest/api/app#appsetloginitemsettingssettings-macos-windows), [powerMonitor](https://www.electronjs.org/docs/latest/api/power-monitor).
- [Steam Abonelik Sözleşmesi, bölüm 4.C–D](https://store.steampowered.com/subscriber_agreement/): otomasyonla oyun süresini şişirme yasaklanır; hesap veya abonelik kısıtlaması/sonlandırılması riski vardır. Bu uygulama Valve tarafından onaylı değildir.

## Kaynak yapısı

- `src/main.cjs`: Electron penceresi, doğrulanan IPC, Steam alt işlemi ve FiveM başlatma.
- `src/worker.cjs`: Steam kütüphanesinin çalıştığı geçici alt işlem.
- `src/session.cjs`: oturum, Guard, oyun bildirimi ve sayaç durumu.
- `src/token-store.cjs`: Windows ile şifreli token kaydı, okuma ve sıraya alınmış silme işlemleri.
- `src/reconnect.cjs`: sınırlı ve iptal edilebilir yeniden bağlantı zamanlaması.
- `src/preferences.cjs`: kimlik bilgisi içermeyen tercihlerin saklanması.
- `src/desktop.cjs`: sistem tepsisi ve Windows başlangıç entegrasyonu.
- `src/preload.cjs`: arayüze açılan sınırlı komutlar.
- `src/ui/`: yerel HTML/CSS/JavaScript arayüzü.
- `test/session.test.cjs`: sahte Steam istemcisiyle giriş, oturum çakışması, hata ve süre testleri.
- `test/main.test.cjs`: Electron ve alt işlem taklitleriyle IPC kaynağı, pencere güvenlik ayarları, giriş bilgisi aktarımı ve FiveM başlatma testleri. Bu testler gerçek Steam bağlantısını veya Electron entegrasyonunu çalıştırmaz.
- `test/token-store.test.cjs`: şifreleme kullanılamadığında kayıt yapmama, diske sadece şifreli veri yazma ve silme/saklama yarışları.
- `test/reconnect.test.cjs`: deneme sınırı, artan beklemeler, iptal ve başlangıç kaydı seçenekleri.
- `test/renderer.test.cjs`: yeni HTML ile arayüz kodunun bağlantısı, bilinmeyen Steam verisi, geri sayım ve şifre alanının temizlenmesi.
- `scripts/runtime-smoke.cjs`: gerçek hesap açmadan, ayrı bir geçici profille Windows şifreleme ve arayüz kontrolü. Bu ortamda Electron uygulama modu açılamadığı için bu kontrol doğrulanamadı.

Bağımlılık kurmadan test:

```powershell
node --test test/main.test.cjs test/session.test.cjs test/token-store.test.cjs test/reconnect.test.cjs test/renderer.test.cjs
node scripts/check.cjs
```

Görsel önizleme için `src/ui/index.html` dosyasını normal tarayıcıda açabilirsin. Bu modda giriş alanları ve işlem düğmeleri devre dışıdır; gerçek uygulama `BASLAT.cmd` ile açılır.
