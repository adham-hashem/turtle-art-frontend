import ProductsByTypePage from './ProductsByTypePage';

export default function BagCharmPage() {
    return (
        <ProductsByTypePage
            config={{
                titleAr: 'تعليقة شنطة',
                subtitleAr: 'تعليقات شنط مميزة وأنيقة ✨',
                theme: 'default',
                legacySegment: 'bag-charm',
                restoreStateKey: 'fromBagCharmPage',
            }}
        />
    );
}
