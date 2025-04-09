// /utils/invoiceservices.js

const PDFDocument = require("pdfkit");

const sendInvoiceEmail = async (order, user) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      let buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData); // ✅ Return the PDF buffer
      });

      const formatCurrency = (amount) => {
        return "Rs. " + amount.toLocaleString("en-IN", { minimumFractionDigits: 2 });
      };

      // === Invoice Content ===
      doc.fontSize(22).text("🧾 TechTrove Invoice", { align: "center" });
      doc.moveDown();

      doc.fontSize(12)
        .text(`📅 Date: ${new Date(order.createdAt).toLocaleDateString()}`)
        .text(`🆔 Order ID: ${order._id}`)
        .moveDown();

      doc.text(`👤 Customer: ${user.name}`)
        .text(`📧 Email: ${user.email}`)
        .text(`📞 Phone: ${order.phone}`)
        .text(`🏠 Address: ${order.shippingAddress}`)
        .text(`💳 Payment Method: ${order.paymentMethod}`)
        .moveDown();

      doc.fontSize(14).text("📦 Order Summary:", { underline: true });
      doc.moveDown(0.5);

      const tableTop = doc.y;
      const itemMargin = 20;

      doc.font("Helvetica-Bold").text("#", 50, tableTop);
      doc.text("Item", 80, tableTop);
      doc.text("Unit Price", 280, tableTop, { width: 90, align: "right" });
      doc.text("Qty", 380, tableTop, { width: 50, align: "right" });
      doc.text("Total", 450, tableTop, { width: 90, align: "right" });

      doc.font("Helvetica").moveDown(0.5);

      order.items.forEach((item, index) => {
        const y = tableTop + itemMargin * (index + 1);
        const itemTotal = item.price * item.quantity;

        doc.text(index + 1, 50, y);
        doc.text(item.name, 80, y);
        doc.text(formatCurrency(item.price), 280, y, { width: 90, align: "right" });
        doc.text(item.quantity.toString(), 380, y, { width: 50, align: "right" });
        doc.text(formatCurrency(itemTotal), 450, y, { width: 90, align: "right" });
      });

      const subtotal = order.totalPrice / 1.18;
      const tax = order.totalPrice - subtotal;

      doc.moveDown(2);
      doc.fontSize(12);
      doc.text(`Subtotal: ${formatCurrency(subtotal)}`, { align: "right" });
      doc.text(`Tax (18% GST): ${formatCurrency(tax)}`, { align: "right" });
      doc.text(`Shipping: ${formatCurrency(0)}`, { align: "right" });
      doc.font("Helvetica-Bold").text(`Grand Total: ${formatCurrency(order.totalPrice)}`, { align: "right" });

      doc.moveDown(2);
      doc.font("Helvetica-Oblique").fontSize(11).text("🧡 Thank you for shopping with TechTrove!", {
        align: "center",
      });

      doc.end();
    } catch (error) {
      console.error("❌ Error generating invoice:", error);
      reject(error);
    }
  });
};

module.exports = sendInvoiceEmail;
