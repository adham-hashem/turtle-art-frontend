import React from 'react';
import ProductsByTypePage from './ProductsByTypePage';

export default function MomDaughterSetPage() {
  return (
    <ProductsByTypePage
      config={{
        titleAr: 'طقم أم وبنت',
        subtitleAr: 'أطقم متناسقة للأم والبنت — شكل راقي ومميز.',
        theme: 'default',
        queryKey: 'category',
        queryValue: 'mom-daughter-set',
        legacySegment: 'mom-daughter-set',
        restoreStateKey: 'fromMomDaughterSetPage',
      }}
    />
  );
}
