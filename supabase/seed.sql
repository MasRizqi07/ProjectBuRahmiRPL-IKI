-- ============================================
-- SEED: CONCERTS
-- ============================================
insert into public.concerts
  (title, artist, venue, city, date, image_url, category, status, description, tags, is_featured)
values
  (
    'MALIQ & D''Essentials — Metamorfosa Tour',
    'MALIQ & D''Essentials',
    'Jakarta International Expo (JIExpo)',
    'Jakarta',
    '2025-08-15 19:00:00+07',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
    'jazz',
    'available',
    'Nikmati malam penuh musik jazz dan soul bersama MALIQ & D''Essentials dalam tur Metamorfosa mereka yang epik.',
    ARRAY['jazz','soul','live music','jakarta'],
    true
  ),
  (
    'Tulus — Manusia Tour',
    'Tulus',
    'Gelora Bung Karno',
    'Jakarta',
    '2025-09-05 18:30:00+07',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
    'pop',
    'limited',
    'Konser akbar Tulus merayakan album Manusia — penuh lagu-lagu ikonik yang akan membuatmu terhanyut.',
    ARRAY['pop','indonesia','live'],
    true
  ),
  (
    'Pamungkas — To The Bone Live',
    'Pamungkas',
    'Istora Senayan',
    'Jakarta',
    '2025-09-20 19:30:00+07',
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800',
    'indie',
    'available',
    'Satu malam bersama Pamungkas membawakan hits dari album To The Bone secara live untuk pertama kalinya.',
    ARRAY['indie','pop','singer-songwriter'],
    false
  ),
  (
    'Rocket Rockers — Pesta Rakyat',
    'Rocket Rockers',
    'Sabuga International Convention Center',
    'Bandung',
    '2025-08-30 17:00:00+07',
    'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=800',
    'rock',
    'available',
    'Pesta rock terbesar di Bandung bersama Rocket Rockers.',
    ARRAY['rock','bandung','festival'],
    false
  ),
  (
    'Dipha Barus — Electronic Night',
    'Dipha Barus',
    'Harris Hotel & Conventions',
    'Surabaya',
    '2025-10-11 21:00:00+07',
    'https://images.unsplash.com/photo-1571266028243-d220c6a7cf72?w=800',
    'electronic',
    'available',
    'Malam elektronik terpanas bersama DJ terbaik Indonesia, Dipha Barus.',
    ARRAY['edm','electronic','dj','surabaya'],
    false
  ),
  (
    'Hindia — Selamat Ulang Tahun Tour',
    'Hindia',
    'Bali Nusa Dua Convention Center',
    'Bali',
    '2025-11-01 19:00:00+07',
    'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800',
    'indie',
    'soldout',
    'Tour ulang tahun Hindia yang paling ditunggu-tunggu — sayangnya sudah habis terjual.',
    ARRAY['indie','bali','hindia'],
    true
  ),
  (
    'Rich Brian — Asia Tour',
    'Rich Brian',
    'Tennis Indoor Senayan',
    'Jakarta',
    '2025-10-25 20:00:00+07',
    'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=800',
    'hiphop',
    'limited',
    'Rich Brian kembali ke tanah air dengan Asian tour yang memukau.',
    ARRAY['hiphop','rap','rich brian','jakarta'],
    true
  ),
  (
    'Yura Yunita — Cinta dan Luka',
    'Yura Yunita',
    'Grand City Convention',
    'Surabaya',
    '2025-09-13 19:00:00+07',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
    'pop',
    'available',
    'Yura Yunita hadir membawakan lagu-lagu terbaik dari album Cinta dan Luka.',
    ARRAY['pop','surabaya','yura yunita'],
    false
  );

-- ============================================
-- SEED: TICKET TIERS
-- ============================================
-- Get concert IDs dynamically
do $$
declare
  maliq_id uuid;
  tulus_id uuid;
  pamungkas_id uuid;
  rocket_id uuid;
  dipha_id uuid;
  rich_brian_id uuid;
  yura_id uuid;
begin
  select id into maliq_id from concerts where artist = 'MALIQ & D''Essentials' limit 1;
  select id into tulus_id from concerts where artist = 'Tulus' limit 1;
  select id into pamungkas_id from concerts where artist = 'Pamungkas' limit 1;
  select id into rocket_id from concerts where artist = 'Rocket Rockers' limit 1;
  select id into dipha_id from concerts where artist = 'Dipha Barus' limit 1;
  select id into rich_brian_id from concerts where artist = 'Rich Brian' limit 1;
  select id into yura_id from concerts where artist = 'Yura Yunita' limit 1;

  -- MALIQ tiers
  insert into ticket_tiers (concert_id, name, price, capacity, sold, perks, sort_order) values
    (maliq_id, 'Festival', 350000, 500, 120, ARRAY['Akses area festival'], 1),
    (maliq_id, 'VIP', 750000, 200, 130, ARRAY['Kursi premium','Merchandise eksklusif','Free drink'], 2),
    (maliq_id, 'VVIP', 1500000, 50, 35, ARRAY['Front row','Meet & Greet','Signed poster','Free merchandise pack'], 3);

  -- Tulus tiers
  insert into ticket_tiers (concert_id, name, price, capacity, sold, perks, sort_order) values
    (tulus_id, 'Tribune', 450000, 1000, 870, ARRAY['Akses tribun'], 1),
    (tulus_id, 'Festival', 650000, 500, 430, ARRAY['Akses festival area','Standing'], 2),
    (tulus_id, 'VIP', 1200000, 150, 140, ARRAY['Kursi VIP','Merchandise','Early entry'], 3),
    (tulus_id, 'Platinum', 2500000, 30, 25, ARRAY['Baris 1-3','Meet & Greet','Full merch pack','Dinner'], 4);

  -- Pamungkas tiers
  insert into ticket_tiers (concert_id, name, price, capacity, sold, perks, sort_order) values
    (pamungkas_id, 'Regular', 300000, 600, 180, ARRAY['Standing festival'], 1),
    (pamungkas_id, 'VIP Standing', 600000, 200, 75, ARRAY['VIP area depan','Merchandise'], 2),
    (pamungkas_id, 'Seat VIP', 900000, 100, 40, ARRAY['Kursi VIP','Signed album'], 3);

  -- Rocket Rockers tiers
  insert into ticket_tiers (concert_id, name, price, capacity, sold, perks, sort_order) values
    (rocket_id, 'General', 150000, 800, 300, ARRAY['Standing umum'], 1),
    (rocket_id, 'Festival', 300000, 400, 150, ARRAY['Area festival','Free t-shirt'], 2);

  -- Dipha tiers
  insert into ticket_tiers (concert_id, name, price, capacity, sold, perks, sort_order) values
    (dipha_id, 'Early Bird', 200000, 300, 110, ARRAY['General admission'], 1),
    (dipha_id, 'Regular', 350000, 500, 200, ARRAY['General admission','Merchandise'], 2),
    (dipha_id, 'VIP Table', 1500000, 20, 8, ARRAY['Meja VIP (4 orang)','Bottle service','Best view'], 3);

  -- Rich Brian tiers
  insert into ticket_tiers (concert_id, name, price, capacity, sold, perks, sort_order) values
    (rich_brian_id, 'Standing B', 500000, 400, 320, ARRAY['Standing area belakang'], 1),
    (rich_brian_id, 'Standing A', 800000, 300, 260, ARRAY['Standing area depan'], 2),
    (rich_brian_id, 'VIP Seat', 1500000, 100, 80, ARRAY['Kursi VIP','Merchandise','Early entry'], 3),
    (rich_brian_id, 'Diamond', 3000000, 20, 15, ARRAY['Front row','Meet & Greet','Signed merch','Dinner'], 4);

  -- Yura Yunita tiers
  insert into ticket_tiers (concert_id, name, price, capacity, sold, perks, sort_order) values
    (yura_id, 'Regular', 250000, 500, 100, ARRAY['Standing festival'], 1),
    (yura_id, 'VIP', 550000, 150, 55, ARRAY['Seat VIP','Merchandise'], 2),
    (yura_id, 'Premium', 1000000, 50, 15, ARRAY['Front seat','Meet & Greet','Signed CD'], 3);
end;
$$;