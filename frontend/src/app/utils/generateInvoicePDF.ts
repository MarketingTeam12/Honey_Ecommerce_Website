import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface UploadedFile {
  name: string;
  type: string;
  size: number;
  data?: string;
  hasFile?: boolean;
}

interface OrderItem {
  id: string;
  name: string;
  basePrice: number;
  totalPrice: number;
  pageCount: number;
  uploadedFile?: UploadedFile | null;
  sourceLanguage?: string;
  targetLanguage?: string;
  documentType?: string;
  certificateType?: string;
}

interface Order {
  id: string;
  order_number: string;
  user_id: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  payment_method: string;
  payment_status: string;
  status: string;
  total_amount: string;
  subtotal: string;
  discount: string;
  tax: string;
  currency: string;
  items: OrderItem[];
  shipping_address?: {
    address1?: string;
    address2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  shipping_details?: {
    email?: string;
    address?: string;
  };
  shipping_method?: string;
  tracking_number?: string;
  shipping_carrier?: string;
  estimated_delivery?: string;
  shipped_at?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Generates a professional PDF invoice for an order
 * @param order - The order object containing all details
 * @returns Promise that resolves when PDF is generated and downloaded
 */
export async function generateInvoicePDF(order: Order): Promise<void> {
  try {
    // Create new PDF document
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Brand Color (Blue invoice theme to match the HTML invoice template)
    const brandColor: [number, number, number] = [36, 38, 100]; // #242664

    // ==================== HEADER ====================
    // Company Logo/Name
    doc.setFontSize(20);
    doc.setTextColor(...brandColor);
    doc.setFont('helvetica', 'bold');
    doc.text('HONEY UNIVERSAL DIGITAL PRIVATE LIMITED', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 8;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('Professional Translation & Apostille Services', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 5;
    doc.text('Email: salesteam@honeytranslations.com | Phone: +91 72990 05577', pageWidth / 2, yPosition, { align: 'center' });
    
    // Header line
    yPosition += 8;
    doc.setDrawColor(...brandColor);
    doc.setLineWidth(1);
    doc.line(15, yPosition, pageWidth - 15, yPosition);
    
    yPosition += 15;

    // ==================== INVOICE TITLE & INFO ====================
    doc.setFontSize(18);
    doc.setTextColor(...brandColor);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth - 15, yPosition, { align: 'right' });
    
    yPosition += 8;
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoice #: ${order.order_number}`, pageWidth - 15, yPosition, { align: 'right' });
    
    yPosition += 5;
    const invoiceDate = new Date(order.created_at).toLocaleDateString('en-IN', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
    doc.text(`Date: ${invoiceDate}`, pageWidth - 15, yPosition, { align: 'right' });
    
    yPosition += 5;
    doc.text(`Status: ${order.payment_status.toUpperCase()}`, pageWidth - 15, yPosition, { align: 'right' });
    
    // Reset position for customer details (below the INVOICE/Invoice#/Date/Status
    // block on the right, which ends around y=74 — starting here avoids the
    // two columns overlapping vertically)
    yPosition = 82;

    // ==================== CUSTOMER INFORMATION ====================
    doc.setFontSize(11);
    doc.setTextColor(...brandColor);
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', 15, yPosition);
    
    yPosition += 7;
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'bold');
    doc.text(order.customer_name || 'N/A', 15, yPosition);
    
    yPosition += 5;
    doc.setFont('helvetica', 'normal');
    if (order.customer_email) {
      doc.text(order.customer_email, 15, yPosition);
      yPosition += 5;
    }
    if (order.customer_phone) {
      doc.text(order.customer_phone, 15, yPosition);
      yPosition += 5;
    }
    
    // Shipping Address
    if (order.shipping_address) {
      const addr = order.shipping_address;
      if (addr.address1) {
        doc.text(addr.address1, 15, yPosition);
        yPosition += 5;
      }
      if (addr.address2) {
        doc.text(addr.address2, 15, yPosition);
        yPosition += 5;
      }
      const cityLine = [addr.city, addr.state, addr.postalCode].filter(Boolean).join(', ');
      if (cityLine) {
        doc.text(cityLine, 15, yPosition);
        yPosition += 5;
      }
      if (addr.country) {
        doc.text(addr.country, 15, yPosition);
        yPosition += 5;
      }
    }

    // ==================== PAYMENT & ORDER DETAILS ====================
    const detailsStartY = 82;
    doc.setFontSize(11);
    doc.setTextColor(...brandColor);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT DETAILS:', pageWidth / 2 + 10, detailsStartY);
    
    let detailsY = detailsStartY + 7;
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Method:', pageWidth / 2 + 10, detailsY);
    doc.setFont('helvetica', 'normal');
    doc.text(order.payment_method.toUpperCase(), pageWidth / 2 + 55, detailsY);
    detailsY += 5;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Status:', pageWidth / 2 + 10, detailsY);
    doc.setFont('helvetica', 'normal');
    doc.text(order.payment_status.toUpperCase(), pageWidth / 2 + 55, detailsY);
    detailsY += 5;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Order Status:', pageWidth / 2 + 10, detailsY);
    doc.setFont('helvetica', 'normal');
    doc.text(order.status.toUpperCase(), pageWidth / 2 + 55, detailsY);
    detailsY += 5;
    
    if (order.tracking_number) {
      doc.setFont('helvetica', 'bold');
      doc.text('Tracking #:', pageWidth / 2 + 10, detailsY);
      doc.setFont('helvetica', 'normal');
      doc.text(order.tracking_number, pageWidth / 2 + 55, detailsY);
      detailsY += 5;
    }

    yPosition = Math.max(yPosition, detailsY) + 10;

    // ==================== ORDER ITEMS TABLE ====================
    doc.setFontSize(11);
    doc.setTextColor(...brandColor);
    doc.setFont('helvetica', 'bold');
    doc.text('ORDER DETAILS:', 15, yPosition);
    yPosition += 2;

    // Prepare table data
    const tableData: any[] = [];

    const formatLanguagePair = (...languages: Array<string | undefined | null>) => {
      return languages
        .map((language) => String(language || '').trim())
        .filter(Boolean)
        .join(', ');
    };

    const resolveRate = (item: OrderItem) => {
      const directRate = parseFloat(String(item.basePrice ?? item.rate ?? 0));
      if (directRate > 0) return directRate;

      const quantity = parseInt(String(item.pageCount ?? item.quantity ?? 1), 10) || 1;
      const directAmount = parseFloat(String(item.totalPrice ?? item.amount ?? 0));
      if (directAmount > 0 && quantity > 0) {
        return directAmount / quantity;
      }

      return 0;
    };

    const resolveAmount = (item: OrderItem) => {
      const directAmount = parseFloat(String(item.totalPrice ?? item.amount ?? 0));
      if (directAmount > 0) return directAmount;

      const quantity = parseInt(String(item.pageCount ?? item.quantity ?? 1), 10) || 1;
      return resolveRate(item) * quantity;
    };

    order.items.forEach((item, index) => {
      // Main item row
      const itemName = item.name || `Item ${index + 1}`;
      const quantity = item.pageCount || 1;
      const rate = resolveRate(item);
      const amount = resolveAmount(item);
      const currency = 'Rs. ';
      
      tableData.push([
        itemName,
        quantity.toString(),
        `${currency}${rate.toFixed(2)}`,
        `${currency}${amount.toFixed(2)}`
      ]);
      
      // Add service details as sub-rows if available
      const details: string[] = [];
      const languagePair = formatLanguagePair(item.sourceLanguage, item.targetLanguage);
      if (languagePair) details.push(`Languages: ${languagePair}`);
      if (item.documentType) details.push(`Type: ${item.documentType}`);
      if (item.certificateType) details.push(`Certificate: ${item.certificateType}`);
      if (item.uploadedFile) details.push(`File: ${item.uploadedFile.name}`);
      
      if (details.length > 0) {
        tableData.push([
          { content: details.join(' • '), colSpan: 4, styles: { fontSize: 8, textColor: [100, 100, 100], fontStyle: 'italic' } }
        ]);
      }
    });

    // Generate table
    autoTable(doc, {
      startY: yPosition + 5,
      head: [['ITEM DESCRIPTION', 'QTY', 'RATE', 'AMOUNT']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: brandColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [60, 60, 60]
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 30, halign: 'right' },
        3: { cellWidth: 35, halign: 'right' }
      },
      margin: { left: 15, right: 15 }
    });

    // Get the final Y position after table
    yPosition = (doc as any).lastAutoTable.finalY + 10;

    // ==================== PRICE BREAKDOWN ====================
    const currency = 'Rs. ';
    const rightAlign = pageWidth - 15;
    const labelX = rightAlign - 60;
    const valueX = rightAlign;

    // Subtotal
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', labelX, yPosition, { align: 'right' });
    doc.text(`${currency}${parseFloat(order.subtotal).toFixed(2)}`, valueX, yPosition, { align: 'right' });
    yPosition += 6;

    // Discount (if applicable)
    if (parseFloat(order.discount) > 0) {
      doc.setTextColor(39, 174, 96); // Green color for discount
      doc.text('Discount:', labelX, yPosition, { align: 'right' });
      doc.text(`-${currency}${parseFloat(order.discount).toFixed(2)}`, valueX, yPosition, { align: 'right' });
      yPosition += 6;
      doc.setTextColor(60, 60, 60);
    }

    // Tax
    doc.text('Tax (18%):', labelX, yPosition, { align: 'right' });
    doc.text(`${currency}${parseFloat(order.tax).toFixed(2)}`, valueX, yPosition, { align: 'right' });
    yPosition += 8;

    // Draw line above total
    doc.setDrawColor(...brandColor);
    doc.setLineWidth(0.5);
    doc.line(labelX - 5, yPosition, valueX, yPosition);
    yPosition += 6;

    // Total
    doc.setFontSize(14);
    doc.setTextColor(...brandColor);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', labelX, yPosition, { align: 'right' });
    doc.text(`${currency}${parseFloat(order.total_amount).toFixed(2)}`, valueX, yPosition, { align: 'right' });

    // ==================== FOOTER ====================
    yPosition = pageHeight - 40;
    
    // Separator line
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(15, yPosition, pageWidth - 15, yPosition);
    yPosition += 8;

    // Thank you message
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    doc.setFont('helvetica', 'bold');
    doc.text('Thank you for your business!', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;

    // Contact info
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('For any queries, please contact us at salesteam@honeytranslations.com', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    // Computer generated notice
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text('This is a computer-generated invoice and does not require a signature.', pageWidth / 2, yPosition, { align: 'center' });

    // ==================== SAVE PDF ====================
    const fileName = `Invoice-${order.order_number}.pdf`;
    doc.save(fileName);

    console.log('✅ [PDF] Invoice generated successfully:', fileName);
  } catch (error) {
    console.error('❌ [PDF] Failed to generate invoice:', error);
    throw error;
  }
}