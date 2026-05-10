export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  imageUrl: string;
  author: string;
  authorTitle: string;
  readMinutes: number;
  tags: string[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "aqilli-otel-texnologiyasi-geleceyi",
    title: "Ağıllı Otel Texnologiyası: Qonaq Təcrübəsini Kökündən Dəyişən 5 İnnovasiya",
    excerpt: "IoT, süni intellekt və real-vaxt analitikası — müasir otelçiliyin əsas sütunları artıq mövcuddur. O.S.S. platforması bu texnologiyaları bir çatı altında birləşdirir.",
    date: "2026-05-01",
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80",
    author: "O.S.S. Komandası",
    authorTitle: "Məhsul & Texnologiya",
    readMinutes: 6,
    tags: ["Smart Otel", "Texnologiya", "IoT", "PMS"],
    content: `
<p class="lead">Otelçilik sənayesi son on ildə kəskin bir dönüşüm yaşayır. Rəqabətin artması, qonaqların gözləntilərinin yüksəlməsi və əməliyyat xərclərinin artması otel sahiblərini yeni həllər axtarmağa vadar edir. Ağıllı texnologiyalar bu problemlərə cavab vermir — onları tamamilə aradan qaldırır.</p>

<h2>1. IoT ilə Ağıllı Otaq İdarəetməsi</h2>
<p>İnternetə bağlı cihazlar — IoT — otel otaqlarını tamamilə fərqli bir təcrübəyə çevirir. Qonaq otağa girəndə işıqlar avtomatik yandırılır, kondisioner onun əvvəlki üstünlüklərini xatırlayır, pərdələr günəşin bucağına görə tənzimlənir. Bu sadəcə rahatlıq deyil — bu, fərdiləşdirilmiş xidmətin yeni standartıdır.</p>
<p>O.S.S. platformasında hər otağın parlaqlıq, pərdə mövqeyi və temperatur parametrləri real vaxtda izlənilir. Texniki heyət qırılan ampulu qonaq şikayət etməzdən əvvəl dəyişdirir. Enerji istehlakı 30–40% azalır — bu rəqəm iri otellərdə onminlərlə manata bərabər olur.</p>

<h2>2. Süni İntellekt Əsaslı Dinamik Qiymətləndirmə</h2>
<p>RevPAR-ı artırmağın ən güclü yolu doğru vaxtda doğru qiyməti təyin etməkdir. Ənənəvi yanaşmada bu prosesi menecerlər əl ilə idarə edirdi — həftə sonları, bayramlar, yerli tədbirlər nəzərə alınaraq. Süni intellekt bu işi saniyələr içində görür.</p>
<p>O.S.S.-in dinamik qiymətləndirmə mühərriki mövcud bron tarixçəsini, bazardakı tələbi, rəqiblərin qiymətlərini və mövsümi amilləri eyni anda analiz edir. Nəticə? Doldurma faizi orta hesabla 15–25% artır, orta gün qiyməti (ADR) isə rəqabətli olaraq qalır.</p>

<h2>3. Rəqəmsal Yoxlama Sistemləri (Online Check-in)</h2>
<p>COVID-19 pandemiyası qonaqların resepsiyadakı növbəyə dözümsüzlüyünü artırdı. Amma bu tendensiya pandemiyadan çox-çox əvvəl başlamışdı — sadəcə daha aydın göründü. Müasir qonaq otelə çatmazdan əvvəl bütün məlumatlarını online doldurmaq, rəqəmsal imza atmaq və otağına düz getmək istəyir.</p>
<p>O.S.S.-in online check-in modulu qonağa gəlişindən 24 saat əvvəl link göndərir. Şəxsiyyət vəsiqəsinin şəklini yükləməkdən tutmuş xüsusi istəklərini (yüksək mərtəbə, taxta çarpayı, yarım pansion) qeyd etməyə qədər hər şey mobil cihazdan həll olunur. Resepsiya heyəti isə real işə — qonaq münasibətinə — fokuslanır.</p>

<h2>4. Real Vaxt Analitika Paneli</h2>
<p>Data olmadan qərar qəbul etmək qaranın içində sürmək kimidir. Müasir otel rəhbərliyi hər gün ən azı aşağıdakı göstəriciləri izləməlidir: dolulma faizi, RevPAR, ADR, GopPAR, kanallar üzrə bron bölgüsü, xərclər strukturu.</p>
<p>O.S.S.-in analitika paneli bu məlumatları real vaxtda, vizual formatda təqdim edir. Sahibkar səhər açılanda öncəki gecəni tam olaraq görür: hansı otaqlar boş qaldı, hansı kanaldan nə qədər bron gəldi, xidmət xərcləri gəlirlə nisbəti necədir. Bu şəffaflıq strateji qərarların keyfiyyətini kökündən yaxşılaşdırır.</p>

<h2>5. Çox Mülklü İdarəetmə (Multi-Property Management)</h2>
<p>Birdən çox otel idarə edən sahibkarların ən böyük problemlərindən biri məlumat parçalanmasıdır. Hər otelin öz sistemi var, mühasibat ayrı aparılır, hesabat birləşdirilmir. O.S.S. bu problemi həll etmək üçün layihələndirilmişdir.</p>
<p>Vahid platforma üzərindən bütün mülkləri real vaxtda izləyə, heyəti idarə edə, müştəri tarixçəsini görmə imkanınız var. İstər Bakıda, istərsə də Şəkidə otelləriniz olsun — bütünü bir ekrandan idarə olunur.</p>

<h2>Nəticə</h2>
<p>Ağıllı otel texnologiyası artıq iri beynəlxalq brendlərin inhisarı deyil. O.S.S. bu imkanları Azərbaycan bazarına, münasib qiymətlə, yerli dillə gətirir. 14 gün pulsuz sınaq üçün indi qeydiyyatdan keçin.</p>
    `,
  },
  {
    slug: "revpar-artirmaq-5-strategiya",
    title: "RevPAR-ı Artırmağın 5 Effektiv Strategiyası: Otel Gəlirini Maksimuma Çatdırın",
    excerpt: "Dolulma faizini artırmaq yalnız bir hissədir. RevPAR, ADR və GopPAR göstəricilərini optimallaşdırmaq üçün praktiki strategiyalar.",
    date: "2026-04-22",
    imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&q=80",
    author: "O.S.S. Komandası",
    authorTitle: "Gəlir İdarəetməsi",
    readMinutes: 7,
    tags: ["Gəlir İdarəetməsi", "RevPAR", "ADR", "Strategiya"],
    content: `
<p class="lead">RevPAR (Revenue Per Available Room) — mövcud otaq başına düşən gəlir — otel performansının ən mühüm göstəricilərindən biridir. Bu rəqəmi artırmaq üçün yalnız dolulma faizinə fokuslanmaq kifayət deyil. Doğru strategiya tarazlaşdırılmış yanaşma tələb edir.</p>

<h2>1. Dinamik Qiymətləndirməni Tətbiq Edin</h2>
<p>Statik qiymət siyasəti gəliri məhdudlaşdırır. Yüksək tələb dövrlərində otaqlar çox ucuz, aşağı tələb dövrlərində isə çox baha satılır — hər iki halda gəlir itirilir. Dinamik qiymətləndirmə bu problemi həll edir.</p>
<p>Tələbi müəyyən edən amillər: həftənin günü, mövsüm, yerli tədbirlər (konfrans, mədəni festival), rəqiblərin qiymətləri, bron üfüqü (neçə gün öncəsindən bron gəlir). O.S.S.-in qiymətləndirmə mühərriki bu amillərin hamısını eyni anda analiz edərək optimal qiyməti avtomatik təyin edir.</p>

<h2>2. Kanalları Düzgün Seçin və Balanslaşdırın</h2>
<p>OTA platformaları (Booking.com, Expedia, Airbnb) geniş auditoriyaya çatmağı təmin edir — amma komissiya xərcləri 15–25% arasında dəyişir. Birbaşa bron isə ən sərfəlidir — komissiya yoxdur, müştəriylə birbaşa əlaqə var.</p>
<p>Optimal strategiya: OTA-ları müştəri cəlb etmək üçün istifadə edin, lakin sayt üzərindən birbaşa bronlaşmanı stimullaşdırın (pulsuz erken giriş, pulsuz nahar, yüksek mərtəbə zəmanəti kimi üstünlüklər verərək). O.S.S.-in kanal meneceri bütün platformalarda otaq müvafiqliyi və qiymətləri sinxron idarə edir — həm vaxtınızı qənaət edir, həm overbooking riskini aradan qaldırır.</p>

<h2>3. Upselling və Cross-selling Sistemini Qurun</h2>
<p>Bron zamanı orta hesabla 20–30% qonaq yüksek kateqoriyalı otağa keçə bilər — əgər doğru təklif verilsə. Bunu avtomatlaşdırmaq mümkündür.</p>
<p>O.S.S.-in sistemində bron təsdiqi ilə birlikdə göndərilən e-poçtda qonaqa avtomatik olaraq: otaq yüksəltmə, gecikdirilmiş çıxış, spa paketi, airport transfer kimi əlavə xidmətlər təklif olunur. Bu sadə taktika orta bron dəyərini 15–20% artırır.</p>

<h2>4. Geri Qayıdan Qonaq Proqramını Gücləndirin</h2>
<p>Yeni müştəri cəlb etmək geri qayıdan müştərini saxlamaqdan 5–7 dəfə baha başa gəlir. Bununla belə, çox otel yeni bron almağa fokuslanır, mövcud müştərilərini isə unutur.</p>
<p>Geri qayıdan qonaq proqramı: əvvəlki ziyarətin detallarını xatırlamaq (sevimli otaq növü, yastıq üstünlüyü, allergiyalar), bron zamanı xüsusi endirim təklif etmək, ad günü/ildönümü üçün sürpriz hazırlamaq. O.S.S.-in qonaq profili sistemi bu məlumatları avtomatik saxlayır və növbəti ziyarətdə heyətə xatırlatır.</p>

<h2>5. Operasional Xərcləri Azaldın, Keyfiyyəti Artırın</h2>
<p>RevPAR-ı artırmağın yalnız gəlir tərəfi var deyilmiş — xərcləri azaltmaq da GopPAR (Gross Operating Profit Per Available Room) göstəricisinə eyni effekti verir.</p>
<p>Ağıllı ev-təsərrüfatı planlaması: O.S.S.-in avtomatik ev-təsərrüfatı mühərriki çıxış etmiş otaqları prioritetləşdirir, yeni girişlər üçün hazır edir, heyət tapşırıqlarını balanslaşdırır. Nəticə: daha az xərc, daha yüksək keyfiyyət standartı.</p>

<h2>Birgə Effekt</h2>
<p>Bu beş strategiyadan hər biri ayrılıqda faydalıdır — birlikdə tətbiq edildikdə isə sinergik effekt yaradır. O.S.S.-i sınayan otellərin böyük qismi ilk üç ayda RevPAR-da 18–32% artım qeyd etmişdir. 14 günlük pulsuz sınaqla bu potensialı öz otelinizdə kəşf edin.</p>
    `,
  },
  {
    slug: "restoran-pos-sistemi-xususiyyetleri",
    title: "Müasir Restoran POS Sistemi: Gəlirinizi Artıran 7 Əsas Xüsusiyyət",
    excerpt: "Düzgün POS sistemi yalnız kassa deyil — sifarişdən hesablaşmaya, mətbəx ekranından analitikaya qədər tam iş axını həllidir.",
    date: "2026-04-10",
    imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80",
    author: "O.S.S. Komandası",
    authorTitle: "Restoran Ekosistemi",
    readMinutes: 5,
    tags: ["Restoran", "POS", "KDS", "İdarəetmə"],
    content: `
<p class="lead">Restoran biznesinin marjası azdır, rəqabəti böyükdür, xərcləri isə hər gün artır. Bu mühitdə düzgün nöqtəsatış (POS) sistemi seçimi biznesi ya inkişaf etdirir, ya da geri çəkir. Müasir POS sistemindən nə gözləməli?</p>

<h2>1. Real-Vaxt Mətbəx Ekranı (KDS)</h2>
<p>Kağız sifarişlər geçmişdə qaldı. Mətbəx Ekranı Sistemi (Kitchen Display System) garsonun aldığı sifarişi anında aşpaz ekranında göstərir — çap edilmədən, zaman itirmədən. Sifariş hazır olduqda garson xəbərdar edilir. Çatdırılma vaxtı orta hesabla 4–7 dəqiqə azalır.</p>
<p>O.S.S. KDS-i real vaxtda çalışır: sifarişin hər maddəsi hansı stansiyada hazırlanacağını bilir (soyuq mətbəx, isti mətbəx, bar), prioritetləri göstərir, ləngimə zamanı xəbərdarlıq verir.</p>

<h2>2. Masa İdarəetməsi və Garson Paneli</h2>
<p>Garson hansı masanın sifarişi gözlədiyini, hansının hesab istədiyini, hansının boş olduğunu görməlidir — bütün bunları bir ekrandan. O.S.S.-in garson panelindən masa statuslarını real vaxtda izləmək, sifarişlər əlavə etmək, qonağın çağırışına cavab vermək mümkündür.</p>
<p>Qonaq "Garson çağır" düyməsinə basanda bildiriş dərhal garsonun telefon/planşetinə çatır. Gözləmə müddəti azalır, müştəri məmnuniyyəti artır.</p>

<h2>3. Hesablaşma Çevikliyi</h2>
<p>Qonaq nağd ödəmək istəyir, yoldaşı kartla, üçüncüsü isə hesabını otağa yazdırmaq istəyir. Müasir POS bütün bu halları dəstəkləməlidir. O.S.S.-də hesabı parçalamaq, nağd+kart qarışıq qəbul etmək, otel foliosuna köçürmək — hamısı birneçə toxunmayla həll olunur.</p>

<h2>4. Menyu İdarəetməsi və Qiymət Yeniləmələri</h2>
<p>Məhsul çatışmadıqda və ya mövsümi menyu dəyişikliyində qiymətləri anında yeniləmək lazımdır. O.S.S.-də menyu yeniləmələri dərhal bütün ekranlara — garson planşetinə, KDS-ə, kassaya — əks olunur. Çap edilmiş menyu xərcindən xilas olursunuz.</p>

<h2>5. Maliyyə Analitikası</h2>
<p>Gün sonu kassa hesabatı bir şeydir — aylıq trend analizi başqa. Hansı məhsul ən çox satılır? Hansı garson ən yüksək ortalama sifariş dəyəri gətirir? Hansı saat ən sıx period? O.S.S.-in analitika modulu bu suallara vizual cavablar verir.</p>

<h2>6. Təmizlik və Heyət İdarəetməsi</h2>
<p>Restoran meneceri günlük tapşırıqları idarə edir: hansı stolların dezinfeksiyası lazımdır, hansı garsonun hansı zonada növbəsi var, hansı işçinin maaşı hesablanacaq. O.S.S.-in menencer paneli bütün bunları vahid bir interfeysdən idarə etməyə imkan verir.</p>

<h2>7. Otel-Restoran İnteqrasiyası</h2>
<p>Otel restoranı idarə edənlər üçün bu xüsusiyyət çox dəyərlidir: qonağın restoran hesabı birbaşa onun otel foliosuna (hesab-fakturasına) əlavə olunur. Çıxış zamanı hər şey bir qaimədə birləşdirilir. Qonaq da, mühasib də memnundur.</p>

<h2>Nəticə</h2>
<p>Doğru POS sistemi restoranı daha sürətli, daha gəlirli və daha asan idarə edilən bir biznesə çevirir. O.S.S.-in restoran ekosistemi 14 gün pulsuz sınaqla mövcuddur — heç bir kredit kartı tələb olunmur.</p>
    `,
  },
  {
    slug: "onlayn-checkin-qonaq-gozlentileri",
    title: "Onlayn Check-in: Müasir Qonaqların Dəyişən Gözləntiləri",
    excerpt: "Resepsiyadakı növbə artıq keçmişdə qalıb. Qonaqlar otelə çatmazdan əvvəl hər şeyi həll etmək istəyirlər. Bu dəyişiklikdən necə faydalanmaq olar?",
    date: "2026-03-28",
    imageUrl: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=80",
    author: "O.S.S. Komandası",
    authorTitle: "Qonaq Təcrübəsi",
    readMinutes: 5,
    tags: ["Online Check-in", "Qonaq Təcrübəsi", "Rəqəmsallaşma"],
    content: `
<p class="lead">2020-ci ildən sonra qonaq davranışı kökündən dəyişdi. Müasir qonaq — xüsusən millennial və Gen Z nümayəndələri — resepsiyadakı bürokratik prosedurları artıq qəbul etmir. Onlar otelə çatanda yalnız açar götürüb otağına getmək istəyirlər.</p>

<h2>Statistika Danışır</h2>
<p>Araşdırmalar göstərir ki, otel qonaqlarının 73%-i onlayn check-in imkanı olsaydı, bu xidmətdən istifadə edərdi. 68%-i isə mobil cihazdan istifadə etməyi üstün tutur. Bu rəqəmlər artmağa davam edir.</p>
<p>Eyni zamanda, qonaqların 61%-i check-in növbəsindən şikayətçidir — bu, TripAdvisor rəylərinin ən çox söz edilən mənfi nöqtələrindən biridir. Yəni problem həm real, həm də ölçüləndir.</p>

<h2>Onlayn Check-in Necə İşləyir?</h2>
<p>O.S.S.-in onlayn check-in axını belədir:</p>
<ul>
<li><strong>Gəlişdən 24–48 saat öncə:</strong> Qonaqa avtomatik e-poçt/SMS göndərilir. Link üzərindən check-in formu açılır.</li>
<li><strong>Məlumat doldurmaq:</strong> Şəxsiyyət vəsiqəsi nömrəsi, doğum tarixi, ölkə — bir dəfə doldurulur, növbəti ziyarətdə xatırlanır.</li>
<li><strong>Rəqəmsal imza:</strong> Otel qaydaları (ev əşyalarına zərər, siqaret qadağası) onlayn imzalanır. Kağız sərfiyyatı sıfıra endirilir.</li>
<li><strong>Xüsusi istəklər:</strong> Yüksək mərtəbə, ikili çarpayı, allergiya xəbərdarlığı — heyət gəlişdən əvvəl hazırlıq görür.</li>
<li><strong>Otağa giriş:</strong> Qonaq gəlir, resepsiyadan açar/kart götürür (və ya mobil açar alır), bilavasitə otağına keçir.</li>
</ul>

<h2>Heyətin Rolu Dəyişir, Azalmır</h2>
<p>Çox sual olunur: onlayn check-in resepsiya heyətini azaldacaqmı? Xeyr — amma rollarını dəyişdirəcək. Resepsiya işçisi daha az forma doldurmaq, daha çox qonaqla əsl ünsiyyət qurmaq imkanı tapır. Problemlər dərhal həll edilir, xidmət keyfiyyəti artır.</p>

<h2>Gizlənmiş Faydalar</h2>
<p>Onlayn check-in yalnız qonaq rahatlığı ilə bitmir. Otel üçün əlavə faydalar:</p>
<ul>
<li><strong>Upselling imkanı:</strong> Forma zamanı otaq yüksəltmə, spa, transfer təklifi — çevrilmə faizi yüksəkdir çünki qonaq artıq otel münasibəti içindədir.</li>
<li><strong>Əməliyyat effektivliyi:</strong> Heyət gəlişdən əvvəl bütün məlumatları bilir — hazırlıq sürətlənir.</li>
<li><strong>Məlumat keyfiyyəti:</strong> Qonaq öz məlumatlarını özü daxil edir — yazı oxunmama, yanlış ad problemi yoxdur.</li>
</ul>

<h2>Necə Başlamaq Olar?</h2>
<p>O.S.S. platformasında onlayn check-in modulu quraşdırma tələb etmir — mövcud bronlaşma sisteminizlə inteqrasiya olunur. İlk check-in formu 1 gün içində aktivləşdirilə bilər. 14 günlük pulsuz sınaqla bu xidməti öz otelinizdə sınayın.</p>
    `,
  },
  {
    slug: "cox-mulklu-otel-biznesini-idareet",
    title: "Çox Mülklü Otel Biznesi: Vahid Platformada Bir Neçə Oteli İdarə Etməyin Sirri",
    excerpt: "İkinci, üçüncü otelini açmağı düşünürsən? Parçalanmış sistemlər böyümənin önünü kəsir. Vahid PMS platforması niyə kritik əhəmiyyət daşıyır?",
    date: "2026-03-15",
    imageUrl: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?w=1200&q=80",
    author: "O.S.S. Komandası",
    authorTitle: "Böyümə & Strategiya",
    readMinutes: 6,
    tags: ["Çox Mülklü", "PMS", "Böyümə", "İdarəetmə"],
    content: `
<p class="lead">Bir oteli yaxşı idarə etmək müəyyən bacarıq tələb edir. İki, üç və daha çox oteli eyni standartda idarə etmək isə tamamilə fərqli bir meydan oxumadır. Düzgün alətlər olmadan böyümə faktiki olaraq mümkünsüzdür.</p>

<h2>Parçalanmış Sistemin Gizli Xərcləri</h2>
<p>Çox sahibkar ikinci oteli açanda birinci otel üçün istifadə etdiyi sistemi yeni yerə kopyalamağa çalışır. Nəticə: iki ayrı PMS, iki ayrı mühasibat, iki ayrı hesabat formatı. Hər gün məlumat birləşdirməyə saatlar xərclənir.</p>
<p>Bu parçalanmanın real xərcləri:</p>
<ul>
<li>İdarəetmə vaxtının 40–60%-i məlumat toplama və birləşdirməyə gedir</li>
<li>Strateji qərarlar gecikir çünki real vəziyyət görünmür</li>
<li>Heyət rotasiyası çətinləşir — hər mülkün öz sistemi öyrənilməlidir</li>
<li>Müştəri profili paylaşılmır — eyni qonaq hər otelə yeni gəlir sayılır</li>
</ul>

<h2>Vahid Platformanın Faydaları</h2>
<p>O.S.S. çox mülklü idarəetmə üçün layihələndirilib. Bir hesabdan bütün mülkləri görmək mümkündür:</p>

<h3>Mərkəzləşdirilmiş Hesabat</h3>
<p>Hər otel üçün ayrıca hesabat hazırlamaq əvəzinə, bütün performans göstəriciləri (dolulma, gəlir, xərc, RevPAR) vahid ekranda toplanır. Sahibkar hansı mülkin daha yaxşı, hansının dəstəyə ehtiyacı olduğunu dərhal görür.</p>

<h3>Paylaşılan Müştəri Profili</h3>
<p>Qonaq Bakıdakı otelinizdə qaldıqda, onun üstünlükləri, şikayət tarixçəsi və xüsusi istəkləri Şəkidəki otelinizdə də görünür. Fərdiləşdirilmiş xidmət — hər mülkdə, hər zaman.</p>

<h3>Heyət Çevikliyi</h3>
<p>Müvəqqəti heyət ehtiyacı zamanı bir mülkdən digərinə işçi köçürmək asanlaşır — eyni sistemdə işlədiklərindən öyrənmə müddəti minimumdur.</p>

<h3>Toplu Satınalma Gücü</h3>
<p>Vahid maliyyə sistemi bütün mülklərin xərclərini birləşdirir. Tədarükçülərlə danışıqlarda toplu həcm güclü bir mövqe verir.</p>

<h2>Böyümə Üçün Düzgün Vaxt</h2>
<p>İkinci oteli açmadan əvvəl özünüzdən soruşun: birinci mülkü sistemsiz idarə edə bilirsinizmi? Əgər cevab "bəli" isə — böyümə üçün hazırsınız. Əgər "xeyr" isə — əvvəlcə prosesləri qurun.</p>
<p>O.S.S. platforması ikinci mülkü əlavə etməyi bir neçə tıklamayla həll edir. Mövcud konfiqurasiya, menyu şablonları, qiymət planları — hamısı kopyalanır, uyğunlaşdırılır. Yeni mülk 1–2 iş günü içində işə başlaya bilər.</p>

<h2>Real Nümunə</h2>
<p>O.S.S. istifadə edən bir operator üç otel arasında koordinasiyanı tək bir menecer ilə idarə edir. Əvvəllər bu iş üç ayrı administrator tələb edirdi. Sistemin yaratdığı şəffaflıq qərar qəbulunu sürətləndirdi, xərcləri isə azaltdı.</p>

<h2>Başlamaq Üçün Nə Lazımdır?</h2>
<p>O.S.S.-in çox mülklü planı eyni anda birdən çox mülkü dəstəkləyir. 14 gün pulsuz sınaq zamanı ikinci mülkünüzü sistemə əlavə edin və fərqi özünüz görün.</p>
    `,
  },
];

export function findPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}
