import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
}

// Status translations
const statusTranslations: { [key: string]: string } = {
    'UnderReview': 'تحت المراجعة',
    'Confirmed': 'مؤكد',
    'Shipped': 'تم الشحن',
    'Delivered': 'تم التسليم',
    'Cancelled': 'ملغي',
    '0': 'تحت المراجعة',
    '1': 'مؤكد',
    '2': 'تم الشحن',
    '3': 'تم التسليم',
    '4': 'ملغي'
};

// Payment method translations
const paymentMethodTranslations: { [key: string]: string } = {
    'InstaPay': 'إنستاباي',
    'VodafoneCash': 'فودافون كاش',
    'OnlinePayment': 'دفع إلكتروني',
    '0': 'إنستاباي',
    '1': 'فودافون كاش',
    '2': 'دفع إلكتروني'
};

export const generateOrdersPDF = (orders: OrderForExport[], filterInfo?: string) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let currentY = 20;

    // Header
    doc.setFillColor(139, 115, 85);
    doc.rect(0, 0, pageWidth, 35, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Turtle Art - Orders Report', pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const exportDate = new Date().toLocaleDateString('en-US');
    doc.text(`Export Date: ${exportDate}`, pageWidth / 2, 25, { align: 'center' });

    if (filterInfo) {
        doc.setFontSize(8);
        doc.text(`Filters: ${filterInfo}`, pageWidth / 2, 31, { align: 'center' });
    }

    currentY = 45;

    // Process each order
    orders.forEach((order, orderIndex) => {
        // Check if we need a new page
        if (currentY > pageHeight - 60) {
            doc.addPage();
            currentY = 20;
        }

        // Order header
        doc.setFillColor(229, 220, 197);
        doc.roundedRect(10, currentY, pageWidth - 20, 10, 2, 2, 'F');

        doc.setTextColor(139, 115, 85);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Order: ${order.orderNumber}`, 15, currentY + 7);

        currentY += 15;

        // Customer info table
        const customerData = [
            ['Customer', order.fullName],
            ['Phone', order.phoneNumber],
            ['Address', order.address],
            ['Governorate', order.governorate]
        ];

        autoTable(doc, {
            startY: currentY,
            head: [],
            body: customerData,
            theme: 'plain',
            styles: {
                fontSize: 9,
                cellPadding: 2,
                textColor: [0, 0, 0]
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 30 },
                1: { cellWidth: 'auto' }
            },
            margin: { left: 15, right: 15 }
        });

        currentY = (doc as any).lastAutoTable.finalY + 5;

        // Items table
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(139, 115, 85);
        doc.text('Products:', 15, currentY);
        currentY += 5;

        const itemsData = order.items.map(item => {
            const itemTotal = item.priceAtPurchase * item.quantity;
            return [
                item.productName,
                item.quantity.toString(),
                `${item.priceAtPurchase.toFixed(2)} EGP`,
                `${itemTotal.toFixed(2)} EGP`,
                item.size || '-'
            ];
        });

        autoTable(doc, {
            startY: currentY,
            head: [['Product', 'Qty', 'Price', 'Total', 'Size']],
            body: itemsData,
            theme: 'striped',
            headStyles: {
                fillColor: [139, 115, 85],
                textColor: [255, 255, 255],
                fontSize: 9,
                fontStyle: 'bold'
            },
            styles: {
                fontSize: 8,
                cellPadding: 3
            },
            margin: { left: 15, right: 15 }
        });

        currentY = (doc as any).lastAutoTable.finalY + 8;

        // Order summary
        const statusText = statusTranslations[order.status] || order.status;
        const paymentText = paymentMethodTranslations[order.paymentMethod] || order.paymentMethod;
        const orderDate = new Date(order.date).toLocaleDateString('en-US');

        const summaryData = [
            ['Total', `${order.total.toFixed(2)} EGP`],
            ['Status', statusText],
            ['Payment', paymentText],
            ['Date', orderDate]
        ];

        autoTable(doc, {
            startY: currentY,
            head: [],
            body: summaryData,
            theme: 'plain',
            styles: {
                fontSize: 9,
                cellPadding: 2,
                textColor: [0, 0, 0]
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 30 },
                1: { cellWidth: 'auto', fontStyle: 'bold', textColor: [139, 115, 85] }
            },
            margin: { left: 15, right: 15 }
        });

        currentY = (doc as any).lastAutoTable.finalY + 5;

        // Customer notes (if any)
        if (order.customerNotes && order.customerNotes.length > 0) {
            if (currentY > pageHeight - 40) {
                doc.addPage();
                currentY = 20;
            }

            doc.setFillColor(255, 252, 240);
            const notesBoxHeight = 10 + (order.customerNotes.length * 8);
            doc.roundedRect(10, currentY, pageWidth - 20, notesBoxHeight, 2, 2, 'F');

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(139, 115, 85);
            doc.text('Customer Notes:', 15, currentY + 7);
            currentY += 12;

            doc.setFontSize(8);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(0, 0, 0);

            order.customerNotes.forEach(note => {
                const noteDate = new Date(note.createdAt).toLocaleDateString('en-US');
                const noteText = `- "${note.noteText}" (${noteDate})`;
                doc.text(noteText, 20, currentY, { maxWidth: pageWidth - 40 });
                currentY += 6;
            });

            currentY += 5;
        }

        // Separator between orders
        if (orderIndex < orders.length - 1) {
            currentY += 5;
            doc.setDrawColor(139, 115, 85);
            doc.setLineWidth(0.5);
            doc.line(40, currentY, pageWidth - 40, currentY);
            currentY += 10;
        }
    });

    // Add page numbers
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(
            `Page ${i} of ${pageCount}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        );
    }

    // Save the PDF
    const timestamp = new Date().toISOString().split('T')[0];
    doc.save(`Turtle_Art_Orders_${timestamp}.pdf`);
};
