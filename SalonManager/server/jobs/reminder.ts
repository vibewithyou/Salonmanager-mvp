import { db } from '../db';
import { sendMail, tplBookingStatusToCustomer } from '../mailer';
import { bookings as bookingsTable } from '@shared/schema';
import { eq, and, gt, lt } from 'drizzle-orm';

async function runReminder() {
  console.log('[reminder] job tick', new Date().toISOString());
  try {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const bookings = await db.query.bookings.findMany({
      where: (b, { and, eq, gt, lt }) => and(
        eq(b.status, 'confirmed'),
        eq(b.reminderSent, false),
        gt(b.startsAt, in24h),
        lt(b.startsAt, in25h)
      ),
      with: {
        salon: true,
        service: true,
        customer: true,
      }
    });

    for (const b of bookings) {
      if (!b.customer?.email) {
        console.log('[reminder] skip, no customer email', b.id);
        continue;
      }
      const date = new Date(b.startsAt).toLocaleDateString('de-DE');
      const time = new Date(b.startsAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

      const { html, text } = tplBookingStatusToCustomer({
        status: 'confirmed',
        serviceTitle: b.service?.title ?? 'Termin',
        date,
        time,
        salonName: b.salon?.name ?? 'Ihr Salon'
      });
      try {
        await sendMail({
          to: b.customer.email,
          subject: `Erinnerung: Ihr Termin morgen um ${time}`,
          html,
          text,
        });
        await db.update(bookingsTable)
          .set({ reminderSent: true })
          .where(eq(bookingsTable.id, b.id));
        console.log('[reminder] sent', b.id);
      } catch (err) {
        console.warn('[reminder] mail failed', b.id, err);
      }
    }
  } catch (err) {
    console.error('[reminder] job failed', err);
  }
}

setInterval(() => {
  const now = new Date();
  if (now.getMinutes() === 5) {
    runReminder();
  }
}, 60 * 1000);
