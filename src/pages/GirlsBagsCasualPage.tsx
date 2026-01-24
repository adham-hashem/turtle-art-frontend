import React from 'react';
import ProductsByTypePage from './ProductsByTypePage';

export default function GirlsBagsCasualPage() {
  return (
    <ProductsByTypePage
      config={{
        titleAr: 'شنط كاجوال',
        subtitleAr: 'شنط كاجوال عملية للاستخدام اليومي.',
        theme: 'default',
        legacySegment: 'girls-bags/casual', // ✅ Matches backend: /api/products/girls-bags/casual
        restoreStateKey: 'fromGirlsBagsCasualPage',
        bottomNavKey: 'women-bags',
      }}
    />
  );
}