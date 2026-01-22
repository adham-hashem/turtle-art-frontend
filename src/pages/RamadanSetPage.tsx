import React from 'react';
import ProductsByTypePage from './ProductsByTypePage';

export default function RamadanSetPage() {
  return (
    <ProductsByTypePage
      config={{
        titleAr: 'طقم رمضان',
        subtitleAr: 'اختيارات رمضان — هدايا/أطقم مناسبة للجو الرمضاني.',
        theme: 'default',
        queryKey: 'category',
        queryValue: 'ramadan-set',
        legacySegment: 'ramadan-set',
        restoreStateKey: 'fromRamadanSetPage',
      }}
    />
  );
}
