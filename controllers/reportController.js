import Room from "../models/Room.js";
import Reservation from "../models/Reservation.js";
import Payment from "../models/Payment.js";

const MONTH_NAMES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

const parseInteger = (value) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const buildMonthRange = (year, month) => {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { start, end, daysInMonth: lastDay };
};

export const getMonthlyReport = async (req, res) => {
  try {
    const year = parseInteger(req.query.year) ?? new Date().getUTCFullYear();
    const month = parseInteger(req.query.month) ?? new Date().getUTCMonth() + 1;

    if (!Number.isInteger(year) || year < 1900) {
      return res.status(400).json({ message: "El parámetro 'year' es inválido." });
    }

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return res.status(400).json({ message: "El parámetro 'month' debe estar entre 1 y 12." });
    }

    const { start, end, daysInMonth } = buildMonthRange(year, month);

    const [roomsCount, occupancyAggregation] = await Promise.all([
      Room.countDocuments(),
      Reservation.aggregate([
        {
          $match: {
            status: { $in: ["confirmed", "completed"] },
            checkIn: { $lt: end },
            checkOut: { $gt: start },
          },
        },
        {
          $project: {
            overlapStart: {
              $cond: [{ $gt: ["$checkIn", start] }, "$checkIn", start],
            },
            overlapEnd: {
              $cond: [{ $lt: ["$checkOut", end] }, "$checkOut", end],
            },
          },
        },
        {
          $project: {
            nights: {
              $cond: [
                { $gt: ["$overlapEnd", "$overlapStart"] },
                {
                  $dateDiff: {
                    startDate: "$overlapStart",
                    endDate: "$overlapEnd",
                    unit: "day",
                  },
                },
                0,
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalNightsBooked: { $sum: "$nights" },
          },
        },
      ]),
    ]);

    const totalNightsBooked = occupancyAggregation[0]?.totalNightsBooked ?? 0;
    const totalRoomNightsAvailable = roomsCount * daysInMonth;
    const occupancyRate =
      totalRoomNightsAvailable === 0
        ? 0
        : Number(((totalNightsBooked / totalRoomNightsAvailable) * 100).toFixed(2));

    const incomeAggregation = await Payment.aggregate([
      {
        $match: {
          paidAt: { $gte: start, $lt: end },
        },
      },
      {
        $lookup: {
          from: "reservations",
          localField: "reservation",
          foreignField: "_id",
          as: "reservation",
        },
      },
      { $unwind: "$reservation" },
      {
        $group: {
          _id: "$reservation.roomNumber",
          roomNumber: { $first: "$reservation.roomNumber" },
          totalIncome: { $sum: "$amount" },
          paymentsCount: { $sum: 1 },
        },
      },
      { $sort: { roomNumber: 1 } },
    ]);

    const totalIncome = incomeAggregation.reduce(
      (acc, item) => acc + (item.totalIncome ?? 0),
      0
    );

    const [totalReservations, cancelledReservations] = await Promise.all([
      Reservation.countDocuments({
        checkIn: { $gte: start, $lt: end },
      }),
      Reservation.countDocuments({
        checkIn: { $gte: start, $lt: end },
        status: "cancelled",
      }),
    ]);

    const cancellationRate =
      totalReservations === 0
        ? 0
        : Number(((cancelledReservations / totalReservations) * 100).toFixed(2));

    return res.status(200).json({
      period: {
        year,
        month,
        label: `${MONTH_NAMES[month - 1]} ${year}`,
        start: start.toISOString(),
        end: end.toISOString(),
        daysInMonth,
      },
      occupancy: {
        roomsCount,
        totalRoomNightsAvailable,
        totalNightsBooked,
        occupancyRate,
      },
      income: {
        totalIncome,
        byRoom: incomeAggregation.map((item) => ({
          roomNumber: item.roomNumber,
          totalIncome: item.totalIncome,
          paymentsCount: item.paymentsCount,
        })),
      },
      cancellations: {
        totalReservations,
        cancelledReservations,
        cancellationRate,
      },
    });
  } catch (error) {
    console.error("Error al generar reporte mensual:", error);
    return res.status(500).json({ message: "Error interno del servidor." });
  }
};
