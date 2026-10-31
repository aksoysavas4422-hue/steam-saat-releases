'use strict';
// Shared by the sandboxed renderer and the main process. English is the source language.
(function(root) {
  const messages = {
    "Your password is never saved.": {"tr":"Şifren asla kaydedilmez.","ru":"Ваш пароль не сохраняется.","zh":"您的密码不会被保存。"},
    "{count} game selected": {"tr":"{count} oyun seçili","ru":"Выбрана {count} игра","zh":"已选择 {count} 款游戏"},
  "LOCAL SESSION MANAGER": {
    "tr": "YEREL OTURUM YÖNETİCİSİ",
    "ru": "ЛОКАЛЬНЫЙ МЕНЕДЖЕР СЕАНСОВ",
    "zh": "本地会话管理器"
  },
  "Your session, at a glance.": {
    "tr": "Oturumun tek bakışta.",
    "ru": "Ваш сеанс — на одном экране.",
    "zh": "会话状态，一目了然。"
  },
  "Choose your games. Keep your Steam session in one place.": {
    "tr": "Oyunlarını seç. Steam oturumunu tek yerden yönet.",
    "ru": "Выбирайте игры и управляйте сеансом Steam в одном месте.",
    "zh": "选择游戏，在同一处管理 Steam 会话。"
  },
  "Current session": {
    "tr": "Mevcut oturum",
    "ru": "Текущий сеанс",
    "zh": "当前会话"
  },
  "LOCAL TIMER": {
    "tr": "YEREL SAYAÇ",
    "ru": "ЛОКАЛЬНЫЙ ТАЙМЕР",
    "zh": "本地计时器"
  },
  "Time active in this app. Steam totals are shown separately.": {
    "tr": "Bu uygulamada etkin geçen süre. Steam toplamları ayrı gösterilir.",
    "ru": "Время активности приложения. Общее время Steam показано отдельно.",
    "zh": "此应用中的活动时间。Steam 总时长单独显示。"
  },
  "Start session": {
    "tr": "Oturumu başlat",
    "ru": "Начать сеанс",
    "zh": "开始会话"
  },
  "Stop": {
    "tr": "Durdur",
    "ru": "Остановить",
    "zh": "停止"
  },
  "Disconnect": {
    "tr": "Bağlantıyı kes",
    "ru": "Отключиться",
    "zh": "断开连接"
  },
  "Reconnect": {
    "tr": "Yeniden bağlan",
    "ru": "Подключиться снова",
    "zh": "重新连接"
  },
  "Steam account": {
    "tr": "Steam hesabı",
    "ru": "Аккаунт Steam",
    "zh": "Steam 账户"
  },
  "Connected to Steam": {
    "tr": "Steam’e bağlı",
    "ru": "Подключено к Steam",
    "zh": "已连接到 Steam"
  },
  "Account name": {
    "tr": "Hesap adı",
    "ru": "Имя аккаунта",
    "zh": "账户名称"
  },
  "Steam account name": {
    "tr": "Steam hesap adı",
    "ru": "Имя аккаунта Steam",
    "zh": "Steam 账户名称"
  },
  "Password": {
    "tr": "Şifre",
    "ru": "Пароль",
    "zh": "密码"
  },
  "Remember this session": {
    "tr": "Oturumu hatırla",
    "ru": "Запомнить сеанс",
    "zh": "记住此会话"
  },
  "Connect to Steam": {
    "tr": "Steam’e bağlan",
    "ru": "Подключиться к Steam",
    "zh": "连接到 Steam"
  },
  "Steam Guard code": {
    "tr": "Steam Guard kodu",
    "ru": "Код Steam Guard",
    "zh": "Steam Guard 验证码"
  },
  "Confirm": {
    "tr": "Onayla",
    "ru": "Подтвердить",
    "zh": "确认"
  },
  "Remove saved session": {
    "tr": "Kayıtlı oturumu sil",
    "ru": "Удалить сохранённый сеанс",
    "zh": "删除已保存的会话"
  },
  "Quick picks": {
    "tr": "Hızlı seçim",
    "ru": "Быстрый выбор",
    "zh": "快速选择"
  },
  "Steam session": {
    "tr": "Steam oturumu",
    "ru": "Сеанс Steam",
    "zh": "Steam 会话"
  },
  "SHORTCUT": {
    "tr": "KISAYOL",
    "ru": "ЯРЛЫК",
    "zh": "快捷方式"
  },
  "Local launcher. No Steam playtime.": {
    "tr": "Yerel kısayol. Steam saati biriktirmez.",
    "ru": "Локальный запуск. Время Steam не накапливается.",
    "zh": "本地启动快捷方式，不累计 Steam 时长。"
  },
  "Choose file": {
    "tr": "Dosya seç",
    "ru": "Выбрать файл",
    "zh": "选择文件"
  },
  "Open": {
    "tr": "Aç",
    "ru": "Открыть",
    "zh": "打开"
  },
  "Updates": {
    "tr": "Güncellemeler",
    "ru": "Обновления",
    "zh": "更新"
  },
  "CURRENT VERSION": {
    "tr": "MEVCUT SÜRÜM",
    "ru": "ТЕКУЩАЯ ВЕРСИЯ",
    "zh": "当前版本"
  },
  "Check for updates": {
    "tr": "Güncellemeleri kontrol et",
    "ru": "Проверить обновления",
    "zh": "检查更新"
  },
  "Your favorites": {
    "tr": "Favorilerin",
    "ru": "Избранное",
    "zh": "我的收藏"
  },
  "STEAM STORE": {
    "tr": "STEAM MAĞAZASI",
    "ru": "МАГАЗИН STEAM",
    "zh": "STEAM 商店"
  },
  "Search for a game…": {
    "tr": "Oyun ara…",
    "ru": "Найти игру…",
    "zh": "搜索游戏…"
  },
  "Search": {
    "tr": "Ara",
    "ru": "Поиск",
    "zh": "搜索"
  },
  "Make room for your next game.": {
    "tr": "Sıradaki oyununa yer aç.",
    "ru": "Здесь будет ваша следующая игра.",
    "zh": "为下一款游戏留个位置。"
  },
  "Your added games will appear here.": {
    "tr": "Eklediğin oyunlar burada görünecek.",
    "ru": "Добавленные игры появятся здесь.",
    "zh": "添加的游戏将在此处显示。"
  },
  "Adding a favorite does not grant a game license.": {
    "tr": "Favoriye eklemek oyun lisansı sağlamaz.",
    "ru": "Добавление в избранное не даёт лицензию на игру.",
    "zh": "添加到收藏不会授予游戏许可。"
  },
  "Steam playtime": {
    "tr": "Steam oyun süresi",
    "ru": "Время игры в Steam",
    "zh": "Steam 游戏时长"
  },
  "Refresh": {
    "tr": "Yenile",
    "ru": "Обновить",
    "zh": "刷新"
  },
  "Game": {
    "tr": "Oyun",
    "ru": "Игра",
    "zh": "游戏"
  },
  "Total": {
    "tr": "Toplam",
    "ru": "Всего",
    "zh": "总计"
  },
  "Since start": {
    "tr": "Başlatmadan beri",
    "ru": "С начала",
    "zh": "自启动以来"
  },
  "Make it yours": {
    "tr": "Tercihlerin",
    "ru": "Ваши настройки",
    "zh": "个性设置"
  },
  "PREFERENCES": {
    "tr": "AYARLAR",
    "ru": "НАСТРОЙКИ",
    "zh": "偏好设置"
  },
  "Keep running in the tray": {
    "tr": "Tepside çalışmaya devam et",
    "ru": "Продолжать работу в трее",
    "zh": "在托盘中继续运行"
  },
  "Closing the window keeps your session active.": {
    "tr": "Pencereyi kapatmak oturumu durdurmaz.",
    "ru": "Закрытие окна не останавливает сеанс.",
    "zh": "关闭窗口后，会话继续运行。"
  },
  "Reconnect automatically": {
    "tr": "Otomatik yeniden bağlan",
    "ru": "Подключаться автоматически",
    "zh": "自动重新连接"
  },
  "Retry dropped connections without interrupting another game.": {
    "tr": "Başka oyun oturumunu kesmeden bağlantıyı yeniden dene.",
    "ru": "Восстанавливать соединение, не прерывая другую игру.",
    "zh": "重试断开的连接，不中断其他游戏会话。"
  },
  "Launch with Windows": {
    "tr": "Windows ile başlat",
    "ru": "Запускать с Windows",
    "zh": "随 Windows 启动"
  },
  "Open quietly when you sign in to Windows.": {
    "tr": "Windows oturumu açılınca sessizce başlat.",
    "ru": "Запускать в фоне при входе в Windows.",
    "zh": "登录 Windows 时在后台启动。"
  },
  "Start games on Windows login": {
    "tr": "Windows açılışında oyunları başlat",
    "ru": "Начинать игры при входе в Windows",
    "zh": "登录 Windows 时开始游戏会话"
  },
  "Use your saved session and selected games.": {
    "tr": "Kayıtlı oturumu ve seçili oyunları kullan.",
    "ru": "Использовать сохранённый сеанс и выбранные игры.",
    "zh": "使用已保存的会话和所选游戏。"
  },
  "Sessions pause when your computer sleeps or shuts down.": {
    "tr": "Bilgisayar uyurken veya kapalıyken oturum durur.",
    "ru": "Сеанс останавливается при сне или выключении компьютера.",
    "zh": "电脑休眠或关机时，会话将停止。"
  },
  "Quit application": {
    "tr": "Uygulamadan çık",
    "ru": "Выйти из приложения",
    "zh": "退出应用"
  },
  "Playtime automation carries a risk of account restrictions. Steam playtime is not guaranteed.": {
    "tr": "Süre otomasyonu hesap kısıtlaması riski taşır. Steam oyun süresi garanti edilmez.",
    "ru": "Автоматизация времени игры может привести к ограничениям аккаунта. Учёт времени Steam не гарантирован.",
    "zh": "游戏时长自动化可能导致账户受限。无法保证 Steam 会记录时长。"
  },
  "Minimize to tray": {
    "tr": "Tepsiye küçült",
    "ru": "Свернуть в трей",
    "zh": "最小化到托盘"
  },
  "Select {game}": {
    "tr": "{game} seç",
    "ru": "Выбрать {game}",
    "zh": "选择 {game}"
  },
  "Local active session duration": {
    "tr": "Yerel etkin oturum süresi",
    "ru": "Продолжительность локального сеанса",
    "zh": "本地活动会话时长"
  },
  "Search Steam games": {
    "tr": "Steam oyunlarını ara",
    "ru": "Поиск игр Steam",
    "zh": "搜索 Steam 游戏"
  },
  "{hours} h {minutes} min": {
    "tr": "{hours} sa {minutes} dk",
    "ru": "{hours} ч {minutes} мин",
    "zh": "{hours} 小时 {minutes} 分钟"
  },
  "+{minutes} min": {
    "tr": "+{minutes} dk",
    "ru": "+{minutes} мин",
    "zh": "+{minutes} 分钟"
  },
  "Unavailable": {
    "tr": "Alınamadı",
    "ru": "Недоступно",
    "zh": "不可用"
  },
  "Remove": {
    "tr": "Kaldır",
    "ru": "Удалить",
    "zh": "移除"
  },
  "Steam playtime: —": {
    "tr": "Steam süresi: —",
    "ru": "Время Steam: —",
    "zh": "Steam 时长：—"
  },
  "{attempt}/8 · Retrying in {seconds}s": {
    "tr": "{attempt}/8 · {seconds} sn sonra tekrar denenecek",
    "ru": "{attempt}/8 · Повтор через {seconds} с",
    "zh": "{attempt}/8 · {seconds} 秒后重试"
  },
  "Automatic retry limit reached": {
    "tr": "Otomatik deneme sınırına ulaşıldı",
    "ru": "Достигнут лимит попыток подключения",
    "zh": "已达到自动重试次数上限"
  },
  "Another game session has priority": {
    "tr": "Diğer oyun oturumu öncelikli",
    "ru": "Другой игровой сеанс имеет приоритет",
    "zh": "其他游戏会话优先"
  },
  "Steam connection active": {
    "tr": "Steam bağlantısı açık",
    "ru": "Соединение со Steam активно",
    "zh": "Steam 连接已建立"
  },
  "Waiting for connection": {
    "tr": "Bağlantı bekleniyor",
    "ru": "Ожидание подключения",
    "zh": "等待连接"
  },
  "Active session": {
    "tr": "Etkin oturum",
    "ru": "Активный сеанс",
    "zh": "会话运行中"
  },
  "Steam Guard": {
    "tr": "Steam Guard",
    "ru": "Steam Guard",
    "zh": "Steam Guard"
  },
  "Session remembered for this Windows account.": {
    "tr": "Oturum bu Windows hesabında hatırlanıyor.",
    "ru": "Сеанс сохранён для этого аккаунта Windows.",
    "zh": "已为此 Windows 账户记住会话。"
  },
  "Session kept only while the app is open.": {
    "tr": "Oturum yalnızca uygulama açıkken korunur.",
    "ru": "Сеанс хранится только во время работы приложения.",
    "zh": "仅在应用运行时保留会话。"
  },
  "Preview only. Open the desktop application to use these settings.": {
    "tr": "Yalnızca önizleme. Ayarlar için masaüstü uygulamasını aç.",
    "ru": "Только предпросмотр. Откройте приложение для изменения настроек.",
    "zh": "仅为预览。请打开桌面应用以使用这些设置。"
  },
  "System tray unavailable. Closing the window quits the app.": {
    "tr": "Sistem tepsisi yok. Pencereyi kapatmak uygulamadan çıkar.",
    "ru": "Трей недоступен. Закрытие окна завершит приложение.",
    "zh": "系统托盘不可用。关闭窗口将退出应用。"
  },
  "Select games to start automatically.": {
    "tr": "Otomatik başlatmak için oyun seç.",
    "ru": "Выберите игры для автоматического запуска.",
    "zh": "请选择要自动启动的游戏。"
  },
  "Sign in and enable Remember this session for automatic startup.": {
    "tr": "Otomatik açılış için giriş yapıp Oturumu hatırla seçeneğini aç.",
    "ru": "Для автозапуска войдите и включите сохранение сеанса.",
    "zh": "请登录并启用“记住此会话”，以使用自动启动功能。"
  },
  "Selected games start automatically when you sign in to Windows.": {
    "tr": "Windows oturumu açılınca seçili oyunlar otomatik başlar.",
    "ru": "Выбранные игры запускаются при входе в Windows.",
    "zh": "登录 Windows 时将自动开始所选游戏会话。"
  },
  "The app opens in the tray on Windows login. Start games manually.": {
    "tr": "Windows açılışında tepside açılır. Oyunları elle başlat.",
    "ru": "Приложение открывается в трее при входе в Windows. Игры запускаются вручную.",
    "zh": "登录 Windows 时应用将在托盘中启动。请手动开始游戏会话。"
  },
  "Windows startup is off.": {
    "tr": "Windows başlangıcı kapalı.",
    "ru": "Автозапуск Windows отключён.",
    "zh": "随 Windows 启动已关闭。"
  },
  "Reading playtime from Steam…": {
    "tr": "Steam’den süre okunuyor…",
    "ru": "Получение времени игры из Steam…",
    "zh": "正在读取 Steam 游戏时长…"
  },
  "Last reading: {time}": {
    "tr": "Son okuma: {time}",
    "ru": "Последнее чтение: {time}",
    "zh": "上次读取：{time}"
  },
  "Wait {seconds}s before entering a new code.": {
    "tr": "Yeni kod için {seconds} sn bekle.",
    "ru": "Подождите {seconds} с перед вводом нового кода.",
    "zh": "请等待 {seconds} 秒后输入新验证码。"
  },
  "Your code is sent only to Steam and is never saved.": {
    "tr": "Kod yalnızca Steam’e gönderilir, kaydedilmez.",
    "ru": "Код отправляется только Steam и не сохраняется.",
    "zh": "验证码仅发送给 Steam，且不会保存。"
  },
  "{count} games selected": {
    "tr": "{count} oyun seçili",
    "ru": "Выбрано игр: {count}",
    "zh": "已选择 {count} 款游戏"
  },
  "Search Steam and add games to your favorites.": {
    "tr": "Steam’de ara ve oyunları favorilerine ekle.",
    "ru": "Ищите игры в Steam и добавляйте в избранное.",
    "zh": "搜索 Steam 游戏并添加到收藏。"
  },
  "In favorites": {
    "tr": "Favorilerde",
    "ru": "В избранном",
    "zh": "已收藏"
  },
  "+ Favorite": {
    "tr": "+ Favori",
    "ru": "+ В избранное",
    "zh": "+ 收藏"
  },
  "Added to favorites. Select the game to start a session.": {
    "tr": "Favoriye eklendi. Oturum için oyunu seç.",
    "ru": "Добавлено в избранное. Выберите игру для начала сеанса.",
    "zh": "已添加到收藏。选择游戏以开始会话。"
  },
  "Enter at least two characters to search.": {
    "tr": "Aramak için en az iki harf yaz.",
    "ru": "Для поиска введите не менее двух символов.",
    "zh": "请输入至少两个字符进行搜索。"
  },
  "Searching the Steam Store…": {
    "tr": "Steam mağazasında aranıyor…",
    "ru": "Поиск в магазине Steam…",
    "zh": "正在搜索 Steam 商店…"
  },
  "Choose a game to add to your favorites.": {
    "tr": "Favorilerine eklemek istediğin oyunu seç.",
    "ru": "Выберите игру для добавления в избранное.",
    "zh": "选择要添加到收藏的游戏。"
  },
  "No games found. Try a different name.": {
    "tr": "Oyun bulunamadı. Farklı bir ad dene.",
    "ru": "Игры не найдены. Попробуйте другое название.",
    "zh": "未找到游戏。请尝试其他名称。"
  },
  "Search could not be completed. Try again.": {
    "tr": "Arama tamamlanamadı. Yeniden dene.",
    "ru": "Не удалось завершить поиск. Попробуйте снова.",
    "zh": "无法完成搜索，请重试。"
  },
  "FiveM shortcut saved.": {
    "tr": "FiveM kısayolu kaydedildi.",
    "ru": "Ярлык FiveM сохранён.",
    "zh": "FiveM 快捷方式已保存。"
  },
  "FiveM launch requested. This does not add Steam playtime.": {
    "tr": "FiveM başlatma isteği gönderildi. Steam süresi eklenmez.",
    "ru": "Запуск FiveM запрошен. Время Steam не добавляется.",
    "zh": "已请求启动 FiveM。此操作不会增加 Steam 游戏时长。"
  },
  "Status could not be read.": {
    "tr": "Durum okunamadı.",
    "ru": "Не удалось прочитать состояние.",
    "zh": "无法读取状态。"
  },
  "Preview only. Open SteamHours.exe to connect to Steam.": {
    "tr": "Yalnızca önizleme. Steam’e bağlanmak için SteamHours.exe aç.",
    "ru": "Только предпросмотр. Для подключения к Steam откройте SteamHours.exe.",
    "zh": "仅为预览。请打开 SteamHours.exe 以连接到 Steam。"
  },
  "Action could not be completed.": {
    "tr": "İşlem tamamlanamadı.",
    "ru": "Не удалось выполнить действие.",
    "zh": "无法完成操作。"
  },
  "Action could not be completed. Try again.": {
    "tr": "İşlem tamamlanamadı. Yeniden dene.",
    "ru": "Не удалось выполнить действие. Попробуйте снова.",
    "zh": "无法完成操作，请重试。"
  },
  "Disconnected.": {
    "tr": "Bağlı değil.",
    "ru": "Отключено.",
    "zh": "已断开连接。"
  },
  "Disconnected": {
    "tr": "Bağlı değil",
    "ru": "Отключено",
    "zh": "未连接"
  },
  "Connecting": {
    "tr": "Bağlanıyor",
    "ru": "Подключение",
    "zh": "正在连接"
  },
  "Restoring session": {
    "tr": "Oturum açılıyor",
    "ru": "Восстановление сеанса",
    "zh": "正在恢复会话"
  },
  "Connected": {
    "tr": "Bağlı",
    "ru": "Подключено",
    "zh": "已连接"
  },
  "Active": {
    "tr": "Etkin",
    "ru": "Активно",
    "zh": "运行中"
  },
  "Waiting": {
    "tr": "Bekliyor",
    "ru": "Ожидание",
    "zh": "等待中"
  },
  "Waiting for Steam Guard": {
    "tr": "Steam Guard bekleniyor",
    "ru": "Ожидание Steam Guard",
    "zh": "等待 Steam Guard"
  },
  "Open Steam Hours": {
    "tr": "Steam Saat’i aç",
    "ru": "Открыть Steam Hours",
    "zh": "打开 Steam Hours"
  },
  "Start selected games": {
    "tr": "Seçili oyunları başlat",
    "ru": "Запустить выбранные игры",
    "zh": "启动所选游戏"
  },
  "Your session is encrypted for this Windows account. Your password is never saved.": {
    "tr": "Oturum bu Windows hesabında şifrelenerek hatırlanır; şifren kaydedilmez.",
    "ru": "Сеанс зашифрован для этого аккаунта Windows. Пароль не сохраняется.",
    "zh": "会话已为此 Windows 账户加密。密码不会被保存。"
  },
  "Sign in to Steam to reconnect.": {
    "tr": "Yeniden bağlanmak için Steam’e giriş yap.",
    "ru": "Войдите в Steam для повторного подключения.",
    "zh": "请登录 Steam 以重新连接。"
  },
  "Add this game to your favorites first.": {
    "tr": "Önce oyunu favorilere ekle.",
    "ru": "Сначала добавьте игру в избранное.",
    "zh": "请先将此游戏添加到收藏。"
  },
  "Session encrypted with Windows. It will reconnect next time.": {
    "tr": "Oturum Windows ile şifrelendi. Bir sonraki açılışta otomatik bağlanır.",
    "ru": "Сеанс зашифрован Windows. При следующем запуске он будет восстановлен.",
    "zh": "会话已通过 Windows 加密，下次启动时将重新连接。"
  },
  "Session could not be saved securely. No unencrypted session was written.": {
    "tr": "Oturum kaydedilemedi. Windows şifrelemesi veya dosya erişimi kullanılamıyor; şifresiz kayıt yapılmadı.",
    "ru": "Не удалось безопасно сохранить сеанс. Незашифрованные данные не записаны.",
    "zh": "无法安全保存会话，未写入未加密的会话数据。"
  },
  "Steam connection closed. You can sign in again.": {
    "tr": "Steam işlemi kapandı. Yeniden giriş yapabilirsin.",
    "ru": "Соединение со Steam закрыто. Вы можете войти снова.",
    "zh": "Steam 连接已关闭，您可以重新登录。"
  },
  "Steam component unavailable. Reopen the application.": {
    "tr": "Steam kütüphanesi yüklenemedi. Önce kurulumu tamamla.",
    "ru": "Компонент Steam недоступен. Перезапустите приложение.",
    "zh": "Steam 组件不可用，请重新打开应用。"
  },
  "No Steam connection.": {
    "tr": "Steam bağlantısı yok.",
    "ru": "Нет соединения со Steam.",
    "zh": "没有 Steam 连接。"
  },
  "Request timed out. Connection closed.": {
    "tr": "İşlem zaman aşımına uğradı. Bağlantı kapatıldı.",
    "ru": "Время ожидания истекло. Соединение закрыто.",
    "zh": "请求超时，连接已关闭。"
  },
  "Request timed out.": {
    "tr": "İşlem zaman aşımına uğradı.",
    "ru": "Время ожидания истекло.",
    "zh": "请求超时。"
  },
  "Steam connection unavailable.": {
    "tr": "Steam işlemine ulaşılamadı.",
    "ru": "Соединение со Steam недоступно.",
    "zh": "Steam 连接不可用。"
  },
  "Invalid interface.": {
    "tr": "Geçersiz arayüz.",
    "ru": "Недопустимый интерфейс.",
    "zh": "无效的界面。"
  },
  "Action failed. Check your connection and selection.": {
    "tr": "İşlem yapılamadı. Seçimini ve bağlantını kontrol et.",
    "ru": "Действие не выполнено. Проверьте подключение и выбор игр.",
    "zh": "操作失败，请检查连接和所选游戏。"
  },
  "Disconnect the current session first.": {
    "tr": "Önce mevcut bağlantıyı kes.",
    "ru": "Сначала отключите текущий сеанс.",
    "zh": "请先断开当前会话。"
  },
  "Your session will be encrypted after a successful sign-in.": {
    "tr": "Başarılı girişten sonra oturum şifrelenerek hatırlanır.",
    "ru": "Сеанс будет зашифрован после успешного входа.",
    "zh": "成功登录后，会话将被加密保存。"
  },
  "This session will not be saved.": {
    "tr": "Bu oturum kaydedilmeyecek.",
    "ru": "Этот сеанс не будет сохранён.",
    "zh": "此会话不会被保存。"
  },
  "Check the five-character code.": {
    "tr": "5 karakterli kodu kontrol et.",
    "ru": "Проверьте код из пяти символов.",
    "zh": "请检查五位验证码。"
  },
  "Wait before entering a new code.": {
    "tr": "Yeni kod için bekleme süresinin dolmasını bekle.",
    "ru": "Подождите перед вводом нового кода.",
    "zh": "请稍候再输入新验证码。"
  },
  "Wait for the current connection to finish.": {
    "tr": "Önce mevcut bağlantının tamamlanmasını bekle.",
    "ru": "Дождитесь завершения текущего подключения.",
    "zh": "请等待当前连接完成。"
  },
  "Sign in to Steam again.": {
    "tr": "Steam hesabına yeniden giriş yap.",
    "ru": "Войдите в Steam снова.",
    "zh": "请重新登录 Steam。"
  },
  "Invalid setting.": {
    "tr": "Geçersiz ayar.",
    "ru": "Недопустимая настройка.",
    "zh": "无效的设置。"
  },
  "Invalid game.": {
    "tr": "Geçersiz oyun.",
    "ru": "Недопустимая игра.",
    "zh": "无效的游戏。"
  },
  "Windows startup settings are unavailable.": {
    "tr": "Windows başlangıç ayarlarına bu oturumda erişilemiyor.",
    "ru": "Настройки автозапуска Windows недоступны.",
    "zh": "Windows 启动设置不可用。"
  },
  "System tray unavailable.": {
    "tr": "Sistem tepsisi kullanılamıyor.",
    "ru": "Системный трей недоступен.",
    "zh": "系统托盘不可用。"
  },
  "Search unavailable. Enter at least two characters and try again shortly.": {
    "tr": "Steam araması alınamadı. En az 2 harf yazıp biraz sonra yeniden dene.",
    "ru": "Поиск недоступен. Введите не менее двух символов и повторите позже.",
    "zh": "搜索不可用。请输入至少两个字符，稍后重试。"
  },
  "Stop the session before changing favorites.": {
    "tr": "Favorileri değiştirmeden önce işlemi durdur.",
    "ru": "Остановите сеанс перед изменением избранного.",
    "zh": "请先停止会话，再更改收藏。"
  },
  "You can add up to 50 favorites.": {
    "tr": "En fazla 50 favori ekleyebilirsin.",
    "ru": "Можно добавить до 50 избранных игр.",
    "zh": "最多可添加 50 款收藏游戏。"
  },
  "This item could not be verified as a game. DLC and bundles are not supported.": {
    "tr": "Bu öğe oyun olarak doğrulanamadı. DLC ve paketler eklenmez.",
    "ru": "Не удалось подтвердить, что это игра. DLC и наборы не поддерживаются.",
    "zh": "无法确认此项目为游戏。不支持 DLC 和捆绑包。"
  },
  "Stop the session first.": {
    "tr": "Önce işlemi durdur.",
    "ru": "Сначала остановите сеанс.",
    "zh": "请先停止会话。"
  },
  "This favorite cannot be removed right now.": {
    "tr": "Bu favori şu anda kaldırılamaz.",
    "ru": "Сейчас эту игру нельзя удалить из избранного.",
    "zh": "目前无法移除此收藏。"
  },
  "Saved session removed. Sign in again to reconnect.": {
    "tr": "Kayıtlı oturum silindi. Yeniden giriş yapman gerekir.",
    "ru": "Сохранённый сеанс удалён. Войдите снова для подключения.",
    "zh": "已删除保存的会话。请重新登录以连接。"
  },
  "Choose FiveM.exe": {
    "tr": "FiveM.exe dosyasını seç",
    "ru": "Выберите FiveM.exe",
    "zh": "选择 FiveM.exe"
  },
  "Choose a file named FiveM.exe.": {
    "tr": "FiveM.exe adlı dosyayı seç.",
    "ru": "Выберите файл с именем FiveM.exe.",
    "zh": "请选择名为 FiveM.exe 的文件。"
  },
  "Choose FiveM.exe first.": {
    "tr": "Önce FiveM.exe dosyasını seç.",
    "ru": "Сначала выберите FiveM.exe.",
    "zh": "请先选择 FiveM.exe。"
  },
  "FiveM could not be opened. Select its file again.": {
    "tr": "FiveM açılamadı. Dosyayı yeniden seç.",
    "ru": "Не удалось открыть FiveM. Выберите файл снова.",
    "zh": "无法打开 FiveM，请重新选择文件。"
  },
  "Checking saved session.": {
    "tr": "Kayıtlı oturum kontrol ediliyor.",
    "ru": "Проверка сохранённого сеанса.",
    "zh": "正在检查保存的会话。"
  },
  "Computer entering sleep. Session stopped.": {
    "tr": "Bilgisayar uykuya geçiyor. Süre işlemi durduruldu.",
    "ru": "Компьютер переходит в сон. Сеанс остановлен.",
    "zh": "电脑即将休眠，会话已停止。"
  },
  "Saved session could not connect. Sign in again or remove it.": {
    "tr": "Kayıtlı oturumla bağlantı kurulamadı. Yeniden giriş yapabilir veya kaydı silebilirsin.",
    "ru": "Не удалось подключиться через сохранённый сеанс. Войдите снова или удалите его.",
    "zh": "无法使用保存的会话连接。请重新登录或删除该会话。"
  },
  "Disconnected. Sign in to Steam.": {
    "tr": "Bağlı değil. Steam hesabına giriş yap.",
    "ru": "Отключено. Войдите в Steam.",
    "zh": "未连接。请登录 Steam。"
  },
  "Saved session could not be decrypted. Sign in again or remove it.": {
    "tr": "Kayıtlı oturum çözülemedi. Yeniden giriş yap veya kaydı sil.",
    "ru": "Не удалось расшифровать сеанс. Войдите снова или удалите его.",
    "zh": "无法解密保存的会话。请重新登录或删除该会话。"
  },
  "Check your account name and password.": {
    "tr": "Kullanıcı adı ve şifreyi kontrol et.",
    "ru": "Проверьте имя аккаунта и пароль.",
    "zh": "请检查账户名称和密码。"
  },
  "Select up to 32 Steam games.": {
    "tr": "En fazla 32 Steam oyunu seç.",
    "ru": "Выберите не более 32 игр Steam.",
    "zh": "最多可选择 32 款 Steam 游戏。"
  },
  "Steam playtime has not been read yet.": {
    "tr": "Steam süresi henüz okunmadı.",
    "ru": "Время игры Steam ещё не получено.",
    "zh": "尚未读取 Steam 游戏时长。"
  },
  "Invalid saved session.": {
    "tr": "Geçersiz kayıtlı oturum.",
    "ru": "Недопустимый сохранённый сеанс.",
    "zh": "保存的会话无效。"
  },
  "Connecting to Steam. Check the Steam mobile app if approval is requested.": {
    "tr": "Steam bağlantısı kuruluyor. Mobil onay istenirse Steam uygulamanı kontrol et.",
    "ru": "Подключение к Steam. При запросе подтверждения проверьте мобильное приложение Steam.",
    "zh": "正在连接 Steam。如需授权，请查看 Steam 手机应用。"
  },
  "Another game session is active. Nothing was started.": {
    "tr": "Hesap başka bir oturumda oyun oynuyor. İşlem başlatılmadı.",
    "ru": "Другой игровой сеанс активен. Запуск отменён.",
    "zh": "其他游戏会话正在运行。未启动任何游戏。"
  },
  "Steam connected. Choose your games and start.": {
    "tr": "Steam bağlantısı hazır. Oyun seçip başlatabilirsin.",
    "ru": "Steam подключён. Выберите игры и начните сеанс.",
    "zh": "已连接 Steam。请选择游戏并开始会话。"
  },
  "Code rejected. Wait 30 seconds before entering a new code.": {
    "tr": "Kod reddedildi. 30 saniye sonra yeni kodu gir.",
    "ru": "Код отклонён. Подождите 30 секунд перед вводом нового кода.",
    "zh": "验证码被拒绝。请等待 30 秒后输入新验证码。"
  },
  "Enter the Steam Guard code from your email.": {
    "tr": "E-postana gelen Steam Guard kodunu gir.",
    "ru": "Введите код Steam Guard из электронной почты.",
    "zh": "请输入电子邮件中的 Steam Guard 验证码。"
  },
  "Enter the Steam Guard code from your mobile app.": {
    "tr": "Steam mobil uygulamasındaki Steam Guard kodunu gir.",
    "ru": "Введите код Steam Guard из мобильного приложения.",
    "zh": "请输入手机应用中的 Steam Guard 验证码。"
  },
  "Another game session is active. This session stopped without interrupting it.": {
    "tr": "Hesap başka yerde oyun oynuyor. Saat işlemi durduruldu; diğer oturuma müdahale edilmedi.",
    "ru": "Активен другой игровой сеанс. Этот сеанс остановлен, не прерывая другой.",
    "zh": "其他游戏会话正在运行。此会话已停止，未中断其他会话。"
  },
  "The other game session ended. You can start again.": {
    "tr": "Diğer oyun oturumu sona erdi. İstersen yeniden başlatabilirsin.",
    "ru": "Другой игровой сеанс завершён. Можно начать снова.",
    "zh": "其他游戏会话已结束，您可以重新开始。"
  },
  "Steam disconnected.": {
    "tr": "Steam bağlantısı kesildi.",
    "ru": "Соединение со Steam разорвано.",
    "zh": "Steam 连接已断开。"
  },
  "Steam session rejected. You may need to sign in again.": {
    "tr": "Steam oturumu reddedildi. Yeniden giriş gerekebilir.",
    "ru": "Сеанс Steam отклонён. Возможно, потребуется повторный вход.",
    "zh": "Steam 会话被拒绝，可能需要重新登录。"
  },
  "Sign-in timed out. Try again.": {
    "tr": "Giriş süresi doldu. Yeniden deneyebilirsin.",
    "ru": "Время ожидания входа истекло. Попробуйте снова.",
    "zh": "登录超时，请重试。"
  },
  "Sign-in could not start. Try again.": {
    "tr": "Giriş başlatılamadı. Yeniden deneyebilirsin.",
    "ru": "Не удалось начать вход. Попробуйте снова.",
    "zh": "无法开始登录，请重试。"
  },
  "Playtime unavailable.": {
    "tr": "Süre okunamadı.",
    "ru": "Время игры недоступно.",
    "zh": "游戏时长不可用。"
  },
  "Totals reported by Steam. Updates can be delayed; increases cannot be attributed solely to this app.": {
    "tr": "Steam’in bildirdiği toplam süre. Güncelleme gecikebilir; artış bu uygulamaya özel olarak ölçülemez.",
    "ru": "Общее время по данным Steam. Обновления могут задерживаться; прирост не обязательно связан только с этим приложением.",
    "zh": "总时长由 Steam 提供。更新可能延迟，时长增加无法完全归因于此应用。"
  },
  "Steam playtime unavailable. Privacy, game access or connection may be the cause. Previous values show the last successful reading.": {
    "tr": "Steam süresi alınamadı. Profil gizliliği, oyun erişimi veya bağlantı etkili olabilir. Varsa önceki değer son başarılı okumadır.",
    "ru": "Время Steam недоступно. Возможны ограничения приватности, доступа к игре или подключения. Старые значения соответствуют последнему успешному чтению.",
    "zh": "无法获取 Steam 时长，可能受隐私设置、游戏访问权限或连接影响。旧数值表示上次成功读取的结果。"
  },
  "No code is currently requested.": {
    "tr": "Şu anda kod beklenmiyor.",
    "ru": "Сейчас код не запрашивается.",
    "zh": "当前未请求验证码。"
  },
  "Wait 30 seconds before entering a new code.": {
    "tr": "Yeni kod için 30 saniyelik beklemenin bitmesini bekle.",
    "ru": "Подождите 30 секунд перед вводом нового кода.",
    "zh": "请等待 30 秒后输入新验证码。"
  },
  "Check the five-character Steam Guard code.": {
    "tr": "5 karakterli Steam Guard kodunu kontrol et.",
    "ru": "Проверьте код Steam Guard из пяти символов.",
    "zh": "请检查五位 Steam Guard 验证码。"
  },
  "Steam is checking your code.": {
    "tr": "Kod Steam tarafından kontrol ediliyor.",
    "ru": "Steam проверяет ваш код.",
    "zh": "Steam 正在验证您的验证码。"
  },
  "Connect to Steam first.": {
    "tr": "Önce Steam hesabına bağlan.",
    "ru": "Сначала подключитесь к Steam.",
    "zh": "请先连接到 Steam。"
  },
  "Another game session is active.": {
    "tr": "Hesap başka yerde oyun oynuyor.",
    "ru": "Другой игровой сеанс активен.",
    "zh": "其他游戏会话正在运行。"
  },
  "Connection or game state changed.": {
    "tr": "Bağlantı veya oyun durumu değişti.",
    "ru": "Состояние подключения или игры изменилось.",
    "zh": "连接或游戏状态已更改。"
  },
  "Selected games reported to Steam. The local timer does not guarantee Steam playtime.": {
    "tr": "Seçili oyunlar Steam’e bildirildi. Sayaç yerel oturum süresidir; Steam saati garantisi değildir.",
    "ru": "Выбранные игры переданы Steam. Локальный таймер не гарантирует учёт времени в Steam.",
    "zh": "已向 Steam 报告所选游戏。本地计时器不保证 Steam 会记录游戏时长。"
  },
  "Game activity could not be reported. Connection closed.": {
    "tr": "Oyun bildirimi gönderilemedi. Bağlantı kapatıldı.",
    "ru": "Не удалось передать игровую активность. Соединение закрыто.",
    "zh": "无法报告游戏活动，连接已关闭。"
  },
  "Stopped. Starting again resets the local timer.": {
    "tr": "Durduruldu. Yeniden başlatınca sayaç sıfırlanır.",
    "ru": "Остановлено. Новый запуск сбросит локальный таймер.",
    "zh": "已停止。重新开始时本地计时器会重置。"
  },
  "Windows encryption is required.": {
    "tr": "Windows şifrelemesi gerekli.",
    "ru": "Требуется шифрование Windows.",
    "zh": "需要 Windows 加密。"
  },
  "Encryption unavailable.": {
    "tr": "Şifreleme kullanılamıyor.",
    "ru": "Шифрование недоступно.",
    "zh": "加密不可用。"
  },
  "Invalid session.": {
    "tr": "Geçersiz oturum.",
    "ru": "Недопустимый сеанс.",
    "zh": "无效的会话。"
  },
  "Invalid session file.": {
    "tr": "Geçersiz oturum dosyası.",
    "ru": "Недопустимый файл сеанса.",
    "zh": "无效的会话文件。"
  },
  "Saved session could not be read.": {
    "tr": "Kayıtlı oturum okunamadı.",
    "ru": "Не удалось прочитать сохранённый сеанс.",
    "zh": "无法读取保存的会话。"
  },
  "Updates are available in the desktop application.": {
    "tr": "Güncellemeler kurulu uygulamada etkinleşir.",
    "ru": "Обновления доступны в установленном приложении.",
    "zh": "更新功能可在桌面应用中使用。"
  },
  "Checking for updates…": {
    "tr": "Güncellemeler kontrol ediliyor…",
    "ru": "Проверка обновлений…",
    "zh": "正在检查更新…"
  },
  "Downloading a new version in the background…": {
    "tr": "Yeni sürüm arka planda indiriliyor…",
    "ru": "Загрузка новой версии в фоне…",
    "zh": "正在后台下载新版本…"
  },
  "You are up to date.": {
    "tr": "Uygulama güncel.",
    "ru": "Установлена последняя версия.",
    "zh": "已是最新版本。"
  },
  "Download progress: {percent}%": {
    "tr": "İndirme ilerlemesi: %{percent}",
    "ru": "Загрузка: {percent}%",
    "zh": "下载进度：{percent}%"
  },
  "Update ready. It will install when you quit.": {
    "tr": "Güncelleme hazır. Uygulamadan çıkınca yüklenir.",
    "ru": "Обновление готово. Оно установится при выходе.",
    "zh": "更新已就绪，将在退出应用时安装。"
  },
  "Update unavailable. It will be checked again later.": {
    "tr": "Güncelleme alınamadı. Daha sonra yeniden denenecek.",
    "ru": "Обновление недоступно. Проверка повторится позже.",
    "zh": "暂时无法更新，稍后将再次检查。"
  },
  "Updates are checked automatically.": {
    "tr": "Güncellemeler otomatik kontrol edilir.",
    "ru": "Обновления проверяются автоматически.",
    "zh": "将自动检查更新。"
  },
  "Update component unavailable.": {
    "tr": "Güncelleme bileşeni yüklenemedi.",
    "ru": "Компонент обновлений недоступен.",
    "zh": "更新组件不可用。"
  },
  "Invalid command.": {
    "tr": "Geçersiz komut.",
    "ru": "Недопустимая команда.",
    "zh": "无效的命令。"
  },
  "Action failed. Check your connection, selection or code.": {
    "tr": "İşlem yapılamadı. Bağlantı durumunu, seçimi veya kodu kontrol et.",
    "ru": "Действие не выполнено. Проверьте подключение, выбор игр или код.",
    "zh": "操作失败，请检查连接、所选游戏或验证码。"
  },
  "Steam connection closed.": {
    "tr": "Steam işlemi kapandı.",
    "ru": "Соединение со Steam закрыто.",
    "zh": "Steam 连接已关闭。"
  },
  "Windows startup could not be read. Access policies may be blocking it.": {
    "tr": "Windows başlangıç kaydı okunamadı. Windows erişim ilkeleri bu işlemi engelliyor olabilir.",
    "ru": "Не удалось прочитать автозапуск Windows. Возможно, доступ ограничен политиками.",
    "zh": "无法读取 Windows 启动设置，可能受到访问策略限制。"
  },
  "Windows startup could not be saved. Check Windows security or organization policies.": {
    "tr": "Windows başlangıç ayarı yazılamadı. Windows güvenlik ayarlarını veya kurum ilkelerini kontrol et.",
    "ru": "Не удалось сохранить автозапуск. Проверьте безопасность Windows или политики организации.",
    "zh": "无法保存 Windows 启动设置，请检查 Windows 安全设置或组织策略。"
  },
  "Windows startup could not be verified. Access policies may be blocking it.": {
    "tr": "Windows başlangıç kaydı oluşturulamadı veya doğrulanamadı. Windows erişim ilkeleri bu işlemi engelliyor olabilir.",
    "ru": "Не удалось проверить автозапуск. Возможно, доступ ограничен политиками.",
    "zh": "无法验证 Windows 启动设置，可能受到访问策略限制。"
  },
  "Windows disabled this startup entry. Enable Steam Hours in Task Manager > Startup apps.": {
    "tr": "Windows bu başlangıç kaydını devre dışı bırakmış. Görev Yöneticisi > Başlangıç uygulamaları bölümünde Steam Saat’i etkinleştir.",
    "ru": "Windows отключила автозапуск. Включите Steam Hours в диспетчере задач > Автозагрузка приложений.",
    "zh": "Windows 已禁用此启动项。请在任务管理器 > 启动应用中启用 Steam Hours。"
  },
  "Windows startup could not be removed. Disable Steam Hours in Task Manager > Startup apps.": {
    "tr": "Windows başlangıç kaydı kaldırılamadı. Görev Yöneticisi > Başlangıç uygulamaları bölümünden Steam Saat’i devre dışı bırakabilirsin.",
    "ru": "Не удалось удалить автозапуск. Отключите Steam Hours в диспетчере задач > Автозагрузка приложений.",
    "zh": "无法移除 Windows 启动项。请在任务管理器 > 启动应用中禁用 Steam Hours。"
  },
  "Invalid startup setting.": {
    "tr": "Geçersiz başlangıç ayarı.",
    "ru": "Недопустимая настройка автозапуска.",
    "zh": "无效的启动设置。"
  }
};
  const languages = Object.freeze(['en', 'tr', 'ru', 'zh']);
  const locale = language => ({en:'en-US', tr:'tr-TR', ru:'ru-RU', zh:'zh-CN'})[language] || 'en-US';
  function t(key, language = 'en', params = {}) {
    const template = language === 'en' ? key : messages[key]?.[language] || key;
    return String(template).replace(/\{(\w+)\}/g, (match, name) => Object.hasOwn(params || {}, name) ? String(params[name]) : match);
  }
  const api = Object.freeze({ t, languages, locale, messages });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SteamHoursI18n = api;
})(typeof window !== 'undefined' ? window : globalThis);
