# VendorSync 360 v2 — Lessons Learned 2026

İkinci AI'dan gelen yorumlar entegre edildi. Konseptin özü aynı, eklemeler şunlar:

## v1 → v2 Değişiklikleri

### Eklenen
- **AI-Powered yaklaşım** (Document AI sınırından çıkış) — senaryoda OCR yanında duplicate kontrol, risk skor, GenAI asistan, eksik bilgi tespiti, süreç optimizasyonu
- **AI Sınırları** (Responsible AI prensipleri) — pazarlık edilemez kurallar olarak senaryoda
- **Rol kartları "yanlış algı tuzağı + beklenen davranış"** formatında — artık ekipler sadece "rol almıyor", o rolün ne anlama geldiğini öğreniyor
- **4 ana ekip rolü** (Team Lead, Solution Architect, Senior Dev, Junior Dev). Modül Danışmanı, Müşteri, PY/Governor, Basis/AMS, Grup Manager ve Head ekip rolü değildir — hepsi jüri tarafındadır ve sunum sırasında dışarıdan müdahale eder.
- **Psikolojik güvenlik banner'ı** — açılışta "kişiler değil, davranışlar gözleniyor" mesajı
- **Müdahale destesi 15 → 29 kart** (yeni: AI mı kural motoru mu, AI yanlış duplicate, MDG bypass, senior bağımlılığı, junior'ın sesi, operasyon sahipliği, KVKK riski, tam otomasyon, Grup Manager kapasite/performans/maliyet/yetkinlik, Head stratejik hizalama/portföy/yetenek/karar üstlenme)
- **Yeni form alanları**: AI Sınırı (S4), Operasyon & Support (P4), Veri Yerleşimi & KVKK ayrı alan
- **Anonim Anket modülü** (`/survey`) — pre & post fazları, 8+10 soru, isim/IP/kimlik tutmaz
- **Genişletilmiş puanlama**: Mimari 40 + Clean Core 30 + Kriz 30 + Sunum 30 = **130 puan** + **Responsible AI 15 bonus**
- **JSON Export** — etkinlik sonu tüm veri tek dosya
- **Anket sonuçları paneli** — jüri pre/post cevapları soru bazlı görür

### Korunan (özün aynı)
- Tek ortak senaryo (VendorSync 360)
- Rol değişimi mekaniği (gerçek seviyeden farklı rol)
- Canlı müdahale + 2 dk overlay
- Vercel + KV altyapı
- Cevap kilitleme + sunum sırası reveal

### Çıkartılan
- Yok. v1 özellikleri tamamen korundu.

## Mimari

```
public/
├── index.html       Ekip görünümü (5 tab: Senaryo / Roller / Çözüm / Plan / Müdahaleler)
├── jury.html        Jüri konsolu (Kontrol & Skorlama + Anket Sonuçları)
└── survey.html      Anonim anket (pre/post)

api/
├── answer.js        Cevap kaydet
├── lock.js          Bölüm kilitle
├── state.js         Ekip durumu (3 sn polling)
├── intervention.js  Jüri: müdahale, sunum reveal, skor, reset
├── jury.js          Tüm ekiplerin verileri + anket sonuçları
└── survey.js        Anonim anket cevap toplama
```

## Kurulum

v1 ile aynı:

1. **GitHub repo**: zip'i indir, `gzmilgar/vendorsync-360` repo'suna push et
2. **Vercel deploy**: vercel.com'da new project → GitHub'dan import → deploy
3. **Vercel KV ekle**: Storage tab → Create KV → bağla (env auto)
4. **Redeploy**

## URL Yapısı

Canlı deployment: **https://lessons-learned-seven.vercel.app**

- [`/`](https://lessons-learned-seven.vercel.app/) — Ekip ekranı
- [`/jury`](https://lessons-learned-seven.vercel.app/jury) — Jüri konsolu (link'i bilen herkes açabilir, anahtar yok — etkinlik kapalı bir grupla yapıldığı için)
- [`/survey`](https://lessons-learned-seven.vercel.app/survey) — Anonim anket (pre/post toggle)

> **Güvenlik notu:** Jüri panelinde reset/skor/müdahale aksiyonları var. URL'i sadece jüri ekibiyle paylaş, sosyal medyada/public yerlerde paylaşma.

## Puanlama Mantığı

**Ana skor (130):** Mimari kalite, Clean Core, Kriz yönetimi ve sunum dengeli puanlanır. Hiçbir kategori diğerini ezmez.

**Responsible AI (15 bonus):** AI kullanımı her ekip için zorunlu değil. Ama AI öneren ekipler bu 15 bonus puan üzerinden ek değerlendirilir. Bu sayede:
- "Sadece AI'a gidip her şeye AI önerme" cezasını dolaylı verir
- AI'ı doğru kullanan ekibi 145 puana kadar çıkarabilir
- AI'ı kötü kullanan ekibi 130 ana skorda bırakır (Responsible AI'dan düşük puan alır)

**Bonus ödüller (sürpriz, puanlamadan ayrı):** En İyi Team Lead, En İyi Rol Performansı, En Hızlı Kök Neden, En İyi Müşteri İletişimi, Beklenmedik Çözüm.

## Anket Mantığı

- **Pre (etkinlik öncesi):** 8 soru, mevcut rol algısını ölçer
- **Post (etkinlik sonrası):** 10 soru, değişimi ölçer
- **Anonim:** Sayfada ne IP ne isim ne email tutulur. Sadece zaman damgası.
- **Pattern bazlı debrief:** Jüri sonuçları soru bazlı toplar, "kim ne dedi" yerine "ekipte hangi temalar ortaya çıkıyor" görür.

## Müdahale Destesi (21 kart)

Bu şapkaların **hepsi jüri tarafındadır** — ekip içinde bu rolleri kimse oynamaz. Sunum sırasında jüri kart seçer, ekibin ekranını kaplayan müdahaleyi başlatır.

| Şapka (jüri tarafı) | Kart Sayısı |
|---|---|
| Müşteri (Serkan) | 4 |
| Modül Danışmanı / Data Gov. (Gizem) | 5 |
| Solution Governance | 2 |
| PY/Governor (Başak) | 4 |
| Basis / AMS (Kaan) | 3 |
| Grup Manager | 4 |
| Head (Departman Başkanı) | 4 |
| Legal / Üst Yön. (Ecem) | 3 |
| **Toplam** | **29** |

Etkinlikte hepsini kullanmak zorunda değilsin. Ekip başına 4-5 müdahale yeterli olur, yani 6 ekip için 24-30 müdahale tüketirsin. Bu 29 kart bir turdan fazlasını kapsar; aynı kartı farklı ekibe atmak da mümkün.

## Akış Önerisi (3 saat)

| Süre | Aktivite |
|---|---|
| 0-10 dk | Açılış, psikolojik güvenlik, kurallar |
| 10-20 dk | Senaryo + rol kartları + ekip kurulması |
| 20-80 dk | Ekiplerin çözüm + plan formunu doldurması (60 dk) |
| 80-90 dk | "Hazır" tuşları, kilitler düşer |
| 90-150 dk | Ekip sunumları + jüri müdahaleleri (her ekip 8-10 dk) |
| 150-170 dk | Jüri kapalı oturum + skor finalize |
| 170-180 dk | Kazananlar + lessons learned + post anket linki |

## Sorun Giderme

Bkz. v1 README. Aynı.

## Etkinlik Sonrası

1. **JSON Export** butonu → tüm veri tek dosya, analiz için
2. Pre/Post anket karşılaştırması yap (kaç kişi cevap verdi, hangi sorulara, hangi temalar değişti)
3. Pattern bazlı debrief raporu yaz — isim **yok**
4. KV reset (jüri panelinde "Tümünü Sıfırla")
