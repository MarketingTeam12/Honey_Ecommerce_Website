/**
 * Wires the cancellation workflow to the real infrastructure (MySQL, Razorpay,
 * Resend, admin notifications, Puppeteer). Tests build the service directly
 * with fakes instead of requiring this module.
 */
const { pool } = require("../config/database");
const resend = require("../utils/resend");
const razorpayService = require("./razorpayService");
const siteData = require("./siteDataService");
const { createMysqlStore } = require("./cancellationRepository");
const { createCancellationService } = require("./cancellationService");
const { createCancellationEmails } = require("./cancellationEmails");
const { createCreditNoteService } = require("./creditNoteService");

const store = createMysqlStore(pool);

const cancellationService = createCancellationService({
  store,
  gateway: {
    fetchPayment: razorpayService.fetchPayment,
    createRefund: razorpayService.createRefund,
    listRefunds: razorpayService.listRefunds,
  },
  emails: createCancellationEmails({ resend }),
  notifier: {
    // Shows up in the admin bell alongside new-order notifications.
    notifyAdmin: ({ title, message, metadata }) =>
      siteData.saveNotification({ title, message, type: metadata?.type, metadata }),
  },
  creditNotes: createCreditNoteService({ store }),
});

module.exports = { cancellationService };
