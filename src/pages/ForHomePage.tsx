import ProductsByTypePage from './ProductsByTypePage';

export default function ForHomePage() {
    return (
        <ProductsByTypePage
            config={{
                titleAr: 'منتجات استخدام منزلي',
                subtitleAr: 'منتجات مميزة للاستخدام المنزلي 🏠',
                theme: 'default',
                legacySegment: 'for-home',
                restoreStateKey: 'fromForHomePage',
            }}
        />
    );
}
