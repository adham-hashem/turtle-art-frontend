import ProductsByTypePage from './ProductsByTypePage';

export default function SummerBagsPage() {
    return (
        <ProductsByTypePage
            config={{
                titleAr: 'شنط للصيف',
                subtitleAr: 'شنط صيفية عصرية ومريحة ☀️',
                theme: 'default',
                legacySegment: 'summer-bags',
                restoreStateKey: 'fromSummerBagsPage',
            }}
        />
    );
}
