import html2pdf from 'html2pdf.js';

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

// Status translations to Arabic
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

// Payment method translations to Arabic
const paymentMethodTranslations: { [key: string]: string } = {
    'InstaPay': 'إنستاباي',
    'VodafoneCash': 'فودافون كاش',
    'OnlinePayment': 'دفع إلكتروني',
    '0': 'إنستاباي',
    '1': 'فودافون كاش',
    '2': 'دفع إلكتروني'
};

export const generateOrdersPDF = (orders: OrderForExport[], filterInfo?: string) => {
    // Create HTML content for the PDF
    const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
                
                * {
                    font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
                    box-sizing: border-box;
                }
                
                body {
                    margin: 0;
                    padding: 20px;
                    background: white;
                    color: #333;
                    direction: rtl;
                }
                
                .header {
                    background: linear-gradient(135deg, #8B7355 0%, #6B5845 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    border-radius: 10px;
                    margin-bottom: 30px;
                }
                
                .header h1 {
                    margin: 0 0 10px 0;
                    font-size: 32px;
                    font-weight: 700;
                }
                
                .header p {
                    margin: 5px 0;
                    font-size: 14px;
                    opacity: 0.95;
                }
                
                .order-card {
                    border: 2px solid #E5DCC5;
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 25px;
                    background: white;
                    page-break-inside: avoid;
                }
                
                .order-header {
                    background: #E5DCC5;
                    padding: 15px 20px;
                    border-radius: 8px;
                    margin: -20px -20px 20px -20px;
                }
                
                .order-number {
                    font-size: 20px;
                    font-weight: 700;
                    color: #8B7355;
                    margin: 0;
                }
                
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    font-size: 14px;
                }
                
                .info-label {
                    font-weight: 600;
                    color: #555;
                }
                
                .info-value {
                    color: #333;
                }
                
                .section-title {
                    font-size: 16px;
                    font-weight: 700;
                    color: #8B7355;
                    margin: 20px 0 10px 0;
                    padding-bottom: 8px;
                    border-bottom: 2px solid #E5DCC5;
                }
                
                .items-list {
                    list-style: none;
                    padding: 0;
                    margin: 10px 0;
                }
                
                .item {
                    padding: 10px;
                    background: #FAFAF8;
                    border-radius: 6px;
                    margin-bottom: 8px;
                    font-size: 13px;
                }
                
                .total-section {
                    background: #F5F5F0;
                    padding: 15px;
                    border-radius: 8px;
                    margin-top: 15px;
                }
                
                .total-amount {
                    font-size: 20px;
                    font-weight: 700;
                    color: #8B7355;
                    text-align: center;
                }
                
                .notes-section {
                    background: #FFFEF0;
                    border: 2px solid #F0E68C;
                    border-radius: 8px;
                    padding: 15px;
                    margin-top: 15px;
                }
                
                .note-item {
                    padding: 10px;
                    margin-bottom: 8px;
                    background: white;
                    border-radius: 6px;
                    border-right: 3px solid #8B7355;
                    font-size: 13px;
                }
                
                .note-date {
                    color: #888;
                    font-size: 11px;
                    margin-top: 5px;
                }
                
                .page-break {
                    page-break-after: always;
                }
                
                @media print {
                    body {
                        padding: 10px;
                    }
                    .order-card {
                        page-break-inside: avoid;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🐢 Turtle Art - تقرير الطلبات</h1>
                <p>تاريخ التصدير: ${new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                ${filterInfo ? `<p>الفلاتر المطبقة: ${filterInfo}</p>` : ''}
            </div>
            
            ${orders.map((order, index) => `
                <div class="order-card">
                    <div class="order-header">
                        <h2 class="order-number">طلب رقم: ${order.orderNumber}</h2>
                    </div>
                    
                    <div class="info-row">
                        <span class="info-label">اسم العميل:</span>
                        <span class="info-value">${order.fullName}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">رقم الهاتف:</span>
                        <span class="info-value">${order.phoneNumber}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">العنوان:</span>
                        <span class="info-value">${order.address}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">المحافظة:</span>
                        <span class="info-value">${order.governorate}</span>
                    </div>
                    
                    <h3 class="section-title">المنتجات</h3>
                    <ul class="items-list">
                        ${order.items.map(item => `
                            <li class="item">
                                <strong>${item.productName}</strong>
                                <br>
                                الكمية: ${item.quantity} × ${item.priceAtPurchase.toFixed(2)} جنيه = ${(item.quantity * item.priceAtPurchase).toFixed(2)} جنيه
                                ${item.size ? `<br>المقاس: ${item.size}` : ''}
                            </li>
                        `).join('')}
                    </ul>
                    
                    <div class="total-section">
                        <div class="total-amount">الإجمالي: ${order.total.toFixed(2)} جنيه</div>
                        <div class="info-row" style="margin-top: 10px;">
                            <span class="info-label">الحالة:</span>
                            <span class="info-value">${statusTranslations[order.status] || order.status}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">طريقة الدفع:</span>
                            <span class="info-value">${paymentMethodTranslations[order.paymentMethod] || order.paymentMethod}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">تاريخ الطلب:</span>
                            <span class="info-value">${new Date(order.date).toLocaleDateString('ar-EG')}</span>
                        </div>
                    </div>
                    
                    ${order.customerNotes && order.customerNotes.length > 0 ? `
                        <div class="notes-section">
                            <h3 class="section-title">📝 ملاحظات للعميل</h3>
                            ${order.customerNotes.map(note => `
                                <div class="note-item">
                                    ${note.noteText}
                                    <div class="note-date">${new Date(note.createdAt).toLocaleDateString('ar-EG')}</div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
                ${index < orders.length - 1 && (index + 1) % 2 === 0 ? '<div class="page-break"></div>' : ''}
            `).join('')}
        </body>
        </html>
    `;

    // Create a temporary container
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    // Configure html2pdf options
    const options = {
        margin: 10,
        filename: `Turtle_Art_Orders_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
        }
    };

    // Generate PDF
    html2pdf()
        .set(options)
        .from(container)
        .save()
        .then(() => {
            // Clean up
            document.body.removeChild(container);
        })
        .catch((error: Error) => {
            console.error('PDF generation error:', error);
            document.body.removeChild(container);
            alert('حدث خطأ أثناء إنشاء PDF. يرجى المحاولة مرة أخرى.');
        });
};
