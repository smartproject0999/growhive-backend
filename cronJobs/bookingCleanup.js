// const cron = require("node-cron");
// const Booking = require("../models/Booking");
// const CompletedBooking = require("../models/CompletedBooking");

// cron.schedule("*/1 * * * *", async () => { // every 1 minute (testing)
//   try {
//     const now = new Date();

//     // 🔒 ONLY bookings whose endDate is truly expired
//     const expiredBookings = await Booking.find({
//       endDate: { $lt: now },                // endDate passed
//       equipmentOwnerId: { $exists: true },  // valid data only
//       status: { $ne: "Completed" }          // not already processed
//     });

//     for (const booking of expiredBookings) {

//       // 🛑 Extra safety (hard check)
//       if (now <= new Date(booking.endDate)) {
//         continue; // skip if somehow not expired
//       }

//       // ✅ Move to CompletedBooking
//       await CompletedBooking.create({
//         equipmentId: booking.equipmentId,
//         userId: booking.userId,
//         equipmentOwnerId: booking.equipmentOwnerId,
//         startDate: booking.startDate,
//         endDate: booking.endDate,
//         totalPrice: booking.totalPrice,
//         paymentId: booking.paymentId,
//         paymentMethod: booking.paymentMethod,
//         paymentStatus: booking.paymentStatus,
//         completedAt: now
//       });

//       // ✅ Delete ONLY after successful insert
//       await Booking.findByIdAndDelete(booking._id);
//     }

//     if (expiredBookings.length > 0) {
//       console.log(
//         `[CRON] Moved ${expiredBookings.length} expired bookings to CompletedBooking`
//       );
//     }
//   } catch (err) {
//     console.error("[CRON] Booking cleanup error:", err.message);
//   }
// });


const cron = require("node-cron");
const Booking = require("../models/Booking");
const CompletedBooking = require("../models/CompletedBooking");

cron.schedule("*/1 * * * *", async () => { // every 1 minute (testing)
  try {
    const now = new Date();

    // 🔒 Fetch all bookings with endDate present
    const bookings = await Booking.find({
      equipmentOwnerId: { $exists: true },
      status: { $ne: "Completed" }
    });

    const expiredBookings = bookings.filter(booking => {
      const endDatePlusOneDay = new Date(booking.endDate);
      endDatePlusOneDay.setDate(endDatePlusOneDay.getDate() + 1);

      return now > endDatePlusOneDay; // ✅ endDate + 1 day passed
    });

    for (const booking of expiredBookings) {

      await CompletedBooking.create({
        equipmentId: booking.equipmentId,
        userId: booking.userId,
        equipmentOwnerId: booking.equipmentOwnerId,
        startDate: booking.startDate,
        endDate: booking.endDate,
        ownerEarning: booking.ownerEarning,
        totalPrice: booking.totalPrice,
        paymentId: booking.paymentId,
        paymentMethod: booking.paymentMethod,
        paymentStatus: booking.paymentStatus,
        completedAt: now
      });

      // ✅ delete only after successful move
      await Booking.findByIdAndDelete(booking._id);
    }

    if (expiredBookings.length > 0) {
      console.log(
        `[CRON] Moved ${expiredBookings.length} bookings to CompletedBooking (endDate + 1 day rule)`
      );
    }

  } catch (err) {
    console.error("[CRON] Booking cleanup error:", err.message);
  }
});
