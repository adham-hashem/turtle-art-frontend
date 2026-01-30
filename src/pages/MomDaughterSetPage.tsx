import React from 'react';
import ProductsByTypePage from './ProductsByTypePage';

export default function MomDaughterSetPage() {
  return (
    <ProductsByTypePage
      config={{
        titleAr: 'كولكشن الأم وبنتها',
        subtitleAr: 'شنطه ليكي وشنطه لبنوتك 🫶🏻',
        theme: 'default',
        queryKey: 'category',
        queryValue: 'mom-daughter-set',
        legacySegment: 'mom-daughter-set',
        restoreStateKey: 'fromMomDaughterSetPage',
      }}
    />
  );
}
