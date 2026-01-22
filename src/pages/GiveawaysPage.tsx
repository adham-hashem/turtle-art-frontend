import React from 'react';
import ProductsByTypePage from './ProductsByTypePage';

export default function GiveawaysPage() {
  return (
    <ProductsByTypePage
      config={{
        titleAr: 'هدايا وتوزيعات',
        subtitleAr: 'توزيعات وهدايا مميزة — للمناسبات والاحتفالات.',
        theme: 'default',
        queryKey: 'category',
        queryValue: 'giveaways',
        legacySegment: 'giveaways',
        restoreStateKey: 'fromGiveawaysPage',
      }}
    />
  );
}
