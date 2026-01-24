import React from 'react';
import ProductsByTypePage from './ProductsByTypePage';

export default function GirlsBagsEveningPage() {
  return (
    <ProductsByTypePage
      config={{
        titleAr: 'شنط سهرة',
        subtitleAr: 'شنط سهرة أنيقة للمناسبات الخاصة.',
        theme: 'default',
        legacySegment: 'girls-bags/evening', // ✅ Matches backend: /api/products/girls-bags/evening
        restoreStateKey: 'fromGirlsBagsEveningPage',
        bottomNavKey: 'women-bags',
      }}
    />
  );
}