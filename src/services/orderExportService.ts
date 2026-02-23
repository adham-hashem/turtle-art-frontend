import type { TDocumentDefinitions, Content, TableCell } from 'pdfmake/interfaces';

export interface OrderItemForExport {
    productName: string;
    quantity: number;
    priceAtPurchase: number;
    size?: string;
    selectedExtensions?: string;
}

export interface CustomerNoteForExport {
    noteText: string;
    createdAt: string;
}

export interface OrderForExport {
    orderNumber: string;
    fullName: string;
    phoneNumber: string;
    address: string;
    governorate: string;
    total: number;
    date: string;
    status: string;
    paymentMethod: string;
    items: OrderItemForExport[];
    customerNotes?: CustomerNoteForExport[];
    balanceDue?: number;
}

// Status translations
const statusTranslations: { [key: string]: string } = {
    'UnderReview': 'Under Review',
    'Confirmed': 'Confirmed',
    'Shipped': 'Shipped',
    'Delivered': 'Delivered',
    'Cancelled': 'Cancelled',
    '0': 'Under Review',
    '1': 'Confirmed',
    '2': 'Shipped',
    '3': 'Delivered',
    '4': 'Cancelled'
};

// Payment method translations
const paymentMethodTranslations: { [key: string]: string } = {
    'InstaPay': 'InstaPay',
    'VodafoneCash': 'Vodafone Cash',
    'OnlinePayment': 'Online Payment',
    '0': 'InstaPay',
    '1': 'Vodafone Cash',
    '2': 'Online Payment'
};

export const generateOrdersPDF = async (orders: OrderForExport[], filterInfo?: string) => {
    // Dynamically import pdfmake to avoid vfs issues
    const pdfMakeModule = await import('pdfmake/build/pdfmake');
    const pdfFontsModule = await import('pdfmake/build/vfs_fonts');

    const pdfMake = pdfMakeModule.default || pdfMakeModule;
    const pdfFonts = pdfFontsModule.default || pdfFontsModule;

    // Set fonts
    if (pdfFonts && pdfFonts.pdfMake) {
        pdfMake.vfs = pdfFonts.pdfMake.vfs;
    } else if (pdfFonts && pdfFonts.vfs) {
        pdfMake.vfs = pdfFonts.vfs;
    }

    const exportDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Build content array
    const content: Content[] = [];

    // Header
    content.push({
        text: 'Turtle Art - Orders Report',
        style: 'header',
        alignment: 'center',
        margin: [0, 0, 0, 5]
    });

    content.push({
        text: `Export Date: ${exportDate}`,
        style: 'subheader',
        alignment: 'center',
        margin: [0, 0, 0, 3]
    });

    if (filterInfo) {
        content.push({
            text: `Filters: ${filterInfo}`,
            fontSize: 9,
            color: '#666666',
            alignment: 'center',
            margin: [0, 0, 0, 20]
        });
    } else {
        content.push({ text: '', margin: [0, 0, 0, 15] });
    }

    // Process each order
    orders.forEach((order, index) => {
        // Order header
        content.push({
            text: `Order: ${order.orderNumber}`,
            style: 'orderHeader',
            margin: [0, index === 0 ? 0 : 15, 0, 10]
        });

        // Customer info table
        const customerTable: TableCell[][] = [
            [{ text: 'Customer:', bold: true }, { text: order.fullName }],
            [{ text: 'Phone:', bold: true }, { text: order.phoneNumber }],
            [{ text: 'Address:', bold: true }, { text: order.address }],
            [{ text: 'Governorate:', bold: true }, { text: order.governorate }]
        ];

        content.push({
            table: {
                widths: [80, '*'],
                body: customerTable
            },
            layout: 'noBorders',
            margin: [0, 0, 0, 10]
        });

        // Products section
        content.push({
            text: 'Products:',
            style: 'sectionTitle',
            margin: [0, 5, 0, 5]
        });

        // Products table
        const productsHeader: TableCell[] = [
            { text: 'Product', style: 'tableHeader' },
            { text: 'Qty', style: 'tableHeader', alignment: 'center' },
            { text: 'Price', style: 'tableHeader', alignment: 'right' },
            { text: 'Total', style: 'tableHeader', alignment: 'right' },
            { text: 'Size', style: 'tableHeader', alignment: 'center' }
        ];

        const productsBody: TableCell[][] = order.items.map(item => {
            const itemTotal = item.priceAtPurchase * item.quantity;
            return [
                { text: item.productName },
                { text: item.quantity.toString(), alignment: 'center' },
                { text: `${item.priceAtPurchase.toFixed(2)} EGP`, alignment: 'right' },
                { text: `${itemTotal.toFixed(2)} EGP`, alignment: 'right' },
                { text: item.size || '-', alignment: 'center' }
            ];
        });

        content.push({
            table: {
                headerRows: 1,
                widths: ['*', 40, 70, 70, 50],
                body: [productsHeader, ...productsBody]
            },
            layout: {
                fillColor: (rowIndex: number) => {
                    if (rowIndex === 0) return '#8B7355';
                    return rowIndex % 2 === 0 ? '#F5F5F0' : null;
                },
                hLineWidth: () => 0.5,
                vLineWidth: () => 0.5,
                hLineColor: () => '#E5DCC5',
                vLineColor: () => '#E5DCC5'
            },
            margin: [0, 0, 0, 10]
        });

        // Order summary
        const statusText = statusTranslations[order.status] || order.status;
        const paymentText = paymentMethodTranslations[order.paymentMethod] || order.paymentMethod;
        const orderDate = new Date(order.date).toLocaleDateString('en-US');

        const summaryTable: TableCell[][] = [
            [{ text: 'Total:', bold: true }, { text: `${order.total.toFixed(2)} EGP`, bold: true, color: '#8B7355' }],
            [{ text: 'Balance Due:', bold: true }, { text: `${(order.balanceDue || 0).toFixed(2)} EGP`, bold: true, color: (order.balanceDue || 0) > 0 ? '#cc0000' : '#0066cc' }],
            [{ text: 'Status:', bold: true }, { text: statusText }],
            [{ text: 'Payment:', bold: true }, { text: paymentText }],
            [{ text: 'Date:', bold: true }, { text: orderDate }]
        ];

        content.push({
            table: {
                widths: [80, '*'],
                body: summaryTable
            },
            layout: 'noBorders',
            margin: [0, 0, 0, 10]
        });

        // Customer notes (if any)
        if (order.customerNotes && order.customerNotes.length > 0) {
            content.push({
                text: 'Customer Notes:',
                style: 'sectionTitle',
                margin: [0, 5, 0, 5]
            });

            order.customerNotes.forEach(note => {
                const noteDate = new Date(note.createdAt).toLocaleDateString('en-US');
                content.push({
                    text: `"${note.noteText}" - ${noteDate}`,
                    fontSize: 9,
                    italics: true,
                    margin: [10, 2, 0, 2],
                    background: '#FFFEF0'
                });
            });
        }

        // Separator between orders
        if (index < orders.length - 1) {
            content.push({
                canvas: [{
                    type: 'line',
                    x1: 50,
                    y1: 10,
                    x2: 450,
                    y2: 10,
                    lineWidth: 1,
                    lineColor: '#8B7355'
                }],
                margin: [0, 10, 0, 5]
            });
        }
    });

    // Document definition
    const docDefinition: TDocumentDefinitions = {
        pageSize: 'A4',
        pageMargins: [40, 60, 40, 60],
        header: {
            columns: [
                {
                    text: 'Turtle Art',
                    alignment: 'left',
                    fontSize: 10,
                    color: '#8B7355',
                    margin: [40, 20, 0, 0]
                },
                {
                    text: exportDate,
                    alignment: 'right',
                    fontSize: 10,
                    color: '#888888',
                    margin: [0, 20, 40, 0]
                }
            ]
        },
        footer: (currentPage: number, pageCount: number) => ({
            text: `Page ${currentPage} of ${pageCount}`,
            alignment: 'center',
            fontSize: 9,
            color: '#888888',
            margin: [0, 20, 0, 0]
        }),
        content: content,
        styles: {
            header: {
                fontSize: 22,
                bold: true,
                color: '#8B7355'
            },
            subheader: {
                fontSize: 11,
                color: '#666666'
            },
            orderHeader: {
                fontSize: 14,
                bold: true,
                color: '#FFFFFF',
                fillColor: '#8B7355',
                margin: [10, 8, 10, 8]
            },
            sectionTitle: {
                fontSize: 11,
                bold: true,
                color: '#8B7355'
            },
            tableHeader: {
                bold: true,
                fontSize: 9,
                color: 'white'
            }
        },
        defaultStyle: {
            fontSize: 10,
            color: '#333333'
        }
    };

    // Generate and download PDF
    const timestamp = new Date().toISOString().split('T')[0];
    pdfMake.createPdf(docDefinition).download(`Turtle_Art_Orders_${timestamp}.pdf`);
};
