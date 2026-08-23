import Notification from "../models/Notification.js";
import { getMailer, EMAIL_FROM } from "../config/mail.js";
import { sendNotificationSMS } from "./sms.service.js";

const STATUS_LABELS = {
  CREATED: "Order Created",
  ASSIGNED: "Agent Assigned",
  PICKED_UP: "Package Picked Up",
  IN_TRANSIT: "In Transit",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  FAILED: "Delivery Failed",
  CANCELLED: "Order Cancelled",
};

export async function sendOrderStatusNotification(order, status, customer) {
  const subject = `${STATUS_LABELS[status] || "Status Update"} - ${order.orderId}`;
  const message = `Hello ${customer?.name || "Customer"},\n\nYour order ${order.orderId} status has been updated to: ${STATUS_LABELS[status] || status}.\n\nThank you for using SwiftKart Express.`;

  await sendEmail(customer?.email, subject, message, order, customer);
  await sendSMS(customer?.phone, message, order, customer);
}

async function sendEmail(to, subject, message, order, customer) {
  if (!to) return;
  const notif = await Notification.create({
    orderId: order?._id,
    customerId: customer?._id,
    type: "STATUS_UPDATE",
    channel: "EMAIL",
    subject,
    message,
    status: "PENDING",
  });

  try {
    const mailer = getMailer();
    await mailer.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      text: message,
    });
    notif.status = "SENT";
    notif.sentAt = new Date();
    await notif.save();
  } catch (err) {
    console.error("Email send failed (non-blocking):", err.message);
    notif.status = "FAILED";
    await notif.save();
  }
}

async function sendSMS(to, message, order, customer) {
  if (!to) return;
  const notif = await Notification.create({
    orderId: order?._id,
    customerId: customer?._id,
    type: "STATUS_UPDATE",
    channel: "SMS",
    message,
    status: "PENDING",
  });

  try {
    await sendNotificationSMS(to, message);
    notif.status = "SENT";
    notif.sentAt = new Date();
    await notif.save();
  } catch (err) {
    console.error("SMS send failed (non-blocking):", err.message);
    notif.status = "FAILED";
    await notif.save();
  }
}
