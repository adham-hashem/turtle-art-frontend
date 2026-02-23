/**
 * Centralized mapping for Arabic color names to HEX values.
 * Colors requested: اوف وايت, اسود, ابيض, بينك, ازرق, دهبي, عسلي, بني, احمر, برجندي, فضي, فاميه, ميكس, فوشيا, بيبي بلو, زيتي.
 */
export const colorMap: Record<string, string> = {
    'اوف وايت': '#F5F5F0',
    'اسود': '#000000',
    'اببيض': '#FFFFFF', // Common typo in data sometimes? Let's add both
    'ابييض': '#FFFFFF',
    'ابيض': '#FFFFFF',
    'بينك': '#FFC0CB',
    'ازرق': '#0000FF',
    'دهبي': '#D4AF37',
    'عسلي': '#DAA520',
    'بني': '#8B4513',
    'احمر': '#FF0000',
    'برجندي': '#800020',
    'فضي': '#C0C0C0',
    'فاميه': '#4B4B4B', // Smoked/Dark Gray
    'ميكس': 'linear-gradient(45deg, #f093fb 0%, #f5576c 100%)',
    'فوشيا': '#FF00FF',
    'بيبي بلو': '#89CFF0',
    'زيتي': '#556B2F',
    'كحلي': '#000080',
    'رمادي': '#808080',
    'بيج': '#F5F5DC',
    'بستاج': '#93C572',
    'جنزاري': '#008080',
    'موف': '#9370DB',
    'نبيتي': '#800000',
    'سماوي': '#87CEEB',
    'ليموني': '#32CD32',
    'برتقالي': '#FFA500',
    'سيمون': '#FA8072',
    'كافيه': '#C19A6B',
    'خشب': '#A0522D'
};

export const getColorValue = (colorName: string): string => {
    const normalized = colorName.trim();
    return colorMap[normalized] || '#E5E7EB'; // Default gray if not found
};
