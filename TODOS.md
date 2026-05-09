# TODOS

Design debt items identified during `/plan-design-review` session (2026-05-07).

---

## Design System

**TODO-DS-1: Buat DESIGN.md**
- **What:** Dokumentasikan design system yang sudah implisit ada di codebase — color tokens, typography scale, spacing system, component states, dan motion/animation tokens.
- **Why:** Saat ini semua keputusan desain tersebar di file komponen tanpa referensi pusat. Developer yang menyentuh file bisa membuat keputusan yang tidak konsisten. DESIGN.md menjadi contract yang mencegah design drift.
- **Pros:** Developer baru onboard lebih cepat. Perubahan desain lebih disengaja dan dapat di-audit. Landasan untuk design review di masa depan.
- **Cons:** Butuh waktu penulisan ~2 jam. Perlu di-update setiap kali ada perubahan desain besar.
- **Context:** Color tokens sudah ada di `tailwind.config.ts` (`brand-dark`, `brand-card`, dll). Typography scale baru didefinisikan (Inter + Syne via next/font). Glass card, btn-gold, dan badge patterns sudah ada di `globals.css`.
- **Depends on:** Tidak ada. Bisa dikerjakan kapan saja.

---

## Accessibility

**TODO-A11Y-1: Accessibility audit landing page**
- **What:** (1) Verify contrast ratio `text-gray-500` di stats sub-labels memenuhi 4.5:1 WCAG AA. (2) Tambah `prefers-reduced-motion` media query untuk hero ContainerScroll animations. (3) Audit touch target sizes — minimum 44×44px per WCAG 2.5.5. (4) Pastikan semua section punya proper ARIA landmarks.
- **Why:** Trader target termasuk pengguna yang lebih tua atau low-vision. Contrast gagal = melanggar WCAG AA. Hero animations bisa menyebabkan vestibular disorder pada pengguna yang sensitif.
- **Pros:** Lebih inklusif. Menghindari complaint dari pengguna dengan kebutuhan aksesibilitas. Potensi SEO improvement dari semantic markup.
- **Cons:** Audit membutuhkan tooling (axe, Lighthouse). Beberapa fix mungkin mengubah visual appearance.
- **Context:** `prefers-reduced-motion` perlu ditambah di `container-scroll-animation.tsx` untuk skip/reduce rotation. Contrast bisa di-check dengan browser DevTools atau online tool.
- **Depends on:** Tidak ada.

---

## Content

**TODO-CONTENT-1: Ganti hero dashboard image dengan screenshot produk asli**
- **What:** Saat ini hero 3D scroll card menampilkan foto Unsplash trading chart (`photo-1611974789855`). Harus diganti dengan screenshot dashboard GoldMind AI yang sesungguhnya.
- **Why:** Ini adalah momen paling impactful di halaman — 3D scroll animation yang impressive diisi dengan gambar generic. User tidak melihat produk yang mereka akan beli.
- **Pros:** Trust yang jauh lebih tinggi. User tahu persis apa yang mereka dapatkan. Product-market fit yang lebih terasa.
- **Cons:** Menunggu dashboard UI selesai dan siap di-screenshot.
- **Context:** Ubah `src` di `hero-2-1.tsx` baris ~119. Filter dan styling sudah ada, hanya perlu ganti URL gambar.
- **Depends on:** Dashboard UI selesai dibangun.
