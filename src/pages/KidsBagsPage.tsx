import React from 'react';
import ProductsByTypePage from './ProductsByTypePage';

export default function KidsBagsPage() {
  return (
    <ProductsByTypePage
      config={{
        titleAr: 'شنط أطفال',
        subtitleAr: 'شنط أطفال مميزة — اختيارات لطيفة وعملية.',
        theme: 'default',
        // Preferred query is not available in your controller, so we rely on legacySegment endpoint:
        queryKey: 'category',
        queryValue: 'kids-bags',
        legacySegment: 'kids-bags',
        restoreStateKey: 'fromKidsBagsPage',
      }}
    />
  );
}
