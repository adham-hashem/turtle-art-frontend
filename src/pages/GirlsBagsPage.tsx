import React from 'react';
import ProductsByTypePage from './ProductsByTypePage';

export default function GirlsBagsPage() {
  return (
    <ProductsByTypePage
      config={{
        titleAr: 'شنط بنات',
        subtitleAr: 'شنط بنات أنيقة — اختاري المفضل لكِ.',
        theme: 'default',
        queryKey: 'category',
        queryValue: 'girls-bags',
        legacySegment: 'girls-bags',
        restoreStateKey: 'fromGirlsBagsPage',
      }}
    />
  );
}
