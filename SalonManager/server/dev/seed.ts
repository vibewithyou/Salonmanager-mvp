import { db } from '../db';
import {
  users,
  salons,
  services,
  stylists,
  workHours,
  absences,
  bookings,
} from '../../shared/schema';

export async function seedDemo() {
  // cleanup in reverse order of dependencies
  await db.delete(bookings);
  await db.delete(absences);
  await db.delete(workHours);
  await db.delete(stylists);
  await db.delete(services);
  await db.delete(salons);
  await db.delete(users);

  const salonList = [
    { name: 'BARBERS Freiberg', slug: 'barbers-freiberg', address: '09599 Freiberg, DE', lat: 50.9159, lng: 13.3422, email: 'barbers@salonmanager.app', phone: '+49 3521 123456' },
    { name: 'Haarschneiderei Freiberg', slug: 'haarschneiderei-freiberg', address: '09599 Freiberg, DE', lat: 50.913, lng: 13.3405, email: 'haarschneiderei@salonmanager.app', phone: '+49 3521 234567' },
    { name: 'KLIER Freiberg', slug: 'klier-freiberg', address: '09599 Freiberg, DE', lat: 50.9172, lng: 13.3387, email: 'klier@salonmanager.app', phone: '+49 3521 345678' },
  ];
  const insertedSalons = await Promise.all(
    salonList.map((s) =>
      db.insert(salons).values({
        name: s.name,
        slug: s.slug,
        address: s.address,
        lat: String(s.lat),
        lng: String(s.lng),
        phone: s.phone,
        email: s.email,
        openHoursJson: null,
      }).returning()
    )
  );

  const usersToCreate = [
    { firstName: 'Kunde', lastName: 'Demo', email: 'kunde.demo@salonmanager.app', role: 'customer' },
    { firstName: 'Martin', lastName: 'Pieske', email: 'martin.pieske@salonmanager.app', role: 'stylist' },
    { firstName: 'Rita', lastName: '', email: 'rita@salonmanager.app', role: 'stylist' },
    { firstName: 'Susi', lastName: '', email: 'susi@salonmanager.app', role: 'stylist' },
    { firstName: 'Rebekka', lastName: '', email: 'rebekka@salonmanager.app', role: 'stylist' },
    { firstName: 'Josie', lastName: '', email: 'josie@salonmanager.app', role: 'stylist' },
    { firstName: 'Tina', lastName: 'Kurz', email: 'tina.kurz@salonmanager.app', role: 'stylist' },
    { firstName: 'Marco', lastName: 'Lang', email: 'marco.lang@salonmanager.app', role: 'stylist' },
    { firstName: 'Anna', lastName: 'Weber', email: 'anna.weber@salonmanager.app', role: 'stylist' },
    { firstName: 'Lukas', lastName: 'Braun', email: 'lukas.braun@salonmanager.app', role: 'stylist' },
  ];
  const insertedUsers = await Promise.all(
    usersToCreate.map((u) =>
      db.insert(users).values({
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role as any,
      }).returning()
    )
  );

  const baseServices = [
    { title: 'Herrenhaarschnitt', durationMin: 60, priceCents: 6000, active: true },
    { title: 'Damenschnitt', durationMin: 60, priceCents: 6000, active: true },
    { title: 'Färben', durationMin: 60, priceCents: 6000, active: true },
  ];
  for (const salonRow of insertedSalons) {
    const salonId = salonRow[0].id;
    for (const svc of baseServices) {
      await db.insert(services).values({ ...svc, salonId });
    }
  }

  const getUserId = (email: string) => insertedUsers.flat().find((u) => u.email === email)!.id;
  const salonIdBarbers = insertedSalons[0][0].id;
  const salonIdHaar = insertedSalons[1][0].id;
  const salonIdKlier = insertedSalons[2][0].id;

  const stylistsToCreate = [
    { salonId: salonIdBarbers, userEmail: 'martin.pieske@salonmanager.app', displayName: 'Martin Pieske' },
    { salonId: salonIdBarbers, userEmail: 'rita@salonmanager.app', displayName: 'Rita' },
    { salonId: salonIdBarbers, userEmail: 'susi@salonmanager.app', displayName: 'Susi' },
    { salonId: salonIdBarbers, userEmail: 'rebekka@salonmanager.app', displayName: 'Rebekka' },
    { salonId: salonIdBarbers, userEmail: 'josie@salonmanager.app', displayName: 'Josie (Azubi)' },
    { salonId: salonIdHaar, userEmail: 'tina.kurz@salonmanager.app', displayName: 'Tina Kurz' },
    { salonId: salonIdHaar, userEmail: 'marco.lang@salonmanager.app', displayName: 'Marco Lang' },
    { salonId: salonIdKlier, userEmail: 'anna.weber@salonmanager.app', displayName: 'Anna Weber' },
    { salonId: salonIdKlier, userEmail: 'lukas.braun@salonmanager.app', displayName: 'Lukas Braun' },
  ];

  const insertedStylists = await Promise.all(
    stylistsToCreate.map((st) =>
      db.insert(stylists).values({
        salonId: st.salonId,
        userId: getUserId(st.userEmail),
        displayName: st.displayName,
        active: true,
      }).returning()
    )
  );

  const days = [
    { weekday: 1, start: '09:00', end: '18:00' },
    { weekday: 2, start: '09:00', end: '18:00' },
    { weekday: 3, start: '09:00', end: '18:00' },
    { weekday: 4, start: '09:00', end: '18:00' },
    { weekday: 5, start: '09:00', end: '18:00' },
    { weekday: 6, start: '10:00', end: '14:00' },
  ];
  for (const st of insertedStylists.flat()) {
    for (const d of days) {
      await db.insert(workHours).values({
        salonId: st.salonId,
        stylistId: st.id,
        weekday: d.weekday,
        startTime: d.start,
        endTime: d.end,
      });
    }
  }

  return { salons: insertedSalons.length, users: insertedUsers.length };
}
