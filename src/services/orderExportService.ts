import jsPDF from 'jspdf';
import 'jspdf-autotable';

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

    // Brand colors
    const primaryColor: [number, number, number] = [139, 115, 85]; // #8B7355
    const accentColor: [number, number, number] = [229, 220, 197]; // #E5DCC5
    const textColor: [number, number, number] = [0, 0, 0];

    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;

    // Helper function to add a new page
    const addNewPage = () => {
        doc.addPage();
        yPosition = 20;
        addPageFooter();
    };

    // Helper function to check if we need a new page
    const checkPageBreak = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - 30) {
            addNewPage();
            return true;
        }
        return false;
    };

    // Add page footer
    const addPageFooter = () => {
        const pageCount = (doc as any).internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.setTextColor(...textColor);
        doc.text(
            `Page ${pageCount}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        );
        doc.text(
            `Generated: ${new Date().toLocaleString('ar-EG')}`,
            pageWidth - margin,
            pageHeight - 10,
            { align: 'right' }
        );
    };

    // Add header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 35, 'F');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('🐢 Turtle Art - تصدير الطلبات', pageWidth / 2, 15, { align: 'center' });

    // Export date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const exportDate = new Date().toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    doc.text(`تاريخ التصدير: ${exportDate}`, pageWidth / 2, 25, { align: 'center' });

    // Filter info
    if (filterInfo) {
        doc.setFontSize(9);
        doc.text(`${filterInfo}`, pageWidth / 2, 31, { align: 'center' });
    }

    yPosition = 45;

    // Process each order
    orders.forEach((order, index) => {
        // Check if we need a new page for this order
        checkPageBreak(60);

        // Order header box
        doc.setFillColor(...accentColor);
        doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 12, 2, 2, 'F');

        // Order number
        doc.setTextColor(...primaryColor);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`طلب رقم: ${order.orderNumber}`, pageWidth - margin - 5, yPosition + 8, { align: 'right' });

        yPosition += 18;

        // Customer info section
        doc.setTextColor(...textColor);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        const customerInfo = [
            `العميل: ${order.fullName}`,
            `الهاتف: ${order.phoneNumber}`,
            `العنوان: ${order.address}`,
            `المحافظة: ${order.governorate}`
        ];

        customerInfo.forEach(info => {
            doc.text(info, pageWidth - margin - 5, yPosition, { align: 'right' });
            yPosition += 6;
        });

        yPosition += 3;

        // Divider line
        doc.setDrawColor(...accentColor);
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);

        yPosition += 8;

        // Items section
        doc.setFont('helvetica', 'bold');
        doc.text('المنتجات:', pageWidth - margin - 5, yPosition, { align: 'right' });
        yPosition += 6;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);

        order.items.forEach(item => {
            const itemTotal = item.priceAtPurchase * item.quantity;
            let itemText = `• ${item.productName} × ${item.quantity} @ ${item.priceAtPurchase} جنيه = ${itemTotal} جنيه`;

            if (item.size) {
                itemText += ` (المقاس: ${item.size})`;
            }

            doc.text(itemText, pageWidth - margin - 10, yPosition, { align: 'right' });
            yPosition += 5;
        });

        yPosition += 5;

        // Separator
        doc.setLineWidth(0.3);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 6;

        // Order totals and info
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`الإجمالي: ${order.total.toFixed(2)} جنيه`, pageWidth - margin - 5, yPosition, { align: 'right' });
        yPosition += 6;

        doc.setFont('helvetica', 'normal');
        const statusText = statusTranslations[order.status] || order.status;
        const paymentText = paymentMethodTranslations[order.paymentMethod] || order.paymentMethod;

        doc.text(`الحالة: ${statusText}`, pageWidth - margin - 5, yPosition, { align: 'right' });
        yPosition += 5;
        doc.text(`طريقة الدفع: ${paymentText}`, pageWidth - margin - 5, yPosition, { align: 'right' });
        yPosition += 5;

        const orderDate = new Date(order.date).toLocaleDateString('ar-EG');
        doc.text(`التاريخ: ${orderDate}`, pageWidth - margin - 5, yPosition, { align: 'right' });
        yPosition += 8;

        // Customer notes section (if any)
        if (order.customerNotes && order.customerNotes.length > 0) {
            checkPageBreak(30);

            doc.setFillColor(255, 252, 240); // Light yellow background
            const notesHeight = 8 + (order.customerNotes.length * 6);
            doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, notesHeight, 2, 2, 'F');

            doc.setTextColor(...primaryColor);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('📝 ملاحظات للعميل:', pageWidth - margin - 5, yPosition + 6, { align: 'right' });
            yPosition += 10;

            doc.setTextColor(...textColor);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');

            order.customerNotes.forEach(note => {
                const noteDate = new Date(note.createdAt).toLocaleDateString('ar-EG');
                const noteText = `• "${note.noteText}" (${noteDate})`;
                doc.text(noteText, pageWidth - margin - 10, yPosition, { align: 'right' });
                yPosition += 6;
            });

            yPosition += 5;
        }

        // Spacing between orders
        yPosition += 10;

        // Add separator between orders (except for last one)
        if (index < orders.length - 1) {
            checkPageBreak(15);
            doc.setDrawColor(...primaryColor);
            doc.setLineWidth(0.8);
            doc.line(margin + 40, yPosition, pageWidth - margin - 40, yPosition);
            yPosition += 15;
        }
    });

    // Add footer to all pages
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addPageFooter();
    }

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `Turtle_Art_Orders_${timestamp}.pdf`;

    // Download PDF
    doc.save(filename);
};
