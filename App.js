
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  ScrollView,
  Alert,
  Modal,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';

const C = {
  bg: '#0B0B10',
  card: '#191920',
  surface: '#25252F',
  red: '#E62429',
  redLight: '#FF6975',
  white: '#FFFFFF',
  muted: '#A1A1AA',
  border: '#50303A',
  green: '#22C55E',
  orange: '#F59E0B',
  blue: '#60A5FA',
};

const KATEGORILER = ['Bilgisayar', 'Yazıcı', 'İnternet', 'Yazılım', 'Diğer'];
const ONCELIKLER = ['Düşük', 'Orta', 'Yüksek'];
const DURUMLAR = ['Bekliyor', 'İşlemde', 'Tamamlandı'];
const FILTRELER = ['Tümü', ...DURUMLAR];

const ORNEK_TALEPLER = [
  {
    id: 'TLP-1001',
    baslik: 'Bilgisayar açılmıyor',
    aciklama: 'Bilgisayarın güç düğmesine basınca ekran açılmıyor.',
    kategori: 'Bilgisayar',
    oncelik: 'Yüksek',
    durum: 'Bekliyor',
    tarih: '20.10.2026',
  },
  {
    id: 'TLP-1002',
    baslik: 'Yazıcı bağlantı sorunu',
    aciklama: 'Ağ yazıcısına bilgisayardan bağlanamıyorum.',
    kategori: 'Yazıcı',
    oncelik: 'Orta',
    durum: 'İşlemde',
    tarih: '20.10.2026',
  },
  {
    id: 'TLP-1003',
    baslik: 'İnternet bağlantısı kesildi',
    aciklama: 'Kablosuz ağ bağlantısı sık sık kopuyor.',
    kategori: 'İnternet',
    oncelik: 'Yüksek',
    durum: 'Tamamlandı',
    tarih: '19.10.2026',
  },
];

const durumRengi = (durum) => {
  if (durum === 'Bekliyor') return C.orange;
  if (durum === 'İşlemde') return C.blue;
  return C.green;
};

const oncelikRengi = (oncelik) => {
  if (oncelik === 'Yüksek') return C.redLight;
  if (oncelik === 'Orta') return C.orange;
  return C.green;
};

const kategoriIkonu = (kategori) => {
  const ikonlar = {
    Bilgisayar: '💻',
    Yazıcı: '🖨️',
    İnternet: '🌐',
    Yazılım: '⚙️',
    Diğer: '🕸️',
  };
  return ikonlar[kategori] || '🕷️';
};

function SecimButonu({ text, active, onPress, color = C.red }) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.choice,
        active && { backgroundColor: color, borderColor: color },
      ]}
    >
      <Text style={[styles.choiceText, active && { color: C.white }]}>
        {text}
      </Text>
    </Pressable>
  );
}

function OzetKarti({ title, value, color, width }) {
  return (
    <View style={[styles.statCard, { width }]}>
      <View style={[styles.statLine, { backgroundColor: color }]} />
      <Text style={[styles.statNumber, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{title}</Text>
    </View>
  );
}

function TalepKarti({ item, onOpen, onDelete }) {
  return (
    <Pressable
      onPress={() => onOpen(item.id)}
      onLongPress={() => onDelete(item.id)}
      delayLongPress={500}
      style={({ pressed }) => [
        styles.ticket,
        pressed && { opacity: 0.8 },
      ]}
    >
      <View style={styles.ticketTop}>
        <Text style={styles.ticketId}>{item.id}</Text>
        <Text
          style={[
            styles.priority,
            { color: oncelikRengi(item.oncelik) },
          ]}
        >
          ● {item.oncelik}
        </Text>
      </View>

      <View style={styles.ticketMiddle}>
        <Text style={styles.ticketIcon}>
          {kategoriIkonu(item.kategori)}
        </Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.ticketTitle}>{item.baslik}</Text>
          <Text style={styles.ticketSubtitle}>
            {item.kategori} • {item.tarih}
          </Text>
        </View>
      </View>

      <View style={styles.ticketBottom}>
        <View
          style={[
            styles.statusPill,
            { borderColor: durumRengi(item.durum) },
          ]}
        >
          <Text
            style={[
              styles.statusPillText,
              { color: durumRengi(item.durum) },
            ]}
          >
            ● {item.durum}
          </Text>
        </View>
        <Text style={styles.ticketHint}>
          Detay için dokun • Silmek için basılı tut
        </Text>
      </View>
    </Pressable>
  );
}

function Panel() {
  const { width } = useWindowDimensions();

  const [talepler, setTalepler] = useState(ORNEK_TALEPLER);
  const [baslik, setBaslik] = useState('');
  const [aciklama, setAciklama] = useState('');
  const [kategori, setKategori] = useState('');
  const [oncelik, setOncelik] = useState('Orta');
  const [filtre, setFiltre] = useState('Tümü');
  const [oncelikFiltresi, setOncelikFiltresi] = useState('Tümü');
  const [seciliId, setSeciliId] = useState(null);
  const [aktifSayfa, setAktifSayfa] = useState('liste');
  const [bildirim, setBildirim] = useState('');

  const sutun = width >= 600 ? 4 : 2;
  const kartGenisligi = (width - 36 - (sutun - 1) * 10) / sutun;

  const seciliTalep = talepler.find((t) => t.id === seciliId) || null;

  const toplam = talepler.length;
  const bekleyen = talepler.filter((t) => t.durum === 'Bekliyor').length;
  const islemde = talepler.filter((t) => t.durum === 'İşlemde').length;
  const tamamlanan = talepler.filter((t) => t.durum === 'Tamamlandı').length;

  const gorunenTalepler = talepler.filter((t) => {
    const durumUygun = filtre === 'Tümü' || t.durum === filtre;
    const oncelikUygun =
      oncelikFiltresi === 'Tümü' || t.oncelik === oncelikFiltresi;
    return durumUygun && oncelikUygun;
  });

  const mesajGoster = (mesaj) => {
    setBildirim(mesaj);
    Alert.alert('SPIDER-DESK', mesaj);
  };

  const formuTemizle = () => {
    setBaslik('');
    setAciklama('');
    setKategori('');
    setOncelik('Orta');
  };

  const talepKaydet = () => {
    if (!baslik.trim() || !aciklama.trim() || !kategori) {
      mesajGoster('Başlık, açıklama ve kategori alanları boş bırakılamaz.');
      return;
    }

    const yeniTalep = {
      id: 'TLP-' + Date.now(),
      baslik: baslik.trim(),
      aciklama: aciklama.trim(),
      kategori,
      oncelik,
      durum: 'Bekliyor',
      tarih: new Date().toLocaleString('tr-TR'),
    };

    setTalepler((onceki) => [yeniTalep, ...onceki]);
    setFiltre('Tümü');
    setOncelikFiltresi('Tümü');
    formuTemizle();
    setAktifSayfa('liste');
    mesajGoster('Talep başarıyla kaydedildi! Görev: ' + yeniTalep.id);
  };

  const silmeOnayi = (id) => {
    Alert.alert(
      'GÖREVİ SİL',
      'Bu arıza talebini silmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            setTalepler((onceki) => onceki.filter((t) => t.id !== id));
            if (seciliId === id) setSeciliId(null);
            mesajGoster('Talep başarıyla silindi.');
          },
        },
      ]
    );
  };

  const durumDegistir = (id, yeniDurum) => {
    setTalepler((onceki) =>
      onceki.map((t) =>
        t.id === id ? { ...t, durum: yeniDurum } : t
      )
    );
    mesajGoster('Talep durumu "' + yeniDurum + '" olarak güncellendi.');
  };

  const Header = () => (
    <View style={styles.hero}>
      <Text style={styles.heroBadge}>
        ● EARTH-TR / SUPPORT DIVISION
      </Text>
      <Text style={styles.heroSmall}>YOUR FRIENDLY NEIGHBORHOOD</Text>
      <Text style={styles.heroTitle}>
        SPIDER<Text style={{ color: C.red }}>-DESK</Text>
      </Text>
      <Text style={styles.heroSubtitle}>
        AKILLI ARIZA TALEP YÖNETİMİ
      </Text>
      <View style={styles.heroBottom}>
        <Text style={styles.heroBottomText}>🕷️ SPIDER-VERSE NETWORK</Text>
        <Text style={styles.heroBottomText}>SYSTEM ONLINE</Text>
      </View>
    </View>
  );

  const Tabs = () => (
    <View style={styles.tabs}>
      <Pressable
        onPress={() => setAktifSayfa('liste')}
        style={[styles.tab, aktifSayfa === 'liste' && styles.tabActive]}
      >
        <Text style={styles.tabText}>📋 TALEPLER</Text>
      </Pressable>
      <Pressable
        onPress={() => setAktifSayfa('yeni')}
        style={[styles.tab, aktifSayfa === 'yeni' && styles.tabActive]}
      >
        <Text style={styles.tabText}>＋ YENİ TALEP</Text>
      </Pressable>
    </View>
  );

  const ListeBasligi = () => (
    <View>
      <Header />
      <Tabs />

      <Text style={styles.sectionTitle}>GÖREV DURUMU</Text>
      <View style={styles.stats}>
        <OzetKarti title="Toplam" value={toplam} color={C.white} width={kartGenisligi} />
        <OzetKarti title="Bekliyor" value={bekleyen} color={C.orange} width={kartGenisligi} />
        <OzetKarti title="İşlemde" value={islemde} color={C.blue} width={kartGenisligi} />
        <OzetKarti title="Tamamlandı" value={tamamlanan} color={C.green} width={kartGenisligi} />
      </View>

      <Text style={styles.sectionTitle}>TALEP FİLTRELERİ</Text>
      <Text style={styles.filterLabel}>Durum</Text>
      <View style={styles.filterRow}>
        {FILTRELER.map((f) => (
          <SecimButonu
            key={f}
            text={f}
            active={filtre === f}
            onPress={() => setFiltre(f)}
          />
        ))}
      </View>

      <Text style={styles.filterLabel}>Öncelik</Text>
      <View style={styles.filterRow}>
        {['Tümü', ...ONCELIKLER].map((f) => (
          <SecimButonu
            key={f}
            text={f}
            active={oncelikFiltresi === f}
            onPress={() => setOncelikFiltresi(f)}
          />
        ))}
      </View>

      <Text style={styles.sectionTitle}>
        GÖREV LİSTESİ ({gorunenTalepler.length})
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {aktifSayfa === 'liste' ? (
        <FlatList
          data={gorunenTalepler}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TalepKarti
              item={item}
              onOpen={setSeciliId}
              onDelete={silmeOnayi}
            />
          )}
          ListHeaderComponent={<ListeBasligi />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>🕸️ GÖREV BULUNAMADI</Text>
              <Text style={styles.emptySubtitle}>
                Seçtiğiniz filtrelere uygun talep yok.
              </Text>
            </View>
          }
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        />
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
          >
            <Header />
            <Tabs />

            <View style={styles.formCard}>
              <Text style={styles.formKicker}>MISSION CREATOR / 001</Text>
              <Text style={styles.formTitle}>YENİ GÖREV OLUŞTUR</Text>
              <Text style={styles.formSubtitle}>
                Arıza bilgilerini girerek yeni destek talebi oluştur.
              </Text>

              <Text style={styles.label}>Arıza Başlığı *</Text>
              <TextInput
                style={styles.input}
                value={baslik}
                onChangeText={setBaslik}
                placeholder="Örn: Bilgisayar açılmıyor"
                placeholderTextColor="#888895"
              />

              <Text style={styles.label}>Arıza Açıklaması *</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={aciklama}
                onChangeText={setAciklama}
                placeholder="Sorunu açıklayın..."
                placeholderTextColor="#888895"
                multiline
                textAlignVertical="top"
              />

              <Text style={styles.label}>Kategori *</Text>
              <View style={styles.filterRow}>
                {KATEGORILER.map((k) => (
                  <SecimButonu
                    key={k}
                    text={k}
                    active={kategori === k}
                    onPress={() => setKategori(k)}
                  />
                ))}
              </View>

              <Text style={styles.label}>Öncelik</Text>
              <View style={styles.filterRow}>
                {ONCELIKLER.map((o) => (
                  <SecimButonu
                    key={o}
                    text={o}
                    active={oncelik === o}
                    onPress={() => setOncelik(o)}
                    color={oncelikRengi(o)}
                  />
                ))}
              </View>

              <Pressable style={styles.saveButton} onPress={talepKaydet}>
                <Text style={styles.saveButtonText}>
                  🕷️ GÖREVİ KAYDET →
                </Text>
              </Pressable>

              <Pressable style={styles.clearButton} onPress={formuTemizle}>
                <Text style={styles.clearButtonText}>FORMU TEMİZLE</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      <Modal
        visible={seciliTalep !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSeciliId(null)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalSafe}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalKicker}>
                    SPIDER-VERSE / CASE FILE
                  </Text>
                  <Text style={styles.modalTitle}>GÖREV DETAYLARI</Text>
                </View>
                <Pressable
                  onPress={() => setSeciliId(null)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeText}>✕</Text>
                </Pressable>
              </View>

              {seciliTalep && (
                <ScrollView contentContainerStyle={styles.modalBody}>
                  <Text style={styles.modalId}>{seciliTalep.id}</Text>
                  <Text style={styles.modalTicketTitle}>
                    {seciliTalep.baslik}
                  </Text>

                  {[
                    ['Kategori', seciliTalep.kategori],
                    ['Açıklama', seciliTalep.aciklama],
                    ['Tarih', seciliTalep.tarih],
                    ['Öncelik', seciliTalep.oncelik],
                    ['Durum', seciliTalep.durum],
                  ].map(([label, value]) => (
                    <View key={label} style={styles.detailRow}>
                      <Text style={styles.detailLabel}>{label}</Text>
                      <Text style={styles.detailValue}>{value}</Text>
                    </View>
                  ))}

                  <Text style={styles.changeLabel}>DURUMU DEĞİŞTİR</Text>
                  <View style={styles.filterRow}>
                    {DURUMLAR.map((d) => (
                      <SecimButonu
                        key={d}
                        text={d}
                        active={seciliTalep.durum === d}
                        onPress={() => durumDegistir(seciliTalep.id, d)}
                        color={durumRengi(d)}
                      />
                    ))}
                  </View>

                  <Pressable
                    style={styles.deleteButton}
                    onPress={() => silmeOnayi(seciliTalep.id)}
                  >
                    <Text style={styles.deleteButtonText}>
                      🗑 TALEBİ SİL
                    </Text>
                  </Pressable>
                </ScrollView>
              )}
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <Panel />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  container: { paddingHorizontal: 18, paddingBottom: 40, flexGrow: 1 },
  hero: {
    backgroundColor: '#15151B',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    padding: 20,
    marginTop: 12,
    marginBottom: 18,
  },
  heroBadge: {
    color: C.redLight,
    backgroundColor: '#311C25',
    alignSelf: 'flex-start',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 15,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 20,
  },
  heroSmall: {
    color: C.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  heroTitle: {
    color: C.white,
    fontSize: 32,
    fontWeight: '900',
    marginTop: 8,
  },
  heroSubtitle: {
    color: '#D4D4D8',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
    letterSpacing: 0.7,
  },
  heroBottom: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    marginTop: 22,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  heroBottomText: {
    color: C.redLight,
    fontSize: 9,
    fontWeight: '800',
  },
  tabs: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 25,
  },
  tab: {
    flex: 1,
    backgroundColor: C.surface,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#44444F',
  },
  tabActive: { backgroundColor: C.red, borderColor: C.red },
  tabText: { color: C.white, fontSize: 12, fontWeight: '900' },
  sectionTitle: {
    color: C.white,
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 14,
    marginTop: 5,
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 30,
  },
  statCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 13,
    padding: 14,
    minHeight: 108,
  },
  statLine: { width: 30, height: 4, borderRadius: 2 },
  statNumber: { fontSize: 30, fontWeight: '900', marginTop: 9 },
  statLabel: {
    color: '#D4D4D8',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  filterLabel: {
    color: C.muted,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 9,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  choice: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: '#4B4B56',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 9,
  },
  choiceText: {
    color: '#D4D4D8',
    fontSize: 12,
    fontWeight: '700',
  },
  ticket: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 15,
    padding: 16,
    marginBottom: 13,
  },
  ticketTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketId: {
    color: C.redLight,
    fontSize: 12,
    fontWeight: '800',
  },
  priority: { fontSize: 12, fontWeight: '800' },
  ticketMiddle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 18,
  },
  ticketIcon: { fontSize: 28 },
  ticketTitle: { color: C.white, fontSize: 16, fontWeight: '900' },
  ticketSubtitle: {
    color: C.muted,
    fontSize: 12,
    marginTop: 6,
  },
  ticketBottom: {
    borderTopWidth: 1,
    borderTopColor: '#403039',
    paddingTop: 13,
    gap: 10,
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusPillText: { fontSize: 11, fontWeight: '800' },
  ticketHint: { color: '#92929D', fontSize: 10 },
  empty: {
    backgroundColor: C.card,
    padding: 30,
    borderRadius: 14,
    alignItems: 'center',
  },
  emptyTitle: { color: C.white, fontSize: 15, fontWeight: '900' },
  emptySubtitle: {
    color: C.muted,
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    padding: 20,
  },
  formKicker: {
    color: C.redLight,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  formTitle: {
    color: C.white,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 12,
  },
  formSubtitle: {
    color: C.muted,
    fontSize: 13,
    marginTop: 8,
    lineHeight: 20,
  },
  label: {
    color: C.white,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 22,
    marginBottom: 9,
  },
  input: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: '#4B4B56',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: C.white,
    fontSize: 14,
  },
  textarea: { minHeight: 125 },
  saveButton: {
    backgroundColor: C.red,
    borderRadius: 10,
    padding: 17,
    alignItems: 'center',
    marginTop: 12,
  },
  saveButtonText: { color: C.white, fontSize: 14, fontWeight: '900' },
  clearButton: { alignItems: 'center', padding: 16 },
  clearButtonText: {
    color: C.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
  },
  modalSafe: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalCard: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 18,
    maxHeight: '85%',
    overflow: 'hidden',
  },
  modalHeader: {
    backgroundColor: '#321B25',
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalKicker: {
    color: C.redLight,
    fontSize: 10,
    fontWeight: '800',
  },
  modalTitle: {
    color: C.white,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 7,
  },
  closeButton: {
    backgroundColor: C.red,
    width: 35,
    height: 35,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { color: C.white, fontSize: 18, fontWeight: '900' },
  modalBody: { padding: 20, paddingBottom: 30 },
  modalId: { color: C.redLight, fontSize: 12, fontWeight: '800' },
  modalTicketTitle: {
    color: C.white,
    fontSize: 21,
    fontWeight: '900',
    marginTop: 8,
    marginBottom: 20,
  },
  detailRow: { marginBottom: 17 },
  detailLabel: {
    color: C.muted,
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 6,
  },
  detailValue: { color: C.white, fontSize: 14, lineHeight: 21 },
  changeLabel: {
    color: C.redLight,
    fontSize: 12,
    fontWeight: '900',
    marginTop: 10,
    marginBottom: 12,
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: C.red,
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 15,
  },
  deleteButtonText: { color: C.redLight, fontWeight: '900' },
});
